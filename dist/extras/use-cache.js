"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsNew = void 0;
var react_1 = require("react");
var shallowequal_1 = __importDefault(require("shallowequal"));
/**
 * @public
 * Returns a new function that compares the old return value
 * and new return value. If they are the same, then it will
 * return what was previously returned. This is useful for
 * determining if two different objects are equal to reduce
 * unecessary rerenders.
 */
function useIsNew(inputFn, isEqual) {
    if (isEqual === void 0) { isEqual = shallowequal_1.default; }
    var cache = (0, react_1.useRef)(null);
    var args = { fn: inputFn, isEqual: isEqual };
    var argsRef = (0, react_1.useRef)(args);
    argsRef.current = args;
    var newFn = (0, react_1.useMemo)(function () {
        function wrappedFn(x) {
            var next = argsRef.current.fn(x);
            var shouldUpdateCache = cache.current === null ||
                !argsRef.current.isEqual(cache.current, next);
            if (shouldUpdateCache) {
                cache.current = next;
            }
            return cache.current;
        }
        return wrappedFn;
    }, []);
    Object.defineProperty(newFn, 'name', {
        value: inputFn.name
    });
    return newFn;
}
exports.useIsNew = useIsNew;
