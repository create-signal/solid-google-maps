import { NumberField } from '@kobalte/core/number-field'
import { FeatureCollection, GeoJsonProperties, Point } from 'geojson'
import { APIProvider, Map, useMap, useMapsLibrary } from 'solid-google-maps'
import { Component, createEffect, createMemo, createSignal, onCleanup, onMount, Show } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import {
  NumberFieldDecrementTrigger,
  NumberFieldGroup,
  NumberFieldIncrementTrigger,
  NumberFieldInput,
  NumberFieldLabel,
} from '~/components/ui/number-field'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const [radius, setRadius] = createSignal(25)
  const [opacity, setOpacity] = createSignal(0.8)

  const [earthquakesGeojson, setEarthquakesGeojson] = createSignal<EarthquakesGeojson>()

  const earthquakeData = createMemo(() =>
    earthquakesGeojson()?.features.map((point) => {
      const [lng, lat] = point.geometry.coordinates

      return {
        location: { lat, lng },
        weight: point.properties.mag,
      } as WeightedLocation
    }),
  )

  onMount(() => {
    loadEarthquakeGeojson().then((data) => setEarthquakesGeojson(data))
  })

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ height: '500px', width: '100%' }}
        mapId={'7a9e2ebecd32a903'}
        defaultCenter={{ lat: 40.7749, lng: -130.4194 }}
        defaultZoom={3}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      />

      <Show when={earthquakeData()}>{(data) => <Heatmap data={data()} radius={radius()} opacity={opacity()} />}</Show>

      <ControlPanel radius={radius()} opacity={opacity()} onRadiusChanged={setRadius} onOpacityChanged={setOpacity} />
    </APIProvider>
  )
}

type WeightedLocation = Omit<google.maps.visualization.WeightedLocation, 'location'> & {
  location: google.maps.LatLngLiteral
}

const Heatmap: Component<{
  data: WeightedLocation[]
  radius: number
  opacity: number
}> = (props) => {
  const map = useMap()
  const visualization = useMapsLibrary('visualization')
  const [heatmap, setHeatmap] = createSignal<google.maps.visualization.HeatmapLayer | null>(null)

  createEffect(() => {
    if (!visualization()) return null

    const heatmap = new google.maps.visualization.HeatmapLayer({
      radius: props.radius,
      opacity: props.opacity,
    })

    heatmap.setMap(map())

    setHeatmap(heatmap)

    onCleanup(() => {
      heatmap.setMap(null)
    })
  })

  createEffect(() => {
    heatmap()?.setData(
      props.data.map((point) => ({ location: new google.maps.LatLng(point.location), weight: point.weight })),
    )
  })

  return null
}

const ControlPanel: Component<{
  radius: number
  opacity: number
  onRadiusChanged: (radius: number) => void
  onOpacityChanged: (opacity: number) => void
}> = (props) => {
  return (
    <Card class="absolute top-4 right-4 z-10 max-w-72">
      <CardHeader>
        <CardTitle>Heatmap</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 space-y-4 text-sm">
        <p>
          This uses the useMapsLibrary() hook and the google.maps.visualization library to show earthquake magnitude
          data in a heatmap.
        </p>

        <NumberField class="flex w-36 flex-col gap-2" value={props.radius} onRawValueChange={props.onRadiusChanged}>
          <NumberFieldLabel>Radius</NumberFieldLabel>
          <NumberFieldGroup>
            <NumberFieldInput />
            <NumberFieldIncrementTrigger />
            <NumberFieldDecrementTrigger />
          </NumberFieldGroup>
        </NumberField>

        <NumberField
          class="flex w-36 flex-col gap-2"
          value={props.opacity}
          onRawValueChange={props.onOpacityChanged}
          step={0.1}
        >
          <NumberFieldLabel>Opacity</NumberFieldLabel>
          <NumberFieldGroup>
            <NumberFieldInput />
            <NumberFieldIncrementTrigger />
            <NumberFieldDecrementTrigger />
          </NumberFieldGroup>
        </NumberField>
      </CardContent>
    </Card>
  )
}

export type EarthquakeProps = {
  id: string
  mag: number
  time: number
  felt: number | null
  tsunami: 0 | 1
}

export type EarthquakesGeojson = FeatureCollection<Point, EarthquakeProps>

export async function loadEarthquakeGeojson(): Promise<EarthquakesGeojson> {
  const url = new URL('./earthquakes.json', import.meta.url)

  return await fetch(url).then((res) => res.json())
}
