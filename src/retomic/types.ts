import Emittery from 'emittery'

import { $$internal, $$lifeCycleChannel } from './constants'

type Subscriptions<T> = Emittery<
  {
    [key: AtomRef<T>['key']]: WatcherEventData
    [$$internal]: WatcherEventData
  } & {
    [$$lifeCycleChannel]: LifeCycleEventData
  }
>

export interface AtomRef<T> {
  key: string
  defaultState: T
}

export interface DbState {
  [key: string]: any
}

export interface Db<T> {
  state: Readonly<DbState>
  subscriptions: Subscriptions<T>
  activeRefKeys: Set<AtomRef<T>['key']>
}

export interface LifeCycleEventData {
  type: string
  key: AtomRef<any>['key']
}

export type LifecycleFn = (
  data: LifeCycleEventData & {
    activeHooks: { [key: string]: number }
  }
) => void

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
