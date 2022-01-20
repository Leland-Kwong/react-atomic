import Emittery from 'emittery'

import { $$internal, $$lifeCycleChannel } from './constants'

export interface DefaultAtomOptions<T> {
  shouldUpdateSelector: <SelectorValue = T>(
    oldValue: SelectorValue,
    newValue: SelectorValue
  ) => boolean
}

export interface AtomRef<T> {
  key: string
  defaultState: T
  defaultOptions: DefaultAtomOptions<T>
}

export interface DbState {
  [key: string]: any
}

export interface Db<T> {
  state: Readonly<DbState>
  subscriptions: Emittery<
    {
      [key: AtomRef<T>['key']]: WatcherEventData
      [$$internal]: WatcherEventData
    } & {
      [$$lifeCycleChannel]: LifeCycleEventData
    }
  >
  activeHooks: Map<AtomRef<T>['key'], number>
}

interface LifeCycleEventData {
  type: string
  key: AtomRef<any>['key']
  hookCount: Db<any>['activeHooks']
}

export type LifecycleFn = (data: LifeCycleEventData) => void

interface WatcherEventData {
  oldState: DbState
  newState: DbState
  atomRef: AtomRef<any>
  mutationFn: Function
  mutationPayload: any
  db: Db<any>
}

export type WatcherFn = (data: WatcherEventData) => void

export interface AtomObserverProps {
  onChange: WatcherFn
  onLifeCycle?: LifecycleFn
}

export interface DevToolsLogEntry {
  timestamp: number
  atomState: any
  action: {
    functionName: string
    payload: any
    atomKey: string
  }
}
