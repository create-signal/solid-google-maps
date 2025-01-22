import { Accessor, createEffect, on, onCleanup } from 'solid-js'

/**
 * Internally used to bind events to Maps JavaScript API objects.
 * @internal
 */
export function useMapsEventListener<T extends (...args: any[]) => void>(
  target?: Accessor<object | null>,
  name?: string,
  callback?: Accessor<T | undefined>,
) {
  createEffect(
    on(
      () => ({
        target: target?.(),
        callback: callback?.(),
      }),
      ({ target, callback }) => {
        if (!target || !name || !callback) return

        const listener = google.maps.event.addListener(target, name, callback)

        return onCleanup(() => listener.remove())
      },
    ),
  )
}
