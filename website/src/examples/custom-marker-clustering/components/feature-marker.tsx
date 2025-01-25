import { AdvancedMarker, AdvancedMarkerAnchorPoint } from 'solid-google-maps'
import { Component, createSignal } from 'solid-js'

import { CastleSvg } from './castle-icon'

type TreeMarkerProps = {
  position: google.maps.LatLngLiteral
  featureId: string
  onClick?: (marker: google.maps.marker.AdvancedMarkerElement, featureId: string) => void
}

export const FeatureMarker: Component<TreeMarkerProps> = (props) => {
  const [marker, setMarker] = createSignal<google.maps.marker.AdvancedMarkerElement | null>(null)
  const handleClick = () => props.onClick?.(marker()!, props.featureId)

  return (
    <AdvancedMarker
      ref={setMarker}
      position={props.position}
      onClick={handleClick}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
      class={'marker feature'}
    >
      <CastleSvg />
    </AdvancedMarker>
  )
}
