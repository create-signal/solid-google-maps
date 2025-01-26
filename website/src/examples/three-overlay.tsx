import { ThreeJSOverlayView } from '@googlemaps/three'
import { APIProvider, Map, useMap } from 'solid-google-maps'
import { createEffect, onCleanup, onMount } from 'solid-js'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY

export default function App() {
  return (
    <APIProvider apiKey={API_KEY}>
      <OverlayMap />
    </APIProvider>
  )
}

const OverlayMap = () => {
  const map = useMap()
  const scene = new THREE.Scene()
  let markerObject: THREE.Group
  let overlay: any

  onMount(() => {
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.25)
    directionalLight.position.set(0, 10, 50)
    scene.add(directionalLight)

    const loader = new GLTFLoader()
    const url = 'https://raw.githubusercontent.com/googlemaps/js-samples/main/assets/pin.gltf'

    loader.load(url, (gltf) => {
      gltf.scene.scale.set(10, 10, 10)
      gltf.scene.rotation.y = Math.PI
      scene.add(gltf.scene)
      markerObject = gltf.scene
    })

    let frame = requestAnimationFrame(animate)

    function animate() {
      frame = requestAnimationFrame(animate)
      if (markerObject) {
        markerObject.rotateZ(0.01)
        overlay?.requestRedraw()
      }
    }

    onCleanup(() => {
      cancelAnimationFrame(frame)
    })
  })

  createEffect(() => {
    if (!map()) return

    overlay = new ThreeJSOverlayView({
      map: map()!,
      scene,
      anchor: { lat: 35.6594945, lng: 139.6999859, altitude: 50 },
      THREE,
    })
  })

  return (
    <Map
      style={{ height: '500px', width: '100%' }}
      defaultZoom={18}
      defaultTilt={53}
      defaultHeading={16}
      defaultCenter={{ lat: 35.6594945, lng: 139.6999859 }}
      keyboardShortcuts={false}
      mapId="15431d2b469f209e"
      gestureHandling="greedy"
    />
  )
}
