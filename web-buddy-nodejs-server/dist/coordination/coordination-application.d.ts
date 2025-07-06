/**
 * @fileoverview Coordination application for managing browser extension communication
 * @description Handles routing, session management, and extension lifecycle coordination
 * @author Web-Buddy Team
 */
import { Application } from '../stubs/typescript-eda-stubs';
import { ExtensionConnectedEvent, ExtensionDisconnectedEvent, AutomationRequestReceivedEvent, AutomationResponseReceivedEvent, ExtensionHeartbeatReceivedEvent, ExtensionHeartbeatMissedEvent } from '../core/events/coordination-events';
/**
 * Coordination application that manages browser extension communication
 * Uses TypeScript-EDA patterns for event-driven coordination and routing
 */
export declare class CoordinationApplication extends Application {
    readonly metadata: Map<string, string>;
    private activeExtensions;
    private activeSessions;
    private pendingRequests;
    private routingStats;
    /**
     * Handle browser extension connection
     */
    handleExtensionConnected(event: ExtensionConnectedEvent): Promise<void>;
    /**
     * Handle browser extension disconnection
     */
    handleExtensionDisconnected(event: ExtensionDisconnectedEvent): Promise<void>;
    /**
     * Handle automation request from external clients
     */
    handleAutomationRequest(event: AutomationRequestReceivedEvent): Promise<void>;
    /**
     * Handle automation response from extension
     */
    handleAutomationResponse(event: AutomationResponseReceivedEvent): Promise<void>;
    /**
     * Handle extension heartbeat
     */
    handleExtensionHeartbeat(event: ExtensionHeartbeatReceivedEvent): Promise<void>;
    /**
     * Handle missed extension heartbeat
     */
    handleExtensionHeartbeatMissed(event: ExtensionHeartbeatMissedEvent): Promise<void>;
    /**
     * Route automation request to the best available extension
     */
    private routeAutomationRequest;
    /**
     * Find the best extension for handling a specific automation request
     */
    private findBestExtensionForRequest;
    /**
     * Handle failover when an extension disconnects unexpectedly
     */
    private handleExtensionFailover;
    /**
     * Update coordination metrics
     */
    private updateCoordinationMetrics;
    /**
     * Calculate current requests per second
     */
    private calculateRequestsPerSecond;
    /**
     * Calculate average response time across all extensions
     */
    private calculateAverageResponseTime;
    /**
     * Calculate overall error rate
     */
    private calculateErrorRate;
    /**
     * Calculate current throughput
     */
    private calculateThroughput;
    /**
     * Get coordination status
     */
    getCoordinationStatus(): CoordinationStatus;
    /**
     * Get extension status by ID
     */
    getExtensionStatus(extensionId: string): ExtensionInfo | null;
    /**
     * Get all active extensions
     */
    getActiveExtensions(): ExtensionInfo[];
}
interface ExtensionInfo {
    id: string;
    metadata: any;
    connectionInfo: any;
    status: 'connected' | 'disconnected' | 'unhealthy';
    lastSeen: Date;
    activeRequests: number;
    statistics: ExtensionStatistics;
}
interface ExtensionStatistics {
    requestsProcessed: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    connectionTime: Date;
}
interface CoordinationStatus {
    activeExtensions: number;
    activeSessions: number;
    pendingRequests: number;
    isHealthy: boolean;
    lastUpdate: Date;
}
export {};
//# sourceMappingURL=coordination-application.d.ts.map