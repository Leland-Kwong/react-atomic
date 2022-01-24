"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AtomRoot = void 0;
var react_1 = __importDefault(require("react"));
var db_1 = require("./db");
var react_2 = require("react");
var constants_1 = require("./constants");
var utils_1 = require("./utils");
function AtomRoot(_a) {
    var children = _a.children;
    var rootDb = (0, react_2.useContext)(constants_1.RootContext);
    var isNestedAtomRoot = rootDb !== constants_1.defaultContext;
    if (isNestedAtomRoot) {
        throw new Error((0, utils_1.errorMsg)('Application tree may only be wrapped in a single `AtomRoot` component'));
    }
    var db = (0, db_1.makeDb)({});
    return (react_1.default.createElement(constants_1.RootContext.Provider, { value: db }, children));
}
exports.AtomRoot = AtomRoot;
