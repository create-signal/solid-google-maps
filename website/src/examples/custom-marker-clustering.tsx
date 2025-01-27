import { Key } from '@solid-primitives/keyed'
import { Feature, Point } from 'geojson'
import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APIProvider,
  InfoWindow,
  Map,
  MapCameraChangedEvent,
} from 'solid-google-maps'
import { Component, createSignal, onMount, Show } from 'solid-js'
import { ClusterProperties } from 'supercluster'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { CastlesGeojson, loadCastlesGeojson } from './custom-marker-clustering/castles'
import { CastleSvg } from './custom-marker-clustering/components/castle-icon'
import { InfoWindowContent } from './custom-marker-clustering/components/info-window'
import { useSupercluster } from './custom-marker-clustering/hooks/use-supercluster'
import './custom-marker-clustering/styles.css'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const [geojson, setGeojson] = createSignal<CastlesGeojson | null>(null)
  const [zoom, setZoom] = createSignal(4)
  const [bounds, setBounds] = createSignal<[number, number, number, number]>([-180, -90, 180, 90])
  const [center, setCenter] = createSignal({ lat: 46.603354, lng: 1.8883335 })

  onMount(() => {
    loadCastlesGeojson().then((data) => setGeojson(data))
  })

  const { clusters, getLeaves /*, getClusterExpansionZoom*/ } = useSupercluster(geojson, bounds, zoom, () => ({
    extent: 256,
    radius: 60,
    maxZoom: 12,
  }))

  const handleBoundsChanged = (input: MapCameraChangedEvent) => {
    const bounds = new google.maps.LatLngBounds(input.detail.bounds)
    const sw = bounds.getSouthWest()
    const ne = bounds.getNorthEast()

    const paddingDegrees = 0

    const n = Math.min(90, ne.lat() + paddingDegrees)
    const s = Math.max(-90, sw.lat() - paddingDegrees)

    const w = sw.lng() - paddingDegrees
    const e = ne.lng() + paddingDegrees

    setBounds([w, s, e, n])
    setZoom(input.detail.zoom)
    setCenter(input.detail.center)
  }

  const [infowindowData, setInfowindowData] = createSignal<{
    anchor: google.maps.marker.AdvancedMarkerElement
    features: Feature<Point>[]
  } | null>(null)

  const handleInfoWindowClose = () => {
    setInfowindowData(null)
  }

  const handleMarkerClick = (marker: google.maps.marker.AdvancedMarkerElement, featureId: string) => {
    const feature = clusters().find((f) => f.id === featureId)!
    setInfowindowData({ anchor: marker, features: [feature] })
  }

  const handleClusterClick = (marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => {
    const leaves = getLeaves(clusterId)
    setInfowindowData({ anchor: marker, features: leaves })
  }

  // Alternative click handler that zooms in on the cluster
  /*const handleClusterZoom = (position: google.maps.LatLngLiteral, clusterId: number) => {
    setCenter(position)
    setZoom(getClusterExpansionZoom(clusterId))
  }*/

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        id="clustering"
        mapId={'bf51a910020fa25a'}
        style={{ height: '500px', width: '100%' }}
        class={'custom-marker-clustering-map'}
        center={center()}
        zoom={zoom()}
        onClick={() => setInfowindowData(null)}
        onBoundsChanged={handleBoundsChanged}
        gestureHandling={'greedy'}
        disableDefaultUI
        clickableIcons={false}
      >
        <Key each={clusters()} by={(item) => item.id}>
          {(feature) => {
            const position = () => ({ lng: feature().geometry.coordinates[0], lat: feature().geometry.coordinates[1] })
            const clusterProperties = () => feature().properties as ClusterProperties
            const isCluster = () => clusterProperties().cluster
            const markerSize = () => Math.floor(48 + Math.sqrt(clusterProperties().point_count) * 2)

            return (
              <Show
                when={isCluster()}
                fallback={
                  <AdvancedMarker
                    position={position()}
                    onClick={(event) => {
                      event.stop()
                      handleMarkerClick(event.marker, feature().id as string)
                    }}
                    anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
                    class={'marker feature'}
                  >
                    <CastleSvg />
                  </AdvancedMarker>
                }
              >
                <>
                  <AdvancedMarker
                    position={position()}
                    zIndex={clusterProperties().point_count}
                    class={'marker cluster'}
                    style={{ width: `${markerSize()}px`, height: `${markerSize()}px` }}
                    onClick={(event) => {
                      event.stop()
                      handleClusterClick(event.marker, clusterProperties().cluster_id)
                    }}
                    ////onClick={() => handleClusterZoom(position(), clusterProperties().cluster_id)}
                    anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
                  >
                    <CastleSvg />
                    <span>{String(clusterProperties().point_count_abbreviated)}</span>
                  </AdvancedMarker>
                </>
              </Show>
            )
          }}
        </Key>

        <Show when={infowindowData()}>
          <InfoWindow onCloseClick={handleInfoWindowClose} anchor={infowindowData()!.anchor}>
            <InfoWindowContent features={infowindowData()!.features} />
          </InfoWindow>
        </Show>
      </Map>

      <ControlPanel numClusters={clusters().length} numFeatures={geojson()?.features.length || 0} />
    </APIProvider>
  )
}

const numberFormat = new Intl.NumberFormat()

const ControlPanel: Component<{
  numClusters: number
  numFeatures: number
}> = (props) => {
  return (
    <Card class="absolute top-4 right-4 z-10 max-w-72">
      <CardHeader>
        <CardTitle>Custom Marker Clustering</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 space-y-4 text-sm">
        <p>
          This example loads a GeoJSON file and uses the{' '}
          <a href={'https://github.com/mapbox/supercluster'} target={'_blank'}>
            <code>supercluster</code>
          </a>{' '}
          library together with <code>&lt;AdvancedMarker&gt;</code> components for fast and fully customizable
          clustering of the features. It requires a lot more code
        </p>
        <p>
          The data shows all features from the OSM database for castles that are also tagged as tourist attractions.
        </p>

        <ul>
          <li>
            <strong>{numberFormat.format(props.numFeatures)}</strong> Features loaded
          </li>
          <li>
            <strong>{props.numClusters}</strong> Markers rendered
          </li>
        </ul>

        <div class="text-xs">
          <div>
            <strong>Data:</strong>{' '}
            <a href="https://openstreetmap.org/copyright" target="_blank">
              OpenStreetMap
            </a>{' '}
            via <a href="https://overpass-api.de/">overpass API</a>.
          </div>

          <div>
            <strong>Icon:</strong> Castle by Rikas Dzihab from{' '}
            <a href="https://thenounproject.com/browse/icons/term/castle/" target="_blank" title="Castle Icons">
              Noun Project
            </a>{' '}
            (CC BY 3.0)
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
