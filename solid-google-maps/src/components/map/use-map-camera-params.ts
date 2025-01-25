import { Accessor, createEffect, createMemo, on, onCleanup } from 'solid-js'
import { MapProps } from '.'
import { toLatLngLiteral } from '../../libraries/lat-lng-utils'
import { CameraStateRef } from './use-tracked-camera-state-ref'

export function useMapCameraParams(
  map: Accessor<google.maps.Map | null>,
  cameraStateRef: CameraStateRef,
  mapProps: MapProps,
) {
  const center = createMemo(() => (mapProps.center ? toLatLngLiteral(mapProps.center) : null))

  const latLng = createMemo(() => {
    let lat: number | null = null
    let lng: number | null = null

    if (center() && Number.isFinite(center()!.lat) && Number.isFinite(center()!.lng)) {
      lat = center()!.lat
      lng = center()!.lng
    }

    return { lat, lng }
  })

  const zoom: Accessor<number | null> = createMemo(() =>
    Number.isFinite(mapProps.zoom) ? (mapProps.zoom as number) : null,
  )
  const heading: Accessor<number | null> = createMemo(() =>
    Number.isFinite(mapProps.heading) ? (mapProps.heading as number) : null,
  )
  const tilt: Accessor<number | null> = createMemo(() =>
    Number.isFinite(mapProps.tilt) ? (mapProps.tilt as number) : null,
  )

  let timeout: ReturnType<typeof setTimeout> | null = null

  // the following effect runs for every render of the map component and checks
  // if there are differences between the known state of the map instance
  // (cameraStateRef, which is updated by all bounds_changed events) and the
  // desired state in the props.
  createEffect(
    on(
      () => ({
        map: map(),
        cameraState: cameraStateRef(),
        latLng: latLng(),
        zoom: zoom(),
        heading: heading(),
        tilt: tilt(),
      }),
      ({ map }) => {
        if (!map) return

        // Timeout gives cameraStateRef a chance to update before we check it
        timeout = setTimeout(() => {
          const nextCamera: google.maps.CameraOptions = {}
          let needsUpdate = false

          if (
            latLng().lat !== null &&
            latLng().lng !== null &&
            (cameraStateRef().center.lat !== latLng().lat || cameraStateRef().center.lng !== latLng().lng)
          ) {
            nextCamera.center = { lat: latLng().lat!, lng: latLng().lng! }
            needsUpdate = true
          }

          if (zoom() !== null && cameraStateRef().zoom !== zoom()) {
            nextCamera.zoom = zoom() as number
            needsUpdate = true
          }

          if (heading() !== null && cameraStateRef().heading !== heading()) {
            nextCamera.heading = heading() as number
            needsUpdate = true
          }

          if (tilt() !== null && cameraStateRef().tilt !== tilt()) {
            nextCamera.tilt = tilt() as number
            needsUpdate = true
          }

          if (needsUpdate) {
            map.moveCamera(nextCamera)
          }
        }, 1)

        onCleanup(() => timeout && clearTimeout(timeout))
      },
    ),
  )
}
