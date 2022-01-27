import shallowEqual from 'shallowequal'
import {
  useEffect,
  useMemo,
  useRef,
  useReducer
} from 'react'
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
import { useDb } from './utils'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function $$resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

export type { Atom, SelectorFn, UpdateFn } from './types'
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

type IsEqualFn<T> = (prev: T, next: T) => boolean

const updateReadReducer = (toggleNum: number) =>
  toggleNum ? 0 : 1

const hasChanged = <T>(
  prev: T,
  next: T,
  isEqualFn: IsEqualFn<T>
) => prev !== next && !isEqualFn(prev, next)

export function useRead<T, SelectorValue = T>(
  atom: Atom<T>,
  selector: SelectorFn<T, SelectorValue>,
  isEqualFn: IsEqualFn<SelectorValue> = shallowEqual
): SelectorValue {
  const { key, defaultState } = atom
  const db = useDb()
  const [, update] = useReducer(updateReadReducer, 0)
  const selectorValue = useRef(
    undefined as unknown as SelectorValue
  )
  const selectorRef = useRef(
    undefined as unknown as SelectorFn<T, SelectorValue>
  )
  const isEqualFnRef = useRef(
    undefined as unknown as IsEqualFn<SelectorValue>
  )
  const isNewSelector = selectorRef.current !== selector

  isEqualFnRef.current = isEqualFn

  if (isNewSelector) {
    const stateSlice = getState(db)[key]
    const prev = selectorValue.current
    const next = selector(
      defaultTo(defaultState, stateSlice)
    )

    if (hasChanged(prev, next, isEqualFn)) {
      selectorValue.current = next
    }
    /**
     * IMPORTANT
     * Update the selector in case it changes between renders.
     */
    selectorRef.current = selector
  }

  useEffect(() => {
    hookLifecycle(db, atom, lifecycleMount)

    const watcherFn: WatcherFn = ({
      newState,
      atom: initiatedBy
    }) => {
      const maybeUpdate = initiatedBy.key === key

      if (!maybeUpdate) {
        return
      }

      const prev = selectorValue.current
      const next = selectorRef.current(
        defaultTo(defaultState, newState[key])
      )

      if (!hasChanged(prev, next, isEqualFnRef.current)) {
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
  }, [db, key, defaultState, atom])

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
            'Warning: This update function should be named -',
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
