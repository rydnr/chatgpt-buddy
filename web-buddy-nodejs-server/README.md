# Web-Buddy Node.js Server Framework

> Event-driven coordination server for browser extension automation

[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![WebSocket](https://img.shields.io/badge/WebSocket-Real--time-orange.svg)](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Overview

Web-Buddy Node.js Server Framework provides a robust, event-driven coordination layer for managing browser extension automation. Built on TypeScript-EDA patterns, it enables seamless communication between external clients and browser extensions through WebSocket connections and REST APIs.

## Key Features

- 🎯 **Event-Driven Architecture**: Built on TypeScript-EDA patterns for modularity and extensibility
- 🔌 **WebSocket Coordination**: Real-time communication with browser extensions
- 🌐 **REST API Gateway**: HTTP endpoints for automation requests and system management  
- 🔄 **Intelligent Routing**: Smart request routing based on extension capabilities
- 📊 **Real-Time Monitoring**: Comprehensive metrics and health monitoring
- 🛡️ **Security First**: Authentication, rate limiting, and secure communication
- 🔧 **Graceful Degradation**: Automatic failover and error recovery

## Quick Start

### Installation

```bash
npm install @web-buddy/nodejs-server
# or with pnpm  
pnpm add @web-buddy/nodejs-server
```

### Basic Server Setup

```typescript
// src/server.ts
import { ServerApplication } from '@web-buddy/nodejs-server';
import { ServerStartRequestedEvent } from '@web-buddy/nodejs-server';

const server = new ServerApplication();

// Start the server
async function startServer() {
  try {
    const startEvent = new ServerStartRequestedEvent(3003, {
      port: 3003,
      host: '0.0.0.0',
      environment: 'development',
      logging: {
        level: 'info',
        format: 'json',
        destinations: ['console'],
        enableRequestLogging: true,
        enableErrorTracking: true
      },
      security: {
        enableHTTPS: false,
        corsOrigins: ['http://localhost:3000'],
        rateLimiting: {
          enabled: true,
          windowMs: 15 * 60 * 1000, // 15 minutes
          maxRequests: 100,
          skipSuccessfulRequests: false
        },
        authentication: {
          enabled: false,
          method: 'jwt'
        },
        headers: {
          enableHelmet: true,
          contentSecurityPolicy: true,
          xssProtection: true,
          frameOptions: true
        }
      },
      performance: {
        enableCompression: true,
        enableCaching: true,
        maxRequestSize: '10mb',
        requestTimeout: 30000,
        keepAliveTimeout: 5000
      },
      features: {
        enableWebSocket: true,
        enableFileUploads: false,
        enableExtensionManagement: true,
        enablePatternSharing: true,
        enableAnalytics: true
      }
    });

    await server.handle(startEvent);
    
    console.log('🚀 Web-Buddy Server started successfully!');
    console.log('📡 HTTP API: http://localhost:3003');
    console.log('🔌 WebSocket: ws://localhost:3004/ws');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

### Coordination Application

```typescript
// src/coordination.ts
import { CoordinationApplication } from '@web-buddy/nodejs-server';
import { 
  AutomationRequestReceivedEvent,
  ExtensionConnectedEvent
} from '@web-buddy/nodejs-server';

const coordinator = new CoordinationApplication();

// Handle automation requests
coordinator.on(AutomationRequestReceivedEvent, async (event) => {
  console.log(`🤖 Automation request: ${event.requestId}`);
  console.log(`🎯 Target: ${event.targetExtensionId}`);
});

// Handle extension connections
coordinator.on(ExtensionConnectedEvent, async (event) => {
  console.log(`🔌 Extension connected: ${event.extensionId}`);
  console.log(`📋 Capabilities: ${event.metadata.capabilities}`);
});
```

## Core Architecture

### Event-Driven Coordination

The framework is built entirely on event-driven patterns:

```typescript
// Every server operation is event-driven
@listen(AutomationRequestReceivedEvent)
public async routeAutomation(event: AutomationRequestReceivedEvent): Promise<void> {
  const bestExtension = await this.findBestExtension(event.automationPayload);
  
  return [
    new AutomationRequestRoutedEvent(event.requestId, bestExtension.id, {
      selectedExtension: bestExtension.id,
      reason: 'best_capability',
      confidence: 0.95
    })
  ];
}
```

### WebSocket Communication

Real-time communication with browser extensions:

```typescript
// Extension connection handling
const wsAdapter = new WebSocketServerAdapter();

// Broadcast to all extensions
await wsAdapter.broadcastMessage({
  type: 'server_announcement',
  message: 'Pattern library updated',
  timestamp: new Date().toISOString()
});

// Send to specific extension
await wsAdapter.sendMessageToExtension('ext_123', {
  type: 'automation_request',
  requestId: 'req_456',
  payload: {
    action: 'click',
    target: { selector: '#login-button' }
  }
});
```

### REST API Integration

HTTP endpoints for external automation requests:

```typescript
// Automation dispatch endpoint
POST /api/automation/dispatch
Content-Type: application/json

{
  "extensionId": "my-extension",
  "tabId": 123,
  "action": "click", 
  "payload": {
    "target": {
      "selector": "#submit-button",
      "xpath": "//button[@type='submit']"
    },
    "options": {
      "timeout": 5000,
      "waitForElement": true,
      "highlightElement": true
    }
  }
}
```

## Advanced Features

### Intelligent Request Routing

```typescript
export class IntelligentRouter {
  public async routeRequest(request: AutomationRequest): Promise<RoutingDecision> {
    const availableExtensions = await this.getAvailableExtensions();
    
    // Multi-factor routing decision
    const candidates = availableExtensions.map(ext => ({
      extension: ext,
      score: this.calculateRoutingScore(ext, request)
    }));

    const bestCandidate = candidates.reduce((best, current) => 
      current.score > best.score ? current : best
    );

    return {
      selectedExtension: bestCandidate.extension.id,
      reason: this.determineRoutingReason(bestCandidate),
      confidence: bestCandidate.score,
      alternatives: candidates
        .filter(c => c.extension.id !== bestCandidate.extension.id)
        .map(c => c.extension.id)
    };
  }
}
```

### Session Management

```typescript
export class SessionManager {
  @listen(CoordinationSessionStartedEvent)
  public async manageSession(event: CoordinationSessionStartedEvent): Promise<void> {
    const session = new AutomationSession({
      sessionId: event.sessionId,
      clientId: event.clientId,
      type: event.sessionType,
      configuration: event.configuration,
      startTime: new Date()
    });

    // Set up session monitoring
    this.setupSessionMonitoring(session);
    
    // Configure session timeout
    this.configureSessionTimeout(session);
    
    // Initialize session metrics
    this.initializeSessionMetrics(session);
  }
}
```

### Health Monitoring

```typescript
// Real-time health monitoring
export class HealthMonitor {
  public async performHealthCheck(): Promise<HealthStatus> {
    const components = await Promise.all([
      this.checkHttpServer(),
      this.checkWebSocketServer(),
      this.checkExtensionConnections(),
      this.checkSystemResources()
    ]);

    return {
      status: components.every(c => c.healthy) ? 'healthy' : 'degraded',
      timestamp: new Date(),
      components: components.reduce((acc, comp) => {
        acc[comp.name] = comp.status;
        return acc;
      }, {} as Record<string, string>),
      metrics: await this.collectMetrics()
    };
  }
}
```

## API Reference

### REST Endpoints

#### Server Management
- `GET /health` - Server health check
- `GET /info` - Server information and configuration
- `GET /api/metrics` - Performance and usage metrics

#### Extension Management  
- `GET /api/extensions` - List active extensions
- `GET /api/extensions/:id` - Get extension details
- `POST /api/extensions/:id/message` - Send message to extension

#### Automation
- `POST /api/automation/dispatch` - Dispatch automation request
- `GET /api/automation/status/:requestId` - Get request status
- `POST /api/automation/cancel/:requestId` - Cancel pending request

#### WebSocket
- `GET /api/websocket/info` - WebSocket connection information
- `GET /api/websocket/connections` - Active WebSocket connections

### WebSocket Events

#### From Extension to Server
```typescript
// Extension authentication
{
  "type": "authenticate",
  "extensionId": "my-extension",
  "metadata": {
    "version": "1.0.0",
    "capabilities": ["automation", "training"]
  }
}

// Heartbeat
{
  "type": "heartbeat", 
  "status": {
    "isHealthy": true,
    "activeConnections": 1,
    "resourceUsage": {
      "cpuPercent": 5.2,
      "memoryMB": 45
    }
  }
}

// Automation response
{
  "type": "automation_response",
  "requestId": "req_123",
  "success": true,
  "result": {
    "elementFound": true,
    "actionExecuted": true
  },
  "executionTime": 1500
}
```

#### From Server to Extension
```typescript
// Authentication success
{
  "type": "authentication_success",
  "extensionId": "my-extension",
  "timestamp": "2025-07-04T10:30:00Z"
}

// Automation request
{
  "type": "automation_request",
  "requestId": "req_123", 
  "payload": {
    "action": "click",
    "target": { "selector": "#button" }
  }
}

// Server announcement
{
  "type": "server_announcement",
  "message": "Server maintenance in 5 minutes",
  "severity": "warning"
}
```

## Configuration

### Environment Variables

```bash
# Server Configuration
PORT=3003
NODE_ENV=production
HOST=0.0.0.0

# Security
CORS_ORIGINS=http://localhost:3000,https://myapp.com
JWT_SECRET=your-secret-key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Features
ENABLE_WEBSOCKET=true
ENABLE_ANALYTICS=true
ENABLE_PATTERN_SHARING=true

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
ENABLE_REQUEST_LOGGING=true

# Performance
MAX_REQUEST_SIZE=10mb
REQUEST_TIMEOUT=30000
KEEP_ALIVE_TIMEOUT=5000
```

### Server Configuration Object

```typescript
export interface ServerConfiguration {
  port: number;
  host: string;
  environment: 'development' | 'staging' | 'production';
  
  logging: {
    level: 'debug' | 'info' | 'warn' | 'error';
    format: 'json' | 'text';
    destinations: string[];
    enableRequestLogging: boolean;
    enableErrorTracking: boolean;
  };
  
  security: {
    enableHTTPS: boolean;
    corsOrigins: string[];
    rateLimiting: RateLimitConfiguration;
    authentication: AuthenticationConfiguration;
    headers: SecurityHeadersConfiguration;
  };
  
  performance: {
    enableCompression: boolean;
    enableCaching: boolean;
    maxRequestSize: string;
    requestTimeout: number;
    keepAliveTimeout: number;
  };
  
  features: {
    enableWebSocket: boolean;
    enableFileUploads: boolean;
    enableExtensionManagement: boolean;
    enablePatternSharing: boolean;
    enableAnalytics: boolean;
  };
}
```

## Testing

### Unit Tests

```typescript
describe('CoordinationApplication', () => {
  let coordinator: CoordinationApplication;
  
  beforeEach(() => {
    coordinator = new CoordinationApplication();
  });

  it('should route automation requests to best available extension', async () => {
    // Setup test extensions
    const extensions = [
      createMockExtension('ext1', ['automation']),
      createMockExtension('ext2', ['automation', 'training'])
    ];

    const request = createAutomationRequest('click', '#button');
    const routing = await coordinator.routeRequest(request);
    
    expect(routing.selectedExtension).toBe('ext2');
    expect(routing.reason).toBe('best_capability');
  });
});
```

### Integration Tests

```typescript
describe('Server Integration', () => {
  let server: ServerApplication;
  
  beforeAll(async () => {
    server = new ServerApplication();
    await server.start(3003);
  });

  afterAll(async () => {
    await server.stop();
  });

  it('should handle automation requests end-to-end', async () => {
    // Connect mock extension
    const extension = await connectMockExtension();
    
    // Send automation request
    const response = await request(server.app)
      .post('/api/automation/dispatch')
      .send({
        extensionId: extension.id,
        action: 'click',
        payload: { selector: '#test' }
      })
      .expect(200);

    expect(response.body.requestId).toBeDefined();
    expect(response.body.status).toBe('accepted');
  });
});
```

## Performance

### Optimization Features

- **Connection Pooling**: Efficient WebSocket connection management
- **Request Batching**: Batch multiple automation requests for efficiency
- **Caching**: Intelligent caching of extension metadata and routing decisions
- **Load Balancing**: Distribute requests across available extensions
- **Circuit Breaking**: Prevent cascade failures with circuit breaker pattern

### Performance Metrics

```typescript
// Real-time performance monitoring
const metrics = await server.getMetrics();

console.log('Performance Metrics:', {
  requestsPerSecond: metrics.coordination.requestsPerSecond,
  averageResponseTime: metrics.coordination.averageResponseTime,
  activeConnections: metrics.websocket.activeConnections,
  errorRate: metrics.coordination.errorRate,
  memoryUsage: metrics.server.memory.heapUsed,
  cpuUsage: metrics.server.cpu.user
});
```

## Documentation

- 📖 [Complete Getting Started Guide](./docs/getting_started.org)
- 📚 [The Node.js Server Story](./docs/story.org) - Architecture evolution and design decisions
- 📋 [Development Journal](./docs/journal.org) - Technical decisions and lessons learned
- 🔧 [API Coordination Specification](./docs/specs/api-coordination-specification.org)
- 🌐 [WebSocket Communication Protocol](./docs/specs/websocket-protocol.org)
- 🛡️ [Security and Authentication Guide](./docs/specs/security-specification.org)

## Production Deployment

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY dist ./dist
EXPOSE 3003 3004

CMD ["node", "dist/index.js"]
```

### Docker Compose

```yaml
version: '3.8'
services:
  web-buddy-server:
    build: .
    ports:
      - "3003:3003"  # HTTP API
      - "3004:3004"  # WebSocket
    environment:
      - NODE_ENV=production
      - PORT=3003
      - CORS_ORIGINS=https://myapp.com
    restart: unless-stopped
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
```

### Kubernetes

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: web-buddy-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: web-buddy-server
  template:
    metadata:
      labels:
        app: web-buddy-server
    spec:
      containers:
      - name: server
        image: web-buddy/nodejs-server:latest
        ports:
        - containerPort: 3003
        - containerPort: 3004
        env:
        - name: NODE_ENV
          value: production
        - name: PORT
          value: "3003"
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](./LICENSE) file for details.

## Related Projects

- [@typescript-eda/domain](https://github.com/rydnr/typescript-eda-domain) - Domain layer primitives
- [@typescript-eda/infrastructure](https://github.com/rydnr/typescript-eda-infrastructure) - Infrastructure adapters  
- [@typescript-eda/application](https://github.com/rydnr/typescript-eda-application) - Application orchestration
- [@web-buddy/browser-extension](https://github.com/rydnr/web-buddy-browser-extension) - Browser extension framework
- [ChatGPT-Buddy](https://github.com/rydnr/chatgpt-buddy) - AI automation implementation

---

**Build scalable browser automation with intelligent coordination** 🚀