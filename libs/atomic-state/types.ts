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
  db: Db<any>
) => void

type Subscription = WatcherFn

export interface Db<T> {
  state: Readonly<DbState>
  subscriptions: Map<AtomRef<T>['key'], Set<Subscription>>
  activeHooks: Map<AtomRef<T>['key'], number>
  onChange: WatcherFn
}
