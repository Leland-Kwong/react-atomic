// TODO: add ability to pause mutations. This will be useful
// for debugging purposes.

import {
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  RootContext,
  $$internal,
  $$lifeCycleChannel
} from './constants'
import type { AtomRef, WatcherFn, Db } from './types'

const mutable = {
  duplicaKeyCount: 0,
  atomRefsByKey: new Map<
    AtomRef<any>['key'],
    AtomRef<any>
  >()
}

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function setState<T>(
  db: Db<T>,
  newState: T,
  atomRef: AtomRef<T>,
  mutationFn: Function,
  mutationPayload: any
) {
  const oldState = db.state
  const eventData = {
    oldState,
    newState,
    atomRef,
    mutationFn,
    mutationPayload,
    db
  }

  db.state = newState

  return Promise.all([
    db.subscriptions.emit(atomRef.key, eventData),
    db.subscriptions.emit($$internal, eventData)
  ])
}

function getState<T>(db: Db<T>) {
  return db.state
}

function $$resetInactiveAtom<T>(_: T, value: T) {
  return value
}

function addActiveHook<T>(db: Db<T>, atomRef: AtomRef<T>) {
  const hookCount = db.activeHooks.get(atomRef.key) || 0
  const newHookCount = hookCount + 1
  db.activeHooks.set(atomRef.key, newHookCount)
  db.subscriptions.emit($$lifeCycleChannel, {
    type: 'mount',
    key: atomRef.key,
    hookCount: db.activeHooks
  })
}

async function removeActiveHook<T>(
  db: Db<T>,
  atomRef: AtomRef<T>
) {
  const hookCount = db.activeHooks.get(atomRef.key) || 0
  const newHookCount = Math.max(0, hookCount - 1)

  db.activeHooks.set(atomRef.key, newHookCount)
  await db.subscriptions.emit($$lifeCycleChannel, {
    type: 'unmount',
    key: atomRef.key,
    hookCount: db.activeHooks
  })

  const isAtomActive = newHookCount > 0
  if (!isAtomActive) {
    mutable.atomRefsByKey.delete(atomRef.key)
    db.activeHooks.delete(atomRef.key)
    // remove the state key since the atom is inactive now
    const { [atomRef.key]: _, ...newStateWithoutRef } =
      getState(db)

    return setState(
      db,
      newStateWithoutRef,
      atomRef,
      $$resetInactiveAtom,
      atomRef.defaultState
    )
  }
}

function resetAtom<T>(_: T, defaultState: T) {
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
export { AtomDevTools } from './AtomDevTools'
export { AtomRoot } from './AtomRoot'

export function atomRef<T>({
  key,
  defaultState
}: {
  key: AtomRef<T>['key']
  defaultState: AtomRef<T>['defaultState']
}): Readonly<AtomRef<T>> {
  const actualKey = checkDuplicateAtomKey(key)
  const ref = {
    key: actualKey,
    defaultState
  }

  mutable.atomRefsByKey.set(actualKey, ref)

  return ref
}

export function useReadAtom<T, SelectorValue = T>(
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
    const watcherFn: WatcherFn = ({ newState }) => {
      const stateSlice = newState[key]
      const nextValue = selector(
        defaultTo(defaultState, stateSlice)
      )
      const hasChanged = hookState !== nextValue

      if (!hasChanged) {
        return
      }

      setHookState(nextValue)
    }

    addActiveHook(rootDb, atomRef)
    rootDb.subscriptions.on(key, watcherFn)

    return () => {
      removeActiveHook(rootDb, atomRef).then(() => {
        rootDb.subscriptions.off(key, watcherFn)
      })
    }
  }, [
    rootDb,
    key,
    hookState,
    selector,
    defaultState,
    atomRef
  ])

  return hookState
}

export function useSendAtom<T>(atomRef: AtomRef<T>) {
  const { key, defaultState } = atomRef
  const rootDb = useContext(RootContext)

  useEffect(() => {
    addActiveHook(rootDb, atomRef)

    return () => {
      removeActiveHook(rootDb, atomRef)
    }
  }, [rootDb, atomRef])

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
    [defaultState, rootDb, key, atomRef]
  )
}

export function useResetAtom<T>(atomRef: AtomRef<T>) {
  const mutate = useSendAtom(atomRef)

  return useMemo(() => {
    return () => {
      return mutate(resetAtom, atomRef.defaultState)
    }
  }, [mutate, atomRef.defaultState])
}
