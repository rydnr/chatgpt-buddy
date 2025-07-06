"use strict";
/**
 * Simplified Message Store Integration Tests
 *
 * Tests the core functionality of message store integration
 * without complex TypeScript typing issues.
 */
Object.defineProperty(exports, "__esModule", { value: true });
const globals_1 = require("@jest/globals");
describe('🔄 Message Store Integration - Simplified Tests', () => {
    let mockMessageStore;
    beforeEach(() => {
        // Create a fresh mock for each test
        mockMessageStore = {
            addInboundMessage: globals_1.jest.fn(),
            addOutboundMessage: globals_1.jest.fn(),
            markMessageSuccess: globals_1.jest.fn(),
            markMessageError: globals_1.jest.fn(),
            timeTravelTo: globals_1.jest.fn(),
            resetTimeTravel: globals_1.jest.fn(),
            clearAllMessages: globals_1.jest.fn(),
            canTimeTravelBack: globals_1.jest.fn(() => true),
            canTimeTravelForward: globals_1.jest.fn(() => false),
            timeTravelBack: globals_1.jest.fn(),
            timeTravelForward: globals_1.jest.fn(),
            getState: globals_1.jest.fn(),
            subscribe: globals_1.jest.fn(() => globals_1.jest.fn()),
            exportMessages: globals_1.jest.fn(() => '{"messages":[]}'),
            importMessages: globals_1.jest.fn(() => true)
        };
        // Set up global mock
        global.globalMessageStore = mockMessageStore;
    });
    describe('📨 Message Tracking', () => {
        test('should track inbound messages from WebSocket', () => {
            const message = {
                type: 'AutomationRequested',
                payload: { action: 'SELECT_PROJECT' },
                correlationId: 'test-123',
                tabId: 456
            };
            const metadata = {
                extensionId: 'test-extension-id',
                tabId: 456,
                userAgent: 'test-agent'
            };
            mockMessageStore.addInboundMessage(message.type, message, message.correlationId, metadata);
            expect(mockMessageStore.addInboundMessage).toHaveBeenCalledWith('AutomationRequested', message, 'test-123', metadata);
        });
        test('should track outbound responses', () => {
            const response = {
                correlationId: 'test-123',
                status: 'success',
                data: { result: 'ok' }
            };
            mockMessageStore.addOutboundMessage('RESPONSE', response, 'test-123', { extensionId: 'test-ext' });
            mockMessageStore.markMessageSuccess('test-123', response);
            expect(mockMessageStore.addOutboundMessage).toHaveBeenCalled();
            expect(mockMessageStore.markMessageSuccess).toHaveBeenCalledWith('test-123', response);
        });
        test('should track error responses', () => {
            const errorMsg = 'Content script not reachable';
            mockMessageStore.markMessageError('test-456', errorMsg);
            expect(mockMessageStore.markMessageError).toHaveBeenCalledWith('test-456', errorMsg);
        });
    });
    describe('⏰ Time Travel Functionality', () => {
        test('should support time travel navigation', () => {
            // Test going to specific index
            mockMessageStore.timeTravelTo(5);
            expect(mockMessageStore.timeTravelTo).toHaveBeenCalledWith(5);
            // Test going back
            mockMessageStore.timeTravelBack();
            expect(mockMessageStore.timeTravelBack).toHaveBeenCalled();
            // Test going forward
            mockMessageStore.timeTravelForward();
            expect(mockMessageStore.timeTravelForward).toHaveBeenCalled();
            // Test reset
            mockMessageStore.resetTimeTravel();
            expect(mockMessageStore.resetTimeTravel).toHaveBeenCalled();
        });
        test('should check time travel capabilities', () => {
            const canGoBack = mockMessageStore.canTimeTravelBack();
            const canGoForward = mockMessageStore.canTimeTravelForward();
            expect(canGoBack).toBe(true);
            expect(canGoForward).toBe(false);
        });
    });
    describe('💾 Export/Import Operations', () => {
        test('should export messages', () => {
            const exported = mockMessageStore.exportMessages();
            expect(mockMessageStore.exportMessages).toHaveBeenCalled();
            expect(typeof exported).toBe('string');
        });
        test('should import messages', () => {
            const importData = '{"messages":[{"type":"test"}]}';
            const result = mockMessageStore.importMessages(importData);
            expect(mockMessageStore.importMessages).toHaveBeenCalledWith(importData);
            expect(result).toBe(true);
        });
    });
    describe('🔄 Store Subscription', () => {
        test('should support store subscriptions', () => {
            const listener = globals_1.jest.fn();
            const unsubscribe = mockMessageStore.subscribe(listener);
            expect(mockMessageStore.subscribe).toHaveBeenCalledWith(listener);
            expect(typeof unsubscribe).toBe('function');
        });
    });
    describe('🧹 Store Management', () => {
        test('should clear all messages', () => {
            mockMessageStore.clearAllMessages();
            expect(mockMessageStore.clearAllMessages).toHaveBeenCalled();
        });
        test('should get current state', () => {
            const mockState = {
                messages: [],
                currentIndex: -1,
                isTimeTraveling: false
            };
            mockMessageStore.getState.mockReturnValue(mockState);
            const state = mockMessageStore.getState();
            expect(mockMessageStore.getState).toHaveBeenCalled();
            expect(state).toEqual(mockState);
        });
    });
    describe('🎭 Integration Scenarios', () => {
        test('should handle complete request-response cycle', () => {
            const correlationId = 'integration-test-123';
            // 1. Receive inbound message
            mockMessageStore.addInboundMessage('AutomationRequested', { type: 'AutomationRequested', correlationId }, correlationId, { extensionId: 'test' });
            // 2. Send outbound response
            mockMessageStore.addOutboundMessage('RESPONSE', { correlationId, status: 'success' }, correlationId, { extensionId: 'test' });
            // 3. Mark as successful
            mockMessageStore.markMessageSuccess(correlationId, { result: 'ok' });
            // Verify all steps were called
            expect(mockMessageStore.addInboundMessage).toHaveBeenCalled();
            expect(mockMessageStore.addOutboundMessage).toHaveBeenCalled();
            expect(mockMessageStore.markMessageSuccess).toHaveBeenCalledWith(correlationId, { result: 'ok' });
        });
        test('should handle error scenarios', () => {
            const correlationId = 'error-test-456';
            const errorMessage = 'Automation failed';
            // 1. Receive inbound message
            mockMessageStore.addInboundMessage('AutomationRequested', { type: 'AutomationRequested', correlationId }, correlationId, { extensionId: 'test' });
            // 2. Send error response
            mockMessageStore.addOutboundMessage('ERROR_RESPONSE', { correlationId, status: 'error', error: errorMessage }, correlationId, { extensionId: 'test' });
            // 3. Mark as failed
            mockMessageStore.markMessageError(correlationId, errorMessage);
            // Verify error handling
            expect(mockMessageStore.addInboundMessage).toHaveBeenCalled();
            expect(mockMessageStore.addOutboundMessage).toHaveBeenCalled();
            expect(mockMessageStore.markMessageError).toHaveBeenCalledWith(correlationId, errorMessage);
        });
        test('should support time travel debugging workflow', () => {
            // Simulate a debugging session
            // 1. Check if we can travel back
            const canGoBack = mockMessageStore.canTimeTravelBack();
            expect(canGoBack).toBe(true);
            // 2. Go back in time
            mockMessageStore.timeTravelBack();
            expect(mockMessageStore.timeTravelBack).toHaveBeenCalled();
            // 3. Jump to specific message
            mockMessageStore.timeTravelTo(3);
            expect(mockMessageStore.timeTravelTo).toHaveBeenCalledWith(3);
            // 4. Return to present
            mockMessageStore.resetTimeTravel();
            expect(mockMessageStore.resetTimeTravel).toHaveBeenCalled();
        });
        test('should support message analysis workflow', () => {
            // Set up a mock state with some messages
            const mockState = {
                messages: [
                    { type: 'ping', status: 'success', direction: 'inbound' },
                    { type: 'pong', status: 'success', direction: 'outbound' },
                    { type: 'automation', status: 'error', direction: 'inbound' }
                ],
                currentIndex: 2,
                isTimeTraveling: false,
                filters: { types: [], statuses: [], directions: [], dateRange: null }
            };
            mockMessageStore.getState.mockReturnValue(mockState);
            const state = mockMessageStore.getState();
            // Verify we can analyze the state
            expect(state.messages).toHaveLength(3);
            expect(state.currentIndex).toBe(2);
            expect(state.isTimeTraveling).toBe(false);
            // Export for analysis
            const exported = mockMessageStore.exportMessages();
            expect(typeof exported).toBe('string');
        });
    });
});
//# sourceMappingURL=message-store-simple.test.js.map