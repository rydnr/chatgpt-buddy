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

import request from 'supertest';
import WebSocket from 'ws';
import { WebBuddyServer } from './server';

describe('WebBuddyServer', () => {
  let server: WebBuddyServer;
  const testPort = 3001;

  beforeEach(() => {
    server = new WebBuddyServer({
      port: testPort,
      logging: { level: 'error' } // Reduce log noise in tests
    });
  });

  afterEach(async () => {
    if (server.getStatus().isRunning) {
      await server.stop();
    }
  });

  describe('Server Lifecycle', () => {
    it('should start and stop successfully', async () => {
      expect(server.getStatus().isRunning).toBe(false);
      
      await server.start();
      expect(server.getStatus().isRunning).toBe(true);
      expect(server.getStatus().port).toBe(testPort);
      
      await server.stop();
      expect(server.getStatus().isRunning).toBe(false);
    });

    it('should not start twice', async () => {
      await server.start();
      await server.start(); // Should not throw
      expect(server.getStatus().isRunning).toBe(true);
    });
  });

  describe('HTTP API', () => {
    beforeEach(async () => {
      await server.start();
    });

    it('should respond to health check', async () => {
      const response = await request(`http://localhost:${testPort}`)
        .get('/health')
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'healthy',
        extensions: {
          connected: 0,
          list: []
        },
        version: '1.0.0'
      });
      expect(response.body.timestamp).toBeDefined();
      expect(response.body.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should handle message requests', async () => {
      const messageData = {
        SELECT_PROJECT: { projectName: 'test-project' },
        correlationId: 'test-123',
        timestamp: new Date().toISOString()
      };

      const response = await request(`http://localhost:${testPort}`)
        .post('/api/message')
        .send(messageData)
        .expect(404); // No extension connected

      expect(response.body).toMatchObject({
        success: false,
        error: 'No extension available for the specified tab',
        correlationId: 'test-123'
      });
    });

    it('should handle event requests', async () => {
      const eventData = {
        type: 'AutomationRequested',
        correlationId: 'event-123',
        payload: { action: 'click', selector: '#button' },
        timestamp: new Date().toISOString()
      };

      const response = await request(`http://localhost:${testPort}`)
        .post('/api/event')
        .send(eventData)
        .expect(404); // No extension connected

      expect(response.body).toMatchObject({
        success: false,
        error: 'No extension available for the specified tab'
      });
    });

    it('should list extensions', async () => {
      const response = await request(`http://localhost:${testPort}`)
        .get('/api/extensions')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: [],
        count: 0
      });
    });

    it('should get metrics', async () => {
      const response = await request(`http://localhost:${testPort}`)
        .get('/api/metrics')
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          extensions: {
            connected: 0,
            active: 0
          },
          requests: {
            pending: 0
          }
        }
      });
      expect(response.body.data.uptime).toBeGreaterThanOrEqual(0);
    });

    it('should return 404 for unknown extension', async () => {
      const response = await request(`http://localhost:${testPort}`)
        .get('/api/extensions/unknown-id')
        .expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: 'Extension not found'
      });
    });
  });

  describe('WebSocket Connections', () => {
    beforeEach(async () => {
      await server.start();
    });

    it('should accept WebSocket connections', (done) => {
      const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
      
      ws.on('open', () => {
        expect(server.getStatus().extensions).toBe(1);
        ws.close();
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        expect(message.type).toBe('welcome');
        expect(message.extensionId).toBeDefined();
        done();
      });

      ws.on('error', done);
    });

    it('should handle extension registration', (done) => {
      const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'register',
          tabId: 123,
          url: 'https://example.com',
          capabilities: ['click', 'type', 'extract'],
          metadata: { version: '1.0.0' }
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'welcome') {
          // Extension registered successfully
          setTimeout(() => {
            expect(server.getStatus().extensions).toBe(1);
            ws.close();
            done();
          }, 100);
        }
      });

      ws.on('error', done);
    });

    it('should handle extension disconnection', (done) => {
      const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
      
      ws.on('open', () => {
        expect(server.getStatus().extensions).toBe(1);
        ws.close();
      });

      ws.on('close', () => {
        setTimeout(() => {
          expect(server.getStatus().extensions).toBe(0);
          done();
        }, 100);
      });

      ws.on('error', done);
    });

    it('should handle heartbeat messages', (done) => {
      const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
      let heartbeatReceived = false;
      
      ws.on('open', () => {
        ws.send(JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString()
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'heartbeat_ack') {
          heartbeatReceived = true;
          ws.close();
        }
      });

      ws.on('close', () => {
        expect(heartbeatReceived).toBe(true);
        done();
      });

      ws.on('error', done);
    });
  });

  describe('Message Routing', () => {
    beforeEach(async () => {
      await server.start();
    });

    it('should route messages to connected extension', (done) => {
      const ws = new WebSocket(`ws://localhost:${testPort}/ws`);
      let welcomeReceived = false;
      
      ws.on('open', () => {
        // Register extension first
        ws.send(JSON.stringify({
          type: 'register',
          tabId: 456,
          url: 'https://test.com',
          capabilities: ['automation']
        }));
      });

      ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        
        if (message.type === 'welcome' && !welcomeReceived) {
          welcomeReceived = true;
          
          // Wait a bit for registration to process
          setTimeout(async () => {
            // Send HTTP request that should be routed to this extension
            // We don't await this since it will timeout
            request(`http://localhost:${testPort}`)
              .post('/api/message')
              .send({
                SELECT_PROJECT: { projectName: 'test' },
                tabId: 456,
                correlationId: 'route-test-123'
              })
              .end(() => {
                // Request completed (with timeout), but that's expected
              });
          }, 100);
        }
        
        if (message.type === 'request') {
          expect(message.correlationId).toBe('route-test-123');
          expect(message.data.SELECT_PROJECT.projectName).toBe('test');
          
          // Send a response back to complete the request
          ws.send(JSON.stringify({
            type: 'response',
            correlationId: 'route-test-123',
            data: { success: true, result: 'Project selected' }
          }));
          
          ws.close();
          done();
        }
      });

      ws.on('error', done);
    }, 10000); // Increase timeout
  });
});

describe('Factory function', () => {
  it('should create WebBuddyServer with correct configuration', () => {
    const { createWebBuddyServer } = require('./factory');
    
    const config = {
      port: 4000,
      cors: {
        enabled: true,
        origins: ['http://localhost:4000']
      }
    };

    const server = createWebBuddyServer(config);
    
    expect(server).toBeInstanceOf(WebBuddyServer);
    expect(server.getStatus().port).toBe(4000);
  });
});