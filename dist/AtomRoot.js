var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "react", "./db", "react", "./constants"], function (require, exports, react_1, db_1, react_2, constants_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.AtomRoot = void 0;
    react_1 = __importDefault(react_1);
    function AtomRoot(_a) {
        var children = _a.children;
        var rootDb = (0, react_2.useContext)(constants_1.RootContext);
        var isNestedAtomRoot = rootDb !== constants_1.defaultContext;
        if (process.env.NODE_ENV === 'development' &&
            isNestedAtomRoot) {
            console.error('Warning: Application tree may only be wrapped in a single `AtomRoot` component');
        }
        var db = (0, db_1.makeDb)({});
        return (react_1.default.createElement(constants_1.RootContext.Provider, { value: db }, children));
    }
    exports.AtomRoot = AtomRoot;
});
