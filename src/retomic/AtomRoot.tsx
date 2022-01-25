import React from 'react'
import { makeDb } from './db'
import type { ReactChild } from 'react'
import { defaultContext, RootContext } from './constants'
import { errorMsg, useDb } from './utils'
import type { DbState } from './types'

export function AtomRoot({
  children
}: {
  children: ReactChild | ReactChild[]
}) {
  const currentDb = useDb()
  const isNestedAtomRoot = currentDb !== defaultContext

  if (isNestedAtomRoot) {
    throw new Error(
      errorMsg(
        'Application tree may only be wrapped in a single `AtomRoot` component'
      )
    )
  }

  const db = makeDb<DbState>({})

  return (
    <RootContext.Provider value={db}>
      {children}
    </RootContext.Provider>
  )
}
