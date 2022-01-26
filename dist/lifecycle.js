"use strict";
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
exports.useOnLifecycle = exports.hookLifecycle = void 0;
var react_1 = require("react");
var db_1 = require("./db");
var constants_1 = require("./constants");
var channels_1 = require("./channels");
var root_context_1 = require("./root-context");
var utils_1 = require("./utils");
var onLifecycleDefaults = {
    predicate: function () {
        return true;
    }
};
function cleanupAtom(db, atom) {
    var key = atom.key, resetOnInactive = atom.resetOnInactive;
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
/**
 * Tracks hook info, triggers mount/unmount lifecycle
 * events, and handles any atom cleanup as necessary.
 */
function hookLifecycle(db, atom, lifecycleType) {
    var hasRetomicRoot = db !== root_context_1.defaultContext;
    if (!hasRetomicRoot) {
        throw new Error((0, utils_1.errorMsg)('Application tree must be wrapped in an `RetomicRoot` component'));
    }
    if (lifecycleType === constants_1.lifecycleMount) {
        db.activeHooks[atom.key] =
            (db.activeHooks[atom.key] || 0) + 1;
    }
    if (lifecycleType === constants_1.lifecycleUnmount) {
        db.activeHooks[atom.key] -= 1;
        if (!isAtomActive(db, atom)) {
            delete db.activeHooks[atom.key];
            cleanupAtom(db, atom);
        }
    }
    (0, db_1.emitLifecycleEvent)(db, atom, lifecycleType);
}
exports.hookLifecycle = hookLifecycle;
/**
 * @public
 * A react hook for observing retomic lifecycle changes
 */
function useOnLifecycle(fn, predicate) {
    if (predicate === void 0) { predicate = onLifecycleDefaults.predicate; }
    var db = (0, utils_1.useDb)();
    (0, react_1.useEffect)(function () {
        var id = (0, channels_1.subscribe)(db.lifecycleChannel, function (data) {
            if (!predicate(data)) {
                return;
            }
            fn(data);
        });
        return function () { return (0, channels_1.unsubscribe)(db.lifecycleChannel, id); };
    }, [db, fn, predicate]);
}
exports.useOnLifecycle = useOnLifecycle;
