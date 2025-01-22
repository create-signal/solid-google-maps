import { Marker, MarkerClusterer } from '@googlemaps/markerclusterer'
import { AdvancedMarker, APIProvider, InfoWindow, Map, useMap } from 'solid-google-maps/dist'
import { Component, createDeferred, createEffect, createMemo, createSignal, For, JSX, Show, untrack } from 'solid-js'
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { CategoryData, getCategories, loadTreeDataset, Tree } from './trees'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  const [trees, setTrees] = createSignal<Tree[]>()
  const [selectedCategory, setSelectedCategory] = createSignal<string | null>(null)

  // load data asynchronously
  createEffect(() => {
    loadTreeDataset().then((data) => setTrees(data))
  })

  // get category information for the filter-dropdown
  const categories = createMemo(() => getCategories(trees()))
  const filteredTrees = createMemo(() => {
    return trees()?.filter((t) => !selectedCategory() || t.category === selectedCategory()) || []
  })

  const [selectedTreeKey, setSelectedTreeKey] = createSignal<string | null>(null)
  const selectedTree = createMemo(() =>
    selectedTreeKey() ? filteredTrees().find((t) => t.key === selectedTreeKey())! : null,
  )
  const [markers, setMarkers] = createSignal<{ [key: string]: Marker }>({})

  const [infoWindowOpen, setInfoWindowOpen] = createSignal(false)

  return (
    <APIProvider apiKey={API_KEY}>
      <Map
        style={{ height: '500px', width: '100%' }}
        mapId={'bf51a910020fa25a'}
        defaultCenter={{ lat: 43.64, lng: -79.41 }}
        defaultZoom={10}
        gestureHandling={'greedy'}
        disableDefaultUI
      >
        <ClusteredMarkers ref={setMarkers}>
          {(addToCluster) => (
            <For each={filteredTrees()}>
              {(tree) => (
                <AdvancedMarker
                  position={tree.position}
                  ref={(ref) => addToCluster(ref, tree.key)}
                  onClick={() => setSelectedTreeKey(tree.key)}
                >
                  <span class="text-lg">🌳</span>
                </AdvancedMarker>
              )}
            </For>
          )}
        </ClusteredMarkers>
        <Show when={selectedTreeKey() && markers()[selectedTreeKey()!]}>
          <InfoWindow anchor={markers()[selectedTreeKey()!]} onCloseClick={() => setSelectedTreeKey(null)} open={true}>
            {selectedTree()?.name}
          </InfoWindow>
        </Show>
        <AdvancedMarker
          position={{ lat: 43.64, lng: -79.61 }}
          title={'Toronto'}
          onClick={() => setInfoWindowOpen(!infoWindowOpen())}
        >
          <InfoWindow open={infoWindowOpen()} onOpenChange={setInfoWindowOpen}>
            I'm intentionally not clustered
          </InfoWindow>
        </AdvancedMarker>
      </Map>

      <ControlPanel categories={categories()} onCategoryChange={setSelectedCategory} />
    </APIProvider>
  )
}

const ControlPanel: Component<{
  categories: CategoryData[]
  onCategoryChange: (category: string | null) => void
}> = (props) => {
  return (
    <Card class="absolute top-4 right-4 z-10 max-w-xs">
      <CardHeader>
        <CardTitle>Filter Trees</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 space-y-4">
        <div>
          This example uses the @googlemaps/markerclusterer library to demonstrate how to render a large dataset of
          markers on the map. This example also includes a filter function to show dynamic updating of the clustered
          markers and an InfoWindow to show details about the locations.
        </div>
        <Select<CategoryData>
          onChange={(value) => props.onCategoryChange(value?.key || null)}
          options={props.categories}
          optionValue={(item: any) => item.key}
          placeholder="Filter Trees…"
          itemComponent={(props) => (
            <SelectItem item={props.item}>
              {props.item.rawValue.label} ({props.item.rawValue.count})
            </SelectItem>
          )}
        >
          <SelectTrigger aria-label="Trees" class="w-full">
            <SelectValue<CategoryData>>
              {(state) => (
                <>
                  {state.selectedOption().label} ({state.selectedOption().count})
                </>
              )}
            </SelectValue>
          </SelectTrigger>
          <SelectContent />
        </Select>
      </CardContent>
    </Card>
  )
}

export const ClusteredMarkers: Component<{
  children: (addToCluster: (marker: Marker | null, key: string) => void) => JSX.Element
  ref?: (markers: { [key: string]: Marker }) => void
}> = (props) => {
  const [markers, setMarkers] = createSignal<{ [key: string]: Marker }>({})

  createDeferred(() => {
    props.ref?.(markers())
  })

  // create the markerClusterer once the map is available and update it when
  // the markers are changed
  const map = useMap()
  const clusterer = createMemo(() => {
    if (!map()) return null

    return new MarkerClusterer({ map: map() })
  })

  createEffect(() => {
    if (!clusterer()) return

    clusterer()!.clearMarkers()
    clusterer()!.addMarkers(Object.values(markers()))
  })

  // this callback will effectively get passed as ref to the markers to keep
  // tracks of markers currently on the map
  const setMarkerRef = (marker: Marker | null, key: string) => {
    setMarkers((markers) => {
      if ((marker && markers[key]) || (!marker && !markers[key])) return markers

      if (marker) {
        return { ...markers, [key]: marker }
      } else {
        const { [key]: _, ...newMarkers } = markers

        return newMarkers
      }
    })
  }

  return props.children(setMarkerRef)
}
