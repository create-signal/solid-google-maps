import { AdvancedMarker, APIProvider, InfoWindow, Map, Marker, Pin } from 'solid-google-maps'
import { Component, createSignal, onCleanup, onMount } from 'solid-js'
import { PinIcon } from 'lucide-solid'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const MovingMarker: Component = () => {
  const [position, setPosition] = createSignal<google.maps.LatLngLiteral>({
    lat: 0,
    lng: 0,
  })

  onMount(() => {
    const interval = setInterval(() => {
      const t = performance.now()
      const lat = Math.sin(t / 2000) * 5
      const lng = Math.cos(t / 3000) * 5

      setPosition({ lat, lng })
    }, 200)

    onCleanup(() => clearInterval(interval))
  })

  return <Marker position={position()}></Marker>
}

const MarkerWithInfowindow: Component = () => {
  const [infoWindowOpen, setInfoWindowOpen] = createSignal(false)

  return (
    <>
      <AdvancedMarker
        onClick={() => setInfoWindowOpen(!infoWindowOpen())}
        position={{ lat: 28, lng: -82 }}
        title={'AdvancedMarker that opens an Infowindow when clicked.'}
      >
        <PinIcon class="size-8"></PinIcon>
        <InfoWindow
          open={infoWindowOpen()}
          onOpenChange={setInfoWindowOpen}
          maxWidth={200}
          headerContent={<span style={{ 'font-weight': 'bold' }}>Header</span>}
        >
          This is an example for the <code style={{ 'white-space': 'nowrap' }}>&lt;AdvancedMarker /&gt;</code> combined
          with an Infowindow.
        </InfoWindow>
      </AdvancedMarker>
    </>
  )
}

export default function App() {
  return (
    <APIProvider apiKey={API_KEY} libraries={['marker']}>
      <Map
        style={{ height: '500px', width: '100%' }}
        mapId={'bf51a910020fa25a'}
        defaultZoom={3}
        defaultCenter={{ lat: 12, lng: 0 }}
        gestureHandling={'greedy'}
        disableDefaultUI
      >
        {/* simple marker */}
        <Marker
          position={{ lat: 10, lng: 10 }}
          clickable={true}
          onClick={() => alert('marker was clicked!')}
          title={'clickable google.maps.Marker'}
        />

        {/* advanced marker with customized pin */}
        <AdvancedMarker position={{ lat: 20, lng: 10 }} title={'AdvancedMarker with customized pin.'}>
          <Pin background={'#22ccff'} borderColor={'#1e89a1'} glyphColor={'#0f677a'}></Pin>
        </AdvancedMarker>

        {/* advanced marker with html pin glyph */}
        <AdvancedMarker position={{ lat: 15, lng: 20 }} title={'AdvancedMarker with customized pin.'}>
          <Pin background={'#22ccff'} borderColor={'#1e89a1'} scale={1.4}>
            {/* children are rendered as 'glyph' of pin */}
            👀
          </Pin>
        </AdvancedMarker>

        {/* advanced marker with html-content */}
        <AdvancedMarker position={{ lat: 30, lng: 10 }} title={'AdvancedMarker with custom html content.'}>
          <div
            style={{
              width: '16px',
              height: '16px',
              position: 'absolute',
              top: 0,
              left: 0,
              background: '#1dbe80',
              border: '2px solid #0e6443',
              'border-radius': '50%',
              transform: 'translate(-50%, -50%)',
            }}
          ></div>
        </AdvancedMarker>

        {/* simple positioned infowindow */}
        <InfoWindow position={{ lat: 40, lng: 0 }} maxWidth={200}>
          <p>
            This is the content for another infowindow with <em>HTML</em>
            -elements.
          </p>
        </InfoWindow>

        {/* continously updated marker */}
        <MovingMarker />

        {/* simple stateful infowindow */}
        <MarkerWithInfowindow />
      </Map>
    </APIProvider>
  )
}
