import { TRPCError } from '@trpc/server'
import { compact, keyBy, last, mapValues } from 'lodash-es'
import { z } from 'zod'

import { uploadToArweave } from '../../utils/upload'
import { database } from '../../utils/database'
import { authorized } from '../../utils/schemas/authorship'
import { voteSchema } from '../../utils/schemas/vote'
import verifyVote from '../../utils/verifiers/verify-vote'
import { powerOfChoice } from '../../utils/voting'
import { procedure, router } from '../trpc'
import { proved } from '../../utils/schemas/proof'
import verifySnapshot from '../../utils/verifiers/verify-snapshot'
import verifyAuthorshipProof from '../../utils/verifiers/verify-authorship-proof'

const textDecoder = new TextDecoder()

const schema = proved(authorized(voteSchema))

export const voteRouter = router({
  list: procedure
    .input(
      z.object({
        proposal: z.string().optional(),
        cursor: z.string().optional(),
      }),
    )
    .output(
      z.object({
        data: z.array(schema.extend({ permalink: z.string() })),
        next: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      if (!input.proposal) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }
      const votes = await database.vote.findMany({
        cursor: input.cursor ? { permalink: input.cursor } : undefined,
        where: { proposal: input.proposal },
        take: 50,
        orderBy: { ts: 'desc' },
      })
      return {
        data: compact(
          votes.map(({ permalink, data }) => {
            try {
              return {
                permalink,
                ...schema.parse(JSON.parse(textDecoder.decode(data))),
              }
            } catch {
              return
            }
          }),
        ),
        next: last(votes)?.permalink,
      }
    }),
  groupByProposal: procedure
    .input(
      z.object({
        proposal: z.string().optional(),
        authors: z.array(z.string()).optional(),
      }),
    )
    .output(z.record(z.string(), z.number()))
    .query(async ({ input }) => {
      if (!input.proposal || !input.authors) {
        throw new TRPCError({ code: 'BAD_REQUEST' })
      }
      const votes = await database.vote.findMany({
        where: {
          proposal: input.proposal,
          author: { in: input.authors },
        },
      })
      return mapValues(
        keyBy(votes, ({ author }) => author),
        ({ data }) => schema.parse(JSON.parse(textDecoder.decode(data))).power,
      )
    }),
  create: procedure
    .input(schema)
    .output(z.string())
    .mutation(async ({ input }) => {
      await verifySnapshot(input.authorship)
      await verifyAuthorshipProof(input)
      const { proposal, community } = await verifyVote(input)
      const { permalink, data } = await uploadToArweave(input)
      const ts = new Date()

      await database.$transaction([
        database.vote.create({
          data: {
            permalink,
            ts,
            author: input.authorship.author,
            community: proposal.community,
            workgroup: proposal.workgroup,
            proposal: input.proposal,
            data,
          },
        }),
        database.proposal.update({
          where: { permalink: input.proposal },
          data: { votes: { increment: 1 } },
        }),
        database.entry.update({
          where: { did: community.authorship.author },
          data: { votes: { increment: 1 } },
        }),
        ...Object.entries(
          powerOfChoice(proposal.voting_type, input.choice, input.power),
        ).map(([option, power = 0]) =>
          database.choice.upsert({
            where: {
              proposal_option: { proposal: input.proposal, option },
            },
            create: {
              proposal: input.proposal,
              option,
              power,
            },
            update: {
              power: { increment: power },
            },
          }),
        ),
      ])

      return permalink
    }),
})

export type VoteRouter = typeof voteRouter
