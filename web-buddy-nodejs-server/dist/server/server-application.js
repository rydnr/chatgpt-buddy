"use strict";
/**
 * @fileoverview Main server application using TypeScript-EDA patterns
 * @description Coordinates HTTP server, WebSocket connections, and extension management
 * @author Web-Buddy Team
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerApplication = void 0;
const typescript_eda_stubs_1 = require("../stubs/typescript-eda-stubs");
const server_events_1 = require("../core/events/server-events");
const coordination_events_1 = require("../core/events/coordination-events");
const http_server_adapter_1 = require("./adapters/http-server-adapter");
const logging_adapter_1 = require("./adapters/logging-adapter");
const cache_adapter_1 = require("./adapters/cache-adapter");
const websocket_server_adapter_1 = require("../coordination/adapters/websocket-server-adapter");
const extension_manager_adapter_1 = require("../coordination/adapters/extension-manager-adapter");
const session_manager_adapter_1 = require("../coordination/adapters/session-manager-adapter");
/**
 * Main server application that orchestrates all server components
 * Uses TypeScript-EDA patterns for event-driven coordination
 */
let ServerApplication = class ServerApplication extends typescript_eda_stubs_1.Application {
    constructor() {
        super(...arguments);
        this.metadata = new Map([
            ['name', 'Web-Buddy Node.js Server'],
            ['version', '1.0.0'],
            ['capabilities', 'http-server,websocket-coordination,extension-management'],
            ['port', process.env.PORT || 3003],
            ['environment', process.env.NODE_ENV || 'development']
        ]);
        this.isRunning = false;
    }
    /**
     * Start the server with all components
     */
    async handleServerStart(event) {
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
        }
        catch (error) {
            console.error('❌ Failed to start server:', error);
            throw error;
        }
    }
    /**
     * Stop the server gracefully
     */
    async handleServerStop(event) {
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
        }
        catch (error) {
            console.error('❌ Error stopping server:', error);
            throw error;
        }
    }
    /**
     * Handle server health check requests
     */
    async handleHealthCheck(event) {
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
    async handleMetricsRequest(event) {
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
    async handleExtensionConnected(event) {
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
    async handleExtensionDisconnected(event) {
        console.log(`🔌 Extension disconnected: ${event.extensionId}`);
        console.log(`⏱️ Session duration: ${event.sessionDuration}ms`);
    }
    /**
     * Handle automation requests from external clients
     */
    async handleAutomationRequest(event) {
        console.log(`🤖 Automation request received: ${event.requestId}`);
        console.log(`🎯 Target: Extension ${event.targetExtensionId}, Tab ${event.targetTabId}`);
        console.log(`⚡ Action: ${event.automationPayload.action}`);
        // The coordination layer will handle routing this request to the appropriate extension
        // This event handler provides logging and monitoring
    }
    /**
     * Initialize all server adapters
     */
    async initializeAdapters() {
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
            }
            catch (error) {
                console.error(`❌ Failed to initialize ${adapterName}:`, error);
                throw error;
            }
        }
    }
    /**
     * Start the HTTP server component
     */
    async startHttpServer(port) {
        // In the real implementation, this would interact with the HttpServerAdapter
        console.log(`🌐 Starting HTTP server on port ${port}...`);
    }
    /**
     * Start the WebSocket server component
     */
    async startWebSocketServer(port) {
        // In the real implementation, this would interact with the WebSocketServerAdapter
        console.log(`🔌 Starting WebSocket server on port ${port}...`);
    }
    /**
     * Stop the HTTP server component
     */
    async stopHttpServer() {
        console.log('🌐 Stopping HTTP server...');
    }
    /**
     * Stop the WebSocket server component
     */
    async stopWebSocketServer() {
        console.log('🔌 Stopping WebSocket server...');
    }
    /**
     * Shutdown all adapters gracefully
     */
    async shutdownAdapters() {
        console.log('🔧 Shutting down adapters...');
    }
    /**
     * Get health status of all components
     */
    async getComponentHealth() {
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
    async getActiveConnectionCount() {
        // In real implementation, this would query the WebSocketServerAdapter
        return 0;
    }
    /**
     * Get total request count
     */
    async getRequestCount() {
        // In real implementation, this would query metrics from the HttpServerAdapter
        return 0;
    }
    /**
     * Get total error count
     */
    async getErrorCount() {
        // In real implementation, this would query error metrics
        return 0;
    }
    /**
     * Check if the server is currently running
     */
    isServerRunning() {
        return this.isRunning;
    }
    /**
     * Get server uptime in milliseconds
     */
    getUptime() {
        return this.startTime ? Date.now() - this.startTime.getTime() : 0;
    }
    /**
     * Get server configuration
     */
    getConfiguration() {
        return {
            port: this.metadata.get('port'),
            environment: this.metadata.get('environment'),
            version: this.metadata.get('version'),
            capabilities: this.metadata.get('capabilities')?.toString().split(',') || []
        };
    }
};
exports.ServerApplication = ServerApplication;
__decorate([
    (0, typescript_eda_stubs_1.listen)(server_events_1.ServerStartRequestedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [server_events_1.ServerStartRequestedEvent]),
    __metadata("design:returntype", Promise)
], ServerApplication.prototype, "handleServerStart", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(server_events_1.ServerStopRequestedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [server_events_1.ServerStopRequestedEvent]),
    __metadata("design:returntype", Promise)
], ServerApplication.prototype, "handleServerStop", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(server_events_1.ServerHealthCheckRequestedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [server_events_1.ServerHealthCheckRequestedEvent]),
    __metadata("design:returntype", Promise)
], ServerApplication.prototype, "handleHealthCheck", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(server_events_1.ServerMetricsRequestedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [server_events_1.ServerMetricsRequestedEvent]),
    __metadata("design:returntype", Promise)
], ServerApplication.prototype, "handleMetricsRequest", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.ExtensionConnectedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.ExtensionConnectedEvent]),
    __metadata("design:returntype", Promise)
], ServerApplication.prototype, "handleExtensionConnected", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.ExtensionDisconnectedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.ExtensionDisconnectedEvent]),
    __metadata("design:returntype", Promise)
], ServerApplication.prototype, "handleExtensionDisconnected", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.AutomationRequestReceivedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.AutomationRequestReceivedEvent]),
    __metadata("design:returntype", Promise)
], ServerApplication.prototype, "handleAutomationRequest", null);
exports.ServerApplication = ServerApplication = __decorate([
    (0, typescript_eda_stubs_1.Enable)(http_server_adapter_1.HttpServerAdapter),
    (0, typescript_eda_stubs_1.Enable)(logging_adapter_1.LoggingAdapter),
    (0, typescript_eda_stubs_1.Enable)(cache_adapter_1.CacheAdapter),
    (0, typescript_eda_stubs_1.Enable)(websocket_server_adapter_1.WebSocketServerAdapter),
    (0, typescript_eda_stubs_1.Enable)(extension_manager_adapter_1.ExtensionManagerAdapter),
    (0, typescript_eda_stubs_1.Enable)(session_manager_adapter_1.SessionManagerAdapter)
], ServerApplication);
//# sourceMappingURL=server-application.js.map