"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.RetomicRoot = void 0;
var react_1 = __importStar(require("react"));
var db_1 = require("./db");
var root_context_1 = require("./root-context");
var utils_1 = require("./utils");
function RetomicRoot(_a) {
    var children = _a.children;
    var currentDb = (0, utils_1.useDb)();
    var isNestedRetomicRoot = currentDb !== root_context_1.defaultContext;
    if (isNestedRetomicRoot) {
        throw new Error((0, utils_1.logMsg)('Application tree may only be wrapped in a single `RetomicRoot` component'));
    }
    var db = (0, react_1.useMemo)(function () { return (0, db_1.makeDb)({}); }, []);
    return (react_1.default.createElement(root_context_1.RootContext.Provider, { value: db }, children));
}
exports.RetomicRoot = RetomicRoot;
