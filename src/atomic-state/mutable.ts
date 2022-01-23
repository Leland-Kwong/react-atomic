import type { AtomRef } from './types'

export const mutable = {
  duplicaKeyCount: 0,
  atomRefsByKey: new Map<
    AtomRef<any>['key'],
    AtomRef<any>
  >()
}
