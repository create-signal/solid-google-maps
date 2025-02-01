import { AdvancedMarker, APIProvider, Map } from 'solid-google-maps'
import { Component, createSignal, Show } from 'solid-js'
export default function About() {
  const position = { lat: 47.53, lng: -122.34 }
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          mapId={'bf51a910020fa25a'}
          defaultZoom={5}
          defaultCenter={{ lat: 47.53, lng: -122.34 }}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        >
          <CustomAdvancedMarker position={position} />
        </Map>
      </APIProvider>
    </main>
  )
}

const CustomAdvancedMarker: Component<{ position: google.maps.LatLngLiteral }> = (props) => {
  const [clicked, setClicked] = createSignal(false)
  const [hovered, setHovered] = createSignal(false)

  const [count, setCount] = createSignal(0)
  return (
    <>
      <AdvancedMarker
        position={props.position}
        title={'AdvancedMarker with custom html content.'}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        class={`${clicked() ? 'clicked' : ''} ${hovered() ? 'hovered' : ''}`}
        onClick={() => setClicked(!clicked())}
      >
        <div class="custom-pin">
          <div class="trigger">Click here to Expand</div>
          <Show when={clicked()}>
            <button data-testid="toggled" class="counter">
              <a
                data-testid="add"
                onClick={(e) => {
                  e.stopPropagation()

                  setCount(count() + 1)
                }}
                onDblClick={(e) => {
                  e.stopPropagation()

                  setCount(count() + 1)
                }}
              >
                Add One
              </a>
              <span data-testid="count">Count: {count()}</span>
            </button>
          </Show>
        </div>

        <div class="tip" />
      </AdvancedMarker>
    </>
  )
}
