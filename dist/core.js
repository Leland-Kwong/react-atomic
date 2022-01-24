var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { useContext, useEffect, useMemo, useState } from 'react';
import { RootContext } from './constants';
import { getState, setState } from './db';
import { useLifeCycle } from './lifecycle';
import { mutable } from './mutable';
function defaultTo(defaultValue, value) {
    return value === undefined ? defaultValue : value;
}
function $$resetAtom(_, defaultState) {
    return defaultState;
}
function checkDuplicateAtomKey(key) {
    var isDuplicateKey = mutable.atomRefsByKey.has(key);
    if (isDuplicateKey) {
        var duplicateKeyPrefix = process.env.NODE_ENV === 'development'
            ? '/@atomDuplicate'
            : '';
        var newKey = "".concat(key).concat(duplicateKeyPrefix, "/").concat(mutable.duplicaKeyCount);
        mutable.duplicaKeyCount += 1;
        console.warn("Warning: duplicate atomRef key `".concat(key, "` detected. As a safety precaution a new key, `").concat(newKey, "`, was automatically generated."));
        return newKey;
    }
    return key;
}
export { useIsNew } from './utils';
export { AtomDevTools } from './AtomDevTools';
export { AtomRoot } from './AtomRoot';
export function atomRef(_a) {
    var key = _a.key, defaultState = _a.defaultState;
    var actualKey = checkDuplicateAtomKey(key);
    var ref = {
        key: actualKey,
        defaultState: defaultState
    };
    mutable.atomRefsByKey.set(actualKey, ref);
    return ref;
}
export function useRead(atomRef, selector) {
    var key = atomRef.key, defaultState = atomRef.defaultState;
    var rootDb = useContext(RootContext);
    var initialStateSlice = getState(rootDb)[key];
    var _a = useState(selector(defaultTo(defaultState, initialStateSlice))), hookState = _a[0], setHookState = _a[1];
    useEffect(function () {
        var watcherFn = function (_a) {
            var newState = _a.newState;
            var stateSlice = newState[key];
            var nextValue = selector(defaultTo(defaultState, stateSlice));
            var hasChanged = hookState !== nextValue;
            if (!hasChanged) {
                return;
            }
            setHookState(nextValue);
        };
        return rootDb.subscriptions.on(key, watcherFn);
    }, [
        rootDb,
        key,
        hookState,
        selector,
        defaultState,
        atomRef
    ]);
    useLifeCycle(rootDb, atomRef);
    return hookState;
}
export function useSend(atomRef) {
    var key = atomRef.key, defaultState = atomRef.defaultState;
    var rootDb = useContext(RootContext);
    useLifeCycle(rootDb, atomRef);
    return useMemo(function () {
        return function (mutationFn, payload) {
            var _a;
            if (process.env.NODE_ENV === 'development' &&
                !mutationFn.name) {
                console.error('Warning: This mutation function should be named -', mutationFn);
            }
            var rootState = getState(rootDb);
            var stateSlice = defaultTo(defaultState, rootState[key]);
            var nextState = __assign(__assign({}, rootState), (_a = {}, _a[key] = mutationFn(stateSlice, payload), _a));
            return setState(rootDb, nextState, atomRef, mutationFn, payload);
        };
    }, [defaultState, rootDb, key, atomRef]);
}
export function useReset(atomRef) {
    var mutate = useSend(atomRef);
    return useMemo(function () { return function () { return mutate($$resetAtom, atomRef.defaultState); }; }, [mutate, atomRef.defaultState]);
}
