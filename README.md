# Solid Google Maps [![solid-google-maps minzip package size](https://img.shields.io/bundlephobia/minzip/solid-google-maps)](https://www.npmjs.com/package/solid-google-maps?activeTab=code) [![solid-google-maps package version](https://img.shields.io/npm/v/solid-google-maps.svg?colorB=green)](https://www.npmjs.com/package/solid-google-maps)

Solid Google Maps provides a loader and simple reactive bindings for the Google Maps API

Demo and examples: [https://solid-google-maps.vercel.app/](https://solid-google-maps.vercel.app/)

## Install

```bash
pnpm install solid-google-maps
```

## Map

```tsx
import { APIProvider, Map } from 'solid-google-maps'

const BasicExample = () => {
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
```

## Advanced Marker

```tsx
import { APIProvider, Map } from 'solid-google-maps'

const MarkerExample = () => {
  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ height: '500px', width: '100%' }}
        defaultZoom={3}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        <AdvancedMarker position={{ lat: 22.54992, lng: 0 }}>
          <CustomIcon />
        </AdvancedMarker>
      </Map>
    </APIProvider>
  )
}
```

## Info Window (Controlled State)

```tsx
import { APIProvider, Map, InfoWindow } from 'solid-google-maps'

const MarkerExample = () => {
  const [infoWindowOpen, setInfoWindowOpen] = createSignal(false)

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ height: '500px', width: '100%' }}
        defaultZoom={3}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        <AdvancedMarker position={{ lat: 22.54992, lng: 0 }} onClick={() => setInfoWindowOpen(!infoWindowOpen())}>
          <CustomIcon />

          <InfoWindow
            open={infoWindowOpen()}
            onOpenChange={setInfoWindowOpen}
            maxWidth={200}
            headerContent={<span>Header</span>}
          >
            InfoWindow Content
          </InfoWindow>
        </AdvancedMarker>
      </Map>
    </APIProvider>
  )
}
```

## Info Window (Anchored)

```tsx
import { APIProvider, Map, InfoWindow } from 'solid-google-maps'

const AnchorExample = () => {
  const [anchor, setAnchor] = createSignal<google.maps.marker.AdvancedMarker | null>(null)

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ height: '500px', width: '100%' }}
        defaultZoom={3}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        <AdvancedMarker position={{ lat: 21, lng: 0 }} onClick={(event) => setAnchor(event.marker)}>
          <CustomIcon />
        </AdvancedMarker>
        <AdvancedMarker position={{ lat: 22, lng: 0 }} onClick={(event) => setAnchor(event.marker)}>
          <CustomIcon />
        </AdvancedMarker>

        <Show when={anchor()}>
          <InfoWindow anchor={anchor()} maxWidth={200} headerContent={<span>Header</span>}>
            InfoWindow Content
          </InfoWindow>
        </Show>
      </Map>
    </APIProvider>
  )
}
```

## Access to the Imperative API

All Components have a `ref` property that provides direct access to the Google Maps API. Additionally, the library provides a `useMap()` method that can be used to get a reference to the API. If you have multiple maps you can provide them an `id` prop and then use the ID in `useMap(id)` to specify the map you want to access. `useMap()` must be used inside the `APIProvider` component.

## Testing

First, install dependencies and Playwright browsers:

```bash
pnpm install
pnpm playwright install
```

Then ensure you've built the library:

```bash
pnpm build
```

Then run the tests using your local build against real browser engines:

```bash
pnpm test
```
