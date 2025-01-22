import { Accessor, createContext } from 'solid-js'

export interface GoogleMapsContextValue {
  map: Accessor<google.maps.Map | null>
}

export const GoogleMapsContext = createContext<GoogleMapsContextValue | null>(null)
