import { useMemo, useState } from 'react'
import Link from 'next/link'

import useRouterQuery from '../../../hooks/use-router-query'
import ProposalListItem from '../../../components/proposal-list-item'
import CommunityLayout from '../../../components/layouts/community'
import WorkgroupLayout from '../../../components/layouts/workgroup'
import Button from '../../../components/basic/button'
import Select from '../../../components/basic/select'
import { trpc } from '../../../utils/trpc'

export default function GroupIndexPage() {
  const query = useRouterQuery<['entry', 'workgroup']>()
  const { data: list } = trpc.proposal.list.useInfiniteQuery(query, {
    enabled: !!query.entry && !!query.workgroup,
  })
  const proposals = useMemo(
    () => list?.pages.flatMap(({ data }) => data),
    [list],
  )
  const [order, setOrder] = useState('All')

  return (
    <CommunityLayout>
      <WorkgroupLayout>
        <div className="sticky top-48 flex w-full justify-between border-b bg-white/80 py-6 backdrop-blur sm:pl-6">
          <Select
            options={['All', 'Active', 'Pending', 'Closed']}
            value={order}
            onChange={setOrder}
            className="w-36 shrink-0"
          />
          <Link href={`/${query.entry}/${query.workgroup}/create`}>
            <Button primary>New Proposal</Button>
          </Link>
        </div>
        <ul role="list" className="divide-y divide-gray-200">
          {proposals?.map((proposal) => (
            <li key={proposal.permalink}>
              {query.entry ? (
                <ProposalListItem entry={query.entry} value={proposal} />
              ) : null}
            </li>
          ))}
        </ul>
      </WorkgroupLayout>
    </CommunityLayout>
  )
}