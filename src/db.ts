import { channel, emit, subscriberCount } from './channels'
import {
  lifecycleStateChange,
  lifecycleMount,
  lifecycleUnmount
} from './constants'
import type { Atom, Db, WatcherEventData } from './types'

export function makeDb<T>(initialState: T): Db {
  return {
    state: initialState,
    stateChangeChannel: channel(),
    lifecycleChannel: channel(),
    activeHooks: {},
    id: (Math.random() * 1000).toString(32)
  }
}

export async function setState<T>(
  db: Db,
  newState: T,
  atom: Atom<T>,
  updateFn: Function,
  updatePayload: any
) {
  const oldState = db.state
  const eventData: WatcherEventData = {
    oldState,
    newState,
    atom,
    updateFn,
    updatePayload,
    db
  }

  db.state = newState
  emit(db.stateChangeChannel, eventData)
  emitLifecycleEvent(db, atom, lifecycleStateChange)
}

export function getState(db: Db) {
  return db.state
}

export function emitLifecycleEvent<T>(
  db: Db,
  atom: Atom<T>,
  type:
    | typeof lifecycleMount
    | typeof lifecycleUnmount
    | typeof lifecycleStateChange
) {
  if (subscriberCount(db.lifecycleChannel) === 0) {
    return
  }

  emit(db.lifecycleChannel, {
    type,
    key: atom.key,
    state: getState(db),
    activeHooks: { ...db.activeHooks }
  })
}
