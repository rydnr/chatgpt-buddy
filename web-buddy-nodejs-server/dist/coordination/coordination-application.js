"use strict";
/**
 * @fileoverview Coordination application for managing browser extension communication
 * @description Handles routing, session management, and extension lifecycle coordination
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
exports.CoordinationApplication = void 0;
const typescript_eda_stubs_1 = require("../stubs/typescript-eda-stubs");
const coordination_events_1 = require("../core/events/coordination-events");
const websocket_server_adapter_1 = require("./adapters/websocket-server-adapter");
const extension_manager_adapter_1 = require("./adapters/extension-manager-adapter");
const session_manager_adapter_1 = require("./adapters/session-manager-adapter");
/**
 * Coordination application that manages browser extension communication
 * Uses TypeScript-EDA patterns for event-driven coordination and routing
 */
let CoordinationApplication = class CoordinationApplication extends typescript_eda_stubs_1.Application {
    constructor() {
        super(...arguments);
        this.metadata = new Map([
            ['name', 'Web-Buddy Coordination Engine'],
            ['version', '1.0.0'],
            ['capabilities', 'extension-routing,session-management,load-balancing'],
            ['maxConcurrentSessions', '100'],
            ['heartbeatInterval', '30000'] // 30 seconds
        ]);
        this.activeExtensions = new Map();
        this.activeSessions = new Map();
        this.pendingRequests = new Map();
        this.routingStats = new Map();
    }
    /**
     * Handle browser extension connection
     */
    async handleExtensionConnected(event) {
        console.log(`🔌 Extension connected: ${event.extensionId}`);
        // Register the extension
        const extensionInfo = {
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
    async handleExtensionDisconnected(event) {
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
    async handleAutomationRequest(event) {
        console.log(`🤖 Processing automation request: ${event.requestId}`);
        console.log(`🎯 Target: Extension ${event.targetExtensionId}, Tab ${event.targetTabId}`);
        try {
            // Find the best extension to handle this request
            const routingDecision = await this.routeAutomationRequest(event);
            if (!routingDecision) {
                throw new Error('No suitable extension found for automation request');
            }
            // Store the pending request
            const pendingRequest = {
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
        }
        catch (error) {
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
    async handleAutomationResponse(event) {
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
            }
            else {
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
    async handleExtensionHeartbeat(event) {
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
    async handleExtensionHeartbeatMissed(event) {
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
    async routeAutomationRequest(event) {
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
    findBestExtensionForRequest(extensions, payload) {
        // Simple load balancing for now - choose extension with fewest active requests
        return extensions.reduce((best, current) => current.activeRequests < best.activeRequests ? current : best);
    }
    /**
     * Handle failover when an extension disconnects unexpectedly
     */
    async handleExtensionFailover(extensionId) {
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
            }
            else {
                // No fallback available - fail the request
                console.error(`❌ No fallback extension available for request ${request.requestId}`);
                this.pendingRequests.delete(request.requestId);
            }
        }
    }
    /**
     * Update coordination metrics
     */
    async updateCoordinationMetrics() {
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
    calculateRequestsPerSecond() {
        // Implementation would track requests over time windows
        return 0;
    }
    /**
     * Calculate average response time across all extensions
     */
    calculateAverageResponseTime() {
        const extensions = Array.from(this.activeExtensions.values());
        if (extensions.length === 0)
            return 0;
        const totalTime = extensions.reduce((sum, ext) => sum + ext.statistics.averageResponseTime, 0);
        return totalTime / extensions.length;
    }
    /**
     * Calculate overall error rate
     */
    calculateErrorRate() {
        const extensions = Array.from(this.activeExtensions.values());
        if (extensions.length === 0)
            return 0;
        const totalRequests = extensions.reduce((sum, ext) => sum + ext.statistics.requestsProcessed, 0);
        const totalErrors = extensions.reduce((sum, ext) => sum + ext.statistics.failedRequests, 0);
        return totalRequests > 0 ? totalErrors / totalRequests : 0;
    }
    /**
     * Calculate current throughput
     */
    calculateThroughput() {
        // Implementation would calculate actual throughput metrics
        return 0;
    }
    /**
     * Get coordination status
     */
    getCoordinationStatus() {
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
    getExtensionStatus(extensionId) {
        return this.activeExtensions.get(extensionId) || null;
    }
    /**
     * Get all active extensions
     */
    getActiveExtensions() {
        return Array.from(this.activeExtensions.values());
    }
};
exports.CoordinationApplication = CoordinationApplication;
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.ExtensionConnectedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.ExtensionConnectedEvent]),
    __metadata("design:returntype", Promise)
], CoordinationApplication.prototype, "handleExtensionConnected", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.ExtensionDisconnectedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.ExtensionDisconnectedEvent]),
    __metadata("design:returntype", Promise)
], CoordinationApplication.prototype, "handleExtensionDisconnected", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.AutomationRequestReceivedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.AutomationRequestReceivedEvent]),
    __metadata("design:returntype", Promise)
], CoordinationApplication.prototype, "handleAutomationRequest", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.AutomationResponseReceivedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.AutomationResponseReceivedEvent]),
    __metadata("design:returntype", Promise)
], CoordinationApplication.prototype, "handleAutomationResponse", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.ExtensionHeartbeatReceivedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.ExtensionHeartbeatReceivedEvent]),
    __metadata("design:returntype", Promise)
], CoordinationApplication.prototype, "handleExtensionHeartbeat", null);
__decorate([
    (0, typescript_eda_stubs_1.listen)(coordination_events_1.ExtensionHeartbeatMissedEvent),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [coordination_events_1.ExtensionHeartbeatMissedEvent]),
    __metadata("design:returntype", Promise)
], CoordinationApplication.prototype, "handleExtensionHeartbeatMissed", null);
exports.CoordinationApplication = CoordinationApplication = __decorate([
    (0, typescript_eda_stubs_1.Enable)(websocket_server_adapter_1.WebSocketServerAdapter),
    (0, typescript_eda_stubs_1.Enable)(extension_manager_adapter_1.ExtensionManagerAdapter),
    (0, typescript_eda_stubs_1.Enable)(session_manager_adapter_1.SessionManagerAdapter)
], CoordinationApplication);
//# sourceMappingURL=coordination-application.js.map