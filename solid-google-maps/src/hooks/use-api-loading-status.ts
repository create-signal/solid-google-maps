import { Accessor, useContext } from 'solid-js'
import { APIProviderContext } from '../components/api-provider'
import { APILoadingStatus } from '../libraries/api-loading-status'

export function useApiLoadingStatus(): Accessor<APILoadingStatus> {
  return useContext(APIProviderContext)?.status || (() => APILoadingStatus.NOT_LOADED)
}
