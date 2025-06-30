/*
                        ChatGPT-Buddy E2E Tests

    End-to-End testing for browser extension integration
    
    Test Flow: Client → Server → Browser Extension → Browser Tab
*/

import { test, expect, chromium, Page, BrowserContext } from '@playwright/test';
import { createApp } from '../../packages/chatgpt-buddy-server/src/infrastructure/express-app';
import { WebBuddyClient } from '../../packages/web-buddy-core/src/client';
import { Server } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';

describe('🌐 Browser Extension E2E Integration', () => {
  let server: Server;
  let wsServer: WebSocketServer;
  let client: any;
  let browser: any;
  let context: BrowserContext;
  let page: Page;
  const TEST_PORT = 3003; // Different port to avoid conflicts
  const EXTENSION_PATH = path.resolve(__dirname, '../../extension');

  beforeAll(async () => {
    // Start HTTP server with WebSocket support
    const app = createApp();
    server = app.listen(TEST_PORT);
    
    // Add WebSocket server for extension communication
    wsServer = new WebSocketServer({ 
      server,
      path: '/ws'
    });
    
    wsServer.on('connection', (ws) => {
      console.log('Browser extension connected to WebSocket');
      
      ws.on('message', (message) => {
        console.log('Received from extension:', message.toString());
        // Echo back for testing
        ws.send(JSON.stringify({
          type: 'ping-response',
          correlationId: 'test-correlation-id',
          data: 'Server received your message'
        }));
      });
    });
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Create Web-Buddy client
    client = new WebBuddyClient({
      serverUrl: `http://localhost:${TEST_PORT}`
    });

    // Launch browser with extension
    browser = await chromium.launch({
      headless: false, // Set to true for CI, false for debugging
      args: [
        `--disable-extensions-except=${EXTENSION_PATH}`,
        `--load-extension=${EXTENSION_PATH}`,
        '--no-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    // Create context and page
    context = await browser.newContext();
    page = await context.newPage();
    
    // Wait for extension to load and connect
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    if (page) await page.close();
    if (context) await context.close();
    if (browser) await browser.close();
    if (wsServer) wsServer.close();
    if (server) server.close();
  });

  /**
   * 🔴 RED: Test complete Client → Server → Extension → Browser flow
   */
  test('🔴 should send message from client through server to browser extension', async () => {
    // Arrange: Navigate to a test page
    await page.goto('https://example.com');
    
    // Act: Send event from client to server
    const automationEvent = {
      type: 'automationRequested',
      payload: {
        action: 'testAction',
        parameters: { message: 'Hello from E2E test!' },
        context: { testMode: true }
      },
      correlationId: `e2e-test-${Date.now()}`,
      timestamp: new Date(),
      eventId: `e2e-evt-${Date.now()}`,
      website: 'example.com'
    };

    const response = await client.sendEvent(automationEvent);
    
    // Assert: Verify server processed the event
    expect(response).toBeDefined();
    expect(response.correlationId).toBe(automationEvent.correlationId);
    
    // Wait for extension to process the message
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Assert: Check that extension received and processed the message
    // This will initially fail because WebSocket integration isn't complete
    const extensionLogs = await page.evaluate(() => {
      return (window as any).extensionTestData?.lastReceivedMessage;
    });
    
    expect(extensionLogs).toBeDefined();
    expect(extensionLogs.type).toBe('automationRequested');
    expect(extensionLogs.payload.action).toBe('testAction');
  });

  /**
   * 🔴 RED: Test extension can execute DOM actions in response to server commands
   */
  test('🔴 should execute DOM actions via extension when commanded by server', async () => {
    // Arrange: Navigate to a page with a form
    await page.setContent(`
      <html>
        <body>
          <input id="test-input" type="text" placeholder="Enter text here" />
          <button id="test-button">Click me</button>
          <div id="test-output"></div>
        </body>
      </html>
    `);

    // Act: Send automation command from client
    const fillInputEvent = {
      type: 'automationRequested',
      payload: {
        action: 'fillInput',
        parameters: { 
          selector: '#test-input',
          value: 'E2E test input value'
        },
        context: { source: 'e2e-test' }
      },
      correlationId: `e2e-fill-${Date.now()}`,
      timestamp: new Date(),
      eventId: `e2e-fill-evt-${Date.now()}`,
      website: 'localhost'
    };

    await client.sendEvent(fillInputEvent);
    
    // Wait for extension to process and execute the action
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Assert: Verify the DOM was modified by the extension
    const inputValue = await page.inputValue('#test-input');
    expect(inputValue).toBe('E2E test input value');
    
    // Verify the extension reported success back to server
    const lastResponse = await page.evaluate(() => {
      return (window as any).extensionTestData?.lastResponse;
    });
    
    expect(lastResponse).toBeDefined();
    expect(lastResponse.status).toBe('success');
    expect(lastResponse.correlationId).toBe(fillInputEvent.correlationId);
  });

  /**
   * 🔴 RED: Test real-time WebSocket communication with extension
   */
  test('🔴 should maintain persistent WebSocket connection with extension', async () => {
    // This test verifies the WebSocket connection is working
    let messageReceived = false;
    
    // Listen for WebSocket messages from extension
    wsServer.on('connection', (ws) => {
      ws.on('message', (message) => {
        const parsed = JSON.parse(message.toString());
        if (parsed.type === 'heartbeat') {
          messageReceived = true;
        }
      });
    });

    // Wait for extension to send heartbeat
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Assert: Extension should have sent heartbeat message
    expect(messageReceived).toBe(true);
    
    // Act: Send message directly via WebSocket to extension
    for (const ws of wsServer.clients) {
      ws.send(JSON.stringify({
        type: 'ping',
        correlationId: 'direct-ws-test',
        timestamp: new Date().toISOString()
      }));
    }
    
    // Wait for extension to respond
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Assert: Extension should have logged the received message
    const wsLogs = await page.evaluate(() => {
      return (window as any).extensionTestData?.webSocketMessages || [];
    });
    
    expect(wsLogs.length).toBeGreaterThan(0);
    expect(wsLogs.some((msg: any) => msg.type === 'ping')).toBe(true);
  });
});