"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useReset = exports.useSend = exports.useRead = exports.atomRef = exports.atom = exports.useOnLifecycle = exports.RetomicRoot = exports.AtomRoot = exports.AtomDevTools = void 0;
var react_1 = require("react");
var db_1 = require("./db");
var lifecycle_1 = require("./lifecycle");
var utils_1 = require("./utils");
function defaultTo(defaultValue, value) {
    return value === undefined ? defaultValue : value;
}
function $$resetAtom(_, defaultState) {
    return defaultState;
}
var AtomDevTools_1 = require("./AtomDevTools");
Object.defineProperty(exports, "AtomDevTools", { enumerable: true, get: function () { return AtomDevTools_1.AtomDevTools; } });
// IMPORTANT: alias for backwards compatibility
var RetomicRoot_1 = require("./RetomicRoot");
Object.defineProperty(exports, "AtomRoot", { enumerable: true, get: function () { return RetomicRoot_1.RetomicRoot; } });
var RetomicRoot_2 = require("./RetomicRoot");
Object.defineProperty(exports, "RetomicRoot", { enumerable: true, get: function () { return RetomicRoot_2.RetomicRoot; } });
var lifecycle_2 = require("./lifecycle");
Object.defineProperty(exports, "useOnLifecycle", { enumerable: true, get: function () { return lifecycle_2.useOnLifecycle; } });
function atom(_a) {
    var key = _a.key, defaultState = _a.defaultState, _b = _a.resetOnInactive, resetOnInactive = _b === void 0 ? true : _b;
    return {
        key: key,
        defaultState: defaultState,
        resetOnInactive: resetOnInactive
    };
}
exports.atom = atom;
// IMPORTANT: alias for backwards compatibility
exports.atomRef = atom;
function useRead(atom, selector) {
    var key = atom.key, defaultState = atom.defaultState;
    var rootDb = (0, utils_1.useDb)();
    var initialStateSlice = (0, db_1.getState)(rootDb)[key];
    var _a = (0, react_1.useState)(selector(defaultTo(defaultState, initialStateSlice))), hookState = _a[0], setHookState = _a[1];
    (0, react_1.useEffect)(function () {
        var watcherFn = function (_a) {
            var oldState = _a.oldState, newState = _a.newState;
            var prev = oldState[key];
            var stateSlice = newState[key];
            var nextValue = selector(defaultTo(defaultState, stateSlice));
            var hasChanged = prev !== nextValue;
            if (!hasChanged) {
                return;
            }
            setHookState(nextValue);
        };
        return rootDb.subscriptions.on(key, watcherFn);
    }, [rootDb, key, selector, defaultState, atom]);
    (0, lifecycle_1.useHookLifecycle)(atom, 'read');
    return hookState;
}
exports.useRead = useRead;
function useSend(atom) {
    var rootDb = (0, utils_1.useDb)();
    (0, lifecycle_1.useHookLifecycle)(atom, 'send');
    return (0, react_1.useMemo)(function () {
        return function (updateFn, payload) {
            var _a;
            if (process.env.NODE_ENV === 'development' &&
                !updateFn.name) {
                console.error('Warning: This update function should be named -', updateFn);
            }
            var key = atom.key, defaultState = atom.defaultState;
            var rootState = (0, db_1.getState)(rootDb);
            var stateSlice = defaultTo(defaultState, rootState[key]);
            var nextState = __assign(__assign({}, rootState), (_a = {}, _a[key] = updateFn(stateSlice, payload), _a));
            return (0, db_1.setState)(rootDb, nextState, atom, updateFn, payload);
        };
    }, [rootDb, atom]);
}
exports.useSend = useSend;
function useReset(atom) {
    var mutate = useSend(atom);
    return (0, react_1.useMemo)(function () { return function () { return mutate($$resetAtom, atom.defaultState); }; }, [mutate, atom.defaultState]);
}
exports.useReset = useReset;
