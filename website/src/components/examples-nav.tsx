import type { ComponentProps } from 'solid-js'
import { For, Show, splitProps } from 'solid-js'
import { useLocation } from '@solidjs/router'

import { cn } from '~/lib/utils'

import { IconArrowRight } from './icons'

const examples = [
  {
    name: 'SolidGuessr',
    href: '/examples/solidguessr',
    code: 'https://github.com/create-signal/solid-google-maps/tree/main/apps/docs/src/examples/solidguessr',
  },
  {
    name: 'Country Quiz',
    href: '/examples/quiz',
    code: 'https://github.com/create-signal/solid-google-maps/tree/main/apps/docs/src/examples/quiz',
  },
]

export function ExamplesNav(props: ComponentProps<'div'>) {
  const [, rest] = splitProps(props, ['class'])
  const location = useLocation()
  const pathname = () => (location.pathname === '/' ? examples[0].href : location.pathname)
  const example = () => examples.find((example) => pathname().startsWith(example.href))

  return (
    <div class="relative">
      <div class={cn('mb-4 flex items-center', props.class)} {...rest}>
        <For each={examples}>
          {(example, idx) => (
            <a
              href={example.href}
              class={cn(
                'flex h-7 items-center justify-center rounded-md px-4 text-center text-sm transition-colors hover:text-primary',
                location.pathname.startsWith(example.href) || (location.pathname === '/' && idx() === 0)
                  ? 'bg-muted font-medium text-primary'
                  : 'text-muted-foreground',
              )}
            >
              {example.name}
            </a>
          )}
        </For>
      </div>
      <Show when={example()}>
        {(example) => (
          <a
            href={example().code}
            target="_blank"
            rel="nofollow"
            class="absolute right-0 top-0 hidden items-center rounded-[0.5rem] text-sm font-medium md:flex"
          >
            View code
            <IconArrowRight class="ml-1 size-4" />
          </a>
        )}
      </Show>
    </div>
  )
}
