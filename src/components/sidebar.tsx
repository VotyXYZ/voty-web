import { PlusIcon } from '@heroicons/react/20/solid'
import clsx from 'clsx'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useId } from 'react'

const Tooltip = dynamic(
  () => import('react-tooltip').then(({ Tooltip }) => Tooltip),
  { ssr: false },
)

const SubscriptionList = dynamic(() => import('./subscription-list'), {
  ssr: false,
})

export default function Sidebar(props: { className?: string }) {
  const id = useId()

  return (
    <aside className={clsx('pt-18', props.className)}>
      <SubscriptionList />
      <Link
        href="/create"
        data-tooltip-id={id}
        data-tooltip-place="right"
        className="group mt-2 mb-3 flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gray-200 hover:bg-primary-600"
      >
        <PlusIcon className="h-8 w-8 text-primary-600 group-hover:text-white" />
      </Link>
      <Tooltip id={id} className="rounded">
        Create community
      </Tooltip>
    </aside>
  )
}
