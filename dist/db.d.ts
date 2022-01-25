import { lifecycleStateChange, lifecycleMount, lifecycleUnmount } from './constants';
import type { Atom, Db } from './types';
export declare function makeDb<T>(initialState: T): Db<T>;
export declare function emitLifecycleEvent<T>(db: Db<T>, atom: Atom<T>, type: typeof lifecycleMount | typeof lifecycleUnmount | typeof lifecycleStateChange): Promise<void>;
export declare function setState<T>(db: Db<T>, newState: T, atom: Atom<T>, updateFn: Function, updatePayload: any): Promise<[void, void]>;
export declare function getState<T>(db: Db<T>): Readonly<import("./types").DbState>;
