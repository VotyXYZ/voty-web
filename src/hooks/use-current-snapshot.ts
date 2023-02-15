import { useQuery } from '@tanstack/react-query'

import { getCurrentSnapshot } from '../utils/snapshot'

export default function useCurrentSnapshot(coinType?: number) {
  return useQuery(
    ['current snapshot', coinType],
    () => {
      return getCurrentSnapshot(coinType!)
    },
    { enabled: coinType !== undefined },
  )
}