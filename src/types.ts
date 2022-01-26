import { Channel } from './channels'

export interface DbState {
  [key: string]: any
}

export interface LifecycleEventData {
  type: string
  key: Atom<any>['key']
  state: Db['state']
  activeHooks: Readonly<Db['activeHooks']>
}

export interface Db {
  state: Readonly<DbState>
  stateChangeChannel: Channel<WatcherEventData>
  lifecycleChannel: Channel<LifecycleEventData>
  // hook counts
  activeHooks: {
    [atomKey: string]: number
  }
  id: string
}

export type LifecycleFn = (data: LifecycleEventData) => void

export interface WatcherEventData {
  oldState: DbState
  newState: DbState
  atom: Atom<any>
  updateFn: Function
  updatePayload: any
  db: Db
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
