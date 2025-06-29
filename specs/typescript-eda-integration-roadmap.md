# ChatGPT-Buddy TypeScript-EDA Integration Roadmap

## Executive Summary

This document outlines a comprehensive plan to integrate the typescript-eda framework into the chatgpt-buddy project, transforming it from a traditional client-server architecture to a pure event-driven, domain-centric system following Domain-Driven Design (DDD), Event-Driven Architecture (EDA), and Hexagonal Architecture principles.

## Current State Analysis

### Existing Architecture
- **Server**: Express.js with WebSocket connections, direct message routing
- **Browser Extension**: Background script with WebSocket client, content script injection
- **Client SDK**: Basic TypeScript and Python clients with direct API calls
- **Communication**: JSON message protocol with correlation IDs

### Current Limitations
- Tight coupling between components
- Imperative message handling
- Mixed business logic and infrastructure concerns
- Limited scalability and extensibility
- No domain-driven design patterns

## Target Architecture Vision

### Core Principles Adoption
1. **Rich Behavioral Domain**: All business operations as domain entity methods
2. **Declarative Applications**: Single Application classes with @Enable decorators
3. **Universal Event-Driven Flow**: All interactions represented as events
4. **Pure Hexagonal Architecture**: Domain → Application → Infrastructure layers
5. **Monorepo Structure**: Shared packages with clear boundaries

### Event-Driven Communication Flow
```
Client Event → Server Application → Domain Processing → Extension Application → Browser Domain → Response Events
```

## Implementation Roadmap

### Phase 1: Foundation & Shared Domain (Weeks 1-2)

#### 1.1 Project Structure Transformation
- **Convert to pnpm monorepo**:
  ```
  chatgpt-buddy/
  ├── packages/
  │   ├── chatgpt-buddy-core/          # Shared domain & events
  │   ├── chatgpt-buddy-server/        # Server application
  │   ├── chatgpt-buddy-extension/     # Browser extension
  │   ├── chatgpt-buddy-client-ts/     # TypeScript client SDK
  │   └── chatgpt-buddy-client-py/     # Python client SDK
  ├── apps/
  │   └── examples/                    # Usage examples
  └── typescript-eda/                  # Framework dependency
  ```

#### 1.2 Shared Domain Definition
- **Core Domain Entities**:
  - `ChatSession`: Manages conversation state and history
  - `Project`: Represents ChatGPT project contexts
  - `BrowserTab`: Encapsulates browser interaction context
  - `Command`: Represents executable browser actions
  - `Response`: Captures action execution results

- **Domain Events**:
  ```typescript
  // Request Events
  ProjectSelectionRequested
  ChatSelectionRequested
  PromptSubmissionRequested
  ResponseRetrievalRequested
  ImageDownloadRequested
  
  // Success Events
  ProjectSelected
  ChatSelected
  PromptSubmitted
  ResponseRetrieved
  ImageDownloaded
  
  // Error Events
  ProjectSelectionFailed
  ChatSelectionFailed
  PromptSubmissionFailed
  ResponseRetrievalFailed
  ImageDownloadFailed
  ```

- **Value Objects**:
  - `CorrelationId`: Unique request tracking
  - `TabId`: Browser tab identifier
  - `ExtensionId`: Extension instance identifier
  - `Selector`: CSS/DOM selector strings
  - `ProjectName`: ChatGPT project names
  - `ChatTitle`: Chat conversation titles

#### 1.3 Event-Driven Protocol Design
- Replace current JSON message structure with typed events
- Implement event serialization/deserialization
- Define event routing and correlation mechanisms
- Establish error handling event patterns

### Phase 2: Server Transformation (Weeks 3-4)

#### 2.1 Domain Layer Implementation
- **ChatSession Entity**:
  ```typescript
  export class ChatSession extends Entity<ChatSession> {
    @listen(ProjectSelectionRequested)
    public selectProject(event: ProjectSelectionRequested): Promise<ProjectSelected | ProjectSelectionFailed> {
      // Domain logic for project selection
    }
    
    @listen(PromptSubmissionRequested)
    public submitPrompt(event: PromptSubmissionRequested): Promise<PromptSubmitted | PromptSubmissionFailed> {
      // Domain logic for prompt submission
    }
  }
  ```

#### 2.2 Infrastructure Adapters
- **Primary Adapters** (Inbound):
  - `HttpApiAdapter`: REST API endpoints → Events
  - `WebSocketServerAdapter`: WebSocket connections → Events
  - `CliAdapter`: Command-line interface → Events

- **Secondary Adapters** (Outbound):
  - `WebSocketClientAdapter`: Events → Extension WebSocket
  - `LoggingAdapter`: Events → Structured logs
  - `MetricsAdapter`: Events → Telemetry data

#### 2.3 Application Configuration
```typescript
@Enable(HttpApiAdapter)
@Enable(WebSocketServerAdapter)
@Enable(WebSocketClientAdapter)
@Enable(ChatSession)
@Enable(LoggingAdapter)
export class ChatGPTBuddyServerApplication extends Application {
  public readonly metadata = new Map<string, unknown>([
    ['name', 'ChatGPTBuddyServer'],
    ['description', 'Event-driven ChatGPT automation server'],
    ['version', '2.0.0'],
    ['domain-entities', [ChatSession]],
    ['primary-ports', [HttpApiAdapter, WebSocketServerAdapter]],
    ['secondary-ports', [WebSocketClientAdapter, LoggingAdapter]]
  ]);
}
```

### Phase 3: Browser Extension Refactoring (Weeks 5-6)

#### 3.1 Extension Domain Layer
- **BrowserTab Entity**:
  ```typescript
  export class BrowserTab extends Entity<BrowserTab> {
    @listen(ProjectSelectionRequested)
    public async selectProject(event: ProjectSelectionRequested): Promise<ProjectSelected | ProjectSelectionFailed> {
      // DOM interaction logic
    }
    
    @listen(PromptSubmissionRequested)
    public async submitPrompt(event: PromptSubmissionRequested): Promise<PromptSubmitted | PromptSubmissionFailed> {
      // Form filling and submission logic
    }
  }
  ```

#### 3.2 Infrastructure Adapters
- **Primary Adapters**:
  - `WebSocketClientAdapter`: Server WebSocket → Events
  - `ChromeRuntimeAdapter`: Chrome extension messages → Events

- **Secondary Adapters**:
  - `ContentScriptAdapter`: Events → DOM manipulation
  - `ChromeTabsAdapter`: Events → Chrome tabs API
  - `ChromeStorageAdapter`: Events → Extension storage

#### 3.3 Content Script Integration
- Transform content script into infrastructure adapter
- Implement DOM interaction through event handlers
- Maintain security boundaries between contexts

### Phase 4: Client SDK Development (Weeks 7-8)

#### 4.1 TypeScript Client SDK
- **Client Domain Layer**:
  ```typescript
  export class ChatGPTClient extends Entity<ChatGPTClient> {
    @listen(ClientCommandRequested)
    public async executeCommand(event: ClientCommandRequested): Promise<CommandExecuted | CommandFailed> {
      // Client-side command orchestration
    }
  }
  ```

- **Infrastructure Adapters**:
  - `HttpClientAdapter`: Events → HTTP API calls
  - `WebSocketClientAdapter`: Events → WebSocket communication
  - `FileSystemAdapter`: Events → Local file operations

#### 4.2 Python Client SDK
- **Domain Layer** (`python_client/rydnr/tools/chatgpt_buddy/domain/`):
  - `chat_session.py`: ChatSession entity with @listen decorators
  - `browser_command.py`: BrowserCommand entity
  - `events/`: All domain events as Python classes

- **Application Layer** (`python_client/rydnr/tools/chatgpt_buddy/application/`):
  - `chatgpt_buddy_client_application.py`: Main application class
  - Event handling and coordination logic

- **Infrastructure Layer** (`python_client/rydnr/tools/chatgpt_buddy/infrastructure/`):
  - `http_client_adapter.py`: HTTP communication
  - `websocket_client_adapter.py`: WebSocket communication
  - `cli/`: Command-line interface handlers
  - `file_system_adapter.py`: File operations

#### 4.3 Unified Client API
```python
# Python Example
from rydnr.tools.chatgpt_buddy.infrastructure import ChatGPTBuddyClient

async def main():
    client = ChatGPTBuddyClient(url="ws://localhost:3000", api_key="secret")
    await client.select_project('python-development')
    await client.submit_prompt('Generate a hello world function')
    response = await client.get_response()
    print(response.content)
```

```typescript
// TypeScript Example
import { ChatGPTBuddyClient } from '@chatgpt-buddy/client-ts';

const client = new ChatGPTBuddyClient({ 
  url: 'ws://localhost:3000', 
  apiKey: 'secret' 
});

await client.selectProject('python-development');
await client.submitPrompt('Generate a hello world function');
const response = await client.getResponse();
console.log(response.content);
```

### Phase 5: Integration & Testing (Weeks 9-10)

#### 5.1 End-to-End Testing Strategy
- **Event Flow Testing**: Verify complete event chains
- **Domain Logic Testing**: Unit tests for all domain entities
- **Adapter Testing**: Infrastructure integration tests
- **Cross-Module Testing**: Full system integration tests

#### 5.2 Performance Optimization
- Event batching for high-frequency operations
- Connection pooling for WebSocket communications
- Caching strategies for repeated operations
- Memory optimization for browser extension

#### 5.3 Migration Strategy
- Backward compatibility layer for existing clients
- Gradual migration path with feature flags
- Documentation for migrating from v1 to v2
- Example applications showcasing new patterns

## Technical Implementation Details

### Event Serialization Strategy
```typescript
interface SerializableEvent {
  type: string;
  payload: unknown;
  correlationId: string;
  timestamp: Date;
  source: string;
}

class EventSerializer {
  public static serialize(event: Event): string {
    return JSON.stringify({
      type: event.constructor.name,
      payload: event.payload,
      correlationId: event.correlationId,
      timestamp: new Date(),
      source: event.source
    });
  }
  
  public static deserialize(data: string): Event {
    const parsed = JSON.parse(data) as SerializableEvent;
    return EventFactory.create(parsed.type, parsed.payload, parsed.correlationId);
  }
}
```

### Cross-Module Event Routing
```typescript
class EventRouter {
  private routes = new Map<string, EventHandler[]>();
  
  public route(event: Event): Promise<void> {
    const handlers = this.routes.get(event.constructor.name) || [];
    return Promise.all(handlers.map(handler => handler.handle(event)));
  }
  
  public register(eventType: string, handler: EventHandler): void {
    const handlers = this.routes.get(eventType) || [];
    handlers.push(handler);
    this.routes.set(eventType, handlers);
  }
}
```

### Security Considerations
- **Event Validation**: All events validated against schemas
- **Authorization**: Role-based access control for events
- **Encryption**: Sensitive event payloads encrypted in transit
- **Audit Trail**: Complete event history for compliance

## Benefits of Migration

### Immediate Benefits
1. **Clear Separation of Concerns**: Domain logic isolated from infrastructure
2. **Enhanced Testability**: Each layer independently testable
3. **Improved Maintainability**: Changes localized to appropriate layers
4. **Better Error Handling**: Comprehensive event-driven error propagation

### Long-term Benefits
1. **Scalability**: Event-driven architecture supports horizontal scaling
2. **Extensibility**: New features easily added through new events/handlers
3. **Monitoring**: Built-in observability through event streams
4. **Consistency**: Uniform patterns across all modules

### Developer Experience Improvements
1. **Type Safety**: Full TypeScript support across all layers
2. **IDE Support**: Better autocomplete and refactoring
3. **Documentation**: Self-documenting through domain events
4. **Testing**: Comprehensive test coverage through event mocking

## Risk Mitigation

### Technical Risks
- **Performance Impact**: Mitigated through efficient event routing and batching
- **Complexity Increase**: Addressed through comprehensive documentation and examples
- **Migration Challenges**: Reduced through backward compatibility and gradual migration

### Delivery Risks
- **Timeline Overruns**: Managed through iterative delivery and MVP approach
- **Resource Constraints**: Addressed through clear phase boundaries and priorities
- **Integration Issues**: Minimized through extensive testing at each phase

## Success Metrics

### Technical Metrics
- **Code Coverage**: >90% for domain layer, >80% for infrastructure
- **Performance**: <10% overhead compared to current implementation
- **Error Rates**: <1% event processing failures
- **Maintainability**: Cyclomatic complexity <10 for domain classes

### Business Metrics
- **Developer Adoption**: Positive feedback from early adopters
- **Documentation Quality**: Complete API documentation with examples
- **Support Requests**: <5% increase in support volume during migration
- **Feature Velocity**: 20% faster new feature development post-migration

## Conclusion

This roadmap transforms chatgpt-buddy into a modern, event-driven system that exemplifies best practices in software architecture. The migration will result in a more maintainable, testable, and extensible codebase that serves as a reference implementation for typescript-eda framework adoption.

The phased approach ensures minimal disruption to existing users while delivering incremental value throughout the transformation process. The final system will be more robust, performant, and developer-friendly, positioning chatgpt-buddy as a flagship example of event-driven architecture in browser automation tools.