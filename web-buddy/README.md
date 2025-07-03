# Web-Buddy Framework

A generic web automation framework built on TypeScript-EDA that enables building multi-site automation with clean architecture and event-driven patterns.

## Overview

Web-Buddy extends TypeScript-EDA to provide a powerful foundation for browser automation. Instead of writing site-specific automation from scratch, Web-Buddy provides:

- **Generic Infrastructure**: Message correlation, browser communication, error handling
- **Domain-Specific Logic**: Site-specific messages and handlers (Google, Wikipedia, etc.)
- **Developer-Friendly APIs**: Convenient wrapper methods for common automation patterns

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Layer    │    │   API Layer    │    │   API Layer    │
│ GoogleBuddy     │    │ WikipediaBuddy │    │  TwitterBuddy   │
│ Client          │    │ Client         │    │  Client         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │              Domain Layer                           │
         │  Site-specific Messages & Handlers                 │
         │  ENTER_SEARCH_TERM, GET_RESULTS, CLICK_LINK       │
         └─────────────────────────────────────────────────────┘
                                 │
         ┌─────────────────────────────────────────────────────┐
         │               Core Layer                            │
         │  Generic WebBuddyClient, Message Correlation       │
         │  Browser Communication, Error Handling             │
         └─────────────────────────────────────────────────────┘
```

## Quick Start

### Installation

```bash
npm install @web-buddy/core @web-buddy/google-buddy
# or with pnpm
pnpm add @web-buddy/core @web-buddy/google-buddy
```

### Basic Usage

```typescript
import { WebBuddyClient } from '@web-buddy/core';
import { GoogleBuddyClient } from '@web-buddy/google-buddy';

// Setup
const webClient = new WebBuddyClient({ serverUrl: 'http://localhost:3000' });
const googleClient = new GoogleBuddyClient(webClient);

// Simple automation
const results = await googleClient.search('TypeScript patterns');
console.log(`Found ${results.length} results`);

// Advanced workflows
const report = await googleClient.searchAndAnalyze([
  'TypeScript', 'React', 'Node.js'
]);
```

## Packages

- `@web-buddy/core` - Core infrastructure and generic client
- `@web-buddy/testing` - Testing utilities and helpers
- `@web-buddy/google-buddy` - Google automation implementation
- `@web-buddy/wikipedia-buddy` - Wikipedia automation implementation

## Implementations

This repository includes several reference implementations:

- **Google-Buddy**: Complete Google search automation with ATDD examples
- **Wikipedia-Buddy**: Wikipedia article research and content extraction
- **Multi-Site Research**: Cross-site automation combining multiple sources

## Development

```bash
# Install dependencies
pnpm install

# Build all packages
pnpm build

# Run tests
pnpm test

# Start development server
pnpm dev
```

## Documentation

- [Getting Started Guide](./docs/getting-started.org) - Comprehensive tutorial
- [Architecture Guide](./docs/index.org) - Framework design and patterns
- [Implementation Examples](./implementations/) - Real-world usage examples
- [API Reference](https://web-buddy.dev/api) - Complete API documentation

## Framework Benefits

### 1. Layered Architecture
- **Core**: Generic messaging and correlation
- **Domain**: Site-specific business logic  
- **API**: Developer experience layer

### 2. Flexible Usage Patterns
- Beginners use convenient wrapper methods
- Advanced users access low-level message API
- Both approaches fully tested and supported

### 3. Extensible Framework
- Adding new websites requires only domain implementation
- Core framework remains unchanged
- Shared testing utilities reduce implementation time

### 4. Event-Driven Design
- Built on TypeScript-EDA for robust event handling
- Automatic correlation and message tracking
- Time-travel debugging and pattern replay

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](./LICENSE) file for details.

## Related Projects

- [TypeScript-EDA](../typescript-eda/) - Event-driven architecture foundation
- [ChatGPT-Buddy](../) - AI automation built on Web-Buddy