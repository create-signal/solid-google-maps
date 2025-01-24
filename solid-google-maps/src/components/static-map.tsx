import { ComponentProps } from 'solid-js'

export { createStaticMapsUrl } from '../libraries/create-static-maps-url'
export * from '../libraries/create-static-maps-url/types'

/**
 * Props for the StaticMap component
 */
export type StaticMapProps = Omit<ComponentProps<'img'>, 'src'> & {
  url: string
}

export const StaticMap = (props: StaticMapProps) => {
  if (!props.url) throw new Error('URL is required')

  return <img {...props} src={props.url} width="100%" />
}
