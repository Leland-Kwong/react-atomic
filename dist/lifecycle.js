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
exports.useLifeCycle = void 0;
var react_1 = require("react");
var mutable_1 = require("./mutable");
var db_1 = require("./db");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function $$removeInactiveKey() { }
function cleanupRef(db, atomRef) {
    mutable_1.mutable.atomRefsByKey.delete(atomRef.key);
    // remove the state key since is inactive
    var _a = (0, db_1.getState)(db), _b = atomRef.key, _ = _a[_b], newStateWithoutRef = __rest(_a, [typeof _b === "symbol" ? _b : _b + ""]);
    return (0, db_1.setState)(db, newStateWithoutRef, atomRef, $$removeInactiveKey, undefined);
}
function useLifeCycleEvents(db, atomRef) {
    (0, react_1.useEffect)(function () {
        var hasLifeCycleListeners = db.subscriptions.listenerCount(constants_1.$$lifeCycleChannel) > 0;
        if (!hasLifeCycleListeners) {
            return;
        }
        var asyncMountEvent = db.subscriptions.emit(constants_1.$$lifeCycleChannel, {
            type: constants_1.LIFECYCLE_MOUNT,
            key: atomRef.key
        });
        return function () {
            asyncMountEvent.then(function () {
                db.subscriptions.emit(constants_1.$$lifeCycleChannel, {
                    type: constants_1.LIFECYCLE_UNMOUNT,
                    key: atomRef.key
                });
            });
        };
    }, [db, atomRef]);
}
function useLifeCycle(db, atomRef) {
    var rootDb = (0, react_1.useContext)(constants_1.RootContext);
    var hasAtomRoot = rootDb !== constants_1.defaultContext;
    if (!hasAtomRoot) {
        throw new Error((0, utils_1.errorMsg)('Application tree must be wrapped in an `AtomRoot` component'));
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
    (0, react_1.useEffect)(handleAtomLifeCycleState, [db, atomRef]);
}
exports.useLifeCycle = useLifeCycle;
