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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { noop, RootContext, $$internal, $$lifeCycleChannel, LIFECYCLE_MOUNT } from './constants';
function AtomObserver(_a) {
    var onChange = _a.onChange, _b = _a.onLifeCycle, onLifeCycle = _b === void 0 ? noop : _b;
    var rootDb = useContext(RootContext);
    useEffect(function () {
        var onLifeCycleWrapper = function (data) {
            var refKeys = Array.from(rootDb.activeRefKeys.values());
            var activeHooks = Object.fromEntries(refKeys.map(function (key) { return [
                key,
                rootDb.subscriptions.listenerCount(key)
            ]; }));
            onLifeCycle(__assign(__assign({}, data), { activeHooks: activeHooks }));
        };
        var subscriptions = [
            rootDb.subscriptions.on($$internal, onChange),
            rootDb.subscriptions.on($$lifeCycleChannel, onLifeCycleWrapper)
        ];
        rootDb.subscriptions.emit($$lifeCycleChannel, {
            type: LIFECYCLE_MOUNT,
            key: $$lifeCycleChannel
        });
        return function () {
            subscriptions.forEach(function (unsubscribe) { return unsubscribe(); });
        };
    }, [onChange, onLifeCycle, rootDb]);
    return null;
}
export function AtomDevTools(_a) {
    var _b = _a.logSize, logSize = _b === void 0 ? 50 : _b;
    // IMPORTANT: in order to support universal apps we need
    // to lazily require this since it depends on browser apis
    var ReactJson = require('react-json-view').default;
    var _c = useState([]), log = _c[0], setLog = _c[1];
    var _d = useState({}), hookInfo = _d[0], setHookInfo = _d[1];
    var addLogEntry = useMemo(function () { return function (entry) {
        setLog(function (oldLog) { return __spreadArray([
            entry
        ], oldLog.slice(0, logSize - 1), true); });
    }; }, [logSize]);
    var atomObserverProps = useMemo(function () {
        return {
            onChange: function (_a) {
                var newState = _a.newState, atomRef = _a.atomRef, mutationFn = _a.mutationFn, mutationPayload = _a.mutationPayload;
                addLogEntry({
                    action: {
                        functionName: mutationFn.name,
                        payload: mutationPayload,
                        atomKey: atomRef.key
                    },
                    atomState: newState,
                    timestamp: performance.now()
                });
            },
            onLifeCycle: function (data) {
                var activeHooks = data.activeHooks;
                setHookInfo(function () { return activeHooks; });
            }
        };
    }, [addLogEntry]);
    return (React.createElement("div", null,
        React.createElement("h2", null, "React Atomic devtools"),
        React.createElement(AtomObserver, __assign({}, atomObserverProps)),
        React.createElement("div", null,
            React.createElement("h3", null, "Active Hooks"),
            React.createElement(ReactJson, { src: hookInfo, name: null, displayDataTypes: false })),
        React.createElement("div", null,
            React.createElement("h3", null, "Action log"),
            React.createElement("div", { style: {
                    height: 300,
                    overflowY: 'scroll',
                    background: '#ccc',
                    border: '1px solid #ccc'
                } }, log.slice(0, 5).map(function (entry) {
                var _a = entry;
                return (React.createElement("div", { key: entry.timestamp, style: {
                        margin: '1rem',
                        background: '#fff'
                    } },
                    React.createElement(ReactJson, { src: entry, name: null, displayDataTypes: false })));
            })))));
}
