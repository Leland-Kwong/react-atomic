import Emittery from 'emittery'
import type { Db } from './types'

export function makeDb<T>(initialState: T): Db<T> {
  const subscriptions: Db<T>['subscriptions'] =
    new Emittery()

  return {
    state: initialState,
    subscriptions,
    activeHooks: new Map()
  }
}
