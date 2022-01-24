import React from 'react'
import {
  renderHook,
  act
} from '@testing-library/react-hooks'
import {
  atomRef,
  useRead,
  useResetAtom,
  useSend,
  AtomRoot,
  useIsNew
} from '.'

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

    expect(mockSelector.mock.calls).toEqual([
      [{ text: 'foo' }],
      [{ text: 'foo' }],
      [{ text: 'baz' }],
      [{ text: 'baz' }]
    ])
    expect(result.current.readValue2).toBe('bar2')
    expect(result.current.readValue).toEqual({
      text: 'baz'
    })
  })

  test('useResetAtom', async () => {
    const mockWrapper = ({
      children
    }: {
      children: any
    }) => <AtomRoot>{children}</AtomRoot>
    const mockSelector = jest.fn((d) => d)
    const { result } = renderHook(
      () => {
        const readValue = useRead(ref, mockSelector)
        const resetAtom = useResetAtom(ref)
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

    expect(mockSelector.mock.calls).toEqual([
      [{ text: 'foo' }],
      [{ text: 'bar' }],
      [{ text: 'bar' }],
      [{ text: 'foo' }],
      [{ text: 'foo' }]
    ])
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
})
