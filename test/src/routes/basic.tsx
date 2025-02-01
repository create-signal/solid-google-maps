import { APIProvider, Map } from 'solid-google-maps'
export default function About() {
  return (
    <main style={{ width: '100vw', height: '100vh' }}>
      <APIProvider apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}>
        <Map
          mapId={'bf51a910020fa25a'}
          defaultZoom={5}
          defaultCenter={{ lat: 47.53, lng: -122.34 }}
          gestureHandling={'greedy'}
          disableDefaultUI={true}
        ></Map>
      </APIProvider>
    </main>
  )
}
