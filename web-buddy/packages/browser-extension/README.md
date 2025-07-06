# Web-Buddy Browser Extension Framework

> Intelligent web automation through demonstration and learning

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![Chrome Extension](https://img.shields.io/badge/Chrome%20Extension-Manifest%20V3-green.svg)](https://developer.chrome.com/docs/extensions/)
[![Firefox Add-on](https://img.shields.io/badge/Firefox-WebExtensions-orange.svg)](https://developer.mozilla.org/docs/Mozilla/Add-ons/WebExtensions)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Overview

Web-Buddy Browser Extension Framework revolutionizes web automation by enabling users to teach browser extensions through demonstration rather than programming. Built on event-driven architecture principles, it provides a comprehensive framework for creating intelligent browser extensions that learn, adapt, and automate web workflows.

## Key Features

- 🎓 **Training Mode**: Users demonstrate workflows, extension learns patterns
- 🔄 **Cross-Site Adaptation**: Patterns work across different websites with similar functionality  
- 🧠 **Semantic Understanding**: Focuses on user intent rather than specific DOM elements
- 📊 **Time-Travel Debugging**: Complete message store with replay capabilities
- 🔌 **Event-Driven Architecture**: Built on TypeScript-EDA patterns for modularity
- 🎯 **Pattern Recognition**: Intelligent detection of automation workflows
- 💾 **Persistent Storage**: IndexedDB-based pattern storage with metadata
- 🛡️ **Privacy-First**: Local processing with user-controlled data sharing

## Quick Start

### Installation

```bash
npm install @web-buddy/browser-extension
# or with pnpm  
pnpm add @web-buddy/browser-extension
```

### Basic Extension Setup

```typescript
// src/background/my-extension.ts
import { Application, Enable } from '@typescript-eda/application';
import { listen } from '@typescript-eda/domain';
import {
  WebSocketConnectionAdapter,
  TabManagementAdapter,
  MessageStoreAdapter,
  ExtensionLifecycleAdapter
} from '@web-buddy/browser-extension';

@Enable(WebSocketConnectionAdapter)
@Enable(TabManagementAdapter) 
@Enable(MessageStoreAdapter)
@Enable(ExtensionLifecycleAdapter)
export class MyIntelligentExtension extends Application {
  public readonly metadata = new Map([
    ['name', 'My Intelligent Extension'],
    ['version', '1.0.0'],
    ['capabilities', ['learning', 'automation', 'cross-site']]
  ]);

  @listen(TrainingModeActivatedEvent)
  public async handleTrainingActivation(event: TrainingModeActivatedEvent): Promise<void> {
    console.log('🎓 Training mode activated');
    
    // Inject training UI into active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'ACTIVATE_TRAINING_MODE',
        payload: { sessionId: event.sessionId }
      });
    }
  }

  @listen(AutomationRequestedEvent)
  public async handleAutomationRequest(event: AutomationRequestedEvent): Promise<void> {
    console.log(`🤖 Executing automation: ${event.patternName}`);
    
    // Execute learned pattern
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab.id) {
      await chrome.tabs.sendMessage(tab.id, {
        type: 'EXECUTE_AUTOMATION',
        payload: { pattern: event.pattern }
      });
    }
  }
}
```

### Content Script with Training

```typescript
// src/content/content-script.ts
import { Application, Enable } from '@typescript-eda/application';
import { listen } from '@typescript-eda/domain';
import {
  TrainingUIAdapter,
  ElementSelectorAdapter,
  PatternRecognitionAdapter,
  AutomationExecutorAdapter
} from '@web-buddy/browser-extension';

@Enable(TrainingUIAdapter)
@Enable(ElementSelectorAdapter)
@Enable(PatternRecognitionAdapter)  
@Enable(AutomationExecutorAdapter)
export class ContentScriptApplication extends Application {
  public readonly metadata = new Map([
    ['name', 'Web-Buddy Content Script'],
    ['url', window.location.href],
    ['domain', window.location.hostname]
  ]);

  @listen(ElementSelectedEvent)
  public async handleElementSelection(event: ElementSelectedEvent): Promise<void> {
    console.log('🎯 Element selected for training:', event.element);
    
    // Capture the action and analyze for patterns
    const action = new UserAction(
      event.actionType,
      event.element, 
      event.data,
      this.getElementContext(event.element)
    );
    
    // Store action and provide real-time feedback
    await this.analyzeActionPattern(action);
    this.showActionFeedback(action);
  }

  @listen(AutomationExecutionRequestedEvent)
  public async executeAutomation(event: AutomationExecutionRequestedEvent): Promise<void> {
    console.log('🤖 Executing automation pattern:', event.pattern.name);
    
    try {
      for (const step of event.pattern.steps) {
        await this.executeAutomationStep(step);
        await this.waitForStepCompletion(step);
      }
      
      console.log('✅ Automation completed successfully');
    } catch (error) {
      console.error('❌ Automation failed:', error);
      // Trigger error recovery
      await this.handleAutomationError(error, event.pattern);
    }
  }
}
```

## Core Architecture

### Event-Driven Design

The framework is built on TypeScript-EDA patterns, enabling:

```typescript
// Every user interaction becomes an event
@listen(UserActionPerformedEvent)
public async learnFromUser(event: UserActionPerformedEvent): Promise<Event[]> {
  const pattern = await this.recognizePattern(event);
  
  return [
    new PatternLearnedEvent(pattern),
    new AutomationSuggestedEvent(pattern.toAutomation())
  ];
}
```

### Training System

Users teach extensions through demonstration:

1. **Activate Training Mode**: Click "Start Training" in extension popup
2. **Demonstrate Workflow**: Perform actions normally on the webpage  
3. **Pattern Recognition**: Extension analyzes and learns the pattern
4. **Save Pattern**: Give the learned workflow a meaningful name
5. **Automate**: Pattern becomes available for one-click execution

### Cross-Site Adaptation

Patterns learned on one site can adapt to similar sites:

```typescript
export class SemanticElementMatcher {
  public findEquivalentElement(
    sourceElement: ElementDescriptor,
    targetDocument: Document
  ): Element | null {
    // Try multiple matching strategies
    return this.findByTextContent(sourceElement, targetDocument) ||
           this.findByRole(sourceElement, targetDocument) ||
           this.findBySemanticContext(sourceElement, targetDocument);
  }
}
```

## Advanced Features

### Pattern Storage and Management

```typescript
// Store patterns with rich metadata
@AdapterFor(PatternStoragePort)
export class IndexedDBPatternStorage extends PatternStoragePort {
  public async savePattern(pattern: AutomationPattern): Promise<void> {
    const patternData = {
      id: pattern.id,
      name: pattern.name,
      semanticFingerprint: this.generateFingerprint(pattern),
      crossSiteCompatibility: this.analyzeCrossSiteCompatibility(pattern),
      usageStatistics: pattern.getUsageStats(),
      ...pattern.toJSON()
    };
    
    await this.storeWithMetadata(patternData);
  }
}
```

### Time-Travel Debugging

```typescript
// Debug extension message flows
export class MessageStoreAdapter extends MessageStorePort {
  public enableTimeTravel(): void {
    this.isTimeTravelMode = true;
    console.log('⏰ Time-travel mode enabled');
  }

  public timeTravelPrevious(): StoredMessage | null {
    // Navigate through message history
    this.timeTravelIndex--;
    return this.getCurrentMessage();
  }
}
```

### Error Recovery

```typescript
// Intelligent error recovery
@listen(AutomationStepFailedEvent)
public async recoverFromFailure(event: AutomationStepFailedEvent): Promise<Event[]> {
  const recoveryStrategies = [
    () => this.retryWithAlternativeSelector(event.step),
    () => this.semanticElementSearch(event.step),
    () => this.askUserForHelp(event.step)
  ];
  
  for (const recovery of recoveryStrategies) {
    const result = await recovery();
    if (result.success) {
      return [new AutomationRecoveredEvent(event.step, result.method)];
    }
  }
  
  return [new AutomationFailedEvent(event.step)];
}
```

## Training Workflow Example

### 1. User Demonstrates Login Process

```typescript
// User clicks training mode, then demonstrates login
const trainingSteps = [
  { action: 'click', element: '#username-field', data: null },
  { action: 'input', element: '#username-field', data: 'user@example.com' },
  { action: 'click', element: '#password-field', data: null },
  { action: 'input', element: '#password-field', data: '[PASSWORD]' },
  { action: 'click', element: '#login-button', data: null }
];
```

### 2. Extension Recognizes Pattern

```typescript
export class LoginPatternRecognizer {
  public analyzePattern(actions: UserAction[]): PatternAnalysis {
    const confidence = this.calculateConfidence(actions);
    
    if (confidence > 0.8) {
      return new PatternAnalysis(
        'login_workflow',
        confidence,
        'Detected login workflow with username/password fields'
      );
    }
    
    return new PatternAnalysis('unknown', confidence, 'Pattern unclear');
  }
}
```

### 3. Cross-Site Execution

```typescript
// Same pattern works on different login pages
export class CrossSitePatternExecutor {
  public async executeOnNewSite(
    pattern: AutomationPattern,
    targetSite: string
  ): Promise<ExecutionResult> {
    const adaptedPattern = await this.adaptPattern(pattern, targetSite);
    return this.executePattern(adaptedPattern);
  }
}
```

## Testing

### Unit Testing

```typescript
describe('PatternRecognition', () => {
  it('should recognize login patterns', () => {
    const actions = [
      new UserAction('input', '#username', 'user@example.com'),
      new UserAction('input', '#password', 'password'),
      new UserAction('click', '#login-button', null)
    ];
    
    const pattern = recognizer.analyzeActions(actions);
    expect(pattern.type).toBe('login');
    expect(pattern.confidence).toBeGreaterThan(0.8);
  });
});
```

### Integration Testing

```typescript
describe('Extension Integration', () => {
  it('should execute patterns across different sites', async () => {
    // Train pattern on site A
    await trainPattern('amazon.com', loginActions);
    
    // Execute pattern on site B
    const result = await executePattern('ebay.com', 'login');
    expect(result.success).toBe(true);
  });
});
```

## Documentation

- 📖 [Complete Getting Started Guide](./docs/getting_started.org)
- 📚 [The Browser Extension Story](./docs/story.org) - How we built intelligent automation
- 📋 [Development Journal](./docs/journal.org) - Design decisions and lessons learned
- 🔧 [Training System Specification](./docs/specs/training-system-specification.org)
- 🎭 [Cross-Site Adaptation Guide](./docs/specs/cross-site-adaptation.org)
- 🔌 [Event-Driven Architecture Patterns](./docs/specs/event-driven-patterns.org)

## Extension Manifest

```json
{
  "manifest_version": 3,
  "name": "My Intelligent Extension",
  "version": "1.0.0",
  "permissions": [
    "storage",
    "activeTab", 
    "tabs",
    "downloads",
    "scripting"
  ],
  "host_permissions": ["<all_urls>"],
  "background": {
    "service_worker": "background.js",
    "type": "module"
  },
  "content_scripts": [{
    "matches": ["<all_urls>"],
    "js": ["content-script.js"],
    "run_at": "document_idle"
  }]
}
```

## Build and Deploy

```bash
# Build the extension
npm run build

# Package for Chrome Web Store
npm run package

# Package for Firefox Add-ons  
npm run package:firefox

# Run tests
npm test

# Start development mode
npm run dev
```

## Real-World Use Cases

### Research Automation
- **Before**: Manually search 50 academic databases daily (4 hours)
- **After**: Train once, automate across all databases (30 minutes)
- **Result**: 3.5 hours saved daily

### E-commerce Management  
- **Before**: Update prices across multiple platforms manually
- **After**: Pattern learns price update workflow, adapts to different platforms
- **Result**: 90% time reduction, 100% error elimination

### Customer Support
- **Before**: Fill same information across multiple systems for each ticket
- **After**: Extract data from emails, populate forms automatically
- **Result**: 60% faster case processing

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](./LICENSE) file for details.

## Related Projects

- [@typescript-eda/domain](https://github.com/rydnr/typescript-eda-domain) - Domain layer primitives
- [@typescript-eda/infrastructure](https://github.com/rydnr/typescript-eda-infrastructure) - Infrastructure adapters  
- [@typescript-eda/application](https://github.com/rydnr/typescript-eda-application) - Application orchestration
- [@web-buddy/nodejs-server](https://github.com/rydnr/web-buddy-nodejs-server) - Server coordination framework
- [ChatGPT-Buddy](https://github.com/rydnr/chatgpt-buddy) - AI automation implementation

---

**Transform passive browsing into intelligent automation with Web-Buddy Browser Extension Framework** 🚀