import { createMemo, lazy, mergeProps, splitProps, type Component, type ComponentProps } from 'solid-js'

import { cn } from '~/lib/utils'
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs'

interface ComponentPreviewProps extends ComponentProps<'div'> {
  name: string
  source: string
  align?: 'center' | 'start' | 'end'
  type?: 'component' | 'example'
}

const ComponentPreview: Component<ComponentPreviewProps> = (rawProps) => {
  const props = mergeProps({ align: 'center' } as const, rawProps)
  const [local, others] = splitProps(props, ['class', 'align', 'children', 'name', 'type'])

  const Preview = createMemo(() => {
    const Component = lazy(() => import(`../examples/${local.name}.tsx`))

    if (!Component) {
      return (
        <p class="text-sm text-muted-foreground">
          Component{' '}
          <code class="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">{local.name}</code> not
          found in registry.
        </p>
      )
    }

    return <Component />
  })

  return (
    <div class={cn('group relative my-4 flex flex-col space-y-2', local.class)} {...others}>
      <Tabs defaultValue="preview" class="relative mr-auto w-full h-full">
        <div class="flex items-center justify-between pb-3">
          <TabsList class="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger
              value="preview"
              class="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[selected]:border-b-primary data-[selected]:text-foreground data-[selected]:shadow-none"
            >
              Preview
            </TabsTrigger>
            <TabsTrigger
              value="code"
              class="relative h-9 rounded-none border-b-2 border-b-transparent bg-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground shadow-none transition-none data-[selected]:border-b-primary data-[selected]:text-foreground data-[selected]:shadow-none"
            >
              Code
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="preview" class="relative rounded-md border h-full">
          <div
            class={cn(
              'preview flex flex-col min-h-[350px] w-full justify-center h-full',
              local.align === 'center' && 'items-center',
              local.align === 'start' && 'items-start',
              local.align === 'end' && 'items-end',
            )}
          >
            <Preview />
          </div>
        </TabsContent>
        <TabsContent value="code">
          <div class="flex flex-col space-y-4">
            <div class="w-full rounded-md [&_pre]:my-0 [&_pre]:max-h-[350px] [&_pre]:overflow-auto">
              {local.children}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

export { ComponentPreview }
