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

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import * as http from 'http';
import WebSocket from 'ws';
import { v4 as uuidv4 } from 'uuid';
import winston from 'winston';

/**
 * Configuration for Web-Buddy Server
 */
export interface WebBuddyServerConfig {
  port?: number;
  host?: string;
  cors?: {
    enabled: boolean;
    origins?: string[];
  };
  rateLimit?: {
    enabled: boolean;
    windowMs?: number;
    maxRequests?: number;
  };
  authentication?: {
    enabled: boolean;
    apiKeys?: string[];
  };
  logging?: {
    level: string;
    file?: string;
  };
}

/**
 * Extension connection information
 */
export interface ExtensionConnection {
  id: string;
  websocket: WebSocket;
  tabId?: number;
  url?: string;
  capabilities?: string[];
  lastActivity: Date;
  metadata?: Record<string, any>;
}

/**
 * Message routing information
 */
export interface MessageRoute {
  extensionId?: string;
  tabId?: number;
  correlationId: string;
  timestamp: Date;
  priority?: 'low' | 'medium' | 'high';
}

/**
 * Web-Buddy Server implementation
 * Handles HTTP API requests and WebSocket connections to browser extensions
 */
export class WebBuddyServer {
  private app!: express.Application;
  private server!: http.Server;
  private wss!: WebSocket.Server;
  private extensions: Map<string, ExtensionConnection> = new Map();
  private pendingRequests: Map<string, any> = new Map();
  private logger!: winston.Logger;
  private config: Required<WebBuddyServerConfig>;
  private isRunning = false;

  constructor(config: WebBuddyServerConfig = {}) {
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
  private setupLogger(): void {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      })
    ];

    if (this.config.logging.file) {
      transports.push(new winston.transports.File({ 
        filename: this.config.logging.file 
      }));
    }

    this.logger = winston.createLogger({
      level: this.config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
      ),
      transports
    });
  }

  /**
   * Setup Express application
   */
  private setupExpress(): void {
    this.app = express();

    // Security middleware
    this.app.use(helmet());
    this.app.use(compression());

    // CORS
    if (this.config.cors.enabled) {
      this.app.use(cors({
        origin: this.config.cors.origins,
        credentials: true
      }));
    }

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        correlationId: req.headers['x-correlation-id'] || uuidv4()
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
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
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
  private setupWebSocket(): void {
    this.server = http.createServer(this.app);
    
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws'
    });

    this.wss.on('connection', this.handleWebSocketConnection.bind(this));
  }

  /**
   * Start the server
   */
  public async start(): Promise<void> {
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
  public async stop(): Promise<void> {
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
  private authenticateRequest(req: Request, res: Response, next: NextFunction): void {
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
  private async handleMessage(req: Request, res: Response): Promise<void> {
    try {
      const correlationId = req.body.correlationId || uuidv4();
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

    } catch (error) {
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
  private async handleEvent(req: Request, res: Response): Promise<void> {
    try {
      const event = req.body;
      const correlationId = event.correlationId || uuidv4();
      
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

    } catch (error) {
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
  private async handleDispatch(req: Request, res: Response): Promise<void> {
    try {
      const { target, message } = req.body;
      const correlationId = message.correlationId || uuidv4();
      
      this.logger.info('📤 Dispatch request received', {
        correlationId,
        targetExtensionId: target.extensionId,
        targetTabId: target.tabId
      });

      // Find target extension by ID or tab
      let targetExtension: ExtensionConnection | undefined;
      
      if (target.extensionId) {
        targetExtension = this.extensions.get(target.extensionId);
      } else if (target.tabId) {
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

    } catch (error) {
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
  private listExtensions(req: Request, res: Response): void {
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
  private getExtension(req: Request, res: Response): void {
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
  private getMetrics(req: Request, res: Response): void {
    const metrics = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      extensions: {
        connected: this.extensions.size,
        active: Array.from(this.extensions.values()).filter(
          ext => Date.now() - ext.lastActivity.getTime() < 60000
        ).length
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
  private handleWebSocketConnection(ws: WebSocket, req: http.IncomingMessage): void {
    const extensionId = uuidv4();
    
    const connection: ExtensionConnection = {
      id: extensionId,
      websocket: ws,
      lastActivity: new Date()
    };

    this.extensions.set(extensionId, connection);
    
    this.logger.info('🔌 Extension connected', { extensionId });

    ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleExtensionMessage(extensionId, message);
      } catch (error) {
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
  private handleExtensionMessage(extensionId: string, message: any): void {
    const connection = this.extensions.get(extensionId);
    if (!connection) return;

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
  private handleExtensionRegistration(extensionId: string, message: any): void {
    const connection = this.extensions.get(extensionId);
    if (!connection) return;

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
  private handleExtensionResponse(extensionId: string, message: any): void {
    const correlationId = message.correlationId;
    if (!correlationId) return;

    const pendingRequest = this.pendingRequests.get(correlationId);
    if (pendingRequest) {
      pendingRequest.resolve(message.data);
      this.pendingRequests.delete(correlationId);
    }
  }

  /**
   * Handle extension heartbeat
   */
  private handleExtensionHeartbeat(extensionId: string, message: any): void {
    const connection = this.extensions.get(extensionId);
    if (!connection) return;

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
  private findTargetExtension(tabId?: number): ExtensionConnection | undefined {
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
  private async forwardMessageToExtension(
    extension: ExtensionConnection,
    message: any,
    correlationId: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('Request timeout'));
      }, 30000); // 30 second timeout

      this.pendingRequests.set(correlationId, {
        resolve: (data: any) => {
          clearTimeout(timeout);
          resolve(data);
        },
        reject: (error: any) => {
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
  private async forwardEventToExtension(
    extension: ExtensionConnection,
    event: any,
    correlationId: string
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.pendingRequests.delete(correlationId);
        reject(new Error('Event timeout'));
      }, 30000);

      this.pendingRequests.set(correlationId, {
        resolve: (data: any) => {
          clearTimeout(timeout);
          resolve(data);
        },
        reject: (error: any) => {
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
  private errorHandler(error: any, req: Request, res: Response, next: NextFunction): void {
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
  public getStatus(): {
    isRunning: boolean;
    port: number;
    extensions: number;
    uptime: number;
  } {
    return {
      isRunning: this.isRunning,
      port: this.config.port,
      extensions: this.extensions.size,
      uptime: process.uptime()
    };
  }
}