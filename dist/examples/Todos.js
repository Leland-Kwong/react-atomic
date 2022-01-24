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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
define(["require", "exports", "react", "../core"], function (require, exports, react_1, core_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Todos = void 0;
    react_1 = __importDefault(react_1);
    var todosRef = (0, core_1.atomRef)({
        key: 'todos',
        defaultState: {
            items: [
                {
                    text: 'buy eggs',
                    done: false,
                    id: String(0)
                }
            ]
        }
    });
    var addTodo = function (s, newTodo) { return (__assign(__assign({}, s), { items: __spreadArray(__spreadArray([], s.items, true), [newTodo], false) })); };
    function TodosList() {
        var todos = (0, core_1.useRead)(todosRef, function (d) { return d.items; });
        return (react_1.default.createElement("div", { style: {
                height: 400,
                overflow: 'auto'
            } }, todos.map(function (_a) {
            var id = _a.id, text = _a.text, done = _a.done;
            return (react_1.default.createElement("div", { key: id },
                react_1.default.createElement("input", { type: "checkbox", checked: done, readOnly: true }),
                "text: ",
                text));
        })));
    }
    function AddTodo() {
        var sendTodos = (0, core_1.useSend)(todosRef);
        return (react_1.default.createElement("button", { type: "button", onClick: function () {
                sendTodos(addTodo, {
                    text: 'buy something',
                    done: false,
                    id: String(Math.random())
                });
            } }, "add todo"));
    }
    function Todos() {
        return (react_1.default.createElement("div", null,
            react_1.default.createElement("h1", null, "Retomic Example"),
            react_1.default.createElement(core_1.AtomRoot, null,
                react_1.default.createElement(TodosList, null),
                react_1.default.createElement(AddTodo, null))));
    }
    exports.Todos = Todos;
});
