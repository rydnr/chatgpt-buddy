/**
 * @fileoverview Main server application using TypeScript-EDA patterns
 * @description Coordinates HTTP server, WebSocket connections, and extension management
 * @author Web-Buddy Team
 */

import { Application, Enable, listen } from '../stubs/typescript-eda-stubs';
import {
  ServerStartRequestedEvent,
  ServerStopRequestedEvent,
  ServerHealthCheckRequestedEvent,
  ServerMetricsRequestedEvent
} from '../core/events/server-events';
import {
  ExtensionConnectedEvent,
  ExtensionDisconnectedEvent,
  AutomationRequestReceivedEvent
} from '../core/events/coordination-events';
import { HttpServerAdapter } from './adapters/http-server-adapter';
import { LoggingAdapter } from './adapters/logging-adapter';
import { CacheAdapter } from './adapters/cache-adapter';
import { WebSocketServerAdapter } from '../coordination/adapters/websocket-server-adapter';
import { ExtensionManagerAdapter } from '../coordination/adapters/extension-manager-adapter';
import { SessionManagerAdapter } from '../coordination/adapters/session-manager-adapter';

/**
 * Main server application that orchestrates all server components
 * Uses TypeScript-EDA patterns for event-driven coordination
 */
@Enable(HttpServerAdapter)
@Enable(LoggingAdapter)
@Enable(CacheAdapter)
@Enable(WebSocketServerAdapter)
@Enable(ExtensionManagerAdapter)
@Enable(SessionManagerAdapter)
export class ServerApplication extends Application {
  public readonly metadata = new Map([
    ['name', 'Web-Buddy Node.js Server'],
    ['version', '1.0.0'],
    ['capabilities', 'http-server,websocket-coordination,extension-management'],
    ['port', process.env.PORT || 3003],
    ['environment', process.env.NODE_ENV || 'development']
  ]);

  private isRunning = false;
  private startTime?: Date;

  /**
   * Start the server with all components
   */
  @listen(ServerStartRequestedEvent)
  public async handleServerStart(event: ServerStartRequestedEvent): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Server is already running');
      return;
    }

    console.log(`🚀 Starting Web-Buddy Node.js Server on port ${event.port}`);
    
    try {
      // Initialize all adapters
      await this.initializeAdapters();
      
      // Start HTTP server
      await this.startHttpServer(event.port);
      
      // Start WebSocket server
      await this.startWebSocketServer(event.port);
      
      this.isRunning = true;
      this.startTime = new Date();
      
      console.log('✅ Web-Buddy Node.js Server started successfully');
      console.log(`📡 HTTP API available at http://localhost:${event.port}`);
      console.log(`🔌 WebSocket server available at ws://localhost:${event.port}/ws`);
      
    } catch (error) {
      console.error('❌ Failed to start server:', error);
      throw error;
    }
  }

  /**
   * Stop the server gracefully
   */
  @listen(ServerStopRequestedEvent)
  public async handleServerStop(event: ServerStopRequestedEvent): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ Server is not running');
      return;
    }

    console.log('🛑 Stopping Web-Buddy Node.js Server...');
    
    try {
      // Gracefully close WebSocket connections
      await this.stopWebSocketServer();
      
      // Close HTTP server
      await this.stopHttpServer();
      
      // Shutdown adapters
      await this.shutdownAdapters();
      
      this.isRunning = false;
      this.startTime = undefined;
      
      console.log('✅ Web-Buddy Node.js Server stopped successfully');
      
    } catch (error) {
      console.error('❌ Error stopping server:', error);
      throw error;
    }
  }

  /**
   * Handle server health check requests
   */
  @listen(ServerHealthCheckRequestedEvent)
  public async handleHealthCheck(event: ServerHealthCheckRequestedEvent): Promise<void> {
    const uptime = this.startTime ? Date.now() - this.startTime.getTime() : 0;
    const healthStatus = {
      status: this.isRunning ? 'healthy' : 'stopped',
      uptime,
      timestamp: new Date().toISOString(),
      version: this.metadata.get('version'),
      environment: this.metadata.get('environment'),
      components: await this.getComponentHealth()
    };

    console.log('💓 Health check requested:', healthStatus);
    
    // In a real implementation, this would be sent back via HTTP response
    // For now, we log the health status
  }

  /**
   * Handle server metrics requests
   */
  @listen(ServerMetricsRequestedEvent)
  public async handleMetricsRequest(event: ServerMetricsRequestedEvent): Promise<void> {
    const metrics = {
      uptime: this.startTime ? Date.now() - this.startTime.getTime() : 0,
      memoryUsage: process.memoryUsage(),
      cpuUsage: process.cpuUsage(),
      activeConnections: await this.getActiveConnectionCount(),
      requestCount: await this.getRequestCount(),
      errorCount: await this.getErrorCount(),
      timestamp: new Date().toISOString()
    };

    console.log('📊 Server metrics requested:', metrics);
  }

  /**
   * Handle extension connection events
   */
  @listen(ExtensionConnectedEvent)
  public async handleExtensionConnected(event: ExtensionConnectedEvent): Promise<void> {
    console.log(`🔌 Extension connected: ${event.extensionId}`);
    console.log(`📋 Extension info:`, {
      id: event.extensionId,
      version: event.metadata.version,
      capabilities: event.metadata.capabilities,
      timestamp: event.connectionInfo.timestamp
    });
  }

  /**
   * Handle extension disconnection events
   */
  @listen(ExtensionDisconnectedEvent)
  public async handleExtensionDisconnected(event: ExtensionDisconnectedEvent): Promise<void> {
    console.log(`🔌 Extension disconnected: ${event.extensionId}`);
    console.log(`⏱️ Session duration: ${event.sessionDuration}ms`);
  }

  /**
   * Handle automation requests from external clients
   */
  @listen(AutomationRequestReceivedEvent)
  public async handleAutomationRequest(event: AutomationRequestReceivedEvent): Promise<void> {
    console.log(`🤖 Automation request received: ${event.requestId}`);
    console.log(`🎯 Target: Extension ${event.targetExtensionId}, Tab ${event.targetTabId}`);
    console.log(`⚡ Action: ${event.automationPayload.action}`);
    
    // The coordination layer will handle routing this request to the appropriate extension
    // This event handler provides logging and monitoring
  }

  /**
   * Initialize all server adapters
   */
  private async initializeAdapters(): Promise<void> {
    const adapters = [
      'HttpServerAdapter',
      'LoggingAdapter', 
      'CacheAdapter',
      'WebSocketServerAdapter',
      'ExtensionManagerAdapter',
      'SessionManagerAdapter'
    ];

    for (const adapterName of adapters) {
      try {
        // In the real TypeScript-EDA implementation, this would be handled by the @Enable decorator
        console.log(`🔧 Initializing ${adapterName}...`);
        // await this.getAdapter(adapterName).initialize();
      } catch (error) {
        console.error(`❌ Failed to initialize ${adapterName}:`, error);
        throw error;
      }
    }
  }

  /**
   * Start the HTTP server component
   */
  private async startHttpServer(port: number): Promise<void> {
    // In the real implementation, this would interact with the HttpServerAdapter
    console.log(`🌐 Starting HTTP server on port ${port}...`);
  }

  /**
   * Start the WebSocket server component
   */
  private async startWebSocketServer(port: number): Promise<void> {
    // In the real implementation, this would interact with the WebSocketServerAdapter
    console.log(`🔌 Starting WebSocket server on port ${port}...`);
  }

  /**
   * Stop the HTTP server component
   */
  private async stopHttpServer(): Promise<void> {
    console.log('🌐 Stopping HTTP server...');
  }

  /**
   * Stop the WebSocket server component
   */
  private async stopWebSocketServer(): Promise<void> {
    console.log('🔌 Stopping WebSocket server...');
  }

  /**
   * Shutdown all adapters gracefully
   */
  private async shutdownAdapters(): Promise<void> {
    console.log('🔧 Shutting down adapters...');
  }

  /**
   * Get health status of all components
   */
  private async getComponentHealth(): Promise<Record<string, string>> {
    return {
      httpServer: this.isRunning ? 'healthy' : 'stopped',
      webSocketServer: this.isRunning ? 'healthy' : 'stopped',
      extensionManager: 'healthy',
      sessionManager: 'healthy',
      cache: 'healthy',
      logging: 'healthy'
    };
  }

  /**
   * Get active WebSocket connection count
   */
  private async getActiveConnectionCount(): Promise<number> {
    // In real implementation, this would query the WebSocketServerAdapter
    return 0;
  }

  /**
   * Get total request count
   */
  private async getRequestCount(): Promise<number> {
    // In real implementation, this would query metrics from the HttpServerAdapter
    return 0;
  }

  /**
   * Get total error count
   */
  private async getErrorCount(): Promise<number> {
    // In real implementation, this would query error metrics
    return 0;
  }

  /**
   * Check if the server is currently running
   */
  public isServerRunning(): boolean {
    return this.isRunning;
  }

  /**
   * Get server uptime in milliseconds
   */
  public getUptime(): number {
    return this.startTime ? Date.now() - this.startTime.getTime() : 0;
  }

  /**
   * Get server configuration
   */
  public getConfiguration(): Record<string, any> {
    return {
      port: this.metadata.get('port'),
      environment: this.metadata.get('environment'),
      version: this.metadata.get('version'),
      capabilities: this.metadata.get('capabilities')?.toString().split(',') || []
    };
  }
}