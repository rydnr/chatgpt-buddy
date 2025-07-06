/**
 * @fileoverview HTTP server adapter for REST API endpoints
 * @description Manages Express.js server for automation requests and health checks
 * @author Web-Buddy Team
 */
import { Port } from '../../stubs/typescript-eda-stubs';
/**
 * Port interface for HTTP server operations
 */
export declare abstract class HttpServerPort extends Port {
    readonly name = "HttpServerPort";
    abstract startServer(port: number): Promise<void>;
    abstract stopServer(): Promise<void>;
    abstract registerRoute(method: string, path: string, handler: Function): void;
    abstract getServerInfo(): Promise<ServerInfo>;
}
/**
 * HTTP server adapter using Express.js
 * Provides REST API endpoints for automation requests and server management
 */
export declare class HttpServerAdapter extends HttpServerPort {
    private app?;
    private server?;
    private isRunning;
    private port;
    private routes;
    /**
     * Start the HTTP server on specified port
     */
    startServer(port: number): Promise<void>;
    /**
     * Stop the HTTP server gracefully
     */
    stopServer(): Promise<void>;
    /**
     * Register a new route handler
     */
    registerRoute(method: string, path: string, handler: Function): void;
    /**
     * Get server information
     */
    getServerInfo(): Promise<ServerInfo>;
    /**
     * Set up Express middleware
     */
    private setupMiddleware;
    /**
     * Set up default routes
     */
    private setupRoutes;
    /**
     * Get registered routes
     */
    getRegisteredRoutes(): RouteInfo[];
    /**
     * Health check for the adapter
     */
    isHealthy(): Promise<boolean>;
    /**
     * Cleanup the adapter
     */
    shutdown(): Promise<void>;
}
interface RouteInfo {
    method: string;
    path: string;
    handler: Function;
    registeredAt: Date;
}
export interface ServerInfo {
    isRunning: boolean;
    port: number;
    routeCount: number;
    registeredRoutes: string[];
    uptime: number;
    environment: string;
}
export {};
//# sourceMappingURL=http-server-adapter.d.ts.map