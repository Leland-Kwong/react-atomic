import {
  channel,
  emit,
  subscribe,
  unsubscribe,
  subscriberCount
} from './channels'

describe('channels', () => {
  test('subscribe', () => {
    const chan = channel()

    subscribe(chan, jest.fn())
    expect(subscriberCount(chan)).toBe(1)
    subscribe(chan, jest.fn())
    expect(subscriberCount(chan)).toBe(2)
  })

  test('unsubscribe', () => {
    const chan = channel()
    const subscriber = jest.fn()
    const id = subscribe(chan, subscriber)
    const id2 = subscribe(chan, subscriber)

    expect(subscriberCount(chan)).toBe(2)
    unsubscribe(chan, id)
    unsubscribe(chan, id2)
    expect(subscriberCount(chan)).toBe(0)
  })

  test('emit', () => {
    const chan = channel<string>()
    const subscriber = jest.fn()

    subscribe(chan, subscriber)
    emit(chan, 'foo')
    expect(subscriber.mock.calls).toEqual([['foo']])
  })
})
