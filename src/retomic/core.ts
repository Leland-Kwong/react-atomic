import {
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { RootContext } from './constants'
import { getState, setState } from './db'
import { useLifeCycle } from './lifecycle'
import { mutable } from './mutable'
import type { AtomRef, WatcherFn } from './types'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function $$resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

function checkDuplicateAtomKey(key: AtomRef<any>['key']) {
  const isDuplicateKey = mutable.atomRefsByKey.has(key)

  if (isDuplicateKey) {
    const duplicateKeyPrefix =
      process.env.NODE_ENV === 'development'
        ? '/@atomDuplicate'
        : ''
    const newKey = `${key}${duplicateKeyPrefix}/${mutable.duplicaKeyCount}`

    mutable.duplicaKeyCount += 1
    console.warn(
      `Warning: duplicate atomRef key \`${key}\` detected. As a safety precaution a new key, \`${newKey}\`, was automatically generated.`
    )

    return newKey
  }

  return key
}

export type { AtomRef } from './types'
export { useIsNew } from './utils'
export { AtomDevTools } from './AtomDevTools'
export { AtomRoot } from './AtomRoot'

export function atomRef<T>({
  key,
  defaultState,
  resetOnInactive = true
}: AtomRef<T>): Readonly<AtomRef<T>> {
  const actualKey = checkDuplicateAtomKey(key)
  const ref = {
    key: actualKey,
    defaultState,
    resetOnInactive
  }

  mutable.atomRefsByKey.set(actualKey, ref)

  return ref
}

export function useRead<T, SelectorValue = T>(
  atomRef: AtomRef<T>,
  selector: (state: T) => SelectorValue
) {
  const { key, defaultState } = atomRef
  const rootDb = useContext(RootContext)
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
  }, [rootDb, key, selector, defaultState, atomRef])
  useLifeCycle(rootDb, atomRef)

  return hookState
}

export function useSend<T>(atomRef: AtomRef<T>) {
  const rootDb = useContext(RootContext)

  useLifeCycle(rootDb, atomRef)
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

        const { key, defaultState } = atomRef
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
          atomRef,
          mutationFn,
          payload
        )
      },
    [rootDb, atomRef]
  )
}

export function useReset<T>(atomRef: AtomRef<T>) {
  const mutate = useSend(atomRef)

  return useMemo(
    () => () => mutate($$resetAtom, atomRef.defaultState),
    [mutate, atomRef.defaultState]
  )
}
