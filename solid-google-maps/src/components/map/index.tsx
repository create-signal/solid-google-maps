import { APIProviderContext } from '../api-provider'

import {
  Accessor,
  Component,
  JSX,
  ParentProps,
  Show,
  createEffect,
  createMemo,
  onCleanup,
  splitProps,
  useContext,
} from 'solid-js'
import { useApiLoadingStatus } from '../../hooks/use-api-loading-status'
import { APILoadingStatus } from '../../libraries/api-loading-status'
import { toLatLngLiteral } from '../../libraries/lat-lng-utils'
import { AuthFailureMessage } from './auth-failure-message'
import { GoogleMapsContext } from './google-map-context'
import { DeckGlCompatProps, useDeckGLCameraUpdate } from './use-deckgl-camera-update'
import { useMapCameraParams } from './use-map-camera-params'
import { MapEventProps, useMapEvents } from './use-map-events'
import { useMapInstance } from './use-map-instance'
import { useMapOptions } from './use-map-options'

export type { MapCameraChangedEvent, MapEvent, MapEventProps, MapMouseEvent } from './use-map-events'

export type MapCameraProps = {
  center: google.maps.LatLngLiteral
  zoom: number
  heading?: number
  tilt?: number
}

// ColorScheme and RenderingType are redefined here to make them usable before the
// maps API has been fully loaded.

export const ColorScheme = {
  DARK: 'DARK',
  LIGHT: 'LIGHT',
  FOLLOW_SYSTEM: 'FOLLOW_SYSTEM',
} as const

export type ColorScheme = (typeof ColorScheme)[keyof typeof ColorScheme]

export const RenderingType = {
  VECTOR: 'VECTOR',
  RASTER: 'RASTER',
  UNINITIALIZED: 'UNINITIALIZED',
} as const

export type RenderingType = (typeof RenderingType)[keyof typeof RenderingType]

/**
 * Props for the Map Component
 */
export type MapProps = ParentProps<
  Omit<google.maps.MapOptions, 'renderingType' | 'colorScheme'> &
    MapEventProps &
    DeckGlCompatProps & {
      /**
       * An id for the map, this is required when multiple maps are present
       * in the same APIProvider context.
       */
      id?: string

      /**
       * Additional style rules to apply to the map dom-element.
       */
      style?: JSX.CSSProperties

      /**
       * Additional css class-name to apply to the element containing the map.
       */
      class?: string

      /**
       * The color-scheme to use for the map.
       */
      colorScheme?: ColorScheme

      /**
       * The rendering-type to be used.
       */
      renderingType?: RenderingType

      /**
       * Indicates that the map will be controlled externally. Disables all controls provided by the map itself.
       */
      controlled?: boolean

      /**
       * Enable caching of map-instances created by this component.
       */
      reuseMaps?: boolean

      defaultCenter?: google.maps.LatLngLiteral
      defaultZoom?: number
      defaultHeading?: number
      defaultTilt?: number
      /**
       * Alternative way to specify the default camera props as a geographic region that should be fully visible
       */
      defaultBounds?: google.maps.LatLngBoundsLiteral & {
        padding?: number | google.maps.Padding
      }
    }
>

export const Map: Component<MapProps> = (p) => {
  const context = useContext(APIProviderContext)
  const loadingStatus = useApiLoadingStatus()

  const [localProps, props] = splitProps(p, ['children', 'class', 'style'])

  if (!context) {
    throw new Error('<Map> can only be used inside an <ApiProvider> component.')
  }

  const [map, mapRef, cameraStateRef] = useMapInstance(props, context)

  useMapCameraParams(map, cameraStateRef, props)
  useMapEvents(map, props)
  useMapOptions(map, props)

  const isDeckGlControlled = useDeckGLCameraUpdate(map, props)
  const isControlledExternally = () => !!props.controlled

  // disable interactions with the map for externally controlled maps
  createEffect(() => {
    const ref = map()

    if (!ref) return

    // fixme: this doesn't seem to belong here (and it's mostly there for convenience anyway).
    //   The reasoning is that a deck.gl canvas will be put on top of the map, rendering
    //   any default map controls pretty much useless
    if (isDeckGlControlled()) {
      ref.setOptions({ disableDefaultUI: true })
    }

    // disable all control-inputs when the map is controlled externally
    if (isDeckGlControlled() || isControlledExternally()) {
      ref.setOptions({
        gestureHandling: 'none',
        keyboardShortcuts: false,
      })
    }

    onCleanup(() => {
      ref.setOptions({
        gestureHandling: props.gestureHandling,
        keyboardShortcuts: props.keyboardShortcuts,
      })
    })
  })

  // setup a stable cameraOptions object that can be used as dependency
  const center = () => (props.center ? toLatLngLiteral(props.center) : null)
  const latLng = createMemo(() => {
    let lat: number | null = null
    let lng: number | null = null
    if (center() && Number.isFinite(center()!.lat) && Number.isFinite(center()!.lng)) {
      lat = center()!.lat
      lng = center()!.lng
    }

    return { lat, lng }
  })

  const cameraOptions: Accessor<google.maps.CameraOptions> = createMemo(() => {
    return {
      center: { lat: latLng().lat ?? 0, lng: latLng().lng ?? 0 },
      zoom: props.zoom ?? 0,
      heading: props.heading ?? 0,
      tilt: props.tilt ?? 0,
    }
  })

  // externally controlled mode: reject all camera changes that don't correspond to changes in props
  createEffect(() => {
    const ref = map()
    if (!ref || !isControlledExternally()) return

    ref.moveCamera(cameraOptions())
    const listener = ref.addListener('bounds_changed', () => {
      ref.moveCamera(cameraOptions())
    })

    onCleanup(() => listener.remove())
  })

  const combinedStyle: Accessor<JSX.CSSProperties> = createMemo(() => ({
    width: '100%',
    height: '100%',
    position: 'relative' as const,
    // when using deckgl, the map should be sent to the back
    'z-index': isDeckGlControlled() ? -1 : 0,

    ...localProps.style,
  }))

  return (
    <Show
      when={loadingStatus() === APILoadingStatus.AUTH_FAILURE}
      fallback={
        <GoogleMapsContext.Provider value={{ map }}>
          <div
            ref={mapRef}
            data-testid={'map'}
            style={localProps.class ? undefined : combinedStyle()}
            class={localProps.class}
            {...(props.id ? { id: props.id } : {})}
          />
          <Show when={map()}>{localProps.children}</Show>
        </GoogleMapsContext.Provider>
      }
    >
      <div style={{ position: 'relative', ...(localProps.class ? {} : combinedStyle()) }} class={localProps.class}>
        <AuthFailureMessage />
      </div>
    </Show>
  )
}

// The deckGLViewProps flag here indicates to deck.gl that the Map component is
// able to handle viewProps from deck.gl when deck.gl is used to control the map.
;(Map as any).deckGLViewProps = true
