import { AdvancedMarker, AdvancedMarkerAnchorPoint } from 'solid-google-maps'
import { Component, createSignal } from 'solid-js'
import { CastleSvg } from './castle-icon'

type TreeClusterMarkerProps = {
  clusterId: number
  onClick?: (marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => void
  onMouseEnter?: (marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => void
  onMouseLeave?: (marker: google.maps.marker.AdvancedMarkerElement, clusterId: number) => void
  position: google.maps.LatLngLiteral
  size: number
  sizeAsText: string
}

export const FeaturesClusterMarker: Component<TreeClusterMarkerProps> = (props) => {
  const [marker, setMarker] = createSignal<google.maps.marker.AdvancedMarkerElement | null>(null)
  const handleClick = () => props.onClick?.(marker()!, props.clusterId)
  const handleMouseEnter = () => props.onMouseEnter?.(marker()!, props.clusterId)
  const handleMouseLeave = () => props.onMouseLeave?.(marker()!, props.clusterId)
  const markerSize = () => Math.floor(48 + Math.sqrt(props.size) * 2)

  return (
    <AdvancedMarker
      ref={setMarker}
      position={props.position}
      zIndex={props.size}
      class={'marker cluster'}
      style={{ width: `${markerSize()}px`, height: `${markerSize()}px` }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      anchorPoint={AdvancedMarkerAnchorPoint.CENTER}
    >
      <CastleSvg />
      <span>{props.sizeAsText}</span>
    </AdvancedMarker>
  )
}
