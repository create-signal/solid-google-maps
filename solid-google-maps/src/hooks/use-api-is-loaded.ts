import { useApiLoadingStatus } from './use-api-loading-status'
import { APILoadingStatus } from '../libraries/api-loading-status'
import { Accessor } from 'solid-js'
/**
 * Hook to check if the Maps JavaScript API is loaded
 */
export function useApiIsLoaded(): Accessor<boolean> {
  const status = useApiLoadingStatus()

  return () => status() === APILoadingStatus.LOADED
}
