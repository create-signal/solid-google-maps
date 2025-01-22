import { Ref, createSignal } from 'solid-js'

export function useCallbackRef<T>() {
  const [el, setEl] = createSignal<T | null>(null)
  const ref = (value: T) => setEl(() => value)

  return [el, ref] as const
}
