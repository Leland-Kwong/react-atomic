import { useContext } from 'react'
import { RootContext } from './root-context'

export function logMsg(msg: string, msgType = 'error') {
  return `[retomic ${msgType}]: ${msg}`
}

export function useDb() {
  return useContext(RootContext)
}
