"use strict";
/**
 * @fileoverview HTTP server adapter for REST API endpoints
 * @description Manages Express.js server for automation requests and health checks
 * @author Web-Buddy Team
 */
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpServerAdapter = exports.HttpServerPort = void 0;
const typescript_eda_stubs_1 = require("../../stubs/typescript-eda-stubs");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const compression_1 = __importDefault(require("compression"));
/**
 * Port interface for HTTP server operations
 */
class HttpServerPort extends typescript_eda_stubs_1.Port {
    constructor() {
        super(...arguments);
        this.name = 'HttpServerPort';
    }
}
exports.HttpServerPort = HttpServerPort;
/**
 * HTTP server adapter using Express.js
 * Provides REST API endpoints for automation requests and server management
 */
let HttpServerAdapter = class HttpServerAdapter extends HttpServerPort {
    constructor() {
        super(...arguments);
        this.isRunning = false;
        this.port = 0;
        this.routes = new Map();
    }
    /**
     * Start the HTTP server on specified port
     */
    async startServer(port) {
        if (this.isRunning) {
            console.log('⚠️ HTTP server is already running');
            return;
        }
        console.log(`🌐 Starting HTTP server on port ${port}...`);
        try {
            this.app = (0, express_1.default)();
            this.port = port;
            // Set up middleware
            this.setupMiddleware();
            // Set up routes
            this.setupRoutes();
            // Start server
            await new Promise((resolve, reject) => {
                this.server = this.app.listen(port, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
            this.isRunning = true;
            console.log(`✅ HTTP server started on http://localhost:${port}`);
        }
        catch (error) {
            console.error('❌ Failed to start HTTP server:', error);
            throw error;
        }
    }
    /**
     * Stop the HTTP server gracefully
     */
    async stopServer() {
        if (!this.isRunning) {
            console.log('⚠️ HTTP server is not running');
            return;
        }
        console.log('🛑 Stopping HTTP server...');
        try {
            if (this.server) {
                await new Promise((resolve, reject) => {
                    this.server.close((error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve();
                        }
                    });
                });
            }
            this.isRunning = false;
            this.app = undefined;
            this.server = undefined;
            console.log('✅ HTTP server stopped successfully');
        }
        catch (error) {
            console.error('❌ Error stopping HTTP server:', error);
            throw error;
        }
    }
    /**
     * Register a new route handler
     */
    registerRoute(method, path, handler) {
        if (!this.app) {
            throw new Error('HTTP server not initialized');
        }
        const routeKey = `${method.toUpperCase()} ${path}`;
        this.routes.set(routeKey, {
            method: method.toUpperCase(),
            path,
            handler,
            registeredAt: new Date()
        });
        // Register with Express
        switch (method.toLowerCase()) {
            case 'get':
                this.app.get(path, handler);
                break;
            case 'post':
                this.app.post(path, handler);
                break;
            case 'put':
                this.app.put(path, handler);
                break;
            case 'delete':
                this.app.delete(path, handler);
                break;
            case 'patch':
                this.app.patch(path, handler);
                break;
            default:
                throw new Error(`Unsupported HTTP method: ${method}`);
        }
        console.log(`📍 Route registered: ${routeKey}`);
    }
    /**
     * Get server information
     */
    async getServerInfo() {
        return {
            isRunning: this.isRunning,
            port: this.port,
            routeCount: this.routes.size,
            registeredRoutes: Array.from(this.routes.keys()),
            uptime: this.isRunning ? process.uptime() : 0,
            environment: process.env.NODE_ENV || 'development'
        };
    }
    /**
     * Set up Express middleware
     */
    setupMiddleware() {
        if (!this.app)
            return;
        // Security middleware
        this.app.use((0, helmet_1.default)({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    styleSrc: ["'self'", "'unsafe-inline'"],
                    scriptSrc: ["'self'"],
                    imgSrc: ["'self'", "data:", "https:"]
                }
            }
        }));
        // CORS configuration
        this.app.use((0, cors_1.default)({
            origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
        }));
        // Compression
        this.app.use((0, compression_1.default)());
        // Body parsing
        this.app.use(express_1.default.json({ limit: '10mb' }));
        this.app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
        // Request logging middleware
        this.app.use((req, res, next) => {
            const start = Date.now();
            const { method, url, ip } = req;
            res.on('finish', () => {
                const duration = Date.now() - start;
                console.log(`📝 ${method} ${url} - ${res.statusCode} - ${duration}ms - ${ip}`);
            });
            next();
        });
        console.log('🔧 HTTP middleware configured');
    }
    /**
     * Set up default routes
     */
    setupRoutes() {
        if (!this.app)
            return;
        // Health check endpoint
        this.registerRoute('GET', '/health', (req, res) => {
            res.json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                environment: process.env.NODE_ENV || 'development'
            });
        });
        // Server info endpoint
        this.registerRoute('GET', '/info', async (req, res) => {
            try {
                const serverInfo = await this.getServerInfo();
                res.json(serverInfo);
            }
            catch (error) {
                res.status(500).json({ error: 'Failed to get server info' });
            }
        });
        // Automation dispatch endpoint
        this.registerRoute('POST', '/api/automation/dispatch', (req, res) => {
            try {
                const { extensionId, tabId, action, payload } = req.body;
                // Validate required fields
                if (!extensionId || !action) {
                    return res.status(400).json({
                        error: 'Missing required fields: extensionId, action'
                    });
                }
                const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
                // In real implementation, this would emit an AutomationRequestReceivedEvent
                console.log(`🤖 Automation dispatch request received:`, {
                    requestId,
                    extensionId,
                    tabId,
                    action
                });
                res.json({
                    requestId,
                    status: 'accepted',
                    timestamp: new Date().toISOString()
                });
            }
            catch (error) {
                console.error('❌ Error processing automation dispatch:', error);
                res.status(500).json({ error: 'Internal server error' });
            }
        });
        // Extension status endpoint
        this.registerRoute('GET', '/api/extensions', (req, res) => {
            // In real implementation, this would query the coordination application
            res.json({
                extensions: [],
                count: 0,
                timestamp: new Date().toISOString()
            });
        });
        // Extension-specific status endpoint
        this.registerRoute('GET', '/api/extensions/:extensionId', (req, res) => {
            const { extensionId } = req.params;
            // In real implementation, this would query the coordination application
            res.json({
                extensionId,
                status: 'unknown',
                timestamp: new Date().toISOString()
            });
        });
        // Metrics endpoint
        this.registerRoute('GET', '/api/metrics', (req, res) => {
            res.json({
                server: {
                    uptime: process.uptime(),
                    memory: process.memoryUsage(),
                    cpu: process.cpuUsage()
                },
                coordination: {
                    activeExtensions: 0,
                    activeSessions: 0,
                    requestsPerSecond: 0
                },
                timestamp: new Date().toISOString()
            });
        });
        // WebSocket connection info endpoint
        this.registerRoute('GET', '/api/websocket/info', (req, res) => {
            res.json({
                url: `ws://localhost:${this.port + 1}/ws`,
                activeConnections: 0,
                protocol: 'websocket',
                timestamp: new Date().toISOString()
            });
        });
        // 404 handler
        this.app.use('*', (req, res) => {
            res.status(404).json({
                error: 'Not Found',
                message: `Route ${req.method} ${req.originalUrl} not found`,
                timestamp: new Date().toISOString()
            });
        });
        // Error handler
        this.app.use((error, req, res, next) => {
            console.error('❌ HTTP server error:', error);
            res.status(500).json({
                error: 'Internal Server Error',
                message: error.message,
                timestamp: new Date().toISOString()
            });
        });
        console.log('📍 Default routes configured');
    }
    /**
     * Get registered routes
     */
    getRegisteredRoutes() {
        return Array.from(this.routes.values());
    }
    /**
     * Health check for the adapter
     */
    async isHealthy() {
        return this.isRunning && this.server !== undefined;
    }
    /**
     * Cleanup the adapter
     */
    async shutdown() {
        await this.stopServer();
    }
};
exports.HttpServerAdapter = HttpServerAdapter;
exports.HttpServerAdapter = HttpServerAdapter = __decorate([
    (0, typescript_eda_stubs_1.AdapterFor)(HttpServerPort)
], HttpServerAdapter);
//# sourceMappingURL=http-server-adapter.js.map