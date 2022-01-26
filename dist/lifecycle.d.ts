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
export declare function useOnLifecycle(fn: (data: {
    type: string;
    activeHooks: Db['activeHooks'];
    state: Db['state'];
}) => void, predicate?: (data: LifecycleEventData) => boolean): void;
