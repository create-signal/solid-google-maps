import { A } from '@solidjs/router'
import { ExamplesNav } from '~/components/examples-nav'

import { IconBrandGithub } from '~/components/icons'
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from '~/components/page-header'
import { Button } from '~/components/ui/button'
import SolidGuessr from '~/examples/solidguessr'

export default function Home() {
  return (
    <div class="relative">
      <PageHeader>
        <PageHeaderHeading>Make Mapping Easy.</PageHeaderHeading>
        <PageHeaderDescription>
          Use a Google map as a fully controlled reactive component and use all the other features of the Google Maps
          JavaScript API.
        </PageHeaderDescription>
        <p class="text-sm text-[#4d83c4] dark:text-[#93c4e9]">
          This is an unofficial port of{' '}
          <A
            href="https://github.com/visgl/react-google-maps/"
            target="_blank"
            rel="noreferrer"
            class="font-medium underline underline-offset-4"
          >
            react-google-maps
          </A>{' '}
          to Solid.
        </p>
        <PageHeaderActions>
          <Button as={A} size="sm" href="/docs/introduction">
            Get Started
          </Button>
          <Button
            as={A}
            variant="ghost"
            size="sm"
            href="https://github.com/create-signal/solid-google-maps"
            target="_blank"
            rel="noreferrer"
          >
            <IconBrandGithub /> GitHub
          </Button>
        </PageHeaderActions>
      </PageHeader>
      <section class="container py-6">
        <ExamplesNav />
        <div class="hidden md:block [&>div]:p-0">
          <div class="overflow-hidden rounded-[0.5rem] border bg-background shadow h-[calc(100vh-4rem)] relative">
            <SolidGuessr />
          </div>
        </div>
      </section>
    </div>
  )
}
