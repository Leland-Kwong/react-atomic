"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.subscriberCount = exports.unsubscribe = exports.subscribe = exports.emit = exports.channel = void 0;
var nanoid_1 = require("nanoid");
function channel() {
    return new Map();
}
exports.channel = channel;
function channelOnEach(fn) {
    fn(this);
}
function emit(channel, data) {
    channel.forEach(channelOnEach, data);
}
exports.emit = emit;
function subscribe(channel, fn) {
    var id = (0, nanoid_1.nanoid)();
    channel.set(id, fn);
    return id;
}
exports.subscribe = subscribe;
function unsubscribe(channel, id) {
    channel.delete(id);
}
exports.unsubscribe = unsubscribe;
function subscriberCount(channel) {
    return channel.size;
}
exports.subscriberCount = subscriberCount;
