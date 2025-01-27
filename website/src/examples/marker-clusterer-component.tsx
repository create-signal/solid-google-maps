import { Marker } from '@googlemaps/markerclusterer'
import { AdvancedMarker, APIProvider, InfoWindow, Map, MarkerClusterer } from 'solid-google-maps'
import { Component, createEffect, createMemo, createSignal, Show } from 'solid-js'
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
        <MarkerClusterer
          each={filteredTrees()}
          key="key"
          ref={setMarkers}
          clusterMarker={(props, count) => (
            <AdvancedMarker {...props}>
              <span class="flex size-8 bg-background rounded-full border-2 border-foreground justify-center items-center">
                {count}
              </span>
            </AdvancedMarker>
          )}
        >
          {(tree, props, key) => (
            <AdvancedMarker position={tree.position} {...props} onClick={() => setSelectedTreeKey(key)}>
              <span class="text-lg">🌳</span>
            </AdvancedMarker>
          )}
        </MarkerClusterer>

        <Show when={selectedTreeKey() && markers()[selectedTreeKey()!]}>
          <InfoWindow anchor={markers()[selectedTreeKey()!]} onCloseClick={() => setSelectedTreeKey(null)}>
            {selectedTree()?.name}
          </InfoWindow>
        </Show>
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
    <Card class="absolute top-4 right-4 z-10 max-w-72">
      <CardHeader>
        <CardTitle>Filter Trees</CardTitle>
      </CardHeader>
      <CardContent class="flex flex-col gap-4 space-y-4">
        <div>
          This example uses the MarkerClusterer component to render a large dataset of markers on the map. It is
          possible to render your own cluster markers using the clusterMarker prop.
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
