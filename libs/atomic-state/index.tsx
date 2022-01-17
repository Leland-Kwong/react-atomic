// TODO: make a `useLog(atomRef): void` method that
// subscribes to the database and writes mutations to a log
// history. This can be used for time travelling and
// debugging.

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import type { ReactChild } from 'react'

interface AtomRef<T> {
  key: string
  defaultState: T
  defaultOptions: DefaultOptions<T>
}

type WatcherFn<T> = (
  oldState: T,
  newState: T,
  mutationFn: Function
) => void

type Subscription<T> = WatcherFn<T>

interface DbState {
  [key: string]: any
}

interface Db<T> {
  state: Readonly<T>
  subscriptions: Map<
    AtomRef<T>['key'],
    Set<Subscription<T>>
  >
}

interface DefaultOptions<T> {
  shouldUpdateSelector: <SelectorValue = T>(
    oldValue: SelectorValue,
    newValue: SelectorValue
  ) => boolean
}

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

const makeDb = <T,>(initialState: T): Db<T> => {
  const subscriptions: Db<T>['subscriptions'] = new Map()

  return {
    state: initialState,
    subscriptions
  }
}

function setState<T>(
  db: Db<T>,
  newState: T,
  key: AtomRef<T>['key'],
  mutationFn: Function
) {
  const oldState = db.state
  db.state = newState

  const subs = db.subscriptions.get(key) || new Set()
  subs.forEach((fn) => fn(oldState, newState, mutationFn))
}

function getState<T>(db: Db<T>) {
  return db.state
}

function subscribe<T>(
  db: Db<T>,
  key: AtomRef<T>['key'],
  fn: WatcherFn<T>
): () => void {
  const subs = db.subscriptions.get(key)

  if (!subs) {
    db.subscriptions.set(key, new Set())
    return subscribe(db, key, fn)
  }

  subs.add(fn)

  return function unsubscribe() {
    subs.delete(fn)

    const shouldCleanup = subs.size === 0
    if (shouldCleanup) {
      db.subscriptions.delete(key)
    }
  }
}

const atomRefBaseDefaultOptions: Readonly<
  DefaultOptions<any>
> = {
  shouldUpdateSelector: (oldValue, newValue) =>
    oldValue !== newValue
}

export function atom<T>({
  key,
  defaultState,
  defaultOptions
}: {
  key: AtomRef<T>['key']
  defaultState: AtomRef<T>['defaultState']
  defaultOptions?: Partial<AtomRef<T>['defaultOptions']>
}): Readonly<AtomRef<T>> {
  return {
    key,
    defaultState,
    defaultOptions: {
      ...atomRefBaseDefaultOptions,
      ...defaultOptions
    }
  }
}

const defaultContextDb = makeDb<DbState>({})
const RootContext = createContext(defaultContextDb)

export function AtomRoot({
  children
}: {
  children: ReactChild | ReactChild[]
}) {
  const rootDb = useContext(RootContext)
  const initialDb = useMemo(() => makeDb<DbState>({}), [])
  const isNestedAtomRoot = rootDb !== defaultContextDb

  if (isNestedAtomRoot) {
    throw new Error(
      'Warning: Application tree may only be wrapped in a single `AtomRoot` component'
    )
  }

  return (
    <RootContext.Provider value={initialDb}>
      {children}
    </RootContext.Provider>
  )
}

export function useAtom<T, SelectorValue = T>(
  atomRef: AtomRef<T>,
  selector: (state: T) => SelectorValue,
  shouldUpdateSelector = atomRef.defaultOptions
    .shouldUpdateSelector
) {
  const { key, defaultState } = atomRef
  const rootDb = useContext(RootContext)
  const initialStateSlice = getState(rootDb)[key]
  const [value, setValue] = useState(
    selector(defaultTo(defaultState, initialStateSlice))
  )

  useEffect(() => {
    return subscribe(rootDb, key, (_, newState) => {
      const stateSlice = defaultTo(
        defaultState,
        newState[key]
      )
      const nextValue = selector(stateSlice)

      if (!shouldUpdateSelector(value, nextValue)) {
        return
      }

      setValue(nextValue)
    })
  }, [
    rootDb,
    key,
    selector,
    shouldUpdateSelector,
    value,
    defaultState
  ])

  return value
}

export function useSetAtom<T, U = T>(atomRef: AtomRef<T>) {
  const { key, defaultState } = atomRef
  const rootDb = useContext(RootContext)

  return useMemo(
    () =>
      <Payload,>(
        // TODO: warn if the mutation function is unnamed
        // because if we write it to a log we won't have any
        // context
        mutationFn: (oldState: U, payload: Payload) => U,
        payload: Payload
      ) => {
        const rootState = getState(rootDb)
        const stateSlice = defaultTo(
          defaultState,
          rootState[key]
        )
        const nextState = {
          ...rootState,
          [key]: mutationFn(stateSlice, payload)
        }
        setState(rootDb, nextState, key, mutationFn)
      },
    [defaultState, rootDb, key]
  )
}

export function useResetAtom<T>(atomRef: AtomRef<T>) {
  const mutate = useSetAtom(atomRef)

  return useMemo(() => {
    const reset = () => atomRef.defaultState

    mutate(reset, undefined)
  }, [mutate, atomRef.defaultState])
}
