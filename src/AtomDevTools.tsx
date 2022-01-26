import React, { useEffect, useMemo, useState } from 'react'
import { noop } from './constants'
import { useDb } from './utils'
import { subscribe, unsubscribe } from './channels'
import {
  AtomObserverProps,
  DevToolsLogEntry,
  LifecycleEventData
} from './types'

function AtomObserver({
  onChange,
  onLifecycle = noop
}: AtomObserverProps) {
  const rootDb = useDb()

  useEffect(() => {
    const onLifecycleWrapper = (
      data: LifecycleEventData
    ) => {
      onLifecycle(data)
    }

    const id1 = subscribe(
      rootDb.stateChangeChannel,
      onChange
    )
    const id2 = subscribe(
      rootDb.lifecycleChannel,
      onLifecycleWrapper
    )

    return () => {
      unsubscribe(rootDb.stateChangeChannel, id1)
      unsubscribe(rootDb.lifecycleChannel, id2)
    }
  }, [onChange, onLifecycle, rootDb])

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
          atom,
          updateFn,
          updatePayload
        }) => {
          addLogEntry({
            action: {
              functionName: updateFn.name,
              payload: updatePayload,
              atomKey: atom.key
            },
            atomState: newState,
            timestamp: performance.now()
          })
        },
        onLifecycle: (data) => {
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
