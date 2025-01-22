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
      title: 'Components',
      href: '/docs/examples/accordion',
    },
    {
      title: 'Examples',
      href: '/examples/cards',
    },
    {
      title: 'Blocks',
      href: '/blocks',
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
          title: 'Synchronized Maps',
          href: '/docs/examples/synchronized-maps',
        },
        {
          title: 'Marker Clustering',
          href: '/docs/examples/marker-clustering',
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
      ],
    },
  ],
}
