import type { Atom, SelectorFn, UpdateFn } from './types';
export type { Atom, SelectorFn, UpdateFn } from './types';
export { RetomicRoot } from './RetomicRoot';
export { useOnLifecycle } from './lifecycle';
export declare function atom<T>({ key, defaultState, resetOnInactive }: Atom<T>): Atom<T>;
export declare function useRead<T, SelectorValue = T>(atom: Atom<T>, selector: SelectorFn<T, SelectorValue>): SelectorValue;
export declare function useSend<T>(atom: Atom<T>): <Payload>(updateFn: UpdateFn<T, Payload>, payload: Payload) => Promise<void>;
export declare function useReset<T>(atom: Atom<T>): () => Promise<void>;
