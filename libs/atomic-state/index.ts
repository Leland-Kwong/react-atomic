import {
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  RootContext,
  $$lifeCycleChannel,
  LIFECYCLE_MOUNT,
  LIFECYCLE_UNMOUNT
} from './constants'
import { getState, setState } from './db'
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

function $$resetInactiveAtom<T>(_: T, value: T) {
  return value
}

function cleanupRef<T>(db: Db<T>, atomRef: AtomRef<T>) {
  mutable.atomRefsByKey.delete(atomRef.key)
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

function onHookMount<T>(db: Db<T>, atomRef: AtomRef<T>) {
  db.activeRefKeys.add(atomRef.key)

  return db.subscriptions.emit($$lifeCycleChannel, {
    type: LIFECYCLE_MOUNT,
    key: atomRef.key
  })
}

async function onHookUnmount<T>(
  db: Db<T>,
  atomRef: AtomRef<T>
) {
  const isAtomActive =
    db.subscriptions.listenerCount(atomRef.key) > 0

  if (!isAtomActive) {
    db.activeRefKeys.delete(atomRef.key)
    await cleanupRef(db, atomRef)
  }

  await db.subscriptions.emit($$lifeCycleChannel, {
    type: LIFECYCLE_UNMOUNT,
    key: atomRef.key
  })
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

    const unsubscribe = rootDb.subscriptions.on(
      key,
      watcherFn
    )
    const asyncMountEvent = onHookMount(rootDb, atomRef)

    return () => {
      unsubscribe()
      asyncMountEvent.then(() => {
        onHookUnmount(rootDb, atomRef)
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
    const asyncMountEvent = onHookMount(rootDb, atomRef)

    return () => {
      asyncMountEvent.then(() => {
        onHookUnmount(rootDb, atomRef)
      })
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

  return useMemo(
    () => () => mutate(resetAtom, atomRef.defaultState),
    [mutate, atomRef.defaultState]
  )
}
