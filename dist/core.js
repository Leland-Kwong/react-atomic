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
exports.useReset = exports.useSend = exports.useRead = exports.atom = exports.useOnLifecycle = exports.RetomicRoot = void 0;
var react_1 = require("react");
var channels_1 = require("./channels");
var db_1 = require("./db");
var lifecycle_1 = require("./lifecycle");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function defaultTo(defaultValue, value) {
    return value === undefined ? defaultValue : value;
}
function $$resetAtom(_, defaultState) {
    return defaultState;
}
var RetomicRoot_1 = require("./RetomicRoot");
Object.defineProperty(exports, "RetomicRoot", { enumerable: true, get: function () { return RetomicRoot_1.RetomicRoot; } });
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
var updateReadReducer = function (toggleNum) {
    return toggleNum ? 0 : 1;
};
function useRead(atom, selector) {
    var key = atom.key, defaultState = atom.defaultState;
    var db = (0, utils_1.useDb)();
    var _a = (0, react_1.useReducer)(updateReadReducer, 0), update = _a[1];
    var selectorValue = (0, react_1.useRef)(undefined);
    var selectorRef = (0, react_1.useRef)(undefined);
    var isNewSelector = selectorRef.current !== selector;
    if (isNewSelector) {
        var stateSlice = (0, db_1.getState)(db)[key];
        selectorValue.current = selector(defaultTo(defaultState, stateSlice));
        /**
         * IMPORTANT
         * Update the selector in case it changes between renders.
         */
        selectorRef.current = selector;
    }
    (0, react_1.useEffect)(function () {
        (0, lifecycle_1.hookLifecycle)(db, atom, constants_1.lifecycleMount);
        var watcherFn = function (_a) {
            var oldState = _a.oldState, newState = _a.newState, initiatedBy = _a.atom;
            var shouldUpdate = initiatedBy.key === key;
            if (!shouldUpdate) {
                return;
            }
            var prev = oldState[key];
            var next = selectorRef.current(defaultTo(defaultState, newState[key]));
            var hasChanged = prev !== next;
            if (!hasChanged) {
                return;
            }
            selectorValue.current = next;
            update();
        };
        var id = (0, channels_1.subscribe)(db.stateChangeChannel, watcherFn);
        return function () {
            (0, channels_1.unsubscribe)(db.stateChangeChannel, id);
            (0, lifecycle_1.hookLifecycle)(db, atom, constants_1.lifecycleUnmount);
        };
    }, [db, key, defaultState, atom]);
    return selectorValue.current;
}
exports.useRead = useRead;
function useSend(atom) {
    var db = (0, utils_1.useDb)();
    (0, react_1.useEffect)(function () {
        (0, lifecycle_1.hookLifecycle)(db, atom, constants_1.lifecycleMount);
        return function () { return (0, lifecycle_1.hookLifecycle)(db, atom, constants_1.lifecycleUnmount); };
    }, [db, atom]);
    return (0, react_1.useMemo)(function () {
        return function (updateFn, payload) {
            var _a;
            if (process.env.NODE_ENV === 'development' &&
                !updateFn.name) {
                console.error('Warning: This update function should be named -', updateFn);
            }
            var key = atom.key, defaultState = atom.defaultState;
            var rootState = (0, db_1.getState)(db);
            var stateSlice = defaultTo(defaultState, rootState[key]);
            var nextState = __assign(__assign({}, rootState), (_a = {}, _a[key] = updateFn(stateSlice, payload), _a));
            return (0, db_1.setState)(db, nextState, atom, updateFn, payload);
        };
    }, [db, atom]);
}
exports.useSend = useSend;
function useReset(atom) {
    var mutate = useSend(atom);
    return (0, react_1.useMemo)(function () { return function () { return mutate($$resetAtom, atom.defaultState); }; }, [mutate, atom.defaultState]);
}
exports.useReset = useReset;
