import {
  Cluster,
  MarkerClusterer as Clusterer,
  Marker,
  MarkerClustererEvents,
  MarkerClustererOptions,
  Renderer,
} from '@googlemaps/markerclusterer'
import {
  createDeferred,
  createEffect,
  createMemo,
  createRoot,
  createSignal,
  createUniqueId,
  For,
  getOwner,
  JSX,
  onCleanup,
} from 'solid-js'
import { useMap } from '../hooks/use-map'
import { useMapsLibrary } from '../hooks/use-maps-library'

type MarkerClustererProps<T> = Omit<MarkerClustererOptions, 'map' | 'onClusterClick'> & {
  each: T[]
  key?: { [K in keyof T]: T[K] extends string ? K : never }[keyof T] | ((item: T) => string)
  children: (item: T, props: { ref: (marker: Marker | null) => void }, key: string) => JSX.Element
  ref?: (markers: { [key: string]: Marker }) => void
  onClusterClick?: (e: google.maps.MapMouseEvent & { cluster: Cluster; map: google.maps.Map }) => void
  clusterMarker?: (
    props: {
      position: google.maps.LatLngLiteral
      ref: (marker: google.maps.marker.AdvancedMarkerElement | null) => void
    },
    count: number,
  ) => JSX.Element
}

export function MarkerClusterer<T>(props: MarkerClustererProps<T>) {
  const map = useMap()
  const [markers, setMarkers] = createSignal<{ [key: string]: Marker }>({})
  const markerLibrary = useMapsLibrary('marker')

  createDeferred(() => {
    props.ref?.(markers())
  })

  const owner = getOwner()
  let disposers: { marker: google.maps.marker.AdvancedMarkerElement; dispose: () => void }[] = []

  const renderer = createMemo(() => {
    if (!markerLibrary()) return undefined
    const library = markerLibrary()!

    // default to the renderer prop if provided.
    return props.renderer
      ? props.renderer
      : // render a reactive marker from the clusterMarker prop
        props.clusterMarker
        ? ({
            render: (cluster, stat, map) => {
              const marker = new library.AdvancedMarkerElement({
                map,
                position: cluster.position,
                zIndex: Number(google.maps.Marker.MAX_ZINDEX) + cluster.count,
              })
              // create a root to track changes to the clusterMarker
              createRoot((dispose) => {
                // track the disposer function to dispose later when the marker is removed
                disposers.push({ marker, dispose })
                return props.clusterMarker!(
                  // pass the content div from the tracked marker over to our empty marker that we just created
                  { position: cluster.position.toJSON(), ref: (m) => m && (marker.content = m.content) },
                  cluster.count,
                )
              }, owner)
              return marker
            },
          } as Renderer)
        : undefined
  })

  // create the markerClusterer once the map is available and update it when
  // the markers are changed
  const clusterer = createMemo(() => {
    if (!map() || !markerLibrary()) return null

    return new Clusterer({
      map: map(),
      algorithm: props.algorithm,
      algorithmOptions: props.algorithmOptions,
      renderer: renderer(),
      markers: [],
      onClusterClick: props.onClusterClick
        ? (e, cluster, map) => props.onClusterClick?.({ ...e, cluster, map })
        : undefined,
    })
  })

  createEffect(() => {
    if (!clusterer() || !map()) return

    // we can check our markers to see if they are still on the map after clustering runs
    const listener = google.maps.event.addListener(clusterer()!, MarkerClustererEvents.CLUSTERING_END, () => {
      // wait for 2 animation frames, because MarkerClusterer already waits for 1 before removing markers
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // keep disposers where the marker is still on the map
          disposers = disposers.filter((d) => {
            if (d.marker.map) return true
            d.dispose()
            return false
          })
        })
      })
    })

    onCleanup(() => {
      listener.remove()
      // dispose of all markers when the clusterer is removed
      disposers.forEach((d) => d.dispose())
    })
  })

  createEffect(() => {
    if (!clusterer()) return

    clusterer()!.clearMarkers()
    clusterer()!.addMarkers(Object.values(markers()))
  })

  // this callback will effectively get passed as ref to the markers to keep
  // tracks of markers currently on the map
  const setMarkerRef = (marker: Marker | null, key: string) => {
    setMarkers((markers) => {
      if ((marker && markers[key]) || (!marker && !markers[key])) return markers

      if (marker) {
        return { ...markers, [key]: marker }
      } else {
        const { [key]: _, ...newMarkers } = markers

        return newMarkers
      }
    })
  }

  return (
    <For each={props.each}>
      {(item) => {
        const key = !props.key
          ? createUniqueId()
          : typeof props.key === 'function'
            ? props.key(item)
            : (item[props.key] as string)

        const ref = (marker: Marker | null) => setMarkerRef(marker, key)

        return props.children(
          item,
          {
            ref,
          },
          key,
        )
      }}
    </For>
  )
}
