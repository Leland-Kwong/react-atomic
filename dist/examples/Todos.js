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
import React from 'react';
import { atomRef, useRead, useSend, AtomRoot } from '../core';
var todosRef = atomRef({
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
    var todos = useRead(todosRef, function (d) { return d.items; });
    return (React.createElement("div", { style: {
            height: 400,
            overflow: 'auto'
        } }, todos.map(function (_a) {
        var id = _a.id, text = _a.text, done = _a.done;
        return (React.createElement("div", { key: id },
            React.createElement("input", { type: "checkbox", checked: done, readOnly: true }),
            "text: ",
            text));
    })));
}
function AddTodo() {
    var sendTodos = useSend(todosRef);
    return (React.createElement("button", { type: "button", onClick: function () {
            sendTodos(addTodo, {
                text: 'buy something',
                done: false,
                id: String(Math.random())
            });
        } }, "add todo"));
}
export function Todos() {
    return (React.createElement("div", null,
        React.createElement("h1", null, "Retomic Example"),
        React.createElement(AtomRoot, null,
            React.createElement(TodosList, null),
            React.createElement(AddTodo, null))));
}
