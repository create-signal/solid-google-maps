import { AdvancedMarkerContext } from './advanced-marker'
import { logErrorOnce } from '../libraries/errors'
import { ParentComponent, Show, createEffect, createSignal, on, onCleanup, splitProps, useContext } from 'solid-js'
import { Portal } from 'solid-js/web'

/**
 * Props for the Pin component
 */
export type PinProps = google.maps.marker.PinElementOptions

/**
 * Component to configure the appearance of an AdvancedMarker
 */
export const Pin: ParentComponent<PinProps> = (p) => {
  const [localProps, props] = splitProps(p, ['children'])
  const context = useContext(AdvancedMarkerContext)
  const [glyphContainer, setGlyphContainer] = createSignal<HTMLDivElement | null>(null)

  if (!context) {
    logErrorOnce('The <Pin> component must be used within an <AdvancedMarker> component.')
  }

  createEffect(() => {
    setGlyphContainer(document.createElement('div'))

    onCleanup(() => {
      glyphContainer()?.remove()
      setGlyphContainer(null)
    })
  })

  // Create Pin View instance
  createEffect(() => {
    const advancedMarker = context?.marker()

    if (!advancedMarker) {
      return
    }

    if (props.glyph && localProps.children) {
      logErrorOnce(
        'The <Pin> component only uses children to render the glyph if both the glyph property and children are present.',
      )
    }

    if (advancedMarker.content && 'isCustomMarker' in advancedMarker.content && advancedMarker.content.isCustomMarker) {
      console.error('The <Pin> component cannot be used with Custom Marker Content.')
      return
    }

    const pinViewOptions: google.maps.marker.PinElementOptions = {
      ...props,
    }

    const pinElement = new google.maps.marker.PinElement(pinViewOptions)

    // Set glyph to glyph container if children are present (rendered via portal).
    // If both props.glyph and props.children are present, props.children takes priority.
    if (localProps.children) {
      pinElement.glyph = glyphContainer()
    }

    // Set content of Advanced Marker View to the Pin View element
    // Here we are selecting the anchor container.
    // The hierarchy is as follows:
    // "advancedMarker.content" (from google) -> "pointer events reset div" -> "anchor container"
    const markerContent = advancedMarker.content //?.firstChild?.firstChild

    while (markerContent?.firstChild) {
      markerContent.removeChild(markerContent.firstChild)
    }

    if (markerContent) {
      markerContent.appendChild(pinElement.element)
    }
  })

  return (
    <Show when={glyphContainer()}>
      <Portal mount={glyphContainer()!}>{localProps.children}</Portal>
    </Show>
  )
}
