import { AdvancedMarker, APIProvider, InfoWindow, Map, useMapsLibrary } from 'solid-google-maps'
import { Component, createEffect, createResource, createSignal, For, onCleanup, Show } from 'solid-js'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '~/components/ui/command'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const AutocompleteMap: Component = () => {
  const placesLibary = useMapsLibrary('places')

  const [map, setMap] = createSignal<google.maps.Map | null>(null)
  const [sessionToken, setSessionToken] = createSignal<google.maps.places.AutocompleteSessionToken>()
  const [autocompleteService, setAutocompleteService] = createSignal<google.maps.places.AutocompleteService | null>(
    null,
  )
  const [placesService, setPlacesService] = createSignal<google.maps.places.PlacesService | null>(null)
  const [inputValue, setInputValue] = createSignal<string>('')
  const [open, setOpen] = createSignal(false)
  const [infowindowOpen, setInfowindowOpen] = createSignal(true)
  const [selected, setSelected] = createSignal<google.maps.places.AutocompletePrediction | null>(null)
  let inputRef: HTMLInputElement | null = null

  createEffect(() => {
    if (!map() || !placesLibary()) return

    setSessionToken(new google.maps.places.AutocompleteSessionToken())
    setAutocompleteService(new google.maps.places.AutocompleteService())
    setPlacesService(new google.maps.places.PlacesService(map()!))

    onCleanup(() => {
      setAutocompleteService(null)
    })
  })

  const [results] = createResource(
    () => ({
      service: autocompleteService(),
      value: inputValue(),
    }),
    async ({ service, value }) => {
      if (!value || !service) return []

      const response = await service.getPlacePredictions({ input: value, sessionToken: sessionToken() })

      return response.predictions
    },
    { initialValue: [] },
  )

  const [placeDetails] = createResource(
    () => (placesService() && selected() ? selected()!.place_id : undefined),
    async (placeId) => {
      if (!placeId) return

      const response = await new Promise<google.maps.places.PlaceResult | null>((resolve, reject) =>
        placesService()?.getDetails({ placeId }, (result, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK) {
            resolve(result)
          } else {
            reject(status)
          }
        }),
      )

      return response
    },
    { initialValue: null },
  )

  createEffect(() => {
    if (!placeDetails.latest?.geometry?.location) return
    map()?.setCenter(placeDetails()!.geometry!.location!.toJSON())
    map()?.setZoom(15)
    setInfowindowOpen(true)
  })

  const handleBlur = () => {
    setInputValue(selected()?.structured_formatting.main_text || '')
    setOpen(false)
  }

  const handleSelectOption = (selectedOption: google.maps.places.AutocompletePrediction) => {
    setInputValue(selectedOption.structured_formatting.main_text)
    setSelected(selectedOption)
    setTimeout(() => {
      inputRef?.blur()
    }, 0)
  }

  return (
    <>
      <Map
        ref={setMap}
        style={{ height: '500px', width: '100%' }}
        mapId="DEMO_MAP_ID"
        defaultZoom={3}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        <Show when={placeDetails.latest}>
          {(placeDetails) => (
            <AdvancedMarker position={placeDetails().geometry!.location} onClick={() => setInfowindowOpen(true)}>
              <InfoWindow minWidth={250} maxWidth={250} open={infowindowOpen()} onOpenChange={setInfowindowOpen}>
                <div class="flex flex-col gap-4">
                  <div class="flex flex-col">
                    <span class="font-semibold mb-1">{placeDetails().name}</span>
                    <span class="text-sm">{placeDetails().formatted_address}</span>
                    <span class="text-sm">{placeDetails().website}</span>
                  </div>
                  <Show when={placeDetails().rating}>
                    <div class="flex justify-between">
                      <span class="text-sm">Rating: {placeDetails().rating}</span>
                      <span class="text-sm">Total Ratings: {placeDetails().user_ratings_total}</span>
                    </div>
                  </Show>
                </div>
              </InfoWindow>
            </AdvancedMarker>
          )}
        </Show>
      </Map>
      <div class="absolute top-4 left-1/2 -translate-x-1/2">
        <Command shouldFilter={false} class="w-96">
          <CommandInput
            value={inputValue()}
            onValueChange={setInputValue}
            placeholder="Search for a place"
            onFocus={() => setOpen(true)}
            onBlur={handleBlur}
            ref={(r) => (inputRef = r)}
          />
          <CommandList class={open() ? 'block' : 'hidden'}>
            <Show when={results.loading}>
              <CommandEmpty>Loading...</CommandEmpty>
            </Show>
            <Show when={!results.loading && results.latest.length === 0 && inputValue().length > 0}>
              <CommandEmpty>No Results</CommandEmpty>
            </Show>
            <Show when={results.latest.length > 0}>
              <CommandGroup>
                <For each={results.latest}>
                  {(option) => {
                    return (
                      <CommandItem
                        value={option.place_id}
                        onMouseDown={(event) => {
                          event.preventDefault()
                          event.stopPropagation()
                        }}
                        onSelect={() => handleSelectOption(option)}
                      >
                        <div class="flex flex-col">
                          <span class="font-semibold">{option.structured_formatting.main_text}</span>
                          <span class="text-sm">{option.structured_formatting.secondary_text}</span>
                        </div>
                      </CommandItem>
                    )
                  }}
                </For>
              </CommandGroup>
            </Show>
          </CommandList>
        </Command>
      </div>
    </>
  )
}

export default function App() {
  return (
    <APIProvider apiKey={API_KEY}>
      <AutocompleteMap />
    </APIProvider>
  )
}
