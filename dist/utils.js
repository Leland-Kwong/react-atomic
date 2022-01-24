import { useRef } from 'react';
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
export function useIsNew(fn, isNewValue) {
    if (isNewValue === void 0) { isNewValue = shallowCompare; }
    var cache = useRef(null);
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
export function errorMsg(msg) {
    return "[retomic error]: ".concat(msg);
}
