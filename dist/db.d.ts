import type { AtomRef, Db } from './types';
export declare function makeDb<T>(initialState: T): Db<T>;
export declare function setState<T>(db: Db<T>, newState: T, atomRef: AtomRef<T>, mutationFn: Function, mutationPayload: any): Promise<[void, void]>;
export declare function getState<T>(db: Db<T>): Readonly<import("./types").DbState>;
