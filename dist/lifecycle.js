var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { useContext, useEffect } from 'react';
import { mutable } from './mutable';
import { getState, setState } from './db';
import { defaultContext, RootContext, $$lifeCycleChannel, LIFECYCLE_MOUNT, LIFECYCLE_UNMOUNT } from './constants';
import { errorMsg } from './utils';
function $$removeInactiveKey() { }
function cleanupRef(db, atomRef) {
    mutable.atomRefsByKey.delete(atomRef.key);
    // remove the state key since is inactive
    var _a = getState(db), _b = atomRef.key, _ = _a[_b], newStateWithoutRef = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    return setState(db, newStateWithoutRef, atomRef, $$removeInactiveKey, undefined);
}
function useLifeCycleEvents(db, atomRef) {
    useEffect(function () {
        var hasLifeCycleListeners = db.subscriptions.listenerCount($$lifeCycleChannel) > 0;
        if (!hasLifeCycleListeners) {
            return;
        }
        var asyncMountEvent = db.subscriptions.emit($$lifeCycleChannel, {
            type: LIFECYCLE_MOUNT,
            key: atomRef.key
        });
        return function () {
            asyncMountEvent.then(function () {
                db.subscriptions.emit($$lifeCycleChannel, {
                    type: LIFECYCLE_UNMOUNT,
                    key: atomRef.key
                });
            });
        };
    }, [db, atomRef]);
}
export function useLifeCycle(db, atomRef) {
    var rootDb = useContext(RootContext);
    var hasAtomRoot = rootDb !== defaultContext;
    if (!hasAtomRoot) {
        throw new Error(errorMsg('Application tree must be wrapped in an `AtomRoot` component'));
    }
    var handleAtomLifeCycleState = function () {
        db.activeRefKeys.add(atomRef.key);
        return function () {
            var shouldCleanupAtom = db.subscriptions.listenerCount(atomRef.key) === 0;
            if (!shouldCleanupAtom) {
                return;
            }
            db.activeRefKeys.delete(atomRef.key);
            cleanupRef(db, atomRef);
        };
    };
    useLifeCycleEvents(db, atomRef);
    useEffect(handleAtomLifeCycleState, [db, atomRef]);
}
