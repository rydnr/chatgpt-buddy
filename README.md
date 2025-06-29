# Web-Buddy Framework

> Generic web automation with event-driven architecture and layered client APIs

## Architecture Overview

Web-Buddy is a generic web automation framework that transforms single-purpose tools into extensible, maintainable automation platforms. It demonstrates a three-layer architecture:

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

### Key Benefits

- **Reusable Core**: Generic message-passing infrastructure works with any website
- **Domain-Specific Logic**: Site-specific automation without core changes
- **Developer Experience**: Choice between generic API and convenient wrappers
- **Test-Driven**: ATDD with Playwright for browser automation specification
- **Type-Safe**: Full TypeScript support with strong typing

## Quick Start

### 1. Install Core Framework

```bash
npm install @web-buddy/core
```

### 2. Install Domain Implementation

```bash
npm install @google-buddy/client  # For Google search automation
# or
npm install @chatgpt-buddy/client # For ChatGPT automation
```

### 3. Use the Convenient API

```typescript
import { createWebBuddyClient } from '@web-buddy/core';
import { GoogleBuddyClient } from '@google-buddy/client';

// Setup
const webClient = createWebBuddyClient({ 
  serverUrl: 'http://localhost:3000' 
});
const googleClient = new GoogleBuddyClient(webClient);

// Perform automation
const results = await googleClient.search('TypeScript EDA patterns');
console.log(`Found ${results.length} results`);

const firstResult = await googleClient.getFirstResult();
console.log(`Top result: ${firstResult.title}`);
```

### 4. Or Use the Generic API for Power Users

```typescript
import { createWebBuddyClient } from '@web-buddy/core';
import { GoogleMessages } from '@google-buddy/client';

const webClient = createWebBuddyClient({ 
  serverUrl: 'http://localhost:3000' 
});

// Direct message sending - more control, more verbose
const response = await webClient.sendMessage({
  [GoogleMessages.ENTER_SEARCH_TERM]: {
    searchTerm: 'advanced search query',
    correlationId: 'my-custom-id-123'
  }
});
```

## Packages

### Core Framework

- **`@web-buddy/core`** - Generic messaging infrastructure, client, server, and extension framework

### Domain Implementations

- **`@google-buddy/client`** - Google search automation with convenient API
- **`@chatgpt-buddy/client`** - ChatGPT automation (legacy, being migrated)

### Development Tools

- **`@web-buddy/testing`** - Shared ATDD utilities for Playwright testing
- **`@web-buddy/cli`** - Command-line tools for automation

## Examples

### Google Search Automation

```typescript
// Simple search
const results = await googleClient.search('TypeScript');

// Search and click first result ("I'm feeling lucky")
const clickResult = await googleClient.searchAndClickFirst('TypeScript tutorial');

// Batch search multiple terms
const batchResults = await googleClient.batchSearch([
  'TypeScript', 'JavaScript', 'React'
]);

// Advanced filtering
const filteredResults = await googleClient.searchWithFilter(
  'web frameworks',
  (result) => result.title.includes('React')
);
```

### Multi-Site Workflow

```typescript
// Use multiple domain clients together
const googleClient = new GoogleBuddyClient(webClient);
const chatGPTClient = new ChatGPTBuddyClient(webClient);

// Research workflow
const searchResults = await googleClient.search('React best practices');
const topResult = await googleClient.getFirstResult();

// Ask ChatGPT about the findings
await chatGPTClient.selectProject('web-development');
const analysis = await chatGPTClient.askQuestion(
  `Analyze this article: ${topResult.title}. What are the key takeaways?`
);
```

## Architecture Principles

### 1. Event-Driven Communication

All interactions are represented as events with correlation IDs for tracking:

```typescript
// Domain events
export class EnterSearchTermMessage extends BaseMessage {
  public readonly type = 'ENTER_SEARCH_TERM';
  
  constructor(searchTerm: string, correlationId?: string) {
    super({ searchTerm }, correlationId, 'google.com');
  }
}
```

### 2. Layered Client Architecture

- **Core Layer**: `WebBuddyClient.sendMessage()` - Generic message passing
- **Domain Layer**: `GoogleMessages.ENTER_SEARCH_TERM` - Site-specific messages
- **API Layer**: `googleClient.search()` - Developer-friendly methods

### 3. Test-Driven Development

ATDD with Playwright defines browser automation behavior:

```typescript
test('should perform complete Google search automation', async ({ page }) => {
  // GIVEN: Google homepage is loaded with extension
  await page.goto('https://google.com');
  
  // WHEN: Search automation is executed
  await googleClient.search('TypeScript EDA patterns');
  
  // THEN: Browser state reflects the automation
  await expect(page.locator('input[name="q"]'))
    .toHaveValue('TypeScript EDA patterns');
});
```

## Adding New Websites

Extending Web-Buddy to automate new websites follows a consistent pattern:

### 1. Define Messages

```typescript
// your-site-buddy/messages.ts
export const YourSiteMessages = {
  YOUR_ACTION: 'YOUR_ACTION'
} as const;

export class YourActionMessage extends BaseMessage {
  public readonly type = YourSiteMessages.YOUR_ACTION;
  // ... implementation
}
```

### 2. Implement Handlers

```typescript
// your-site-buddy/handlers.ts
export class YourSiteHandler implements MessageHandler {
  async handle(message: WebBuddyMessage): Promise<any> {
    // Site-specific DOM manipulation
  }
}
```

### 3. Create Client Wrapper

```typescript
// your-site-buddy/client.ts
export class YourSiteBuddyClient {
  async yourAction(): Promise<any> {
    return this.webBuddyClient.sendMessage({
      [YourSiteMessages.YOUR_ACTION]: {}
    });
  }
}
```

### 4. Write ATDD Tests

```typescript
test('should automate your site', async ({ page }) => {
  const client = new YourSiteBuddyClient(webBuddyClient);
  await client.yourAction();
  // Verify browser state
});
```

## Development

### Prerequisites

- Node.js 18+
- pnpm 8+
- TypeScript 5+

### Setup

```bash
# Clone repository
git clone https://github.com/rydnr/chatgpt-buddy.git
cd chatgpt-buddy

# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test
```

### Running Examples

```bash
# Start the Web-Buddy server
pnpm dev:server

# In another terminal, run the demo
node examples/google-automation-demo.js
```

### Testing

```bash
# Unit tests
pnpm test:unit

# Integration tests
pnpm test:integration

# End-to-end tests with Playwright
pnpm test:e2e
```

## Documentation

- [Architecture Guide](./specs/web-buddy-framework-roadmap.md) - Detailed technical architecture
- [ATDD Guide](./atdd-with-google-example.org) - Test-driven development approach
- [Migration Guide](./docs/migration-guide.md) - Upgrading from ChatGPT-Buddy v1
- [API Reference](./docs/api-reference.md) - Complete API documentation

## Contributing

1. **Follow the layered architecture** - Changes should respect the core/domain/API separation
2. **Write tests first** - Use ATDD for browser features, unit tests for logic
3. **Add documentation** - Update relevant docs and examples
4. **Maintain compatibility** - Don't break existing domain implementations

## License

GPL-3.0 - See [LICENSE](./LICENSE) for details.

## Related Projects

- [TypeScript-EDA](https://github.com/rydnr/typescript-eda) - Event-driven architecture framework
- [Playwright](https://playwright.dev/) - Browser automation and testing
- [ChatGPT-Buddy v1](https://github.com/rydnr/chatgpt-buddy/tree/v1) - Original ChatGPT-specific tool