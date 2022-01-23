import React, {
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import {
  noop,
  RootContext,
  $$internal,
  $$lifeCycleChannel,
  LIFECYCLE_MOUNT
} from './constants'
import {
  AtomObserverProps,
  DevToolsLogEntry,
  LifeCycleEventData
} from './types'

function AtomObserver({
  onChange,
  onLifeCycle = noop
}: AtomObserverProps) {
  const rootDb = useContext(RootContext)

  useEffect(() => {
    const onLifeCycleWrapper = (
      data: LifeCycleEventData
    ) => {
      const refKeys = Array.from(
        rootDb.activeRefKeys.values()
      )
      const activeHooks = Object.fromEntries(
        refKeys.map((key) => [
          key,
          rootDb.subscriptions.listenerCount(key)
        ])
      )

      onLifeCycle({
        ...data,
        activeHooks
      })
    }

    const subscriptions = [
      rootDb.subscriptions.on($$internal, onChange),
      rootDb.subscriptions.on(
        $$lifeCycleChannel,
        onLifeCycleWrapper
      )
    ]

    rootDb.subscriptions.emit($$lifeCycleChannel, {
      type: LIFECYCLE_MOUNT,
      key: $$lifeCycleChannel
    })

    return () => {
      subscriptions.forEach((unsubscribe) => unsubscribe())
    }
  }, [onChange, onLifeCycle, rootDb])

  return null
}

export function AtomDevTools({ logSize = 50 }) {
  // IMPORTANT: in order to support universal apps we need
  // to lazily require this since it depends on browser apis
  const ReactJson = require('react-json-view').default

  const [log, setLog] = useState<DevToolsLogEntry[]>([])
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
            action: {
              functionName: mutationFn.name,
              payload: mutationPayload,
              atomKey: atomRef.key
            },
            atomState: newState,
            timestamp: performance.now()
          })
        },
        onLifeCycle: (data) => {
          const { activeHooks } = data

          setHookInfo(() => activeHooks)
        }
      }
    }, [addLogEntry])

  return (
    <div>
      <h2>React Atomic devtools</h2>
      <AtomObserver {...atomObserverProps} />
      <div>
        <h3>Active Hooks</h3>
        <ReactJson
          src={hookInfo}
          name={null}
          displayDataTypes={false}
        />
      </div>
      {/*
       * TODO: use a virtual scrolling table component so we
       * can scroll through all entries without slowing
       * things down
       */}
      <div>
        <h3>Action log</h3>
        <div
          style={{
            height: 300,
            overflowY: 'scroll',
            background: '#ccc',
            border: '1px solid #ccc'
          }}
        >
          {log.slice(0, 5).map((entry) => {
            const {} = entry
            return (
              <div
                key={entry.timestamp}
                style={{
                  margin: '1rem',
                  background: '#fff'
                }}
              >
                <ReactJson
                  src={entry}
                  name={null}
                  displayDataTypes={false}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
