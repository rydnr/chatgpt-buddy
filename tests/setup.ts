// Test setup file for global configuration
import 'reflect-metadata';

// Global test configuration
global.console = {
  ...console,
  // Suppress console.log during tests unless explicitly needed
  log: process.env.JEST_VERBOSE ? console.log : jest.fn(),
  debug: process.env.JEST_VERBOSE ? console.debug : jest.fn(),
  info: process.env.JEST_VERBOSE ? console.info : jest.fn(),
  warn: console.warn,
  error: console.error,
};

// Mock browser APIs for tests
Object.defineProperty(global, 'window', {
  value: {
    webBuddyStorage: {
      saveAutomationPattern: jest.fn().mockResolvedValue(true),
      getAutomationPatterns: jest.fn().mockResolvedValue([]),
      saveUserInteraction: jest.fn().mockResolvedValue(true),
      getUserInteractions: jest.fn().mockResolvedValue([]),
      saveWebsiteConfig: jest.fn().mockResolvedValue(true),
      getWebsiteConfig: jest.fn().mockResolvedValue({}),
      getStorageStats: jest.fn().mockResolvedValue({
        patterns: 0,
        interactions: 0,
        configs: 0,
        totalSize: 0
      }),
      clearOldData: jest.fn().mockResolvedValue(true)
    },
    location: {
      hostname: 'localhost',
      pathname: '/test',
      search: '',
      href: 'http://localhost/test'
    },
    document: {
      title: 'Test Page'
    }
  },
  writable: true
});

// Mock Chrome extension APIs
Object.defineProperty(global, 'chrome', {
  value: {
    runtime: {
      sendMessage: jest.fn(),
      onMessage: {
        addListener: jest.fn()
      },
      lastError: null
    },
    tabs: {
      sendMessage: jest.fn(),
      query: jest.fn()
    },
    downloads: {
      download: jest.fn().mockImplementation((options, callback) => {
        callback && callback(123); // Mock download ID
      }),
      onChanged: {
        addListener: jest.fn()
      },
      onCreated: {
        addListener: jest.fn()
      },
      search: jest.fn().mockImplementation((query, callback) => {
        callback([{
          id: 123,
          url: 'http://example.com/file.pdf',
          filename: 'file.pdf',
          state: 'complete',
          bytesReceived: 1000,
          totalBytes: 1000
        }]);
      })
    },
    storage: {
      local: {
        get: jest.fn().mockResolvedValue({}),
        set: jest.fn().mockResolvedValue(undefined),
        clear: jest.fn().mockResolvedValue(undefined)
      }
    }
  },
  writable: true
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.WEB_BUDDY_API_KEY = 'test-api-key';
process.env.WEB_BUDDY_SERVER_URL = 'http://localhost:3000';

// Increase timeout for integration tests
jest.setTimeout(30000);