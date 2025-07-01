// 🔴 RED: Training UI Display Tests - TDD Walking Skeleton

// Mock DOM environment
const mockDocument = {
  createElement: jest.fn(),
  body: {
    appendChild: jest.fn(),
    removeChild: jest.fn(),
    contains: jest.fn(),
    style: {
      cursor: ''
    }
  },
  querySelector: jest.fn(),
  addEventListener: jest.fn(),
  removeEventListener: jest.fn()
};

global.document = mockDocument as any;
global.window = {
  location: { href: 'https://chatgpt.com/test' }
} as any;

// Mock MouseEvent for testing
global.MouseEvent = class MockMouseEvent {
  public target: any;
  public bubbles: boolean;
  public type: string;
  
  constructor(type: string, options: any = {}) {
    this.type = type;
    this.target = options.target;
    this.bubbles = options.bubbles || false;
  }
  
  preventDefault() {
    // Mock preventDefault method
  }
  
  stopPropagation() {
    // Mock stopPropagation method
  }
} as any;

// Shared mock element for all tests
let mockElement: HTMLElement;

describe('🔴 RED: Interactive Training UI - Walking Skeleton', () => {

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockElement = {
      innerHTML: '',
      style: {
        outline: ''
      },
      tagName: 'DIV',
      id: '',
      className: '',
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      querySelector: jest.fn(),
      getAttribute: jest.fn(() => null),
      classList: {
        add: jest.fn(),
        remove: jest.fn(),
        contains: jest.fn()
      }
    } as any;
    
    mockDocument.createElement.mockReturnValue(mockElement);
    
    // Mock contains method to return true when element is "attached"
    let attachedElements: any[] = [];
    mockDocument.body.appendChild.mockImplementation((element) => {
      attachedElements.push(element);
      return element;
    });
    mockDocument.body.removeChild.mockImplementation((element) => {
      attachedElements = attachedElements.filter(el => el !== element);
      return element;
    });
    mockDocument.body.contains.mockImplementation((element) => {
      return attachedElements.includes(element);
    });
  });

  describe('🟢 GREEN: Training UI should appear when FillTextRequested received', () => {
    test('should show training prompt when message received in training mode', async () => {
      // GIVEN: TrainingUI class exists and training mode is enabled
      const { TrainingUI } = require('../../extension/src/training-ui');
      const trainingUI = new TrainingUI();
      trainingUI.enableTrainingMode();
      
      // WHEN: FillTextRequested message is received
      const message = {
        type: 'FillTextRequested',
        payload: { 
          element: 'Search', 
          value: 'TypeScript patterns' 
        },
        correlationId: 'test-123'
      };
      
      trainingUI.showTrainingPrompt(message.type, message.payload);
      
      // THEN: Training UI should be visible
      expect(trainingUI.isVisible()).toBe(true);
      
      // AND: Should have created and appended overlay
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });

    test('should display correct guidance text for FillTextRequested', () => {
      // GIVEN: Training mode is active (not implemented yet)
      // WHEN: FillTextRequested with specific payload is received
      const messageType = 'FillTextRequested';
      const payload = { element: 'Search', value: 'TypeScript patterns' };
      
      // THEN: Should display the exact text from our Excel-like spec
      const expectedText = 'Received FillTextRequested for the Search element, to fill with "TypeScript patterns". Please select the Search element requested.';
      
      // This will fail because we haven't implemented the text generation yet
      // 🟢 GREEN: Now using implemented function
      const { generateTrainingText } = require('../../extension/src/training-ui');
      const actualText = generateTrainingText(messageType, payload);
      expect(actualText).toContain('Received FillTextRequested for the Search element');
      expect(actualText).toContain('to fill with "TypeScript patterns"');
      expect(actualText).toContain('Please select the Search element requested');
    });

    test('should create overlay DOM element when training starts', () => {
      // GIVEN: Training UI needs to create overlay
      // WHEN: showTrainingPrompt is called
      const messageType = 'FillTextRequested';
      const payload = { element: 'Search', value: 'test' };
      
      // THEN: Should create and append overlay element
      // 🟢 GREEN: Now using implemented TrainingUI
      const { TrainingUI } = require('../../extension/src/training-ui');
      const trainingUI = new TrainingUI();
      trainingUI.enableTrainingMode(); // Enable training mode first
      trainingUI.showTrainingPrompt(messageType, payload);
      
      // Should have created an overlay element
      expect(mockDocument.createElement).toHaveBeenCalledWith('div');
      expect(mockDocument.body.appendChild).toHaveBeenCalled();
    });
  });

  describe('🔴 RED: Training UI should handle different message types', () => {
    test('🟢 GREEN: should generate different text for ClickElementRequested', () => {
      const messageType = 'ClickElementRequested';
      const payload = { element: 'Submit Button' };
      
      // 🟢 GREEN: Now using implemented function
      const { generateTrainingText } = require('../../extension/src/training-ui');
      const actualText = generateTrainingText(messageType, payload);
      expect(actualText).toContain('Received ClickElementRequested for the Submit Button element');
      expect(actualText).toContain('Please select the Submit Button element requested');
    });

    test('🟢 GREEN: should handle TabSwitchRequested training', () => {
      const messageType = 'TabSwitchRequested';
      const payload = { title: 'Google' };
      
      // 🟢 GREEN: Now using implemented function
      const { generateTrainingText } = require('../../extension/src/training-ui');
      const actualText = generateTrainingText(messageType, payload);
      expect(actualText).toContain('Received TabSwitchRequested');
      expect(actualText).toContain('Google');
    });
  });

  describe('🔴 RED: Training UI lifecycle management', () => {
    test('🟢 GREEN: should be able to show and hide training overlay', () => {
      // 🟢 GREEN: Now using implemented TrainingUI
      const { TrainingUI } = require('../../extension/src/training-ui');
      const trainingUI = new TrainingUI();
      trainingUI.enableTrainingMode(); // Enable training mode first
      
      // Show training
      trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search' });
      expect(trainingUI.isVisible()).toBe(true);
      
      // Hide training
      trainingUI.hide();
      expect(trainingUI.isVisible()).toBe(false);
    });

    test('🟢 GREEN: should cleanup event listeners on hide', () => {
      // 🟢 GREEN: Now using implemented TrainingUI
      const { TrainingUI } = require('../../extension/src/training-ui');
      const trainingUI = new TrainingUI();
      trainingUI.enableTrainingMode(); // Enable training mode first
      
      trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search' });
      trainingUI.hide();
      
      // Should have removed event listeners
      expect(mockDocument.removeEventListener).toHaveBeenCalled();
    });
  });
});

// 🟢 GREEN: Tests now pass with minimal implementation
// Next step: 🔴 RED - Create failing tests for element selection capture

describe('🟢 GREEN: Element Selection Capture - Walking Skeleton', () => {
  // mockElement is available from the shared scope above
  test('🟢 GREEN: should enable element selection mode when training starts', () => {
    // GIVEN: Training UI is ready to capture element selection
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    
    // WHEN: Training prompt is shown
    trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search', value: 'test' });
    
    // THEN: Element selection mode should be enabled
    expect(trainingUI.isSelectionModeEnabled()).toBe(true);
    expect(mockDocument.body.style.cursor).toBe('crosshair');
  });
  
  test('🟢 GREEN: should capture element selector when user clicks', () => {
    // GIVEN: Training UI in selection mode
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search' });
    
    // WHEN: User clicks on an element
    const clickEvent = new MouseEvent('click', { 
      bubbles: true,
      target: mockElement
    } as any);
    
    const clickHandler = trainingUI.getClickHandler();
    clickHandler(clickEvent);
    
    // THEN: Should capture element selector
    const capturedSelector = trainingUI.getCapturedSelector();
    const capturedElement = trainingUI.getCapturedElement();
    expect(capturedSelector).toBeDefined();
    expect(capturedElement).toBe(mockElement);
  });
  
  test('🟢 GREEN: should show confirmation dialog after element selection', () => {
    // GIVEN: Training UI has captured an element
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    
    // WHEN: Element is selected
    const selectedElement = mockElement;
    trainingUI.showConfirmationDialog(selectedElement, '#mock-selector');
    
    // THEN: Confirmation dialog should appear
    const confirmationVisible = trainingUI.isConfirmationVisible();
    expect(confirmationVisible).toBe(true);
    expect(mockDocument.createElement).toHaveBeenCalledWith('div');
    expect(mockDocument.body.appendChild).toHaveBeenCalled();
  });
  
  test('🟢 GREEN: should generate optimal CSS selector for clicked element', () => {
    // GIVEN: An element with attributes that can be used for selector generation
    const elementWithAttributes = {
      tagName: 'INPUT',
      id: 'search-input',
      className: 'search-box form-control',
      getAttribute: jest.fn((attr) => {
        if (attr === 'name') return 'search';
        if (attr === 'type') return 'text';
        return null;
      })
    } as any;
    
    // WHEN: Generating selector for the element
    const { generateOptimalSelector } = require('../../extension/src/training-ui');
    const selector = generateOptimalSelector(elementWithAttributes);
    
    // THEN: Should generate appropriate selector
    expect(selector).toBe('#search-input'); // Should prefer ID first
  });
  
  test('🟢 GREEN: should handle click event delegation in selection mode', () => {
    // GIVEN: Training UI in selection mode with document click listeners
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search' });
    
    // WHEN: Document click event occurs
    const clickEvent = new MouseEvent('click', {
      target: mockElement,
      bubbles: true
    } as any);
    
    // THEN: Click should be intercepted and handled
    const clickHandler = trainingUI.getClickHandler();
    expect(typeof clickHandler).toBe('function');
    clickHandler(clickEvent);
    expect(trainingUI.getCapturedElement()).toBe(mockElement);
  });
});

describe('🟢 GREEN: Interactive Element Highlighting - Walking Skeleton', () => {
  // mockElement is available from the shared scope above
  test('🟢 GREEN: should highlight elements on mouseover during selection', () => {
    // GIVEN: Training UI in selection mode
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search' });
    
    // WHEN: Mouse hovers over an element
    const mouseOverEvent = new MouseEvent('mouseover', {
      target: mockElement
    } as any);
    
    // THEN: Element should be highlighted
    trainingUI.handleMouseOver(mouseOverEvent);
    expect(mockElement.style.outline).toBe('2px solid blue');
  });
  
  test('🟢 GREEN: should remove highlight on mouseout', () => {
    // GIVEN: Training UI with highlighted element
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search' });
    mockElement.style.outline = '2px solid blue';
    
    // WHEN: Mouse leaves the element
    const mouseOutEvent = new MouseEvent('mouseout', {
      target: mockElement
    } as any);
    
    // THEN: Highlight should be removed
    trainingUI.handleMouseOut(mouseOutEvent);
    expect(mockElement.style.outline).toBe('');
  });
  
  test('🟢 GREEN: should change cursor to crosshair during selection', () => {
    // GIVEN: Training UI ready for element selection
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    
    // WHEN: Selection mode is enabled
    trainingUI.showTrainingPrompt('FillTextRequested', { element: 'Search' });
    
    // THEN: Document body cursor should be crosshair
    expect(mockDocument.body.style.cursor).toBe('crosshair');
  });
});

describe('🟢 GREEN: Pattern Storage and Learning - Walking Skeleton', () => {
  test('🟢 GREEN: should store automation pattern when user confirms', () => {
    // GIVEN: Training UI has captured an element and user wants to automate
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    trainingUI.enableTrainingMode();
    
    // WHEN: User confirms pattern automation
    const messageType = 'FillTextRequested';
    const payload = { element: 'Search', value: 'TypeScript patterns' };
    const selectedElement = mockElement;
    const selector = '#search-input';
    
    // THEN: Should store the pattern for future use
    const pattern = trainingUI.createAutomationPattern(messageType, payload, selectedElement, selector);
    expect(pattern).toBeDefined();
    expect(pattern.messageType).toBe(messageType);
    expect(pattern.selector).toBe(selector);
    expect(pattern.id).toBeDefined();
    expect(pattern.confidence).toBe(1.0);
  });
  
  test('🟢 GREEN: should persist patterns to storage', () => {
    // GIVEN: Training UI with a learned pattern
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    
    const pattern = {
      id: 'pattern-1',
      messageType: 'FillTextRequested',
      payload: { element: 'Search' },
      selector: '#search-input',
      context: {
        url: 'https://chatgpt.com',
        title: 'ChatGPT',
        timestamp: new Date()
      },
      confidence: 1.0,
      usageCount: 0
    };
    
    // WHEN: Pattern is saved to storage
    trainingUI.savePattern(pattern);
    const storedPatterns = trainingUI.getStoredPatterns();
    
    // THEN: Pattern should be persisted
    expect(storedPatterns).toContain(pattern);
    expect(storedPatterns).toHaveLength(1);
  });
  
  test('🟢 GREEN: should retrieve patterns by message type', () => {
    // GIVEN: Storage with multiple patterns
    const { TrainingUI } = require('../../extension/src/training-ui');
    const trainingUI = new TrainingUI();
    
    const fillPattern = {
      id: 'fill-1',
      messageType: 'FillTextRequested',
      selector: '#search-input',
      payload: {},
      context: { url: '', title: '', timestamp: new Date() },
      confidence: 1.0,
      usageCount: 0
    };
    const clickPattern = {
      id: 'click-1',
      messageType: 'ClickElementRequested', 
      selector: '#submit-btn',
      payload: {},
      context: { url: '', title: '', timestamp: new Date() },
      confidence: 1.0,
      usageCount: 0
    };
    
    // WHEN: Retrieving patterns by type
    trainingUI.savePattern(fillPattern);
    trainingUI.savePattern(clickPattern);
    
    const fillPatterns = trainingUI.getPatternsByType('FillTextRequested');
    
    // THEN: Should return only matching patterns
    expect(fillPatterns).toHaveLength(1);
    expect(fillPatterns[0].messageType).toBe('FillTextRequested');
  });
  
  test('🟢 GREEN: should match patterns based on payload similarity', () => {
    // GIVEN: Stored pattern for search functionality
    const storedPattern = {
      id: 'search-1',
      messageType: 'FillTextRequested',
      payload: { element: 'Search', value: 'original query' },
      selector: '#search-input',
      confidence: 1.0,
      context: { url: '', title: '', timestamp: new Date() },
      usageCount: 0
    };
    
    // WHEN: Similar request comes in
    const newRequest = {
      messageType: 'FillTextRequested',
      payload: { element: 'Search', value: 'new query' }
    };
    
    // THEN: Should find matching pattern
    const { PatternMatcher } = require('../../extension/src/training-ui');
    const matcher = new PatternMatcher();
    matcher.addPattern(storedPattern);
    
    const matchingPattern = matcher.findBestMatch(newRequest);
    expect(matchingPattern).toBe(storedPattern);
  });
  
  test('🟢 GREEN: should calculate pattern confidence based on usage', () => {
    // GIVEN: Pattern with usage history
    const pattern = {
      id: 'pattern-1',
      messageType: 'FillTextRequested',
      selector: '#search-input',
      confidence: 1.0,
      usageCount: 0,
      successfulExecutions: 0,
      payload: {},
      context: { url: '', title: '', timestamp: new Date() }
    };
    
    // WHEN: Pattern is used successfully multiple times
    const { PatternMatcher } = require('../../extension/src/training-ui');
    const matcher = new PatternMatcher();
    
    // Simulate successful executions
    matcher.recordSuccessfulExecution(pattern);
    matcher.recordSuccessfulExecution(pattern);
    
    // THEN: Usage count and confidence should increase
    expect(pattern.usageCount).toBe(2);
    expect(pattern.confidence).toBeGreaterThan(1.0);
  });
});

describe('🟢 GREEN: Pattern Context Matching - Walking Skeleton', () => {
  test('🟢 GREEN: should match patterns by URL context', () => {
    // GIVEN: Pattern stored for specific URL
    const pattern = {
      messageType: 'FillTextRequested',
      selector: '#search-input',
      context: {
        url: 'https://chatgpt.com/chat',
        hostname: 'chatgpt.com',
        pathname: '/chat',
        title: 'ChatGPT',
        timestamp: new Date()
      }
    };
    
    // WHEN: Request comes from same context
    const currentContext = {
      url: 'https://chatgpt.com/chat/new',
      hostname: 'chatgpt.com', 
      pathname: '/chat/new'
    };
    
    // THEN: Should match based on hostname
    const { ContextMatcher } = require('../../extension/src/training-ui');
    const matcher = new ContextMatcher();
    
    const isMatch = matcher.isContextCompatible(pattern.context, currentContext);
    expect(isMatch).toBe(true);
  });
  
  test('🟢 GREEN: should reject patterns from different domains', () => {
    // GIVEN: Pattern stored for different domain
    const pattern = {
      context: {
        hostname: 'google.com',
        pathname: '/search',
        url: 'https://google.com/search',
        title: 'Google',
        timestamp: new Date()
      }
    };
    
    // WHEN: Request comes from different domain
    const currentContext = {
      url: 'https://chatgpt.com/chat',
      hostname: 'chatgpt.com',
      pathname: '/chat'
    };
    
    // THEN: Should not match
    const { ContextMatcher } = require('../../extension/src/training-ui');
    const matcher = new ContextMatcher();
    
    const isMatch = matcher.isContextCompatible(pattern.context, currentContext);
    expect(isMatch).toBe(false);
  });
  
  test('🟢 GREEN: should handle pattern expiration based on page changes', () => {
    // GIVEN: Pattern stored with page structure hash
    const pattern = {
      id: 'old-pattern',
      messageType: 'FillTextRequested',
      selector: '#search-input',
      payload: {},
      confidence: 1.0,
      usageCount: 0,
      context: {
        url: 'https://chatgpt.com',
        title: 'ChatGPT',
        pageStructureHash: 'abc123',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days old
      }
    };
    
    // WHEN: Current page has different structure
    const currentPageHash = 'def456';
    
    // THEN: Should mark pattern as potentially stale
    const { PatternValidator } = require('../../extension/src/training-ui');
    const validator = new PatternValidator();
    
    const isValid = validator.isPatternStillValid(pattern, currentPageHash);
    expect(isValid).toBe(false);
  });
});

describe('🔵 REFACTOR: Enhanced Training System - Walking Skeleton', () => {
  test('🔵 should generate better CSS selectors with priority', () => {
    // GIVEN: Element with multiple selector options
    const elementWithMultipleOptions = {
      tagName: 'INPUT',
      id: 'search-input',
      className: 'form-control search-box',
      getAttribute: jest.fn((attr) => {
        if (attr === 'name') return 'search';
        if (attr === 'type') return 'text';
        if (attr === 'data-testid') return 'search-field';
        return null;
      })
    } as any;
    
    // WHEN: Generating optimal selector
    const { generateOptimalSelector } = require('../../extension/src/training-ui');
    const selector = generateOptimalSelector(elementWithMultipleOptions);
    
    // THEN: Should prefer ID selector (highest priority)
    expect(selector).toBe('#search-input');
  });
  
  test('🔵 should distinguish between better and worse pattern matches', () => {
    // GIVEN: Enhanced pattern matcher with multiple patterns
    const { PatternMatcher } = require('../../extension/src/training-ui');
    const matcher = new PatternMatcher();
    
    const searchPattern = {
      id: 'search-pattern',
      messageType: 'FillTextRequested',
      payload: { element: 'Search', value: 'TypeScript patterns' },
      selector: '#search-input',
      confidence: 1.0,
      context: { url: '', title: '', timestamp: new Date() },
      usageCount: 0
    };
    
    const submitPattern = {
      id: 'submit-pattern',
      messageType: 'FillTextRequested',
      payload: { element: 'Submit', value: 'Different content' },
      selector: '#submit-btn',
      confidence: 1.0,
      context: { url: '', title: '', timestamp: new Date() },
      usageCount: 0
    };
    
    matcher.addPattern(searchPattern);
    matcher.addPattern(submitPattern);
    
    // WHEN: Testing request that should match search pattern better
    const searchRequest = {
      messageType: 'FillTextRequested',
      payload: { element: 'Search', value: 'JavaScript tutorials' } // Same element as search pattern
    };
    
    // THEN: Should find the better matching pattern
    const bestMatch = matcher.findBestMatch(searchRequest);
    expect(bestMatch).toBe(searchPattern); // Should prefer element name match
  });
  
  test('🔵 should provide context compatibility scoring', () => {
    // GIVEN: Enhanced context matcher
    const { ContextMatcher } = require('../../extension/src/training-ui');
    const matcher = new ContextMatcher();
    
    const patternContext = {
      url: 'https://chatgpt.com/chat/123',
      hostname: 'chatgpt.com',
      pathname: '/chat/123',
      title: 'ChatGPT',
      timestamp: new Date()
    };
    
    const sameHostnameContext = {
      url: 'https://chatgpt.com/chat/456',
      hostname: 'chatgpt.com',
      pathname: '/chat/456'
    };
    
    const differentHostnameContext = {
      url: 'https://google.com/search',
      hostname: 'google.com',
      pathname: '/search'
    };
    
    // WHEN: Calculating context scores
    const sameHostScore = matcher.calculateContextScore(patternContext, sameHostnameContext);
    const diffHostScore = matcher.calculateContextScore(patternContext, differentHostnameContext);
    
    // THEN: Same hostname should score higher
    expect(sameHostScore).toBeGreaterThan(diffHostScore);
    expect(sameHostScore).toBeGreaterThan(0.7);
    expect(diffHostScore).toBeLessThan(0.3);
  });
  
  test('🔵 should provide pattern reliability levels', () => {
    // GIVEN: Enhanced pattern validator
    const { PatternValidator } = require('../../extension/src/training-ui');
    const validator = new PatternValidator();
    
    const highReliabilityPattern = {
      id: 'reliable-pattern',
      messageType: 'FillTextRequested',
      selector: '#search-input',
      payload: {},
      confidence: 1.5,
      usageCount: 10,
      successfulExecutions: 9,
      context: {
        url: 'https://chatgpt.com',
        title: 'ChatGPT',
        timestamp: new Date() // Recent
      }
    };
    
    const lowReliabilityPattern = {
      id: 'unreliable-pattern',
      messageType: 'FillTextRequested',
      selector: '#old-input',
      payload: {},
      confidence: 0.8,
      usageCount: 5,
      successfulExecutions: 1,
      context: {
        url: 'https://chatgpt.com',
        title: 'ChatGPT',
        timestamp: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000) // 45 days old
      }
    };
    
    // WHEN: Getting reliability levels
    const highLevel = validator.getPatternReliabilityLevel(highReliabilityPattern);
    const lowLevel = validator.getPatternReliabilityLevel(lowReliabilityPattern);
    
    // THEN: Should classify correctly
    expect(highLevel).toBe('high');
    expect(lowLevel).toBe('unreliable');
  });
  
  test('🔵 should handle data-testid selectors with priority', () => {
    // GIVEN: Element with data-testid but no ID
    const elementWithDataTestId = {
      tagName: 'BUTTON',
      id: '',
      className: 'btn btn-primary',
      getAttribute: jest.fn((attr) => {
        if (attr === 'data-testid') return 'submit-button';
        if (attr === 'type') return 'submit';
        return null;
      })
    } as any;
    
    // WHEN: Generating selector
    const { generateOptimalSelector } = require('../../extension/src/training-ui');
    const selector = generateOptimalSelector(elementWithDataTestId);
    
    // THEN: Should prefer data-testid over classes
    expect(selector).toBe('[data-testid="submit-button"]');
  });
});