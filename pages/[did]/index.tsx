import Link from 'next/link'
import clsx from 'clsx'

import Avatar from '../../components/basic/avatar'
import useArweaveData from '../../hooks/use-arweave-data'
import useDidConfig from '../../hooks/use-did-config'
import {
  organizationWithSignatureSchema,
  ProposalWithSignature,
} from '../../src/schemas'
import useRouterQuery from '../../hooks/use-router-query'
import { useList } from '../../hooks/use-api'
import { DataType } from '../../src/constants'
import Button from '../../components/basic/button'
import { DiscordIcon, GitHubIcon, TwitterIcon } from '../../components/icons'

export default function OrganizationIndexPage() {
  const [query] = useRouterQuery<['did', 'workgroup']>()
  const { data: config } = useDidConfig(query.did)
  const { data: organization } = useArweaveData(
    organizationWithSignatureSchema,
    config?.organization,
  )
  const { data: proposals } = useList<ProposalWithSignature>(
    DataType.PROPOSAL,
    [['did', query.did]],
  )

  return organization ? (
    <main className="flex flex-1 overflow-hidden">
      <aside className="hidden lg:order-first lg:block lg:flex-shrink-0">
        <div className="relative flex h-full w-96 flex-col overflow-y-auto border-r border-gray-200 bg-white">
          <div className="m-8 mb-0 flex items-start">
            <Avatar
              size={16}
              name={organization.did}
              value={organization.profile.avatar}
            />
            <div className="ml-4">
              <h3 className="text-xl font-bold text-gray-900 sm:text-2xl">
                {organization.profile.name}
              </h3>
              <p className="text-sm text-gray-500">
                {organization.profile.about}
              </p>
            </div>
          </div>
          <div className="flex space-x-4 mx-8 my-4">
            {organization.social?.twitter ? (
              <a
                href={`https://twitter.com/${organization.social.twitter}`}
                className="text-gray-400 hover:text-gray-500"
              >
                <TwitterIcon className="w-6 h-6" />
              </a>
            ) : null}
            {organization.social?.discord ? (
              <a
                href={`https://discord.com/invite/${organization.social.discord}`}
                className="text-gray-400 hover:text-gray-500"
              >
                <DiscordIcon className="w-6 h-6" />
              </a>
            ) : null}
            {organization.social?.github ? (
              <a
                href={`https://github.com/${organization.social.github}`}
                className="text-gray-400 hover:text-gray-500"
              >
                <GitHubIcon className="w-6 h-6" />
              </a>
            ) : null}
          </div>
          <div className="flex space-x-4 mx-8">
            <Link href={`/${organization.did}/settings`}>
              <Button>Settings</Button>
            </Link>
          </div>
          <ul role="list" className="mt-4 divide-y divide-gray-200">
            <li
              className={clsx(
                'relative py-5 px-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600',
                !query.workgroup
                  ? 'bg-gray-100 hover:bg-gray-200'
                  : 'bg-white hover:bg-gray-50',
              )}
            >
              <div className="flex justify-between space-x-3">
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/${organization.did}`}
                    className="block focus:outline-none"
                  >
                    <span className="absolute inset-0" aria-hidden="true" />
                    <p className="truncate text-sm font-medium text-gray-900">
                      All Proposals
                    </p>
                  </Link>
                </div>
              </div>
            </li>
            {organization.workgroups?.map((workgroup) => (
              <li
                key={workgroup.id}
                className={clsx(
                  'relative py-5 px-8 focus-within:ring-2 focus-within:ring-inset focus-within:ring-indigo-600',
                  workgroup.id === query.workgroup
                    ? 'bg-gray-100 hover:bg-gray-200'
                    : 'bg-white hover:bg-gray-50',
                )}
              >
                <div className="flex justify-between space-x-3">
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/${organization.did}?workgroup=${workgroup.id}`}
                      className="block focus:outline-none"
                    >
                      <span className="absolute inset-0" aria-hidden="true" />
                      <p className="truncate text-sm font-medium text-gray-900">
                        {workgroup.profile.name}
                      </p>
                    </Link>
                  </div>
                  {/* <time
                    dateTime={workgroup.datetime}
                    className="flex-shrink-0 whitespace-nowrap text-sm text-gray-500"
                  >
                    {workgroup.time}
                  </time> */}
                </div>
                <div className="mt-1">
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {workgroup.profile.about}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </aside>
      <section
        aria-labelledby="primary-heading"
        className="flex h-full min-w-0 flex-1 flex-col overflow-y-auto lg:order-last"
      >
        <h1 id="primary-heading" className="sr-only">
          Account
        </h1>
        {null}
      </section>
    </main>
  ) : null
}
