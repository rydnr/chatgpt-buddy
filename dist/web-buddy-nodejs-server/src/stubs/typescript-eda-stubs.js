"use strict";
/**
 * Minimal TypeScript-EDA stubs for compilation
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Port = exports.Adapter = exports.Application = exports.Event = void 0;
exports.listen = listen;
exports.Enable = Enable;
exports.AdapterFor = AdapterFor;
// Domain stubs
class Event {
    constructor() { }
}
exports.Event = Event;
function listen(eventClass) {
    return function (target, propertyKey, descriptor) {
        // Stub decorator
    };
}
// Application stubs
class Application {
    constructor() { }
}
exports.Application = Application;
function Enable(adapterClass) {
    return function (target) {
        // Stub decorator
    };
}
// Infrastructure stubs
class Adapter {
    constructor() { }
}
exports.Adapter = Adapter;
class Port {
}
exports.Port = Port;
function AdapterFor(port) {
    return function (target) {
        // Stub decorator
    };
}
//# sourceMappingURL=typescript-eda-stubs.js.map