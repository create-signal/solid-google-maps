import { APIProvider, MapCameraProps, Map, MapCameraChangedEvent } from 'solid-google-maps'
import { createSignal, For } from 'solid-js'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const INITIAL_CAMERA_STATE = {
  center: {
    lat: 40.7127753,
    lng: -74.0059728,
  },
  zoom: 10,
  heading: 0,
  tilt: 0,
}

export default function App() {
  const [cameraState, setCameraState] = createSignal<MapCameraProps>(INITIAL_CAMERA_STATE)

  // we only want to receive cameraChanged events from the map the
  // user is interacting with:
  const [activeMap, setActiveMap] = createSignal(1)

  const handleCameraChange = (ev: MapCameraChangedEvent) => {
    setCameraState(ev.detail)
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <div style={{ width: '100%', display: 'grid', 'grid-template-columns': 'repeat(2, 50%)' }}>
        <For each={[0, 1, 2, 3]}>
          {(i) => {
            const isActive = () => activeMap() === i

            return (
              <Map
                style={{ height: '200px', width: '100%' }}
                mapId={'bf51a910020fa25a'}
                id={`map-${i}`}
                disableDefaultUI
                gestureHandling={'greedy'}
                onCameraChanged={isActive() ? handleCameraChange : undefined}
                onMouseover={() => setActiveMap(i)}
                {...cameraState}
              ></Map>
            )
          }}
        </For>
      </div>
    </APIProvider>
  )
}
