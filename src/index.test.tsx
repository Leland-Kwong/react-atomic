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
const useRenderCount = () => {
  const count = useRef(0)
  count.current += 1

  return count.current
}

describe('core', () => {
  describe('useRead', () => {
    const wrapper = ({
      children
    }: {
      children?: any
      selector?: SelectorFn<State, any>
      isEqualFn?: Function
    }) => <RetomicRoot>{children}</RetomicRoot>

    test('new selector each render', () => {
      const atom1 = atom<State>({
        key: 'test',
        defaultState: {
          text: 'foo'
        }
      })
      const sliceText = (dist: number) => (d: State) =>
        d.text.substring(0, dist)
      const { result, rerender } = renderHook(
        ({ selector }) => useRead(atom1, selector),
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

    test('different selector with same object equality should return same reference', () => {
      const atom1 = atom<State>({
        key: 'test',
        defaultState: {
          text: 'foo'
        }
      })
      const { result, rerender } = renderHook(
        () => useRead(atom1, ({ text }) => ({ text })),
        { wrapper }
      )

      rerender()
      expect(result.all[0]).toBe(result.current)
    })

    test('only updates when change matches atom key', () => {
      const atom1 = atom<State>({
        key: 'test',
        defaultState: {
          text: 'foo'
        }
      })
      const atom2 = atom<State2>({
        key: 'test2',
        defaultState: 'foo2'
      })
      const selector1 = jest.fn((d) => d)
      const selector2 = jest.fn((d) => d)
      const renderCallback = jest.fn()
      const { result } = renderHook(
        () => {
          const val1 = useRead(atom1, selector1)
          const val2 = useRead(atom2, selector2)
          const send1 = useSend(atom1)
          renderCallback()

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
      expect(renderCallback.mock.calls.length).toBe(2)
    })

    describe('custom isEqual function', () => {
      const atom1 = atom<State>({
        key: 'test',
        defaultState: {
          text: 'foo'
        }
      })
      const makeRenderHook = (initialProps: {
        isEqualFn: any
      }) =>
        renderHook(
          ({ isEqualFn }) => {
            const val1 = useRead(atom1, (x) => x, isEqualFn)
            const send1 = useSend(atom1)
            const renderCount = useRenderCount()

            return { val1, send1, renderCount }
          },
          {
            wrapper,
            initialProps
          }
        )
      const setText = (_: State, text: string) => ({
        text
      })

      test('if is equal then should not rerender', () => {
        const { result } = makeRenderHook({
          isEqualFn: () => true
        })
        act(() => {
          result.current.send1(setText, 'bar')
        })
        expect(result.current.renderCount).toBe(1)
      })

      test('if not equal then should rerender', () => {
        const { result } = makeRenderHook({
          isEqualFn: () => false
        })
        act(() => {
          result.current.send1(setText, 'bar')
        })
        expect(result.current.renderCount).toBe(2)
      })

      test('when isEqualFn changes it should recalculate', () => {
        const { result, rerender } = makeRenderHook({
          isEqualFn: () => true
        })
        act(() => {
          result.current.send1(setText, 'baz')
        })
        rerender({
          isEqualFn: () => false
        })
        expect(result.current.renderCount).toBe(2)
        // test the useRead's inner stateChange
        // subscriber as well
        act(() => {
          result.current.send1(setText, 'cux')
        })
        expect(result.current.renderCount).toBe(3)
      })
    })
  })

  test('useSend', () => {
    const atom1 = atom<State>({
      key: 'test',
      defaultState: {
        text: 'foo'
      }
    })
    const atom2 = atom<State2>({
      key: 'test2',
      defaultState: 'foo2'
    })
    const wrapper = ({ children }: { children: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
    const mockSelector = jest.fn((d) => d.text)
    const { result } = renderHook(
      () => {
        const readValue = useRead(atom1, mockSelector)
        const sendAtom = useSend(atom1)
        const readValue2 = useRead(atom2, identity)
        const sendAtom2 = useSend(atom2)
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
    const atom1 = atom<State>({
      key: 'test',
      defaultState: {
        text: 'foo'
      }
    })
    const wrapper = ({ children }: { children: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
    const mockSelector = jest.fn((d) => d)
    const { result } = renderHook(
      () => {
        const readValue = useRead(atom1, mockSelector)
        const resetAtom = useReset(atom1)
        const sendAtom = useSend(atom1)

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

    expect(result.current.readValue).toBe(
      atom1.defaultState
    )
  })

  describe('check for missing RetomicRoot wrapper', () => {
    test('useRead', () => {
      const atom1 = atom<State>({
        key: 'test',
        defaultState: {
          text: 'foo'
        }
      })
      const wrapper = ({ children }: { children: any }) => (
        <div>{children}</div>
      )
      const selector = (d: State) => d.text.length
      const { result } = renderHook(
        () => useRead(atom1, selector),
        { wrapper }
      )

      expect(() => result.current).toThrow()
    })

    test('useSend', () => {
      const atom1 = atom<State>({
        key: 'test',
        defaultState: {
          text: 'foo'
        }
      })
      const wrapper = ({ children }: { children: any }) => (
        <div>{children}</div>
      )
      const { result } = renderHook(() => useSend(atom1), {
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
    const atom1 = atom<State2>({
      key: 'test2',
      defaultState: 'foo2'
    })
    const atomToTest = atom1
    const onLifecycle = jest.fn()
    function Lifecycle() {
      useOnLifecycle(onLifecycle)
      return null
    }
    const { result, rerender } = renderHook(
      () => {
        return {
          readValue: useRead(atom1, identity),
          sendAtom: useSend(atom1)
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
    const atom1 = atom({
      key: 'atom1',
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
          sendAtom: useSend(atom1)
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
            [atom1.key]: 1
          },
          key: atom1.key,
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          activeHooks: {
            [atom1.key]: 1
          },
          key: atom1.key,
          type: 'stateChange',
          state: {
            [atom1.key]: 'foo'
          }
        }
      ],
      [
        {
          activeHooks: {},
          key: atom1.key,
          type: 'unmount',
          state: {
            [atom1.key]: 'foo'
          }
        }
      ]
    ])
  })
})
