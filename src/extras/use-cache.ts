import { useMemo, useRef } from 'react'
import shallowequal from 'shallowequal'

/**
 * @public
 * Returns a new function that compares the old return value
 * and new return value. If they are the same, then it will
 * return what was previously returned. This is useful for
 * determining if two different objects are equal to reduce
 * unecessary rerenders.
 */
export function useIsNew<X, Y>(
  inputFn: (x: X) => Y,
  isEqual: (prev: Y, next: Y) => boolean = shallowequal
): (x: X) => Y {
  const cache = useRef<Y | null>(null)
  const args = { fn: inputFn, isEqual }
  const argsRef = useRef(args)
  argsRef.current = args

  const newFn = useMemo(() => {
    function wrappedFn(x: X) {
      const next = argsRef.current.fn(x)
      const shouldUpdateCache =
        cache.current === null ||
        !argsRef.current.isEqual(cache.current, next)

      if (shouldUpdateCache) {
        cache.current = next
      }

      return cache.current as Y
    }

    return wrappedFn
  }, [])

  Object.defineProperty(newFn, 'name', {
    value: inputFn.name
  })

  return newFn
}
