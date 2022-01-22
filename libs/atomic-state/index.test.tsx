import React from 'react'
import {
  renderHook,
  act
} from '@testing-library/react-hooks'
import {
  atomRef,
  useReadAtom,
  useResetAtom,
  useSendAtom,
  AtomRoot
} from '.'

describe('react-atomic', () => {
  type State = string

  const ref = atomRef<State>({
    key: 'test',
    defaultState: 'foo'
  })

  const setTestState = (_: State, newText: string) =>
    newText

  test('useReadAtom', () => {
    const wrapper = ({ children }: { children: any }) => (
      <AtomRoot>{children}</AtomRoot>
    )
    const mockSelector = jest.fn((d) => d.length)
    const { result } = renderHook(
      () => useReadAtom(ref, mockSelector),
      { wrapper }
    )

    expect(mockSelector.mock.calls).toEqual([['foo']])
    expect(result.current).toBe(3)
  })

  test('useSendAtom', async () => {
    const wrapper = ({ children }: { children: any }) => (
      <AtomRoot>{children}</AtomRoot>
    )
    const mockSelector = jest.fn((d) => d)
    const { result } = renderHook(
      () => {
        const readValue = useReadAtom(ref, mockSelector)
        const sendAtom = useSendAtom(ref)

        return { readValue, sendAtom }
      },
      { wrapper }
    )

    await act(async () => {
      await result.current.sendAtom(setTestState, 'baz')
    })

    expect(mockSelector.mock.calls).toEqual([
      ['foo'],
      ['baz'],
      ['baz']
    ])
    expect(result.current.readValue).toBe('baz')
  })

  test('useResetAtom', async () => {
    const mockWrapper = ({
      children
    }: {
      children: any
    }) => <AtomRoot>{children}</AtomRoot>
    const mockSelector = jest.fn((d) => d)
    const { result, rerender } = renderHook(
      () => {
        const readValue = useReadAtom(ref, mockSelector)
        const resetAtom = useResetAtom(ref)
        const sendAtom = useSendAtom(ref)

        return { readValue, resetAtom, sendAtom }
      },
      { wrapper: mockWrapper }
    )

    await act(async () => {
      await result.current.sendAtom(setTestState, 'bar')
    })
    await act(async () => {
      await result.current.resetAtom()
    })

    rerender()

    expect(mockSelector.mock.calls).toEqual([
      ['foo'],
      ['bar'],
      ['bar'],
      ['foo'],
      ['foo'],
      ['foo']
    ])
    expect(result.current.readValue).toBe('foo')
  })
})
