import Emittery from 'emittery';
import { $$internal, $$lifeCycleChannel } from './constants';
declare type Subscriptions<T> = Emittery<{
    [key: Atom<T>['key']]: WatcherEventData;
    [$$internal]: WatcherEventData;
} & {
    [$$lifeCycleChannel]: LifeCycleEventData;
}>;
export interface Atom<T> {
    key: string;
    defaultState: T;
    /**
     * Whether to reset the state when there are no active
     * hooks.
     */
    resetOnInactive?: boolean;
}
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
export interface LifeCycleEventData {
    type: string;
    key: Atom<any>['key'];
    state: Db<any>['state'];
    activeHooks: Readonly<Db<any>['activeHooks']>;
}
export declare type LifecycleFn = (data: LifeCycleEventData) => void;
interface WatcherEventData {
    oldState: DbState;
    newState: DbState;
    atom: Atom<any>;
    mutationFn: Function;
    mutationPayload: any;
    db: Db<any>;
}
export declare type WatcherFn = (data: WatcherEventData) => void;
export interface AtomObserverProps {
    onChange: WatcherFn;
    onLifeCycle?: LifecycleFn;
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
export {};
