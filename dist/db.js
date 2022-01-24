import Emittery from 'emittery';
import { $$internal } from './constants';
export function makeDb(initialState) {
    var subscriptions = new Emittery();
    return {
        state: initialState,
        subscriptions: subscriptions,
        activeRefKeys: new Set()
    };
}
export function setState(db, newState, atomRef, mutationFn, mutationPayload) {
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
        db.subscriptions.emit($$internal, eventData)
    ]);
}
export function getState(db) {
    return db.state;
}
