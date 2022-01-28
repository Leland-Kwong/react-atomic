"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useUpdate = exports.useDb = exports.logMsg = void 0;
var react_1 = require("react");
var root_context_1 = require("./root-context");
function logMsg(msg, msgType) {
    if (msgType === void 0) { msgType = 'error'; }
    return "[retomic ".concat(msgType, "]: ").concat(msg);
}
exports.logMsg = logMsg;
function useDb() {
    return (0, react_1.useContext)(root_context_1.RootContext);
}
exports.useDb = useDb;
var updateReducer = function (toggleNum) {
    return toggleNum ? 0 : 1;
};
function useUpdate() {
    var _a = (0, react_1.useReducer)(updateReducer, 0), update = _a[1];
    return update;
}
exports.useUpdate = useUpdate;
