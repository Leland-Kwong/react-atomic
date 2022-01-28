import shallowEqual from 'shallowequal'
import { useEffect, useMemo, useRef } from 'react'
import { subscribe, unsubscribe } from './channels'
import { getState, setState } from './db'
import { hookLifecycle } from './lifecycle'
import {
  lifecycleMount,
  lifecycleUnmount
} from './constants'
import type {
  Atom,
  SelectorFn,
  UpdateFn,
  WatcherFn
} from './types'
import { logMsg, useDb, useUpdate } from './utils'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function $$resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

export type { Atom, SelectorFn, UpdateFn } from './types'
export { RetomicRoot } from './RetomicRoot'
export { useOnLifecycle } from './lifecycle'

export function createAtom<T>({
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

type IsEqualFn<T> = (prev: T, next: T) => boolean

const defaultIsEqualFn = <T>(prev: T, next: T) =>
  prev === next || shallowEqual(prev, next)

export function useRead<T, SelectorValue = T>(
  atom: Atom<T>,
  selector: SelectorFn<T, SelectorValue>,
  isEqualFn: IsEqualFn<SelectorValue> = defaultIsEqualFn
): SelectorValue {
  const { key, defaultState } = atom
  const db = useDb()
  const update = useUpdate()
  const args = { atom, selector, isEqualFn }
  const argsRef = useRef({} as typeof args)
  const selectorValue = useRef(
    undefined as unknown as SelectorValue
  )
  const shouldRecalculate =
    argsRef.current.selector !== selector ||
    argsRef.current.isEqualFn !== isEqualFn

  argsRef.current = args

  if (shouldRecalculate) {
    const stateSlice = getState(db)[key]
    const prev = selectorValue.current
    const next = selector(
      defaultTo(defaultState, stateSlice)
    )

    if (!isEqualFn(prev, next)) {
      selectorValue.current = next
    }
  }

  useEffect(() => {
    hookLifecycle(db, atom, lifecycleMount)

    const watcherFn: WatcherFn = ({
      oldState,
      newState
    }) => {
      if (oldState[key] === newState[key]) {
        return
      }

      const curArgs = argsRef.current
      const prev = selectorValue.current
      const next = curArgs.selector(
        defaultTo(defaultState, newState[key])
      )

      if (curArgs.isEqualFn(prev, next)) {
        return
      }

      selectorValue.current = next
      update()
    }

    const id = subscribe(db.stateChangeChannel, watcherFn)

    return () => {
      unsubscribe(db.stateChangeChannel, id)
      hookLifecycle(db, atom, lifecycleUnmount)
    }
  }, [db, key, defaultState, atom, update])

  return selectorValue.current
}

export function useSend<T>(atom: Atom<T>) {
  const db = useDb()

  useEffect(() => {
    hookLifecycle(db, atom, lifecycleMount)

    return () => hookLifecycle(db, atom, lifecycleUnmount)
  }, [db, atom])

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
            logMsg(
              'This update function should be named -',
              'warning'
            ),
            updateFn
          )
        }

        const { key, defaultState } = atom
        const rootState = getState(db)
        const stateSlice = defaultTo(
          defaultState,
          rootState[key]
        )
        const nextState = {
          ...rootState,
          [key]: updateFn(stateSlice, payload)
        }

        return setState(
          db,
          nextState,
          atom,
          updateFn,
          payload
        )
      },
    [db, atom]
  )
}

export function useReset<T>(atom: Atom<T>) {
  const mutate = useSend(atom)

  return useMemo(
    () => () => mutate($$resetAtom, atom.defaultState),
    [mutate, atom.defaultState]
  )
}
