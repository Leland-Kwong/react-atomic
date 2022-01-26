import Emittery from 'emittery';
import { lifecycleStateChange, $$lifecycleChannel } from './constants';
declare type Subscriptions<T> = Emittery<{
    [key: Atom<T>['key']]: WatcherEventData;
    [lifecycleStateChange]: WatcherEventData;
} & {
    [$$lifecycleChannel]: LifecycleEventData;
}>;
export interface DbState {
    [key: string]: any;
}
export interface Db<T> {
    state: Readonly<DbState>;
    subscriptions: Subscriptions<T>;
    activeHooks: {
        [atomKey: string]: number;
    };
}
export interface LifecycleEventData {
    type: string;
    key: Atom<any>['key'];
    state: Db<any>['state'];
    activeHooks: Readonly<Db<any>['activeHooks']>;
}
export declare type LifecycleFn = (data: LifecycleEventData) => void;
interface WatcherEventData {
    oldState: DbState;
    newState: DbState;
    atom: Atom<any>;
    updateFn: Function;
    updatePayload: any;
    db: Db<any>;
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
