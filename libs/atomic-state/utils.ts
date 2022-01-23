import { useRef } from 'react'

function shallowCompare(cache: any, value: any) {
  const maybeNewValue = value !== cache

  if (maybeNewValue) {
    const shouldShallowCompare = typeof cache === 'object'

    if (shouldShallowCompare) {
      for (const key of Object.keys(value)) {
        const prev = cache[key]
        const next = value[key]
        const isNewValue = prev !== next

        if (isNewValue) {
          return true
        }
      }
    }
  }

  return cache !== value
}

export function useIsNew<X, Y>(
  fn: (x: X) => Y,
  isNewValue: (prev: Y, next: Y) => boolean = shallowCompare
) {
  const cache = useRef<Y | null>(null)

  return (x: X) => {
    const next = fn(x)
    const shouldUpdateCache =
      cache.current === null ||
      isNewValue(cache.current, next)

    if (shouldUpdateCache) {
      cache.current = next
    }

    return cache.current as Y
  }
}
