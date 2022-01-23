import { createContext } from 'react'
import { makeDb } from './db'

export const $$internal = '$$atom.internal'
export const noop = () => {}

export const defaultContext = makeDb<any>({})
export const RootContext = createContext(defaultContext)

export const $$lifeCycleChannel = '$$atom.lifeCycleChannel'
export const LIFECYCLE_MOUNT = 'mount'
export const LIFECYCLE_UNMOUNT = 'unmount'
