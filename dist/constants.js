"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LIFECYCLE_UNMOUNT = exports.LIFECYCLE_MOUNT = exports.$$lifeCycleChannel = exports.noop = exports.$$internal = void 0;
exports.$$internal = '$$atom.internal';
var noop = function () { };
exports.noop = noop;
exports.$$lifeCycleChannel = '$$atom.lifeCycleChannel';
exports.LIFECYCLE_MOUNT = 'mount';
exports.LIFECYCLE_UNMOUNT = 'unmount';
