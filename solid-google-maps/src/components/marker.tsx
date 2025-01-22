import { Component, createEffect, createSignal, on, onCleanup, splitProps } from 'solid-js'
import { useMap } from '../hooks/use-map'

type MarkerEventProps = {
  onClick?: (e: google.maps.MapMouseEvent) => void
  onDrag?: (e: google.maps.MapMouseEvent) => void
  onDragStart?: (e: google.maps.MapMouseEvent) => void
  onDragEnd?: (e: google.maps.MapMouseEvent) => void
  onMouseOver?: (e: google.maps.MapMouseEvent) => void
  onMouseOut?: (e: google.maps.MapMouseEvent) => void
}

export type MarkerProps = Omit<google.maps.MarkerOptions, 'map'> &
  MarkerEventProps & {
    ref?: (marker: google.maps.Marker | null) => void
  }

function useMarker(props: MarkerProps) {
  const [marker, setMarker] = createSignal<google.maps.Marker | null>(null)
  const map = useMap()

  const [, markerOptions] = splitProps(props, [
    'onClick',
    'onDrag',
    'onDragStart',
    'onDragEnd',
    'onMouseOver',
    'onMouseOut',
  ])

  // create marker instance and add to the map once the map is available
  createEffect(
    on(
      () => ({ map: map() }),
      ({ map }) => {
        if (!map) {
          if (map === undefined) console.error('<Marker> has to be inside a Map component.')

          return
        }

        const newMarker = new google.maps.Marker(markerOptions)
        newMarker.setMap(map)
        setMarker(newMarker)

        onCleanup(() => {
          newMarker.setMap(null)
          setMarker(null)
        })
      },
    ),
  )

  // attach and re-attach event-handlers when any of the properties change
  createEffect(
    on(
      () => ({
        marker: marker(),
        draggable: props.draggable,
        onClick: props.onClick,
        onDrag: props.onDrag,
        onDragStart: props.onDragStart,
        onDragEnd: props.onDragEnd,
        onMouseOver: props.onMouseOver,
        onMouseOut: props.onMouseOut,
      }),
      ({ marker, draggable, onClick, onDrag, onDragStart, onDragEnd, onMouseOver, onMouseOut }) => {
        if (!marker) return

        const m = marker

        // Add event listeners
        const gme = google.maps.event

        if (onClick) gme.addListener(m, 'click', onClick)
        if (onDrag) gme.addListener(m, 'drag', onDrag)
        if (onDragStart) gme.addListener(m, 'dragstart', onDragStart)
        if (onDragEnd) gme.addListener(m, 'dragend', onDragEnd)
        if (onMouseOver) gme.addListener(m, 'mouseover', onMouseOver)
        if (onMouseOut) gme.addListener(m, 'mouseout', onMouseOut)

        marker.setDraggable(Boolean(draggable))

        onCleanup(() => {
          gme.clearInstanceListeners(m)
        })
      },
    ),
  )

  // update markerOptions (note the dependencies aren't properly checked
  // here, we just assume that setOptions is smart enough to not waste a
  // lot of time updating values that didn't change)
  createEffect(
    on(
      () => ({ marker: marker(), markerOptions: markerOptions }),
      ({ marker, markerOptions }) => {
        if (!marker) return
        if (markerOptions) marker.setOptions(markerOptions)
      },
    ),
  )

  // update position when changed
  createEffect(
    on(
      () => ({ marker: marker(), position: props.position, draggable: props.draggable }),
      ({ marker, position, draggable }) => {
        if (draggable || !marker || !position) return

        marker.setPosition(position)
      },
    ),
  )

  return marker
}

/**
 * Component to render a marker on a map
 */
export const Marker: Component<MarkerProps> = (props: MarkerProps) => {
  const marker = useMarker(props)

  createEffect(() => {
    props.ref?.(marker())

    onCleanup(() => {
      props.ref?.(null)
    })
  })

  return <></>
}
