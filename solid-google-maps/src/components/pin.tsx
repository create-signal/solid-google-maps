import { AdvancedMarkerContext } from './advanced-marker'
import { logErrorOnce } from '../libraries/errors'
import { ParentComponent, createEffect, createSignal, on, onCleanup, useContext } from 'solid-js'
import { Portal } from 'solid-js/web'

/**
 * Props for the Pin component
 */
export type PinProps = google.maps.marker.PinElementOptions

/**
 * Component to configure the appearance of an AdvancedMarker
 */
export const Pin: ParentComponent<PinProps> = (props) => {
  const context = useContext(AdvancedMarkerContext)
  const [glyphContainer, setGlyphContainer] = createSignal<HTMLDivElement | null>(null)

  createEffect(() => {
    setGlyphContainer(document.createElement('div'))

    onCleanup(() => {
      glyphContainer()?.remove()
      setGlyphContainer(null)
    })
  })

  // Create Pin View instance
  createEffect(
    on(
      () => ({ advancedMarker: context?.marker(), glyphContainer: glyphContainer() }),
      ({ advancedMarker, glyphContainer }) => {
        if (!advancedMarker) {
          return
        }

        if (props.glyph && props.children) {
          logErrorOnce(
            'The <Pin> component only uses children to render the glyph if both the glyph property and children are present.',
          )
        }

        if (
          advancedMarker.content &&
          'isCustomMarker' in advancedMarker.content &&
          advancedMarker.content.isCustomMarker
        ) {
          console.error('The <Pin> component cannot be used with Custom Marker Content.')
          return
        }

        const pinViewOptions: google.maps.marker.PinElementOptions = {
          ...props,
        }

        const pinElement = new google.maps.marker.PinElement(pinViewOptions)

        // Set glyph to glyph container if children are present (rendered via portal).
        // If both props.glyph and props.children are present, props.children takes priority.
        if (props.children) {
          pinElement.glyph = glyphContainer
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
      },
    ),
  )

  return <Portal mount={glyphContainer() || undefined}>{props.children}</Portal>
}
