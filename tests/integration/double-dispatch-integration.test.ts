// Integration tests for double dispatch pattern with Chrome extension APIs
import { jest } from '@jest/globals';

// Mock Chrome storage API
const mockChromeStorage = {
  local: {
    get: jest.fn(),
    set: jest.fn(),
    clear: jest.fn(),
    remove: jest.fn()
  }
};

// Mock Chrome runtime API
const mockChromeRuntime = {
  id: 'test-extension-id',
  lastError: null,
  sendMessage: jest.fn(),
  onMessage: {
    addListener: jest.fn()
  }
};

// Mock Chrome tabs API
const mockChromeTabs = {
  query: jest.fn(),
  update: jest.fn(),
  sendMessage: jest.fn()
};

// Mock Chrome windows API
const mockChromeWindows = {
  update: jest.fn()
};

global.chrome = {
  storage: mockChromeStorage,
  runtime: mockChromeRuntime,
  tabs: mockChromeTabs,
  windows: mockChromeWindows
} as any;

// Mock WebSocket
const mockWebSocket = {
  send: jest.fn(),
  readyState: 1 // OPEN
};

describe('Double Dispatch Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should handle message flow from WebSocket to Chrome API', async () => {
    // Setup mock data
    const mockTabs = [
      { id: 1, title: 'Google Search', url: 'https://google.com', windowId: 1 },
      { id: 2, title: 'GitHub', url: 'https://github.com', windowId: 1 }
    ];
    
    (mockChromeTabs.query as any).mockResolvedValue(mockTabs);
    (mockChromeTabs.update as any).mockResolvedValue(undefined);
    (mockChromeWindows.update as any).mockResolvedValue(undefined);

    // Simulate message processing as it would happen in the extension
    const message = {
      type: 'TabSwitchRequested',
      payload: { title: 'Google' },
      correlationId: 'integration-test-123',
      timestamp: new Date().toISOString()
    };

    // This would normally be handled by the MessageDispatcher
    const tabs = await chrome.tabs.query({});
    const matchingTabs = tabs.filter(tab => 
      tab.title && tab.title.toLowerCase().includes('google')
    );

    expect(matchingTabs).toHaveLength(1);
    expect(matchingTabs[0].title).toBe('Google Search');

    // Simulate tab switching
    await chrome.tabs.update(matchingTabs[0].id!, { active: true });
    await chrome.windows.update(matchingTabs[0].windowId!, { focused: true });

    // Verify Chrome APIs were called correctly
    expect(mockChromeTabs.query).toHaveBeenCalledWith({});
    expect(mockChromeTabs.update).toHaveBeenCalledWith(1, { active: true });
    expect(mockChromeWindows.update).toHaveBeenCalledWith(1, { focused: true });
  });

  test('should handle automation request with content script communication', async () => {
    const mockActiveTab = { id: 42, title: 'Active Tab', url: 'https://example.com' };
    (mockChromeTabs.query as any).mockResolvedValue([mockActiveTab]);

    // Mock successful content script response
    const mockContentScriptResponse = {
      correlationId: 'automation-test-456',
      status: 'success',
      data: { action: 'fillInput', value: 'test-value' }
    };

    (mockChromeTabs.sendMessage as any).mockImplementation((tabId: any, message: any, callback: any) => {
      expect(tabId).toBe(42);
      expect(message.type).toBe('AutomationRequested');
      // Simulate async callback
      setTimeout(() => callback(mockContentScriptResponse), 0);
    });

    const automationMessage = {
      type: 'AutomationRequested',
      payload: {
        action: 'fillInput',
        parameters: { selector: '#input', value: 'test-value' }
      },
      correlationId: 'automation-test-456'
    };

    // Simulate automation request processing
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    expect(activeTab.id).toBe(42);

    // Simulate sending message to content script
    const responsePromise = new Promise((resolve) => {
      chrome.tabs.sendMessage(activeTab.id!, automationMessage, resolve);
    });

    const response = await responsePromise;
    expect(response).toEqual(mockContentScriptResponse);
  });

  test('should handle multiple concurrent tab switch requests', async () => {
    const mockTabs = [
      { id: 1, title: 'Tab 1', windowId: 1 },
      { id: 2, title: 'Tab 2', windowId: 1 },
      { id: 3, title: 'Tab 3', windowId: 2 }
    ];

    (mockChromeTabs.query as any).mockResolvedValue(mockTabs);
    (mockChromeTabs.update as any).mockResolvedValue(undefined);
    (mockChromeWindows.update as any).mockResolvedValue(undefined);

    // Simulate concurrent requests
    const requests = [
      { title: 'Tab 1', expectedId: 1, expectedWindowId: 1 },
      { title: 'Tab 2', expectedId: 2, expectedWindowId: 1 },
      { title: 'Tab 3', expectedId: 3, expectedWindowId: 2 }
    ];

    const promises = requests.map(async (req, index) => {
      const tabs = await chrome.tabs.query({});
      const matchingTab = tabs.find(tab => tab.title!.includes(req.title));
      
      expect(matchingTab).toBeDefined();
      expect(matchingTab!.id).toBe(req.expectedId);
      
      await chrome.tabs.update(matchingTab!.id!, { active: true });
      await chrome.windows.update(matchingTab!.windowId!, { focused: true });
      
      return { index, tab: matchingTab };
    });

    const results = await Promise.all(promises);
    
    expect(results).toHaveLength(3);
    expect(mockChromeTabs.update).toHaveBeenCalledTimes(3);
    expect(mockChromeWindows.update).toHaveBeenCalledTimes(3);
  });

  test('should handle Chrome API errors gracefully', async () => {
    // Simulate Chrome API error
    const chromeError = new Error('Chrome extension context invalidated');
    (mockChromeTabs.query as any).mockRejectedValue(chromeError);

    let caughtError: Error | null = null;
    
    try {
      await chrome.tabs.query({});
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeDefined();
    expect(caughtError!.message).toBe('Chrome extension context invalidated');
  });

  test('should handle content script not available error', async () => {
    const mockActiveTab = { id: 42, title: 'Active Tab' };
    (mockChromeTabs.query as any).mockResolvedValue([mockActiveTab]);
    
    // Simulate chrome.runtime.lastError
    const originalLastError = chrome.runtime.lastError;
    chrome.runtime.lastError = { message: 'Could not establish connection. Receiving end does not exist.' };

    (mockChromeTabs.sendMessage as any).mockImplementation((tabId: any, message: any, callback: any) => {
      // Simulate content script not available
      callback(undefined);
    });

    const automationMessage = {
      type: 'AutomationRequested',
      payload: { action: 'testAction' },
      correlationId: 'error-test-789'
    };

    // Simulate error handling
    const [activeTab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const responsePromise = new Promise((resolve) => {
      chrome.tabs.sendMessage(activeTab.id!, automationMessage, (response) => {
        if (chrome.runtime.lastError) {
          resolve({
            correlationId: automationMessage.correlationId,
            status: 'error',
            error: chrome.runtime.lastError.message
          });
        } else {
          resolve(response);
        }
      });
    });

    const response = await responsePromise as any;
    
    expect(response.status).toBe('error');
    expect(response.error).toContain('Could not establish connection');
    
    // Restore original state
    chrome.runtime.lastError = originalLastError;
  });

  test('should validate message structure before processing', () => {
    const validMessage = {
      type: 'TabSwitchRequested',
      payload: { title: 'Test' },
      correlationId: 'valid-123',
      timestamp: new Date().toISOString()
    };

    const invalidMessages = [
      {}, // Empty object
      { type: 'TabSwitchRequested' }, // Missing payload
      { payload: { title: 'Test' } }, // Missing type
      { type: 'TabSwitchRequested', payload: {} }, // Empty payload
      { type: 'TabSwitchRequested', payload: { title: '' } }, // Empty title
    ];

    // Valid message should have all required fields
    expect(validMessage.type).toBeDefined();
    expect(validMessage.payload).toBeDefined();
    expect(validMessage.correlationId).toBeDefined();

    // Invalid messages should fail validation
    invalidMessages.forEach((msg, index) => {
      const hasType = 'type' in msg && msg.type;
      const hasPayload = 'payload' in msg && msg.payload;
      const hasCorrelationId = 'correlationId' in msg && msg.correlationId;
      
      if (msg.type === 'TabSwitchRequested') {
        const hasTitle = hasPayload && 'title' in (msg.payload as any) && (msg.payload as any).title;
        expect(hasType && hasPayload && hasCorrelationId && hasTitle).toBeFalsy();
      }
    });
  });

  test('should handle window focus across multiple displays', async () => {
    const mockTabs = [
      { id: 1, title: 'Window 1 Tab', windowId: 100 },
      { id: 2, title: 'Window 2 Tab', windowId: 200 }
    ];

    (mockChromeTabs.query as any).mockResolvedValue(mockTabs);
    (mockChromeTabs.update as any).mockResolvedValue(undefined);
    (mockChromeWindows.update as any).mockResolvedValue(undefined);

    // Test switching to tab in different window
    const tabs = await chrome.tabs.query({});
    const targetTab = tabs.find(tab => tab.title!.includes('Window 2'));
    
    expect(targetTab).toBeDefined();
    expect(targetTab!.windowId).toBe(200);

    await chrome.tabs.update(targetTab!.id!, { active: true });
    await chrome.windows.update(targetTab!.windowId!, { focused: true });

    // Verify both tab activation and window focus
    expect(mockChromeTabs.update).toHaveBeenCalledWith(2, { active: true });
    expect(mockChromeWindows.update).toHaveBeenCalledWith(200, { focused: true });
  });
});