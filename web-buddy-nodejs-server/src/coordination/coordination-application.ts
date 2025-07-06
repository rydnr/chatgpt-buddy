/**
 * @fileoverview Coordination application for managing browser extension communication
 * @description Handles routing, session management, and extension lifecycle coordination
 * @author Web-Buddy Team
 */

import { Application, Enable, listen } from '../stubs/typescript-eda-stubs';
import {
  ExtensionConnectedEvent,
  ExtensionDisconnectedEvent,
  AutomationRequestReceivedEvent,
  AutomationRequestRoutedEvent,
  AutomationResponseReceivedEvent,
  AutomationRequestFailedEvent,
  CoordinationSessionStartedEvent,
  CoordinationSessionEndedEvent,
  ExtensionHeartbeatReceivedEvent,
  ExtensionHeartbeatMissedEvent,
  CoordinationErrorEvent,
  CoordinationMetricsUpdatedEvent,
  RoutingDecision,
  AutomationResponse,
  SessionStatistics
} from '../core/events/coordination-events';
import { WebSocketServerAdapter } from './adapters/websocket-server-adapter';
import { ExtensionManagerAdapter } from './adapters/extension-manager-adapter';
import { SessionManagerAdapter } from './adapters/session-manager-adapter';

/**
 * Coordination application that manages browser extension communication
 * Uses TypeScript-EDA patterns for event-driven coordination and routing
 */
@Enable(WebSocketServerAdapter)
@Enable(ExtensionManagerAdapter)
@Enable(SessionManagerAdapter)
export class CoordinationApplication extends Application {
  public readonly metadata = new Map([
    ['name', 'Web-Buddy Coordination Engine'],
    ['version', '1.0.0'],
    ['capabilities', 'extension-routing,session-management,load-balancing'],
    ['maxConcurrentSessions', '100'],
    ['heartbeatInterval', '30000'] // 30 seconds
  ]);

  private activeExtensions = new Map<string, ExtensionInfo>();
  private activeSessions = new Map<string, SessionInfo>();
  private pendingRequests = new Map<string, PendingRequest>();
  private routingStats = new Map<string, RoutingStats>();

  /**
   * Handle browser extension connection
   */
  @listen(ExtensionConnectedEvent)
  public async handleExtensionConnected(event: ExtensionConnectedEvent): Promise<void> {
    console.log(`🔌 Extension connected: ${event.extensionId}`);

    // Register the extension
    const extensionInfo: ExtensionInfo = {
      id: event.extensionId,
      metadata: event.metadata,
      connectionInfo: event.connectionInfo,
      status: 'connected',
      lastSeen: new Date(),
      activeRequests: 0,
      statistics: {
        requestsProcessed: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        connectionTime: new Date()
      }
    };

    this.activeExtensions.set(event.extensionId, extensionInfo);

    // Update coordination metrics
    await this.updateCoordinationMetrics();

    console.log(`✅ Extension ${event.extensionId} registered successfully`);
    console.log(`📊 Active extensions: ${this.activeExtensions.size}`);
  }

  /**
   * Handle browser extension disconnection
   */
  @listen(ExtensionDisconnectedEvent)
  public async handleExtensionDisconnected(event: ExtensionDisconnectedEvent): Promise<void> {
    console.log(`🔌 Extension disconnected: ${event.extensionId}`);
    
    const extensionInfo = this.activeExtensions.get(event.extensionId);
    if (extensionInfo) {
      // Handle any pending requests for this extension
      await this.handleExtensionFailover(event.extensionId);
      
      // Remove from active extensions
      this.activeExtensions.delete(event.extensionId);
      
      console.log(`📊 Extension session stats:`, {
        duration: event.sessionDuration,
        requestsProcessed: extensionInfo.statistics.requestsProcessed,
        successRate: extensionInfo.statistics.successfulRequests / extensionInfo.statistics.requestsProcessed
      });
    }

    // Update coordination metrics
    await this.updateCoordinationMetrics();
    
    console.log(`📊 Active extensions: ${this.activeExtensions.size}`);
  }

  /**
   * Handle automation request from external clients
   */
  @listen(AutomationRequestReceivedEvent)
  public async handleAutomationRequest(event: AutomationRequestReceivedEvent): Promise<void> {
    console.log(`🤖 Processing automation request: ${event.requestId}`);
    console.log(`🎯 Target: Extension ${event.targetExtensionId}, Tab ${event.targetTabId}`);

    try {
      // Find the best extension to handle this request
      const routingDecision = await this.routeAutomationRequest(event);
      
      if (!routingDecision) {
        throw new Error('No suitable extension found for automation request');
      }

      // Store the pending request
      const pendingRequest: PendingRequest = {
        requestId: event.requestId,
        clientId: event.clientId,
        extensionId: routingDecision.selectedExtension,
        timestamp: new Date(),
        payload: event.automationPayload,
        retryCount: 0
      };

      this.pendingRequests.set(event.requestId, pendingRequest);

      // Route the request to the selected extension
      console.log(`🚀 Routing request ${event.requestId} to extension ${routingDecision.selectedExtension}`);
      console.log(`📋 Routing reason: ${routingDecision.reason} (confidence: ${routingDecision.confidence})`);

      // Update extension statistics
      const extensionInfo = this.activeExtensions.get(routingDecision.selectedExtension);
      if (extensionInfo) {
        extensionInfo.activeRequests++;
        extensionInfo.lastSeen = new Date();
      }

      // In a real implementation, this would send the message via WebSocket
      // For now, we emit the routing event for logging/monitoring
      // await this.emit(new AutomationRequestRoutedEvent(event.requestId, routingDecision.selectedExtension, routingDecision));

    } catch (error) {
      console.error(`❌ Failed to process automation request ${event.requestId}:`, error);
      
      // Emit failure event
      // await this.emit(new AutomationRequestFailedEvent(event.requestId, event.targetExtensionId, {
      //   code: 'ROUTING_FAILED',
      //   message: error.message,
      //   recoverable: true,
      //   suggestions: ['Check extension availability', 'Retry request']
      // }, 0));
    }
  }

  /**
   * Handle automation response from extension
   */
  @listen(AutomationResponseReceivedEvent)
  public async handleAutomationResponse(event: AutomationResponseReceivedEvent): Promise<void> {
    console.log(`📨 Automation response received: ${event.requestId}`);
    
    const pendingRequest = this.pendingRequests.get(event.requestId);
    if (!pendingRequest) {
      console.warn(`⚠️ No pending request found for ${event.requestId}`);
      return;
    }

    // Update extension statistics
    const extensionInfo = this.activeExtensions.get(event.extensionId);
    if (extensionInfo) {
      extensionInfo.activeRequests = Math.max(0, extensionInfo.activeRequests - 1);
      extensionInfo.statistics.requestsProcessed++;
      
      if (event.response.success) {
        extensionInfo.statistics.successfulRequests++;
      } else {
        extensionInfo.statistics.failedRequests++;
      }
      
      // Update average response time
      const totalRequests = extensionInfo.statistics.requestsProcessed;
      const currentAvg = extensionInfo.statistics.averageResponseTime;
      extensionInfo.statistics.averageResponseTime = 
        ((currentAvg * (totalRequests - 1)) + event.executionTime) / totalRequests;
    }

    // Remove from pending requests
    this.pendingRequests.delete(event.requestId);

    // Log response details
    console.log(`📊 Request ${event.requestId} completed:`, {
      success: event.response.success,
      executionTime: event.executionTime,
      extensionId: event.extensionId
    });

    // Update coordination metrics
    await this.updateCoordinationMetrics();
  }

  /**
   * Handle extension heartbeat
   */
  @listen(ExtensionHeartbeatReceivedEvent)
  public async handleExtensionHeartbeat(event: ExtensionHeartbeatReceivedEvent): Promise<void> {
    const extensionInfo = this.activeExtensions.get(event.extensionId);
    if (extensionInfo) {
      extensionInfo.lastSeen = new Date();
      extensionInfo.status = event.status.isHealthy ? 'connected' : 'unhealthy';
      
      console.log(`💓 Heartbeat from ${event.extensionId}: ${event.status.isHealthy ? 'healthy' : 'unhealthy'}`);
    }
  }

  /**
   * Handle missed extension heartbeat
   */
  @listen(ExtensionHeartbeatMissedEvent)
  public async handleExtensionHeartbeatMissed(event: ExtensionHeartbeatMissedEvent): Promise<void> {
    console.warn(`💔 Missed heartbeat from ${event.extensionId} (${event.missedCount} missed)`);
    
    const extensionInfo = this.activeExtensions.get(event.extensionId);
    if (extensionInfo) {
      extensionInfo.status = 'disconnected';
      
      // If too many heartbeats missed, consider extension disconnected
      if (event.missedCount >= 3) {
        console.warn(`🚨 Extension ${event.extensionId} considered disconnected after ${event.missedCount} missed heartbeats`);
        await this.handleExtensionFailover(event.extensionId);
        this.activeExtensions.delete(event.extensionId);
      }
    }
  }

  /**
   * Route automation request to the best available extension
   */
  private async routeAutomationRequest(event: AutomationRequestReceivedEvent): Promise<RoutingDecision | null> {
    const availableExtensions = Array.from(this.activeExtensions.values())
      .filter(ext => ext.status === 'connected');

    if (availableExtensions.length === 0) {
      return null;
    }

    // Specific extension requested
    if (event.targetExtensionId) {
      const specificExtension = availableExtensions.find(ext => ext.id === event.targetExtensionId);
      if (specificExtension) {
        return {
          selectedExtension: event.targetExtensionId,
          reason: 'exact_match',
          alternatives: availableExtensions.filter(ext => ext.id !== event.targetExtensionId).map(ext => ext.id),
          confidence: 1.0
        };
      }
    }

    // Find extension with best capabilities for this request
    const bestExtension = this.findBestExtensionForRequest(availableExtensions, event.automationPayload);
    
    return {
      selectedExtension: bestExtension.id,
      reason: 'best_capability',
      alternatives: availableExtensions.filter(ext => ext.id !== bestExtension.id).map(ext => ext.id),
      confidence: 0.8
    };
  }

  /**
   * Find the best extension for handling a specific automation request
   */
  private findBestExtensionForRequest(extensions: ExtensionInfo[], payload: any): ExtensionInfo {
    // Simple load balancing for now - choose extension with fewest active requests
    return extensions.reduce((best, current) => 
      current.activeRequests < best.activeRequests ? current : best
    );
  }

  /**
   * Handle failover when an extension disconnects unexpectedly
   */
  private async handleExtensionFailover(extensionId: string): Promise<void> {
    const failedRequests = Array.from(this.pendingRequests.values())
      .filter(req => req.extensionId === extensionId);

    console.log(`🔄 Handling failover for ${failedRequests.length} pending requests from ${extensionId}`);

    for (const request of failedRequests) {
      // Try to reroute to another extension
      const availableExtensions = Array.from(this.activeExtensions.values())
        .filter(ext => ext.status === 'connected' && ext.id !== extensionId);

      if (availableExtensions.length > 0) {
        const fallbackExtension = this.findBestExtensionForRequest(availableExtensions, request.payload);
        
        console.log(`🔄 Rerouting request ${request.requestId} from ${extensionId} to ${fallbackExtension.id}`);
        
        // Update the pending request
        request.extensionId = fallbackExtension.id;
        request.retryCount++;
        
        // In real implementation, would send to the new extension via WebSocket
      } else {
        // No fallback available - fail the request
        console.error(`❌ No fallback extension available for request ${request.requestId}`);
        this.pendingRequests.delete(request.requestId);
      }
    }
  }

  /**
   * Update coordination metrics
   */
  private async updateCoordinationMetrics(): Promise<void> {
    const now = new Date();
    const metrics = {
      activeExtensions: this.activeExtensions.size,
      activeSessions: this.activeSessions.size,
      requestsPerSecond: this.calculateRequestsPerSecond(),
      averageResponseTime: this.calculateAverageResponseTime(),
      errorRate: this.calculateErrorRate(),
      throughput: this.calculateThroughput(),
      timestamp: now
    };

    // In real implementation, would emit metrics event
    // await this.emit(new CoordinationMetricsUpdatedEvent(metrics, 'realtime'));
  }

  /**
   * Calculate current requests per second
   */
  private calculateRequestsPerSecond(): number {
    // Implementation would track requests over time windows
    return 0;
  }

  /**
   * Calculate average response time across all extensions
   */
  private calculateAverageResponseTime(): number {
    const extensions = Array.from(this.activeExtensions.values());
    if (extensions.length === 0) return 0;

    const totalTime = extensions.reduce((sum, ext) => sum + ext.statistics.averageResponseTime, 0);
    return totalTime / extensions.length;
  }

  /**
   * Calculate overall error rate
   */
  private calculateErrorRate(): number {
    const extensions = Array.from(this.activeExtensions.values());
    if (extensions.length === 0) return 0;

    const totalRequests = extensions.reduce((sum, ext) => sum + ext.statistics.requestsProcessed, 0);
    const totalErrors = extensions.reduce((sum, ext) => sum + ext.statistics.failedRequests, 0);

    return totalRequests > 0 ? totalErrors / totalRequests : 0;
  }

  /**
   * Calculate current throughput
   */
  private calculateThroughput(): number {
    // Implementation would calculate actual throughput metrics
    return 0;
  }

  /**
   * Get coordination status
   */
  public getCoordinationStatus(): CoordinationStatus {
    return {
      activeExtensions: this.activeExtensions.size,
      activeSessions: this.activeSessions.size,
      pendingRequests: this.pendingRequests.size,
      isHealthy: this.activeExtensions.size > 0,
      lastUpdate: new Date()
    };
  }

  /**
   * Get extension status by ID
   */
  public getExtensionStatus(extensionId: string): ExtensionInfo | null {
    return this.activeExtensions.get(extensionId) || null;
  }

  /**
   * Get all active extensions
   */
  public getActiveExtensions(): ExtensionInfo[] {
    return Array.from(this.activeExtensions.values());
  }
}

// Supporting interfaces

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

interface SessionInfo {
  sessionId: string;
  clientId: string;
  startTime: Date;
  lastActivity: Date;
  requestCount: number;
}

interface PendingRequest {
  requestId: string;
  clientId: string;
  extensionId: string;
  timestamp: Date;
  payload: any;
  retryCount: number;
}

interface RoutingStats {
  extensionId: string;
  requestsRouted: number;
  successRate: number;
  averageResponseTime: number;
}

interface CoordinationStatus {
  activeExtensions: number;
  activeSessions: number;
  pendingRequests: number;
  isHealthy: boolean;
  lastUpdate: Date;
}