# TypeScript-EDA Application Layer

> The orchestration engine that coordinates domain logic with infrastructure capabilities

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0+-blue.svg)](https://www.typescriptlang.org/)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![npm version](https://badge.fury.io/js/%40typescript-eda%2Fapplication.svg)](https://badge.fury.io/js/%40typescript-eda%2Fapplication)

## Overview

The TypeScript-EDA Application layer provides a sophisticated orchestration framework for event-driven architectures. It serves as the conductor that coordinates domain logic with infrastructure adapters, enabling clean separation of concerns while maintaining powerful coordination capabilities.

## Key Features

- 🎭 **Declarative Configuration**: Use `@Enable` decorators to configure infrastructure adapters
- 🔄 **Event-Driven Orchestration**: Queue-based event processing with cascading support
- 🔌 **Multiple Entry Points**: HTTP, CLI, messaging, and WebSocket primary ports
- 🧩 **Dependency Injection**: Automatic adapter wiring with type safety
- 🛡️ **Error Isolation**: Resilient event processing with configurable recovery strategies
- 🏗️ **Lifecycle Management**: Complete application startup, operation, and shutdown
- 🧪 **Test-Friendly**: Comprehensive testing utilities and patterns

## Quick Start

### Installation

```bash
npm install @typescript-eda/application @typescript-eda/domain @typescript-eda/infrastructure
# or with pnpm
pnpm add @typescript-eda/application @typescript-eda/domain @typescript-eda/infrastructure
```

### Basic Usage

```typescript
import { Application, Enable } from '@typescript-eda/application';
import { PostgresUserRepository } from './infrastructure/database/postgres-user-repository';
import { EmailNotificationAdapter } from './infrastructure/notifications/email-notification-adapter';
import { ExpressWebServerAdapter } from './infrastructure/web/express-web-server-adapter';

@Enable(PostgresUserRepository)
@Enable(EmailNotificationAdapter)
@Enable(ExpressWebServerAdapter)
export class UserManagementApplication extends Application {
  public readonly metadata = new Map([
    ['name', 'User Management Application'],
    ['description', 'Complete user lifecycle management with event-driven architecture'],
    ['version', '1.0.0']
  ]);

  @listen(UserRegistrationRequested)
  public async handleUserRegistration(event: UserRegistrationRequested): Promise<Event[]> {
    const userRepository = Ports.resolve(UserRepository);
    const userId = new UserId(this.generateUserId());
    const user = new User(userId, event.email, event.name);
    
    await userRepository.save(user);
    
    return [
      new UserRegistered(userId, event.email, event.name),
      new EmailVerificationRequested(userId, event.email, this.generateVerificationToken())
    ];
  }
}

// Start the application
async function main() {
  const app = new UserManagementApplication();
  await app.start();
}
```

## Core Concepts

### Application Base Class

The `Application` base class provides the orchestration engine:

```typescript
export abstract class Application {
  public abstract readonly metadata: Map<string, unknown>;
  
  public async handle(events: Event | Event[]): Promise<void>;
  public async start(): Promise<void>;
  public async shutdown(): Promise<void>;
}
```

### @Enable Decorator

Declaratively configure infrastructure adapters:

```typescript
@Enable(PostgresUserRepository)
@Enable(EmailNotificationAdapter)
@Enable(ExpressWebServerAdapter)
export class MyApplication extends Application {
  // Application configuration through metadata
}
```

### Primary Ports

Entry points that drive your application:

```typescript
@AdapterFor(WebServerPort)
export class ExpressWebServerAdapter implements PrimaryPort {
  public async accept(app: Application): Promise<void> {
    const server = express();
    
    server.post('/api/users', async (req, res) => {
      const event = new UserRegistrationRequested(req.body.email, req.body.name);
      await app.handle(event);
      res.json({ success: true });
    });
    
    server.listen(3000);
  }
}
```

## Event Processing

The application layer processes events in a queue-based system with cascading support:

```typescript
@listen(OrderPlaced)
public async coordinateOrderProcessing(event: OrderPlaced): Promise<Event[]> {
  return [
    new InventoryReservationRequested(event.orderId, event.items),
    new PaymentProcessingRequested(event.orderId, event.amount),
    new ShippingArrangementRequested(event.orderId, event.address)
  ];
}
```

## Multi-Channel Applications

Support multiple entry points with the same business logic:

```typescript
@Enable(PostgresUserRepository)
@Enable(EmailNotificationAdapter)
@Enable(ExpressWebServerAdapter)    // HTTP API
@Enable(UserCLIAdapter)             // Command line
@Enable(RabbitMQConsumerAdapter)    // Message queue
export class MultiChannelApplication extends Application {
  // Same logic, multiple interfaces
}
```

## Testing

Application layer testing focuses on coordination logic:

```typescript
describe('UserManagementApplication', () => {
  let application: UserManagementApplication;
  let mockUserRepository: jest.Mocked<UserRepository>;

  beforeEach(() => {
    mockUserRepository = createMockUserRepository();
    application = new UserManagementApplication();
    
    Ports.set(UserRepository, mockUserRepository);
  });

  it('should coordinate user registration flow', async () => {
    const event = new UserRegistrationRequested(
      new Email('test@example.com'),
      'Test User'
    );

    await application.handle(event);

    expect(mockUserRepository.save).toHaveBeenCalledWith(expect.any(User));
  });
});
```

## Documentation

- 📖 [Complete Getting Started Guide](./docs/getting_started.org)
- 📚 [The Application Story](./docs/story.org) - Comprehensive narrative about the application layer
- 📋 [Development Journal](./docs/journal.org) - Design decisions and lessons learned
- 🔧 [Application Orchestration Specification](./docs/specs/application-orchestration.org)
- 🎭 [@Enable Decorator Patterns](./docs/specs/enable-decorator-patterns.org)
- 🔌 [Primary Port Interfaces](./docs/specs/primary-port-interfaces.org)

## Advanced Features

### Saga Pattern Support

```typescript
export class OrderProcessingSaga {
  @listen(OrderPlaced)
  public async executeOrderSaga(event: OrderPlaced): Promise<Event[]> {
    return [
      new InventoryReservationRequested(event.orderId, event.items),
      new PaymentProcessingRequested(event.orderId, event.amount)
    ];
  }

  @listen(PaymentFailed)
  public async compensatePaymentFailure(event: PaymentFailed): Promise<Event[]> {
    return [
      new InventoryReservationCancelled(event.orderId),
      new CustomerNotificationRequested(event.customerId, 'payment_failed')
    ];
  }
}
```

### Multi-Tenant Applications

```typescript
@Enable(MultiTenantUserRepository)
@Enable(TenantAwareNotificationAdapter)
export class MultiTenantSaaSApplication extends Application {
  @listen(UserRegistrationRequested)
  public async handleTenantUserRegistration(event: UserRegistrationRequested): Promise<Event[]> {
    const tenantId = this.extractTenantId(event);
    
    TenantContext.set(tenantId);
    try {
      return await this.processRegistration(event);
    } finally {
      TenantContext.clear();
    }
  }
}
```

### Performance Optimization

```typescript
export class PerformantApplication extends Application {
  private eventProcessor: BatchedEventProcessor;
  
  constructor() {
    super();
    this.eventProcessor = new BatchedEventProcessor({
      batchSize: 100,
      batchTimeout: 1000
    });
  }

  public async handle(events: Event | Event[]): Promise<void> {
    return this.eventProcessor.process(events);
  }
}
```

## Architecture

The application layer follows these principles:

1. **Coordination over Implementation**: Applications orchestrate, they don't execute business logic
2. **Event-Driven by Default**: All interactions flow through events
3. **Resilience First**: Failure is expected and handled gracefully
4. **Platform Agnostic**: Applications should run anywhere
5. **Developer Experience**: Good architecture should feel natural to use

## Contributing

We welcome contributions! Please see our [Contributing Guide](./CONTRIBUTING.md) for details.

## License

This project is licensed under the GNU General Public License v3.0 - see the [LICENSE](./LICENSE) file for details.

## Related Projects

- [@typescript-eda/domain](https://github.com/rydnr/typescript-eda-domain) - Domain layer primitives
- [@typescript-eda/infrastructure](https://github.com/rydnr/typescript-eda-infrastructure) - Infrastructure adapters
- [Web-Buddy](https://github.com/rydnr/web-buddy) - Browser automation framework
- [ChatGPT-Buddy](https://github.com/rydnr/chatgpt-buddy) - AI automation tools

---

**Built with ❤️ by the TypeScript-EDA Team**