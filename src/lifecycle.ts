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

function cleanupAtom<T>(db: Db, atom: Atom<T>) {
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

function isAtomActive<T>(db: Db, atom: Atom<T>) {
  return db.activeHooks[atom.key] > 0
}

/**
 * Tracks hook info, triggers mount/unmount lifecycle
 * events, and handles any atom cleanup as necessary.
 */
export function hookLifecycle(
  db: Db,
  atom: Atom<any>,
  lifecycleType:
    | typeof lifecycleMount
    | typeof lifecycleUnmount
) {
  const hasRetomicRoot = db !== defaultContext

  if (!hasRetomicRoot) {
    throw new Error(
      errorMsg(
        'Application tree must be wrapped in an `RetomicRoot` component'
      )
    )
  }

  if (lifecycleType === lifecycleMount) {
    db.activeHooks[atom.key] =
      (db.activeHooks[atom.key] || 0) + 1
  }

  if (lifecycleType === lifecycleUnmount) {
    db.activeHooks[atom.key] -= 1

    if (!isAtomActive(db, atom)) {
      delete db.activeHooks[atom.key]
      cleanupAtom(db, atom)
    }
  }

  emitLifecycleEvent(db, atom, lifecycleType)
}

/**
 * @public
 * A react hook for observing retomic lifecycle changes
 */
export function useOnLifecycle(
  fn: (data: {
    type: string
    activeHooks: Db['activeHooks']
    state: Db['state']
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
