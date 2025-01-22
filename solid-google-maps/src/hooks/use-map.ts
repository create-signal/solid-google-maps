import { Accessor, useContext } from 'solid-js'
import { APIProviderContext } from '../components/api-provider'
import { logErrorOnce } from '../libraries/errors'
import { GoogleMapsContext } from '../components/map/google-map-context'

/**
 * Retrieves a map-instance from the context. This is either an instance
 * identified by id or the parent map instance if no id is specified.
 * Returns null if neither can be found.
 */
export const useMap = (id: string | null = null): Accessor<google.maps.Map | null> => {
  const ctx = useContext(APIProviderContext)
  const mapCtx = useContext(GoogleMapsContext)

  if (ctx === null) {
    logErrorOnce(
      'useMap(): failed to retrieve APIProviderContext. ' +
        'Make sure that the <APIProvider> component exists and that the ' +
        'component you are calling `useMap()` from is a sibling of the ' +
        '<APIProvider>.',
    )

    return () => null
  }

  if (id !== null) return () => ctx.mapInstances()[id] || null

  if (mapCtx?.map) return mapCtx.map

  return () => ctx.mapInstances()['default'] || null

  /*const { mapInstances } = ctx

  // if an id is specified, the corresponding map or null is returned
  if (id !== null) return () => mapInstances()[id] || null

  // otherwise, return the closest ancestor
  if (map) return () => map

  // finally, return the default map instance
  return () => mapInstances()['default'] || null*/
}
