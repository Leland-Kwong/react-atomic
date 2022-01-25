import Emittery from 'emittery'
import { $$internal } from './constants'
import type { Atom, Db } from './types'

export function makeDb<T>(initialState: T): Db<T> {
  const subscriptions: Db<T>['subscriptions'] =
    new Emittery()

  return {
    state: initialState,
    subscriptions,
    activeHooks: {}
  }
}

export function setState<T>(
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
    db.subscriptions.emit($$internal, eventData)
  ])
}

export function getState<T>(db: Db<T>) {
  return db.state
}
