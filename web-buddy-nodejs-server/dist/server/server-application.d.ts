/**
 * @fileoverview Main server application using TypeScript-EDA patterns
 * @description Coordinates HTTP server, WebSocket connections, and extension management
 * @author Web-Buddy Team
 */
import { Application } from '../stubs/typescript-eda-stubs';
import { ServerStartRequestedEvent, ServerStopRequestedEvent, ServerHealthCheckRequestedEvent, ServerMetricsRequestedEvent } from '../core/events/server-events';
import { ExtensionConnectedEvent, ExtensionDisconnectedEvent, AutomationRequestReceivedEvent } from '../core/events/coordination-events';
/**
 * Main server application that orchestrates all server components
 * Uses TypeScript-EDA patterns for event-driven coordination
 */
export declare class ServerApplication extends Application {
    readonly metadata: Map<string, string | number>;
    private isRunning;
    private startTime?;
    /**
     * Start the server with all components
     */
    handleServerStart(event: ServerStartRequestedEvent): Promise<void>;
    /**
     * Stop the server gracefully
     */
    handleServerStop(event: ServerStopRequestedEvent): Promise<void>;
    /**
     * Handle server health check requests
     */
    handleHealthCheck(event: ServerHealthCheckRequestedEvent): Promise<void>;
    /**
     * Handle server metrics requests
     */
    handleMetricsRequest(event: ServerMetricsRequestedEvent): Promise<void>;
    /**
     * Handle extension connection events
     */
    handleExtensionConnected(event: ExtensionConnectedEvent): Promise<void>;
    /**
     * Handle extension disconnection events
     */
    handleExtensionDisconnected(event: ExtensionDisconnectedEvent): Promise<void>;
    /**
     * Handle automation requests from external clients
     */
    handleAutomationRequest(event: AutomationRequestReceivedEvent): Promise<void>;
    /**
     * Initialize all server adapters
     */
    private initializeAdapters;
    /**
     * Start the HTTP server component
     */
    private startHttpServer;
    /**
     * Start the WebSocket server component
     */
    private startWebSocketServer;
    /**
     * Stop the HTTP server component
     */
    private stopHttpServer;
    /**
     * Stop the WebSocket server component
     */
    private stopWebSocketServer;
    /**
     * Shutdown all adapters gracefully
     */
    private shutdownAdapters;
    /**
     * Get health status of all components
     */
    private getComponentHealth;
    /**
     * Get active WebSocket connection count
     */
    private getActiveConnectionCount;
    /**
     * Get total request count
     */
    private getRequestCount;
    /**
     * Get total error count
     */
    private getErrorCount;
    /**
     * Check if the server is currently running
     */
    isServerRunning(): boolean;
    /**
     * Get server uptime in milliseconds
     */
    getUptime(): number;
    /**
     * Get server configuration
     */
    getConfiguration(): Record<string, any>;
}
//# sourceMappingURL=server-application.d.ts.map