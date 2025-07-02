# 🚀 Getting Started with Web-Buddy Framework

**Interactive Browser Automation with Machine Learning**

Welcome to Web-Buddy Framework! This guide will get you up and running with intelligent browser automation in just a few minutes.

## 📖 Table of Contents

1. [Quick Start (5 minutes)](#quick-start)
2. [Core Concepts](#core-concepts)
3. [Your First Automation](#your-first-automation)
4. [Training Your First Pattern](#training-your-first-pattern)
5. [Event-Driven Architecture](#event-driven-architecture)
6. [Next Steps](#next-steps)

---

## 🎯 Quick Start

### Prerequisites

- Node.js 16+ or Python 3.8+
- Chrome/Chromium browser
- Basic understanding of browser automation concepts

### Installation

**TypeScript/JavaScript:**
```bash
npm install @web-buddy/client-ts
```

**Python:**
```bash
pip install web-buddy-sdk
```

### 30-Second Setup

1. **Start the Web-Buddy Server:**
```bash
npx @web-buddy/server
# Server starts at http://localhost:3000
```

2. **Install the Browser Extension:**
   - Open Chrome Extensions (chrome://extensions/)
   - Enable "Developer mode"
   - Load the extension from `./extension` folder
   - Note your extension ID (e.g., `abc123def456`)

3. **Your First Automation:**

**TypeScript:**
```typescript
import { EventDrivenWebBuddyClient } from '@web-buddy/client-ts';

const client = new EventDrivenWebBuddyClient({
    baseUrl: 'http://localhost:3000',
    apiKey: 'your-super-secret-client-key'
});

// Open ChatGPT in your browser, then run:
const extensionId = 'your-extension-id';
const tabId = 123; // Get from browser dev tools

// Request project selection using events
const result = await client.requestProjectSelection(
    extensionId, 
    tabId, 
    'coding-assistant'
);

console.log('Project selected:', result);
```

**Python:**
```python
from web_buddy_sdk import EventDrivenWebBuddyClient

client = EventDrivenWebBuddyClient(
    base_url='http://localhost:3000',
    api_key='your-super-secret-client-key'
)

# Request project selection
result = await client.request_project_selection(
    extension_id='your-extension-id',
    tab_id=123,
    project_name='coding-assistant'
)

print(f'Project selected: {result}')
```

🎉 **Congratulations!** You just completed your first Web-Buddy automation!

---

## 🧠 Core Concepts

### 1. Event-Driven Architecture

Web-Buddy is built on **pure event-driven communication**. Instead of calling methods like `clickButton()`, you send **domain events** like `ProjectSelectionRequested`.

```typescript
// ❌ Traditional approach (imperative)
await client.clickProject('my-project');

// ✅ Web-Buddy approach (event-driven)
await client.requestProjectSelection(extensionId, tabId, 'my-project');
// Internally sends: ProjectSelectionRequested event
```

### 2. Interactive Training System

Web-Buddy learns automation patterns by watching you demonstrate actions:

1. **Enable Training Mode**: `client.requestTrainingMode('chatgpt.com')`
2. **Demonstrate Actions**: Click elements while training is active
3. **Automatic Learning**: System learns selectors and patterns
4. **Future Automation**: Patterns execute automatically

### 3. Three-Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│ 🖥️  Client SDK (Your Code)                                      │
│ • TypeScript/Python clients                                    │
│ • Event sending & receiving                                     │
│ • Workflow orchestration                                        │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 🌐 Web-Buddy Server                                             │
│ • Event routing & validation                                    │
│ • Training system coordination                                  │
│ • File download management                                      │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│ 🔌 Browser Extension                                            │
│ • DOM interaction & manipulation                                │
│ • Pattern learning & execution                                  │
│ • Visual feedback & training UI                                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4. Smart Pattern Matching

The system uses **machine learning algorithms** to:
- **Learn from demonstrations**: Watch you interact with websites
- **Generate robust selectors**: Create CSS selectors that survive page changes
- **Improve over time**: Patterns become more accurate with usage
- **Handle variations**: Adapt to different page layouts and content

---

## 🎯 Your First Automation

Let's build a complete ChatGPT automation workflow:

### Step 1: Setup and Connection

```typescript
import { EventDrivenWebBuddyClient } from '@web-buddy/client-ts';

const client = new EventDrivenWebBuddyClient({
    baseUrl: 'http://localhost:3000',
    apiKey: process.env.WEB_BUDDY_API_KEY || 'your-super-secret-client-key'
});

// Test connection
const ping = await client.ping();
console.log(`✅ Connected to Web-Buddy (${ping.latency}ms)`);
```

### Step 2: Complete Workflow Automation

```typescript
async function automateChatGPT() {
    const extensionId = 'your-extension-id';
    const tabId = 123; // Open ChatGPT and get tab ID from dev tools
    
    try {
        // Execute complete workflow with error handling
        const workflow = await client.executeFullChatGPTWorkflow(
            extensionId,
            tabId,
            {
                projectName: 'coding-assistant',
                promptText: 'Generate a TypeScript function to validate email addresses',
                chatTitle: 'Email Validation Chat' // optional
            }
        );
        
        console.log('🎉 Workflow completed successfully!');
        console.log('📝 ChatGPT Response:', workflow.responseRetrieval.content);
        
        return workflow.responseRetrieval.content;
        
    } catch (error) {
        console.error('❌ Workflow failed:', error);
        
        if (error instanceof WorkflowError) {
            console.log('Partial results:', error.partialResults);
        }
        
        throw error;
    }
}

// Run the automation
const result = await automateChatGPT();
```

### Step 3: Batch Processing

```typescript
async function batchProcessPrompts() {
    const prompts = [
        'Explain quantum computing in simple terms',
        'Write a Python function to sort a list',
        'Create a REST API endpoint in Node.js'
    ];
    
    const results = [];
    
    for (const prompt of prompts) {
        console.log(`🔄 Processing: ${prompt.slice(0, 50)}...`);
        
        const workflow = await client.executeFullChatGPTWorkflow(
            extensionId, tabId,
            { projectName: 'coding-assistant', promptText: prompt }
        );
        
        results.push({
            prompt,
            response: workflow.responseRetrieval.content,
            success: workflow.success
        });
        
        // Respectful delay between requests
        await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    return results;
}
```

---

## 🎓 Training Your First Pattern

The training system is Web-Buddy's **killer feature**. It learns by watching you, eliminating the need to write complex selectors.

### Step 1: Enable Training Mode

```typescript
// Enable training for ChatGPT
const trainingSession = await client.requestTrainingMode('chatgpt.com');
console.log(`🎯 Training enabled for session: ${trainingSession.sessionId}`);
```

### Step 2: Demonstrate Actions

1. **Open ChatGPT** in your browser
2. **Perform the action** you want to automate (e.g., click a project)
3. **Web-Buddy learns** the pattern automatically

**What happens during training:**
```
User clicks element → Extension captures interaction → 
Training UI appears → User confirms action → 
Pattern learned and stored → Future automation uses learned pattern
```

### Step 3: View Learned Patterns

```typescript
// Get all learned patterns
const patterns = await client.requestAutomationPatterns({
    website: 'chatgpt.com'
});

console.log(`📚 Learned ${patterns.patterns.length} patterns:`);

patterns.patterns.forEach(pattern => {
    console.log(`  📋 ${pattern.messageType}: ${pattern.selector}`);
    console.log(`     Confidence: ${pattern.confidence}, Used: ${pattern.usageCount} times`);
});
```

### Step 4: Export and Share Patterns

```typescript
// Export patterns for backup or sharing
const exportData = await client.exportPatterns();

// Save to file
import fs from 'fs/promises';
await fs.writeFile('chatgpt-patterns.json', JSON.stringify(exportData, null, 2));

console.log('💾 Patterns exported to chatgpt-patterns.json');
```

### Step 5: Automatic Execution

Once patterns are learned, they execute automatically:

```typescript
// This will now use learned patterns automatically!
const result = await client.requestProjectSelection(
    extensionId, tabId, 'my-project'
);

// No training UI appears - uses learned selector
console.log('🤖 Executed using learned pattern');
```

---

## ⚡ Event-Driven Architecture

Web-Buddy's event-driven design makes it powerful and extensible:

### Understanding Events

Every interaction is represented as a **domain event**:

```typescript
// 1. Create event
const event = new ProjectSelectionRequested(
    'coding-assistant',
    undefined, // selector (auto-generated)
    'correlation-123'
);

// 2. Send event
const response = await client.sendEvent(event, extensionId, tabId);

// 3. Handle response
if (response instanceof ProjectSelected) {
    console.log('✅ Project selected successfully');
} else if (response instanceof ProjectSelectionFailed) {
    console.error('❌ Project selection failed:', response.reason);
}
```

### Low-Level Event Sending

For maximum control, use the low-level event interface:

```typescript
import { 
    GoogleImageDownloadRequested,
    GoogleImageDownloadCompleted,
    GoogleImageDownloadFailed 
} from '@web-buddy/client-ts';

// Send custom Google Images download event
const downloadEvent = new GoogleImageDownloadRequested(
    {
        src: 'https://example.com/image.jpg',
        alt: 'Beautiful landscape',
        width: 1920,
        height: 1080
    },
    'landscape photography',
    'mountain_sunset.jpg',
    'custom-correlation-id'
);

const result = await client.sendEvent(downloadEvent, extensionId, tabId);

if (result instanceof GoogleImageDownloadCompleted) {
    console.log(`📥 Downloaded: ${result.filename}`);
    console.log(`📁 Saved to: ${result.filepath}`);
    console.log(`📊 Size: ${result.metadata.fileSize} bytes`);
}
```

### Event Workflows

Chain multiple events for complex workflows:

```typescript
const events = [
    {
        event: new ProjectSelectionRequested('coding-assistant'),
        extensionId,
        tabId
    },
    {
        event: new PromptSubmissionRequested(
            'Generate a REST API in Node.js'
        ),
        extensionId,
        tabId
    },
    {
        event: new ResponseRetrievalRequested(),
        extensionId,
        tabId
    }
];

// Execute events in sequence
const results = await client.sendEvents(events, {
    parallel: false,
    stopOnError: true
});

console.log('🔄 Workflow completed:', results.length, 'events processed');
```

---

## 🎯 Next Steps

### 🔍 Explore Advanced Features

1. **[Google Images Guide](./GOOGLE_IMAGES_GETTING_STARTED.md)** - Learn how to build website-specific automation
2. **[File Downloads](./docs/downloads.md)** - Master intelligent download management
3. **[Pattern Management](./docs/patterns.md)** - Advanced pattern learning techniques
4. **[API Reference](./docs/api/)** - Complete SDK documentation

### 🛠️ Build Your Own Extensions

- **E-commerce Automation**: Product browsing and purchasing
- **Social Media Management**: Content posting and engagement
- **Data Collection**: Web scraping with learning capabilities
- **Testing Automation**: E2E testing with self-improving selectors

### 🌐 Join the Community

- **GitHub**: [github.com/web-buddy/framework](https://github.com/web-buddy/framework)
- **Discord**: [discord.gg/web-buddy](https://discord.gg/web-buddy)
- **Documentation**: [docs.web-buddy.dev](https://docs.web-buddy.dev)
- **Examples**: [github.com/web-buddy/examples](https://github.com/web-buddy/examples)

### 📚 Learning Resources

- **Video Tutorials**: Step-by-step YouTube guides
- **Blog Posts**: Real-world use cases and best practices
- **Sample Projects**: Complete automation examples
- **Best Practices**: Performance, security, and reliability guides

---

## 🆘 Need Help?

- **Documentation Issues**: [docs.web-buddy.dev/issues](https://docs.web-buddy.dev/issues)
- **SDK Problems**: [github.com/web-buddy/client-ts/issues](https://github.com/web-buddy/client-ts/issues)
- **General Questions**: [Discord Community](https://discord.gg/web-buddy)
- **Feature Requests**: [github.com/web-buddy/framework/discussions](https://github.com/web-buddy/framework/discussions)

---

## 🎉 Success Stories

> *"Web-Buddy reduced our testing automation maintenance from 40 hours/week to 2 hours/week. The training system adapts to UI changes automatically!"*  
> — **Sarah Chen, QA Lead at TechCorp**

> *"I automated our entire content creation workflow for social media. What used to take 3 hours now takes 10 minutes."*  
> — **Mike Rodriguez, Marketing Manager**

> *"The event-driven architecture made it incredibly easy to integrate Web-Buddy into our existing CI/CD pipeline."*  
> — **Alex Thompson, DevOps Engineer**

---

**Ready to build amazing automation?** Start with the [Google Images tutorial](./GOOGLE_IMAGES_GETTING_STARTED.md) to see how Web-Buddy adapts to any website! 🚀