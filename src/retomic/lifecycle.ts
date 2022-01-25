import { useEffect, useMemo } from 'react'
import { mutable } from './mutable'
import { getState, setState } from './db'
import type {
  AtomRef,
  Db,
  LifeCycleEventData
} from './types'
import {
  defaultContext,
  $$lifeCycleChannel,
  LIFECYCLE_MOUNT,
  LIFECYCLE_UNMOUNT
} from './constants'
import { errorMsg, useDb } from './utils'

const onLifeCycleDefaults = {
  predicate<T>(
    { key }: LifeCycleEventData,
    atomRef: AtomRef<T>
  ) {
    return key === atomRef.key
  }
}

function numListeners<T>(db: Db<T>, key: string) {
  return db.subscriptions.listenerCount(key)
}

function cleanupRef<T>(db: Db<T>, atomRef: AtomRef<T>) {
  const { key, resetOnInactive } = atomRef

  mutable.atomRefsByKey.delete(key)

  if (!resetOnInactive) {
    return
  }

  const {
    // omit inactive state key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    [key]: _omitted,
    ...newStateWithoutRef
  } = getState(db)

  // dummy named function for debugging context
  function $$removeInactiveKey() {}

  return setState(
    db,
    newStateWithoutRef,
    atomRef,
    $$removeInactiveKey,
    undefined
  )
}

function isAtomActive<T>(db: Db<T>, atomRef: AtomRef<T>) {
  return db.activeHooks[atomRef.key] > 0
}

function emitLifeCycleEvent<T>(
  db: Db<T>,
  atomRef: AtomRef<T>,
  // TODO: add LIFECYCLE_STATE_CHANGE as a type as well
  type: typeof LIFECYCLE_MOUNT | typeof LIFECYCLE_UNMOUNT
) {
  if (numListeners(db, $$lifeCycleChannel) === 0) {
    return
  }

  db.subscriptions.emit($$lifeCycleChannel, {
    type,
    key: atomRef.key,
    state: getState(db),
    activeHooks: { ...db.activeHooks }
  })
}

export function useLifeCycle(
  atomRef: AtomRef<any>,
  hookType: keyof Db<any>['activeHooks']
) {
  const db = useDb()
  const hasAtomRoot = db !== defaultContext

  if (!hasAtomRoot) {
    throw new Error(
      errorMsg(
        'Application tree must be wrapped in an `AtomRoot` component'
      )
    )
  }

  const handleAtomLifeCycleState = () => {
    db.activeHooks[atomRef.key] =
      (db.activeHooks[atomRef.key] || 0) + 1
    emitLifeCycleEvent(db, atomRef, LIFECYCLE_MOUNT)

    return () => {
      db.activeHooks[atomRef.key] -= 1

      if (!isAtomActive(db, atomRef)) {
        delete db.activeHooks[atomRef.key]
        cleanupRef(db, atomRef)
      }

      emitLifeCycleEvent(db, atomRef, LIFECYCLE_UNMOUNT)
    }
  }

  useEffect(handleAtomLifeCycleState, [
    db,
    atomRef,
    hookType
  ])
}

export function useOnLifeCycle<T>(
  atomRef: AtomRef<T>,
  fn: (data: {
    type: string
    activeHooks: Db<T>['activeHooks']
    state: Db<T>['state']
  }) => void,
  predicate: (
    data: LifeCycleEventData,
    atomRef: AtomRef<T>
  ) => boolean = onLifeCycleDefaults.predicate
) {
  const db = useDb()
  const unsubscribe = useMemo(() => {
    return db.subscriptions.on(
      $$lifeCycleChannel,
      (data) => {
        const { type, state, activeHooks } = data

        if (!predicate(data, atomRef)) {
          return
        }

        fn({
          type,
          activeHooks,
          state
        })
      }
    )
  }, [db, fn, predicate, atomRef])

  return unsubscribe
}
