import { useEffect } from 'react'
import { mutable } from './mutable'
import { getState, setState } from './db'
import type { AtomRef, Db } from './types'
import {
  $$lifeCycleChannel,
  LIFECYCLE_MOUNT,
  LIFECYCLE_UNMOUNT
} from './constants'

function $$removeInactiveKey() {}

function cleanupRef<T>(db: Db<T>, atomRef: AtomRef<T>) {
  mutable.atomRefsByKey.delete(atomRef.key)
  // remove the state key since is inactive
  const { [atomRef.key]: _, ...newStateWithoutRef } =
    getState(db)

  return setState(
    db,
    newStateWithoutRef,
    atomRef,
    $$removeInactiveKey,
    undefined
  )
}

function useLifeCycleEvents(
  db: Db<any>,
  atomRef: AtomRef<any>
) {
  useEffect(() => {
    const hasLifeCycleListeners =
      db.subscriptions.listenerCount($$lifeCycleChannel) > 0

    if (!hasLifeCycleListeners) {
      return
    }

    const asyncMountEvent = db.subscriptions.emit(
      $$lifeCycleChannel,
      {
        type: LIFECYCLE_MOUNT,
        key: atomRef.key
      }
    )

    return () => {
      asyncMountEvent.then(() => {
        db.subscriptions.emit($$lifeCycleChannel, {
          type: LIFECYCLE_UNMOUNT,
          key: atomRef.key
        })
      })
    }
  }, [db, atomRef])
}

export function useLifeCycle(
  db: Db<any>,
  atomRef: AtomRef<any>
) {
  const handleAtomLifeCycleState = () => {
    db.activeRefKeys.add(atomRef.key)

    return () => {
      const shouldCleanupAtom =
        db.subscriptions.listenerCount(atomRef.key) === 0

      if (!shouldCleanupAtom) {
        return
      }

      db.activeRefKeys.delete(atomRef.key)
      cleanupRef(db, atomRef)
    }
  }

  useLifeCycleEvents(db, atomRef)
  useEffect(handleAtomLifeCycleState, [db, atomRef])
}
