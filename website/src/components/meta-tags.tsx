import { mergeProps } from 'solid-js'
import { Link, Meta, Title } from '@solidjs/meta'
import { name, description, homepage, keywords } from '../../../package.json'

const BASE_URL = homepage

export interface HeadProps {
  title?: string
  description?: string
}

export function MetaTags(rawProps: HeadProps) {
  const props = mergeProps(
    {
      title: name,
      description: description,
    },
    rawProps,
  )
  return (
    <>
      <Title>{props.title}</Title>

      <Meta charset="utf-8" />

      <Meta name="title" content={props.title} />
      <Meta name="description" content={props.description} />
      <Meta name="keywords" content={keywords.join(',')} />
      <Meta name="author" content="Kieran Molloy" />

      <Meta name="twitter:card" content="summary_large_image" />
      <Meta name="twitter:site" content={BASE_URL} />
      <Meta name="twitter:title" content={props.title} />
      <Meta name="twitter:description" content={props.description} />
      <Meta name="twitter:image" content={`${BASE_URL}/og.png`} />
      <Meta name="twitter:image:alt" content={props.title} />

      <Meta name="og:title" content={props.title} />
      <Meta name="og:type" content="article" />
      <Meta name="og:url" content={BASE_URL} />
      <Meta name="og:image" content={`${BASE_URL}/og.png`} />
      <Meta name="og:image:alt" content={props.title} />
      <Meta name="og:image:width" content="1200" />
      <Meta name="og:image:height" content="630" />

      <Link rel="canonical" href={BASE_URL} />
      <Link rel="manifest" href={`${BASE_URL}/site.webmanifest`} />
      <link rel="icon" type="image/png" href="/favicon-96x96.png" sizes="96x96" />
      <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      <link rel="shortcut icon" href="/favicon.ico" />

      <Link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      <meta name="apple-mobile-web-app-title" content={props.title} />
    </>
  )
}
