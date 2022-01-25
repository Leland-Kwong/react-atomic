import type { Atom } from './types'

export const mutable = {
  duplicaKeyCount: 0,
  atomsByKey: new Map<Atom<any>['key'], Atom<any>>()
}
