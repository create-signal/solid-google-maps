import {
  AdvancedMarker,
  AdvancedMarkerAnchorPoint,
  APIProvider,
  CollisionBehavior,
  InfoWindow,
  Map,
  Pin,
} from 'solid-google-maps'
import { Component, createSignal, For, Show } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import './advanced-marker-interaction/style.css'
export type AnchorPointName = keyof typeof AdvancedMarkerAnchorPoint

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const markers = getData()
  const Z_INDEX_SELECTED = markers.length
  const Z_INDEX_HOVER = markers.length + 1

  const [hoverId, setHoverId] = createSignal<string | null>(null)
  const [selectedId, setSelectedId] = createSignal<string | null>(null)

  const [anchorPoint, setAnchorPoint] = createSignal('BOTTOM' as AnchorPointName)
  const [selectedMarker, setSelectedMarker] = createSignal<google.maps.marker.AdvancedMarkerElement | null>(null)

  const onMouseEnter = (id: string | null) => setHoverId(id)
  const onMouseLeave = () => setHoverId(null)
  const onMarkerClick = (id: string | null, marker: google.maps.marker.AdvancedMarkerElement) => {
    if (id !== selectedId()) {
      setSelectedMarker(marker)
      setSelectedId(id)
    } else {
      setSelectedId(null)
      setSelectedMarker(null)
    }
  }

  const handleInfowindowClose = () => {
    setSelectedMarker(null)
    setSelectedId(null)
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ height: '500px', width: '100%' }}
        mapId={'bf51a910020fa25a'}
        defaultZoom={12}
        defaultCenter={{ lat: 53.55909057947169, lng: 10.005767668054645 }}
        gestureHandling={'greedy'}
        onClick={handleInfowindowClose}
        clickableIcons={false}
        disableDefaultUI
      >
        <For each={markers}>
          {(marker) => {
            const zIndex = () =>
              selectedId() === marker.id ? Z_INDEX_SELECTED : hoverId() === marker.id ? Z_INDEX_HOVER : marker.zIndex
            return (
              <>
                <Show when={marker.type === 'pin'}>
                  <AdvancedMarker
                    onClick={(event) => {
                      event.stop()
                      onMarkerClick(marker.id, event.marker)
                    }}
                    onMouseEnter={() => onMouseEnter(marker.id)}
                    onMouseLeave={onMouseLeave}
                    zIndex={zIndex()}
                    class="custom-marker"
                    style={{
                      transform: `scale(${[hoverId(), selectedId()].includes(marker.id) ? 1.3 : 1})`,
                      'transform-origin': AdvancedMarkerAnchorPoint['BOTTOM'].join(' '),
                    }}
                    position={marker.position}
                  >
                    <Pin
                      background={selectedId() === marker.id ? '#22ccff' : null}
                      borderColor={selectedId() === marker.id ? '#1e89a1' : null}
                      glyphColor={selectedId() === marker.id ? '#0f677a' : null}
                    />
                  </AdvancedMarker>
                </Show>
                <Show when={marker.type === 'html'}>
                  <>
                    <AdvancedMarker
                      position={marker.position}
                      zIndex={zIndex()}
                      anchorPoint={AdvancedMarkerAnchorPoint[anchorPoint()]}
                      class="custom-marker"
                      style={{
                        transform: `scale(${[hoverId(), selectedId()].includes(marker.id) ? 1.3 : 1})`,
                        'transform-origin': AdvancedMarkerAnchorPoint[anchorPoint()].join(' '),
                      }}
                      onClick={(event) => {
                        event.stop()
                        onMarkerClick(marker.id, event.marker)
                      }}
                      onMouseEnter={() => onMouseEnter(marker.id)}
                      collisionBehavior={CollisionBehavior.OPTIONAL_AND_HIDES_LOWER_PRIORITY}
                      onMouseLeave={onMouseLeave}
                    >
                      <div class={`custom-html-content ${selectedId() === marker.id ? 'selected' : ''}`}></div>
                    </AdvancedMarker>

                    {/* anchor point visualization marker */}
                    <AdvancedMarker
                      onClick={(event) => onMarkerClick(marker.id, event.marker)}
                      zIndex={zIndex() + 1}
                      onMouseEnter={() => onMouseEnter(marker.id)}
                      onMouseLeave={onMouseLeave}
                      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
                      position={marker.position}
                    >
                      <div class="visualization-marker"></div>
                    </AdvancedMarker>
                  </>
                </Show>
              </>
            )
          }}
        </For>
        <Show when={selectedMarker()}>
          <InfoWindow
            anchor={selectedMarker()}
            pixelOffset={[0, -2]}
            onCloseClick={handleInfowindowClose}
            headerContent={<>Marker {selectedId()}</>}
          >
            <p>Some arbitrary html to be rendered into the InfoWindow.</p>
          </InfoWindow>
        </Show>
      </Map>
      <ControlPanel
        anchorPointName={anchorPoint()}
        onAnchorPointChange={(newAnchorPoint: AnchorPointName | null) => setAnchorPoint(newAnchorPoint || 'BOTTOM')}
      />
    </APIProvider>
  )
}

type MarkerData = Array<{
  id: string
  position: google.maps.LatLngLiteral
  type: 'pin' | 'html'
  zIndex: number
}>

export function getData() {
  const data: MarkerData = []

  // create 50 random markers
  for (let index = 0; index < 50; index++) {
    data.push({
      id: String(index),
      position: { lat: rnd(53.52, 53.63), lng: rnd(9.88, 10.12) },
      zIndex: index,
      type: Math.random() < 0.5 ? 'pin' : 'html',
    })
  }

  return data
}

function rnd(min: number, max: number) {
  return Math.random() * (max - min) + min
}

const ControlPanel: Component<{
  anchorPointName: AnchorPointName
  onAnchorPointChange: (anchorPointName: AnchorPointName | null) => void
}> = (props) => {
  return (
    <Card class="absolute top-4 right-4 z-10 max-w-72">
      <CardHeader>
        <CardTitle>Advanced Marker interaction</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 space-y-4 text-sm">
        <p>
          Markers scale on hover and change their color when they are selected by clicking on them. The default z-index
          is sorted by latitude. The z-index hierarchy is "hover" on top, then "selected" and then the default
          (latitude).
        </p>
        <p>
          The orange dot on the blue markers represents the current anchor point of the marker. Use the dropdown to
          change the anchor point and see its impact.
        </p>

        <Select
          value={props.anchorPointName}
          onChange={(value) => props.onAnchorPointChange(value)}
          options={Object.keys(AdvancedMarkerAnchorPoint) as AnchorPointName[]}
          placeholder="Select anchor point…"
          itemComponent={(props) => <SelectItem item={props.item}>{props.item.rawValue}</SelectItem>}
        >
          <SelectTrigger aria-label="Anchor Points" class="w-full">
            <SelectValue>{(state) => <>{state.selectedOption()}</>}</SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </CardContent>
    </Card>
  )
}
