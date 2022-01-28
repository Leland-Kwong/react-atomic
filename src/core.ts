import shallowEqual from 'shallowequal'
import { useEffect, useMemo, useRef } from 'react'
import { subscribe, unsubscribe } from './channels'
import { getState, setState } from './db'
import { hookLifecycle } from './lifecycle'
import {
  noop,
  lifecycleMount,
  lifecycleUnmount
} from './constants'
import type {
  Atom,
  Db,
  DbState,
  SelectorFn,
  UpdateFn,
  WatcherFn
} from './types'
import { logMsg, useDb, useUpdate } from './utils'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function $$resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

export type { Atom, SelectorFn, UpdateFn } from './types'
export { RetomicRoot } from './RetomicRoot'
export { useOnLifecycle } from './lifecycle'

export function createAtom<T>({
  key,
  defaultState,
  resetOnInactive = true
}: Atom<T>): Atom<T> {
  return {
    key,
    defaultState,
    resetOnInactive
  }
}

type IsEqualFn<T> = (prev: T, next: T) => boolean
type AtomColl<T> = Atom<T> | Atom<T>[]

const defaultIsEqualFn = <T>(prev: T, next: T) =>
  prev === next || shallowEqual(prev, next)

function toArray<T>(value: T) {
  return Array.isArray(value) ? value : [value]
}

const processNext = <T, SelectorValue = T>(
  db: Db,
  atoms: AtomColl<T>,
  selector: SelectorFn<T, SelectorValue>
) => {
  const getAtomState = (at: Atom<T>) => {
    const stateSlice = getState(db)[at.key]
    return defaultTo(at.defaultState, stateSlice)
  }
  const next = Array.isArray(atoms)
    ? atoms.map(getAtomState)
    : getAtomState(atoms)

  return selector(next)
}

function isAtomStateEqual<T>(
  this: { oldState: DbState; newState: DbState },
  atom: Atom<T>
) {
  const { key } = atom
  const { oldState, newState } = this

  return oldState[key] === newState[key]
}

export function useRead<T, SelectorValue = T>(
  atom: Atom<T>,
  selector: SelectorFn<T, SelectorValue>,
  isEqualFn?: IsEqualFn<SelectorValue>
): SelectorValue
export function useRead<T, SelectorValue = T>(
  atom: Atom<T>[],
  selector: SelectorFn<T[], SelectorValue>,
  isEqualFn?: IsEqualFn<SelectorValue>
): SelectorValue
export function useRead<T, SelectorValue = T>(
  atom: AtomColl<T>,
  selector: SelectorFn<T, SelectorValue>,
  isEqualFn: IsEqualFn<SelectorValue> = defaultIsEqualFn
): SelectorValue {
  const db = useDb()
  const update = useUpdate()
  const args = { atom, selector, isEqualFn }
  const argsRef = useRef({} as typeof args)
  const stateRef = useRef(
    undefined as unknown as SelectorValue
  )
  const shouldRecalculate =
    argsRef.current.selector !== selector ||
    argsRef.current.isEqualFn !== isEqualFn

  argsRef.current = args

  if (shouldRecalculate) {
    const prev = stateRef.current
    const next = processNext(
      db,
      argsRef.current.atom,
      selector
    )

    if (!isEqualFn(prev, next)) {
      stateRef.current = next
    }
  }

  useEffect(() => {
    toArray(argsRef.current.atom).forEach((atom) => {
      hookLifecycle(db, atom, lifecycleMount)
    })

    const watcherFn: WatcherFn = ({
      oldState,
      newState
    }) => {
      if (
        toArray(argsRef.current.atom).every(
          isAtomStateEqual,
          { oldState, newState }
        )
      ) {
        return
      }

      const curArgs = argsRef.current
      const prev = stateRef.current
      const next = processNext(
        db,
        argsRef.current.atom,
        curArgs.selector
      )

      if (curArgs.isEqualFn(prev, next)) {
        return
      }

      stateRef.current = next
      update()
    }

    const id = subscribe(db.stateChangeChannel, watcherFn)

    return () => {
      unsubscribe(db.stateChangeChannel, id)
      toArray(argsRef.current.atom).forEach((atom) => {
        hookLifecycle(db, atom, lifecycleUnmount)
      })
    }
  }, [db, update])

  return stateRef.current
}

export function useSend<T>(atom: Atom<T>) {
  const db = useDb()

  useEffect(() => {
    hookLifecycle(db, atom, lifecycleMount)

    return () => hookLifecycle(db, atom, lifecycleUnmount)
  }, [db, atom])

  return useMemo(
    () =>
      <Payload>(
        updateFn: UpdateFn<T, Payload>,
        payload: Payload
      ) => {
        if (
          process.env.NODE_ENV === 'development' &&
          !updateFn.name
        ) {
          console.error(
            logMsg(
              'This update function should be named -',
              'warning'
            ),
            updateFn
          )
        }

        const { key, defaultState } = atom
        const rootState = getState(db)
        const stateSlice = defaultTo(
          defaultState,
          rootState[key]
        )
        const nextState = {
          ...rootState,
          [key]: updateFn(stateSlice, payload)
        }

        return setState(
          db,
          nextState,
          atom,
          updateFn,
          payload
        )
      },
    [db, atom]
  )
}

export function useReset<T>(atom: Atom<T>) {
  const mutate = useSend(atom)

  return useMemo(
    () => () => mutate($$resetAtom, atom.defaultState),
    [mutate, atom.defaultState]
  )
}

const rootAtom = createAtom({
  key: 'retomic.root',
  defaultState: undefined
})

export function useReadRoot() {
  return getState(useDb())
}

export function useWriteRoot() {
  const db = useDb()

  return function writeRoot<NewState>(newState: NewState) {
    return setState(db, newState, rootAtom, noop, undefined)
  }
}
