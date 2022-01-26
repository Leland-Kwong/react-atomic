import Emittery from 'emittery'
import { channel, emit, subscriberCount } from './channels'
import {
  lifecycleStateChange,
  lifecycleMount,
  lifecycleUnmount
} from './constants'
import type { Atom, Db } from './types'

export function makeDb<T>(initialState: T): Db<T> {
  const subscriptions: Db<T>['subscriptions'] =
    new Emittery()

  return {
    state: initialState,
    subscriptions,
    lifecycleChannel: channel(),
    activeHooks: {},
    id: (Math.random() * 1000).toString(32)
  }
}

export function emitLifecycleEvent<T>(
  db: Db<T>,
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

export async function setState<T>(
  db: Db<T>,
  newState: T,
  atom: Atom<T>,
  updateFn: Function,
  updatePayload: any
) {
  const oldState = db.state
  const eventData = {
    oldState,
    newState,
    atom,
    updateFn,
    updatePayload,
    db
  }

  db.state = newState

  return Promise.all([
    db.subscriptions.emit(atom.key, eventData),
    emitLifecycleEvent(db, atom, lifecycleStateChange)
  ])
}

export function getState<T>(db: Db<T>) {
  return db.state
}
