import { useEffect, useMemo, useState } from 'react'
import { getState, setState } from './db'
import { useLifeCycle } from './lifecycle'
import { mutable } from './mutable'
import type { Atom, WatcherFn } from './types'
import { useDb } from './utils'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function $$resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

function checkDuplicateAtomKey(key: Atom<any>['key']) {
  const isDuplicateKey = mutable.atomsByKey.has(key)

  if (isDuplicateKey) {
    const duplicateKeyPrefix =
      process.env.NODE_ENV === 'development'
        ? '/@atomDuplicate'
        : ''
    const newKey = `${key}${duplicateKeyPrefix}/${mutable.duplicaKeyCount}`

    mutable.duplicaKeyCount += 1
    console.warn(
      `Warning: duplicate atom key \`${key}\` detected. As a safety precaution a new key, \`${newKey}\`, was automatically generated.`
    )

    return newKey
  }

  return key
}

export type { Atom } from './types'
export { AtomDevTools } from './AtomDevTools'
// IMPORTANT: for backwards compatibility
export { RetomicRoot as AtomRoot } from './RetomicRoot'
export { RetomicRoot } from './RetomicRoot'

export function atom<T>({
  key,
  defaultState,
  resetOnInactive = true
}: Atom<T>): Readonly<Atom<T>> {
  const actualKey = checkDuplicateAtomKey(key)
  const ref = {
    key: actualKey,
    defaultState,
    resetOnInactive
  }

  mutable.atomsByKey.set(actualKey, ref)

  return ref
}
// IMPORTANT: for backwards compatibility
export const atomRef = atom

export function useRead<T, SelectorValue = T>(
  atom: Atom<T>,
  selector: (state: T) => SelectorValue
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
        mutationFn: (oldState: T, payload: Payload) => T,
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
