import type { AtomRef, Db, LifeCycleEventData } from './types';
export declare function useLifeCycle(atomRef: AtomRef<any>, hookType: keyof Db<any>['activeHooks']): void;
export declare function useOnLifeCycle<T>(atomRef: AtomRef<T>, fn: (data: {
    type: string;
    activeHooks: Db<T>['activeHooks'];
    state: Db<T>['state'];
}) => void, predicate?: (data: LifeCycleEventData, atomRef: AtomRef<T>) => boolean): import("emittery").UnsubscribeFn;
