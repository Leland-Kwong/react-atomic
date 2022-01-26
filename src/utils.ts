import { useContext } from 'react'
import { RootContext } from './root-context'

export function errorMsg(msg: string) {
  return `[retomic error]: ${msg}`
}

export function useDb() {
  return useContext(RootContext)
}
