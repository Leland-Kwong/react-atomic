import type { AtomRef } from './types';
export type { AtomRef } from './types';
export { useIsNew } from './utils';
export { AtomDevTools } from './AtomDevTools';
export { AtomRoot } from './AtomRoot';
export declare function atomRef<T>({ key, defaultState }: {
    key: AtomRef<T>['key'];
    defaultState: AtomRef<T>['defaultState'];
}): Readonly<AtomRef<T>>;
export declare function useReadAtom<T, SelectorValue = T>(atomRef: AtomRef<T>, selector: (state: T) => SelectorValue): SelectorValue;
export declare function useSendAtom<T>(atomRef: AtomRef<T>): <Payload>(mutationFn: (oldState: T, payload: Payload) => T, payload: Payload) => Promise<[void, void]>;
export declare function useResetAtom<T>(atomRef: AtomRef<T>): () => Promise<[void, void]>;
