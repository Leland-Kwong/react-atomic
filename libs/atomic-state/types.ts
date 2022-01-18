import { $$internal } from './constants'

export type $$Internal = typeof $$internal

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

export type WatcherFn = (
  oldState: DbState,
  newState: DbState,
  atomRef: AtomRef<any>,
  mutationFn: Function,
  mutationPayload: any,
  db: Db<any>
) => void

type Subscription = WatcherFn

export interface Db<T> {
  state: Readonly<DbState>
  subscriptions: Map<
    AtomRef<T>['key'] | $$Internal,
    Set<Subscription>
  >
  activeHooks: Map<AtomRef<T>['key'], number>
}
