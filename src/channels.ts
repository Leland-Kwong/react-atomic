const performance =
  typeof window === 'undefined'
    ? require('perf_hooks').performance
    : window.performance

export type SubscriberId = number
export type ChannelFn<T> = (data: T) => void
export type Channel<T> = Map<SubscriberId, ChannelFn<T>>

export function channel<T = never>(): Channel<T> {
  return new Map()
}

export function emit<T>(channel: Channel<T>, data: T) {
  channel.forEach((fn) => {
    fn(data)
  })
}

export function subscribe<T>(
  channel: Channel<T>,
  fn: ChannelFn<T>
): SubscriberId {
  const id = performance.now()
  channel.set(id, fn)

  return id
}

export function unsubscribe<T>(
  channel: Channel<T>,
  id: SubscriberId
) {
  channel.delete(id)
}

export function subscriberCount<T>(channel: Channel<T>) {
  return channel.size
}
