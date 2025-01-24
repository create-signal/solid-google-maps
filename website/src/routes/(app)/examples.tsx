import { A, type RouteProps } from '@solidjs/router'

import { ExamplesNav } from '~/components/examples-nav'
import { MetaTags } from '~/components/meta-tags'
import { PageHeader, PageHeaderActions, PageHeaderDescription, PageHeaderHeading } from '~/components/page-header'
import { Button } from '~/components/ui/button'

export default function ExamplesLayout(props: RouteProps<string>) {
  return (
    <>
      <MetaTags
        title="Examples"
        description="Some examples built using `solid-google-maps` components. Use this as a guide to build your own."
      />
      <div class="relative">
        <PageHeader>
          <PageHeaderHeading>Check out some examples</PageHeaderHeading>
          <PageHeaderDescription>
            Some examples built using `solid-google-maps` components. Use this as a guide to build your own. More
            examples of basic behaviour and usage can be found in our documentation.
          </PageHeaderDescription>
          <PageHeaderActions>
            <Button as={A} size="sm" href="/docs/getting-started">
              Get Started
            </Button>
          </PageHeaderActions>
        </PageHeader>
        <section class="container py-6">
          <ExamplesNav />
          <div class="overflow-hidden rounded-[0.5rem] border bg-background shadow">{props.children}</div>
        </section>
      </div>
    </>
  )
}
