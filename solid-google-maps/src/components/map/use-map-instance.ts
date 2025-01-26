import { MapProps } from '.'
import { APIProviderContextValue } from '../api-provider'

import { Accessor, createEffect, createMemo, createSignal, on, onCleanup, splitProps } from 'solid-js'
import { useApiIsLoaded } from '../../hooks/use-api-is-loaded'
import { CameraState, CameraStateRef, useTrackedCameraStateRef } from './use-tracked-camera-state-ref'

/**
 * Stores a stack of map-instances for each mapId. Whenever an
 * instance is used, it is removed from the stack while in use,
 * and returned to the stack when the component unmounts.
 * This allows us to correctly implement caching for multiple
 * maps om the same page, while reusing as much as possible.
 *
 * FIXME: while it should in theory be possible to reuse maps solely
 *   based on the mapId (as all other parameters can be changed at
 *   runtime), we don't yet have good enough tracking of options to
 *   reliably unset all the options that have been set.
 */
class CachedMapStack {
  static entries: { [key: string]: google.maps.Map[] } = {}

  static has(key: string) {
    return this.entries[key] && this.entries[key]!.length > 0
  }

  static pop(key: string) {
    if (!this.entries[key]) return null

    return this.entries[key]?.pop() || null
  }

  static push(key: string, value: google.maps.Map) {
    if (!this.entries[key]) this.entries[key] = []

    this.entries[key]!.push(value)
  }
}

/**
 * The main hook takes care of creating map-instances and registering them in
 * the api-provider context.
 * @return a tuple of the map-instance created (or null) and the callback
 *   ref that will be used to pass the map-container into this hook.
 * @internal
 */
export function useMapInstance(
  p: MapProps,
  context: APIProviderContextValue,
): readonly [
  map: Accessor<google.maps.Map | null>,
  containerRef: (ref: HTMLDivElement) => void,
  cameraStateRef: CameraStateRef,
] {
  const apiIsLoaded = useApiIsLoaded()
  const [map, setMap] = createSignal<google.maps.Map | null>(null)
  const [container, containerRef] = createSignal<HTMLDivElement>()

  const cameraStateRef = useTrackedCameraStateRef(map)

  const [props, mapOptions] = splitProps(p, [
    'id',
    'defaultBounds',
    'defaultCenter',
    'defaultZoom',
    'defaultHeading',
    'defaultTilt',
    'reuseMaps',
    'renderingType',
    'colorScheme',
  ])

  const hasZoom = () => mapOptions.zoom !== undefined || props.defaultZoom !== undefined
  const hasCenter = () => mapOptions.center !== undefined || props.defaultCenter !== undefined

  createEffect(() => {
    if (!props.defaultBounds && (!hasZoom() || !hasCenter())) {
      console.warn(
        '<Map> component is missing configuration. ' +
          'You have to provide zoom and center (via the `zoom`/`defaultZoom` and ' +
          '`center`/`defaultCenter` props) or specify the region to show using ' +
          '`defaultBounds`. See ' +
          'https://visgl.github.io/react-google-maps/docs/api-reference/components/map#required',
      )
    }
  })

  const [savedMapStateRef, setSavedMapStateRef] = createSignal<{
    mapId?: string | null
    cameraState: CameraState
  } | null>(null)

  const id = createMemo(() => props.id)
  const mapId = createMemo(() => mapOptions.mapId)
  const renderingType = createMemo(() => props.renderingType)
  const colorScheme = createMemo(() => props.colorScheme)

  // create the map instance and register it in the context
  createEffect(
    on(
      () => ({
        container: container(),
        apiIsLoaded: apiIsLoaded(),
        id: id(),
        mapId: mapId(),
        renderingType: renderingType(),
        colorScheme: colorScheme(),
      }),
      (config) => {
        if (!config.container || !config.apiIsLoaded) return

        const { addMapInstance, removeMapInstance } = context

        const mergedOptions = {
          ...mapOptions,
          center: mapOptions.center || props.defaultCenter,
          zoom: mapOptions.zoom || props.defaultZoom,
          heading: mapOptions.heading || props.defaultHeading,
          tilt: mapOptions.tilt || props.defaultTilt,
        }

        // note: colorScheme (upcoming feature) isn't yet in the typings, remove once that is fixed:
        const cacheKey = `${config.mapId || 'default'}:${config.renderingType || 'default'}:${
          config.colorScheme || 'LIGHT'
        }`

        let mapDiv: HTMLElement
        let map: google.maps.Map

        if (props.reuseMaps && CachedMapStack.has(cacheKey)) {
          map = CachedMapStack.pop(cacheKey) as google.maps.Map
          mapDiv = map.getDiv()

          config.container.appendChild(mapDiv)
          map.setOptions(mergedOptions)

          // detaching the element from the DOM lets the map fall back to its default
          // size, setting the center will trigger reloading the map.
          setTimeout(() => {
            const center = map.getCenter()
            if (center) map.setCenter(center)
          }, 0)
        } else {
          mapDiv = document.createElement('div')
          mapDiv.style.height = '100%'
          config.container.appendChild(mapDiv)

          map = new google.maps.Map(mapDiv, {
            ...mergedOptions,
            ...(config.renderingType ? { renderingType: config.renderingType as google.maps.RenderingType } : {}),
            ...(config.colorScheme ? { colorScheme: config.colorScheme as any } : {}),
          })
        }

        setMap(map)
        addMapInstance(map, config.id)

        if (props.defaultBounds) {
          const { padding, ...defBounds } = props.defaultBounds
          map.fitBounds(defBounds, padding)
        }

        // prevent map not rendering due to missing configuration
        else if (!hasZoom() || !hasCenter()) {
          map.fitBounds({ east: 180, west: -180, south: -90, north: 90 })
        }

        // the savedMapState is used to restore the camera parameters when the mapId is changed
        if (savedMapStateRef()) {
          const { mapId: savedMapId, cameraState: savedCameraState } = savedMapStateRef()!
          if (savedMapId !== config.mapId) {
            map.setOptions(savedCameraState)
          }
        }

        onCleanup(() => {
          setSavedMapStateRef({
            mapId: config.mapId,
            cameraState: cameraStateRef(),
          })

          // detach the map-div from the dom
          mapDiv.remove()

          if (props.reuseMaps) {
            // push back on the stack
            CachedMapStack.push(cacheKey, map)
          } else {
            // remove all event-listeners to minimize the possibility of memory-leaks
            google.maps.event.clearInstanceListeners(map)
          }

          setMap(null)
          removeMapInstance(config.id)
        })
      },
    ),
  )

  return [map, containerRef, cameraStateRef] as const
}
