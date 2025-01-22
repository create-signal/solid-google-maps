import { MetaTags } from '~/components/meta-tags'
import SolidGuessr from '~/examples/solidguessr'

export default function SolidGuessrRoute() {
  return (
    <>
      <MetaTags title="SolidGuessr" description="GeoGuessr clone build using solid-google-maps components" />
      <SolidGuessr />
    </>
  )
}
