import { createContext } from 'react'

export const $$internal = '$$atom.internal'
export const $$lifeCycleChannel = '$$atom.lifeCycleChannel'
export const noop = () => {}

export const defaultContext = Symbol(
  '$$atom.defaultContext'
)
export const RootContext =
  createContext<any>(defaultContext)
