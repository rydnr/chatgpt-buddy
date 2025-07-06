"use strict";
/*
                        Web-Buddy Server

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebBuddyServer = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
const http = __importStar(require("http"));
const ws_1 = __importDefault(require("ws"));
const uuid_1 = require("uuid");
const winston_1 = __importDefault(require("winston"));
/**
 * Web-Buddy Server implementation
 * Handles HTTP API requests and WebSocket connections to browser extensions
 */
class WebBuddyServer {
    app;
    server;
    wss;
    extensions = new Map();
    pendingRequests = new Map();
    logger;
    config;
    isRunning = false;
    constructor(config = {}) {
        this.config = {
            port: 3000,
            host: 'localhost',
            cors: {
                enabled: true,
                origins: ['http://localhost:3000', 'https://*.google.com', 'https://chatgpt.com', 'https://*.wikipedia.org']
            },
            rateLimit: {
                enabled: true,
                windowMs: 60000,
                maxRequests: 100
            },
            authentication: {
                enabled: false,
                apiKeys: []
            },
            logging: {
                level: 'info',
                file: undefined
            },
            ...config
        };
        this.setupLogger();
        this.setupExpress();
        this.setupWebSocket();
    }
    /**
     * Setup Winston logger
     */
    setupLogger() {
        const transports = [
            new winston_1.default.transports.Console({
                format: winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.simple())
            })
        ];
        if (this.config.logging.file) {
            transports.push(new winston_1.default.transports.File({
                filename: this.config.logging.file
            }));
        }
        this.logger = winston_1.default.createLogger({
            level: this.config.logging.level,
            format: winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.errors({ stack: true }), winston_1.default.format.json()),
            transports
        });
    }
    /**
     * Setup Express application
     */
    setupExpress() {
        this.app = (0, express_1.default)();
        // Security middleware
        this.app.use((0, helmet_1.default)());
        this.app.use((0, compression_1.default)());
        // CORS
        if (this.config.cors.enabled) {
            this.app.use((0, cors_1.default)({
                origin: this.config.cors.origins,
                credentials: true
            }));
        }
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true }));
        // Request logging
        this.app.use((req, res, next) => {
            this.logger.info(`${req.method} ${req.path}`, {
                ip: req.ip,
                userAgent: req.get('User-Agent'),
                correlationId: req.headers['x-correlation-id'] || (0, uuid_1.v4)()
            });
            next();
        });
        // Authentication middleware
        if (this.config.authentication.enabled) {
            this.app.use(this.authenticateRequest.bind(this));
        }
        this.setupRoutes();
    }
    /**
     * Setup API routes
     */
    setupRoutes() {
        // Health check
        this.app.get('/health', (req, res) => {
            const health = {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                extensions: {
                    connected: this.extensions.size,
                    list: Array.from(this.extensions.values()).map(ext => ({
                        id: ext.id,
                        tabId: ext.tabId,
                        url: ext.url,
                        lastActivity: ext.lastActivity
                    }))
                },
                memory: process.memoryUsage(),
                version: '1.0.0'
            };
            res.json(health);
        });
        // API message endpoint (for client requests)
        this.app.post('/api/message', this.handleMessage.bind(this));
        // API event endpoint (for new event-driven requests)
        this.app.post('/api/event', this.handleEvent.bind(this));
        // API dispatch endpoint (legacy support)
        this.app.post('/api/dispatch', this.handleDispatch.bind(this));
        // Extension management
        this.app.get('/api/extensions', this.listExtensions.bind(this));
        this.app.get('/api/extensions/:id', this.getExtension.bind(this));
        // Metrics endpoint
        this.app.get('/api/metrics', this.getMetrics.bind(this));
        // Error handler
        this.app.use(this.errorHandler.bind(this));
    }
    /**
     * Setup WebSocket server for extension connections
     */
    setupWebSocket() {
        this.server = http.createServer(this.app);
        this.wss = new ws_1.default.Server({
            server: this.server,
            path: '/ws'
        });
        this.wss.on('connection', this.handleWebSocketConnection.bind(this));
    }
    /**
     * Start the server
     */
    async start() {
        return new Promise((resolve, reject) => {
            if (this.isRunning) {
                resolve();
                return;
            }
            this.server.listen(this.config.port, this.config.host, () => {
                this.isRunning = true;
                this.logger.info(`🚀 Web-Buddy Server started`, {
                    port: this.config.port,
                    host: this.config.host,
                    environment: process.env.NODE_ENV || 'development'
                });
                resolve();
            });
            this.server.on('error', (error) => {
                this.logger.error('Server startup error:', error);
                reject(error);
            });
        });
    }
    /**
     * Stop the server
     */
    async stop() {
        return new Promise((resolve) => {
            if (!this.isRunning) {
                resolve();
                return;
            }
            // Close all WebSocket connections
            this.wss.clients.forEach((ws) => {
                ws.close();
            });
            this.server.close(() => {
                this.isRunning = false;
                this.logger.info('🛑 Web-Buddy Server stopped');
                resolve();
            });
        });
    }
    /**
     * Authentication middleware
     */
    authenticateRequest(req, res, next) {
        const apiKey = req.headers.authorization?.replace('Bearer ', '');
        if (!apiKey || !this.config.authentication.apiKeys?.includes(apiKey)) {
            res.status(401).json({
                success: false,
                error: 'Invalid or missing API key'
            });
            return;
        }
        next();
    }
    /**
     * Handle incoming messages from clients
     */
    async handleMessage(req, res) {
        try {
            const correlationId = req.body.correlationId || (0, uuid_1.v4)();
            const tabId = req.body.tabId;
            this.logger.info('📨 Message received', {
                correlationId,
                tabId,
                messageType: Object.keys(req.body).find(key => key !== 'correlationId' && key !== 'tabId' && key !== 'timestamp')
            });
            // Find target extension
            const targetExtension = this.findTargetExtension(tabId);
            if (!targetExtension) {
                res.status(404).json({
                    success: false,
                    error: 'No extension available for the specified tab',
                    correlationId
                });
                return;
            }
            // Forward message to extension
            const response = await this.forwardMessageToExtension(targetExtension, req.body, correlationId);
            res.json({
                success: true,
                data: response,
                correlationId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Error handling message:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                correlationId: req.body.correlationId
            });
        }
    }
    /**
     * Handle incoming events (new event-driven API)
     */
    async handleEvent(req, res) {
        try {
            const event = req.body;
            const correlationId = event.correlationId || (0, uuid_1.v4)();
            this.logger.info('⚡ Event received', {
                correlationId,
                eventType: event.type,
                tabId: event.tabId
            });
            // Find target extension
            const targetExtension = this.findTargetExtension(event.tabId);
            if (!targetExtension) {
                res.status(404).json({
                    success: false,
                    error: 'No extension available for the specified tab',
                    correlationId
                });
                return;
            }
            // Forward event to extension
            const response = await this.forwardEventToExtension(targetExtension, event, correlationId);
            res.json({
                success: true,
                data: response,
                correlationId,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            this.logger.error('Error handling event:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error',
                correlationId: req.body.correlationId
            });
        }
    }
    /**
     * Handle dispatch requests (legacy API)
     */
    async handleDispatch(req, res) {
        try {
            const { target, message } = req.body;
            const correlationId = message.correlationId || (0, uuid_1.v4)();
            this.logger.info('📤 Dispatch request received', {
                correlationId,
                targetExtensionId: target.extensionId,
                targetTabId: target.tabId
            });
            // Find target extension by ID or tab
            let targetExtension;
            if (target.extensionId) {
                targetExtension = this.extensions.get(target.extensionId);
            }
            else if (target.tabId) {
                targetExtension = this.findTargetExtension(target.tabId);
            }
            if (!targetExtension) {
                res.status(404).json({
                    success: false,
                    error: 'Target extension not found',
                    correlationId
                });
                return;
            }
            // Forward message to extension
            const response = await this.forwardMessageToExtension(targetExtension, message, correlationId);
            res.json(response);
        }
        catch (error) {
            this.logger.error('Error handling dispatch:', error);
            res.status(500).json({
                success: false,
                error: 'Internal server error'
            });
        }
    }
    /**
     * List connected extensions
     */
    listExtensions(req, res) {
        const extensions = Array.from(this.extensions.values()).map(ext => ({
            id: ext.id,
            tabId: ext.tabId,
            url: ext.url,
            capabilities: ext.capabilities,
            lastActivity: ext.lastActivity,
            metadata: ext.metadata
        }));
        res.json({
            success: true,
            data: extensions,
            count: extensions.length
        });
    }
    /**
     * Get specific extension info
     */
    getExtension(req, res) {
        const extensionId = req.params.id;
        const extension = this.extensions.get(extensionId);
        if (!extension) {
            res.status(404).json({
                success: false,
                error: 'Extension not found'
            });
            return;
        }
        res.json({
            success: true,
            data: {
                id: extension.id,
                tabId: extension.tabId,
                url: extension.url,
                capabilities: extension.capabilities,
                lastActivity: extension.lastActivity,
                metadata: extension.metadata
            }
        });
    }
    /**
     * Get server metrics
     */
    getMetrics(req, res) {
        const metrics = {
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            extensions: {
                connected: this.extensions.size,
                active: Array.from(this.extensions.values()).filter(ext => Date.now() - ext.lastActivity.getTime() < 60000).length
            },
            requests: {
                pending: this.pendingRequests.size
            },
            timestamp: new Date().toISOString()
        };
        res.json({
            success: true,
            data: metrics
        });
    }
    /**
     * Handle WebSocket connections from extensions
     */
    handleWebSocketConnection(ws, req) {
        const extensionId = (0, uuid_1.v4)();
        const connection = {
            id: extensionId,
            websocket: ws,
            lastActivity: new Date()
        };
        this.extensions.set(extensionId, connection);
        this.logger.info('🔌 Extension connected', { extensionId });
        ws.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleExtensionMessage(extensionId, message);
            }
            catch (error) {
                this.logger.error('Error parsing extension message:', error);
            }
        });
        ws.on('close', () => {
            this.extensions.delete(extensionId);
            this.logger.info('🔌 Extension disconnected', { extensionId });
        });
        ws.on('error', (error) => {
            this.logger.error('WebSocket error:', error);
            this.extensions.delete(extensionId);
        });
        // Send welcome message
        ws.send(JSON.stringify({
            type: 'welcome',
            extensionId,
            timestamp: new Date().toISOString()
        }));
    }
    /**
     * Handle messages from extensions
     */
    handleExtensionMessage(extensionId, message) {
        const connection = this.extensions.get(extensionId);
        if (!connection)
            return;
        connection.lastActivity = new Date();
        this.logger.info('📥 Extension message received', {
            extensionId,
            messageType: message.type
        });
        switch (message.type) {
            case 'register':
                this.handleExtensionRegistration(extensionId, message);
                break;
            case 'response':
                this.handleExtensionResponse(extensionId, message);
                break;
            case 'heartbeat':
                this.handleExtensionHeartbeat(extensionId, message);
                break;
            default:
                this.logger.warn('Unknown message type from extension', {
                    extensionId,
                    messageType: message.type
                });
        }
    }
    /**
     * Handle extension registration
     */
    handleExtensionRegistration(extensionId, message) {
        const connection = this.extensions.get(extensionId);
        if (!connection)
            return;
        connection.tabId = message.tabId;
        connection.url = message.url;
        connection.capabilities = message.capabilities || [];
        connection.metadata = message.metadata || {};
        this.logger.info('📋 Extension registered', {
            extensionId,
            tabId: connection.tabId,
            url: connection.url,
            capabilities: connection.capabilities
        });
    }
    /**
     * Handle extension response to previous request
     */
    handleExtensionResponse(extensionId, message) {
        const correlationId = message.correlationId;
        if (!correlationId)
            return;
        const pendingRequest = this.pendingRequests.get(correlationId);
        if (pendingRequest) {
            pendingRequest.resolve(message.data);
            this.pendingRequests.delete(correlationId);
        }
    }
    /**
     * Handle extension heartbeat
     */
    handleExtensionHeartbeat(extensionId, message) {
        const connection = this.extensions.get(extensionId);
        if (!connection)
            return;
        connection.lastActivity = new Date();
        // Send heartbeat response
        connection.websocket.send(JSON.stringify({
            type: 'heartbeat_ack',
            timestamp: new Date().toISOString()
        }));
    }
    /**
     * Find target extension for a tab ID
     */
    findTargetExtension(tabId) {
        if (!tabId) {
            // Return any available extension if no specific tab requested
            return Array.from(this.extensions.values())[0];
        }
        // Find extension with matching tab ID
        return Array.from(this.extensions.values()).find(ext => ext.tabId === tabId);
    }
    /**
     * Forward message to extension and wait for response
     */
    async forwardMessageToExtension(extension, message, correlationId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(correlationId);
                reject(new Error('Request timeout'));
            }, 30000); // 30 second timeout
            this.pendingRequests.set(correlationId, {
                resolve: (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
            // Send message to extension
            extension.websocket.send(JSON.stringify({
                type: 'request',
                correlationId,
                data: message,
                timestamp: new Date().toISOString()
            }));
        });
    }
    /**
     * Forward event to extension and wait for response
     */
    async forwardEventToExtension(extension, event, correlationId) {
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(correlationId);
                reject(new Error('Event timeout'));
            }, 30000);
            this.pendingRequests.set(correlationId, {
                resolve: (data) => {
                    clearTimeout(timeout);
                    resolve(data);
                },
                reject: (error) => {
                    clearTimeout(timeout);
                    reject(error);
                }
            });
            // Send event to extension
            extension.websocket.send(JSON.stringify({
                type: 'event',
                correlationId,
                event,
                timestamp: new Date().toISOString()
            }));
        });
    }
    /**
     * Error handler middleware
     */
    errorHandler(error, req, res, next) {
        this.logger.error('Unhandled error:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error',
            timestamp: new Date().toISOString()
        });
    }
    /**
     * Get server status
     */
    getStatus() {
        return {
            isRunning: this.isRunning,
            port: this.config.port,
            extensions: this.extensions.size,
            uptime: process.uptime()
        };
    }
}
exports.WebBuddyServer = WebBuddyServer;
//# sourceMappingURL=server.js.map