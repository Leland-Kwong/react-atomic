"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useDb = exports.errorMsg = void 0;
var react_1 = require("react");
var root_context_1 = require("./root-context");
function errorMsg(msg) {
    return "[retomic error]: ".concat(msg);
}
exports.errorMsg = errorMsg;
function useDb() {
    return (0, react_1.useContext)(root_context_1.RootContext);
}
exports.useDb = useDb;
