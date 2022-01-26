import { nanoid } from 'nanoid'

type SubscriberId = string
export type ChannelFn<T> = (data: T) => void
export type Channel<T> = Map<SubscriberId, ChannelFn<T>>

export function channel<T = never>(): Channel<T> {
  return new Map()
}

function channelOnEach(this: any, fn: ChannelFn<any>) {
  fn(this)
}

export function emit<T>(channel: Channel<T>, data: T) {
  channel.forEach(channelOnEach, data)
}

export function subscribe<T>(
  channel: Channel<T>,
  fn: ChannelFn<T>
): SubscriberId {
  const id = nanoid()
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
