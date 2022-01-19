import Emittery from 'emittery'

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

interface EventData {
  oldState: DbState
  newState: DbState
  atomRef: AtomRef<any>
  mutationFn: Function
  mutationPayload: any
  db: Db<any>
}

export type WatcherFn = (data: EventData) => void

export interface Db<T> {
  state: Readonly<DbState>
  subscriptions: Emittery
  activeHooks: Map<AtomRef<T>['key'], number>
}
