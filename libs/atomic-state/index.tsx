import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import type {
  Context,
  ReactChild,
  ReactElement
} from 'react'

interface Db<T> {
  state: Readonly<T>
  subscriptions: Set<WatcherFn<T>>
}

type WatcherFn<T> = (oldState: T, newState: T) => void

interface DefaultOptions<T> {
  isNewQueryValue: <SelectorValue = T>(
    oldValue: SelectorValue,
    newValue: SelectorValue
  ) => boolean
}

interface AtomRef<T> {
  defaultState: T
  context: Context<Db<T>>
  defaultOptions: DefaultOptions<T>
}

const makeDb = <T,>(initialState: T): Db<T> => {
  const subscriptions = new Set<WatcherFn<T>>()

  return {
    state: initialState,
    subscriptions
  }
}

function setState<T>(db: Db<T>, newState: T) {
  db.state = newState
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

const atomRefBaseDefaultOptions: DefaultOptions<any> = {
  isNewQueryValue: (oldValue, newValue) =>
    oldValue !== newValue
}

export function atom<T>({
  defaultState,
  defaultOptions
}: {
  defaultState: AtomRef<T>['defaultState']
  defaultOptions?: Partial<AtomRef<T>['defaultOptions']>
}): AtomRef<T> {
  const db = makeDb(defaultState)

  return {
    defaultState,
    context: createContext(db),
    defaultOptions: {
      ...atomRefBaseDefaultOptions,
      ...defaultOptions
    }
  }
}

export function Connect({
  atoms,
  children
}: {
  atoms: AtomRef<any>[]
  children: ReactChild | ReactChild[]
}) {
  return atoms.reduce((newChildren, atomRef) => {
    return (
      <atomRef.context.Provider
        value={makeDb(atomRef.defaultState)}
      >
        {newChildren}
      </atomRef.context.Provider>
    )
  }, children) as ReactElement
}

export function useQuery<T, SelectorValue = T>(
  atomRef: AtomRef<T>,
  selector: (state: T) => SelectorValue,
  isNewQueryValue = atomRef.defaultOptions.isNewQueryValue
) {
  const { context } = atomRef
  const db = useContext(context)
  const initialState = atomRef.defaultState
  const [value, setValue] = useState(selector(initialState))

  useEffect(() => {
    return subscribe(db, (_, newState) => {
      const nextValue = selector(newState)

      if (!isNewQueryValue(value, nextValue)) {
        return
      }

      setValue(nextValue)
    })
  }, [db, selector, isNewQueryValue, value, context])

  return value
}

export function useMutation<T>(atomRef: AtomRef<T>) {
  const { context } = atomRef
  const db = useContext(context)

  return useMemo(
    () =>
      <Payload,>(
        mutationFn: (oldState: T, payload: Payload) => T,
        payload: Payload
      ) => {
        setState(db, mutationFn(getState(db), payload))
      },
    [db]
  )
}
