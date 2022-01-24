define(["require", "exports", "react"], function (require, exports, react_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.errorMsg = exports.useIsNew = void 0;
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
    function useIsNew(fn, isNewValue) {
        if (isNewValue === void 0) { isNewValue = shallowCompare; }
        var cache = (0, react_1.useRef)(null);
        return function (x) {
            var next = fn(x);
            var shouldUpdateCache = cache.current === null ||
                isNewValue(cache.current, next);
            if (shouldUpdateCache) {
                cache.current = next;
            }
            return cache.current;
        };
    }
    exports.useIsNew = useIsNew;
    function errorMsg(msg) {
        return "[retomic error]: ".concat(msg);
    }
    exports.errorMsg = errorMsg;
});
