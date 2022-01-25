import { createContext } from 'react'
import { makeDb } from './db'

export const defaultContext = makeDb<any>({})
export const RootContext = createContext(defaultContext)
