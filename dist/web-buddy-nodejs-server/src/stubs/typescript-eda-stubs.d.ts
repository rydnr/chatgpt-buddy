/**
 * Minimal TypeScript-EDA stubs for compilation
 */
export declare class Event {
    constructor();
}
export declare function listen(eventClass: any): (target: any, propertyKey: string, descriptor: PropertyDescriptor) => void;
export declare class Application {
    constructor();
}
export declare function Enable(adapterClass: any): (target: any) => void;
export declare class Adapter {
    constructor();
}
export declare class Port {
}
export declare function AdapterFor(port: any): (target: any) => void;
//# sourceMappingURL=typescript-eda-stubs.d.ts.map