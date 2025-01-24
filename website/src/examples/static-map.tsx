import { createStaticMapsUrl, StaticMap, StaticMapsApiOptions } from 'solid-google-maps'
import { Component } from 'solid-js'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  return (
    <div class="grid grid-cols-2 w-full">
      <div>
        <StaticMap1 />
      </div>
      <div>
        <StaticMap2 />
      </div>
      <div>
        <StaticMap3 />
      </div>
      <div>
        <StaticMap4 />
      </div>
    </div>
  )
}

const StaticMap1: Component = () => {
  const staticMapsUrl = createStaticMapsUrl({
    apiKey: API_KEY,
    scale: 2,
    width: 600,
    height: 600,
    center: { lat: 53.555570296010295, lng: 10.008892744638956 },
    zoom: 8,
    language: 'en',
  })

  return <StaticMap class="map" url={staticMapsUrl} />
}

const StaticMap2: Component = () => {
  const staticMapsUrl = createStaticMapsUrl({
    apiKey: API_KEY,
    scale: 2,
    width: 600,
    height: 600,
    mapId: '8e0a97af9386fef',
    format: 'png',
    markers: [
      {
        location: 'Hamburg, Germany',
        color: '0xff1493',
        label: 'H',
        size: 'small',
      },
      {
        location: { lat: 52.5, lng: 10 },
        color: 'blue',
        label: 'H',
      },
      {
        location: 'Berlin, Germany',
        color: 'orange',
        icon: 'http://tinyurl.com/jrhlvu6',
        anchor: 'center',
        label: 'B',
        scale: 2,
      },
      {
        location: 'Essen, Germany',
        color: 'purple',
      },
    ],
    visible: ['Germany'],
  })

  return <StaticMap class="map" url={staticMapsUrl} />
}

const StaticMap3: Component = () => {
  const staticMapsUrl = createStaticMapsUrl({
    apiKey: API_KEY,
    scale: 2,
    width: 600,
    height: 600,
    mapType: 'hybrid',
    format: 'jpg',
    paths: [
      {
        color: '0xff1493',
        fillcolor: '0xffff00',
        coordinates: [{ lat: 52.5, lng: 10 }, 'Berlin, Germany', 'Hamburg, Germany'],
      },
      {
        coordinates: [{ lat: 52.5, lng: 10 }, 'Leipzig, Germany'],
      },
    ],
  })

  return <StaticMap class="map" url={staticMapsUrl} />
}

const StaticMap4: Component = () => {
  const staticMapsUrl = createStaticMapsUrl({
    apiKey: API_KEY,
    scale: 2,
    width: 600,
    height: 600,
    paths: [
      {
        color: '0xff00ff',
        fillcolor: '0xffff00',
        coordinates:
          'enc:}zswFtikbMjJzZ|RdPfZ}DxWvBjWpF~IvJnEvBrMvIvUpGtQpFhOQdKpz@bIx{A|PfYlvApz@bl@tcAdTpGpVwQtX}i@|Gen@lCeAda@bjA`q@v}@rfAbjA|EwBpbAd_@he@hDbu@uIzWcWtZoTdImTdIwu@tDaOXw_@fc@st@~VgQ|[uPzNtA`LlEvHiYyLs^nPhCpG}SzCNwHpz@cEvXg@bWdG`]lL~MdTmEnCwJ[iJhOae@nCm[`Aq]qE_pAaNiyBuDurAuB}}Ay`@|EKv_@?|[qGji@lAhYyH`@Xiw@tBerAs@q]jHohAYkSmW?aNoaAbR}LnPqNtMtIbRyRuDef@eT_z@mW_Nm|B~j@zC~hAyUyJ_U{Z??cPvg@}s@sHsc@_z@cj@kp@YePoNyYyb@_iAyb@gBw^bOokArcA}GwJuzBre@i\\tf@sZnd@oElb@hStW{]vv@??kz@~vAcj@zKa`Atf@uQj_Aee@pU_UrcA',
      },
    ],
    style: [
      {
        featureType: 'road.local',
        elementType: 'geometry',
        stylers: [{ color: '#00ff00' }],
      },
      {
        featureType: 'landscape',
        elementType: 'geometry.fill',
        stylers: [{ color: '#222222' }],
      },
      {
        elementType: 'labels',
        stylers: [{ invert_lightness: true }],
      },
      {
        featureType: 'road.arterial',
        elementType: 'labels',
        stylers: [{ invert_lightness: false }],
      },
    ],
  })

  return <StaticMap class="map" url={staticMapsUrl} />
}
