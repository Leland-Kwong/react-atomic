import React from 'react'
import { makeDb } from './db'
import type { ReactChild } from 'react'
import { useContext } from 'react'
import { defaultContext, RootContext } from './constants'
import type { DbState } from './types'

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
