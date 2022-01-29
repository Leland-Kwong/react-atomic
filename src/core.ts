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
import {
  identity,
  logMsg,
  useDb,
  useDistinct,
  useUpdate,
  useRenderCount
} from './utils'

function defaultTo<T>(defaultValue: T, value: T) {
  return value === undefined ? defaultValue : value
}

function $$resetAtom<T>(_: T, defaultState: T) {
  return defaultState
}

export type {
  Atom,
  AtomColl,
  SelectorFn,
  UpdateFn
} from './types'
export { RetomicRoot } from './RetomicRoot'
export { useOnLifecycle } from './lifecycle'

/**
 * keys must be unique for each RetomicRoot
 */
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

const defaultIsEqualFn = <T>(prev: T, next: T) =>
  prev === next || shallowEqual(prev, next)

function toArray<T>(value: T) {
  return Array.isArray(value) ? value : [value]
}

function processNext<T, SelectorValue = T>(
  db: Db,
  atoms: Atom<T> | Atom<T>[],
  selector: SelectorFn<T, SelectorValue>
) {
  function getAtomState(at: Atom<T>) {
    const stateSlice = getState(db)[at.key]
    return defaultTo(at.defaultState, stateSlice)
  }
  const next = Array.isArray(atoms)
    ? atoms.map(getAtomState)
    : getAtomState(atoms)

  return selector(next)
}

function didAtomStateChange<T>(
  this: { oldState: DbState; newState: DbState },
  atom: Atom<T>
) {
  const { key } = atom
  const { oldState, newState } = this

  return oldState[key] !== newState[key]
}

export function useRead<T, SelectorValue = T>(
  atom: Atom<T>,
  selector?: SelectorFn<T, SelectorValue>,
  isEqualFn?: IsEqualFn<SelectorValue>
): SelectorValue
export function useRead<T, U, SelectorValue = T>(
  atom: [Atom<T>, Atom<U>],
  selector?: SelectorFn<[T, U], SelectorValue>,
  isEqualFn?: IsEqualFn<SelectorValue>
): SelectorValue
export function useRead<T, U, V, SelectorValue = T>(
  atom: [Atom<T>, Atom<U>, Atom<V>],
  selector?: SelectorFn<[T, U, V], SelectorValue>,
  isEqualFn?: IsEqualFn<SelectorValue>
): SelectorValue
export function useRead<T, SelectorValue = T>(
  atom: T,
  selector: SelectorFn<T, SelectorValue> = identity,
  isEqualFn: IsEqualFn<SelectorValue> = defaultIsEqualFn
): SelectorValue {
  const db = useDb()
  const update = useUpdate()
  const isFirstRender = useRenderCount() === 1
  // these parameters could change often (ie: inline
  // functions) so its better to update a ref as to not
  // cause a remount
  const args = { selector, isEqualFn }
  const argsRef = useRef({} as typeof args)
  const stateRef = useRef(
    undefined as unknown as SelectorValue
  )
  const shouldRecalculate =
    argsRef.current.selector !== selector ||
    argsRef.current.isEqualFn !== isEqualFn
  // atoms generally don't change between renders, so
  // this is a simple way to memoize
  const atomMemo = useDistinct(atom)

  argsRef.current = args

  if (shouldRecalculate) {
    const prev = stateRef.current
    const next = processNext(db, atomMemo as any, selector)

    // skip the isEqualFn check on first render since the
    // value will be undefined
    if (isFirstRender || !isEqualFn(prev, next)) {
      stateRef.current = next
    }
  }

  useEffect(() => {
    toArray(atomMemo).forEach((atom) => {
      hookLifecycle(db, atom, lifecycleMount)
    })

    const watcherFn: WatcherFn = ({
      oldState,
      newState
    }) => {
      const maybeUpdate = toArray(atomMemo).some(
        didAtomStateChange,
        { oldState, newState }
      )

      if (!maybeUpdate) {
        return
      }

      const curArgs = argsRef.current
      const prev = stateRef.current
      const next = processNext(
        db,
        atomMemo as any,
        curArgs.selector
      )

      if (!curArgs.isEqualFn(prev, next)) {
        stateRef.current = next
        update()
      }
    }

    const id = subscribe(db.stateChangeChannel, watcherFn)

    return () => {
      unsubscribe(db.stateChangeChannel, id)
      toArray(atomMemo).forEach((atom) => {
        hookLifecycle(db, atom, lifecycleUnmount)
      })
    }
  }, [db, atomMemo, update])

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
