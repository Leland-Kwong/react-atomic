"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lifecycleUnmount = exports.lifecycleMount = exports.lifecycleStateChange = exports.$$lifeCycleChannel = exports.noop = void 0;
var noop = function () { };
exports.noop = noop;
exports.$$lifeCycleChannel = '$$atom.lifeCycleChannel';
exports.lifecycleStateChange = 'stateChange';
exports.lifecycleMount = 'mount';
exports.lifecycleUnmount = 'unmount';
