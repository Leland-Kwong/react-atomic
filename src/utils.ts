import { useContext, useRef, useReducer } from 'react'
import { RootContext } from './root-context'
import shallowEqual from 'shallowequal'

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

function defaultIsEqual<T>(a: T, b: T) {
  return a === b || shallowEqual(a, b)
}

export function useDistinct<T>(
  value: T,
  isEqual = defaultIsEqual
) {
  const cache = useRef(value)
  const isSame = isEqual(value, cache.current)

  if (isSame) {
    return cache.current
  }

  cache.current = value

  return value
}
