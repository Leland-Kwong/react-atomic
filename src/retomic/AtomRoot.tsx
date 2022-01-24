import React from 'react'
import { makeDb } from './db'
import type { ReactChild } from 'react'
import { useContext } from 'react'
import { defaultContext, RootContext } from './constants'
import { errorMsg } from './utils'
import type { DbState } from './types'

export function AtomRoot({
  children
}: {
  children: ReactChild | ReactChild[]
}) {
  const rootDb = useContext(RootContext)
  const isNestedAtomRoot = rootDb !== defaultContext

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
