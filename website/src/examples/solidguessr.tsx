import {
  CogIcon,
  FlagIcon,
  MapPinHouseIcon,
  MapPinPlusIcon,
  MinusIcon,
  MoveDownRightIcon,
  MoveUpLeftIcon,
  PinIcon,
  PlusIcon,
  UndoIcon,
} from 'lucide-solid'
import { AdvancedMarker, AdvancedMarkerAnchorPoint, APIProvider, Map, useMap } from 'solid-google-maps/dist'
import { Component, createEffect, createMemo, createSignal, For, on, onCleanup, onMount, Show } from 'solid-js'

import { Button } from '~/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const locations: google.maps.LatLngLiteral[] = [
  { lat: -33.89756736409742, lng: 151.2188886999063 },
  { lat: 41.892380557979585, lng: 12.553496447663361 },
  { lat: 41.90071331182757, lng: 12.483116765608905 },
  { lat: -33.92150150348858, lng: 151.02525466670318 },
  { lat: 40.38923158905429, lng: -3.7279634881259383 },
  { lat: 51.772656076332446, lng: -1.2557207044490082 },
  { lat: 59.320967812401705, lng: 18.0571946871627 },
  { lat: 54.322180241754474, lng: -4.387812020583297 },
  { lat: 45.429925109772604, lng: -73.59583295468477 },
  { lat: 41.83811481187622, lng: -87.64174235239844 },
  { lat: 36.16584782037696, lng: -86.78196128522292 },
]

export default function App() {
  return (
    <APIProvider apiKey={API_KEY}>
      <GeoguessrGameView />
    </APIProvider>
  )
}

const GeoguessrGameView: Component = () => {
  const [randomLocation, setRandomLocation] = createSignal<google.maps.LatLngLiteral>(
    locations[Math.floor(Math.random() * locations.length)],
  )

  const map = useMap('streetview')
  const panorama = createMemo(() => map()?.getStreetView())
  const [heading, setHeading] = createSignal(270)
  const [positionStack, setPositionStack] = createSignal<google.maps.LatLngLiteral[]>([])
  const [currentPosition, setCurrentPosition] = createSignal<google.maps.LatLngLiteral>(randomLocation())
  const [checkpoint, setCheckpoint] = createSignal<google.maps.LatLngLiteral | null>(null)
  const [polyline, setPolyline] = createSignal<google.maps.Polyline | null>(null)
  const [roundActive, setRoundActive] = createSignal(true)
  const [guess, setGuess] = createSignal<google.maps.LatLngLiteral | null>(null)

  let skipPositionEvent = 1

  // When the panorama is created, we want to set up the initial settings and listeners
  createEffect(
    on(
      () => ({ panorama: panorama() }),
      ({ panorama }) => {
        if (!panorama) return
        panorama.setVisible(true)
        panorama.setPosition(randomLocation())
        panorama.setOptions({
          enableCloseButton: false,
          disableDefaultUI: true,
          showRoadLabels: false,
          linksControl: true,
        })
        panorama.setPov({
          heading: 270,
          pitch: 0,
        })
        const headingListener = panorama.addListener('pov_changed', () => {
          const pov = panorama.getPov()
          setHeading(pov.heading)
        })

        const positionListener = panorama.addListener('position_changed', () => {
          const position = panorama.getPosition()?.toJSON()
          if (position) {
            // Navigating using .setPosition() triggers the position_changed event twice, so if we don't want to add the new location to the stack, we skip the event
            if (skipPositionEvent <= 0) setPositionStack((state) => [currentPosition(), ...state].slice(0, 30))
            setCurrentPosition(position)
          }
          skipPositionEvent--
        })

        onCleanup(() => {
          headingListener.remove()
          positionListener.remove()
        })
      },
    ),
  )

  // When the round is finished, we want to hide the panorama and disable gestures on the map
  createEffect(() => {
    if (!panorama()) return
    if (roundActive()) {
      panorama()!.setVisible(true)
      map()?.setOptions({ gestureHandling: 'greedy' })
    } else {
      panorama()!.setVisible(false)
      map()?.setOptions({ gestureHandling: 'none' })
    }
  })

  // When we have both the random location and the guess, we want to fit the hidden map to the bounds of both
  createEffect(() => {
    if (guess()) {
      const bounds = new google.maps.LatLngBounds()
      bounds.extend(randomLocation())
      bounds.extend(guess()!)
      map()?.fitBounds(bounds, 100)
    }
  })

  // Create the polyline that connects the random location with the guess
  createEffect(() => {
    if (!map()) return null

    setPolyline(new google.maps.Polyline({ map: map()! }))

    onCleanup(() => {
      polyline()?.setMap(null)
      setPolyline(null)
    })
  })

  // When we have both the random location and the guess, we want to draw a line between them
  createEffect(() => {
    if (guess() && polyline()) {
      polyline()!.setPath([randomLocation(), guess()!])
    }
  })

  // When we have both the random location and the guess, we want to calculate the distance between them and score
  const result = createMemo(() => {
    if (!guess())
      return {
        distance: {
          number: 0,
          unit: 'm',
        },
        score: 0,
      }

    const distance = Math.round(google.maps.geometry.spherical.computeDistanceBetween(randomLocation(), guess()!))

    const distanceUnit =
      distance < 1000
        ? {
            number: distance,
            unit: 'm',
          }
        : distance < 10000
        ? {
            number: Math.round(distance / 10) / 100,
            unit: 'km',
          }
        : {
            number: Math.round(distance / 1000),
            unit: 'km',
          }

    return {
      distance: distanceUnit,
      score: Math.round(5000 * Math.exp(-10 * (distance / 14916862))),
    }
  })

  const handleGuess = (location: google.maps.LatLngLiteral) => {
    setRoundActive(false)
    setGuess(location)
  }

  const pickNextLocation = () => {
    // Prevent the same location from being picked twice in a row
    const newLocation = locations[Math.floor(Math.random() * locations.length)]
    if (newLocation.lat === randomLocation().lat && newLocation.lng === randomLocation().lng) {
      return pickNextLocation()
    }
    setRandomLocation(newLocation)
    // Reset panorama location
    skipPositionEvent = 2
    panorama()!.setPosition(randomLocation())
    panorama()!.setZoom(1)
    // Reset game state
    setPositionStack([])
    setCheckpoint(null)
    setGuess(null)
    setRoundActive(true)
  }

  const handleReturnToLastPosition = () => {
    if (positionStack().length > 0) {
      skipPositionEvent = 2
      const lastPosition = positionStack()[0]
      panorama()!.setPosition(lastPosition)
      setPositionStack((state) => state.slice(1))
    }
  }

  const handleSetCheckpoint = () => {
    setCheckpoint(currentPosition())
  }

  const handleReturnToCheckpoint = () => {
    if (checkpoint()) {
      skipPositionEvent = 2
      panorama()!.setPosition(checkpoint())
      const checkpointIndex = positionStack().findIndex(
        (pos) => pos.lat === checkpoint()!.lat && pos.lng === checkpoint()!.lng,
      )
      if (checkpointIndex >= 0) {
        setPositionStack((state) => state.slice(checkpointIndex + 1))
      } else {
        setPositionStack([])
      }
      setCheckpoint(null)
    }
  }

  const handleReturnToStart = () => {
    skipPositionEvent = 2
    panorama()!.setPosition(randomLocation())
    setPositionStack([])
  }

  const handleZoomIn = () => {
    panorama()!.setZoom(panorama()!.getZoom() + 1)
  }

  const handleZoomOut = () => {
    panorama()!.setZoom(panorama()!.getZoom() - 1)
  }

  // Keyboard shortcuts
  const handleKeyPress = (ev: KeyboardEvent) => {
    if (ev.key === ' ' && !roundActive()) {
      ev.preventDefault()
      pickNextLocation()
    }
    if (ev.key === 'z') {
      ev.preventDefault()
      handleReturnToLastPosition()
    }
    if (ev.key === 'c') {
      if (checkpoint()) {
        handleReturnToCheckpoint()
      } else {
        handleSetCheckpoint()
      }
    }
    if (ev.key === 'r') {
      handleReturnToStart()
    }
  }

  // Add keyboard shortcuts listener
  onMount(() => {
    document.addEventListener('keydown', handleKeyPress)

    onCleanup(() => {
      document.removeEventListener('keydown', handleKeyPress)
    })
  })

  return (
    <div class="flex flex-col w-full relative h-[calc(100vh-4rem)]">
      <Map
        id="streetview"
        class="h-full w-full grow"
        mapId="DEMO_MAP_ID"
        defaultZoom={3}
        defaultCenter={randomLocation()}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        <AdvancedMarker position={randomLocation()} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
          <GeoguessrLocationPin />
        </AdvancedMarker>
        <Show when={guess()}>
          <AdvancedMarker position={guess()} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
            <GeoGuessrUserPin />
          </AdvancedMarker>
        </Show>
      </Map>
      <Show when={roundActive()}>
        <div class="absolute top-8 w-full grid grid-cols-3 z-10 px-8 select-none">
          <div class="flex items-center">
            <GeoguessrLogo />
          </div>
          <div class="flex items-center justify-center">
            <GeoguessrCompass heading={heading()} />
          </div>
        </div>
        <div class="absolute bottom-8 px-8 flex justify-between w-full">
          <GeoguessrControls
            checkpoint={checkpoint()}
            positionStack={positionStack()}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onReturnToLastPosition={handleReturnToLastPosition}
            onSetCheckpoint={handleSetCheckpoint}
            onReturnToCheckpoint={handleReturnToCheckpoint}
            onReturnToStart={handleReturnToStart}
          />
          <GeoguessrMapView onGuess={handleGuess} />
        </div>
      </Show>
      <Show when={!roundActive()}>
        <GeoguessrResultView result={result()} onPickNextLocation={pickNextLocation} />
      </Show>
    </div>
  )
}

const GeoguessrMapView: Component<{
  onGuess: (location: google.maps.LatLngLiteral) => void
}> = (props) => {
  const [location, setLocation] = createSignal<google.maps.LatLngLiteral | null>(null)
  const [hovered, setHovered] = createSignal(false)
  const [pinned, setPinned] = createSignal(false)
  const [size, setSize] = createSignal(1)

  const handleGuess = () => {
    props.onGuess(location()!)
  }

  const open = createMemo(() => hovered() || pinned())

  let timeout: ReturnType<typeof setTimeout> | null = null

  // Show the controls when the user hovers over the map
  const handleHover = () => {
    if (timeout) clearTimeout(timeout)
    setHovered(true)
  }

  // Close the controls after 1 second of inactivity
  const handleLeave = () => {
    timeout = setTimeout(() => setHovered(false), 1000)
  }

  onCleanup(() => {
    if (timeout) clearTimeout(timeout)
  })

  return (
    <div class="flex flex-col gap-4 z-10 relative" onMouseOver={() => handleHover()} onMouseOut={() => handleLeave()}>
      <div
        class={cn(
          'absolute top-0 left-0 bg-black/40 z-0 -translate-y-full px-2 py-1 flex gap-2 dark rounded-t-sm',
          !open() && 'hidden',
        )}
      >
        <Button
          size="icon"
          class="rounded-full size-5 p-2 [&_svg]:size-3"
          disabled={size() == 3}
          onClick={() => setSize(size() + 1)}
        >
          <MoveUpLeftIcon />
        </Button>
        <Button
          size="icon"
          class="rounded-full size-5 p-2 [&_svg]:size-3"
          disabled={size() == 0}
          onClick={() => setSize(size() === 0 ? 0 : size() - 1)}
        >
          <MoveDownRightIcon />
        </Button>
        <Button size="icon" class="rounded-full size-5 p-2 [&_svg]:size-3" onClick={() => setPinned(!pinned())}>
          <PinIcon class={cn('transition-transform', !pinned() && 'rotate-90')} />
        </Button>
      </div>

      <Map
        id="map"
        mapId="DEMO_MAP_ID"
        class={cn(
          'transition-all duration-300 w-52 h-28',
          open() && size() == 0 && 'w-[15rem] h-36',
          open() && size() == 1 && 'w-[28rem] h-[19rem]',
          open() && size() == 2 && 'w-[40rem] h-[28rem]',
          open() && size() == 3 && 'w-[60rem] h-[31rem]',
        )}
        defaultZoom={1}
        defaultCenter={{ lat: 0, lng: 0 }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        onClick={(ev) => setLocation(ev.detail.latLng || null)}
      >
        <Show when={location()}>
          <AdvancedMarker position={location()} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
            <GeoGuessrUserPin />
          </AdvancedMarker>
        </Show>
      </Map>
      <Button
        disabled={!location()}
        onClick={() => handleGuess()}
        class="rounded-full uppercase font-bold text-xs italic hover:scale-110 transition-transform"
        style={
          !location()
            ? {}
            : {
                background: '#6cb928',
                'box-shadow':
                  '0 0.275rem 1.125rem rgba(0, 0, 0, .25), inset 0 0.0625rem 0 hsla(0, 0%, 100%, .2), inset 0 -0.125rem 0 rgba(0, 0, 0, .3)',
                'background-image': 'radial-gradient(150% 160% at 50% 15%, hsla(0,0%,100%,.6) 0, transparent 30%)',
                'text-shadow': '0 0.0625rem 0.125rem #1a1a2e',
              }
        }
      >
        {!location() ? 'Place your pin on the map' : 'Guess'}
      </Button>
    </div>
  )
}

const GeoguessrCompass: Component<{ heading: number }> = (props) => {
  // Compass directions
  const compassDirections = [
    {
      value: 315,
      label: 'NW',
    },
    {
      value: 0,
      label: 'N',
    },
    {
      value: 45,
      label: 'NE',
    },
    {
      value: 90,
      label: 'E',
    },
    {
      value: 135,
      label: 'SE',
    },
    {
      value: 180,
      label: 'S',
    },
    {
      value: 225,
      label: 'SW',
    },
    {
      value: 270,
      label: 'W',
    },
  ]

  const latitudeWidth = 6.75
  const pixelsPerDegrees = 0.15
  const latitudesArrayWidth = (1 + 2 * compassDirections.length) * 3.375 - 3.375
  const labelWidth = 1.5
  const latitudePadding = 2.625
  const o = latitudePadding + labelWidth

  const makeOffset = (index: number) =>
    createMemo(() => {
      const l = (latitudeWidth / 2) * (1 + 2 * index)
      const s = -props.heading * pixelsPerDegrees

      let c = l + s

      if (c < -o) {
        c = c + latitudesArrayWidth
      }
      if (c + o > latitudesArrayWidth) {
        c = c - latitudesArrayWidth
      }

      return c - l
    })

  return (
    <div class="bg-black/40 rounded-full left-1/2 h-8 w-[240px] z-10">
      <div class="flex flex-nowrap h-8 overflow-hidden w-full items-center">
        <For each={compassDirections}>
          {(dir, index) => {
            const offset = makeOffset(index())
            return (
              <div
                class="text-black font-bold text-sm flex grow-0 shrink-0 basis-auto h-4 relative text-center w-[6.75rem]"
                style={{
                  transform: `translateX(${offset()}rem)`,
                }}
              >
                {/* Compass Lines */}
                <div
                  class="absolute top-0.5 bottom-0.5 left-0 w-[calc(50%-0.5rem)]"
                  style={{
                    background:
                      'repeating-linear-gradient(to right, hsla(0,0%,100%,.6), hsla(0,0%,100%,.6) 1px, transparent 1px, transparent 12px)',
                  }}
                ></div>
                <div
                  class="absolute top-0.5 bottom-0.5 right-[-1px] w-[calc(50%-0.5rem)]"
                  style={{
                    background:
                      'repeating-linear-gradient(to left, hsla(0,0%,100%,.6), hsla(0,0%,100%,.6) 1px, transparent 1px, transparent 12px)',
                  }}
                ></div>
                {/* Compass Labels */}
                <span class="items-center text-white flex h-full justify-center w-full">{dir.label}</span>
              </div>
            )
          }}
        </For>
      </div>
    </div>
  )
}

const GeoguessrControls: Component<{
  positionStack: google.maps.LatLngLiteral[]
  checkpoint: google.maps.LatLngLiteral | null
  onZoomIn: () => void
  onZoomOut: () => void
  onReturnToLastPosition: () => void
  onSetCheckpoint: () => void
  onReturnToCheckpoint: () => void
  onReturnToStart: () => void
}> = (props) => {
  return (
    <div class="grid grid-cols-2 gap-4 self-end mb-4 z-10">
      <div class="flex flex-col gap-4">
        <div class="flex flex-col">
          <Tooltip placement="top">
            <TooltipTrigger
              as={Button}
              size="icon"
              class="w-10 rounded-t-full pb-2 h-12"
              onClick={() => props.onZoomIn()}
            >
              <PlusIcon class="size-6" />
            </TooltipTrigger>
            <TooltipContent class="dark">Zoom in</TooltipContent>
          </Tooltip>
          <Tooltip placement="bottom">
            <TooltipTrigger
              as={Button}
              size="icon"
              class="w-10 rounded-b-full pt-2 h-12"
              onClick={() => props.onZoomOut()}
            >
              <MinusIcon class="size-6" />
            </TooltipTrigger>
            <TooltipContent class="dark">Zoom out</TooltipContent>
          </Tooltip>
        </div>
        <Tooltip placement="top">
          <TooltipTrigger as={Button} size="icon" class="size-10 rounded-full">
            <CogIcon class="size-6" />
          </TooltipTrigger>
          <TooltipContent class="dark">Options</TooltipContent>
        </Tooltip>
      </div>
      <div class="flex flex-col gap-4">
        <Tooltip placement="right">
          <TooltipTrigger
            as={Button}
            disabled={props.positionStack.length === 0}
            size="icon"
            class="size-10 rounded-full"
            onClick={() => props.onReturnToLastPosition()}
          >
            <UndoIcon class="size-6" />
          </TooltipTrigger>
          <TooltipContent class="dark">Undo move (Z)</TooltipContent>
        </Tooltip>
        <Show
          when={!props.checkpoint}
          fallback={
            <Tooltip placement="right">
              <TooltipTrigger
                as={Button}
                size="icon"
                class="size-10 rounded-full"
                onClick={() => props.onReturnToCheckpoint()}
              >
                <MapPinHouseIcon class="size-6" />
              </TooltipTrigger>
              <TooltipContent class="dark">Return to checkpoint (C)</TooltipContent>
            </Tooltip>
          }
        >
          <Tooltip placement="right">
            <TooltipTrigger
              as={Button}
              size="icon"
              class="size-10 rounded-full"
              onClick={() => props.onSetCheckpoint()}
            >
              <MapPinPlusIcon class="size-6" />
            </TooltipTrigger>
            <TooltipContent class="dark">Set checkpoint (C)</TooltipContent>
          </Tooltip>
        </Show>
        <Tooltip placement="right">
          <TooltipTrigger as={Button} size="icon" class="size-10 rounded-full" onClick={() => props.onReturnToStart()}>
            <FlagIcon class="size-6" />
          </TooltipTrigger>
          <TooltipContent class="dark">Return to start (R)</TooltipContent>
        </Tooltip>
      </div>
    </div>
  )
}

const GeoguessrResultView: Component<{
  result: {
    distance: {
      number: number
      unit: string
    }
    score: number
  }
  onPickNextLocation: () => void
}> = (props) => {
  return (
    <div class="bg-[#1a1a2e] text-center flex justify-center items-center text-white py-8">
      <div class="grid max-w-3xl grid-cols-3 gap-12">
        <div class="flex flex-col justify-center gap-1">
          <div
            class="text-4xl font-extrabold"
            style={{
              'text-shadow':
                '0 .25rem 0 rgba(16,16,28,.5),.125rem .125rem .5rem #00a2fe,0 -.25rem .5rem #7950e5,-.25rem .5rem .5rem #3ae8bd,0 .375rem 2rem #7950e5,0 0 0 #d9d7f0,0 0 1.5rem rgba(161,155,217,.65),.25rem .25rem 1rem #a19bd9',
            }}
          >
            {props.result.distance.number.toLocaleString()} {props.result.distance.unit}
          </div>
          <span class="text-[10px] uppercase italic text-gray-400 font-bold">from location</span>
        </div>
        <div class="flex flex-col justify-center gap-2">
          <Button
            size="lg"
            style={{
              background: '#6cb928',
              'box-shadow':
                '0 0.275rem 1.125rem rgba(0, 0, 0, .25), inset 0 0.0625rem 0 hsla(0, 0%, 100%, .2), inset 0 -0.125rem 0 rgba(0, 0, 0, .3)',
              'background-image': 'radial-gradient(150% 160% at 50% 15%, hsla(0,0%,100%,.6) 0, transparent 30%)',
              'text-shadow': '0 0.0625rem 0.125rem #1a1a2e',
            }}
            class="rounded-full h-14 px-16 text-lg uppercase font-bold italic hover:scale-110 transition-transform"
            onClick={() => props.onPickNextLocation()}
          >
            Next
          </Button>
          <span class="text-xs text-gray-400 font-medium">
            Hit <span class="border border-gray-400 rounded p-0.5">space</span> to continue
          </span>
        </div>
        <div class="flex flex-col justify-center gap-1">
          <div
            class="text-4xl font-extrabold"
            style={{
              'text-shadow':
                '0 .25rem 0 #bf7b2e,.125rem .125rem .5rem #e94560,0 -.25rem .5rem #ffa43d,-.25rem .5rem .5rem #fecd19,0 .375rem 2rem #e94560,0 0 0 #e94560,0 0 1.5rem #e94560,.25rem .25rem 1rem #fecd19',
            }}
          >
            {props.result.score.toLocaleString()}
          </div>
          <span class="text-[10px] uppercase italic text-gray-400 font-bold">of 5,000 points</span>
        </div>
      </div>
    </div>
  )
}

const GeoGuessrUserPin: Component = () => {
  return (
    <div class="w-9 h-9 bg-white rounded-full shadow-lg flex justify-center items-center overflow-hidden p-1">
      <img class="w-full rounded-full" src="/guess-location.webp" alt="Your Guess" />
    </div>
  )
}

const GeoguessrLocationPin: Component = () => {
  return (
    <div class="w-9 h-9 bg-white rounded-full shadow-lg flex justify-center items-center overflow-hidden p-1">
      <img class="w-full rounded-full" src="/correct-location.webp" alt="Correct location" />
    </div>
  )
}

const GeoguessrLogo: Component = () => {
  return (
    <span
      class="text-3xl text-white font-bold"
      style={{
        '-webkit-text-stroke': '5px #CC302E',
        'paint-order': 'stroke fill',
      }}
    >
      SolidGuessr
    </span>
  )
}
