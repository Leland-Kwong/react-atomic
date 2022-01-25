"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootContext = exports.defaultContext = void 0;
var react_1 = require("react");
var db_1 = require("./db");
exports.defaultContext = (0, db_1.makeDb)({});
exports.RootContext = (0, react_1.createContext)(exports.defaultContext);
