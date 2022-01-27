# Retomic

Retomic is a reactive state management system for React. The idea for this library is based on the idea of [clojure's atoms](https://clojure.org/reference/atoms).

## Installation

The Retomic package lives in [npm](https://www.npmjs.com/get-npm). To install the latest stable version, run the following command:

```shell
npm install retomic
```

## Usage

### `RetomicRoot`

Retomic includes a `RetomicRoot` component which creates a single object tree for the application state.

```jsx
import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'

const rootElement = document.getElementById('root')
ReactDOM.render(
  <RetomicRoot>
    <App />
  </RetomicRoot>,
  rootElement
)
```

### Atoms

Retomic atoms are slices of your state accessed based on their `key` property.

```js
import { atom } from 'retomic'

export const counterAtom = atom({
  key: 'counter',
  defaultState: 0
})
```

### Hooks

Retomic provides a pair of hooks for reading and writing data to your atoms.

`useRead` reads a value from an atom and watches for updates while `useSend` returns a `send` function to send updates via update functions.

```js
import { useRead, useSend } from 'retomic'
import { counterAtom } from './counter-atom'

const increment = (state, x) => state + x
const decrement = (state, x) => state - x

function Counter() {
  const count = useRead(counterAtom, d => d)
  const send = useSend(counterAtom)

  return (
    <div>
      <button
        className={styles.button}
        aria-label="Increment value"
        onClick={() => send(increment, 1)}
      >
        +
      </button>
      <span className={styles.value}>{count}</span>
      <button
        className={styles.button}
        aria-label="Decrement value"
        onClick={() => send(decrement, 1)}
      >
        -
      </button>
    </div>
  )
}
```

## API

### `atom`

```ts
type atom({
  key,
  defaultState,
  resetOnInactive
}: {
  key: string,
  defaultState: any,
  resetOnInactive?: boolean
})
```

### `useRead`

```ts
useRead<T>(
  atom: Atom<T>,
  selector: SelectorFn<T, SelectorValue>,
  isEqualFn: IsEqualFn<SelectorValue> = shallowEqual
)
```

### `useSend`

```ts
useSend<T>(atom: Atom<T>):
  <Payload>(
    updateFn: UpdateFn<T, Payload>,
    payload: Payload
  ): void
```
