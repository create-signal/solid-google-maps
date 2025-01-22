import { useMap } from '../hooks/use-map'
import { useMapsLibrary } from '../hooks/use-maps-library'

import {
  Accessor,
  Component,
  JSX,
  ParentProps,
  children,
  createContext,
  createEffect,
  createSignal,
  on,
  onCleanup,
} from 'solid-js'
import { Portal } from 'solid-js/web'
import { useDomEventListener } from '../hooks/use-dom-event-listener'
import { useMapsEventListener } from '../hooks/use-maps-event-listener'
import { usePropBinding } from '../hooks/use-prop-binding'

export interface AdvancedMarkerContextValue {
  marker: Accessor<google.maps.marker.AdvancedMarkerElement | null>
}

export function isAdvancedMarker(
  marker: google.maps.Marker | google.maps.marker.AdvancedMarkerElement,
): marker is google.maps.marker.AdvancedMarkerElement {
  return (marker as google.maps.marker.AdvancedMarkerElement).content !== undefined
}

function isElementNode(node: Node): node is HTMLElement {
  return node.nodeType === Node.ELEMENT_NODE
}

/**
 * Copy of the `google.maps.CollisionBehavior` constants.
 * They have to be duplicated here since we can't wait for the maps API to load to be able to use them.
 */
export const CollisionBehavior = {
  REQUIRED: 'REQUIRED',
  REQUIRED_AND_HIDES_OPTIONAL: 'REQUIRED_AND_HIDES_OPTIONAL',
  OPTIONAL_AND_HIDES_LOWER_PRIORITY: 'OPTIONAL_AND_HIDES_LOWER_PRIORITY',
} as const
export type CollisionBehavior = (typeof CollisionBehavior)[keyof typeof CollisionBehavior]

export const AdvancedMarkerContext = createContext<AdvancedMarkerContextValue | null>(null)

// [xPosition, yPosition] when the top left corner is [0, 0]
export const AdvancedMarkerAnchorPoint = {
  TOP_LEFT: ['0%', '0%'],
  TOP_CENTER: ['50%', '0%'],
  TOP: ['50%', '0%'],
  TOP_RIGHT: ['100%', '0%'],
  LEFT_CENTER: ['0%', '50%'],
  LEFT_TOP: ['0%', '0%'],
  LEFT: ['0%', '50%'],
  LEFT_BOTTOM: ['0%', '100%'],
  RIGHT_TOP: ['100%', '0%'],
  RIGHT: ['100%', '50%'],
  RIGHT_CENTER: ['100%', '50%'],
  RIGHT_BOTTOM: ['100%', '100%'],
  BOTTOM_LEFT: ['0%', '100%'],
  BOTTOM_CENTER: ['50%', '100%'],
  BOTTOM: ['50%', '100%'],
  BOTTOM_RIGHT: ['100%', '100%'],
  CENTER: ['50%', '50%'],
} as const

export type AdvancedMarkerAnchorPoint = (typeof AdvancedMarkerAnchorPoint)[keyof typeof AdvancedMarkerAnchorPoint]

type AdvancedMarkerEventProps = {
  onClick?: (e: google.maps.MapMouseEvent) => void
  onMouseEnter?: (e: google.maps.MapMouseEvent['domEvent']) => void
  onMouseLeave?: (e: google.maps.MapMouseEvent['domEvent']) => void
  onDrag?: (e: google.maps.MapMouseEvent) => void
  onDragStart?: (e: google.maps.MapMouseEvent) => void
  onDragEnd?: (e: google.maps.MapMouseEvent) => void
}

export type AdvancedMarkerProps = ParentProps<
  Omit<
    google.maps.marker.AdvancedMarkerElementOptions,
    'gmpDraggable' | 'gmpClickable' | 'content' | 'map' | 'collisionBehavior'
  > &
    AdvancedMarkerEventProps & {
      draggable?: boolean
      clickable?: boolean
      collisionBehavior?: CollisionBehavior
      /**
       * The anchor point for the Advanced Marker.
       * Either use one of the predefined anchor point from the "AdvancedMarkerAnchorPoint" export
       * or provide a string tuple in the form of ["xPosition", "yPosition"].
       * The position is measured from the top-left corner and
       * can be anything that can be consumed by a CSS translate() function.
       * For example in percent ("50%") or in pixels ("20px").
       */
      anchorPoint?: AdvancedMarkerAnchorPoint | [string, string]
      /**
       * A className for the content element.
       * (can only be used with HTML Marker content)
       */
      class?: string
      /**
       * Additional styles to apply to the content element.
       */
      style?: JSX.CSSProperties
      ref?: (marker: google.maps.marker.AdvancedMarkerElement | null) => void
    }
>

type MarkerContentProps = ParentProps<{
  styles?: JSX.CSSProperties
  class?: string
  anchorPoint?: AdvancedMarkerAnchorPoint | [string, string]
}>

const MarkerContent: Component<MarkerContentProps> = (props) => {
  const translation = () => props.anchorPoint ?? AdvancedMarkerAnchorPoint['BOTTOM']

  // The "translate(50%, 100%)" is here to counter and reset the default anchoring of the advanced marker element
  // that comes from the api
  const transformStyle = () => `translate(50%, 100%) translate(-${translation()[0]}, -${translation()[1]})`

  return (
    // anchoring container
    <div style={{ transform: transformStyle() }}>
      {/* AdvancedMarker div that user can give styles and classes */}
      <div class={props.class} style={props.styles}>
        {props.children}
      </div>
    </div>
  )
}

export type CustomMarkerContent = (HTMLDivElement & { isCustomMarker?: boolean }) | null

export type AdvancedMarkerRef = google.maps.marker.AdvancedMarkerElement | null

function useAdvancedMarker(props: AdvancedMarkerProps) {
  const [marker, setMarker] = createSignal<google.maps.marker.AdvancedMarkerElement | null>(null)
  const [contentContainer, setContentContainer] = createSignal<HTMLDivElement | null>(null)

  const map = useMap()

  const markerLibrary = useMapsLibrary('marker')

  const resolved = children(() => props.children)
  const numChildren = () =>
    resolved.toArray().filter((item) => (item instanceof Node && item.nodeType === 3 ? item.textContent : item)).length

  // create an AdvancedMarkerElement instance and add it to the map once available
  createEffect(
    on(
      () => ({
        map: map(),
        markerLibrary: markerLibrary(),
      }),
      ({ map, markerLibrary }) => {
        if (!map || !markerLibrary) return

        const newMarker = new markerLibrary.AdvancedMarkerElement()
        newMarker.map = map

        setMarker(newMarker)

        // create the container for marker content if there are children
        let contentElement: CustomMarkerContent = null

        if (numChildren() > 0) {
          contentElement = document.createElement('div')

          // We need some kind of fag to identify the custom marker content
          // in the infowindow component. Choosing a custom property instead of a className
          // to not encourage users to style the marker content directly.l
          contentElement.isCustomMarker = true

          newMarker.content = contentElement
          setContentContainer(contentElement)
        }

        onCleanup(() => {
          newMarker.map = null
          contentElement?.remove()
          setMarker(null)
          setContentContainer(null)
        })
      },
    ),
  )

  // When no children are present we don't have our own wrapper div
  // which usually gets the user provided className. In this case
  // we set the className directly on the marker.content element that comes
  // with the AdvancedMarker.
  createEffect(
    on(
      () => ({
        marker: marker(),
        className: props.class,
        numChildren: numChildren(),
      }),
      ({ marker, className, numChildren }) => {
        if (!marker || !marker.content || numChildren > 0) return
        ;(marker.content as HTMLElement).className = className || ''
      },
    ),
  )

  // copy other props
  usePropBinding(marker, setMarker, 'position', () => props.position)
  usePropBinding(marker, setMarker, 'title', () => props.title ?? '')
  usePropBinding(marker, setMarker, 'zIndex', () => props.zIndex)
  usePropBinding(marker, setMarker, 'collisionBehavior', () => props.collisionBehavior as google.maps.CollisionBehavior)

  // set gmpDraggable from props (when unspecified, it's true if any drag-event
  // callbacks are specified)
  createEffect(
    on(
      () => ({
        marker: marker(),
        draggable: props.draggable,
        onDrag: props.onDrag,
        onDragEnd: props.onDragEnd,
        onDragStart: props.onDragStart,
      }),
      ({ marker, draggable, onDrag, onDragEnd, onDragStart }) => {
        if (!marker) return

        if (draggable !== undefined) marker.gmpDraggable = draggable
        else if (onDrag || onDragStart || onDragEnd) marker.gmpDraggable = true
        else marker.gmpDraggable = false
      },
    ),
  ) //, [marker, draggable, onDrag, onDragEnd, onDragStart])

  // set gmpClickable from props (when unspecified, it's true if the onClick or one of
  // the hover events callbacks are specified)
  createEffect(
    on(
      () => ({
        marker: marker(),
        clickable: props.clickable,
        onClick: props.onClick,
        onMouseEnter: props.onMouseEnter,
        onMouseLeave: props.onMouseLeave,
      }),
      ({ marker, clickable, onClick, onMouseEnter, onMouseLeave }) => {
        if (!marker) return

        const gmpClickable =
          clickable !== undefined || Boolean(onClick) || Boolean(onMouseEnter) || Boolean(onMouseLeave)

        // gmpClickable is only available in beta version of the
        // maps api (as of 2024-10-10)
        marker.gmpClickable = gmpClickable

        // enable pointer events for the markers with custom content
        /*if (gmpClickable && marker?.content && isElementNode(marker.content)) {
          marker.content.style.pointerEvents = 'none'

          if (marker.content.firstElementChild) {
            ;(marker.content.firstElementChild as HTMLElement).style.pointerEvents = 'all'
          }
        }*/
      },
    ),
  ) //, [marker, clickable, onClick, onMouseEnter, onMouseLeave])

  useMapsEventListener(marker, 'click', () => props.onClick)
  useMapsEventListener(marker, 'drag', () => props.onDrag)
  useMapsEventListener(marker, 'dragstart', () => props.onDragStart)
  useMapsEventListener(marker, 'dragend', () => props.onDragEnd)

  useDomEventListener(
    () => marker()?.element || null,
    'mouseenter',
    () => props.onMouseEnter,
  )
  useDomEventListener(
    () => marker()?.element || null,
    'mouseleave',
    () => props.onMouseLeave,
  )

  return [marker, contentContainer] as const
}

export const AdvancedMarker = (props: AdvancedMarkerProps) => {
  const [marker, contentContainer] = useAdvancedMarker(props)

  createEffect(() => {
    props.ref?.(marker())

    onCleanup(() => {
      props.ref?.(null)
    })
  })

  return (
    <AdvancedMarkerContext.Provider value={{ marker }}>
      <Portal mount={contentContainer() || undefined}>
        <MarkerContent anchorPoint={props.anchorPoint} styles={props.style} class={props.class}>
          {props.children}
        </MarkerContent>
      </Portal>
    </AdvancedMarkerContext.Provider>
  )
}
