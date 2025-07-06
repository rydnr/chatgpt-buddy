/**
 * @fileoverview Coordination events for managing browser extension communication
 * @description Events for extension lifecycle, automation requests, and session management
 * @author Web-Buddy Team
 */
import { Event } from '../../stubs/typescript-eda-stubs';
/**
 * Event triggered when a browser extension connects to the server
 */
export declare class ExtensionConnectedEvent extends Event {
    readonly extensionId: string;
    readonly metadata: ExtensionMetadata;
    readonly connectionInfo: ConnectionInfo;
    readonly type = "ExtensionConnected";
    constructor(extensionId: string, metadata: ExtensionMetadata, connectionInfo: ConnectionInfo);
}
/**
 * Event triggered when a browser extension disconnects from the server
 */
export declare class ExtensionDisconnectedEvent extends Event {
    readonly extensionId: string;
    readonly reason: DisconnectionReason;
    readonly sessionDuration: number;
    readonly type = "ExtensionDisconnected";
    constructor(extensionId: string, reason: DisconnectionReason, sessionDuration: number);
}
/**
 * Event triggered when an automation request is received from external clients
 */
export declare class AutomationRequestReceivedEvent extends Event {
    readonly requestId: string;
    readonly clientId: string;
    readonly targetExtensionId: string;
    readonly targetTabId: number;
    readonly automationPayload: AutomationPayload;
    readonly type = "AutomationRequestReceived";
    constructor(requestId: string, clientId: string, targetExtensionId: string, targetTabId: number, automationPayload: AutomationPayload);
}
/**
 * Event triggered when automation request is routed to an extension
 */
export declare class AutomationRequestRoutedEvent extends Event {
    readonly requestId: string;
    readonly extensionId: string;
    readonly routingDecision: RoutingDecision;
    readonly type = "AutomationRequestRouted";
    constructor(requestId: string, extensionId: string, routingDecision: RoutingDecision);
}
/**
 * Event triggered when automation response is received from extension
 */
export declare class AutomationResponseReceivedEvent extends Event {
    readonly requestId: string;
    readonly extensionId: string;
    readonly response: AutomationResponse;
    readonly executionTime: number;
    readonly type = "AutomationResponseReceived";
    constructor(requestId: string, extensionId: string, response: AutomationResponse, executionTime: number);
}
/**
 * Event triggered when automation request fails to be delivered
 */
export declare class AutomationRequestFailedEvent extends Event {
    readonly requestId: string;
    readonly extensionId: string;
    readonly error: AutomationError;
    readonly retryAttempt: number;
    readonly type = "AutomationRequestFailed";
    constructor(requestId: string, extensionId: string, error: AutomationError, retryAttempt: number);
}
/**
 * Event triggered when a new coordination session is started
 */
export declare class CoordinationSessionStartedEvent extends Event {
    readonly sessionId: string;
    readonly clientId: string;
    readonly sessionType: SessionType;
    readonly configuration: SessionConfiguration;
    readonly type = "CoordinationSessionStarted";
    constructor(sessionId: string, clientId: string, sessionType: SessionType, configuration: SessionConfiguration);
}
/**
 * Event triggered when a coordination session ends
 */
export declare class CoordinationSessionEndedEvent extends Event {
    readonly sessionId: string;
    readonly duration: number;
    readonly statistics: SessionStatistics;
    readonly reason: SessionEndReason;
    readonly type = "CoordinationSessionEnded";
    constructor(sessionId: string, duration: number, statistics: SessionStatistics, reason: SessionEndReason);
}
/**
 * Event triggered when extension heartbeat is received
 */
export declare class ExtensionHeartbeatReceivedEvent extends Event {
    readonly extensionId: string;
    readonly status: ExtensionStatus;
    readonly metrics: ExtensionMetrics;
    readonly type = "ExtensionHeartbeatReceived";
    constructor(extensionId: string, status: ExtensionStatus, metrics: ExtensionMetrics);
}
/**
 * Event triggered when extension heartbeat is missed
 */
export declare class ExtensionHeartbeatMissedEvent extends Event {
    readonly extensionId: string;
    readonly missedCount: number;
    readonly lastSeen: Date;
    readonly type = "ExtensionHeartbeatMissed";
    constructor(extensionId: string, missedCount: number, lastSeen: Date);
}
/**
 * Event triggered when coordination error occurs
 */
export declare class CoordinationErrorEvent extends Event {
    readonly error: Error;
    readonly context: CoordinationContext;
    readonly recovery?: RecoveryAction | undefined;
    readonly type = "CoordinationError";
    constructor(error: Error, context: CoordinationContext, recovery?: RecoveryAction | undefined);
}
/**
 * Event triggered when coordination metrics are updated
 */
export declare class CoordinationMetricsUpdatedEvent extends Event {
    readonly metrics: CoordinationMetrics;
    readonly updateType: MetricsUpdateType;
    readonly type = "CoordinationMetricsUpdated";
    constructor(metrics: CoordinationMetrics, updateType: MetricsUpdateType);
}
export interface ExtensionMetadata {
    version: string;
    name: string;
    capabilities: string[];
    browserInfo: BrowserInfo;
    permissions: string[];
    lastSeen: Date;
}
export interface BrowserInfo {
    name: string;
    version: string;
    userAgent: string;
    platform: string;
}
export interface ConnectionInfo {
    ipAddress: string;
    userAgent: string;
    timestamp: Date;
    protocol: 'websocket' | 'http';
    secure: boolean;
}
export type DisconnectionReason = 'client_initiated' | 'server_shutdown' | 'connection_timeout' | 'authentication_failed' | 'protocol_error' | 'rate_limit_exceeded';
export interface AutomationPayload {
    action: string;
    target: AutomationTarget;
    parameters: Record<string, any>;
    options: AutomationOptions;
}
export interface AutomationTarget {
    selector?: string;
    xpath?: string;
    semanticDescription?: string;
    elementId?: string;
    frameId?: number;
}
export interface AutomationOptions {
    timeout: number;
    retries: number;
    waitForElement: boolean;
    scrollIntoView: boolean;
    highlightElement: boolean;
}
export interface RoutingDecision {
    selectedExtension: string;
    reason: RoutingReason;
    alternatives: string[];
    confidence: number;
}
export type RoutingReason = 'exact_match' | 'best_capability' | 'load_balancing' | 'fallback' | 'user_preference';
export interface AutomationResponse {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    metadata: ResponseMetadata;
}
export interface ResponseMetadata {
    tabId: number;
    url: string;
    title: string;
    timestamp: Date;
    screenshotPath?: string;
    elementsFound: number;
}
export interface AutomationError {
    code: string;
    message: string;
    details?: any;
    recoverable: boolean;
    suggestions: string[];
}
export type SessionType = 'automation' | 'training' | 'monitoring' | 'debugging' | 'pattern_sharing';
export interface SessionConfiguration {
    timeout: number;
    maxRequests: number;
    enableLogging: boolean;
    enableMetrics: boolean;
    securityLevel: SecurityLevel;
}
export type SecurityLevel = 'low' | 'medium' | 'high';
export interface SessionStatistics {
    requestsProcessed: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    totalDataTransferred: number;
    errorsEncountered: ErrorSummary[];
}
export interface ErrorSummary {
    code: string;
    count: number;
    lastOccurrence: Date;
}
export type SessionEndReason = 'completed' | 'timeout' | 'client_disconnect' | 'server_shutdown' | 'error' | 'user_terminated';
export interface ExtensionStatus {
    isHealthy: boolean;
    activeConnections: number;
    lastActivity: Date;
    resourceUsage: ResourceUsage;
    activePatterns: number;
}
export interface ResourceUsage {
    cpuPercent: number;
    memoryMB: number;
    networkKBps: number;
    activeTabs: number;
}
export interface ExtensionMetrics {
    requestsProcessed: number;
    averageResponseTime: number;
    errorRate: number;
    uptimeMinutes: number;
    patternExecutions: number;
}
export interface CoordinationContext {
    extensionId?: string;
    sessionId?: string;
    requestId?: string;
    operation: string;
    timestamp: Date;
}
export interface RecoveryAction {
    type: RecoveryType;
    description: string;
    automatic: boolean;
    parameters?: Record<string, any>;
}
export type RecoveryType = 'retry' | 'fallback' | 'circuit_breaker' | 'graceful_degradation' | 'user_intervention';
export interface CoordinationMetrics {
    activeExtensions: number;
    activeSessions: number;
    requestsPerSecond: number;
    averageResponseTime: number;
    errorRate: number;
    throughput: number;
    timestamp: Date;
}
export type MetricsUpdateType = 'realtime' | 'periodic' | 'on_demand' | 'threshold_triggered';
//# sourceMappingURL=coordination-events.d.ts.map