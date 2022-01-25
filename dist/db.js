"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getState = exports.setState = exports.makeDb = void 0;
var emittery_1 = __importDefault(require("emittery"));
var constants_1 = require("./constants");
function makeDb(initialState) {
    var subscriptions = new emittery_1.default();
    return {
        state: initialState,
        subscriptions: subscriptions,
        activeHooks: {}
    };
}
exports.makeDb = makeDb;
function setState(db, newState, atomRef, mutationFn, mutationPayload) {
    var oldState = db.state;
    var eventData = {
        oldState: oldState,
        newState: newState,
        atomRef: atomRef,
        mutationFn: mutationFn,
        mutationPayload: mutationPayload,
        db: db
    };
    db.state = newState;
    return Promise.all([
        db.subscriptions.emit(atomRef.key, eventData),
        db.subscriptions.emit(constants_1.$$internal, eventData)
    ]);
}
exports.setState = setState;
function getState(db) {
    return db.state;
}
exports.getState = getState;
