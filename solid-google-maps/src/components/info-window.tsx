import {
  JSX,
  ParentComponent,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  splitProps,
  useContext,
} from 'solid-js'
import { Portal } from 'solid-js/web'
import { useMap } from '../hooks/use-map'
import { useMapsEventListener } from '../hooks/use-maps-event-listener'
import { useMapsLibrary } from '../hooks/use-maps-library'
import { AdvancedMarkerContext, CustomMarkerContent, isAdvancedMarker } from './advanced-marker'

export type InfoWindowProps = Omit<google.maps.InfoWindowOptions, 'headerContent' | 'content' | 'pixelOffset'> & {
  style?: JSX.CSSProperties
  className?: string
  anchor?: google.maps.Marker | google.maps.marker.AdvancedMarkerElement | null
  pixelOffset?: [number, number]
  shouldFocus?: boolean
  onClose?: () => void
  onCloseClick?: () => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  headerContent?: JSX.Element | string
}

/**
 * Component to render an Info Window with the Maps JavaScript API
 */
export const InfoWindow: ParentComponent<InfoWindowProps> = (p) => {
  const [props, infoWindowOptions] = splitProps(p, [
    'children',
    'headerContent',
    'style',
    'className',
    'pixelOffset',
    'anchor',
    'shouldFocus',
    'onClose',
    'onCloseClick',
    'open',
    'onOpenChange',
  ])

  // ## create infowindow instance once the mapsLibrary is available.
  const mapsLibrary = useMapsLibrary('maps')
  const [infoWindow, setInfoWindow] = createSignal<google.maps.InfoWindow | null>(null)

  const [contentContainerRef, setContentContainerRef] = createSignal<HTMLElement | null>(null)
  const [headerContainerRef, setHeaderContainerRef] = createSignal<HTMLElement | null>(null)

  const context = useContext(AdvancedMarkerContext)

  createEffect(
    on(
      () => mapsLibrary(),
      (mapsLibrary) => {
        if (!mapsLibrary) return

        setContentContainerRef(document.createElement('div'))
        setHeaderContainerRef(document.createElement('div'))

        // intentionally shadowing the state variables here
        const infoWindow = new google.maps.InfoWindow(infoWindowOptions)
        infoWindow.setContent(contentContainerRef())

        setInfoWindow(infoWindow)

        // unmount: remove infoWindow and content elements (note: close is called in a different effect-cleanup)
        onCleanup(() => {
          infoWindow.setContent(null)

          contentContainerRef()?.remove()
          headerContainerRef()?.remove()

          setContentContainerRef(null)
          setHeaderContainerRef(null)

          setInfoWindow(null)
        })
      },
    ),
  )

  // ## update className and styles for `contentContainer`
  // stores previously applied style properties, so they can be removed when unset
  //! TODO: Implement this
  /*
  const prevStyleRef = useRef<CSSProperties | null>(null)
  useEffect(() => {
    if (!infoWindow || !contentContainerRef.current) return

    setValueForStyles(contentContainerRef.current, style || null, prevStyleRef.current)

    prevStyleRef.current = style || null

    if (className !== contentContainerRef.current.className)
      contentContainerRef.current.className = className || ''
  }, [infoWindow, className, style])*/

  const map = useMap()
  const anchor = createMemo(() => props.anchor || context?.marker())
  const openOptions = createMemo<google.maps.InfoWindowOpenOptions>(() => {
    if (!map()) return {}

    return { map: map(), anchor: anchor() }
  })

  // ## update options
  createEffect(
    on(
      () => ({
        infoWindow: infoWindow(),
        infoWindowOptions: infoWindowOptions,
        pixelOffset: props.pixelOffset,
        headerContent: props.headerContent,
      }),
      ({ infoWindow, infoWindowOptions, pixelOffset, headerContent }) => {
        if (!infoWindow) return

        const opts: google.maps.InfoWindowOptions = Object.assign({}, infoWindowOptions)
        if (!pixelOffset) {
          opts.pixelOffset = null
        } else {
          opts.pixelOffset = new google.maps.Size(pixelOffset[0], pixelOffset[1])
        }

        if (!headerContent) {
          opts.headerContent = null
        } else {
          opts.headerContent = headerContainerRef()
          //typeof headerContent === 'string' ? headerContent : headerContainerRef()
        }

        infoWindow.setOptions(opts)
      },
    ),
  )

  const handleClose = () => {
    props.onClose?.()
    props.onOpenChange?.(false)
  }

  const handleCloseClick = () => {
    props.onCloseClick?.()
    props.onOpenChange?.(false)
  }

  // ## bind event handlers
  useMapsEventListener(infoWindow, 'close', () => handleClose)
  useMapsEventListener(infoWindow, 'closeclick', () => handleCloseClick)

  // ## open info window when content and map are available

  createEffect(
    on(
      () => ({
        infoWindow: infoWindow(),
        openOptions: openOptions(),
        open: props.open,
        pixelOffset: props.pixelOffset,
        anchor: anchor(),
      }),
      ({ infoWindow, openOptions, open, pixelOffset, anchor }) => {
        if (!infoWindow || !openOptions.map) return

        if (open) {
          if (anchor && isAdvancedMarker(anchor) && anchor.content instanceof Element) {
            const wrapper = anchor.content as CustomMarkerContent
            const wrapperBcr = wrapper?.getBoundingClientRect()

            if (wrapperBcr) {
              const anchorDomContent = anchor.content.firstElementChild as Element

              const contentBcr = anchorDomContent.getBoundingClientRect()

              const anchorOffsetX = contentBcr.x - wrapperBcr.x + (contentBcr.width - wrapperBcr.width) / 2
              const anchorOffsetY = contentBcr.y - wrapperBcr.y

              infoWindow.setOptions({
                pixelOffset: new google.maps.Size(
                  pixelOffset ? pixelOffset[0] + anchorOffsetX : anchorOffsetX,
                  pixelOffset ? pixelOffset[1] + anchorOffsetY : anchorOffsetY,
                ),
              })
            }
          }
          infoWindow.open(openOptions)
        } else {
          infoWindow.close()
        }
      },
    ),
  )

  return (
    <>
      <Portal mount={contentContainerRef() || undefined}>{props.children}</Portal>
      <Portal mount={headerContainerRef() || undefined}>{props.headerContent}</Portal>
    </>
  )
}
