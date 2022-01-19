// FIXME: theres a bug where not all lifecycle hook counts
// are properly sent on AtomRoot mount. This probably
// happens because the devtools is not mounted before other
// hooks.

// TODO: add ability to pause mutations. This will be useful
// for debugging purposes.

import Emittery from 'emittery'
import {
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import type { ReactChild } from 'react'
import {
  defaultContext,
  RootContext,
  $$internal,
  $$lifeCycleChannel
} from './constants'
import type {
  DefaultAtomOptions,
  AtomRef,
  DbState,
  WatcherFn,
  Db
} from './types'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function makeDb<T>(initialState: T): Db<T> {
  const subscriptions: Db<T>['subscriptions'] =
    new Emittery()

  return {
    state: initialState,
    subscriptions,
    activeHooks: new Map()
  }
}

function setState<T>(
  db: Db<T>,
  newState: T,
  atomRef: AtomRef<T>,
  mutationFn: Function,
  mutationPayload: any
) {
  const oldState = db.state
  const eventData = {
    oldState,
    newState,
    atomRef,
    mutationFn,
    mutationPayload,
    db
  }

  db.state = newState
  db.subscriptions.emit(atomRef.key, eventData)
  db.subscriptions.emit($$internal, eventData)
}

function getState<T>(db: Db<T>) {
  return db.state
}

function $$resetInactiveAtom<T>(_: T, value: T) {
  return value
}

function addActiveHook<T>(db: Db<T>, atomRef: AtomRef<T>) {
  const hookCount = db.activeHooks.get(atomRef.key) || 0
  const newHookCount = hookCount + 1
  db.activeHooks.set(atomRef.key, newHookCount)
  db.subscriptions.emit($$lifeCycleChannel, {
    type: 'mount',
    key: atomRef.key,
    hookCount: newHookCount
  })
}

function removeActiveHook<T>(
  db: Db<T>,
  atomRef: AtomRef<T>
) {
  const hookCount = db.activeHooks.get(atomRef.key) || 0
  const newHookCount = Math.max(0, hookCount - 1)
  db.activeHooks.set(atomRef.key, newHookCount)
  db.subscriptions.emit($$lifeCycleChannel, {
    type: 'unmount',
    key: atomRef.key,
    hookCount: newHookCount
  })

  const isAtomActive = newHookCount > 0
  if (!isAtomActive) {
    setState(
      db,
      {
        ...getState(db),
        [atomRef.key]: atomRef.defaultState
      },
      atomRef,
      $$resetInactiveAtom,
      atomRef.defaultState
    )
    db.activeHooks.delete(atomRef.key)
  }
}

function resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

const atomRefBaseDefaultOptions: Readonly<
  DefaultAtomOptions<any>
> = {
  shouldUpdateSelector: (oldValue, newValue) =>
    oldValue !== newValue
}

export type { AtomRef } from './types'
export { AtomDevTools } from './AtomDevTools'

export function atomRef<T>({
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

export function AtomRoot({
  children
}: {
  children: ReactChild | ReactChild[]
}) {
  const rootDb = useContext(RootContext)
  const isNestedAtomRoot = rootDb !== defaultContext

  if (
    process.env.NODE_ENV === 'development' &&
    isNestedAtomRoot
  ) {
    console.error(
      'Warning: Application tree may only be wrapped in a single `AtomRoot` component'
    )
  }

  const db = makeDb<DbState>({})

  return (
    <RootContext.Provider value={db}>
      {children}
    </RootContext.Provider>
  )
}

export function useReadAtom<T, SelectorValue = T>(
  atomRef: AtomRef<T>,
  selector: (state: T) => SelectorValue,
  shouldUpdateSelector = atomRef.defaultOptions
    .shouldUpdateSelector
) {
  const { key, defaultState } = atomRef
  const rootDb = useContext(RootContext)
  const initialStateSlice = getState(rootDb)[key]
  const [hookState, setHookState] = useState(
    selector(defaultTo(defaultState, initialStateSlice))
  )

  useEffect(() => {
    const watcherFn: WatcherFn = ({ newState }) => {
      const stateSlice = newState[key]
      const nextValue = selector(stateSlice)

      if (!shouldUpdateSelector(hookState, nextValue)) {
        return
      }

      setHookState(nextValue)
    }

    addActiveHook(rootDb, atomRef)
    rootDb.subscriptions.on(key, watcherFn)

    return () => {
      removeActiveHook(rootDb, atomRef)
      rootDb.subscriptions.off(key, watcherFn)
    }
  }, [
    rootDb,
    key,
    hookState,
    selector,
    shouldUpdateSelector,
    defaultState,
    atomRef
  ])

  return hookState
}

export function useSendAtom<T, U = T>(atomRef: AtomRef<T>) {
  const { key, defaultState } = atomRef
  const rootDb = useContext(RootContext)

  useEffect(() => {
    addActiveHook(rootDb, atomRef)

    return () => {
      removeActiveHook(rootDb, atomRef)
    }
  }, [rootDb, atomRef])

  return useMemo(
    () =>
      <Payload,>(
        // TODO: warn if the mutation function is unnamed
        // because if we write it to a log we won't have any
        // context
        mutationFn: (oldState: U, payload: Payload) => U,
        payload: Payload
      ) => {
        if (
          process.env.NODE_ENV === 'development' &&
          !mutationFn.name
        ) {
          console.error(
            'Warning: This mutation function should be named -',
            mutationFn
          )
        }

        const rootState = getState(rootDb)
        const stateSlice = defaultTo(
          defaultState,
          rootState[key]
        )
        const nextState = {
          ...rootState,
          [key]: mutationFn(stateSlice, payload)
        }
        setState(
          rootDb,
          nextState,
          atomRef,
          mutationFn,
          payload
        )
      },
    [defaultState, rootDb, key, atomRef]
  )
}

export function useResetAtom<T>(atomRef: AtomRef<T>) {
  const mutate = useSendAtom(atomRef)

  return useMemo(() => {
    return () => {
      mutate(resetAtom, atomRef.defaultState)
    }
  }, [mutate, atomRef.defaultState])
}
