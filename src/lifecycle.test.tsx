import {
  renderHook,
  act
} from '@testing-library/react-hooks'
import {
  atom,
  useOnLifecycle,
  useRead,
  useSend,
  useReadRoot,
  useWriteRoot,
  RetomicRoot
} from '.'

type State2 = string

const identity = (d: any) => d
const setTestState2 = (_: State2, newText: string) =>
  newText

describe('lifecycle', () => {
  test('properly triggers lifecycle events', () => {
    const wrapper = ({
      children,
      done,
      Lifecycle
    }: {
      children?: any
      done: boolean
      Lifecycle: any
      atomsToRead: any
    }) => (
      <RetomicRoot>
        {/* We need to render the lifecycle hook separately so
            it can capture the child hooks' unmount events, otherwise
            it will unmount before they happen. */}
        <Lifecycle />
        {!done && children}
      </RetomicRoot>
    )
    const atom1 = atom<State2>({
      key: 'atom1',
      defaultState: 'foo'
    })
    const onLifecycle = jest.fn()
    function Lifecycle() {
      useOnLifecycle(onLifecycle)
      return null
    }
    const { result, rerender } = renderHook(
      ({ atomsToRead }) => {
        return {
          readValue: useRead(atomsToRead, identity),
          sendAtom: useSend(atom1)
        }
      },
      {
        wrapper,
        initialProps: {
          done: false,
          Lifecycle,
          atomsToRead: atom1 as any
        }
      }
    )

    act(() => {
      result.current.sendAtom(setTestState2, 'bar')
    })
    // rerender with a new atom collection shape to ensure
    // it triggers a remount due to new atoms being supplied
    rerender({
      done: false,
      Lifecycle,
      atomsToRead: [atom1]
    })
    // rerender with same atom collection to ensure they get
    // properly checked for shallow equality and memoized if
    // so
    rerender({
      done: false,
      Lifecycle,
      atomsToRead: [atom1]
    })
    // we're done here, so it should cause the state to
    // reset due to `resetOnInactive` being `true`
    rerender({
      done: true,
      Lifecycle,
      atomsToRead: [atom1]
    })

    expect(onLifecycle.mock.calls).toEqual([
      [
        {
          observers: {
            [atom1.key]: 1
          },
          key: atom1.key,
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          observers: {
            [atom1.key]: 2
          },
          key: atom1.key,
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          observers: {
            [atom1.key]: 2
          },
          key: atom1.key,
          type: 'stateChange',
          state: { [atom1.key]: 'bar' }
        }
      ],
      [
        {
          observers: {
            [atom1.key]: 1
          },
          key: atom1.key,
          type: 'unmount',
          state: { [atom1.key]: 'bar' }
        }
      ],
      [
        {
          observers: {
            [atom1.key]: 2
          },
          key: atom1.key,
          type: 'mount',
          state: { [atom1.key]: 'bar' }
        }
      ],
      [
        {
          observers: {
            [atom1.key]: 1
          },
          key: atom1.key,
          type: 'unmount',
          state: { [atom1.key]: 'bar' }
        }
      ],
      [
        {
          observers: {},
          key: atom1.key,
          type: 'stateChange',
          state: {}
        }
      ],
      [
        {
          observers: {},
          key: atom1.key,
          type: 'unmount',
          state: {}
        }
      ]
    ])
  })

  test('resetOnInactive option disabled', () => {
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
          observers: {
            [atom1.key]: 1
          },
          key: atom1.key,
          type: 'mount',
          state: {}
        }
      ],
      [
        {
          observers: {
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
          observers: {},
          key: atom1.key,
          type: 'unmount',
          state: {
            [atom1.key]: 'foo'
          }
        }
      ]
    ])
  })

  test('writing to root state should also update selectors', () => {
    const testAtom = atom({
      key: 'test',
      defaultState: {
        text: 'bar'
      }
    })
    const wrapper = ({ children }: { children: any }) => (
      <RetomicRoot>{children}</RetomicRoot>
    )
    const newRootState = {
      [testAtom.key]: {
        text: 'baz'
      }
    }
    const selector = jest.fn((d) => d)
    const { result } = renderHook(
      () => {
        return {
          selection: useRead(testAtom, selector),
          writeRoot: useWriteRoot(),
          rootState: useReadRoot()
        }
      },
      { wrapper }
    )

    act(() => {
      result.current.writeRoot(newRootState)
    })

    expect(result.current.rootState).toBe(newRootState)
    expect(selector.mock.calls).toEqual([
      [testAtom.defaultState],
      [newRootState[testAtom.key]]
    ])
  })
})
