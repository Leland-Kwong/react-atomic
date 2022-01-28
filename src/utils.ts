import { useContext, useReducer } from 'react'
import { RootContext } from './root-context'

export function logMsg(msg: string, msgType = 'error') {
  return `[retomic ${msgType}]: ${msg}`
}

export function useDb() {
  return useContext(RootContext)
}

const updateReducer = (toggleNum: number) =>
  toggleNum ? 0 : 1

export function useUpdate() {
  const [, update] = useReducer(updateReducer, 0)

  return update
}
