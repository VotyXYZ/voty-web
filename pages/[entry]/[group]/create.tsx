import { zodResolver } from '@hookform/resolvers/zod'
import pMap from 'p-map'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import useSWR from 'swr'

import DidSelect from '../../../components/did-select'
import useRouterQuery from '../../../hooks/use-router-query'
import useAsync from '../../../hooks/use-async'
import useSignJson from '../../../hooks/use-sign-json'
import useWallet from '../../../hooks/use-wallet'
import { requiredCoinTypesOfNumberSets } from '../../../src/functions/number'
import { Proposal, proposalSchema } from '../../../src/schemas'
import { getCurrentSnapshot } from '../../../src/snapshot'
import Button from '../../../components/basic/button'
import TextInput from '../../../components/basic/text-input'
import Textarea from '../../../components/basic/textarea'
import Select from '../../../components/basic/select'
import { useEntryConfig, useRetrieve, useUpload } from '../../../hooks/use-api'
import { DataType } from '../../../src/constants'
import TextButton from '../../../components/basic/text-button'
import {
  Form,
  FormFooter,
  FormSection,
  FormItem,
} from '../../../components/basic/form'
import { Grid6, GridItem6 } from '../../../components/basic/grid'

export default function CreateProposalPage() {
  const {
    register,
    setValue,
    getValues,
    watch,
    handleSubmit: onSubmit,
    control,
    formState: { errors },
  } = useForm<Proposal>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { options: [''] },
  })
  const [query] = useRouterQuery<['entry', 'group']>()
  const { data: config } = useEntryConfig(query.entry)
  const { data: community } = useRetrieve(DataType.COMMUNITY, config?.community)
  const group = useMemo(
    () =>
      query.group ? community?.groups?.[parseInt(query.group)] : undefined,
    [community?.groups, query.group],
  )
  const handleOptionDelete = useCallback(
    (index: number) => {
      const options = getValues('options')?.filter((_, i) => i !== index)
      setValue('options', options && options.length > 0 ? options : [''])
    },
    [setValue, getValues],
  )
  useEffect(() => {
    if (!config?.community) {
      return
    }
    setValue('community', config?.community)
  }, [config?.community, setValue])
  useEffect(() => {
    if (!query.group) {
      return
    }
    setValue('group', parseInt(query.group))
  }, [query.group, setValue])
  const { data: coinTypesOfNumberSets } = useSWR(
    group?.permission.voting
      ? ['requiredCoinTypesOfNumberSets', group.permission.voting]
      : null,
    () => requiredCoinTypesOfNumberSets(group!.permission.voting!),
  )
  const { data: snapshots } = useSWR(
    coinTypesOfNumberSets ? ['snapshots', coinTypesOfNumberSets] : null,
    async () => {
      const snapshots = await pMap(coinTypesOfNumberSets!, getCurrentSnapshot, {
        concurrency: 5,
      })
      return snapshots.reduce((obj, snapshot, index) => {
        obj[coinTypesOfNumberSets![index]] = snapshot.toString()
        return obj
      }, {} as { [coinType: string]: string })
    },
  )
  useEffect(() => {
    if (snapshots) {
      setValue('snapshots', snapshots)
    }
  }, [setValue, snapshots])
  const [did, setDid] = useState('')
  const { account } = useWallet()
  const handleSignJson = useSignJson(did)
  const handleUpload = useUpload()
  const handleSubmit = useAsync(
    useCallback(
      async (json: Proposal) => {
        const signed = await handleSignJson(json)
        if (!signed) {
          throw new Error('signature failed')
        }
        await handleUpload(signed)
      },
      [handleUpload, handleSignJson],
    ),
  )

  return (
    <Form>
      <FormSection
        title="Proposal"
        description="Basic information of the proposal."
      >
        <Grid6>
          <GridItem6>
            <FormItem label="Title" error={errors.title?.message}>
              <TextInput
                {...register('title')}
                error={!!errors.title?.message}
              />
            </FormItem>
          </GridItem6>
          <GridItem6>
            <FormItem label="Body" error={errors.extension?.body?.message}>
              <Textarea
                {...register('extension.body')}
                error={!!errors.extension?.body?.message}
              />
            </FormItem>
          </GridItem6>
          <GridItem6>
            <FormItem label="Voting type" error={errors.voting_type?.message}>
              <Controller
                control={control}
                name="voting_type"
                render={({ field: { value, onChange } }) => (
                  <Select
                    options={proposalSchema.shape.voting_type.options}
                    value={value}
                    onChange={onChange}
                  />
                )}
              />
            </FormItem>
          </GridItem6>
          <GridItem6>
            <FormItem label="Options" error={errors.options?.message}>
              <ul
                role="list"
                className="mb-4 divide-y divide-gray-200 rounded-md border border-gray-200"
              >
                {watch('options')?.map((_, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between py-3 pl-3 pr-4 text-sm"
                  >
                    <div className="flex w-0 flex-1 items-center">
                      <span className="ml-2 w-0 flex-1 truncate">
                        <input
                          {...register(`options.${index}`)}
                          placeholder={`Option ${index + 1}`}
                          className="w-full outline-none"
                        />
                      </span>
                    </div>
                    <div className="ml-4 flex shrink-0 space-x-4">
                      <OptionDelete
                        index={index}
                        onDelete={handleOptionDelete}
                      />
                    </div>
                  </li>
                ))}
              </ul>
              <TextButton
                onClick={() => {
                  setValue('options', [...(watch('options') || []), ''])
                }}
              >
                Add
              </TextButton>
            </FormItem>
          </GridItem6>
        </Grid6>
      </FormSection>
      <FormFooter>
        <Button
          primary
          disabled={!did}
          onClick={onSubmit(handleSubmit.execute, console.error)}
          loading={handleSubmit.status === 'pending'}
        >
          Submit
        </Button>
        <DidSelect
          account={account}
          value={did}
          onChange={setDid}
          className="mr-4 w-48"
        />
      </FormFooter>
    </Form>
  )
}

function OptionDelete(props: {
  index: number
  onDelete: (index: number) => void
}) {
  const { onDelete } = props
  const handleDelete = useCallback(() => {
    onDelete(props.index)
  }, [onDelete, props.index])

  return <TextButton onClick={handleDelete}>Remove</TextButton>
}
