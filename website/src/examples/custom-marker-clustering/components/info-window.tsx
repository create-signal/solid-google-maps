import { Feature, Point } from 'geojson'
import { Component, Index, Show } from 'solid-js'
import { CastleFeatureProps } from '../castles'

type InfowindowContentProps = {
  features: Feature<Point>[]
}

const numFmt = new Intl.NumberFormat()

function getDetailsUrl(props: CastleFeatureProps) {
  return props.wikipedia ? getWikipediaUrl(props.wikipedia) : getWikidataUrl(props.wikidata)
}

function getWikipediaUrl(contentId: string) {
  const [lang, title] = contentId.split(':')

  return `https://${lang}.wikipedia.org/wiki/${title.replace(/ /g, '_')}`
}
function getWikidataUrl(id: string) {
  return `https://www.wikidata.org/wiki/${id}`
}

export const InfoWindowContent: Component<InfowindowContentProps> = (props) => {
  return (
    <Show
      when={props.features.length === 1}
      fallback={
        <div>
          <h4>{numFmt.format(props.features.length)} features. Zoom in to explore.</h4>

          <ul>
            <Index each={props.features.slice(0, 5)}>
              {(feature) => {
                const props = feature().properties! as CastleFeatureProps

                return (
                  <li>
                    <a href={getDetailsUrl(props)} target="_blank">
                      {props.name}
                    </a>
                  </li>
                )
              }}
            </Index>

            <Show when={props.features.length > 5}>
              <li>and {numFmt.format(props.features.length - 5)} more.</li>
            </Show>
          </ul>
        </div>
      }
    >
      {(_) => {
        const f = props.features[0]
        const p = f.properties! as CastleFeatureProps
        return (
          <div>
            <h4>{p.name}</h4>
            <p>
              <a href={getDetailsUrl(p)} target="_blank">
                more information
              </a>
            </p>
          </div>
        )
      }}
    </Show>
  )
}
