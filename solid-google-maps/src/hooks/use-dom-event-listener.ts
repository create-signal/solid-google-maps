import { Accessor, createEffect, on, onCleanup } from 'solid-js'

/**
 * Internally used to bind events to DOM nodes.
 * @internal
 */
export function useDomEventListener<T extends (...args: any[]) => void>(
  target?: Accessor<Node | null>,
  name?: string,
  callback?: Accessor<T | undefined>,
) {
  createEffect(
    on(
      () => ({ target: target?.(), callback: callback?.() }),
      ({ target, callback }) => {
        if (!target || !name || !callback) return

        target.addEventListener(name, callback)

        return onCleanup(() => target.removeEventListener(name, callback))
      },
    ),
  )
}
