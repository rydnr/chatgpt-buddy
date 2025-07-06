/**
 * Minimal TypeScript-EDA stubs for compilation
 */

// Domain stubs
export class Event {
  constructor() {}
}

export function listen(eventClass: any) {
  return function (target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    // Stub decorator
  };
}

// Application stubs
export class Application {
  constructor() {}
}

export function Enable(adapterClass: any) {
  return function (target: any) {
    // Stub decorator
  };
}

// Infrastructure stubs
export class Adapter {
  constructor() {}
}

export class Port {
  // Stub class
}

export function AdapterFor(port: any) {
  return function (target: any) {
    // Stub decorator
  };
}