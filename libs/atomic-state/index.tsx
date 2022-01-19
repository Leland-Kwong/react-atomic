// TODO: add ability to pause mutations. This will be useful
// for debugging purposes.

import Emittery from 'emittery'
import dynamic from 'next/dynamic'
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import type { ReactChild } from 'react'

import {
  noop,
  $$internal,
  $$lifeCycleChannel
} from './constants'
import type {
  DefaultAtomOptions,
  AtomRef,
  DbState,
  WatcherFn,
  Db,
  AtomObserverProps,
  DevToolsLogEntry
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

function resetInactiveAtom<T>(_: T, value: T) {
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
      resetInactiveAtom,
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

const defaultContextDb = makeDb<DbState>({})
const RootContext = createContext(defaultContextDb)

export type { AtomRef } from './types'

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
  const initialDb = useMemo(() => makeDb<DbState>({}), [])
  const isNestedAtomRoot = rootDb !== defaultContextDb

  if (
    process.env.NODE_ENV === 'development' &&
    isNestedAtomRoot
  ) {
    console.error(
      'Warning: Application tree may only be wrapped in a single `AtomRoot` component'
    )
  }

  return (
    <RootContext.Provider value={initialDb}>
      {children}
    </RootContext.Provider>
  )
}

export function AtomObserver({
  onChange,
  onLifeCycle = noop
}: AtomObserverProps) {
  const rootDb = useContext(RootContext)

  useEffect(() => {
    rootDb.subscriptions.on($$internal, onChange)
    rootDb.subscriptions.on($$lifeCycleChannel, onLifeCycle)

    return () => {
      rootDb.subscriptions.off($$internal, onChange)
      rootDb.subscriptions.off(
        $$lifeCycleChannel,
        onLifeCycle
      )
    }
  }, [onChange, onLifeCycle, rootDb])

  return null
}

const mockEntries = (logSize: number): DevToolsLogEntry[] =>
  new Array(logSize).fill(0).map((_, index) => ({
    timestamp: index,
    state: {
      entry: `foo ${index}`,
      foo: 'bar',
      some: {
        nested: 'state'
      }
    },
    action: {
      atomKey: 'mockAtomKey',
      functionName: 'mockRow',
      payload: 'mockPayload'
    }
  }))

export function AtomDevTools({ logSize = 50 }) {
  const ReactJson = useMemo(() => {
    return dynamic(() => import('react-json-view'), {
      ssr: false
    })
  }, [])
  const [log, setLog] = useState<DevToolsLogEntry[]>(
    mockEntries(logSize)
  )
  const [hookInfo, setHookInfo] = useState<{
    [key: string]: number
  }>({})
  const addLogEntry = useMemo(
    () => (entry: DevToolsLogEntry) => {
      setLog((oldLog) => [
        entry,
        ...oldLog.slice(0, logSize - 1)
      ])
    },
    [logSize]
  )
  const columnDefs: {
    headerName: string
    width: number | string
    render: (
      row: DevToolsLogEntry
    ) => ReactChild | string | number
  }[] = [
    {
      headerName: 'action',
      width: '40%',
      render(row) {
        return (
          <ReactJson
            src={row.action}
            name={null}
            displayDataTypes={false}
            collapsed={1}
          />
        )
      }
    },
    {
      headerName: 'state',
      width: '60%',
      render(row) {
        return (
          <ReactJson
            src={row.state}
            name={null}
            displayDataTypes={false}
            collapsed={2}
          />
        )
      }
    },
    {
      headerName: 'timestamp',
      width: 150,
      render(row) {
        return row.timestamp
      }
    }
  ]
  const atomObserverProps =
    useMemo((): AtomObserverProps => {
      return {
        onChange: ({
          newState,
          atomRef,
          mutationFn,
          mutationPayload
        }) => {
          addLogEntry({
            timestamp: performance.now(),
            state: newState,
            action: {
              functionName: mutationFn.name,
              payload: mutationPayload,
              atomKey: atomRef.key
            }
          })
        },
        onLifeCycle: (data) => {
          const { key, hookCount } = data
          console.log('lifeCycle', data)
          setHookInfo((info) => ({
            ...info,
            [key]: hookCount
          }))
        }
      }
    }, [addLogEntry])

  return (
    <div>
      <h2>React Atomic devtools</h2>
      <AtomObserver {...atomObserverProps} />
      <div>
        <ReactJson
          src={hookInfo}
          name="activeHooks"
          displayDataTypes={false}
        />
      </div>
      {/*
       * TODO: use a virual scrolling table component so we
       * can scroll through all entries without slowing
       * things down
       */}
      <table style={{ width: '100%' }}>
        <thead style={{ display: 'block' }}>
          <tr>
            {columnDefs.map(({ headerName, width }) => (
              <th
                key={headerName}
                style={{
                  textAlign: 'left',
                  width,
                  minWidth: width
                }}
              >
                {headerName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody
          style={{
            display: 'block',
            height: 300,
            width: '100%',
            overflowY: 'scroll',
            overflowX: 'hidden'
          }}
        >
          {log.slice(0, 5).map((entry) => (
            <tr key={entry.timestamp}>
              {columnDefs.map(
                ({ headerName, width, render }) => (
                  <td
                    key={headerName}
                    style={{
                      width,
                      minWidth: width,
                      verticalAlign: 'top',
                      borderBottom: '1px solid #ccc'
                    }}
                  >
                    {render(entry)}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
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

export function useSetAtom<T, U = T>(atomRef: AtomRef<T>) {
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
  const mutate = useSetAtom(atomRef)

  return useMemo(() => {
    return () => {
      mutate(resetAtom, atomRef.defaultState)
    }
  }, [mutate, atomRef.defaultState])
}
