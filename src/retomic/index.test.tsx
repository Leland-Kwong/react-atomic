import React, { useEffect } from 'react'
import {
  renderHook,
  act,
  cleanup
} from '@testing-library/react-hooks'
import {
  atomRef,
  useRead,
  useReset,
  useSend,
  AtomRoot,
  useIsNew
} from '.'
import { useDb } from './lifecycle'

type State = { text: string }
type State2 = string

const identity = (d: any) => d
const setTestState = (s: State, text: string) => ({
  ...s,
  text
})
const setTestState2 = (_: State2, newText: string) =>
  newText
const ref = atomRef<State>({
  key: 'test',
  defaultState: {
    text: 'foo'
  }
})
const ref2 = atomRef<State2>({
  key: 'test2',
  defaultState: 'foo2'
})
const atomNoAutoReset = atomRef({
  key: 'atomNoAutoReset',
  defaultState: 0,
  resetOnInactive: false
})

describe('react-atomic', () => {
  test('useRead', () => {
    const wrapper = ({ children }: { children: any }) => (
      <AtomRoot>{children}</AtomRoot>
    )
    const selector = (d: State) => d.text.length
    const { result } = renderHook(
      () => useRead(ref, selector),
      { wrapper }
    )

    expect(result.current).toBe(3)
  })

  test('useRead: check for missing AtomRoot wrapping', () => {
    const wrapper = ({ children }: { children: any }) => (
      <div>{children}</div>
    )
    const selector = (d: State) => d.text.length
    const { result } = renderHook(
      () => useRead(ref, selector),
      { wrapper }
    )

    expect(() => result.current).toThrow()
  })

  test('useSend', async () => {
    const wrapper = ({ children }: { children: any }) => (
      <AtomRoot>{children}</AtomRoot>
    )
    const mockSelector = jest.fn((d) => d)
    const { result } = renderHook(
      () => {
        const readValue = useRead(ref, mockSelector)
        const sendAtom = useSend(ref)
        const readValue2 = useRead(ref2, identity)
        const sendAtom2 = useSend(ref2)

        return {
          readValue,
          sendAtom,
          readValue2,
          sendAtom2
        }
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.sendAtom2(setTestState2, 'bar2')
    })
    await act(async () => {
      await result.current.sendAtom(setTestState, 'baz')
    })

    expect(result.current.readValue2).toBe('bar2')
    expect(result.current.readValue).toEqual({
      text: 'baz'
    })
  })

  test('useSend: check for missing AtomRoot wrapping', () => {
    const wrapper = ({ children }: { children: any }) => (
      <div>{children}</div>
    )
    const { result } = renderHook(() => useSend(ref), {
      wrapper
    })

    expect(() => result.current).toThrow()
  })

  test('useReset', async () => {
    const mockWrapper = ({
      children
    }: {
      children: any
    }) => <AtomRoot>{children}</AtomRoot>
    const mockSelector = jest.fn((d) => d)
    const { result } = renderHook(
      () => {
        const readValue = useRead(ref, mockSelector)
        const resetAtom = useReset(ref)
        const sendAtom = useSend(ref)

        return {
          readValue,
          resetAtom,
          sendAtom
        }
      },
      { wrapper: mockWrapper }
    )

    await act(async () => {
      await result.current.sendAtom(setTestState, 'bar')
    })
    await act(async () => {
      await result.current.resetAtom()
    })

    expect(result.current.readValue).toBe(ref.defaultState)
  })

  describe('use cache', () => {
    const mockWrapper = ({
      value: _,
      children
    }: {
      value: string
      children?: any
    }) => <AtomRoot>{children}</AtomRoot>

    test('primitive compare', () => {
      const { result, rerender } = renderHook(
        (props) => {
          const cachedFunction = useIsNew(
            (value: string) => value
          )
          return cachedFunction(props.value)
        },
        {
          wrapper: mockWrapper,
          initialProps: { value: 'foo' }
        }
      )

      rerender({ value: 'foo' })
      expect(result.all[0]).toBe(result.all[1])
      rerender({ value: 'bar' })
      expect(result.all[1]).not.toBe(result.all[2])
      expect(result.all.length).toBe(3)
    })

    test('shallow compare', () => {
      const { result, rerender } = renderHook(
        (props) => {
          const cachedFunction = useIsNew(
            ({ value }: { value: string }) => ({ value })
          )

          return cachedFunction({ value: props.value })
        },
        {
          wrapper: mockWrapper,
          initialProps: { value: 'foo' }
        }
      )

      rerender({ value: 'foo' })
      expect(result.all[0]).toBe(result.all[1])
      rerender({ value: 'bar' })
      expect(result.all[1]).not.toBe(result.all[2])
      expect(result.all.length).toBe(3)
    })

    test('custom compare', () => {
      const { result, rerender } = renderHook(
        (props) => {
          const cachedFunction = useIsNew(
            ({ value }: { value: string }) => ({
              value
            }),
            (prev, next) => prev !== next
          )
          return cachedFunction({ value: props.value })
        },
        {
          wrapper: mockWrapper,
          initialProps: { value: 'foo' }
        }
      )

      rerender({ value: 'foo' })
      expect(result.all[0]).not.toBe(result.all[1])
      expect(result.all.length).toBe(2)
    })
  })

  test('properly manages listeners and state on mount/unmount', async () => {
    const hookCountOnLifeCycle = jest.fn(
      (_: {
        listenerCount: number
        stateKeyExists: boolean
      }) => undefined
    )
    const selector = jest.fn((d) => d)
    const mockWrapper = ({
      value: _,
      children
    }: {
      value: string
      children?: any
    }) => <AtomRoot>{children}</AtomRoot>
    const { result } = renderHook(
      () => {
        const res = {
          readValue: useRead(ref2, selector),
          sendAtom: useSend(ref2)
        }
        const db = useDb(ref2)

        useEffect(() => {
          hookCountOnLifeCycle({
            listenerCount: db.subscriptions.listenerCount(
              ref2.key
            ),
            stateKeyExists: ref2.key in db.state
          })

          return () => {
            hookCountOnLifeCycle({
              listenerCount: db.subscriptions.listenerCount(
                ref2.key
              ),
              stateKeyExists: ref2.key in db.state
            })
          }
        })

        return res
      },
      {
        wrapper: mockWrapper
      }
    )

    await act(async () => {
      await result.current.sendAtom(setTestState2, 'bar')
    })
    await cleanup()

    expect(hookCountOnLifeCycle.mock.calls).toEqual([
      [{ listenerCount: 1, stateKeyExists: false }],
      [{ listenerCount: 1, stateKeyExists: true }],
      [{ listenerCount: 1, stateKeyExists: true }],
      [{ listenerCount: 0, stateKeyExists: false }]
    ])
  })

  test('resetOnInactive option disabled', async () => {
    const hookCountOnLifeCycle = jest.fn(
      (_: {
        listenerCount: number
        stateKeyExists: boolean
      }) => undefined
    )
    const mockWrapper = ({
      value: _,
      children
    }: {
      value: string
      children?: any
    }) => <AtomRoot>{children}</AtomRoot>
    const { result } = renderHook(
      () => {
        const res = {
          sendAtom: useSend(atomNoAutoReset)
        }
        const db = useDb(atomNoAutoReset)

        useEffect(() => {
          hookCountOnLifeCycle({
            listenerCount: db.subscriptions.listenerCount(
              atomNoAutoReset.key
            ),
            stateKeyExists: atomNoAutoReset.key in db.state
          })

          return () => {
            hookCountOnLifeCycle({
              listenerCount: db.subscriptions.listenerCount(
                atomNoAutoReset.key
              ),
              stateKeyExists:
                atomNoAutoReset.key in db.state
            })
          }
        })

        return res
      },
      {
        wrapper: mockWrapper
      }
    )

    await act(async () => {
      const setTo = (_: number, newNum: number) => newNum
      await result.current.sendAtom(setTo, 1)
    })
    await cleanup()

    expect(hookCountOnLifeCycle.mock.calls).toEqual([
      [{ listenerCount: 0, stateKeyExists: false }],
      [{ listenerCount: 0, stateKeyExists: true }]
    ])
  })
})
