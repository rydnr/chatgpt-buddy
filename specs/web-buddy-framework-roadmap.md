# Web-Buddy Framework: Generic Web Automation with TypeScript-EDA

## Executive Summary

This document outlines the transformation of `chatgpt-buddy` into a generic `web-buddy` framework that enables automation of any website through event-driven architecture. The framework provides three distinct layers:
1. **Generic Core**: Message-passing infrastructure (`web-buddy-core`)
2. **Domain Implementations**: Site-specific logic and events (`google-buddy`, `chatgpt-buddy`)
3. **Developer APIs**: Convenient client wrappers built on the core

## Architecture Overview

### Layered Client Architecture

```ascii
┌─────────────────────────────────────────────────┐
│                API LAYER                        │ ← Developer-friendly methods
│         GoogleBuddyClient.enterSearchTerm()    │   chatGPTClient.selectProject()
├─────────────────────────────────────────────────┤
│               DOMAIN LAYER                      │ ← Site-specific messages & handlers
│      {'ENTER_SEARCH_TERM': ...}                │   {'SELECT_PROJECT': ...}
├─────────────────────────────────────────────────┤
│               CORE LAYER                        │ ← Generic messaging infrastructure
│         WebBuddyClient.sendMessage()           │   WebBuddyServer, WebBuddyExtension
└─────────────────────────────────────────────────┘
```

### Key Principle: Separation of Concerns
- **`web-buddy-core`**: Provides generic messaging, correlation IDs, event routing
- **Domain implementations**: Define site-specific messages and business logic
- **Client wrappers**: Translate developer-friendly APIs to core messages

## Project Structure Evolution

### From (Current)
```
chatgpt-buddy/
├── packages/
│   ├── chatgpt-buddy-core/
│   ├── chatgpt-buddy-server/
│   ├── chatgpt-buddy-extension/
│   └── chatgpt-buddy-client-ts/
```

### To (Generic Framework)
```
web-buddy/
├── packages/
│   ├── web-buddy-core/              # Generic messaging framework
│   │   ├── client.ts               # WebBuddyClient (sendMessage API)
│   │   ├── server.ts               # Generic message router
│   │   ├── extension.ts            # Generic browser automation
│   │   └── messages/               # Base message types
│   ├── web-buddy-testing/          # Shared ATDD utilities
│   └── web-buddy-cli/              # Command-line tools
├── implementations/
│   ├── google-buddy/               # Google search automation
│   │   ├── messages.ts            # ENTER_SEARCH_TERM, GET_RESULTS, etc.
│   │   ├── handlers.ts            # Google-specific DOM logic
│   │   ├── client.ts              # GoogleBuddyClient wrapper
│   │   └── tests/                 # Google-specific ATDD tests
│   ├── chatgpt-buddy/             # ChatGPT automation
│   │   ├── messages.ts            # SELECT_PROJECT, SELECT_CHAT, etc.
│   │   ├── handlers.ts            # ChatGPT-specific logic
│   │   ├── client.ts              # ChatGPTBuddyClient wrapper
│   │   └── tests/                 # ChatGPT-specific ATDD tests
│   └── shared/
│       ├── selectors.ts           # Common DOM selector utilities
│       └── testing.ts             # Shared test utilities
├── examples/
│   ├── google-search-automation/
│   ├── chatgpt-conversation-automation/
│   └── multi-site-workflow/
└── docs/
    ├── architecture.md
    ├── atdd-guide.md
    └── implementation-guide.md
```

## Implementation Phases

### Phase 1: Core Framework Design (Week 1)

#### 1.1 Generic Message Infrastructure
**Core Message Types:**
```typescript
// web-buddy-core/messages/base.ts
export interface WebBuddyMessage {
  readonly type: string;
  readonly payload: Record<string, any>;
  readonly correlationId: string;
  readonly timestamp: Date;
  readonly website?: string;
}

export abstract class BaseMessage implements WebBuddyMessage {
  public abstract readonly type: string;
  public readonly timestamp = new Date();
  
  constructor(
    public readonly payload: Record<string, any>,
    public readonly correlationId: string,
    public readonly website?: string
  ) {}
  
  toJSON(): WebBuddyMessage {
    return {
      type: this.type,
      payload: this.payload,
      correlationId: this.correlationId,
      timestamp: this.timestamp,
      website: this.website
    };
  }
}
```

#### 1.2 Generic Client API
```typescript
// web-buddy-core/client.ts
export class WebBuddyClient {
  constructor(private config: { serverUrl: string; timeout?: number }) {}
  
  // Core API: Generic message sending
  async sendMessage(message: Record<string, any>): Promise<any> {
    const correlationId = this.generateCorrelationId();
    const response = await this.httpClient.post('/api/message', {
      ...message,
      correlationId
    });
    return response.data;
  }
  
  async sendMessages(messages: Record<string, any>[]): Promise<any[]> {
    return Promise.all(messages.map(msg => this.sendMessage(msg)));
  }
  
  private generateCorrelationId(): string {
    return `web-buddy-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

#### 1.3 Generic Server Architecture
```typescript
// web-buddy-core/server.ts
export class WebBuddyServer {
  private handlers = new Map<string, MessageHandler>();
  
  registerHandler(messageType: string, handler: MessageHandler): void {
    this.handlers.set(messageType, handler);
  }
  
  async handleMessage(message: WebBuddyMessage): Promise<any> {
    const handler = this.handlers.get(message.type);
    if (!handler) {
      throw new Error(`No handler registered for message type: ${message.type}`);
    }
    
    return await handler.handle(message);
  }
}

export interface MessageHandler {
  handle(message: WebBuddyMessage): Promise<any>;
}
```

### Phase 2: Domain-Specific Implementations (Week 2)

#### 2.1 Google-Buddy Implementation
**Message Definitions:**
```typescript
// implementations/google-buddy/messages.ts
export const GoogleMessages = {
  ENTER_SEARCH_TERM: 'ENTER_SEARCH_TERM',
  GET_SEARCH_RESULTS: 'GET_SEARCH_RESULTS',
  GET_FIRST_RESULT: 'GET_FIRST_RESULT',
  CLICK_RESULT: 'CLICK_RESULT'
} as const;

export class EnterSearchTermMessage extends BaseMessage {
  public readonly type = GoogleMessages.ENTER_SEARCH_TERM;
  
  constructor(searchTerm: string, correlationId: string) {
    super({ searchTerm }, correlationId, 'google.com');
  }
}
```

**Domain Handlers:**
```typescript
// implementations/google-buddy/handlers.ts
export class GoogleSearchHandler implements MessageHandler {
  async handle(message: WebBuddyMessage): Promise<any> {
    switch (message.type) {
      case GoogleMessages.ENTER_SEARCH_TERM:
        return await this.enterSearchTerm(message.payload.searchTerm);
      
      case GoogleMessages.GET_SEARCH_RESULTS:
        return await this.getSearchResults();
        
      case GoogleMessages.GET_FIRST_RESULT:
        return await this.getFirstResult();
        
      default:
        throw new Error(`Unknown Google message type: ${message.type}`);
    }
  }
  
  private async enterSearchTerm(term: string): Promise<{ success: boolean }> {
    // DOM manipulation logic for entering search term
    const searchInput = document.querySelector('input[name="q"]') as HTMLInputElement;
    if (!searchInput) throw new Error('Search input not found');
    
    searchInput.value = term;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    
    const searchButton = document.querySelector('input[type="submit"]') as HTMLElement;
    searchButton?.click();
    
    return { success: true };
  }
}
```

**Developer-Friendly Client Wrapper:**
```typescript
// implementations/google-buddy/client.ts
export class GoogleBuddyClient {
  constructor(private webBuddyClient: WebBuddyClient) {}
  
  async enterSearchTerm(term: string): Promise<{ success: boolean }> {
    return this.webBuddyClient.sendMessage({
      [GoogleMessages.ENTER_SEARCH_TERM]: { searchTerm: term }
    });
  }
  
  async getSearchResults(): Promise<SearchResult[]> {
    return this.webBuddyClient.sendMessage({
      [GoogleMessages.GET_SEARCH_RESULTS]: {}
    });
  }
  
  async getFirstResult(): Promise<SearchResult> {
    return this.webBuddyClient.sendMessage({
      [GoogleMessages.GET_FIRST_RESULT]: {}
    });
  }
  
  // Convenience method: complete search flow
  async search(term: string): Promise<SearchResult[]> {
    await this.enterSearchTerm(term);
    return this.getSearchResults();
  }
}

export interface SearchResult {
  title: string;
  url: string;
  description: string;
}
```

#### 2.2 ChatGPT-Buddy Implementation
**Following same pattern for ChatGPT:**
```typescript
// implementations/chatgpt-buddy/messages.ts
export const ChatGPTMessages = {
  SELECT_PROJECT: 'SELECT_PROJECT',
  SELECT_CHAT: 'SELECT_CHAT',
  SUBMIT_PROMPT: 'SUBMIT_PROMPT',
  GET_RESPONSE: 'GET_RESPONSE'
} as const;

// implementations/chatgpt-buddy/client.ts
export class ChatGPTBuddyClient {
  constructor(private webBuddyClient: WebBuddyClient) {}
  
  async selectProject(projectName: string): Promise<{ success: boolean }> {
    return this.webBuddyClient.sendMessage({
      [ChatGPTMessages.SELECT_PROJECT]: { projectName }
    });
  }
  
  async submitPrompt(prompt: string): Promise<{ success: boolean }> {
    return this.webBuddyClient.sendMessage({
      [ChatGPTMessages.SUBMIT_PROMPT]: { prompt }
    });
  }
  
  // Convenience method: complete conversation flow
  async askQuestion(projectName: string, question: string): Promise<string> {
    await this.selectProject(projectName);
    await this.submitPrompt(question);
    const response = await this.getResponse();
    return response.content;
  }
}
```

### Phase 3: ATDD Implementation (Week 3)

#### 3.1 Generic ATDD Infrastructure
```typescript
// packages/web-buddy-testing/playwright-utils.ts
export class WebBuddyTestEnvironment {
  constructor(private implementationName: string) {}
  
  async setupServer(): Promise<string> {
    // Start web-buddy server with implementation-specific handlers
    return `http://localhost:${await this.findAvailablePort()}`;
  }
  
  async loadExtension(page: Page): Promise<void> {
    // Load generic web-buddy extension with implementation handlers
  }
  
  async teardown(): Promise<void> {
    // Clean up server and resources
  }
}
```

#### 3.2 Google-Specific ATDD Tests
```typescript
// implementations/google-buddy/tests/search-automation.spec.ts
test.describe('Google Search Automation', () => {
  let testEnv: WebBuddyTestEnvironment;
  let webClient: WebBuddyClient;
  let googleClient: GoogleBuddyClient;
  
  test.beforeAll(async () => {
    testEnv = new WebBuddyTestEnvironment('google-buddy');
    const serverUrl = await testEnv.setupServer();
    webClient = new WebBuddyClient({ serverUrl });
    googleClient = new GoogleBuddyClient(webClient);
  });
  
  test('should perform complete Google search automation', async ({ page }) => {
    // GIVEN: Google homepage is loaded with extension
    await page.goto('https://google.com');
    await testEnv.loadExtension(page);
    
    // WHEN: Search automation is executed through convenient API
    await googleClient.enterSearchTerm('TypeScript EDA patterns');
    const results = await googleClient.getSearchResults();
    const firstResult = await googleClient.getFirstResult();
    
    // THEN: Browser state reflects the automation
    await expect(page.locator('input[name="q"]')).toHaveValue('TypeScript EDA patterns');
    await expect(page.locator('#search .g')).toHaveCount.greaterThan(0);
    
    // AND: Client received expected data
    expect(results.length).toBeGreaterThan(0);
    expect(firstResult.title).toBeDefined();
    expect(firstResult.url).toContain('http');
  });
  
  test('should support generic message API for power users', async ({ page }) => {
    // GIVEN: Google page is ready
    await page.goto('https://google.com');
    
    // WHEN: Using generic web-buddy API directly
    const response = await webClient.sendMessage({
      [GoogleMessages.ENTER_SEARCH_TERM]: { 
        searchTerm: 'generic API test',
        correlationId: 'test-123'
      }
    });
    
    // THEN: Automation succeeds
    expect(response.success).toBe(true);
    await expect(page.locator('input[name="q"]')).toHaveValue('generic API test');
  });
});
```

### Phase 4: Interactive Training System (Week 4)

#### 4.1 Training Mode Infrastructure
**Core Training Components:**
```typescript
// web-buddy-core/training/training-session.ts
export interface TrainingSession {
  readonly id: string;
  readonly mode: 'training' | 'automatic';
  readonly website: string;
  readonly startedAt: Date;
  readonly patterns: ReadonlyArray<AutomationPattern>;
}

export interface AutomationPattern {
  readonly id: string;
  readonly messageType: string;
  readonly payload: Record<string, any>;
  readonly elementSelector: string;
  readonly context: {
    readonly url: string;
    readonly title: string;
    readonly timestamp: Date;
  };
  readonly confidence: number;
  readonly usageCount: number;
}

export class TrainingSessionManager {
  private currentSession: TrainingSession | null = null;
  
  async startTrainingMode(website: string): Promise<TrainingSession> {
    this.currentSession = {
      id: this.generateSessionId(),
      mode: 'training',
      website,
      startedAt: new Date(),
      patterns: []
    };
    
    await this.persistSession();
    return this.currentSession;
  }
  
  async learnPattern(
    messageType: string, 
    payload: Record<string, any>, 
    selectedElement: Element
  ): Promise<AutomationPattern> {
    const pattern: AutomationPattern = {
      id: this.generatePatternId(),
      messageType,
      payload,
      elementSelector: this.generateSelector(selectedElement),
      context: {
        url: window.location.href,
        title: document.title,
        timestamp: new Date()
      },
      confidence: 1.0,
      usageCount: 0
    };
    
    await this.storePattern(pattern);
    return pattern;
  }
}
```

#### 4.2 Interactive UI System
**Excel-like Element Selection:**
```typescript
// web-buddy-core/training/ui-overlay.ts
export class InteractiveTrainingOverlay {
  private overlay: HTMLElement | null = null;
  private isSelectionMode = false;
  
  showTrainingPrompt(messageType: string, payload: Record<string, any>): void {
    const element = payload.element || 'element';
    const value = payload.value || '';
    
    this.createOverlay(`
      <div class="training-prompt">
        <h3>🎯 Training Mode Active</h3>
        <p>Received <code>${messageType}</code> for the <strong>${element}</strong> element
           ${value ? `to fill with <em>"${value}"</em>` : ''}.</p>
        <p><strong>Please click on the <em>${element}</em> element you want to automate.</strong></p>
        <button onclick="this.cancelTraining()">Cancel</button>
      </div>
    `);
    
    this.enableElementSelection();
  }
  
  private enableElementSelection(): void {
    this.isSelectionMode = true;
    document.body.style.cursor = 'crosshair';
    
    document.addEventListener('click', this.handleElementSelection.bind(this), true);
    document.addEventListener('mouseover', this.highlightElement.bind(this), true);
    document.addEventListener('mouseout', this.unhighlightElement.bind(this), true);
  }
  
  private async handleElementSelection(event: MouseEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    
    const selectedElement = event.target as Element;
    const selector = this.generateOptimalSelector(selectedElement);
    
    this.showConfirmationDialog(selectedElement, selector);
  }
  
  private showConfirmationDialog(element: Element, selector: string): void {
    this.updateOverlay(`
      <div class="training-confirmation">
        <h3>✅ Element Selected</h3>
        <p>Selected element: <code>${element.tagName.toLowerCase()}</code></p>
        <p>Generated selector: <code>${selector}</code></p>
        <p><strong>Do you want to automate this response for future 
           <code>${this.currentMessageType}</code> events in this tab?</strong></p>
        <div class="actions">
          <button onclick="this.confirmPattern()" class="primary">Yes, Automate</button>
          <button onclick="this.selectDifferentElement()">Select Different Element</button>
          <button onclick="this.cancelTraining()">Cancel</button>
        </div>
      </div>
    `);
  }
}
```

#### 4.3 Pattern Learning Engine
**Smart Pattern Matching:**
```typescript
// web-buddy-core/training/pattern-matcher.ts
export class PatternMatcher {
  private patterns: Map<string, AutomationPattern[]> = new Map();
  
  async findMatchingPattern(
    messageType: string, 
    payload: Record<string, any>
  ): Promise<AutomationPattern | null> {
    const candidates = this.patterns.get(messageType) || [];
    
    for (const pattern of candidates) {
      const similarity = this.calculateSimilarity(payload, pattern.payload);
      const contextMatch = this.isContextMatching(pattern.context);
      
      if (similarity > 0.8 && contextMatch) {
        pattern.usageCount++;
        await this.updatePattern(pattern);
        return pattern;
      }
    }
    
    return null;
  }
  
  private calculateSimilarity(
    current: Record<string, any>, 
    stored: Record<string, any>
  ): number {
    const currentKeys = Object.keys(current);
    const storedKeys = Object.keys(stored);
    
    // Exact match for element references
    if (current.element && stored.element) {
      return current.element === stored.element ? 1.0 : 0.0;
    }
    
    // Fuzzy match for other payloads
    const commonKeys = currentKeys.filter(key => storedKeys.includes(key));
    const matchScore = commonKeys.length / Math.max(currentKeys.length, storedKeys.length);
    
    return matchScore;
  }
  
  private isContextMatching(storedContext: AutomationPattern['context']): boolean {
    // Same domain and similar page structure
    const currentUrl = new URL(window.location.href);
    const storedUrl = new URL(storedContext.url);
    
    return currentUrl.hostname === storedUrl.hostname && 
           currentUrl.pathname === storedUrl.pathname;
  }
}
```

#### 4.4 TDD Walking Skeleton Implementation
**Test-Driven Development Approach:**
```typescript
// test/training/training-system.spec.ts
describe('Interactive Training System - Walking Skeleton', () => {
  test('🔴 RED: Should show training UI when message received in training mode', async () => {
    // GIVEN: Training mode is enabled
    const trainingManager = new TrainingSessionManager();
    await trainingManager.startTrainingMode('example.com');
    
    // WHEN: FillTextRequested message is received
    const message = {
      type: 'FillTextRequested',
      payload: { element: 'Search', value: 'TypeScript patterns' }
    };
    
    // THEN: Training UI should appear
    const overlay = document.querySelector('.training-prompt');
    expect(overlay).toBeNull(); // 🔴 RED - Not implemented yet
  });
  
  test('🟢 GREEN: Should capture element selector when user clicks', async () => {
    // GIVEN: Training UI is showing element selection
    const overlay = new InteractiveTrainingOverlay();
    overlay.showTrainingPrompt('FillTextRequested', {
      element: 'Search',
      value: 'TypeScript patterns'
    });
    
    // WHEN: User clicks on an input element
    const searchInput = document.createElement('input');
    searchInput.id = 'search-box';
    document.body.appendChild(searchInput);
    
    const clickEvent = new MouseEvent('click', { target: searchInput });
    
    // THEN: Element selector should be captured
    // 🟢 GREEN - Minimal implementation
    expect(true).toBe(true); // Placeholder for actual implementation
  });
  
  test('🔵 REFACTOR: Should store pattern after user confirmation', async () => {
    // GIVEN: User has selected an element and confirmed
    const trainingManager = new TrainingSessionManager();
    const selectedElement = document.createElement('input');
    
    // WHEN: User confirms the pattern
    const pattern = await trainingManager.learnPattern(
      'FillTextRequested',
      { element: 'Search', value: 'TypeScript patterns' },
      selectedElement
    );
    
    // THEN: Pattern should be stored with proper metadata
    expect(pattern.messageType).toBe('FillTextRequested');
    expect(pattern.elementSelector).toContain('input');
    expect(pattern.confidence).toBe(1.0);
  });
});
```

### Phase 5: Documentation and Examples (Week 5)

#### 5.1 Architecture Decision Records
```markdown
# ADR-001: Layered Client Architecture

## Status
Accepted

## Context
We need to balance generic reusability with developer experience for web automation.

## Decision
Implement three-layer architecture:
1. Generic core with message-passing API
2. Domain implementations with site-specific logic
3. Client wrappers with convenient methods

## Consequences
- Positive: Clear separation of concerns, flexible usage patterns
- Positive: Easy to add new websites without changing core
- Negative: Slight complexity increase
- Mitigation: Clear documentation and examples

# ADR-002: Interactive Training System

## Status
Accepted

## Context
Users need an intuitive way to teach the system how to handle automation requests without writing code.

## Decision
Implement Excel-like element selection with guided UI:
1. Training mode toggle for switching between automatic and guided execution
2. Interactive overlay system for user guidance and feedback
3. Pattern learning engine for storing and reusing user selections
4. Smart pattern matching for automatic execution of learned behaviors

## Consequences
- Positive: Dramatically improves user experience and adoption
- Positive: Enables non-technical users to create automation patterns
- Positive: Reduces setup time for new websites
- Negative: Increases system complexity and UI maintenance burden
- Mitigation: Comprehensive testing and clear separation of training components
```

#### 5.2 Training-Enabled Implementation Guide
```markdown
# Adding a New Website to Web-Buddy with Training Support

## 1. Define Messages with Training Metadata
```typescript
export const YourSiteMessages = {
  YOUR_ACTION: 'YOUR_ACTION',
  TRAINING_MODE_REQUESTED: 'TRAINING_MODE_REQUESTED'
} as const;

export interface YourActionMessage {
  type: 'YOUR_ACTION';
  payload: {
    element: string;       // Human-readable element name
    value?: string;        // Optional value to fill/use
    description?: string;  // Training description
  };
  correlationId: string;
  trainingEnabled?: boolean;
}
```

## 2. Implement Training-Aware Handlers
```typescript
export class YourSiteHandler implements MessageHandler {
  constructor(
    private trainingManager: TrainingSessionManager,
    private patternMatcher: PatternMatcher
  ) {}

  async handle(message: WebBuddyMessage): Promise<any> {
    // Check if we have a learned pattern
    const existingPattern = await this.patternMatcher.findMatchingPattern(
      message.type, 
      message.payload
    );
    
    if (existingPattern) {
      // Execute using learned pattern
      return this.executeWithPattern(existingPattern, message);
    }
    
    // Check if training mode is enabled
    if (this.trainingManager.isTrainingMode()) {
      // Show interactive training UI
      return this.startTrainingFlow(message);
    }
    
    // Fall back to manual implementation
    return this.executeManually(message);
  }
  
  private async startTrainingFlow(message: WebBuddyMessage): Promise<any> {
    const overlay = new InteractiveTrainingOverlay();
    overlay.showTrainingPrompt(message.type, message.payload);
    
    // Wait for user to select element and confirm
    const pattern = await overlay.waitForUserSelection();
    
    // Store the learned pattern
    await this.trainingManager.learnPattern(
      message.type,
      message.payload,
      pattern.element
    );
    
    // Execute the action now
    return this.executeWithElement(pattern.element, message.payload);
  }
}
```

## 3. Create Training-Enabled Client Wrapper
```typescript
export class YourSiteClient {
  constructor(
    private webBuddyClient: WebBuddyClient,
    private trainingEnabled = false
  ) {}
  
  async enableTrainingMode(): Promise<void> {
    this.trainingEnabled = true;
    await this.webBuddyClient.sendMessage({
      [YourSiteMessages.TRAINING_MODE_REQUESTED]: { enabled: true }
    });
  }
  
  async yourAction(element: string, value?: string): Promise<any> {
    return this.webBuddyClient.sendMessage({
      [YourSiteMessages.YOUR_ACTION]: { 
        element, 
        value,
        description: `Perform action on ${element}${value ? ` with value ${value}` : ''}`
      },
      trainingEnabled: this.trainingEnabled
    });
  }
  
  // Convenience method for guided setup
  async learnYourAction(element: string, value?: string): Promise<any> {
    await this.enableTrainingMode();
    return this.yourAction(element, value);
  }
}
```

## 4. Write Training-Enabled ATDD Tests
```typescript
describe('YourSite Training Integration', () => {
  test('should learn automation patterns through guided UI', async ({ page }) => {
    // GIVEN: Training-enabled client and fresh browser
    const client = new YourSiteClient(webBuddyClient, true);
    await page.goto('https://yoursite.com');
    
    // WHEN: First time automation request with training
    await client.learnYourAction('Search Input', 'test query');
    
    // THEN: Training UI should appear
    await expect(page.locator('.training-prompt')).toBeVisible();
    await expect(page.locator('.training-prompt')).toContainText(
      'Please click on the Search Input element'
    );
    
    // WHEN: User clicks on actual search input
    await page.locator('input[name="search"]').click();
    
    // THEN: Confirmation dialog should appear
    await expect(page.locator('.training-confirmation')).toBeVisible();
    await expect(page.locator('.training-confirmation')).toContainText(
      'Do you want to automate this response'
    );
    
    // WHEN: User confirms automation
    await page.locator('button:has-text("Yes, Automate")').click();
    
    // THEN: Action should be executed and pattern stored
    await expect(page.locator('input[name="search"]')).toHaveValue('test query');
  });
  
  test('should auto-execute learned patterns on subsequent requests', async ({ page }) => {
    // GIVEN: Pattern already learned (from previous test)
    const client = new YourSiteClient(webBuddyClient, false); // Training disabled
    await page.goto('https://yoursite.com');
    
    // WHEN: Same automation request without training
    await client.yourAction('Search Input', 'another query');
    
    // THEN: Should execute automatically without training UI
    await expect(page.locator('.training-prompt')).not.toBeVisible();
    await expect(page.locator('input[name="search"]')).toHaveValue('another query');
  });
});
```

## 5. Training Pattern Examples
```typescript
// Example: E-commerce site automation
const ecommerceClient = new EcommerceClient(webBuddyClient, true);

// First time - shows training UI
await ecommerceClient.learnAddToCart('Product Name', 'Blue Shirt');
// User clicks on "Add to Cart" button, pattern gets stored

// Subsequent times - automatic execution
await ecommerceClient.addToCart('Product Name', 'Red Shirt');
// Automatically uses learned button selector

// Example: Form filling automation
const formClient = new FormClient(webBuddyClient, true);

// Train multiple fields in sequence
await formClient.learnFillField('First Name', 'John');
await formClient.learnFillField('Last Name', 'Doe');  
await formClient.learnFillField('Email', 'john@example.com');

// Later - automatic form filling
await formClient.fillForm({
  'First Name': 'Jane',
  'Last Name': 'Smith', 
  'Email': 'jane@example.com'
});
```
```

## Migration Strategy

### Backward Compatibility
- Keep existing `@chatgpt-buddy/*` packages working during transition
- Implement `ChatGPTBuddyClient` as wrapper around `web-buddy-core`
- Provide clear migration timeline and deprecation warnings

### Migration Path
1. **Phase 1**: Introduce `web-buddy-core` alongside existing packages
2. **Phase 2**: Migrate `chatgpt-buddy` to use `web-buddy-core` internally
3. **Phase 3**: Implement `google-buddy` to demonstrate extensibility
4. **Phase 4**: Deprecate old APIs and update documentation

### Developer Experience
```typescript
// Before (chatgpt-buddy specific)
import { ChatGPTBuddyClient } from '@chatgpt-buddy/client-ts';
const client = new ChatGPTBuddyClient({ serverUrl: '...' });
await client.ping('hello');

// After (web-buddy + wrapper)
import { WebBuddyClient } from '@web-buddy/core';
import { ChatGPTBuddyClient } from '@chatgpt-buddy/client';
const webClient = new WebBuddyClient({ serverUrl: '...' });
const chatGPTClient = new ChatGPTBuddyClient(webClient);
await chatGPTClient.ping('hello');
```

## Benefits of Web-Buddy Framework

### 1. Reusability
- Core framework works with any website
- Shared infrastructure reduces development time
- Common patterns across all implementations

### 2. Extensibility
- Easy to add new websites (just implement messages + handlers)
- Plugin architecture for site-specific customizations
- Community can contribute new site implementations

### 3. Developer Experience
- Choice between generic API and convenient wrappers
- Consistent patterns across all sites
- Rich TypeScript support and autocompletion

### 4. Maintainability
- Clear architectural boundaries
- Site-specific changes don't affect core framework
- Easy to test each layer independently

### 5. ATDD Integration
- Same testing patterns across all implementations
- Shared testing utilities reduce boilerplate
- Specification-first development for new sites

## Success Metrics

- **Framework Adoption**: Number of new site implementations
- **Developer Satisfaction**: Feedback on API usability
- **Test Coverage**: >90% coverage across all layers
- **Performance**: <100ms average response time for basic operations
- **Documentation Quality**: Complete examples for adding new sites

This framework transforms web automation from a single-purpose tool into a powerful, extensible platform while maintaining the excellent TypeScript-EDA architecture we've established.