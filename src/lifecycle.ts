import { useEffect, useMemo } from 'react'
import {
  emitLifeCycleEvent,
  getState,
  setState
} from './db'
import type { Atom, Db, LifeCycleEventData } from './types'
import {
  $$lifeCycleChannel,
  LIFECYCLE_MOUNT,
  LIFECYCLE_UNMOUNT
} from './constants'
import { defaultContext } from './root-context'
import { errorMsg, useDb } from './utils'

const onLifeCycleDefaults = {
  predicate<T>({ key }: LifeCycleEventData, atom: Atom<T>) {
    return key === atom.key
  }
}

function cleanupRef<T>(db: Db<T>, atom: Atom<T>) {
  const { key, resetOnInactive } = atom

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
    atom,
    $$removeInactiveKey,
    undefined
  )
}

function isAtomActive<T>(db: Db<T>, atom: Atom<T>) {
  return db.activeHooks[atom.key] > 0
}

export function useLifeCycle(
  atom: Atom<any>,
  hookType: keyof Db<any>['activeHooks']
) {
  const db = useDb()
  const hasRetomicRoot = db !== defaultContext

  if (!hasRetomicRoot) {
    throw new Error(
      errorMsg(
        'Application tree must be wrapped in an `RetomicRoot` component'
      )
    )
  }

  const handleAtomLifeCycleState = () => {
    db.activeHooks[atom.key] =
      (db.activeHooks[atom.key] || 0) + 1
    emitLifeCycleEvent(db, atom, LIFECYCLE_MOUNT)

    return () => {
      db.activeHooks[atom.key] -= 1

      if (!isAtomActive(db, atom)) {
        delete db.activeHooks[atom.key]
        cleanupRef(db, atom)
      }

      emitLifeCycleEvent(db, atom, LIFECYCLE_UNMOUNT)
    }
  }

  useEffect(handleAtomLifeCycleState, [db, atom, hookType])
}

export function useOnLifeCycle<T>(
  atom: Atom<T>,
  fn: (data: {
    type: string
    activeHooks: Db<T>['activeHooks']
    state: Db<T>['state']
  }) => void,
  predicate: (
    data: LifeCycleEventData,
    atom: Atom<T>
  ) => boolean = onLifeCycleDefaults.predicate
) {
  const db = useDb()
  const unsubscribe = useMemo(() => {
    return db.subscriptions.on(
      $$lifeCycleChannel,
      (data) => {
        const { type, state, activeHooks } = data

        if (!predicate(data, atom)) {
          return
        }

        fn({
          type,
          activeHooks,
          state
        })
      }
    )
  }, [db, fn, predicate, atom])

  return unsubscribe
}
