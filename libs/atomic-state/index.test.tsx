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

  // test('useSendAtom', async () => {
  //   let callCount = 0
  //   const mockSelector = jest.fn((d) => d)
  //   const send = useSendAtom(ref)

  //   useReadAtom(ref, mockSelector)
  //   await send(setTestState, 'bar')

  //   expect(mockSelector.mock.calls).toEqual([
  //     ['foo'],
  //     ['bar']
  //   ])
  //   expect(useReadAtom(ref, mockSelector)).toBe('bar')
  // })

  // test('useResetAtom', () => {
  //   const resetAtom = useResetAtom(ref)
  //   const send = useSendAtom(ref)

  //   send(setTestState, 'bar')
  //   resetAtom()

  //   expect(useReadAtom(ref, (d) => d)).toBe('foo')
  // })
})
