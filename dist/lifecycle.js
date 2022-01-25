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
Object.defineProperty(exports, "__esModule", { value: true });
exports.useOnLifeCycle = exports.useLifeCycle = void 0;
var react_1 = require("react");
var mutable_1 = require("./mutable");
var db_1 = require("./db");
var constants_1 = require("./constants");
var root_context_1 = require("./root-context");
var utils_1 = require("./utils");
var onLifeCycleDefaults = {
    predicate: function (_a, atom) {
        var key = _a.key;
        return key === atom.key;
    }
};
function numListeners(db, key) {
    return db.subscriptions.listenerCount(key);
}
function cleanupRef(db, atom) {
    var key = atom.key, resetOnInactive = atom.resetOnInactive;
    mutable_1.mutable.atomsByKey.delete(key);
    if (!resetOnInactive) {
        return;
    }
    var _a = (0, db_1.getState)(db), 
    // omit inactive state key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _b = key, 
    // omit inactive state key
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _omitted = _a[_b], newStateWithoutRef = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    // dummy named function for debugging context
    function $$removeInactiveKey() { }
    return (0, db_1.setState)(db, newStateWithoutRef, atom, $$removeInactiveKey, undefined);
}
function isAtomActive(db, atom) {
    return db.activeHooks[atom.key] > 0;
}
function emitLifeCycleEvent(db, atom, 
// TODO: add LIFECYCLE_STATE_CHANGE as a type as well
type) {
    if (numListeners(db, constants_1.$$lifeCycleChannel) === 0) {
        return;
    }
    db.subscriptions.emit(constants_1.$$lifeCycleChannel, {
        type: type,
        key: atom.key,
        state: (0, db_1.getState)(db),
        activeHooks: __assign({}, db.activeHooks)
    });
}
function useLifeCycle(atom, hookType) {
    var db = (0, utils_1.useDb)();
    var hasRetomicRoot = db !== root_context_1.defaultContext;
    if (!hasRetomicRoot) {
        throw new Error((0, utils_1.errorMsg)('Application tree must be wrapped in an `RetomicRoot` component'));
    }
    var handleAtomLifeCycleState = function () {
        db.activeHooks[atom.key] =
            (db.activeHooks[atom.key] || 0) + 1;
        emitLifeCycleEvent(db, atom, constants_1.LIFECYCLE_MOUNT);
        return function () {
            db.activeHooks[atom.key] -= 1;
            if (!isAtomActive(db, atom)) {
                delete db.activeHooks[atom.key];
                cleanupRef(db, atom);
            }
            emitLifeCycleEvent(db, atom, constants_1.LIFECYCLE_UNMOUNT);
        };
    };
    (0, react_1.useEffect)(handleAtomLifeCycleState, [db, atom, hookType]);
}
exports.useLifeCycle = useLifeCycle;
function useOnLifeCycle(atom, fn, predicate) {
    if (predicate === void 0) { predicate = onLifeCycleDefaults.predicate; }
    var db = (0, utils_1.useDb)();
    var unsubscribe = (0, react_1.useMemo)(function () {
        return db.subscriptions.on(constants_1.$$lifeCycleChannel, function (data) {
            var type = data.type, state = data.state, activeHooks = data.activeHooks;
            if (!predicate(data, atom)) {
                return;
            }
            fn({
                type: type,
                activeHooks: activeHooks,
                state: state
            });
        });
    }, [db, fn, predicate, atom]);
    return unsubscribe;
}
exports.useOnLifeCycle = useOnLifeCycle;
