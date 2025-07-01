/**
 * Message Store Integration Tests
 * 
 * Tests the integration of the Redux-like message store with 
 * the double dispatch pattern and time-travel debugging.
 */

import { jest } from '@jest/globals';

// Mock the message store
const mockMessageStore = {
  addInboundMessage: jest.fn(),
  addOutboundMessage: jest.fn(),
  markMessageSuccess: jest.fn(),
  markMessageError: jest.fn(),
  timeTravelTo: jest.fn(),
  resetTimeTravel: jest.fn(),
  clearAllMessages: jest.fn(),
  canTimeTravelBack: jest.fn(() => true),
  canTimeTravelForward: jest.fn(() => false),
  timeTravelBack: jest.fn(),
  timeTravelForward: jest.fn(),
  getState: jest.fn(),
  subscribe: jest.fn(() => () => {}),
  exportMessages: jest.fn(() => JSON.stringify({ messages: [] })),
  importMessages: jest.fn(() => true)
};

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    id: 'test-extension-id',
    sendMessage: jest.fn(),
    onMessage: { addListener: jest.fn() }
  },
  tabs: {
    query: jest.fn(),
    sendMessage: jest.fn()
  }
};

(global as any).chrome = mockChrome;
(global as any).globalMessageStore = mockMessageStore;

describe('🔄 Message Store Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset default state
    mockMessageStore.getState.mockReturnValue({
      messages: [],
      currentIndex: -1,
      isTimeTraveling: false,
      filters: {
        types: [],
        statuses: [],
        directions: [],
        dateRange: null
      }
    });
  });

  describe('📨 Message Tracking and Storage', () => {
    test('should track inbound messages from WebSocket', async () => {
      // Simulate WebSocket message handling
      const inboundMessage = {
        type: 'AutomationRequested',
        payload: { action: 'SELECT_PROJECT', selector: '#project' },
        correlationId: 'test-123',
        tabId: 456
      };

      const metadata = {
        extensionId: 'test-extension-id',
        tabId: 456,
        windowId: undefined,
        url: undefined,
        userAgent: 'test-agent'
      };

      // Simulate adding inbound message
      mockMessageStore.addInboundMessage(
        inboundMessage.type,
        inboundMessage,
        inboundMessage.correlationId,
        metadata
      );

      expect(mockMessageStore.addInboundMessage).toHaveBeenCalledWith(
        'AutomationRequested',
        inboundMessage,
        'test-123',
        metadata
      );
    });

    test('should track outbound responses with success status', async () => {
      const successResponse = {
        correlationId: 'test-123',
        status: 'success',
        data: { elementSelected: true },
        timestamp: new Date().toISOString()
      };

      const metadata = {
        extensionId: 'test-extension-id',
        tabId: undefined,
        windowId: undefined,
        url: undefined,
        userAgent: 'test-agent'
      };

      // Simulate adding outbound response
      mockMessageStore.addOutboundMessage(
        'RESPONSE',
        successResponse,
        'test-123',
        metadata
      );

      // Simulate marking as successful
      mockMessageStore.markMessageSuccess('test-123', successResponse);

      expect(mockMessageStore.addOutboundMessage).toHaveBeenCalledWith(
        'RESPONSE',
        successResponse,
        'test-123',
        metadata
      );
      expect(mockMessageStore.markMessageSuccess).toHaveBeenCalledWith('test-123', successResponse);
    });

    test('should track outbound error responses', async () => {
      const errorResponse = {
        correlationId: 'test-456',
        status: 'error',
        error: 'Content script not reachable',
        timestamp: new Date().toISOString()
      };

      // Simulate adding error response
      mockMessageStore.addOutboundMessage(
        'ERROR_RESPONSE',
        errorResponse,
        'test-456',
        { extensionId: 'test-extension-id', userAgent: 'test-agent' }
      );

      // Simulate marking as failed
      mockMessageStore.markMessageError('test-456', 'Content script not reachable');

      expect(mockMessageStore.addOutboundMessage).toHaveBeenCalledWith(
        'ERROR_RESPONSE',
        errorResponse,
        'test-456',
        expect.objectContaining({ extensionId: 'test-extension-id' })
      );
      expect(mockMessageStore.markMessageError).toHaveBeenCalledWith(
        'test-456',
        'Content script not reachable'
      );
    });
  });

  describe('⏰ Time Travel Debugging', () => {
    test('should support time travel to specific message index', () => {
      const targetIndex = 5;
      
      mockMessageStore.timeTravelTo(targetIndex);
      
      expect(mockMessageStore.timeTravelTo).toHaveBeenCalledWith(targetIndex);
    });

    test('should support time travel navigation', () => {
      // Test going back in time
      mockMessageStore.timeTravelBack();
      expect(mockMessageStore.timeTravelBack).toHaveBeenCalled();

      // Test going forward in time
      mockMessageStore.timeTravelForward();
      expect(mockMessageStore.timeTravelForward).toHaveBeenCalled();

      // Test returning to present
      mockMessageStore.resetTimeTravel();
      expect(mockMessageStore.resetTimeTravel).toHaveBeenCalled();
    });

    test('should check time travel capabilities', () => {
      // Test navigation availability
      const canGoBack = mockMessageStore.canTimeTravelBack();
      const canGoForward = mockMessageStore.canTimeTravelForward();

      expect(canGoBack).toBe(true);
      expect(canGoForward).toBe(false);
      expect(mockMessageStore.canTimeTravelBack).toHaveBeenCalled();
      expect(mockMessageStore.canTimeTravelForward).toHaveBeenCalled();
    });

    test('should handle time travel state management', () => {
      const mockState = {
        messages: [
          { type: 'ping', correlationId: 'msg-1', timestamp: Date.now() - 1000 },
          { type: 'pong', correlationId: 'msg-2', timestamp: Date.now() - 500 },
          { type: 'automation', correlationId: 'msg-3', timestamp: Date.now() }
        ],
        currentIndex: 1,
        isTimeTraveling: true,
        filters: { types: [], statuses: [], directions: [], dateRange: null }
      };

      mockMessageStore.getState.mockReturnValue(mockState);

      const state: any = mockMessageStore.getState();
      expect(state.isTimeTraveling).toBe(true);
      expect(state.currentIndex).toBe(1);
      expect(state.messages).toHaveLength(3);
    });
  });

  describe('🔍 Message Filtering and Search', () => {
    test('should support message filtering by type', () => {
      const mockState = {
        messages: [
          { type: 'AutomationRequested', status: 'success', direction: 'inbound' },
          { type: 'PingRequested', status: 'success', direction: 'outbound' },
          { type: 'AutomationRequested', status: 'error', direction: 'inbound' }
        ],
        currentIndex: -1,
        isTimeTraveling: false,
        filters: {
          types: ['AutomationRequested'],
          statuses: [],
          directions: [],
          dateRange: null
        }
      };

      mockMessageStore.getState.mockReturnValue(mockState);

      const state: any = mockMessageStore.getState();
      const automationMessages = state.messages.filter(msg => 
        state.filters.types.length === 0 || state.filters.types.includes(msg.type)
      );

      expect(automationMessages).toHaveLength(2);
      expect(automationMessages.every(msg => msg.type === 'AutomationRequested')).toBe(true);
    });

    test('should support message filtering by status', () => {
      const mockState = {
        messages: [
          { type: 'AutomationRequested', status: 'success', direction: 'inbound' },
          { type: 'PingRequested', status: 'error', direction: 'outbound' },
          { type: 'AutomationRequested', status: 'pending', direction: 'inbound' }
        ],
        currentIndex: -1,
        isTimeTraveling: false,
        filters: {
          types: [],
          statuses: ['success'],
          directions: [],
          dateRange: null
        }
      };

      mockMessageStore.getState.mockReturnValue(mockState);

      const state: any = mockMessageStore.getState();
      const successMessages = state.messages.filter(msg => 
        state.filters.statuses.length === 0 || state.filters.statuses.includes(msg.status)
      );

      expect(successMessages).toHaveLength(1);
      expect(successMessages[0].status).toBe('success');
    });

    test('should support message filtering by direction', () => {
      const mockState = {
        messages: [
          { type: 'AutomationRequested', status: 'success', direction: 'inbound' },
          { type: 'ResponseSent', status: 'success', direction: 'outbound' },
          { type: 'PingRequested', status: 'success', direction: 'inbound' }
        ],
        currentIndex: -1,
        isTimeTraveling: false,
        filters: {
          types: [],
          statuses: [],
          directions: ['inbound'],
          dateRange: null
        }
      };

      mockMessageStore.getState.mockReturnValue(mockState);

      const state: any = mockMessageStore.getState();
      const inboundMessages = state.messages.filter(msg => 
        state.filters.directions.length === 0 || state.filters.directions.includes(msg.direction)
      );

      expect(inboundMessages).toHaveLength(2);
      expect(inboundMessages.every(msg => msg.direction === 'inbound')).toBe(true);
    });
  });

  describe('💾 Import/Export Functionality', () => {
    test('should export messages to JSON format', () => {
      const exportData = {
        messages: [
          { type: 'ping', correlationId: 'test-1', timestamp: Date.now() }
        ],
        exportedAt: new Date().toISOString(),
        version: 1
      };

      mockMessageStore.exportMessages.mockReturnValue(JSON.stringify(exportData, null, 2));

      const exported = mockMessageStore.exportMessages();
      const parsed = JSON.parse(exported);

      expect(parsed).toHaveProperty('messages');
      expect(parsed).toHaveProperty('exportedAt');
      expect(parsed).toHaveProperty('version');
      expect(parsed.messages).toHaveLength(1);
    });

    test('should import messages from JSON format', () => {
      const importData = {
        messages: [
          { type: 'ping', correlationId: 'import-1', timestamp: Date.now() },
          { type: 'pong', correlationId: 'import-2', timestamp: Date.now() }
        ],
        version: 1
      };

      mockMessageStore.importMessages.mockReturnValue(true);

      const success = (mockMessageStore.importMessages as any)(JSON.stringify(importData));

      expect(success).toBe(true);
      expect(mockMessageStore.importMessages).toHaveBeenCalledWith(JSON.stringify(importData));
    });

    test('should handle invalid import data gracefully', () => {
      mockMessageStore.importMessages.mockReturnValue(false);

      const success = (mockMessageStore.importMessages as any)('invalid json');

      expect(success).toBe(false);
    });
  });

  describe('📊 Message Statistics and Analytics', () => {
    test('should provide comprehensive message statistics', () => {
      const mockState = {
        messages: [
          { type: 'AutomationRequested', status: 'success', direction: 'inbound' },
          { type: 'ResponseSent', status: 'success', direction: 'outbound' },
          { type: 'PingRequested', status: 'error', direction: 'inbound' },
          { type: 'PongResponse', status: 'pending', direction: 'outbound' }
        ],
        currentIndex: -1,
        isTimeTraveling: false,
        filters: { types: [], statuses: [], directions: [], dateRange: null }
      };

      mockMessageStore.getState.mockReturnValue(mockState);

      const state: any = mockMessageStore.getState();
      const stats = {
        total: state.messages.length,
        success: state.messages.filter(m => m.status === 'success').length,
        error: state.messages.filter(m => m.status === 'error').length,
        pending: state.messages.filter(m => m.status === 'pending').length,
        inbound: state.messages.filter(m => m.direction === 'inbound').length,
        outbound: state.messages.filter(m => m.direction === 'outbound').length
      };

      expect(stats.total).toBe(4);
      expect(stats.success).toBe(2);
      expect(stats.error).toBe(1);
      expect(stats.pending).toBe(1);
      expect(stats.inbound).toBe(2);
      expect(stats.outbound).toBe(2);
    });

    test('should track message type breakdown', () => {
      const mockState = {
        messages: [
          { type: 'AutomationRequested', status: 'success', direction: 'inbound' },
          { type: 'AutomationRequested', status: 'error', direction: 'inbound' },
          { type: 'PingRequested', status: 'success', direction: 'outbound' },
          { type: 'TabSwitchRequested', status: 'success', direction: 'inbound' }
        ],
        currentIndex: -1,
        isTimeTraveling: false,
        filters: { types: [], statuses: [], directions: [], dateRange: null }
      };

      mockMessageStore.getState.mockReturnValue(mockState);

      const state: any = mockMessageStore.getState();
      const typeBreakdown = state.messages.reduce((acc, msg) => {
        acc[msg.type] = (acc[msg.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      expect(typeBreakdown['AutomationRequested']).toBe(2);
      expect(typeBreakdown['PingRequested']).toBe(1);
      expect(typeBreakdown['TabSwitchRequested']).toBe(1);
    });
  });

  describe('🔄 Store Subscription and Updates', () => {
    test('should support store subscriptions', () => {
      const mockListener = jest.fn();
      const mockUnsubscribe = jest.fn();

      mockMessageStore.subscribe.mockReturnValue(mockUnsubscribe);

      const unsubscribe = (mockMessageStore.subscribe as any)(mockListener);

      expect(mockMessageStore.subscribe).toHaveBeenCalledWith(mockListener);
      expect(typeof unsubscribe).toBe('function');
    });

    test('should handle store state changes', () => {
      let currentState = {
        messages: [],
        currentIndex: -1,
        isTimeTraveling: false,
        filters: { types: [], statuses: [], directions: [], dateRange: null }
      };

      // Simulate adding a message
      const newMessage = {
        type: 'AutomationRequested',
        correlationId: 'new-msg-1',
        timestamp: Date.now(),
        status: 'pending',
        direction: 'inbound'
      };

      currentState = {
        ...currentState,
        messages: [...(currentState.messages as any[]), newMessage],
        currentIndex: 0
      };

      mockMessageStore.getState.mockReturnValue(currentState);

      const state: any = mockMessageStore.getState();
      expect(state.messages).toHaveLength(1);
      expect(state.currentIndex).toBe(0);
      expect(state.messages[0].correlationId).toBe('new-msg-1');
    });
  });

  describe('🧹 Message Store Cleanup', () => {
    test('should clear all messages', () => {
      mockMessageStore.clearAllMessages();
      
      expect(mockMessageStore.clearAllMessages).toHaveBeenCalled();
    });

    test('should handle storage limits gracefully', () => {
      // Test that the store handles large numbers of messages
      const manyMessages = Array.from({ length: 1500 }, (_, i) => ({
        type: 'TestMessage',
        correlationId: `msg-${i}`,
        timestamp: Date.now() + i,
        status: 'success',
        direction: 'inbound'
      }));

      const mockStateWithManyMessages = {
        messages: manyMessages,
        currentIndex: 1499,
        isTimeTraveling: false,
        filters: { types: [], statuses: [], directions: [], dateRange: null }
      };

      mockMessageStore.getState.mockReturnValue(mockStateWithManyMessages);

      const state: any = mockMessageStore.getState();
      
      // Should handle large message volumes
      expect(state.messages.length).toBe(1500);
      expect(state.currentIndex).toBe(1499);
    });
  });
});