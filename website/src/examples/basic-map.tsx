import { APIProvider, Map } from 'solid-google-maps'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ height: '500px', width: '100%' }}
        defaultZoom={3}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      />
    </APIProvider>
  )
}
