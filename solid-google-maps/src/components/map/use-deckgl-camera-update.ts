import { Accessor, createEffect } from 'solid-js'

export type DeckGlCompatProps = {
  /**
   * Viewport from deck.gl
   */
  viewport?: unknown
  /**
   * View state from deck.gl
   */
  viewState?: Record<string, unknown>
  /**
   * Initial View State from deck.gl
   */
  initialViewState?: Record<string, unknown>
}

/**
 * Internal hook that updates the camera when deck.gl viewState changes.
 * @internal
 */
export function useDeckGLCameraUpdate(map: Accessor<google.maps.Map | null>, props: DeckGlCompatProps) {
  const isDeckGlControlled = () => !!props.viewport

  createEffect(() => {
    if (!map() || !props.viewState) return

    const { latitude, longitude, bearing: heading, pitch: tilt, zoom } = props.viewState as Record<string, number>

    map()!.moveCamera({
      center: { lat: latitude!, lng: longitude! },
      heading,
      tilt,
      zoom: zoom! + 1,
    })
  })

  return isDeckGlControlled
}
