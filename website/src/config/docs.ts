type NavElement = {
  title: string
  href: string
  external?: boolean
  status?: 'new' | 'updated'
}

type NavCategory = {
  title: string
  items: NavElement[]
}

type Config = {
  mainNav: NavElement[]
  sidebarNav: NavCategory[]
}

export const docsConfig: Config = {
  mainNav: [
    {
      title: 'Docs',
      href: '/docs/introduction',
    },
    {
      title: 'Examples',
      href: '/docs/examples/basic-map',
    },
    {
      title: 'Experiments',
      href: '/experiments/solidguessr',
    },
  ],
  sidebarNav: [
    {
      title: 'Getting Started',
      items: [
        {
          title: 'Introduction',
          href: '/docs/introduction',
        },
        {
          title: 'Getting Started',
          href: '/docs/getting-started',
        },
        {
          title: 'Contributing',
          href: '/docs/contributing',
        },
      ],
    },
    {
      title: 'Components',
      items: [
        {
          title: 'APIProvider',
          href: '/docs/components/api-provider',
        },
        {
          title: 'Map',
          href: '/docs/components/map',
        },
        {
          title: 'AdvancedMarker',
          href: '/docs/components/advanced-marker',
        },
        {
          title: 'InfoWindow',
          href: '/docs/components/info-window',
        },
        {
          title: 'Pin',
          href: '/docs/components/pin',
        },
      ],
    },
    {
      title: 'Examples',
      items: [
        {
          title: 'Basic Map',
          href: '/docs/examples/basic-map',
        },
        {
          title: 'Change Map Styles',
          href: '/docs/examples/change-map-styles',
        },
        {
          title: 'Markers and Infowindows',
          href: '/docs/examples/markers-and-infowindows',
        },
        {
          title: 'Advanced Marker',
          href: '/docs/examples/advanced-marker',
        },
        {
          title: 'Advanced Marker Interaction',
          href: '/docs/examples/advanced-marker-interaction',
        },
        {
          title: 'Custom Map Controls',
          href: '/docs/examples/custom-map-controls',
        },
        {
          title: 'Synchronized Maps',
          href: '/docs/examples/synchronized-maps',
        },
        {
          title: 'Marker Clustering',
          href: '/docs/examples/marker-clustering',
        },
        {
          title: 'Custom Marker Clustering',
          href: '/docs/examples/custom-marker-clustering',
        },
        {
          title: 'Heatmap',
          href: '/docs/examples/heatmap',
        },
        {
          title: 'Static Map',
          href: '/docs/examples/static-map',
        },
      ],
    },
    {
      title: 'Experiments',
      items: [
        {
          title: 'SolidGuessr',
          href: '/experiments/solidguessr',
        },
        {
          title: 'Country Quiz',
          href: '/experiments/quiz',
        },
      ],
    },
  ],
}
