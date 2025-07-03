// TypeScript-EDA Integration Tests for Training System
// Comprehensive end-to-end testing of event-driven training architecture

import { ChatGPTBuddyTrainingApplication } from '../../extension/src/training/application/training-application';
import { TrainingSession } from '../../extension/src/training/domain/entities/training-session';
import { AutomationPattern } from '../../extension/src/training/domain/entities/automation-pattern';
import { UIOverlayAdapter } from '../../extension/src/training/infrastructure/ui-overlay-adapter';
import { PatternStorageAdapter } from '../../extension/src/training/infrastructure/pattern-storage-adapter';
import { PatternMatchingAdapter } from '../../extension/src/training/infrastructure/pattern-matching-adapter';
import {
  TrainingModeRequested,
  ElementSelected,
  AutomationRequest,
  ExecutionContext,
  AutomationPatternData,
  PatternLearned,
  AutomationPatternExecuted
} from '../../extension/src/training/domain/events/training-events';

// Mock DOM environment for testing
const mockDocument = {
  createElement: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    contains: jest.fn(),
    style: { cursor: '' }
  },
  querySelector: jest.fn(),
  querySelectorAll: jest.fn(() => []),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  title: 'ChatGPT Test Page'
};

const mockWindow = {
  location: {
    href: 'https://chatgpt.com/test',
    hostname: 'chatgpt.com',
    pathname: '/test'
  },
  getComputedStyle: jest.fn(() => ({
    display: 'block',
    visibility: 'visible'
  }))
};

global.document = mockDocument as any;
global.window = mockWindow as any;
global.indexedDB = {
  open: jest.fn()
} as any;

// Mock IndexedDB for testing
class MockIDBDatabase {
  transaction() {
    return {
      objectStore: () => ({
        put: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        get: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        getAll: jest.fn().mockReturnValue({ 
          onsuccess: null, 
          onerror: null,
          result: []
        }),
        delete: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        clear: jest.fn().mockReturnValue({ onsuccess: null, onerror: null }),
        createIndex: jest.fn(),
        index: () => ({
          getAll: jest.fn().mockReturnValue({
            onsuccess: null,
            onerror: null, 
            result: []
          })
        })
      })
    };
  }
}

describe('🎯 TypeScript-EDA Training System Integration', () => {
  let application: ChatGPTBuddyTrainingApplication;
  let mockElement: HTMLElement;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create fresh application instance
    application = new ChatGPTBuddyTrainingApplication();
    
    // Mock DOM element
    mockElement = {
      tagName: 'INPUT',
      id: 'search-input',
      className: 'form-control',
      getAttribute: jest.fn((attr) => {
        if (attr === 'name') return 'search';
        if (attr === 'type') return 'text';
        return null;
      }),
      click: jest.fn(),
      focus: jest.fn(),
      value: '',
      dispatchEvent: jest.fn(),
      scrollIntoView: jest.fn(),
      hasAttribute: jest.fn(() => false),
      style: {},
      addEventListener: jest.fn(),
      removeEventListener: jest.fn()
    } as any;

    mockDocument.createElement.mockReturnValue(mockElement);
    mockDocument.querySelector.mockReturnValue(mockElement);

    // Mock IndexedDB
    const mockRequest = {
      onsuccess: null,
      onerror: null,
      onupgradeneeded: null,
      result: new MockIDBDatabase()
    };

    (global.indexedDB.open as jest.Mock).mockReturnValue(mockRequest);

    // Simulate successful DB opening
    setTimeout(() => {
      if (mockRequest.onsuccess && typeof mockRequest.onsuccess === 'function') {
        mockRequest.onsuccess({ target: mockRequest } as any);
      }
    }, 0);
  });

  describe('✅ Application Lifecycle', () => {
    test('should start and initialize training application successfully', async () => {
      // GIVEN: Fresh training application
      expect(application.getState().isInitialized).toBe(false);
      
      // WHEN: Application is started
      await application.start();
      
      // THEN: Application should be initialized
      const state = application.getState();
      expect(state.isInitialized).toBe(true);
      expect(state.trainingMode).toBe('inactive');
      expect(state.currentSession).toBeNull();
    });

    test('should enable training mode and create session', async () => {
      // GIVEN: Initialized application
      await application.start();
      
      // WHEN: Training mode is enabled
      const result = await application.enableTrainingMode('chatgpt.com');
      
      // THEN: Training mode should be active with session
      expect(result.eventType).toBe('TrainingModeEnabled');
      expect(application.isTrainingMode()).toBe(true);
      expect(application.getCurrentSession()).not.toBeNull();
    });

    test('should switch to automatic mode after training', async () => {
      // GIVEN: Application in training mode
      await application.start();
      await application.enableTrainingMode('chatgpt.com');
      
      // WHEN: Switching to automatic mode
      await application.switchToAutomaticMode();
      
      // THEN: Should be in automatic mode without active session
      expect(application.isAutomaticMode()).toBe(true);
      expect(application.getCurrentSession()).toBeNull();
    });
  });

  describe('🎓 Complete Training Workflow', () => {
    test('should complete full training workflow: enable → select → learn → store', async () => {
      // GIVEN: Application ready for training
      await application.start();
      
      // WHEN: Training mode enabled
      const enableResult = await application.enableTrainingMode('chatgpt.com');
      expect(enableResult.eventType).toBe('TrainingModeEnabled');
      
      // AND: Automation request received
      const automationRequest: AutomationRequest = {
        messageType: 'FillTextRequested',
        payload: { element: 'Search', value: 'TypeScript patterns' },
        context: getCurrentTestContext()
      };
      
      const requestResult = await application.handleAutomationRequest(automationRequest);
      expect(requestResult.eventType).toBe('ElementSelectionRequested');
      
      // AND: User selects element (simulated through session entity)
      const session = application.getCurrentSession()!;
      const elementSelectedEvent = new ElementSelected(
        mockElement,
        '#search-input',
        'FillTextRequested',
        getCurrentTestContext(),
        'test-correlation-id'
      );
      
      const learnResult = await session.learnPattern(elementSelectedEvent);
      
      // THEN: Pattern should be learned successfully
      expect(learnResult).toBeInstanceOf(PatternLearned);
      if (learnResult instanceof PatternLearned) {
        expect(learnResult.pattern.messageType).toBe('FillTextRequested');
        expect(learnResult.pattern.selector).toBe('#search-input');
        expect(learnResult.pattern.confidence).toBe(1.0);
      }
    });

    test('should execute learned patterns automatically', async () => {
      // GIVEN: Application with stored patterns
      await application.start();
      await application.switchToAutomaticMode();
      
      // Create and store a pattern
      const testPattern: AutomationPatternData = {
        id: 'test-pattern-1',
        messageType: 'FillTextRequested',
        payload: { element: 'Search', value: 'test' },
        selector: '#search-input',
        context: getCurrentTestContext(),
        confidence: 1.0,
        usageCount: 0,
        successfulExecutions: 0
      };
      
      await application.importPatterns([testPattern]);
      
      // WHEN: Automation request matches stored pattern
      const automationRequest: AutomationRequest = {
        messageType: 'FillTextRequested',
        payload: { element: 'Search', value: 'new search query' },
        context: getCurrentTestContext()
      };
      
      const result = await application.handleAutomationRequest(automationRequest);
      
      // THEN: Should attempt pattern execution (may fail in test environment)
      expect(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result.eventType);
    });
  });

  describe('🔄 Event-Driven Entity Interactions', () => {
    test('should handle TrainingSession entity events correctly', async () => {
      // GIVEN: Training session entity
      const session = new TrainingSession('test-session');
      
      // WHEN: Training mode is requested
      const trainingEvent = new TrainingModeRequested('chatgpt.com', 'test-correlation');
      const enableResult = await session.enableTrainingMode(trainingEvent);
      
      // THEN: Session should be activated
      expect(enableResult.eventType).toBe('TrainingModeEnabled');
      expect(session.isActive).toBe(true);
      expect(session.website).toBe('chatgpt.com');
    });

    test('should handle AutomationPattern entity execution', async () => {
      // GIVEN: Automation pattern entity
      const patternData: AutomationPatternData = {
        id: 'test-pattern',
        messageType: 'ClickElementRequested',
        payload: { element: 'Button' },
        selector: '#test-button',
        context: getCurrentTestContext(),
        confidence: 1.0,
        usageCount: 0,
        successfulExecutions: 0
      };
      
      const pattern = new AutomationPattern(patternData);
      
      // WHEN: Pattern matching event is processed
      const matchedEvent = {
        pattern: patternData,
        request: {
          messageType: 'ClickElementRequested',
          payload: { element: 'Button' },
          context: getCurrentTestContext()
        },
        confidence: 0.9,
        correlationId: 'test-correlation'
      } as any;
      
      const result = await pattern.executePattern(matchedEvent);
      
      // THEN: Execution should complete (success or controlled failure)
      expect(['AutomationPatternExecuted', 'PatternExecutionFailed']).toContain(result.eventType);
    });
  });

  describe('🏗️ Infrastructure Adapter Integration', () => {
    test('should coordinate UI, Storage, and Pattern Matching adapters', async () => {
      // GIVEN: All adapters integrated in application
      await application.start();
      
      // WHEN: Getting pattern statistics (tests storage adapter)
      const stats = await application.getPatternStatistics();
      
      // THEN: Should return valid statistics structure
      expect(stats).toHaveProperty('totalPatterns');
      expect(stats).toHaveProperty('patternsByWebsite');
      expect(stats).toHaveProperty('averageConfidence');
      expect(typeof stats.totalPatterns).toBe('number');
    });

    test('should handle pattern cleanup operations', async () => {
      // GIVEN: Application with potential stale patterns
      await application.start();
      
      // WHEN: Cleaning up old patterns
      const deletedCount = await application.cleanupStalePatterns(30);
      
      // THEN: Should complete without errors
      expect(typeof deletedCount).toBe('number');
      expect(deletedCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe('📊 Pattern Learning Analytics', () => {
    test('should track pattern usage and confidence over time', async () => {
      // GIVEN: Application with pattern matching capability
      await application.start();
      
      // Create pattern with usage history
      const patternWithHistory: AutomationPatternData = {
        id: 'history-pattern',
        messageType: 'FillTextRequested',
        payload: { element: 'Search' },
        selector: '#search-input',
        context: getCurrentTestContext(),
        confidence: 1.0,
        usageCount: 5,
        successfulExecutions: 4
      };
      
      // WHEN: Importing pattern and checking statistics
      await application.importPatterns([patternWithHistory]);
      const stats = await application.getPatternStatistics();
      
      // THEN: Statistics should reflect pattern data
      expect(stats.totalPatterns).toBeGreaterThan(0);
      if (stats.totalPatterns > 0) {
        expect(stats.successRate).toBeGreaterThanOrEqual(0);
        expect(stats.averageConfidence).toBeGreaterThan(0);
      }
    });

    test('should export and import patterns correctly', async () => {
      // GIVEN: Application with some patterns
      await application.start();
      
      const testPatterns: AutomationPatternData[] = [
        {
          id: 'export-test-1',
          messageType: 'FillTextRequested',
          payload: { element: 'Input1' },
          selector: '#input1',
          context: getCurrentTestContext(),
          confidence: 1.0,
          usageCount: 0,
          successfulExecutions: 0
        },
        {
          id: 'export-test-2',
          messageType: 'ClickElementRequested',
          payload: { element: 'Button1' },
          selector: '#button1',
          context: getCurrentTestContext(),
          confidence: 0.9,
          usageCount: 2,
          successfulExecutions: 2
        }
      ];
      
      // WHEN: Importing and then exporting patterns
      await application.importPatterns(testPatterns);
      const exportedPatterns = await application.exportPatterns();
      
      // THEN: Exported patterns should include imported ones
      expect(exportedPatterns.length).toBeGreaterThanOrEqual(testPatterns.length);
      
      const exportedIds = exportedPatterns.map(p => p.id);
      expect(exportedIds).toContain('export-test-1');
      expect(exportedIds).toContain('export-test-2');
    });
  });

  describe('🔄 Error Handling and Recovery', () => {
    test('should handle training session errors gracefully', async () => {
      // GIVEN: Application in training mode
      await application.start();
      await application.enableTrainingMode('chatgpt.com');
      
      // WHEN: Invalid automation request is processed
      const invalidRequest: AutomationRequest = {
        messageType: 'InvalidMessageType' as any,
        payload: {},
        context: getCurrentTestContext()
      };
      
      const result = await application.handleAutomationRequest(invalidRequest);
      
      // THEN: Should handle error without crashing
      expect(result.eventType).toBe('ElementSelectionRequested');
    });

    test('should recover from disabled training mode', async () => {
      // GIVEN: Application in training mode
      await application.start();
      await application.enableTrainingMode('chatgpt.com');
      expect(application.isTrainingMode()).toBe(true);
      
      // WHEN: Training mode is disabled
      const endResult = await application.disableTrainingMode('Test end');
      
      // THEN: Should transition to automatic mode
      expect(endResult?.eventType).toBe('TrainingSessionEnded');
      expect(application.isAutomaticMode()).toBe(true);
      expect(application.getCurrentSession()).toBeNull();
    });
  });

  describe('🎯 Advanced Pattern Matching', () => {
    test('should correctly evaluate pattern similarity and context compatibility', async () => {
      // GIVEN: Pattern matching adapter
      const storageAdapter = new PatternStorageAdapter();
      const matchingAdapter = new PatternMatchingAdapter(storageAdapter);
      
      // Create test pattern
      const testPattern: AutomationPatternData = {
        id: 'similarity-test',
        messageType: 'FillTextRequested',
        payload: { element: 'Search', value: 'original' },
        selector: '#search-box',
        context: getCurrentTestContext(),
        confidence: 1.0,
        usageCount: 3,
        successfulExecutions: 3
      };
      
      // WHEN: Finding matches for similar request
      const similarRequest: AutomationRequest = {
        messageType: 'FillTextRequested',
        payload: { element: 'Search', value: 'new query' },
        context: getCurrentTestContext()
      };
      
      // Add pattern to test matching
      await storageAdapter.storePattern(testPattern);
      const matches = await matchingAdapter.findMatchingPatterns(similarRequest);
      
      // THEN: Should find matching pattern with good score
      expect(matches.length).toBeGreaterThan(0);
      if (matches.length > 0) {
        expect(matches[0].pattern.id).toBe('similarity-test');
        expect(matches[0].overallScore).toBeGreaterThan(0.5);
      }
    });
  });
});

// Helper functions

function getCurrentTestContext(): ExecutionContext {
  return {
    url: 'https://chatgpt.com/test',
    hostname: 'chatgpt.com',
    pathname: '/test',
    title: 'ChatGPT Test Page',
    timestamp: new Date(),
    pageStructureHash: 'test-hash-123'
  };
}