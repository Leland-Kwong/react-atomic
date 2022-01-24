define(["require", "exports", "react", "./db"], function (require, exports, react_1, db_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LIFECYCLE_UNMOUNT = exports.LIFECYCLE_MOUNT = exports.$$lifeCycleChannel = exports.RootContext = exports.defaultContext = exports.noop = exports.$$internal = void 0;
    exports.$$internal = '$$atom.internal';
    var noop = function () { };
    exports.noop = noop;
    exports.defaultContext = (0, db_1.makeDb)({});
    exports.RootContext = (0, react_1.createContext)(exports.defaultContext);
    exports.$$lifeCycleChannel = '$$atom.lifeCycleChannel';
    exports.LIFECYCLE_MOUNT = 'mount';
    exports.LIFECYCLE_UNMOUNT = 'unmount';
});
