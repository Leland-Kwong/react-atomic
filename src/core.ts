import { useEffect, useMemo, useState } from 'react'
import { getState, setState } from './db'
import { useLifeCycle } from './lifecycle'
import type {
  Atom,
  SelectorFn,
  UpdateFn,
  WatcherFn
} from './types'
import { useDb } from './utils'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function $$resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

export type { Atom, SelectorFn, UpdateFn } from './types'
export { AtomDevTools } from './AtomDevTools'
// IMPORTANT: alias for backwards compatibility
export { RetomicRoot as AtomRoot } from './RetomicRoot'
export { RetomicRoot } from './RetomicRoot'

export function atom<T>({
  key,
  defaultState,
  resetOnInactive = true
}: Atom<T>): Readonly<Atom<T>> {
  return {
    key,
    defaultState,
    resetOnInactive
  }
}
// IMPORTANT: alias for backwards compatibility
export const atomRef = atom

export function useRead<T, SelectorValue = T>(
  atom: Atom<T>,
  selector: SelectorFn<T, SelectorValue>
) {
  const { key, defaultState } = atom
  const rootDb = useDb()
  const initialStateSlice = getState(rootDb)[key]
  const [hookState, setHookState] = useState(
    selector(defaultTo(defaultState, initialStateSlice))
  )

  useEffect(() => {
    const watcherFn: WatcherFn = ({
      oldState,
      newState
    }) => {
      const prev = oldState[key]
      const stateSlice = newState[key]
      const nextValue = selector(
        defaultTo(defaultState, stateSlice)
      )
      const hasChanged = prev !== nextValue

      if (!hasChanged) {
        return
      }

      setHookState(nextValue)
    }

    return rootDb.subscriptions.on(key, watcherFn)
  }, [rootDb, key, selector, defaultState, atom])
  useLifeCycle(atom, 'read')

  return hookState
}

export function useSend<T>(atom: Atom<T>) {
  const rootDb = useDb()

  useLifeCycle(atom, 'send')
  return useMemo(
    () =>
      <Payload>(
        mutationFn: UpdateFn<T, Payload>,
        payload: Payload
      ) => {
        if (
          process.env.NODE_ENV === 'development' &&
          !mutationFn.name
        ) {
          console.error(
            'Warning: This mutation function should be named -',
            mutationFn
          )
        }

        const { key, defaultState } = atom
        const rootState = getState(rootDb)
        const stateSlice = defaultTo(
          defaultState,
          rootState[key]
        )
        const nextState = {
          ...rootState,
          [key]: mutationFn(stateSlice, payload)
        }

        return setState(
          rootDb,
          nextState,
          atom,
          mutationFn,
          payload
        )
      },
    [rootDb, atom]
  )
}

export function useReset<T>(atom: Atom<T>) {
  const mutate = useSend(atom)

  return useMemo(
    () => () => mutate($$resetAtom, atom.defaultState),
    [mutate, atom.defaultState]
  )
}
