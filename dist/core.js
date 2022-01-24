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
define(["require", "exports", "react", "./constants", "./db", "./lifecycle", "./mutable", "./utils", "./AtomDevTools", "./AtomRoot"], function (require, exports, react_1, constants_1, db_1, lifecycle_1, mutable_1, utils_1, AtomDevTools_1, AtomRoot_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.useResetAtom = exports.useSendAtom = exports.useReadAtom = exports.atomRef = exports.AtomRoot = exports.AtomDevTools = exports.useIsNew = void 0;
    function defaultTo(defaultValue, value) {
        return value === undefined ? defaultValue : value;
    }
    function $$resetAtom(_, defaultState) {
        return defaultState;
    }
    function checkDuplicateAtomKey(key) {
        var isDuplicateKey = mutable_1.mutable.atomRefsByKey.has(key);
        if (isDuplicateKey) {
            var duplicateKeyPrefix = process.env.NODE_ENV === 'development'
                ? '/@atomDuplicate'
                : '';
            var newKey = "".concat(key).concat(duplicateKeyPrefix, "/").concat(mutable_1.mutable.duplicaKeyCount);
            mutable_1.mutable.duplicaKeyCount += 1;
            console.warn("Warning: duplicate atomRef key `".concat(key, "` detected. As a safety precaution a new key, `").concat(newKey, "`, was automatically generated."));
            return newKey;
        }
        return key;
    }
    Object.defineProperty(exports, "useIsNew", { enumerable: true, get: function () { return utils_1.useIsNew; } });
    Object.defineProperty(exports, "AtomDevTools", { enumerable: true, get: function () { return AtomDevTools_1.AtomDevTools; } });
    Object.defineProperty(exports, "AtomRoot", { enumerable: true, get: function () { return AtomRoot_1.AtomRoot; } });
    function atomRef(_a) {
        var key = _a.key, defaultState = _a.defaultState;
        var actualKey = checkDuplicateAtomKey(key);
        var ref = {
            key: actualKey,
            defaultState: defaultState
        };
        mutable_1.mutable.atomRefsByKey.set(actualKey, ref);
        return ref;
    }
    exports.atomRef = atomRef;
    function useReadAtom(atomRef, selector) {
        var key = atomRef.key, defaultState = atomRef.defaultState;
        var rootDb = (0, react_1.useContext)(constants_1.RootContext);
        var initialStateSlice = (0, db_1.getState)(rootDb)[key];
        var _a = (0, react_1.useState)(selector(defaultTo(defaultState, initialStateSlice))), hookState = _a[0], setHookState = _a[1];
        (0, react_1.useEffect)(function () {
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
        (0, lifecycle_1.useLifeCycle)(rootDb, atomRef);
        return hookState;
    }
    exports.useReadAtom = useReadAtom;
    function useSendAtom(atomRef) {
        var key = atomRef.key, defaultState = atomRef.defaultState;
        var rootDb = (0, react_1.useContext)(constants_1.RootContext);
        (0, lifecycle_1.useLifeCycle)(rootDb, atomRef);
        return (0, react_1.useMemo)(function () {
            return function (mutationFn, payload) {
                var _a;
                if (process.env.NODE_ENV === 'development' &&
                    !mutationFn.name) {
                    console.error('Warning: This mutation function should be named -', mutationFn);
                }
                var rootState = (0, db_1.getState)(rootDb);
                var stateSlice = defaultTo(defaultState, rootState[key]);
                var nextState = __assign(__assign({}, rootState), (_a = {}, _a[key] = mutationFn(stateSlice, payload), _a));
                return (0, db_1.setState)(rootDb, nextState, atomRef, mutationFn, payload);
            };
        }, [defaultState, rootDb, key, atomRef]);
    }
    exports.useSendAtom = useSendAtom;
    function useResetAtom(atomRef) {
        var mutate = useSendAtom(atomRef);
        return (0, react_1.useMemo)(function () { return function () { return mutate($$resetAtom, atomRef.defaultState); }; }, [mutate, atomRef.defaultState]);
    }
    exports.useResetAtom = useResetAtom;
});
