import { useEffect } from 'react'
import {
  emitLifecycleEvent,
  getState,
  setState
} from './db'
import type { Atom, Db, LifecycleEventData } from './types'
import {
  lifecycleMount,
  lifecycleUnmount
} from './constants'
import { subscribe, unsubscribe } from './channels'
import { defaultContext } from './root-context'
import { errorMsg, useDb } from './utils'

const onLifecycleDefaults = {
  predicate() {
    return true
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

/**
 * Tracks hook info and triggers mount/unmount lifecycle
 * events.
 */
export function useHookLifecycle(
  atom: Atom<any>,
  hookType: 'read' | 'send'
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

  const handleAtomLifecycleState = () => {
    db.activeHooks[atom.key] =
      (db.activeHooks[atom.key] || 0) + 1
    emitLifecycleEvent(db, atom, lifecycleMount)

    return () => {
      db.activeHooks[atom.key] -= 1

      if (!isAtomActive(db, atom)) {
        delete db.activeHooks[atom.key]
        cleanupRef(db, atom)
      }

      emitLifecycleEvent(db, atom, lifecycleUnmount)
    }
  }

  useEffect(handleAtomLifecycleState, [db, atom, hookType])
}

/**
 * @public
 * A react hook for observing retomic lifecycle changes
 */
export function useOnLifecycle<T>(
  fn: (data: {
    type: string
    activeHooks: Db<T>['activeHooks']
    state: Db<T>['state']
  }) => void,
  predicate: (
    data: LifecycleEventData
  ) => boolean = onLifecycleDefaults.predicate
) {
  const db = useDb()

  useEffect(() => {
    const id = subscribe(db.lifecycleChannel, (data) => {
      if (!predicate(data)) {
        return
      }

      fn(data)
    })

    return () => unsubscribe(db.lifecycleChannel, id)
  }, [db, fn, predicate])
}
