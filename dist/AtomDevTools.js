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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtomDevTools = void 0;
var react_1 = __importStar(require("react"));
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function AtomObserver(_a) {
    var onChange = _a.onChange, _b = _a.onLifecycle, onLifecycle = _b === void 0 ? constants_1.noop : _b;
    var rootDb = (0, utils_1.useDb)();
    (0, react_1.useEffect)(function () {
        var onLifecycleWrapper = function (data) {
            onLifecycle(data);
        };
        var subscriptions = [
            rootDb.subscriptions.on(constants_1.lifecycleStateChange, onChange),
            rootDb.subscriptions.on(constants_1.$$lifeCycleChannel, onLifecycleWrapper)
        ];
        return function () {
            subscriptions.forEach(function (unsubscribe) { return unsubscribe(); });
        };
    }, [onChange, onLifecycle, rootDb]);
    return null;
}
function AtomDevTools(_a) {
    var _b = _a.logSize, logSize = _b === void 0 ? 50 : _b;
    // IMPORTANT: in order to support universal apps we need
    // to lazily require this since it depends on browser apis
    var ReactJson = require('react-json-view').default;
    var _c = (0, react_1.useState)([]), log = _c[0], setLog = _c[1];
    var _d = (0, react_1.useState)({}), hookInfo = _d[0], setHookInfo = _d[1];
    var addLogEntry = (0, react_1.useMemo)(function () { return function (entry) {
        setLog(function (oldLog) { return __spreadArray([
            entry
        ], oldLog.slice(0, logSize - 1), true); });
    }; }, [logSize]);
    var atomObserverProps = (0, react_1.useMemo)(function () {
        return {
            onChange: function (_a) {
                var newState = _a.newState, atom = _a.atom, updateFn = _a.updateFn, updatePayload = _a.updatePayload;
                addLogEntry({
                    action: {
                        functionName: updateFn.name,
                        payload: updatePayload,
                        atomKey: atom.key
                    },
                    atomState: newState,
                    timestamp: performance.now()
                });
            },
            onLifecycle: function (data) {
                var activeHooks = data.activeHooks;
                setHookInfo(function () { return activeHooks; });
            }
        };
    }, [addLogEntry]);
    return (react_1.default.createElement("div", null,
        react_1.default.createElement("h2", null, "React Atomic devtools"),
        react_1.default.createElement(AtomObserver, __assign({}, atomObserverProps)),
        react_1.default.createElement("div", null,
            react_1.default.createElement("h3", null, "Active Hooks"),
            react_1.default.createElement(ReactJson, { src: hookInfo, name: null, displayDataTypes: false })),
        react_1.default.createElement("div", null,
            react_1.default.createElement("h3", null, "Action log"),
            react_1.default.createElement("div", { style: {
                    height: 300,
                    overflowY: 'scroll',
                    background: '#ccc',
                    border: '1px solid #ccc'
                } }, log.slice(0, 5).map(function (entry) {
                var _a = entry;
                return (react_1.default.createElement("div", { key: entry.timestamp, style: {
                        margin: '1rem',
                        background: '#fff'
                    } },
                    react_1.default.createElement(ReactJson, { src: entry, name: null, displayDataTypes: false })));
            })))));
}
exports.AtomDevTools = AtomDevTools;
