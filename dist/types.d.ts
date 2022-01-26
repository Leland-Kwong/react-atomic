import { Channel } from './channels';
export interface DbState {
    [key: string]: any;
}
export interface LifecycleEventData {
    type: string;
    key: Atom<any>['key'];
    state: Db['state'];
    activeHooks: Readonly<Db['activeHooks']>;
}
export interface Db {
    state: Readonly<DbState>;
    stateChangeChannel: Channel<WatcherEventData>;
    lifecycleChannel: Channel<LifecycleEventData>;
    activeHooks: {
        [atomKey: string]: number;
    };
    id: string;
}
export declare type LifecycleFn = (data: LifecycleEventData) => void;
interface WatcherEventData {
    oldState: DbState;
    newState: DbState;
    atom: Atom<any>;
    updateFn: Function;
    updatePayload: any;
    db: Db;
}
export declare type WatcherFn = (data: WatcherEventData) => void;
export interface AtomObserverProps {
    onChange: WatcherFn;
    onLifecycle?: LifecycleFn;
}
export interface DevToolsLogEntry {
    timestamp: number;
    atomState: any;
    action: {
        functionName: string;
        payload: any;
        atomKey: string;
    };
}
/***************
 * Public Types
 ***************/
export interface Atom<T> {
    key: string;
    defaultState: T;
    /**
     * Whether to reset the state when there are no active
     * hooks.
     */
    resetOnInactive?: boolean;
}
export declare type SelectorFn<State, SelectorValue> = (state: State) => SelectorValue;
export declare type UpdateFn<State, Payload> = (state: State, payload: Payload) => State;
export {};
