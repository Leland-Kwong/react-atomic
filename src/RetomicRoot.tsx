import React, { useMemo } from 'react'
import { makeDb } from './db'
import type { ReactChild } from 'react'
import { defaultContext, RootContext } from './root-context'
import { logMsg, useDb } from './utils'
import type { DbState } from './types'

export function RetomicRoot({
  children
}: {
  children: ReactChild | ReactChild[]
}) {
  const currentDb = useDb()
  const isNestedRetomicRoot = currentDb !== defaultContext

  if (isNestedRetomicRoot) {
    throw new Error(
      logMsg(
        'Application tree may only be wrapped in a single `RetomicRoot` component'
      )
    )
  }

  const db = useMemo(() => makeDb<DbState>({}), [])

  return (
    <RootContext.Provider value={db}>
      {children}
    </RootContext.Provider>
  )
}
