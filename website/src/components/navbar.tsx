import { A, useLocation } from '@solidjs/router'

import { IconBrandGithub, IconLogo } from '~/components/icons'
import { cn } from '~/lib/utils'
import { buttonVariants } from './ui/button'
import { MobileNav } from './mobile-nav'
import { ModeToggle } from './mode-toggle'
import { MapIcon } from 'lucide-solid'

export default function Navbar() {
  const location = useLocation()
  const pathname = () => location.pathname

  return (
    <header class="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 dark:border-border">
      <div class="flex h-14 items-center px-4">
        <MobileNav />

        <div class="mr-4 hidden md:flex">
          <A href="/" class="mr-6 flex items-center space-x-2">
            <MapIcon class="size-6" />
            <span class="hidden font-bold sm:inline-block">Solid Google Maps</span>
          </A>
          <nav class="flex items-center gap-4 text-sm lg:gap-6">
            <A
              href="/docs/introduction"
              class={cn(
                'transition-colors hover:text-foreground/80',
                pathname().startsWith('/docs') && !pathname().startsWith('/docs/examples')
                  ? 'text-foreground'
                  : 'text-foreground/80',
              )}
            >
              Docs
            </A>
            <A
              href="/docs/examples/basic-map"
              class={cn(
                'transition-colors hover:text-foreground/80',
                pathname().startsWith('/docs/examples') ? 'text-foreground' : 'text-foreground/80',
              )}
            >
              Examples
            </A>
            <A
              href="/experiments/solidguessr"
              class={cn(
                'transition-colors hover:text-foreground/80',
                pathname().startsWith('/experiments') ? 'text-foreground' : 'text-foreground/80',
              )}
            >
              Experiments
            </A>
          </nav>
        </div>
        <div class="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div class="w-full flex-1 md:w-auto md:flex-none">{/*<SearchBar />*/}</div>
          <div class="flex items-center">
            <A href="https://github.com/create-signal/solid-google-maps" target="_blank" rel="noreferrer">
              <div
                class={cn(
                  buttonVariants({
                    size: 'sm',
                    variant: 'ghost',
                  }),
                  'w-9 px-0',
                )}
              >
                <IconBrandGithub class="size-5" />
                <span class="sr-only">GitHub</span>
              </div>
            </A>
            <ModeToggle />
          </div>
        </div>
      </div>
    </header>
  )
}
