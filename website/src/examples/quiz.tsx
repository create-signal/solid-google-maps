/* Credit to the game that inspired this demo https://geography.games/europe-quiz by https://zcreativelabs.com/ */

import { Meta } from '@solidjs/meta'

import { Duration, intervalToDuration } from 'date-fns'
import {
  CastleIcon,
  CircleHelp,
  MessageCircleQuestionIcon,
  MountainSnowIcon,
  NewspaperIcon,
  RotateCwIcon,
  TrophyIcon,
} from 'lucide-solid'
import { AdvancedMarker, AdvancedMarkerAnchorPoint, APIProvider, Map, useMap } from 'solid-google-maps'
import {
  Component,
  ComponentProps,
  createDeferred,
  createEffect,
  createMemo,
  createSignal,
  For,
  on,
  onCleanup,
  onMount,
  Show,
} from 'solid-js'
import { isServer } from 'solid-js/web'
import { toast } from 'solid-sonner'
import { Badge } from '~/components/ui/badge'
import { Button } from '~/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '~/components/ui/popover'
import { Toaster } from '~/components/ui/sonner'
import { cn } from '~/lib/utils'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

type GameType = 'learning' | 'default' | 'difficult'

type GameMode = { label: string; minutes: number; hints: number }

type GameResult = {
  highestLevel: number
  time: Duration
  guessedCountries: number
  hintsUsed: number
  longestGuessStreak: number
}

type Country = {
  name: string
  placeId: string
  code: string
  capital: string
  alternativeNames?: string[]
  hints?: [string, string]
  showPin?: {
    lat: number
    lng: number
  }
}

const gameModes: Record<GameType, GameMode> = {
  learning: { label: 'Learning', minutes: 8, hints: 3 },
  default: { label: 'Default', minutes: 4, hints: 2 },
  difficult: { label: 'Difficult', minutes: 2, hints: 1 },
}

export default function App() {
  const [screen, setScreen] = createSignal<'menu' | 'game' | 'results'>('menu')
  const [mode, setMode] = createSignal<GameMode>(gameModes['learning'])
  const [results, setResults] = createSignal<GameResult | null>({
    highestLevel: 0,
    time: { minutes: 0, seconds: 0 },
    guessedCountries: 0,
    hintsUsed: 0,
    longestGuessStreak: 0,
  })

  const handlePickGame = (game: GameMode) => {
    setMode(game)
    setScreen('game')
  }

  const handleGameFinish = (results: GameResult) => {
    setResults(results)
    setScreen('results')
  }

  return (
    <APIProvider apiKey={API_KEY}>
      <Meta name="viewport" content="width=device-width, user-scalable=no" />
      <div class="min-h-[calc(100vh-10rem)] flex flex-col justify-center w-full font-aleo text-quiz-foreground touch-pan-x touch-pan-y relative light bg-background">
        <Show when={screen() == 'menu'}>
          <QuizMenu onPickGame={handlePickGame} />
        </Show>
        <Show when={screen() == 'game'}>
          <QuizGame durationMinutes={mode().minutes} hints={mode().hints} onGameFinished={handleGameFinish} />
        </Show>
        <Show when={screen() == 'results'}>
          <QuizResults
            results={results()!}
            onPlayAgain={() => setScreen('game')}
            onReturnToMenu={() => setScreen('menu')}
          />
        </Show>
        <Popover placement="left-start">
          <PopoverTrigger as={CircleHelp} class="absolute top-4 right-4 md:top-8 md:right-8" />
          <PopoverContent class="text-sm flex flex-col gap-2">
            <p>
              This demo is adapted from{' '}
              <a href="https://geography.games/europe-quiz" target="_blank" class="underline">
                Europe Quiz
              </a>{' '}
              by{' '}
              <a href="https://zcreativelabs.com" target="_blank" class="underline">
                zcreativelabs
              </a>
            </p>
            <p>
              Type the name of the country highlighted in red. Try and see how many countries you can name before the
              time runs out!
            </p>
          </PopoverContent>
        </Popover>
      </div>
    </APIProvider>
  )
}

const QuizGame: Component<{ durationMinutes: number; hints: number; onGameFinished: (results: GameResult) => void }> = (
  props,
) => {
  const start = new Date().getTime()
  const end = start + props.durationMinutes * 60 * 1000 + 200
  const [map, setMap] = createSignal<google.maps.Map | null>(null)
  let inputRef: HTMLInputElement | null = null

  const [currentCountry, setCurrentCountry] = createSignal<Country>(
    countries[Math.floor(Math.random() * countries.length)],
  )
  const [guessedCountries, setGuessedCountries] = createSignal<Country[]>([])
  const guessedPlaceIds = createMemo(() => guessedCountries().map((c) => c.placeId))
  const numberGuessed = createMemo(() => guessedCountries().length)
  const remainingCountries = createMemo(() => countries.filter((c) => !guessedPlaceIds().includes(c.placeId)))
  const [input, setInput] = createSignal('')
  const [focused, setFocused] = createSignal(false)
  const [timer, setTimer] = createSignal<Duration>(intervalToDuration({ start, end }))
  const [shake, setShake] = createSignal(false)

  const [guessStreak, setGuessStreak] = createSignal(0)
  const [hintsUsed, setHintsUsed] = createSignal(0)
  const [longestGuessStreak, setLongestGuessStreak] = createSignal(0)

  const countryLayer = createMemo(() => {
    if (!map()) return null
    return map()?.getFeatureLayer(google.maps.FeatureType.COUNTRY)
  })

  // Countdown Timer
  onMount(() => {
    const interval = setInterval(() => {
      const currentTime = new Date().getTime()
      const remainingTime = end - currentTime

      if (remainingTime <= 0) {
        clearInterval(interval)
        handleGameFinish()
      }

      setTimer(intervalToDuration({ start: new Date(), end }))
    }, 1000)

    onCleanup(() => clearInterval(interval))
  })

  // When a new country is picked, fit the map bounds back to Europe
  createDeferred(
    on(
      () => ({ map: map(), currentCountry: currentCountry() }),
      ({ map }) => {
        setTimeout(() => {
          map?.fitBounds(bounds, boundsPadding)
        }, 100)
      },
    ),
  )

  // Tell the feature layer to style the current country and guessed countries
  createEffect(
    on(
      () => ({ layer: countryLayer(), country: currentCountry(), placeIds: guessedPlaceIds() }),
      ({ layer, country, placeIds }) => {
        if (!layer) return
        layer.style = ((options: { feature: google.maps.PlaceFeature }) => {
          if (options.feature.placeId == country.placeId) {
            return currentStyleOption
          }
          if (placeIds.includes(options.feature.placeId)) {
            return guessedStyleOption
          }
        }) as any
      },
    ),
  )

  // Check the guess against the current country
  const handleGuess = () => {
    const guess = input().toLowerCase().trim()

    if (!guess) return
    if (
      guess === currentCountry().name.toLowerCase().trim() ||
      currentCountry()
        .alternativeNames?.map((n) => n.toLowerCase().trim())
        .includes(guess)
    ) {
      setGuessStreak(guessStreak() + 1)
      setLongestGuessStreak(Math.max(guessStreak(), longestGuessStreak()))
      setInput('')
      setGuessedCountries([...guessedCountries(), currentCountry()])
      pickNextCountry()
    } else {
      setGuessStreak(0)
      // Shake the input field
      setShake(true)
      setTimeout(() => setShake(false), 500)
    }
  }

  // Skip the current country
  const handleSkip = () => {
    setGuessStreak(0)
    pickNextCountry()

    if (!isMobile()) {
      inputRef?.focus()
    }
  }

  // Pick a new country, if there are any left
  const pickNextCountry = () => {
    clearHints()
    if (remainingCountries().length === 0) {
      handleGameFinish()
      return
    }
    setCurrentCountry(remainingCountries()[Math.floor(Math.random() * remainingCountries().length)])
  }

  const [hintIndex, setHintIndex] = createSignal(0)
  const [hintIds, setHintIds] = createSignal<(string | number)[]>([])

  // Display a hint for the current country, up to the number of hints allowed
  const handleGetHint = () => {
    if (hintIndex() >= props.hints) return

    const index = hintIndex()
    const country = currentCountry()

    const description =
      index === 0 ? (
        <>
          The capital of this country is <strong>{country.capital}</strong>
        </>
      ) : index === 1 ? (
        <>
          The name of this country starts with <strong>the letter {country.name[0]}</strong>
        </>
      ) : (
        <>
          The ISO3 code of this country is <strong>{country.code}</strong>
        </>
      )

    const icon =
      hintIndex() === 0 ? (
        <CastleIcon class="size-4" />
      ) : hintIndex() === 1 ? (
        <MessageCircleQuestionIcon class="size-4" />
      ) : (
        <NewspaperIcon class="size-4" />
      )

    const id = toast('A Hint!', {
      icon,
      description,
      duration: Infinity,
    })

    setHintIndex(hintIndex() + 1)
    setHintsUsed(hintsUsed() + 1)
    setHintIds([...hintIds(), id])

    if (!isMobile()) {
      inputRef?.focus()
    }
  }

  // Clear all hints
  const clearHints = () => {
    hintIds().forEach((id) => toast.dismiss(id))
    setHintIds([])
    setHintIndex(0)
  }

  // Calculate the results and return
  const handleGameFinish = () => {
    const time = intervalToDuration({ start, end: new Date().getTime() })
    if (time.minutes === props.durationMinutes) time.seconds = 0
    props.onGameFinished({
      time,
      highestLevel: Math.floor((numberGuessed() / countries.length) * 3) + 1,
      guessedCountries: numberGuessed(),
      hintsUsed: hintsUsed(),
      longestGuessStreak: longestGuessStreak(),
    })
  }

  return (
    <div class="relative h-[calc(100vh-10rem)]">
      <Map
        ref={setMap}
        mapId="3facc9a170e81af7"
        class="w-full h-full"
        defaultZoom={10}
        defaultCenter={{ lat: 22.54992, lng: 0 }}
        defaultBounds={{ ...bounds, padding: boundsPadding }}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
      >
        <For each={withIcons}>
          {(country) => (
            <AdvancedMarker position={country.showPin} anchorPoint={AdvancedMarkerAnchorPoint.CENTER}>
              <div
                class={cn(
                  'bg-transparent border border-transparent rounded-full w-4 h-4 z-20',
                  currentCountry().placeId == country.placeId && 'bg-[#de3826]/80 border-2 border-[#de3826]',
                  guessedPlaceIds().includes(country.placeId) && 'bg-[#039dbf]/80 border-2 border-[#039dbf]',
                )}
              ></div>
            </AdvancedMarker>
          )}
        </For>
      </Map>
      <QuizHUD
        time={timer()}
        guessedCountries={numberGuessed()}
        level={Math.floor((numberGuessed() / countries.length) * 3) + 1}
      />
      <div class={cn('absolute w-full max-w-2xl z-10 bottom-8 left-1/2 -translate-x-1/2 flex flex-col gap-4 px-4')}>
        <div
          class={cn(
            'rounded-full bg-white border-transparent border-2 flex gap-2 p-1 shadow-lg animate transition-all',
            focused() && 'border-quiz-blue',
            shake() && 'animate-shake',
          )}
        >
          <input
            type="text"
            placeholder="Enter the name of the highlighted country"
            class="flex ps-2 sm:ps-8 h-10 sm:h-12 pe-0 text-quiz-white-foreground text-sm sm:text-lg w-full rounded-md bg-transparent px-3 py-2 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline-none data-[invalid]:border-error-foreground data-[invalid]:text-error-foreground"
            value={input()}
            onInput={(e) => setInput((e.target as HTMLInputElement).value)}
            onFocus={() => setFocused(true)}
            onBlur={() => {
              setFocused(false)
              if (isMobile()) {
                handleGuess()
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleGuess()
              }
            }}
            ref={(ref) => (inputRef = ref)}
          />
          <Button
            class="px-4 h-10 bg-quiz-blue text-white rounded-full sm:h-12 sm:text-lg sm:w-40"
            onClick={handleGuess}
          >
            Guess
          </Button>
        </div>
        <div class="flex justify-center gap-4">
          <Button
            class="bg-quiz-yellow text-quiz-yellow-foreground rounded-full px-12 hover:bg-quiz-yellow/80 shadow-lg text-sm sm:text-base"
            size="lg"
            onClick={handleGetHint}
          >
            Get hint
          </Button>
          <Button
            class="bg-quiz-white text-quiz-white-foreground rounded-full px-12 hover:bg-quiz-white/80 shadow-lg text-sm sm:text-base"
            size="lg"
            onClick={handleSkip}
          >
            Skip
          </Button>
        </div>
      </div>
      <div
        class="absolute top-4 left-4 sm:bottom-8 sm:right-8 sm:left-auto sm:top-auto cursor-pointer h-6 flex items-center"
        onClick={handleGameFinish}
      >
        Give up
      </div>
      <Show when={!isServer}>
        <Toaster class="toaster group absolute bottom-48" expand={!isMobile()} position="bottom-left" />
      </Show>
    </div>
  )
}

const QuizHUD: Component<{ time: Duration; guessedCountries: number; level: number }> = (props) => {
  const levelSegment = Math.round(countries.length / 3)

  return (
    <div class="absolute w-full max-w-4xl z-20 top-8 left-1/2 -translate-x-1/2 flex flex-col pointer-events-none px-4 text-center">
      <div class="font-display text-5xl font-black w-full text-center text-quiz-foreground">
        {formatDuration(props.time)}
      </div>
      <div class="flex sm:gap-2">
        <For each={[0, 1, 2]}>
          {(i) => {
            const percentage = () =>
              Math.min(Math.round(Math.max((props.guessedCountries - levelSegment * i) / levelSegment, 0) * 100), 100)
            return (
              <>
                <div
                  class={cn(
                    'size-14 sm:size-16 shrink-0 bg-quiz-muted rounded-full scale-75 flex items-center justify-center text-quiz-muted-foreground transition-all border-white border-4 shadow',
                    props.guessedCountries &&
                      props.level > i &&
                      'scale-90 sm:scale-100 bg-white shadow-lg text-quiz-yellow stroke-quiz-yellow-border stroke-2',
                  )}
                >
                  <StarIcon class="size-8 sm:size-10" />
                </div>
                <div class="grow py-2 flex items-center">
                  <div class="bg-quiz-muted w-full h-3 sm:h-4 shadow">
                    <div class="bg-quiz-blue h-full transition-all" style={{ width: `${percentage()}%` }}></div>
                  </div>
                </div>
              </>
            )
          }}
        </For>
        <div
          class={cn(
            'size-14 sm:size-16 shrink-0 bg-quiz-muted rounded-full scale-75 flex items-center justify-center text-quiz-muted-foreground transition-all border-white border-4 shadow',
          )}
        >
          <TrophyIcon class="size-7 sm:size-8 " />
        </div>
      </div>
      <div class="-mt-2">
        {props.guessedCountries}/{countries.length}
      </div>
    </div>
  )
}

const QuizMenu: Component<{ onPickGame: (mode: GameMode) => void }> = (props) => {
  const [selection, setSelection] = createSignal<GameType>('learning')
  const selectedMode = createMemo(() => gameModes[selection()])

  return (
    <div class="flex flex-col items-center justify-center h-full gap-12 text-quiz-foreground text-center py-12 px-8">
      <div class="flex flex-col gap-4 items-center max-w-lg">
        <h1 class="font-black font-display text-6xl uppercase">Country Quiz</h1>
        <p>
          How many European countries can you name on the map? Take our Europe geography quiz to challenge yourself and
          find out!
        </p>
      </div>
      <div class="flex flex-col gap-8 w-full items-center">
        <div class="flex-col sm:flex-row flex gap-4 sm:gap-8 justify-center">
          <For each={Object.keys(gameModes)}>
            {(option, i) => {
              const mode = gameModes[option as GameType]
              return (
                <button
                  class={`w-36 ${i() % 2 == 0 ? 'rotate-[5deg]' : 'rotate-[-5deg]'} inline-grid items-center justify-center`}
                  onClick={() => setSelection(option as GameType)}
                >
                  <TicketIcon
                    class={cn('row-start-1 col-start-1 w-full', selection() === option && 'stroke-quiz-blue')}
                  />
                  <span
                    class={cn(
                      'text-quiz-muted-foreground row-start-1 col-start-1 font-display text-xl font-black uppercase',
                      selection() === option && 'text-quiz-foreground',
                    )}
                  >
                    {mode.label}
                  </span>
                </button>
              )
            }}
          </For>
        </div>
        <p class="text-sm text-muted-foreground">
          Guess all {countries.length} countries in <span class="text-quiz-blue">{selectedMode().minutes} minutes</span>{' '}
          with{' '}
          <span class="text-quiz-blue">
            {selectedMode().hints} hint{selectedMode().hints > 1 && 's'}
          </span>{' '}
          per country.
        </p>
        <Button
          class="px-4 bg-quiz-blue text-white rounded-full h-12 text-lg w-40"
          onClick={() => props.onPickGame(selectedMode())}
        >
          Start the quiz
        </Button>
      </div>
      <div class="flex flex-col gap-8 w-full items-center">
        <h2 class="font-display text-3xl font-black uppercase">How to play</h2>
        <div class="max-w-lg text-left leading-loose space-y-4">
          <div>
            Type in the name of country highlighted in <Badge variant="error">red</Badge> on the map. If you guessed
            correctly, the highlighted country will turn{' '}
            <Badge class="bg-quiz-blue/30 text-quiz-blue border-quiz-blue">blue</Badge>. Guess as many countries as
            possible in the shortest amount of time!
          </div>
          <div>
            If you are stuck, click on "Get a hint" to get clues that might help you guess the country, such as the name
            of the capital city, the first letter, or the ISO3 country code. Don’t worry if it doesn’t come to you right
            away, hit "Skip" and the country will appear again later.
          </div>
          <div>To guess press the "Guess" button or simply hit "Enter"</div>
        </div>
      </div>
    </div>
  )
}

const QuizResults: Component<{ results: GameResult; onPlayAgain: () => void; onReturnToMenu: () => void }> = (
  props,
) => {
  return (
    <div class="flex flex-col items-center justify-center h-full gap-12 text-quiz-foreground text-center py-12 px-8">
      <div class="grid grid-cols-2 md:grid-cols-5 gap-8 max-w-4xl">
        <div class="flex flex-col gap-4">
          <div class="font-display text-5xl font-black uppercase">{props.results.highestLevel}</div>
          <div class="text-sm">highest level reached</div>
        </div>
        <div class="flex flex-col gap-4">
          <div class="font-display text-5xl font-black uppercase">{props.results.guessedCountries}</div>
          <div class="text-sm">number of guessed countries</div>
        </div>
        <div class="flex flex-col gap-4 col-span-2 md:col-span-1 -order-1 md:order-none">
          <div class="font-display text-5xl font-black uppercase">{formatDuration(props.results.time)}</div>
          <div class="text-sm">time to complete quiz</div>
        </div>
        <div class="flex flex-col gap-4">
          <div class="font-display text-5xl font-black uppercase">{props.results.hintsUsed}</div>
          <div class="text-sm">hints used during the game</div>
        </div>
        <div class="flex flex-col gap-4">
          <div class="font-display text-5xl font-black uppercase">{props.results.longestGuessStreak}</div>
          <div class="text-sm">longest guessing streak</div>
        </div>
      </div>
      <div class="flex justify-center">
        <Show when={props.results.highestLevel < 3}>
          <img src="/ribbon-level1.svg" />
        </Show>
        <Show when={props.results.highestLevel == 3}>
          <img src="/medal-silver.svg" />
        </Show>
        <Show when={props.results.highestLevel == 4}>
          <img src="/trophy-gold.svg" />
        </Show>
      </div>
      <div class="flex flex-col sm:flex-row gap-4 w-full justify-center">
        <Button
          class="px-4 bg-quiz-blue text-white hover:bg-quiz-blue/80 rounded-full h-12 text-lg"
          onClick={() => props.onPlayAgain()}
        >
          <RotateCwIcon class="size-4" />
          Play Again
        </Button>
        <Button
          class="px-4 bg-quiz-muted text-quiz-foreground hover:bg-quiz-muted/80 rounded-full h-12 text-lg"
          onClick={() => props.onReturnToMenu()}
        >
          <MountainSnowIcon class="size-4" />
          Change Difficulty
        </Button>
      </div>
    </div>
  )
}

const zeroPad = (num: number) => String(num).padStart(2, '0')

const formatDuration = (duration: Duration) => `${zeroPad(duration.minutes || 0)}:${zeroPad(duration.seconds || 0)}`

const StarIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 28 28" role="presentation" {...props}>
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      fill="currentcolor"
      d="M13.103 4.317a1 1 0 011.794 0l2.811 5.695 6.288.92a1 1 0 01.553 1.705L20 17.068l1.073 6.259a1 1 0 01-1.45 1.054L14 21.424l-5.622 2.957a1 1 0 01-1.451-1.054L8 17.068l-4.55-4.431a1 1 0 01.554-1.706l6.288-.919 2.811-5.695z"
    ></path>
  </svg>
)

const TicketIcon = (props: ComponentProps<'svg'>) => (
  <svg viewBox="0 0 144 88" xmlns="http://www.w3.org/2000/svg" {...props}>
    <path
      d="M30 10.4C34.6391 10.4 38.4 6.63919 38.4 2H49.6C49.6 6.63919 53.3609 10.4 58 10.4C62.6391 10.4 66.4 6.63919 66.4 2H77.6C77.6 6.63919 81.3609 10.4 86 10.4C90.6391 10.4 94.4 6.63919 94.4 2H105.6C105.6 6.63919 109.361 10.4 114 10.4C118.639 10.4 122.4 6.63919 122.4 2H133.6C133.6 6.63919 137.361 10.4 142 10.4V21.6C137.361 21.6 133.6 25.3608 133.6 30C133.6 34.6392 137.361 38.4 142 38.4V49.6C137.361 49.6 133.6 53.3608 133.6 58C133.6 62.6392 137.361 66.4 142 66.4V77.6C137.361 77.6 133.6 81.3608 133.6 86H122.4C122.4 81.3608 118.639 77.6 114 77.6C109.361 77.6 105.6 81.3608 105.6 86H94.4C94.4 81.3608 90.6391 77.6 86 77.6C81.3609 77.6 77.6 81.3608 77.6 86H66.4C66.4 81.3608 62.6391 77.6 58 77.6C53.3609 77.6 49.6 81.3608 49.6 86H38.4C38.4 81.3608 34.6391 77.6 30 77.6C25.3609 77.6 21.6 81.3608 21.6 86H10.4C10.4 81.3608 6.63914 77.6 2 77.6L2 66.4C6.63914 66.4 10.4 62.6392 10.4 58C10.4 53.3608 6.63914 49.6 2 49.6L2 38.4C6.63914 38.4 10.4 34.6392 10.4 30C10.4 25.3608 6.63914 21.6 2 21.6V10.4C6.63914 10.4 10.4 6.63919 10.4 2L21.6 2C21.6 6.63919 25.3609 10.4 30 10.4Z"
      fill="#E5EBE7"
      stroke-width="3"
      stroke-linecap="round"
      stroke-linejoin="round"
    ></path>
  </svg>
)

const currentStyleOption: google.maps.FeatureStyleOptions = {
  strokeOpacity: 0,
  strokeWeight: 0,
  fillColor: '#de3826',
  fillOpacity: 1,
}

const guessedStyleOption: google.maps.FeatureStyleOptions = {
  strokeColor: '#0b6c89',
  strokeOpacity: 0.8,
  strokeWeight: 1,
  fillColor: '#039dbf',
  fillOpacity: 1,
}

const isMobile = () => window.innerWidth < 640

const countries: Country[] = [
  {
    name: 'Andorra',
    code: 'AD',
    capital: 'Andorra la Vella',
    placeId: 'ChIJlfCemC71pRIRkn_qeNc-yQc',
    showPin: {
      lat: 42.5407167,
      lng: 1.5732033,
    },
  },
  {
    name: 'Albania',
    code: 'AL',
    placeId: 'ChIJLUwnvfM7RRMR7juY1onlfAc',
    capital: 'Tirana',
  },
  {
    name: 'Austria',
    code: 'AT',
    placeId: 'ChIJfyqdJZsHbUcRr8Hk3XvUEhA',
    capital: 'Vienna',
  },
  {
    name: 'Bosnia and Herzegovina',
    code: 'BA',
    placeId: 'ChIJ16k3xxWiSxMRDOm3QwPi920',
    capital: 'Sarajevo',
    alternativeNames: ['Bosnia'],
  },
  {
    name: 'Belgium',
    code: 'BE',
    placeId: 'ChIJl5fz7WR9wUcR8g_mObTy60c',
    capital: 'Brussels',
  },
  {
    name: 'Bulgaria',
    code: 'BG',
    placeId: 'ChIJifBbyMH-qEAREEy_aRKgAAA',
    capital: 'Sofia',
  },
  {
    name: 'Belarus',
    code: 'BY',
    placeId: 'ChIJgUit4oQl2kYREIzsgdGhAAA',
    capital: 'Minsk',
  },
  {
    name: 'Switzerland',
    code: 'CH',
    placeId: 'ChIJYW1Zb-9kjEcRFXvLDxG1Vlw',
    capital: 'Bern',
  },
  {
    name: 'Cyprus',
    code: 'CY',
    placeId: 'ChIJVU1JymcX3hQRbhTEf4A8TDI',
    showPin: {
      lat: 34.9823018,
      lng: 33.1451285,
    },
    capital: 'Nicosia',
  },
  {
    name: 'Czech Republic',
    code: 'CZ',
    placeId: 'ChIJQ4Ld14-UC0cRb1jb03UcZvg',
    alternativeNames: ['Czechia'],
    capital: 'Prague',
  },
  {
    name: 'Germany',
    code: 'DE',
    placeId: 'ChIJa76xwh5ymkcRW-WRjmtd6HU',
    capital: 'Berlin',
  },
  {
    name: 'Denmark',
    code: 'DK',
    placeId: 'ChIJ-1-U7rYnS0YRzZLgw9BDh1I',
    capital: 'Copenhagen',
  },
  {
    name: 'Estonia',
    code: 'EE',
    placeId: 'ChIJ_UuggpyUkkYRwyW0T7qf6kA',
    capital: 'Tallinn',
  },
  {
    name: 'Spain',
    code: 'ES',
    placeId: 'ChIJi7xhMnjjQgwR7KNoB5Qs7KY',
    capital: 'Madrid',
  },
  {
    name: 'Finland',
    code: 'FI',
    placeId: 'ChIJ3fYyS9_KgUYREKh1PNZGAQA',
    capital: 'Helsinki',
  },
  {
    name: 'France',
    code: 'FR',
    placeId: 'ChIJMVd4MymgVA0R99lHx5Y__Ws',
    capital: 'Paris',
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    placeId: 'ChIJqZHHQhE7WgIReiWIMkOg-MQ',
    capital: 'London',
  },
  {
    name: 'Greece',
    code: 'GR',
    placeId: 'ChIJY2xxEcdKWxMRHS2a3HUXOjY',
    capital: 'Athens',
  },
  {
    name: 'Croatia',
    code: 'HR',
    placeId: 'ChIJ7ZXdCghBNBMRfxtm4STA86A',
    capital: 'Zagreb',
  },
  {
    name: 'Hungary',
    code: 'HU',
    placeId: 'ChIJw-Q333uDQUcREBAeDCnEAAA',
    capital: 'Budapest',
  },
  {
    name: 'Ireland',
    code: 'IE',
    placeId: 'ChIJ-ydAXOS6WUgRCPTbzjQSfM8',
    capital: 'Dublin',
  },
  {
    name: 'Iceland',
    code: 'IC',
    placeId: 'ChIJQ2Dro1Ir0kgRmkXB5TQEim8',
    capital: 'Rekjavik',
  },
  {
    name: 'Italy',
    code: 'IT',
    placeId: 'ChIJA9KNRIL-1BIRb15jJFz1LOI',
    capital: 'Rome',
  },
  {
    name: 'Liechtenstein',
    code: 'LI',
    placeId: 'ChIJ_S9HHUQxm0cRibFa3Ta16mA',
    showPin: {
      lat: 47.1416307,
      lng: 9.5531527,
    },
    capital: 'Vaduz',
  },
  {
    name: 'Lithuania',
    code: 'LT',
    placeId: 'ChIJE74zDxSU3UYRubpdpdNUCvM',
    capital: 'Vilnius',
  },
  {
    name: 'Luxembourg',
    code: 'LU',
    placeId: 'ChIJRyEhyrlFlUcR75LTAvZg22Q',
    capital: 'Luxembourg',
    showPin: {
      lat: 49.8158683,
      lng: 6.1296751,
    },
  },
  {
    name: 'Latvia',
    code: 'LV',
    placeId: 'ChIJ_ZqKe2cw6UYREPzyaM3PAAA',
    capital: 'Riga',
  },
  {
    name: 'Malta',
    code: 'MT',
    placeId: 'ChIJxUeGHShFDhMROUK-NmHYgvU',
    showPin: {
      lat: 35.8885993,
      lng: 14.4476911,
    },
    capital: 'Valletta',
  },
  {
    name: 'Monaco',
    code: 'MC',
    placeId: 'ChIJMYU_e2_CzRIR_JzEOkx493Q',
    showPin: {
      lat: 43.7323492,
      lng: 7.4276832,
    },
    capital: 'Monaco',
  },
  {
    name: 'Montenegro',
    code: 'ME',
    placeId: 'ChIJyx8sJBcyTBMRRtP_boadTDg',
    capital: 'Podgorica',
  },
  {
    name: 'Moldova, Republic of',
    code: 'MD',
    placeId: 'ChIJoWm3KDZ8yUARy6xT36wZgSU',
    alternativeNames: ['Moldova'],
    capital: 'Chisinau',
  },
  {
    name: 'Macedonia, The Former Yugoslav Republic of',
    code: 'MK',
    placeId: 'ChIJCUi8cJ8VVBMRscUfyNZa8uA',
    alternativeNames: ['North Macedonia', 'Macedonia'],
    capital: 'Skopje',
  },
  {
    name: 'Netherlands',
    code: 'NL',
    placeId: 'ChIJu-SH28MJxkcRnwq9_851obM',
    capital: 'Amsterdam',
  },
  {
    name: 'Norway',
    code: 'NO',
    placeId: 'ChIJv-VNj0VoEkYRK9BkuJ07sKE',
    capital: 'Oslo',
  },
  {
    name: 'Poland',
    code: 'PL',
    placeId: 'ChIJuwtkpGSZAEcR6lXMScpzdQk',
    capital: 'Warsaw',
  },
  {
    name: 'Portugal',
    code: 'PT',
    placeId: 'ChIJ1SZCvy0kMgsRQfBOHAlLuCo',
    capital: 'Lisbon',
  },
  {
    name: 'Romania',
    code: 'RO',
    placeId: 'ChIJw3aJlSb_sUARlLEEqJJP74Q',
    capital: 'Bucharest',
  },
  {
    name: 'Russian Federation',
    code: 'RU',
    placeId: 'ChIJ-yRniZpWPEURE_YRZvj9CRQ',
    alternativeNames: ['Russia'],
    capital: 'Moscow',
  },
  {
    name: 'Serbia',
    code: 'RS',
    placeId: 'ChIJlYCJ8t8dV0cRXYYjN-pQXgU',
    capital: 'Belgrade',
  },
  {
    name: 'Sweden',
    code: 'SE',
    placeId: 'ChIJ8fA1bTmyXEYRYm-tjaLruCI',
    capital: 'Stockholm',
  },
  {
    name: 'Slovenia',
    code: 'SI',
    placeId: 'ChIJYYOWXuckZUcRZdTiJR5FQOc',
    capital: 'Ljubljana',
  },
  {
    name: 'Slovakia',
    code: 'SK',
    placeId: 'ChIJf8Z8rrlgFEcRfTpysWdha80',
    capital: 'Bratislava',
  },
  {
    name: 'San Marino',
    code: 'SM',
    placeId: 'ChIJeT_m9V_rLBMRECA0gpnzAAA',
    showPin: {
      lat: 43.9458623,
      lng: 12.458306,
    },
    capital: 'San Marino',
  },
  {
    name: 'Ukraine',
    code: 'UA',
    placeId: 'ChIJjw5wVMHZ0UAREED2iIQGAQA',
    capital: 'Kiev',
  },
  {
    name: 'Vatican',
    code: 'VA',
    placeId: 'ChIJPS3UVwqJJRMRsH46sppPCQA',
    alternativeNames: ['Vatican City', 'Holy See', 'Vatican City State'],
    showPin: {
      lat: 41.903411,
      lng: 12.4528527,
    },
    capital: 'Vatican City',
  },
]

const withIcons = countries.filter((c) => c.showPin)

const bounds = {
  north: 71.16868730294564,
  east: 68.98610777584814,
  south: 36.38727093488623,
  west: -24.53697620556881,
}

const boundsPadding = { bottom: 200, top: 110 }
