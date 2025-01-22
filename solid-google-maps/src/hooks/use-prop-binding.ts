import { Setter, createEffect, on } from 'solid-js'
import { Accessor } from 'solid-js'

/**
 * Internally used to copy values from props into API-Objects
 * whenever they change.
 *
 * @example
 *   usePropBinding(marker, 'position', position);
 *
 * @internal
 */
export function usePropBinding<T, K extends keyof NonNullable<T>>(
  object: Accessor<T>,
  setter: Setter<T>,
  prop: K,
  value: Accessor<NonNullable<T>[K]>
) {
  createEffect(
    on(
      () => ({
        o: object(),
        value: value()
      }),
      ({ o, value }) => {
        if (!o) return

        //@ts-ignore
        object()[prop] = value
      }
    )
  ) //, [object, prop, value])
}
