import {
  ReactChild,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'

interface Db<S> {
  setState: (nextState: S) => void
  getState: () => S
  subscribe: (fn: WatcherFn<S>) => () => void
}

type WatcherFn<S> = (oldState: S, newState: S) => void

const makeDb = <S,>(initialState: S): Db<S> => {
  let state = initialState

  const subscriptions = new Set<WatcherFn<S>>()

  return {
    setState(nextState) {
      const oldState = state
      state = nextState

      subscriptions.forEach((fn) => {
        fn(oldState, nextState)
      })
    },
    getState() {
      return state
    },
    subscribe(fn) {
      subscriptions.add(fn)

      return function unsubscribe() {
        subscriptions.delete(fn)
      }
    }
  }
}

const defaultIsNewQueryValue = <V,>(oldValue: V, newValue: V) => {
  return oldValue !== newValue
}

export function makeAtom<S>(initialState: S) {
  const AtomContext = createContext(makeDb(initialState))

  return {
    Provider: ({ children }: { children: ReactChild | ReactChild[] }) => {
      const db = useMemo(() => makeDb(initialState), [initialState])
      const resetStateOnUnmount = () => {
        return () => {
          db.setState(initialState)
        }
      }

      useEffect(resetStateOnUnmount, [db])

      return <AtomContext.Provider value={db}>{children}</AtomContext.Provider>
    },
    useQuery<Selection = S>(
      selector: (state: S) => Selection,
      isNewQueryValue = defaultIsNewQueryValue
    ) {
      const context = useContext(AtomContext)
      const initialState = context.getState()
      const [value, setValue] = useState(selector(initialState))

      useEffect(() => {
        return context.subscribe((_, newState) => {
          const nextValue = selector(newState)

          if (!isNewQueryValue(value, nextValue)) {
            return
          }

          setValue(nextValue)
        })
      }, [isNewQueryValue, value, context])

      return value
    },
    useMutation: () => {
      const context = useContext(AtomContext)

      return <Payload,>(
        mutationFn: (oldState: S, payload: Payload) => S,
        payload: Payload
      ) => {
        context.setState(mutationFn(context.getState(), payload))
      }
    }
  }
}
