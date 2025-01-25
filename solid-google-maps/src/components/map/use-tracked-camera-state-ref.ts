import { Accessor, Setter, createEffect, createSignal, on, onCleanup } from 'solid-js'

export type CameraState = {
  center: google.maps.LatLngLiteral
  heading: number
  tilt: number
  zoom: number
}

export type CameraStateRef = Accessor<CameraState>

function handleBoundsChange(map: google.maps.Map, ref: Setter<CameraState>) {
  const center = map.getCenter()
  const zoom = map.getZoom()
  const heading = map.getHeading() || 0
  const tilt = map.getTilt() || 0
  const bounds = map.getBounds()

  if (!center || !bounds || !Number.isFinite(zoom)) {
    console.warn(
      '[useTrackedCameraState] at least one of the values from the map ' +
        'returned undefined. This is not expected to happen. Please ' +
        'report an issue at https://github.com/visgl/react-google-maps/issues/new',
    )
  }

  // fixme: do we need the `undefined` cases for the camera-params? When are they used in the maps API?
  ref((state) => ({
    ...state,
    center: center?.toJSON() || { lat: 0, lng: 0 },
    zoom: (zoom as number) || 0,
    heading: heading,
    tilt: tilt,
  }))
}

/**
 * Creates a mutable ref object to track the last known state of the map camera.
 * This is used in `useMapCameraParams` to reduce stuttering in normal operation
 * by avoiding updates of the map camera with values that have already been processed.
 */
export function useTrackedCameraStateRef(map: Accessor<google.maps.Map | null>): CameraStateRef {
  const [ref, setRef] = createSignal<CameraState>({
    center: { lat: 0, lng: 0 },
    heading: 0,
    tilt: 0,
    zoom: 0,
  })

  // Record camera state with every bounds_changed event dispatched by the map.
  // This data is used to prevent feeding these values back to the
  // map-instance when a typical "controlled component" setup (state variable is
  // fed into and updated by the map).
  createEffect(
    on(
      () => ({ map: map() }),
      ({ map }) => {
        if (!map) return

        const listener = google.maps.event.addListener(map, 'bounds_changed', () => {
          handleBoundsChange(map, setRef)

          // When an event is occured, we have to update during the next cycle.
          // The application could decide to ignore the event and not update any
          // camera props of the map, meaning that in that case we will have to
          // 'undo' the change to the camera.
          //forceUpdate()
        })

        onCleanup(() => listener.remove())
      },
    ),
  )

  return ref
}
