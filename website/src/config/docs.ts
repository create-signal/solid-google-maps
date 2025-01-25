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
      href: '/examples/solidguessr',
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
      title: 'Usage',
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
          title: 'Static Map',
          href: '/docs/examples/static-map',
        },
      ],
    },
    {
      title: 'Examples',
      items: [
        {
          title: 'SolidGuessr',
          href: '/examples/solidguessr',
        },
        {
          title: 'Country Quiz',
          href: '/examples/quiz',
        },
      ],
    },
  ],
}
