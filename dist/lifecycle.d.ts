import type { Atom, Db, LifecycleEventData } from './types';
/**
 * Tracks hook info and triggers mount/unmount lifecycle
 * events.
 */
export declare function useHookLifecycle(atom: Atom<any>, hookType: 'read' | 'send'): void;
/**
 * @public
 * A react hook for observing retomic lifecycle changes
 */
export declare function useOnLifecycle<T>(atom: Atom<T>, fn: (data: {
    type: string;
    activeHooks: Db<T>['activeHooks'];
    state: Db<T>['state'];
}) => void, predicate?: (data: LifecycleEventData, atom: Atom<T>) => boolean): import("emittery").UnsubscribeFn;
