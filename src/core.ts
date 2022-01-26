import { useEffect, useMemo, useRef, useState } from 'react'
import { subscribe, unsubscribe } from './channels'
import { getState, setState } from './db'
import { useHookLifecycle } from './lifecycle'
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
export { useOnLifecycle } from './lifecycle'

export function atom<T>({
  key,
  defaultState,
  resetOnInactive = true
}: Atom<T>): Atom<T> {
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
  /**
   * IMPORTANT
   * We're using a ref to store the selector to prevent the
   * effect callback from rerunning each render cycle. This
   * can happen if the selector function provided is an
   * inline function which can cause some strange edge
   * cases (like change events not being registered. This
   * could be due to the async event emitter we're using,
   * but we need to investigate this).
   */
  const selectorRef = useRef(selector)

  useEffect(() => {
    selectorRef.current = selector
  })
  useEffect(() => {
    const watcherFn: WatcherFn = ({
      oldState,
      newState
    }) => {
      const prev = oldState[key]
      const stateSlice = newState[key]
      const nextValue = selectorRef.current(
        defaultTo(defaultState, stateSlice)
      )
      const hasChanged = prev !== nextValue

      if (!hasChanged) {
        return
      }

      setHookState(nextValue)
    }

    const id = subscribe(
      rootDb.stateChangeChannel,
      watcherFn
    )
    return () => unsubscribe(rootDb.stateChangeChannel, id)
  }, [rootDb, key, defaultState, atom])
  useHookLifecycle(atom, 'read')

  return hookState
}

export function useSend<T>(atom: Atom<T>) {
  const rootDb = useDb()

  useHookLifecycle(atom, 'send')
  return useMemo(
    () =>
      <Payload>(
        updateFn: UpdateFn<T, Payload>,
        payload: Payload
      ) => {
        if (
          process.env.NODE_ENV === 'development' &&
          !updateFn.name
        ) {
          console.error(
            'Warning: This update function should be named -',
            updateFn
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
          [key]: updateFn(stateSlice, payload)
        }

        return setState(
          rootDb,
          nextState,
          atom,
          updateFn,
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
