/**
 * @fileoverview Server lifecycle and management events
 * @description Core events for server startup, shutdown, health checks, and monitoring
 * @author Web-Buddy Team
 */
import { Event } from '../../stubs/typescript-eda-stubs';
/**
 * Event triggered when server startup is requested
 */
export declare class ServerStartRequestedEvent extends Event {
    readonly port: number;
    readonly configuration?: ServerConfiguration | undefined;
    readonly type = "ServerStartRequested";
    constructor(port: number, configuration?: ServerConfiguration | undefined);
}
/**
 * Event triggered when server shutdown is requested
 */
export declare class ServerStopRequestedEvent extends Event {
    readonly reason?: string | undefined;
    readonly gracefulShutdown: boolean;
    readonly type = "ServerStopRequested";
    constructor(reason?: string | undefined, gracefulShutdown?: boolean);
}
/**
 * Event triggered when server health check is requested
 */
export declare class ServerHealthCheckRequestedEvent extends Event {
    readonly requestId: string;
    readonly includeDetails: boolean;
    readonly type = "ServerHealthCheckRequested";
    constructor(requestId: string, includeDetails?: boolean);
}
/**
 * Event triggered when server metrics are requested
 */
export declare class ServerMetricsRequestedEvent extends Event {
    readonly requestId: string;
    readonly metricsType: MetricsType;
    readonly type = "ServerMetricsRequested";
    constructor(requestId: string, metricsType?: MetricsType);
}
/**
 * Event triggered when server successfully starts
 */
export declare class ServerStartedEvent extends Event {
    readonly port: number;
    readonly startTime: Date;
    readonly processId: number;
    readonly type = "ServerStarted";
    constructor(port: number, startTime: Date, processId: number);
}
/**
 * Event triggered when server successfully stops
 */
export declare class ServerStoppedEvent extends Event {
    readonly shutdownTime: Date;
    readonly uptime: number;
    readonly reason?: string | undefined;
    readonly type = "ServerStopped";
    constructor(shutdownTime: Date, uptime: number, reason?: string | undefined);
}
/**
 * Event triggered when server encounters an error
 */
export declare class ServerErrorEvent extends Event {
    readonly error: Error;
    readonly component: string;
    readonly severity: ErrorSeverity;
    readonly type = "ServerError";
    constructor(error: Error, component: string, severity?: ErrorSeverity);
}
/**
 * Event triggered when server configuration changes
 */
export declare class ServerConfigurationChangedEvent extends Event {
    readonly previousConfiguration: ServerConfiguration;
    readonly newConfiguration: ServerConfiguration;
    readonly changedFields: string[];
    readonly type = "ServerConfigurationChanged";
    constructor(previousConfiguration: ServerConfiguration, newConfiguration: ServerConfiguration, changedFields: string[]);
}
/**
 * Event triggered when server performance warning occurs
 */
export declare class ServerPerformanceWarningEvent extends Event {
    readonly metric: PerformanceMetric;
    readonly threshold: number;
    readonly currentValue: number;
    readonly recommendation?: string | undefined;
    readonly type = "ServerPerformanceWarning";
    constructor(metric: PerformanceMetric, threshold: number, currentValue: number, recommendation?: string | undefined);
}
/**
 * Event triggered when server security alert occurs
 */
export declare class ServerSecurityAlertEvent extends Event {
    readonly alertType: SecurityAlertType;
    readonly description: string;
    readonly sourceIP?: string | undefined;
    readonly severity: SecuritySeverity;
    readonly type = "ServerSecurityAlert";
    constructor(alertType: SecurityAlertType, description: string, sourceIP?: string | undefined, severity?: SecuritySeverity);
}
export interface ServerConfiguration {
    port: number;
    host: string;
    environment: 'development' | 'staging' | 'production';
    logging: LoggingConfiguration;
    security: SecurityConfiguration;
    performance: PerformanceConfiguration;
    features: FeatureConfiguration;
}
export interface LoggingConfiguration {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destinations: string[];
    enableRequestLogging: boolean;
    enableErrorTracking: boolean;
}
export interface SecurityConfiguration {
    enableHTTPS: boolean;
    corsOrigins: string[];
    rateLimiting: RateLimitConfiguration;
    authentication: AuthenticationConfiguration;
    headers: SecurityHeadersConfiguration;
}
export interface RateLimitConfiguration {
    enabled: boolean;
    windowMs: number;
    maxRequests: number;
    skipSuccessfulRequests: boolean;
}
export interface AuthenticationConfiguration {
    enabled: boolean;
    method: 'jwt' | 'apikey' | 'oauth';
    jwtSecret?: string;
    tokenExpiration?: number;
}
export interface SecurityHeadersConfiguration {
    enableHelmet: boolean;
    contentSecurityPolicy: boolean;
    xssProtection: boolean;
    frameOptions: boolean;
}
export interface PerformanceConfiguration {
    enableCompression: boolean;
    enableCaching: boolean;
    maxRequestSize: string;
    requestTimeout: number;
    keepAliveTimeout: number;
}
export interface FeatureConfiguration {
    enableWebSocket: boolean;
    enableFileUploads: boolean;
    enableExtensionManagement: boolean;
    enablePatternSharing: boolean;
    enableAnalytics: boolean;
}
export type MetricsType = 'all' | 'performance' | 'health' | 'usage' | 'errors';
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type PerformanceMetric = 'cpu_usage' | 'memory_usage' | 'response_time' | 'request_rate' | 'error_rate' | 'active_connections';
export type SecurityAlertType = 'rate_limit_exceeded' | 'unauthorized_access' | 'suspicious_activity' | 'malformed_request' | 'injection_attempt' | 'ddos_attempt';
export type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';
//# sourceMappingURL=server-events.d.ts.map