import Emittery from 'emittery'

import {
  lifecycleStateChange,
  $$lifecycleChannel
} from './constants'

type Subscriptions<T> = Emittery<
  {
    [key: Atom<T>['key']]: WatcherEventData
    [lifecycleStateChange]: WatcherEventData
  } & {
    [$$lifecycleChannel]: LifecycleEventData
  }
>

export interface DbState {
  [key: string]: any
}

export interface Db<T> {
  state: Readonly<DbState>
  subscriptions: Subscriptions<T>
  // hook counts
  activeHooks: {
    [atomKey: string]: number
  }
  id: string
}

export interface LifecycleEventData {
  type: string
  key: Atom<any>['key']
  state: Db<any>['state']
  activeHooks: Readonly<Db<any>['activeHooks']>
}

export type LifecycleFn = (data: LifecycleEventData) => void

interface WatcherEventData {
  oldState: DbState
  newState: DbState
  atom: Atom<any>
  updateFn: Function
  updatePayload: any
  db: Db<any>
}

export type WatcherFn = (data: WatcherEventData) => void

export interface AtomObserverProps {
  onChange: WatcherFn
  onLifecycle?: LifecycleFn
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

/***************
 * Public Types
 ***************/
export interface Atom<T> {
  key: string
  defaultState: T
  /**
   * Whether to reset the state when there are no active
   * hooks.
   */
  resetOnInactive?: boolean
}

export type SelectorFn<State, SelectorValue> = (
  state: State
) => SelectorValue

export type UpdateFn<State, Payload> = (
  state: State,
  payload: Payload
) => State
