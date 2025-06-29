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

### Phase 4: Documentation and Examples (Week 4)

#### 4.1 Architecture Decision Records
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
```

#### 4.2 Implementation Guide
```markdown
# Adding a New Website to Web-Buddy

## 1. Define Messages
```typescript
export const YourSiteMessages = {
  YOUR_ACTION: 'YOUR_ACTION'
} as const;
```

## 2. Implement Handlers
```typescript
export class YourSiteHandler implements MessageHandler {
  async handle(message: WebBuddyMessage): Promise<any> {
    // Site-specific DOM manipulation
  }
}
```

## 3. Create Client Wrapper
```typescript
export class YourSiteClient {
  async yourAction(): Promise<any> {
    return this.webBuddyClient.sendMessage({
      [YourSiteMessages.YOUR_ACTION]: {}
    });
  }
}
```

## 4. Write ATDD Tests
```typescript
test('should automate your site', async ({ page }) => {
  const client = new YourSiteClient(webBuddyClient);
  await client.yourAction();
  // Verify browser state
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