import { lifecycleStateChange, lifecycleMount, lifecycleUnmount } from './constants';
import type { Atom, Db } from './types';
export declare function makeDb<T>(initialState: T): Db;
export declare function emitLifecycleEvent<T>(db: Db, atom: Atom<T>, type: typeof lifecycleMount | typeof lifecycleUnmount | typeof lifecycleStateChange): void;
export declare function setState<T>(db: Db, newState: T, atom: Atom<T>, updateFn: Function, updatePayload: any): Promise<void>;
export declare function getState(db: Db): Readonly<import("./types").DbState>;
