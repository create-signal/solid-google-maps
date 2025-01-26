import { ArrowDownLeftIcon, ArrowDownRightIcon, ArrowUpLeftIcon, ArrowUpRightIcon } from 'lucide-solid'
import { APIProvider, Map, useMap } from 'solid-google-maps'
import { ComponentProps, createSignal, ParentComponent } from 'solid-js'
import { Slider, SliderFill, SliderThumb, SliderTrack } from '~/components/ui/slider'
import { cn } from '~/lib/utils'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

const CustomControlMap = () => {
  const map = useMap()
  const [zoom, setZoom] = createSignal(4)
  const [center, setCenter] = createSignal({ lat: 22.54992, lng: 0 })

  const panUp = () => {
    map()?.panBy(0, -getSmallestSide())
  }
  const panDown = () => {
    map()?.panBy(0, getSmallestSide())
  }
  const panLeft = () => {
    map()?.panBy(-getSmallestSide(), 0)
  }
  const panRight = () => {
    map()?.panBy(getSmallestSide(), 0)
  }

  // Maps only animates if it is panning by less than the size of its smallest side
  // This function guarantees that every pan will animate smoothly
  const getSmallestSide = () =>
    Math.floor(Math.min(map()?.getDiv().offsetWidth || 0, map()?.getDiv().offsetHeight || 0))

  return (
    <>
      <Map
        mapId="DEMO_MAP_ID"
        style={{ height: '500px', width: '100%' }}
        center={center()}
        zoom={zoom()}
        onCenterChanged={(ev) => setCenter(ev.detail.center)}
        onZoomChanged={(ev) => setZoom(ev.detail.zoom)}
        gestureHandling={'greedy'}
        disableDefaultUI={true}
        renderingType="VECTOR"
      />
      <div class="absolute top-4 right-4 p-4 flex flex-col gap-4">
        <div class="grid grid-cols-2 rounded-full shadow-lg rotate-45">
          <PanButton class="rounded-tl-full border-b border-r" onClick={() => panUp()}>
            <ArrowUpLeftIcon class="translate-x-1 translate-y-1 group-hover/button:translate-x-0 group-hover/button:translate-y-0 transition-transform" />
          </PanButton>
          <PanButton class="rounded-tr-full border-border border-b" onClick={() => panRight()}>
            <ArrowUpRightIcon class="-translate-x-1 translate-y-1 group-hover/button:translate-x-0 group-hover/button:translate-y-0 transition-transform" />
          </PanButton>
          <PanButton class="rounded-bl-full border-border border-r" onClick={() => panLeft()}>
            <ArrowDownLeftIcon class="translate-x-1 -translate-y-1 group-hover/button:translate-x-0 group-hover/button:translate-y-0 transition-transform" />
          </PanButton>
          <PanButton class="rounded-br-full" onClick={() => panDown()}>
            <ArrowDownRightIcon class="-translate-x-1 -translate-y-1 group-hover/button:translate-x-0 group-hover/button:translate-y-0 transition-transform" />
          </PanButton>
        </div>
        <Slider minValue={0} maxValue={18} step={0.01} value={[zoom()]} onChange={(value) => setZoom(value[0])}>
          <SliderTrack>
            <SliderFill />
            <SliderThumb />
          </SliderTrack>
        </Slider>
      </div>
    </>
  )
}

const PanButton: ParentComponent<ComponentProps<'button'>> = (props) => {
  return (
    <button
      {...props}
      class={cn(
        'bg-white size-12 bg-background text-foreground outline-none flex items-center justify-center border-border group/button',
        props.class,
      )}
    >
      {props.children}
    </button>
  )
}

export default function App() {
  return (
    <APIProvider apiKey={API_KEY}>
      <CustomControlMap />
    </APIProvider>
  )
}
