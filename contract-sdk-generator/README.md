# Contract-to-SDK Generator

Automatically generates TypeScript and Python client SDKs from Web Application Contract specifications.

## Overview

This tool takes Web Application Contract specifications (JSON Schema based) and generates fully-typed, feature-rich client SDKs that provide:

- Type-safe contract interactions
- Automatic validation
- Error handling and retry logic
- Documentation generation
- Testing utilities
- Event-driven communication patterns

## Features

### TypeScript SDK Generation
- Full TypeScript type definitions
- Event-driven client patterns
- Async/await support with proper error handling
- Built-in validation using JSON Schema
- Integration with Web-Buddy framework
- Comprehensive JSDoc documentation
- Unit test templates

### Python SDK Generation
- Type hints using Pydantic models
- Async/await support with asyncio
- Automatic request/response validation
- Error handling with custom exceptions
- Integration with existing Python automation tools
- Sphinx-compatible documentation
- pytest test templates

### Contract Discovery & Validation
- JSON Schema validation for contracts
- Dependency resolution between contracts
- Version compatibility checking
- Breaking change detection
- Contract registry integration

## Installation

```bash
npm install -g @web-buddy/contract-sdk-generator
```

## Usage

### Basic Usage

```bash
# Generate SDK from a single contract
contract-sdk-gen --input ./contracts/github.json --output ./sdk --lang typescript

# Generate SDKs for multiple languages
contract-sdk-gen --input ./contracts --output ./generated --lang typescript,python

# Generate with custom templates
contract-sdk-gen --input ./contracts --output ./sdk --templates ./custom-templates
```

### Programmatic Usage

```typescript
import { ContractSDKGenerator } from '@web-buddy/contract-sdk-generator';

const generator = new ContractSDKGenerator({
  outputDir: './generated',
  languages: ['typescript', 'python'],
  templateDir: './templates'
});

const result = await generator.generateFromContract('./contracts/chatgpt.json');
console.log(`Generated SDK in: ${result.outputPaths}`);
```

## Contract Format

### Basic Contract Structure

```json
{
  "$schema": "https://schemas.web-buddy.org/contract/v1",
  "info": {
    "name": "ChatGPT Web Interface",
    "version": "1.0.0",
    "description": "Contract for automating ChatGPT web interface",
    "url": "https://chat.openai.com",
    "domains": ["chat.openai.com", "chatgpt.com"]
  },
  "capabilities": {
    "authentication": {
      "type": "session",
      "description": "Requires user login session"
    },
    "chat": {
      "type": "interactive",
      "description": "Start new conversations and send messages"
    },
    "history": {
      "type": "readonly",
      "description": "Access conversation history"
    }
  },
  "elements": {
    "newChatButton": {
      "selectors": [
        "[data-testid='new-chat-button']",
        "button:contains('New chat')",
        ".new-chat-btn"
      ],
      "description": "Button to start a new conversation",
      "actions": ["click"],
      "required": true
    },
    "messageInput": {
      "selectors": [
        "#prompt-textarea",
        "textarea[placeholder*='message']",
        "[data-testid='message-input']"
      ],
      "description": "Input field for typing messages",
      "actions": ["type", "clear"],
      "required": true
    },
    "sendButton": {
      "selectors": [
        "[data-testid='send-button']",
        "button[aria-label='Send message']"
      ],
      "description": "Button to send the typed message",
      "actions": ["click"],
      "required": true
    }
  },
  "workflows": {
    "startNewChat": {
      "description": "Start a new conversation",
      "steps": [
        {
          "action": "click",
          "target": "newChatButton",
          "wait": "navigation"
        }
      ]
    },
    "sendMessage": {
      "description": "Send a message in the current conversation",
      "parameters": {
        "message": {
          "type": "string",
          "required": true,
          "description": "The message to send"
        }
      },
      "steps": [
        {
          "action": "type",
          "target": "messageInput",
          "value": "{{message}}"
        },
        {
          "action": "click",
          "target": "sendButton",
          "wait": "response"
        }
      ]
    }
  },
  "events": {
    "messageReceived": {
      "description": "Fired when ChatGPT responds to a message",
      "selector": ".message.assistant:last-child",
      "data": {
        "content": "text",
        "timestamp": "data-timestamp"
      }
    },
    "conversationStarted": {
      "description": "Fired when a new conversation begins",
      "selector": ".conversation-header",
      "data": {
        "conversationId": "data-conversation-id"
      }
    }
  }
}
```

## Generated SDK Examples

### TypeScript SDK

```typescript
// Generated file: ./generated/typescript/chatgpt-client.ts

import { WebBuddyClient, ContractClient } from '@web-buddy/core';
import { ChatGPTContract } from './chatgpt-contract';

export interface SendMessageOptions {
  message: string;
  waitForResponse?: boolean;
  timeout?: number;
}

export interface MessageReceivedEvent {
  content: string;
  timestamp: string;
}

export class ChatGPTClient extends ContractClient<ChatGPTContract> {
  constructor(options: WebBuddyClientOptions = {}) {
    super({
      contract: ChatGPTContract,
      baseUrl: 'https://chat.openai.com',
      ...options
    });
  }

  /**
   * Start a new conversation
   */
  async startNewChat(): Promise<void> {
    await this.executeWorkflow('startNewChat');
  }

  /**
   * Send a message in the current conversation
   */
  async sendMessage(options: SendMessageOptions): Promise<MessageReceivedEvent> {
    const result = await this.executeWorkflow('sendMessage', {
      message: options.message
    });

    if (options.waitForResponse !== false) {
      return await this.waitForEvent('messageReceived', {
        timeout: options.timeout || 30000
      });
    }

    return result;
  }

  /**
   * Listen for message received events
   */
  onMessageReceived(callback: (event: MessageReceivedEvent) => void): () => void {
    return this.addEventListener('messageReceived', callback);
  }

  /**
   * Get conversation history
   */
  async getConversationHistory(): Promise<Message[]> {
    return await this.extractData('conversationHistory');
  }
}

// Usage example
const client = new ChatGPTClient();
await client.navigate();
await client.startNewChat();
await client.sendMessage({ message: 'Hello, ChatGPT!' });
```

### Python SDK

```python
# Generated file: ./generated/python/chatgpt_client.py

from typing import List, Optional, Dict, Any
from pydantic import BaseModel
from web_buddy import ContractClient, WebBuddyClientOptions
from .chatgpt_contract import ChatGPTContract

class SendMessageOptions(BaseModel):
    message: str
    wait_for_response: bool = True
    timeout: int = 30000

class MessageReceivedEvent(BaseModel):
    content: str
    timestamp: str

class Message(BaseModel):
    content: str
    role: str
    timestamp: str

class ChatGPTClient(ContractClient[ChatGPTContract]):
    """
    Client for automating ChatGPT web interface
    
    This client provides methods for starting conversations,
    sending messages, and extracting responses from ChatGPT.
    """
    
    def __init__(self, options: Optional[WebBuddyClientOptions] = None):
        super().__init__(
            contract=ChatGPTContract,
            base_url='https://chat.openai.com',
            **(options or {})
        )
    
    async def start_new_chat(self) -> None:
        """Start a new conversation"""
        await self.execute_workflow('startNewChat')
    
    async def send_message(self, options: SendMessageOptions) -> MessageReceivedEvent:
        """
        Send a message in the current conversation
        
        Args:
            options: Configuration for sending the message
            
        Returns:
            The received response event
            
        Raises:
            ContractValidationError: If the message format is invalid
            TimeoutError: If no response is received within the timeout
        """
        result = await self.execute_workflow('sendMessage', {
            'message': options.message
        })
        
        if options.wait_for_response:
            return await self.wait_for_event('messageReceived', 
                                           timeout=options.timeout)
        
        return result
    
    def on_message_received(self, callback: callable) -> callable:
        """Listen for message received events"""
        return self.add_event_listener('messageReceived', callback)
    
    async def get_conversation_history(self) -> List[Message]:
        """Get conversation history"""
        return await self.extract_data('conversationHistory')

# Usage example
async def main():
    client = ChatGPTClient()
    await client.navigate()
    await client.start_new_chat()
    
    response = await client.send_message(
        SendMessageOptions(message='Hello, ChatGPT!')
    )
    print(f"Received: {response.content}")
```

## Configuration

### Generator Configuration

```json
{
  "typescript": {
    "outputDir": "./generated/typescript",
    "packageName": "@generated/web-contracts",
    "moduleFormat": "esm",
    "target": "ES2020",
    "generateTests": true,
    "generateDocs": true,
    "framework": "web-buddy"
  },
  "python": {
    "outputDir": "./generated/python",
    "packageName": "web_contracts",
    "pythonVersion": "3.8+",
    "generateTests": true,
    "generateDocs": true,
    "framework": "web-buddy-python"
  },
  "validation": {
    "strict": true,
    "allowUndefinedElements": false,
    "validateSelectors": true
  },
  "templates": {
    "customDir": "./templates",
    "overrides": {
      "client": "./templates/custom-client.hbs",
      "types": "./templates/custom-types.hbs"
    }
  }
}
```

## Templates

The generator uses Handlebars templates for maximum flexibility:

### Client Template (TypeScript)

```typescript
// templates/typescript/client.hbs
{{#> header}}
Generated client for {{contract.info.name}}
{{/header}}

import { ContractClient, WebBuddyClientOptions } from '@web-buddy/core';
import { {{contractName}}Contract } from './{{contractName}}-contract';
{{#each imports}}
import { {{this}} } from './types';
{{/each}}

{{#each workflows}}
export interface {{capitalize name}}Options {
  {{#each parameters}}
  {{name}}{{#unless required}}?{{/unless}}: {{type}};
  {{/each}}
}
{{/each}}

export class {{contractName}}Client extends ContractClient<{{contractName}}Contract> {
  constructor(options: WebBuddyClientOptions = {}) {
    super({
      contract: {{contractName}}Contract,
      baseUrl: '{{contract.info.url}}',
      ...options
    });
  }

  {{#each workflows}}
  /**
   * {{description}}
   */
  async {{camelCase name}}({{#if parameters}}options: {{capitalize name}}Options{{/if}}): Promise<{{returnType}}> {
    {{#if parameters}}
    const result = await this.executeWorkflow('{{name}}', {
      {{#each parameters}}
      {{name}}: options.{{name}},
      {{/each}}
    });
    {{else}}
    await this.executeWorkflow('{{name}}');
    {{/if}}
    
    {{#if waitForEvent}}
    return await this.waitForEvent('{{waitForEvent}}');
    {{else}}
    return result;
    {{/if}}
  }
  {{/each}}

  {{#each events}}
  /**
   * Listen for {{description}}
   */
  on{{capitalize name}}(callback: (event: {{capitalize name}}Event) => void): () => void {
    return this.addEventListener('{{name}}', callback);
  }
  {{/each}}
}
```

## Advanced Features

### Contract Composition

```json
{
  "extends": [
    "./base-web-contract.json",
    "./authentication-mixin.json"
  ],
  "info": {
    "name": "GitHub Issues Contract"
  },
  "elements": {
    "inheritedElement": {
      "override": true,
      "selectors": ["updated-selector"]
    }
  }
}
```

### Version Management

```typescript
// Automatic version compatibility checking
const generator = new ContractSDKGenerator({
  versionStrategy: 'semver',
  breakingChangeDetection: true,
  migrationGuides: true
});

await generator.generateWithVersioning('./contracts/v1', './contracts/v2');
```

### Plugin System

```typescript
// Custom generator plugins
const generator = new ContractSDKGenerator({
  plugins: [
    new ReactComponentsPlugin(),
    new PlaywrightTestsPlugin(),
    new DocumentationPlugin()
  ]
});
```

## Integration

### Web-Buddy Integration

```typescript
import { WebBuddyCore } from '@web-buddy/core';
import { ChatGPTClient } from './generated/chatgpt-client';

const webBuddy = new WebBuddyCore();
const chatgpt = new ChatGPTClient({ 
  browser: webBuddy.browser 
});

await chatgpt.startNewChat();
await chatgpt.sendMessage({ message: 'Hello!' });
```

### Testing Integration

```typescript
// Generated test files
describe('ChatGPT Contract', () => {
  let client: ChatGPTClient;

  beforeEach(async () => {
    client = new ChatGPTClient({ headless: true });
    await client.navigate();
  });

  test('should start new chat', async () => {
    await client.startNewChat();
    expect(await client.isElementVisible('messageInput')).toBe(true);
  });

  test('should send message and receive response', async () => {
    await client.startNewChat();
    const response = await client.sendMessage({ 
      message: 'Hello, world!' 
    });
    expect(response.content).toBeDefined();
  });
});
```

## CLI Reference

```bash
contract-sdk-gen [options] <input>

Options:
  --output, -o <dir>        Output directory (default: ./generated)
  --lang, -l <languages>    Target languages (typescript,python)
  --config, -c <file>       Configuration file
  --templates, -t <dir>     Custom templates directory
  --validate, -v            Validate contracts only
  --watch, -w               Watch for contract changes
  --verbose                 Verbose output
  --dry-run                 Show what would be generated
  --help, -h                Show help

Examples:
  contract-sdk-gen ./contracts --lang typescript,python
  contract-sdk-gen ./github.json --output ./sdk --config ./config.json
  contract-sdk-gen ./contracts --watch --verbose
```

This generator provides a complete solution for creating robust, type-safe client SDKs from Web Application Contracts, enabling seamless integration between web automation and application development workflows.