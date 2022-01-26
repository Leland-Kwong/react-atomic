"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lifecycleUnmount = exports.lifecycleMount = exports.lifecycleStateChange = exports.noop = void 0;
var noop = function () { };
exports.noop = noop;
exports.lifecycleStateChange = 'stateChange';
exports.lifecycleMount = 'mount';
exports.lifecycleUnmount = 'unmount';
