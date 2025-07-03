// Unit tests for the double dispatch message handling pattern
import { jest } from '@jest/globals';

// Mock Chrome APIs
const mockChrome = {
  tabs: {
    query: jest.fn(),
    update: jest.fn(),
    sendMessage: jest.fn()
  },
  windows: {
    update: jest.fn()
  },
  runtime: {
    id: 'test-extension-id',
    lastError: null
  }
};

global.chrome = mockChrome as any;

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  readyState: 1 // OPEN
};

// Extend global object safely
declare global {
  var ws: any;
  var extensionId: string;
  var connectionStatus: any;
  var updateStatus: any;
  namespace globalThis {
    var extensionTestData: any;
  }
}

global.ws = mockWebSocket as any;
global.extensionId = 'test-extension-id';
global.connectionStatus = {
  connected: false,
  connecting: false,
  serverUrl: 'ws://localhost:3003/ws',
  lastMessage: 'None',
  lastError: '',
  autoReconnect: false
};

// Mock updateStatus function
global.updateStatus = jest.fn();

// Mock globalThis.extensionTestData
globalThis.extensionTestData = {
  lastReceivedMessage: null,
  lastResponse: null,
  webSocketMessages: []
};

// Import the classes we're testing (normally these would be in separate files)
abstract class MessageHandler {
  abstract handle(message: any): Promise<void> | void;
}

class AutomationRequestedHandler extends MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.id) {
        throw new Error('No active tab found');
      }
      
      chrome.tabs.sendMessage(tab.id, message, (response) => {
        if (chrome.runtime.lastError) {
          const errorResponse = {
            correlationId: message.correlationId,
            status: 'error',
            error: chrome.runtime.lastError.message || 'Content script not reachable',
            timestamp: new Date().toISOString()
          };
          
          (global as any).ws?.send(JSON.stringify(errorResponse));
          (globalThis as any).extensionTestData.lastResponse = errorResponse;
        } else {
          (global as any).ws?.send(JSON.stringify(response));
          (globalThis as any).extensionTestData.lastResponse = response;
        }
      });
      
    } catch (error) {
      const errorResponse = {
        correlationId: message.correlationId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      };
      
      (global as any).ws?.send(JSON.stringify(errorResponse));
      (globalThis as any).extensionTestData.lastResponse = errorResponse;
    }
  }
}

class TabSwitchRequestedHandler extends MessageHandler {
  async handle(message: any): Promise<void> {
    try {
      const { payload, correlationId } = message;
      const { title } = payload;
      
      const tabs = await chrome.tabs.query({});
      const matchingTabs = tabs.filter(tab => 
        tab.title && tab.title.toLowerCase().includes(title.toLowerCase())
      );
      
      if (matchingTabs.length === 0) {
        const errorResponse = {
          correlationId: correlationId,
          status: 'error',
          error: `No tab found with title containing: "${title}"`,
          timestamp: new Date().toISOString(),
          availableTabs: tabs.map(tab => ({ id: tab.id, title: tab.title, url: tab.url }))
        };
        (global as any).ws?.send(JSON.stringify(errorResponse));
        (globalThis as any).extensionTestData.lastResponse = errorResponse;
        return;
      }
      
      const targetTab = matchingTabs[0];
      await chrome.tabs.update(targetTab.id!, { active: true });
      await chrome.windows.update(targetTab.windowId!, { focused: true });
      
      const successResponse = {
        correlationId: correlationId,
        status: 'success',
        data: {
          action: 'TabSwitchRequested',
          switchedTo: {
            id: targetTab.id,
            title: targetTab.title,
            url: targetTab.url,
            windowId: targetTab.windowId
          },
          totalMatches: matchingTabs.length
        },
        timestamp: new Date().toISOString()
      };
      
      (global as any).ws?.send(JSON.stringify(successResponse));
      (globalThis as any).extensionTestData.lastResponse = successResponse;
      
    } catch (error) {
      const errorResponse = {
        correlationId: message.correlationId,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown tab switch error',
        timestamp: new Date().toISOString()
      };
      (global as any).ws?.send(JSON.stringify(errorResponse));
      (globalThis as any).extensionTestData.lastResponse = errorResponse;
    }
  }
}

class PingHandler extends MessageHandler {
  handle(message: any): void {
    const pongResponse = {
      type: 'pong',
      correlationId: message.correlationId,
      payload: {
        originalMessage: message.payload || 'ping',
        extensionId: (global as any).extensionId,
        timestamp: new Date().toISOString()
      }
    };
    (global as any).ws?.send(JSON.stringify(pongResponse));
    (globalThis as any).extensionTestData.lastResponse = pongResponse;
  }
}

class RegistrationAckHandler extends MessageHandler {
  handle(message: any): void {
    (global as any).connectionStatus.lastMessage = 'Registered with server';
    (global as any).updateStatus();
  }
}

class HeartbeatAckHandler extends MessageHandler {
  handle(message: any): void {
    (global as any).connectionStatus.lastMessage = `Heartbeat (${new Date().toLocaleTimeString()})`;
    (global as any).updateStatus();
  }
}

class MessageDispatcher {
  private handlers: Map<string, MessageHandler> = new Map();

  constructor() {
    this.registerHandlers();
  }

  private registerHandlers(): void {
    // Using camel case for consistency
    this.handlers.set('AutomationRequested', new AutomationRequestedHandler());
    this.handlers.set('TabSwitchRequested', new TabSwitchRequestedHandler());
    this.handlers.set('Ping', new PingHandler());
    this.handlers.set('RegistrationAck', new RegistrationAckHandler());
    this.handlers.set('HeartbeatAck', new HeartbeatAckHandler());
    
    // Keep legacy names for backward compatibility
    this.handlers.set('automationRequested', new AutomationRequestedHandler());
    this.handlers.set('ping', new PingHandler());
    this.handlers.set('registrationAck', new RegistrationAckHandler());
    this.handlers.set('heartbeatAck', new HeartbeatAckHandler());
  }

  async dispatch(message: any): Promise<void> {
    const handler = this.handlers.get(message.type);
    
    if (handler) {
      await handler.handle(message);
    } else {
      console.log('⚠️ Unknown message type:', message.type);
    }
  }

  registerHandler(messageType: string, handler: MessageHandler): void {
    this.handlers.set(messageType, handler);
  }

  getRegisteredHandlers(): string[] {
    return Array.from(this.handlers.keys());
  }
}

describe('Message Dispatcher Tests', () => {
  let dispatcher: MessageDispatcher;

  beforeEach(() => {
    dispatcher = new MessageDispatcher();
    jest.clearAllMocks();
    
    // Reset test data
    (globalThis as any).extensionTestData.lastResponse = null;
    (globalThis as any).extensionTestData.lastReceivedMessage = null;
  });

  describe('Handler Registration', () => {
    test('should register all default handlers', () => {
      const handlers = dispatcher.getRegisteredHandlers();
      
      // Check camel case handlers
      expect(handlers).toContain('AutomationRequested');
      expect(handlers).toContain('TabSwitchRequested');
      expect(handlers).toContain('Ping');
      expect(handlers).toContain('RegistrationAck');
      expect(handlers).toContain('HeartbeatAck');
      
      // Check legacy handlers for backward compatibility
      expect(handlers).toContain('automationRequested');
      expect(handlers).toContain('ping');
      expect(handlers).toContain('registrationAck');
      expect(handlers).toContain('heartbeatAck');
    });

    test('should allow dynamic handler registration', () => {
      class CustomHandler extends MessageHandler {
        handle(message: any): void {
          // Custom implementation
        }
      }

      dispatcher.registerHandler('CustomEvent', new CustomHandler());
      const handlers = dispatcher.getRegisteredHandlers();
      
      expect(handlers).toContain('CustomEvent');
    });
  });

  describe('AutomationRequested Handler', () => {
    test('should handle automation requests successfully', async () => {
      const mockTab = { id: 123, title: 'Test Tab' };
      (mockChrome.tabs.query as any).mockResolvedValue([mockTab]);
      
      const message = {
        type: 'AutomationRequested',
        correlationId: 'test-123',
        payload: { action: 'testAction' }
      };

      await dispatcher.dispatch(message);

      expect(mockChrome.tabs.query).toHaveBeenCalledWith({ active: true, currentWindow: true });
      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(mockTab.id, message, expect.any(Function));
    });

    test('should handle error when no active tab found', async () => {
      (mockChrome.tabs.query as any).mockResolvedValue([{}]); // Tab without id

      const message = {
        type: 'AutomationRequested',
        correlationId: 'test-123',
        payload: { action: 'testAction' }
      };

      await dispatcher.dispatch(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"status":"error"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('No active tab found')
      );
    });
  });

  describe('TabSwitchRequested Handler', () => {
    test('should switch to tab with matching title', async () => {
      const mockTabs = [
        { id: 1, title: 'Facebook', url: 'https://facebook.com', windowId: 1 },
        { id: 2, title: 'Google Search', url: 'https://google.com', windowId: 1 },
        { id: 3, title: 'GitHub', url: 'https://github.com', windowId: 1 }
      ];
      
      (mockChrome.tabs.query as any).mockResolvedValue(mockTabs);
      (mockChrome.tabs.update as any).mockResolvedValue(undefined);
      (mockChrome.windows.update as any).mockResolvedValue(undefined);

      const message = {
        type: 'TabSwitchRequested',
        correlationId: 'tab-switch-123',
        payload: { title: 'Google' }
      };

      await dispatcher.dispatch(message);

      expect(mockChrome.tabs.update).toHaveBeenCalledWith(2, { active: true });
      expect(mockChrome.windows.update).toHaveBeenCalledWith(1, { focused: true });
      
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"status":"success"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Google Search')
      );
    });

    test('should handle case-insensitive title matching', async () => {
      const mockTabs = [
        { id: 1, title: 'GOOGLE SEARCH', url: 'https://google.com', windowId: 1 }
      ];
      
      (mockChrome.tabs.query as any).mockResolvedValue(mockTabs);

      const message = {
        type: 'TabSwitchRequested',
        correlationId: 'tab-switch-123',
        payload: { title: 'google' }
      };

      await dispatcher.dispatch(message);

      expect(mockChrome.tabs.update).toHaveBeenCalledWith(1, { active: true });
    });

    test('should handle no matching tabs', async () => {
      const mockTabs = [
        { id: 1, title: 'Facebook', url: 'https://facebook.com', windowId: 1 }
      ];
      
      (mockChrome.tabs.query as any).mockResolvedValue(mockTabs);

      const message = {
        type: 'TabSwitchRequested',
        correlationId: 'tab-switch-123',
        payload: { title: 'NonExistentTitle' }
      };

      await dispatcher.dispatch(message);

      expect(mockChrome.tabs.update).not.toHaveBeenCalled();
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"status":"error"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('No tab found with title containing')
      );
    });

    test('should return available tabs in error response', async () => {
      const mockTabs = [
        { id: 1, title: 'Facebook', url: 'https://facebook.com', windowId: 1 },
        { id: 2, title: 'GitHub', url: 'https://github.com', windowId: 1 }
      ];
      
      (mockChrome.tabs.query as any).mockResolvedValue(mockTabs);

      const message = {
        type: 'TabSwitchRequested',
        correlationId: 'tab-switch-123',
        payload: { title: 'NonExistent' }
      };

      await dispatcher.dispatch(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('availableTabs')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Facebook')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('GitHub')
      );
    });
  });

  describe('Ping Handler', () => {
    test('should respond to ping with pong', async () => {
      const message = {
        type: 'Ping',
        correlationId: 'ping-123',
        payload: 'test-ping'
      };

      await dispatcher.dispatch(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('ping-123')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('test-extension-id')
      );
    });

    test('should handle ping without payload', async () => {
      const message = {
        type: 'Ping',
        correlationId: 'ping-123'
      };

      await dispatcher.dispatch(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"originalMessage":"ping"')
      );
    });
  });

  describe('Registration and Heartbeat Handlers', () => {
    test('should handle registration acknowledgment', async () => {
      const message = {
        type: 'RegistrationAck',
        correlationId: 'reg-123'
      };

      await dispatcher.dispatch(message);

      expect((global as any).connectionStatus.lastMessage).toBe('Registered with server');
      expect((global as any).updateStatus).toHaveBeenCalled();
    });

    test('should handle heartbeat acknowledgment', async () => {
      const message = {
        type: 'HeartbeatAck',
        correlationId: 'heartbeat-123'
      };

      await dispatcher.dispatch(message);

      expect((global as any).connectionStatus.lastMessage).toContain('Heartbeat');
      expect((global as any).updateStatus).toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility', () => {
    test('should handle legacy lowercase message types', async () => {
      const message = {
        type: 'ping',
        correlationId: 'legacy-ping-123'
      };

      await dispatcher.dispatch(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"type":"pong"')
      );
    });

    test('should handle legacy automationRequested', async () => {
      const mockTab = { id: 123, title: 'Test Tab' };
      (mockChrome.tabs.query as any).mockResolvedValue([mockTab]);

      const message = {
        type: 'automationRequested',
        correlationId: 'legacy-automation-123',
        payload: { action: 'testAction' }
      };

      await dispatcher.dispatch(message);

      expect(mockChrome.tabs.sendMessage).toHaveBeenCalledWith(mockTab.id, message, expect.any(Function));
    });
  });

  describe('Unknown Message Types', () => {
    test('should handle unknown message types gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      const message = {
        type: 'UnknownMessageType',
        correlationId: 'unknown-123'
      };

      await dispatcher.dispatch(message);

      expect(consoleSpy).toHaveBeenCalledWith('⚠️ Unknown message type:', 'UnknownMessageType');
      
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    test('should handle Chrome API errors in tab switching', async () => {
      (mockChrome.tabs.query as any).mockRejectedValue(new Error('Chrome API error'));

      const message = {
        type: 'TabSwitchRequested',
        correlationId: 'error-test-123',
        payload: { title: 'Google' }
      };

      await dispatcher.dispatch(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"status":"error"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Chrome API error')
      );
    });

    test('should handle Chrome API errors in automation requests', async () => {
      (mockChrome.tabs.query as any).mockRejectedValue(new Error('Tab query failed'));

      const message = {
        type: 'AutomationRequested',
        correlationId: 'error-test-123',
        payload: { action: 'testAction' }
      };

      await dispatcher.dispatch(message);

      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('"status":"error"')
      );
      expect(mockWebSocket.send).toHaveBeenCalledWith(
        expect.stringContaining('Tab query failed')
      );
    });
  });
});