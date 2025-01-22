import { APIProvider, Map } from 'solid-google-maps/dist'

import { Component, createSignal } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'

const MapTypeId = {
  HYBRID: 'hybrid',
  ROADMAP: 'roadmap',
  SATELLITE: 'satellite',
  TERRAIN: 'terrain',
}
export type MapConfig = {
  id: string
  label: string
  mapId?: string
  mapTypeId?: string
  styles?: google.maps.MapTypeStyle[]
}

// Map Style "No label Bright Colors" by Beniamino Nobile
// https://snazzymaps.com/style/127403/no-label-bright-colors
const brightColorsStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'all',
    elementType: 'all',
    stylers: [{ saturation: '32' }, { lightness: '-3' }, { visibility: 'on' }, { weight: '1.18' }],
  },
  {
    featureType: 'administrative',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'landscape.man_made',
    elementType: 'all',
    stylers: [{ saturation: '-70' }, { lightness: '14' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'road',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'transit',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
  {
    featureType: 'water',
    elementType: 'all',
    stylers: [{ saturation: '100' }, { lightness: '-14' }],
  },
  {
    featureType: 'water',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }, { lightness: '12' }],
  },
]

// Map Style "Vitamin C" by Adam Krogh
// https://snazzymaps.com/style/40/vitamin-c
const vitaminCStyles: google.maps.MapTypeStyle[] = [
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#004358' }],
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [{ color: '#1f8a70' }],
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [{ color: '#1f8a70' }],
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#fd7400' }],
  },
  {
    featureType: 'road.arterial',
    elementType: 'geometry',
    stylers: [{ color: '#1f8a70' }, { lightness: -20 }],
  },
  {
    featureType: 'road.local',
    elementType: 'geometry',
    stylers: [{ color: '#1f8a70' }, { lightness: -17 }],
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff' }, { visibility: 'on' }, { weight: 0.9 }],
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ visibility: 'on' }, { color: '#ffffff' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'simplified' }],
  },
  { elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [{ color: '#1f8a70' }, { lightness: -10 }],
  },
  {
    featureType: 'administrative',
    elementType: 'geometry',
    stylers: [{ color: '#1f8a70' }, { weight: 0.7 }],
  },
]

const MAP_CONFIGS: MapConfig[] = [
  {
    id: 'light',
    label: 'Light',
    mapId: '49ae42fed52588c3',
    mapTypeId: MapTypeId.ROADMAP,
  },
  {
    id: 'dark',
    label: 'Dark',
    mapId: '739af084373f96fe',
    mapTypeId: MapTypeId.ROADMAP,
  },
  {
    id: 'satellite',
    label: 'Satellite (no mapId)',
    mapTypeId: MapTypeId.SATELLITE,
  },
  {
    id: 'hybrid',
    label: 'Hybrid (no mapId)',
    mapTypeId: MapTypeId.HYBRID,
  },
  {
    id: 'terrain',
    label: 'Terrain (no mapId)',
    mapTypeId: MapTypeId.TERRAIN,
  },
  {
    id: 'styled1',
    label: 'Raster / "Bright Colors" (no mapId)',
    mapTypeId: MapTypeId.ROADMAP,
    styles: brightColorsStyles,
  },
  {
    id: 'styled2',
    label: 'Raster / "Vitamin C" (no mapId)',
    mapTypeId: MapTypeId.ROADMAP,
    styles: vitaminCStyles,
  },
  {
    id: 'satellite2',
    label: 'Satellite ("light" mapId)',
    mapId: '49ae42fed52588c3',
    mapTypeId: MapTypeId.SATELLITE,
  },
  {
    id: 'hybrid2',
    label: 'Hybrid ("light" mapId)',
    mapId: '49ae42fed52588c3',
    mapTypeId: MapTypeId.HYBRID,
  },
  {
    id: 'terrain2',
    label: 'Terrain ("light" mapId)',
    mapId: '49ae42fed52588c3',
    mapTypeId: MapTypeId.TERRAIN,
  },
]

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const [mapConfig, setMapConfig] = createSignal<MapConfig>(MAP_CONFIGS[0])

  return (
    <>
      <APIProvider apiKey={API_KEY}>
        <Map
          style={{ height: '500px', width: '100%' }}
          defaultCenter={{ lat: 22, lng: 0 }}
          defaultZoom={3}
          mapId={mapConfig().mapId || null}
          mapTypeId={mapConfig().mapTypeId}
          styles={mapConfig().styles}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        />

        <ControlPanel
          mapConfigs={MAP_CONFIGS}
          mapConfigId={mapConfig().id}
          onMapConfigChange={(config) => config && setMapConfig(config)}
        />
      </APIProvider>
    </>
  )
}

const ControlPanel: Component<{
  mapConfigs: MapConfig[]
  mapConfigId: string
  onMapConfigChange: (id: MapConfig | null) => void
}> = (props) => {
  return (
    <Card class="absolute top-4 right-4 z-10">
      <CardHeader>
        <CardTitle>Select Map Style</CardTitle>
      </CardHeader>
      <CardContent>
        <Select<MapConfig>
          value={props.mapConfigs.find((s) => s.id === props.mapConfigId)}
          onChange={props.onMapConfigChange}
          options={props.mapConfigs}
          optionValue={(item: any) => item.id}
          placeholder="Select a theme…"
          itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue.label}</SelectItem>}
        >
          <SelectTrigger aria-label="Theme" class="w-full">
            <SelectValue<MapConfig>>{(state) => state.selectedOption().label}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </CardContent>
    </Card>
  )
}
