/**
 * @fileoverview HTTP server adapter for REST API endpoints
 * @description Manages Express.js server for automation requests and health checks
 * @author Web-Buddy Team
 */

import { Adapter, AdapterFor, Port } from '../../stubs/typescript-eda-stubs';
import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { Server } from 'http';

/**
 * Port interface for HTTP server operations
 */
export abstract class HttpServerPort extends Port {
  public readonly name = 'HttpServerPort';
  
  public abstract startServer(port: number): Promise<void>;
  public abstract stopServer(): Promise<void>;
  public abstract registerRoute(method: string, path: string, handler: Function): void;
  public abstract getServerInfo(): Promise<ServerInfo>;
}

/**
 * HTTP server adapter using Express.js
 * Provides REST API endpoints for automation requests and server management
 */
@AdapterFor(HttpServerPort)
export class HttpServerAdapter extends HttpServerPort {
  private app?: Express;
  private server?: Server;
  private isRunning = false;
  private port = 0;
  private routes = new Map<string, RouteInfo>();

  /**
   * Start the HTTP server on specified port
   */
  public async startServer(port: number): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ HTTP server is already running');
      return;
    }

    console.log(`🌐 Starting HTTP server on port ${port}...`);

    try {
      this.app = express();
      this.port = port;

      // Set up middleware
      this.setupMiddleware();
      
      // Set up routes
      this.setupRoutes();

      // Start server
      await new Promise<void>((resolve, reject) => {
        this.server = this.app!.listen(port, (error?: Error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        });
      });

      this.isRunning = true;
      
      console.log(`✅ HTTP server started on http://localhost:${port}`);
      
    } catch (error) {
      console.error('❌ Failed to start HTTP server:', error);
      throw error;
    }
  }

  /**
   * Stop the HTTP server gracefully
   */
  public async stopServer(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️ HTTP server is not running');
      return;
    }

    console.log('🛑 Stopping HTTP server...');

    try {
      if (this.server) {
        await new Promise<void>((resolve, reject) => {
          this.server!.close((error) => {
            if (error) {
              reject(error);
            } else {
              resolve();
            }
          });
        });
      }

      this.isRunning = false;
      this.app = undefined;
      this.server = undefined;
      
      console.log('✅ HTTP server stopped successfully');
      
    } catch (error) {
      console.error('❌ Error stopping HTTP server:', error);
      throw error;
    }
  }

  /**
   * Register a new route handler
   */
  public registerRoute(method: string, path: string, handler: Function): void {
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
        this.app.get(path, handler as any);
        break;
      case 'post':
        this.app.post(path, handler as any);
        break;
      case 'put':
        this.app.put(path, handler as any);
        break;
      case 'delete':
        this.app.delete(path, handler as any);
        break;
      case 'patch':
        this.app.patch(path, handler as any);
        break;
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }

    console.log(`📍 Route registered: ${routeKey}`);
  }

  /**
   * Get server information
   */
  public async getServerInfo(): Promise<ServerInfo> {
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
  private setupMiddleware(): void {
    if (!this.app) return;

    // Security middleware
    this.app.use(helmet({
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
    this.app.use(cors({
      origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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
  private setupRoutes(): void {
    if (!this.app) return;

    // Health check endpoint
    this.registerRoute('GET', '/health', (req: Request, res: Response) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        environment: process.env.NODE_ENV || 'development'
      });
    });

    // Server info endpoint
    this.registerRoute('GET', '/info', async (req: Request, res: Response) => {
      try {
        const serverInfo = await this.getServerInfo();
        res.json(serverInfo);
      } catch (error) {
        res.status(500).json({ error: 'Failed to get server info' });
      }
    });

    // Automation dispatch endpoint
    this.registerRoute('POST', '/api/automation/dispatch', (req: Request, res: Response) => {
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

      } catch (error) {
        console.error('❌ Error processing automation dispatch:', error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Extension status endpoint
    this.registerRoute('GET', '/api/extensions', (req: Request, res: Response) => {
      // In real implementation, this would query the coordination application
      res.json({
        extensions: [],
        count: 0,
        timestamp: new Date().toISOString()
      });
    });

    // Extension-specific status endpoint
    this.registerRoute('GET', '/api/extensions/:extensionId', (req: Request, res: Response) => {
      const { extensionId } = req.params;
      
      // In real implementation, this would query the coordination application
      res.json({
        extensionId,
        status: 'unknown',
        timestamp: new Date().toISOString()
      });
    });

    // Metrics endpoint
    this.registerRoute('GET', '/api/metrics', (req: Request, res: Response) => {
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
    this.registerRoute('GET', '/api/websocket/info', (req: Request, res: Response) => {
      res.json({
        url: `ws://localhost:${this.port + 1}/ws`,
        activeConnections: 0,
        protocol: 'websocket',
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    this.app.use('*', (req: Request, res: Response) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.originalUrl} not found`,
        timestamp: new Date().toISOString()
      });
    });

    // Error handler
    this.app.use((error: Error, req: Request, res: Response, next: Function) => {
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
  public getRegisteredRoutes(): RouteInfo[] {
    return Array.from(this.routes.values());
  }

  /**
   * Health check for the adapter
   */
  public async isHealthy(): Promise<boolean> {
    return this.isRunning && this.server !== undefined;
  }

  /**
   * Cleanup the adapter
   */
  public async shutdown(): Promise<void> {
    await this.stopServer();
  }
}

// Supporting interfaces

interface RouteInfo {
  method: string;
  path: string;
  handler: Function;
  registeredAt: Date;
}

export interface ServerInfo {
  isRunning: boolean;
  port: number;
  routeCount: number;
  registeredRoutes: string[];
  uptime: number;
  environment: string;
}