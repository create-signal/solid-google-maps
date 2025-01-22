import { ApiParams, GoogleMapsApiLoader } from '../libraries/google-maps-api-loader'
import { APILoadingStatus } from '../libraries/api-loading-status'
import {
  Accessor,
  Component,
  ParentProps,
  createContext,
  createEffect,
  createMemo,
  createSignal,
  on,
  splitProps,
} from 'solid-js'

type ImportLibraryFunction = typeof google.maps.importLibrary
type GoogleMapsLibrary = Awaited<ReturnType<ImportLibraryFunction>>
type LoadedLibraries = { [name: string]: GoogleMapsLibrary }

export interface APIProviderContextValue {
  status: Accessor<APILoadingStatus>
  loadedLibraries: Accessor<LoadedLibraries>
  importLibrary: typeof google.maps.importLibrary
  mapInstances: Accessor<Record<string, google.maps.Map>>
  addMapInstance: (map: google.maps.Map, id?: string) => void
  removeMapInstance: (id?: string) => void
  clearMapInstances: () => void
}

const DEFAULT_SOLUTION_CHANNEL = 'GMP_visgl_rgmlibrary_v1_default'

export const APIProviderContext = createContext<APIProviderContextValue | null>(null)

export type APIProviderProps = ParentProps<{
  /**
   * apiKey must be provided to load the Google Maps JavaScript API. To create an API key, see: https://developers.google.com/maps/documentation/javascript/get-api-key
   * Part of:
   */
  apiKey: string
  /**
   * A custom id to reference the script tag can be provided. The default is set to 'google-maps-api'
   * @default 'google-maps-api'
   */
  libraries?: Array<string>
  /**
   * A specific version of the Google Maps JavaScript API can be used.
   * Read more about versioning: https://developers.google.com/maps/documentation/javascript/versions
   * Part of: https://developers.google.com/maps/documentation/javascript/url-params
   */
  version?: string
  /**
   * Sets the map to a specific region.
   * Read more about localizing the Map: https://developers.google.com/maps/documentation/javascript/localization
   * Part of: https://developers.google.com/maps/documentation/javascript/url-params
   */
  region?: string
  /**
   * Use a specific language for the map.
   * Read more about localizing the Map: https://developers.google.com/maps/documentation/javascript/localization
   * Part of: https://developers.google.com/maps/documentation/javascript/url-params
   */
  language?: string
  /**
   * auth_referrer_policy can be set to 'origin'.
   * Part of: https://developers.google.com/maps/documentation/javascript/url-params
   */
  authReferrerPolicy?: string
  /**
   * To understand usage and ways to improve our solutions, Google includes the
   * `solution_channel` query parameter in API calls to gather information about
   * code usage. You may opt out at any time by setting this attribute to an
   * empty string. Read more in the
   * [documentation](https://developers.google.com/maps/reporting-and-monitoring/reporting#solutions-usage).
   */
  channel?: number
  /**
   * To track usage of Google Maps JavaScript API via numeric channels. The only acceptable channel values are numbers from 0-999.
   * Read more in the
   * [documentation](https://developers.google.com/maps/reporting-and-monitoring/reporting#usage-tracking-per-channel)
   */
  solutionChannel?: string
  /**
   * A function that can be used to execute code after the Google Maps JavaScript API has been loaded.
   */
  onLoad?: () => void
  /**
   * A function that will be called if there was an error when loading the Google Maps JavaScript API.
   */
  onError?: (error: unknown) => void
}>

/**
 * local hook to set up the map-instance management context.
 */
function useMapInstances() {
  const [mapInstances, setMapInstances] = createSignal<Record<string, google.maps.Map>>({})

  const addMapInstance = (mapInstance: google.maps.Map, id = 'default') => {
    setMapInstances((instances) => ({ ...instances, [id]: mapInstance }))
  }

  const removeMapInstance = (id = 'default') => {
    setMapInstances(({ [id]: _, ...remaining }) => remaining)
  }

  const clearMapInstances = () => {
    setMapInstances({})
  }

  return { mapInstances, addMapInstance, removeMapInstance, clearMapInstances }
}

/**
 * local hook to handle the loading of the maps API, returns the current loading status
 * @param props
 */
function useGoogleMapsApiLoader(p: APIProviderProps) {
  const [props, otherApiParams] = splitProps(p, ['apiKey', 'version', 'libraries', 'onLoad', 'onError'])

  const [status, setStatus] = createSignal<APILoadingStatus>(GoogleMapsApiLoader.loadingStatus)
  const [loadedLibraries, setLoadedLibrary] = createSignal<LoadedLibraries>({})

  const addLoadedLibrary = (action: { name: keyof LoadedLibraries; value: LoadedLibraries[string] }) => {
    setLoadedLibrary((loadedLibraries) =>
      loadedLibraries[action.name] ? loadedLibraries : { ...loadedLibraries, [action.name]: action.value },
    )
  }

  const librariesString = createMemo(() => props.libraries?.join(','))
  const serializedParams = createMemo(() =>
    JSON.stringify({ apiKey: props.apiKey, version: props.version, ...otherApiParams }),
  )

  const importLibrary: typeof google.maps.importLibrary = async (name: string) => {
    if (loadedLibraries()[name]) {
      return loadedLibraries()[name]!
    }

    if (!google.maps.importLibrary) {
      throw new Error(
        '[api-provider-internal] importLibrary was called before ' + 'google.maps.importLibrary was defined.',
      )
    }

    const res = await window.google.maps.importLibrary(name)
    addLoadedLibrary({ name, value: res })

    return res
  }

  createEffect(
    on(
      () => ({
        apiKey: props.apiKey,
        librariesString: librariesString(),
        serializedParams: serializedParams(),
      }),
      async () => {
        try {
          const params: ApiParams = { key: props.apiKey, ...otherApiParams }
          if (props.version) params.v = props.version
          if (librariesString.length > 0) params.libraries = librariesString()

          if (params.channel === undefined || params.channel < 0 || params.channel > 999) delete params.channel

          if (params.solutionChannel === undefined) params.solutionChannel = DEFAULT_SOLUTION_CHANNEL
          else if (params.solutionChannel === '') delete params.solutionChannel

          await GoogleMapsApiLoader.load(params, (status) => setStatus(status))

          for (const name of ['core', 'maps', ...(props.libraries || [])]) {
            await importLibrary(name)
          }

          if (props.onLoad) {
            props.onLoad()
          }
        } catch (error) {
          if (props.onError) {
            props.onError(error)
          } else {
            console.error('<ApiProvider> failed to load the Google Maps JavaScript API', error)
          }
        }
      },
    ),
  )

  return {
    status,
    loadedLibraries,
    importLibrary,
  }
}

/**
 * Component to wrap the components from this library and load the Google Maps JavaScript API
 */
export const APIProvider: Component<APIProviderProps> = (props) => {
  const [_, loaderProps] = splitProps(props, ['children'])

  const { mapInstances, addMapInstance, removeMapInstance, clearMapInstances } = useMapInstances()

  const { status, loadedLibraries, importLibrary } = useGoogleMapsApiLoader(loaderProps)

  const contextValue: APIProviderContextValue = {
    mapInstances,
    addMapInstance,
    removeMapInstance,
    clearMapInstances,
    status,
    loadedLibraries,
    importLibrary,
  }

  return <APIProviderContext.Provider value={contextValue}>{props.children}</APIProviderContext.Provider>
}
