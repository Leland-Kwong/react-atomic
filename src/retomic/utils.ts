import { useContext } from 'react'
import { RootContext } from './constants'

export function errorMsg(msg: string) {
  return `[retomic error]: ${msg}`
}

export function useDb() {
  return useContext(RootContext)
}
