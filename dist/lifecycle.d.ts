import type { Atom, Db, LifecycleEventData } from './types';
import { lifecycleMount, lifecycleUnmount } from './constants';
/**
 * Tracks hook info, triggers mount/unmount lifecycle
 * events, and handles any atom cleanup as necessary.
 */
export declare function hookLifecycle(db: Db, atom: Atom<any>, lifecycleType: typeof lifecycleMount | typeof lifecycleUnmount): void;
/**
 * @public
 * A react hook for observing retomic lifecycle changes
 */
export declare function useOnLifecycle(fn: (data: {
    type: string;
    activeHooks: Db['activeHooks'];
    state: Db['state'];
}) => void, predicate?: (data: LifecycleEventData) => boolean): void;
