import type { Atom, Db, LifeCycleEventData } from './types';
export declare function useLifeCycle(atom: Atom<any>, hookType: keyof Db<any>['activeHooks']): void;
export declare function useOnLifeCycle<T>(atom: Atom<T>, fn: (data: {
    type: string;
    activeHooks: Db<T>['activeHooks'];
    state: Db<T>['state'];
}) => void, predicate?: (data: LifeCycleEventData, atom: Atom<T>) => boolean): import("emittery").UnsubscribeFn;
