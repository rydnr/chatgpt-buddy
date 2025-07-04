/**
 * @fileoverview Coordination events for managing browser extension communication
 * @description Events for extension lifecycle, automation requests, and session management
 * @author Web-Buddy Team
 */

import { Event } from '@typescript-eda/domain';

/**
 * Event triggered when a browser extension connects to the server
 */
export class ExtensionConnectedEvent extends Event {
  public readonly type = 'ExtensionConnected';
  
  constructor(
    public readonly extensionId: string,
    public readonly metadata: ExtensionMetadata,
    public readonly connectionInfo: ConnectionInfo
  ) {
    super();
  }
}

/**
 * Event triggered when a browser extension disconnects from the server
 */
export class ExtensionDisconnectedEvent extends Event {
  public readonly type = 'ExtensionDisconnected';
  
  constructor(
    public readonly extensionId: string,
    public readonly reason: DisconnectionReason,
    public readonly sessionDuration: number
  ) {
    super();
  }
}

/**
 * Event triggered when an automation request is received from external clients
 */
export class AutomationRequestReceivedEvent extends Event {
  public readonly type = 'AutomationRequestReceived';
  
  constructor(
    public readonly requestId: string,
    public readonly clientId: string,
    public readonly targetExtensionId: string,
    public readonly targetTabId: number,
    public readonly automationPayload: AutomationPayload
  ) {
    super();
  }
}

/**
 * Event triggered when automation request is routed to an extension
 */
export class AutomationRequestRoutedEvent extends Event {
  public readonly type = 'AutomationRequestRouted';
  
  constructor(
    public readonly requestId: string,
    public readonly extensionId: string,
    public readonly routingDecision: RoutingDecision
  ) {
    super();
  }
}

/**
 * Event triggered when automation response is received from extension
 */
export class AutomationResponseReceivedEvent extends Event {
  public readonly type = 'AutomationResponseReceived';
  
  constructor(
    public readonly requestId: string,
    public readonly extensionId: string,
    public readonly response: AutomationResponse,
    public readonly executionTime: number
  ) {
    super();
  }
}

/**
 * Event triggered when automation request fails to be delivered
 */
export class AutomationRequestFailedEvent extends Event {
  public readonly type = 'AutomationRequestFailed';
  
  constructor(
    public readonly requestId: string,
    public readonly extensionId: string,
    public readonly error: AutomationError,
    public readonly retryAttempt: number
  ) {
    super();
  }
}

/**
 * Event triggered when a new coordination session is started
 */
export class CoordinationSessionStartedEvent extends Event {
  public readonly type = 'CoordinationSessionStarted';
  
  constructor(
    public readonly sessionId: string,
    public readonly clientId: string,
    public readonly sessionType: SessionType,
    public readonly configuration: SessionConfiguration
  ) {
    super();
  }
}

/**
 * Event triggered when a coordination session ends
 */
export class CoordinationSessionEndedEvent extends Event {
  public readonly type = 'CoordinationSessionEnded';
  
  constructor(
    public readonly sessionId: string,
    public readonly duration: number,
    public readonly statistics: SessionStatistics,
    public readonly reason: SessionEndReason
  ) {
    super();
  }
}

/**
 * Event triggered when extension heartbeat is received
 */
export class ExtensionHeartbeatReceivedEvent extends Event {
  public readonly type = 'ExtensionHeartbeatReceived';
  
  constructor(
    public readonly extensionId: string,
    public readonly status: ExtensionStatus,
    public readonly metrics: ExtensionMetrics
  ) {
    super();
  }
}

/**
 * Event triggered when extension heartbeat is missed
 */
export class ExtensionHeartbeatMissedEvent extends Event {
  public readonly type = 'ExtensionHeartbeatMissed';
  
  constructor(
    public readonly extensionId: string,
    public readonly missedCount: number,
    public readonly lastSeen: Date
  ) {
    super();
  }
}

/**
 * Event triggered when coordination error occurs
 */
export class CoordinationErrorEvent extends Event {
  public readonly type = 'CoordinationError';
  
  constructor(
    public readonly error: Error,
    public readonly context: CoordinationContext,
    public readonly recovery?: RecoveryAction
  ) {
    super();
  }
}

/**
 * Event triggered when coordination metrics are updated
 */
export class CoordinationMetricsUpdatedEvent extends Event {
  public readonly type = 'CoordinationMetricsUpdated';
  
  constructor(
    public readonly metrics: CoordinationMetrics,
    public readonly updateType: MetricsUpdateType
  ) {
    super();
  }
}

// Supporting types

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

export type DisconnectionReason = 
  | 'client_initiated'
  | 'server_shutdown'
  | 'connection_timeout'
  | 'authentication_failed'
  | 'protocol_error'
  | 'rate_limit_exceeded';

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

export type RoutingReason = 
  | 'exact_match'
  | 'best_capability'
  | 'load_balancing'
  | 'fallback'
  | 'user_preference';

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

export type SessionType = 
  | 'automation'
  | 'training'
  | 'monitoring'
  | 'debugging'
  | 'pattern_sharing';

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

export type SessionEndReason = 
  | 'completed'
  | 'timeout'
  | 'client_disconnect'
  | 'server_shutdown'
  | 'error'
  | 'user_terminated';

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

export type RecoveryType = 
  | 'retry'
  | 'fallback'
  | 'circuit_breaker'
  | 'graceful_degradation'
  | 'user_intervention';

export interface CoordinationMetrics {
  activeExtensions: number;
  activeSessions: number;
  requestsPerSecond: number;
  averageResponseTime: number;
  errorRate: number;
  throughput: number;
  timestamp: Date;
}

export type MetricsUpdateType = 
  | 'realtime'
  | 'periodic'
  | 'on_demand'
  | 'threshold_triggered';