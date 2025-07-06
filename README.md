# ChatGPT-Buddy

> AI-powered web automation tool built on Web-Buddy framework for ChatGPT and language model integration

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Overview

ChatGPT-Buddy is a specialized implementation of the Web-Buddy framework that enables intelligent automation through ChatGPT and other language models. It provides a complete AI automation platform with browser extension integration, intelligent pattern recognition, and multi-model support.

## Architecture Overview

ChatGPT-Buddy is built on the Web-Buddy framework ecosystem, leveraging event-driven architecture and TypeScript-EDA patterns:

```ascii
┌─────────────────────────────────────────────────────────┐
│                   ChatGPT-Buddy                         │
├─────────────────────────────────────────────────────────┤
│  🤖 AI Integration    │  🧠 Pattern Recognition         │
│  • OpenAI API        │  • Workflow Analysis             │
│  • Anthropic API     │  • Automation Insights           │
│  • Multi-model       │  • Learning Engine               │
├─────────────────────────────────────────────────────────┤
│                   Web-Buddy Framework                   │
├─────────────────────────────────────────────────────────┤
│  🌐 Server Framework  │  🧩 Browser Extension           │
│  • Event Coordination│  • Training System               │
│  • WebSocket Server  │  • Pattern Execution             │
│  • REST API Gateway  │  • Cross-Site Adaptation         │
├─────────────────────────────────────────────────────────┤
│                  TypeScript-EDA Foundation             │
├─────────────────────────────────────────────────────────┤
│  🏗️ Domain Layer      │  🔧 Infrastructure Layer        │
│  • Events & Entities │  • Adapters & Ports              │
│  🎯 Application Layer │  • Event Bus & Decorators       │
└─────────────────────────────────────────────────────────┘
```

### Key Features

- 🤖 **Multi-Model AI Integration**: Support for GPT-4, Claude, and custom models
- 🎯 **Intelligent Automation**: AI-enhanced web automation with pattern recognition
- 🧠 **Learning Engine**: Learns from user interactions to improve automation
- 🔄 **Cross-Site Adaptation**: Patterns work across different websites
- 📊 **Performance Analytics**: Comprehensive metrics and optimization insights
- 🛡️ **Privacy-First**: Local processing with user-controlled data sharing

## Quick Start

### Prerequisites

- **Node.js 18+** - [Download here](https://nodejs.org/)
- **pnpm 8+** - Install with `npm install -g pnpm`

### Installation

```bash
# Clone the repository
git clone https://github.com/rydnr/chatgpt-buddy.git
cd chatgpt-buddy

# Install all workspace dependencies
pnpm install
# or use the convenience script
pnpm run install:all
```

> ⚠️ **Important**: This project uses **pnpm workspaces**. Always use `pnpm` commands, not `npm` commands.

### Environment Setup

Create a `.env` file in the server directory:

```bash
# AI API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Server Configuration
PORT=3003
NODE_ENV=development
LOG_LEVEL=info

# Security
ENABLE_AUTH=false
CORS_ORIGINS=http://localhost:3000

# Features
ENABLE_PATTERN_RECOGNITION=true
ENABLE_AI_INSIGHTS=true
```

### Start the Development Server

```bash
# Start development server (minimal HTTP server for testing)
pnpm run dev
```

The server will start on `http://localhost:3000` with these endpoints:
- `GET /health` - Health check
- `POST /api/dispatch` - API dispatch for browser extension  
- `POST /api/training/enable` - Enable training mode
- `GET /api/training/patterns` - Get training patterns

### Build and Production

```bash
# Build all packages (now working!)
pnpm run build

# Build specific package groups:
pnpm run build:packages    # ChatGPT-Buddy packages only
pnpm run build:web-buddy   # Web-Buddy framework packages only

# Development server:
pnpm run dev

# For production:
pnpm run start
```

> ✅ **Build Status**: The workspace build has been fixed! `pnpm run build` now successfully builds all ChatGPT-Buddy and Web-Buddy packages using proper TypeScript project references and composite builds.

### Install Browser Extension

1. **Build the extension** (copies all necessary files automatically):
   ```bash
   # Build from project root
   pnpm run build:extension
   
   # Or build from extension directory
   cd extension && npm run build
   ```

2. **Load in Chrome**:
   - Open `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)
   - Click "Load unpacked"
   - Navigate to and select the `extension/build/` directory
   
   **Full path**: `/path/to/chatgpt-buddy/extension/build/`

3. **Verify Installation**:
   - You should see "ChatGPT-Buddy" extension in your extensions list
   - The extension icon should appear in your browser toolbar
   - Click the icon to open the popup and configure server connection

> ✅ **Extension Status**: The browser extension build process automatically copies all necessary files (manifest.json, assets, HTML files) to the build directory.

## AI Integration Examples

### Basic ChatGPT Automation

```typescript
import { ChatGPTBuddyClient } from '@chatgpt-buddy/client';

const client = new ChatGPTBuddyClient({
  serverUrl: 'http://localhost:3003',
  openaiApiKey: process.env.OPENAI_API_KEY
});

// Simple AI interaction
const response = await client.chat({
  prompt: "Explain quantum computing in simple terms",
  model: "gpt-4",
  context: {
    userLevel: "beginner",
    preferredStyle: "conversational"
  }
});

console.log(response.content);
```

### Intelligent Web Automation

```typescript
// AI-enhanced automation with pattern learning
const automationResult = await client.automateWithAI({
  task: "Research and summarize information about renewable energy",
  instructions: [
    "Search for recent renewable energy articles",
    "Extract key statistics and trends", 
    "Generate a comprehensive summary"
  ],
  options: {
    enableLearning: true,
    crossSiteAdaptation: true,
    aiInsights: true
  }
});
```

### Pattern Recognition and Learning

```typescript
// Enable training mode for pattern learning
await client.extension.enableTrainingMode({
  sessionType: 'ai_enhanced',
  learningLevel: 'advanced',
  patternTypes: ['research_workflow', 'data_extraction']
});

// The extension will learn from user interactions
// and suggest automation improvements
```

## Advanced Features

### Multi-Model AI Support

```typescript
// Intelligent model selection based on task
const client = new ChatGPTBuddyClient({
  modelStrategy: 'intelligent_selection',
  availableModels: [
    { name: 'gpt-4', capabilities: ['reasoning', 'code'], cost: 'high' },
    { name: 'gpt-3.5-turbo', capabilities: ['general'], cost: 'low' },
    { name: 'claude-3-opus', capabilities: ['analysis'], cost: 'medium' }
  ]
});

// AI automatically selects the best model for each task
const response = await client.smartChat({
  prompt: "Write a Python script to analyze CSV data",
  requirements: {
    accuracy: 'high',
    speed: 'medium', 
    cost: 'optimize'
  }
});
```

### AI-Powered Workflow Optimization

```typescript
// Analyze and optimize automation workflows
const optimization = await client.optimizeWorkflow({
  workflowId: 'research_automation',
  criteria: ['speed', 'accuracy', 'cost'],
  aiAnalysis: true
});

console.log('Optimization suggestions:', optimization.suggestions);
console.log('Expected improvement:', optimization.expectedImprovement);
```

### Intelligent Error Recovery

```typescript
// AI-enhanced error recovery
await client.setErrorRecovery({
  enableAIRecovery: true,
  strategies: [
    'alternative_selectors',
    'semantic_analysis',
    'ai_problem_solving',
    'user_guidance'
  ],
  maxRetries: 3,
  learningEnabled: true
});
```

## Browser Extension Integration

### Training Mode

The ChatGPT-Buddy extension learns from user demonstrations:

1. **Activate Training**: Click the ChatGPT-Buddy icon and select "Start Training"
2. **Demonstrate Workflow**: Perform your automation task normally
3. **AI Analysis**: The extension analyzes your actions with AI insights
4. **Pattern Generation**: Creates intelligent automation patterns
5. **Cross-Site Testing**: Validates patterns across similar websites

### AI-Enhanced Features

- **Semantic Element Detection**: AI identifies elements by purpose, not just selectors
- **Context-Aware Actions**: Understands the intent behind user actions
- **Intelligent Adaptation**: Automatically adapts to website changes
- **Natural Language Commands**: Control automation with conversational commands

## API Reference

### ChatGPT Integration

```typescript
interface ChatGPTRequest {
  prompt: string;
  model?: 'gpt-4' | 'gpt-4-turbo' | 'gpt-3.5-turbo';
  context?: ConversationContext;
  options?: {
    maxTokens?: number;
    temperature?: number;
    enableStreaming?: boolean;
  };
}

interface ChatGPTResponse {
  content: string;
  usage: TokenUsage;
  modelUsed: string;
  responseTime: number;
  confidence?: number;
  suggestions?: string[];
}
```

### Automation with AI

```typescript
interface AIAutomationRequest {
  task: string;
  instructions?: string[];
  context?: PageContext;
  options?: {
    enableLearning?: boolean;
    aiInsights?: boolean;
    crossSiteAdaptation?: boolean;
    errorRecovery?: boolean;
  };
}

interface AIAutomationResponse {
  success: boolean;
  results: AutomationResult[];
  aiInsights: AIInsight[];
  learnedPatterns: AutomationPattern[];
  performance: PerformanceMetrics;
}
```

## Development

### Project Structure

```
chatgpt-buddy/
├── extension/                          # ChatGPT-Buddy browser extension (working)
│   ├── build/                         # Built extension ready for Chrome
│   └── src/                           # ChatGPT-specific extension source
├── server/                            # AI automation server
│   └── src/                           # Server applications and adapters
├── packages/                          # ChatGPT-Buddy packages (TypeScript-EDA)
│   ├── chatgpt-buddy-core/           # Shared domain & events
│   ├── chatgpt-buddy-server/         # Server application
│   └── chatgpt-buddy-client-ts/      # TypeScript client SDK
├── web-buddy/                         # Web-Buddy Framework
│   ├── packages/
│   │   ├── core/                     # Generic automation framework
│   │   └── browser-extension/        # Generic browser extension framework
│   └── implementations/
│       └── google-buddy/             # Google automation example
└── client/                            # Additional client SDKs
    ├── typescript/                    # TypeScript SDK
    └── python/                        # Python SDK
```

> 📋 **Architecture**: The project follows a plugin architecture where ChatGPT-Buddy is a specific implementation built on the generic Web-Buddy framework. See [ARCHITECTURE_REORGANIZATION.md](./ARCHITECTURE_REORGANIZATION.md) for details.

### Building and Testing

```bash
# Development workflow (recommended)
pnpm run dev           # Start development server

# Build working packages
cd web-buddy && pnpm run build

# Run tests
pnpm test

# Run E2E tests  
pnpm run test:e2e
```

### Available Commands

| Command | Status | Description |
|---------|--------|-------------|
| `pnpm install` | ✅ Working | Install all workspace dependencies |
| `pnpm run dev` | ✅ Working | Start development server |
| `pnpm run build` | ✅ Fixed | Build all packages with TypeScript project references |
| `pnpm run build:packages` | ✅ Working | Build ChatGPT-Buddy packages only |
| `pnpm run build:extension` | ✅ Working | Build browser extension with all assets |
| `pnpm run build:web-buddy` | ✅ Working | Build Web-Buddy framework packages |
| `pnpm test` | ✅ Working | Run all tests |

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/ai-enhancement`
3. Make your changes with tests
4. Run the test suite: `pnpm test`
5. Submit a pull request

### Troubleshooting

#### NPM vs PNPM
This project uses **pnpm workspaces**. Always use `pnpm` commands:

❌ Don't use: `npm install`, `npm run build`  
✅ Use instead: `pnpm install`, `pnpm run build`

#### Development Server
The development server (`pnpm run dev`) starts a minimal HTTP server for testing. For full functionality, build all workspace packages first.

#### Build Issues
The full workspace build currently has dependency issues. For development:

1. **Use development server**: `pnpm run dev` (always works)
2. **Build individual packages**: `cd web-buddy && pnpm run build`
3. **Clean and reinstall**: `rm -rf node_modules && pnpm install`
4. **Check status**: See [BUILD_STATUS.md](./BUILD_STATUS.md) for detailed information

The development server provides full API functionality without requiring complex builds.

## Configuration

### Server Configuration

The server can be configured via environment variables or a configuration file:

```typescript
export interface ChatGPTBuddyConfig {
  ai: {
    openaiApiKey: string;
    anthropicApiKey?: string;
    defaultModel: string;
    enableModelSwitching: boolean;
    costOptimization: boolean;
  };
  automation: {
    enablePatternLearning: boolean;
    crossSiteAdaptation: boolean;
    intelligentErrorRecovery: boolean;
    performanceOptimization: boolean;
  };
  privacy: {
    localProcessing: boolean;
    dataRetentionDays: number;
    anonymizeData: boolean;
    userControlledSharing: boolean;
  };
}
```

## Performance and Monitoring

### AI Performance Metrics

- **Response Time**: Average AI model response times
- **Cost Optimization**: Token usage and cost tracking
- **Model Performance**: Accuracy and user satisfaction scores
- **Pattern Success Rate**: Automation pattern execution success rates

### Monitoring Dashboard

Access the monitoring dashboard at `http://localhost:3003/dashboard` to view:

- Real-time AI interaction metrics
- Automation pattern performance
- Cost optimization insights
- User satisfaction analytics

## Examples and Use Cases

### Research Automation

```typescript
// Automated research with AI summarization
const research = await client.researchTopic({
  topic: "latest developments in quantum computing",
  sources: ["academic", "news", "industry"],
  aiSummary: {
    style: "technical",
    length: "comprehensive",
    includeStats: true
  }
});
```

### Content Generation

```typescript
// AI-powered content creation with web research
const content = await client.generateContent({
  type: "blog_post",
  topic: "The future of web automation",
  research: {
    enableWebSearch: true,
    factChecking: true,
    sourceVerification: true
  },
  style: {
    tone: "professional",
    audience: "developers",
    length: "2000-3000 words"
  }
});
```

### Data Analysis Automation

```typescript
// Automated data extraction and AI analysis
const analysis = await client.analyzeWebData({
  sources: ["https://example.com/data"],
  extractionRules: {
    tables: true,
    charts: true,
    statistics: true
  },
  aiAnalysis: {
    generateInsights: true,
    identifyTrends: true,
    predictOutcomes: true
  }
});
```

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
pnpm run build

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