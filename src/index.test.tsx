/*
 * TODO: add test for `useRead` api and different selectors
 * on each render cycle. In general we shouldn't support this
 * behavior, but we still need to handle this edge case.
 * Either we throw an error or just let it work.
 */

import React from 'react'
import {
  renderHook,
  act
} from '@testing-library/react-hooks'
import {
  atom,
  useRead,
  useReset,
  useSend,
  RetomicRoot,
  useIsNew
} from '.'
import { useOnLifecycle } from './lifecycle'
import type { SelectorFn } from './'

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

describe('core', () => {
  describe('useRead', () => {
    const wrapper = ({
      children
    }: {
      children?: any
      selector: SelectorFn<State, any>
    }) => <RetomicRoot>{children}</RetomicRoot>

    test('different selector each render', () => {
      const sliceText = (dist: number) => (d: State) =>
        d.text.substring(0, dist)
      const { result, rerender } = renderHook(
        ({ selector }) => useRead(ref, selector),
        {
          wrapper,
          initialProps: {
            selector: sliceText(1)
          }
        }
      )

      expect(result.current).toBe('f')
      rerender({ selector: sliceText(3) })
      expect(result.current).toBe('foo')
    })
  })

  test('useSend', () => {
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

    act(() => {
      result.current.sendAtom2(setTestState2, 'bar2')
    })
    act(() => {
      result.current.sendAtom(setTestState, 'baz')
    })

    expect(result.current.readValue2).toBe('bar2')
    expect(result.current.readValue).toEqual({
      text: 'baz'
    })
  })

  test('useReset', () => {
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

    act(() => {
      result.current.sendAtom(setTestState, 'bar')
    })
    act(() => {
      result.current.resetAtom()
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

    test('forwards function name', () => {
      function namedFn() {}
      const { result } = renderHook(
        () => useIsNew(namedFn),
        { wrapper }
      )

      expect(result.current.name).toBe('namedFn')
    })
  })
})

describe('lifecycle', () => {
  const wrapper = ({
    children,
    done,
    Lifecycle
  }: {
    children?: any
    done: boolean
    Lifecycle: any
  }) => (
    <RetomicRoot>
      {/* We need to render the lifecycle hook separately so
      it can capture the child hooks' unmount events otherwise
      it will unmount before they happen. */}
      <Lifecycle />
      {!done && children}
    </RetomicRoot>
  )
  const identity = (d: any) => d
  test('properly manages listeners and state on mount/unmount', () => {
    const atomToTest = ref2
    const onLifecycle = jest.fn()
    function Lifecycle() {
      useOnLifecycle(onLifecycle)
      return null
    }
    const { result, rerender } = renderHook(
      () => {
        return {
          readValue: useRead(ref2, identity),
          sendAtom: useSend(ref2)
        }
      },
      {
        wrapper,
        initialProps: {
          done: false,
          Lifecycle
        }
      }
    )

    act(() => {
      result.current.sendAtom(setTestState2, 'bar')
    })
    rerender({
      done: true,
      Lifecycle
    })

    expect(onLifecycle.mock.calls).toEqual([
      [
        {
          activeHooks: {
            [atomToTest.key]: 1
          },
          key: atomToTest.key,
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          activeHooks: {
            [atomToTest.key]: 2
          },
          key: atomToTest.key,
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          activeHooks: {
            [atomToTest.key]: 2
          },
          key: atomToTest.key,
          type: 'stateChange',
          state: { [atomToTest.key]: 'bar' }
        }
      ],
      [
        {
          activeHooks: {
            [atomToTest.key]: 1
          },
          key: atomToTest.key,
          type: 'unmount',
          state: { [atomToTest.key]: 'bar' }
        }
      ],
      [
        {
          activeHooks: {},
          key: atomToTest.key,
          type: 'stateChange',
          state: {}
        }
      ],
      [
        {
          activeHooks: {},
          key: atomToTest.key,
          type: 'unmount',
          state: {}
        }
      ]
    ])
  })

  test('resetOnInactive option disabled', () => {
    const atomToTest = atom({
      key: 'atomToTest',
      defaultState: '',
      resetOnInactive: false
    })
    const onLifecycle = jest.fn()
    function Lifecycle() {
      useOnLifecycle(onLifecycle)
      return null
    }
    const { result, rerender } = renderHook(
      () => {
        return {
          sendAtom: useSend(atomToTest)
        }
      },
      {
        wrapper,
        initialProps: {
          done: false,
          Lifecycle
        }
      }
    )

    act(() => {
      const setTo = (_: string, newNum: string) => newNum
      result.current.sendAtom(setTo, 'foo')
    })
    rerender({
      done: true,
      Lifecycle
    })

    expect(onLifecycle.mock.calls).toEqual([
      [
        {
          activeHooks: {
            [atomToTest.key]: 1
          },
          key: atomToTest.key,
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          activeHooks: {
            [atomToTest.key]: 1
          },
          key: atomToTest.key,
          type: 'stateChange',
          state: {
            [atomToTest.key]: 'foo'
          }
        }
      ],
      [
        {
          activeHooks: {},
          key: atomToTest.key,
          type: 'unmount',
          state: {
            [atomToTest.key]: 'foo'
          }
        }
      ]
    ])
  })
})
