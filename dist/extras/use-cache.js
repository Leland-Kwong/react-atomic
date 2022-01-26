"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useIsNew = void 0;
var react_1 = require("react");
function shallowCompare(cache, value) {
    var maybeNewValue = value !== cache;
    if (maybeNewValue) {
        var shouldShallowCompare = typeof cache === 'object';
        if (shouldShallowCompare) {
            for (var _i = 0, _a = Object.keys(value); _i < _a.length; _i++) {
                var key = _a[_i];
                var prev = cache[key];
                var next = value[key];
                var isNewValue = prev !== next;
                if (isNewValue) {
                    return true;
                }
            }
            return false;
        }
    }
    return cache !== value;
}
/**
 * @public
 * Returns a new function that compares the old return value
 * and new return value. If they are the same, then it will
 * return what was previously returned. This is useful for
 * determining if two different objects are equal to prevent
 * unecessary rerenders.
 */
function useIsNew(inputFn, isNewValue) {
    if (isNewValue === void 0) { isNewValue = shallowCompare; }
    var cache = (0, react_1.useRef)(null);
    var args = { fn: inputFn, isNewValue: isNewValue };
    var argsRef = (0, react_1.useRef)(args);
    argsRef.current = args;
    var newFn = (0, react_1.useMemo)(function () {
        function wrappedFn(x) {
            var next = argsRef.current.fn(x);
            var shouldUpdateCache = cache.current === null ||
                argsRef.current.isNewValue(cache.current, next);
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
