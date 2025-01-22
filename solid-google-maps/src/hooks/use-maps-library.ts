import { Accessor, createEffect, createMemo, useContext } from 'solid-js'
import { APIProviderContext } from '../components/api-provider'
import { useApiIsLoaded } from './use-api-is-loaded'
import { on } from 'solid-js'

interface ApiLibraries {
  core: google.maps.CoreLibrary
  maps: google.maps.MapsLibrary
  places: google.maps.PlacesLibrary
  geocoding: google.maps.GeocodingLibrary
  routes: google.maps.RoutesLibrary
  marker: google.maps.MarkerLibrary
  geometry: google.maps.GeometryLibrary
  elevation: google.maps.ElevationLibrary
  streetView: google.maps.StreetViewLibrary
  journeySharing: google.maps.JourneySharingLibrary
  drawing: google.maps.DrawingLibrary
  visualization: google.maps.VisualizationLibrary
}

export function useMapsLibrary<K extends keyof ApiLibraries, V extends ApiLibraries[K]>(name: K): Accessor<V | null>

export function useMapsLibrary(name: string) {
  const apiIsLoaded = useApiIsLoaded()
  const ctx = useContext(APIProviderContext)

  createEffect(
    on(
      () => ({ apiIsLoaded: apiIsLoaded() }),
      () => {
        if (!apiIsLoaded || !ctx) return

        // Trigger loading the libraries via our proxy-method.
        // The returned promise is ignored, since importLibrary will update loadedLibraries
        // list in the context, triggering a re-render.
        void ctx.importLibrary(name)
      },
    ),
  )

  return createMemo(() => ctx?.loadedLibraries()[name] || null)
}
