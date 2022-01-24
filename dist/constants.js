import { createContext } from 'react';
import { makeDb } from './db';
export var $$internal = '$$atom.internal';
export var noop = function () { };
export var defaultContext = makeDb({});
export var RootContext = createContext(defaultContext);
export var $$lifeCycleChannel = '$$atom.lifeCycleChannel';
export var LIFECYCLE_MOUNT = 'mount';
export var LIFECYCLE_UNMOUNT = 'unmount';
