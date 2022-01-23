import Emittery from 'emittery'
import { $$internal } from './constants'
import type { AtomRef, Db } from './types'

export function makeDb<T>(initialState: T): Db<T> {
  const subscriptions: Db<T>['subscriptions'] =
    new Emittery()

  return {
    state: initialState,
    subscriptions,
    activeRefKeys: new Set()
  }
}

export function setState<T>(
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

export function getState<T>(db: Db<T>) {
  return db.state
}
