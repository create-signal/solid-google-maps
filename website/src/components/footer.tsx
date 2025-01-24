import type { JSX } from 'solid-js'
import { A } from '@solidjs/router'

function Link(props: { href: string; children: JSX.Element }) {
  return (
    <A href={props.href} target="_blank" rel="norefferer" class="font-medium underline underline-offset-4">
      {props.children}
    </A>
  )
}

export default function Footer() {
  return (
    <footer class="border-t border-border/40 py-6 md:px-8 md:py-0 dark:border-border">
      <div class="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p class="text-center text-sm leading-loose text-muted-foreground md:text-left">
          Built by <Link href="https://github.com/visgl">visgl</Link>. Ported to Solid by{' '}
          <Link href="https://github.com/create-signal">Create Signal</Link>.
        </p>
      </div>
    </footer>
  )
}
