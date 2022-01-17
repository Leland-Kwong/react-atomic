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
  key: AtomRef<T>['key'],
  mutationFn: Function
) => void

type Subscription<T> = WatcherFn<T>

interface DbState {
  [key: string]: any
}

interface Db<T> {
  state: Readonly<T>
  subscriptions: Set<Subscription<T>>
}

interface DefaultOptions<T> {
  isNewQueryValue: <SelectorValue = T>(
    oldValue: SelectorValue,
    newValue: SelectorValue
  ) => boolean
}

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

const makeDb = <T,>(initialState: T): Db<T> => {
  const subscriptions: Db<T>['subscriptions'] = new Set()

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
  db.subscriptions.forEach((fn) =>
    fn(oldState, newState, key, mutationFn)
  )
}

function getState<T>(db: Db<T>) {
  return db.state
}

function subscribe<T>(db: Db<T>, fn: WatcherFn<T>) {
  db.subscriptions.add(fn)

  return function unsubscribe() {
    db.subscriptions.delete(fn)
  }
}

const atomRefBaseDefaultOptions: Readonly<
  DefaultOptions<any>
> = {
  isNewQueryValue: (oldValue, newValue) =>
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
  isNewQueryValue = atomRef.defaultOptions.isNewQueryValue
) {
  const { key, defaultState } = atomRef
  const rootDb = useContext(RootContext)
  const initialStateSlice = getState(rootDb)[key]
  const [value, setValue] = useState(
    selector(defaultTo(defaultState, initialStateSlice))
  )

  useEffect(() => {
    return subscribe(rootDb, (_, newState, changeKey) => {
      if (key !== changeKey) {
        return
      }

      const stateSlice = defaultTo(
        defaultState,
        newState[key]
      )
      const nextValue = selector(stateSlice)

      if (!isNewQueryValue(value, nextValue)) {
        return
      }

      setValue(nextValue)
    })
  }, [
    rootDb,
    key,
    selector,
    isNewQueryValue,
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
        const currentState = getState(rootDb)
        const nextState = {
          ...currentState,
          [key]: mutationFn(
            defaultTo(defaultState, currentState[key]),
            payload
          )
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
