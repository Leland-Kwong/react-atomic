import React, { useRef } from 'react'
import {
  renderHook,
  act
} from '@testing-library/react-hooks'
import {
  atom,
  useRead,
  useReset,
  useSend,
  RetomicRoot
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

    test('only updates when change matches atom key', () => {
      const selector1 = jest.fn()
      const selector2 = jest.fn()
      const { result } = renderHook(
        () => {
          const val1 = useRead(ref, selector1)
          const val2 = useRead(ref2, selector2)
          const send1 = useSend(ref)

          return { val1, val2, send1 }
        },
        { wrapper }
      )

      act(() => {
        const setText = (_: State, text: string) => ({
          text
        })
        result.current.send1(setText, 'bar')
      })
      expect(selector1.mock.calls.length).toBe(2)
      expect(selector2.mock.calls.length).toBe(1)
    })

    test('custom isEqual function', () => {
      const selector1 = jest.fn((d) => d)
      const renderCallback = jest.fn()
      const { result } = renderHook(
        () => {
          const val1 = useRead(ref, selector1, () => true)
          const send1 = useSend(ref)
          renderCallback()

          return { val1, send1 }
        },
        { wrapper }
      )

      act(() => {
        const setText = (_: State, text: string) => ({
          text
        })
        result.current.send1(setText, 'bar')
        result.current.send1(setText, 'bar')
      })

      expect(renderCallback.mock.calls.length).toBe(1)
    })
  })

  test('useSend', () => {
    const wrapper = ({ children }: { children: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
    const mockSelector = jest.fn((d) => d.text)
    const { result } = renderHook(
      () => {
        const readValue = useRead(ref, mockSelector)
        const sendAtom = useSend(ref)
        const readValue2 = useRead(ref2, identity)
        const sendAtom2 = useSend(ref2)
        const renderCount = useRef(0)
        renderCount.current += 1

        return {
          readValue,
          sendAtom,
          readValue2,
          sendAtom2,
          renderCount: renderCount.current
        }
      },
      { wrapper }
    )

    act(() => {
      result.current.sendAtom(setTestState, 'baz')
    })
    act(() => {
      result.current.sendAtom(setTestState, 'baz')
    })
    expect(result.current.renderCount).toBe(2)
    act(() => {
      result.current.sendAtom2(setTestState2, 'bar2')
    })
    expect(mockSelector.mock.calls.length).toBe(3)
    expect(result.current.renderCount).toBe(3)
    expect(result.current.readValue).toEqual('baz')
    expect(result.current.readValue2).toBe('bar2')
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
