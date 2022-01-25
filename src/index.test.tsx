import React from 'react'
import {
  renderHook,
  act,
  cleanup
} from '@testing-library/react-hooks'
import {
  atom,
  useRead,
  useReset,
  useSend,
  RetomicRoot,
  useIsNew
} from '.'
import { useOnLifeCycle } from './lifecycle'

type State = { text: string }
type State2 = string

const identity = (d: any) => d
const setTestState = (s: State, text: string) => ({
  ...s,
  text
})
const setTestState2 = (_: State2, newText: string) =>
  newText
const ref = atom<State>({
  key: 'test',
  defaultState: {
    text: 'foo'
  }
})
const ref2 = atom<State2>({
  key: 'test2',
  defaultState: 'foo2'
})
const atomNoAutoReset = atom({
  key: 'atomNoAutoReset',
  defaultState: '',
  resetOnInactive: false
})

describe('core', () => {
  test('useRead', () => {
    const wrapper = ({ children }: { children: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
    const selector = (d: State) => d.text.length
    const { result } = renderHook(
      () => useRead(ref, selector),
      { wrapper }
    )

    expect(result.current).toBe(3)
  })

  test('useSend', async () => {
    const wrapper = ({ children }: { children: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
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

  test('useReset', async () => {
    const wrapper = ({ children }: { children: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
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
      { wrapper }
    )

    await act(async () => {
      await result.current.sendAtom(setTestState, 'bar')
    })
    await act(async () => {
      await result.current.resetAtom()
    })

    expect(result.current.readValue).toBe(ref.defaultState)
  })

  describe('check for missing RetomicRoot wrapper', () => {
    test('useRead', () => {
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

    test('useSend', () => {
      const wrapper = ({ children }: { children: any }) => (
        <div>{children}</div>
      )
      const { result } = renderHook(() => useSend(ref), {
        wrapper
      })

      expect(() => result.current).toThrow()
    })
  })
})

describe('extras', () => {
  describe('use cache', () => {
    const wrapper = ({ children }: { children?: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )

    test('primitive compare', () => {
      const { result, rerender } = renderHook(
        (props) => {
          const cachedFunction = useIsNew(
            (value: string) => value
          )
          return cachedFunction(props.value)
        },
        {
          wrapper,
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
          wrapper,
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
          wrapper,
          initialProps: { value: 'foo' }
        }
      )

      rerender({ value: 'foo' })
      expect(result.all[0]).not.toBe(result.all[1])
      expect(result.all.length).toBe(2)
    })
  })
})

describe('lifecycle', () => {
  test('properly manages listeners and state on mount/unmount', async () => {
    const onLifeCycle = jest.fn()
    const lifeCycleWatcher = (d: any) => d
    const wrapper = ({ children }: { children?: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
    const { result } = renderHook(
      () => {
        useOnLifeCycle(ref2, onLifeCycle)

        return {
          readValue: useRead(ref2, lifeCycleWatcher),
          sendAtom: useSend(ref2)
        }
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.sendAtom(setTestState2, 'bar')
    })
    await cleanup()

    expect(onLifeCycle.mock.calls).toEqual([
      [
        {
          activeHooks: {
            [ref2.key]: 1
          },
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          activeHooks: {
            [ref2.key]: 2
          },
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          activeHooks: {
            [ref2.key]: 1
          },
          type: 'unmount',
          state: { [ref2.key]: 'bar' }
        }
      ],
      [
        {
          activeHooks: {},
          type: 'unmount',
          state: {}
        }
      ]
    ])
  })

  test('resetOnInactive option disabled', async () => {
    const onLifeCycle = jest.fn()
    const wrapper = ({ children }: { children?: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
    const { result } = renderHook(
      () => {
        useOnLifeCycle(atomNoAutoReset, onLifeCycle)

        return {
          sendAtom: useSend(atomNoAutoReset)
        }
      },
      { wrapper }
    )

    await act(async () => {
      const setTo = (_: string, newNum: string) => newNum
      await result.current.sendAtom(setTo, '$$noReset')
    })
    await cleanup()

    expect(onLifeCycle.mock.calls).toEqual([
      [
        {
          activeHooks: {
            [atomNoAutoReset.key]: 1
          },
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          activeHooks: {},
          type: 'unmount',
          state: {
            [atomNoAutoReset.key]: '$$noReset'
          }
        }
      ]
    ])
  })
})
