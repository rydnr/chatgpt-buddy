# TypeScript-EDA Infrastructure

Infrastructure adapters and implementations for TypeScript-EDA event-driven architecture.

## Overview

TypeScript-EDA Infrastructure provides the tools and patterns for building adapters that connect your pure domain logic to external systems. This package enables clean separation between domain concerns and infrastructure details while maintaining architectural integrity.

## Features

- **@AdapterFor Decorator** for explicit port-adapter mapping
- **Lifecycle Management** with initialization, health checks, and shutdown
- **Configuration Management** with validation and environment awareness
- **Error Translation** from external systems to domain-specific errors
- **Monitoring Integration** with metrics and structured logging
- **Testing Utilities** for adapter contract and integration testing

## Installation

```bash
npm install @typescript-eda/infrastructure @typescript-eda/domain
# or
pnpm add @typescript-eda/infrastructure @typescript-eda/domain
```

## Quick Start

### Define Your Domain Port

```typescript
import { Port } from '@typescript-eda/domain';

export abstract class NotificationPort extends Port {
  public readonly name = 'NotificationPort';
  
  public abstract sendEmail(to: Email, subject: string, body: string): Promise<void>;
}
```

### Create an Infrastructure Adapter

```typescript
import { AdapterFor } from '@typescript-eda/infrastructure';

@AdapterFor(NotificationPort)
export class SendGridNotificationAdapter extends NotificationPort {
  constructor(private apiKey: string, private httpClient: HttpClient) {
    super();
  }

  public async initialize(): Promise<void> {
    // Verify configuration and connectivity
    await this.httpClient.get('https://api.sendgrid.com/v3/user/profile', {
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
    console.log('✅ SendGrid adapter initialized');
  }

  public async sendEmail(to: Email, subject: string, body: string): Promise<void> {
    try {
      await this.httpClient.post('https://api.sendgrid.com/v3/mail/send', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        body: JSON.stringify({
          personalizations: [{ to: [{ email: to.getValue() }], subject }],
          from: { email: 'noreply@example.com' },
          content: [{ type: 'text/html', value: body }]
        })
      });
    } catch (error) {
      throw new NotificationDeliveryError(`Failed to send email: ${error.message}`, error);
    }
  }

  public async shutdown(): Promise<void> {
    console.log('📧 SendGrid adapter shutdown');
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.httpClient.get('https://api.sendgrid.com/v3/user/profile', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` }
      });
      return true;
    } catch {
      return false;
    }
  }
}
```

### Use in Your Application

```typescript
import { Application, Enable } from '@typescript-eda/application';

@Enable(SendGridNotificationAdapter)
export class MyApplication extends Application {
  public readonly metadata = new Map([
    ['name', 'MyApplication'],
    ['description', 'Application with email notifications']
  ]);
}
```

## Core Concepts

### Adapters

Adapters implement domain ports and handle communication with external systems:

- **Database Adapters**: PostgreSQL, MongoDB, Redis repositories
- **API Adapters**: REST, GraphQL, gRPC service clients
- **Message Adapters**: RabbitMQ, Kafka, SQS message handling
- **File Adapters**: S3, local filesystem, document storage
- **Authentication Adapters**: JWT, OAuth, API key validation

### @AdapterFor Decorator

The `@AdapterFor` decorator creates explicit mappings between ports and adapters:

```typescript
@AdapterFor(UserRepository)
export class PostgresUserRepository extends UserRepository {
  // Implementation that translates domain operations to SQL
}
```

This enables:
- Automatic discovery and dependency injection
- Clear contracts between domain and infrastructure
- Type-safe adapter registration
- Runtime validation of adapter implementations

### Lifecycle Management

All adapters implement a standard lifecycle:

```typescript
export abstract class Port {
  public abstract initialize(): Promise<void>;    // Startup configuration
  public abstract shutdown(): Promise<void>;      // Graceful cleanup
  public abstract isHealthy(): Promise<boolean>;  // Health monitoring
}
```

### Error Translation

Adapters translate external errors to domain-specific errors:

```typescript
private translateApiError(error: any): Error {
  if (error.status === 401) {
    return new AuthenticationError('API authentication failed');
  }
  if (error.status === 429) {
    return new RateLimitError('API rate limit exceeded', error.headers['retry-after']);
  }
  return new ExternalServiceError(`API error: ${error.message}`, error);
}
```

## Adapter Patterns

### Repository Adapters

Repository adapters provide domain-friendly data access:

```typescript
@AdapterFor(UserRepository)
export class PostgresUserRepository extends UserRepository {
  public async findByEmail(email: Email): Promise<User | null> {
    const result = await this.connection.query(
      'SELECT * FROM users WHERE email = $1',
      [email.getValue()]
    );
    return result.rows.length > 0 ? this.mapToUser(result.rows[0]) : null;
  }

  private mapToUser(row: any): User {
    return new User(
      new UserId(row.id),
      new Email(row.email),
      new UserName(row.first_name, row.last_name),
      new UserStatus(row.status)
    );
  }
}
```

### API Client Adapters

API adapters handle external service integration:

```typescript
@AdapterFor(PaymentPort)
export class StripePaymentAdapter extends PaymentPort {
  public async processPayment(payment: Payment): Promise<PaymentResult> {
    try {
      const intent = await this.stripe.paymentIntents.create({
        amount: payment.getAmount().getAmount() * 100,
        currency: payment.getAmount().getCurrency(),
        payment_method: payment.getPaymentMethod().getStripeId()
      });
      
      return new PaymentResult(
        new PaymentId(intent.id),
        PaymentStatus.fromStripeStatus(intent.status)
      );
    } catch (error) {
      throw this.translateStripeError(error);
    }
  }
}
```

### Message Queue Adapters

Message adapters enable event-driven communication:

```typescript
@AdapterFor(EventBusPort)
export class RabbitMQEventBusAdapter extends EventBusPort {
  public async publishEvent(event: Event): Promise<void> {
    const message = Buffer.from(JSON.stringify(event.toJSON()));
    await this.channel.publish('domain-events', event.type, message);
  }

  public async subscribeToEvents(handler: EventHandler): Promise<void> {
    await this.channel.consume('event-queue', async (msg) => {
      if (msg) {
        const event = this.deserializeEvent(msg.content);
        await handler(event);
        this.channel.ack(msg);
      }
    });
  }
}
```

## Configuration Management

### Environment-Aware Configuration

```typescript
export class InfrastructureConfig {
  public readonly database: DatabaseConfig;
  public readonly notification: NotificationConfig;

  constructor() {
    this.database = this.loadDatabaseConfig();
    this.notification = this.loadNotificationConfig();
    this.validate();
  }

  private validate(): void {
    if (!this.database.password) {
      throw new ConfigurationError('Database password is required');
    }
    // Additional validations...
  }
}
```

### Adapter Factories

Factories create adapters based on configuration:

```typescript
export class AdapterFactory {
  public createNotificationAdapter(): NotificationPort {
    switch (this.config.notification.provider) {
      case 'sendgrid':
        return new SendGridNotificationAdapter(this.config.notification.apiKey);
      case 'smtp':
        return new SMTPNotificationAdapter(this.config.notification.smtp);
      default:
        return new ConsoleNotificationAdapter();
    }
  }
}
```

## Testing

### Contract Testing

Test that adapters fulfill their port contracts:

```typescript
describe('NotificationAdapter Contract', () => {
  const adapters = [
    new SendGridAdapter(apiKey, httpClient),
    new SMTPAdapter(smtpConfig),
    new ConsoleAdapter()
  ];

  adapters.forEach(adapter => {
    describe(`${adapter.constructor.name}`, () => {
      it('should send email successfully', async () => {
        await expect(adapter.sendEmail(email, 'Subject', 'Body'))
          .resolves.not.toThrow();
      });
    });
  });
});
```

### Integration Testing

Test real integration with external systems:

```typescript
describe('PostgresRepository Integration', () => {
  let container: StartedTestContainer;
  let repository: PostgresUserRepository;

  beforeAll(async () => {
    container = await new PostgreSqlContainer().start();
    repository = new PostgresUserRepository(createConnection(container));
    await repository.initialize();
  });

  afterAll(async () => {
    await repository.shutdown();
    await container.stop();
  });

  it('should persist and retrieve users', async () => {
    const user = createTestUser();
    await repository.save(user);
    
    const retrieved = await repository.findById(user.id);
    expect(retrieved?.id.equals(user.id)).toBe(true);
  });
});
```

## Best Practices

### Adapter Design

1. **Single Responsibility**: Each adapter handles one external system
2. **Error Translation**: Convert external errors to domain-specific errors
3. **Configuration Validation**: Validate configuration at initialization
4. **Resource Management**: Implement proper lifecycle management
5. **Monitoring**: Include health checks and performance metrics

### Error Handling

```typescript
// Good: Domain-specific error translation
private handlePaymentError(error: any): never {
  if (error.type === 'card_error') {
    throw new PaymentDeclinedError(error.message, error.decline_code);
  }
  if (error.type === 'rate_limit_error') {
    throw new RateLimitError('Payment service unavailable', error.retry_after);
  }
  throw new PaymentProcessingError(`Unexpected error: ${error.message}`, error);
}
```

### Configuration

```typescript
// Good: Comprehensive validation with helpful messages
private validateConfig(): void {
  const errors: string[] = [];
  
  if (!this.apiKey) {
    errors.push('API key is required');
  }
  
  if (this.timeout < 1000) {
    errors.push('Timeout must be at least 1000ms');
  }
  
  if (errors.length > 0) {
    throw new ConfigurationError(
      'Configuration errors:\n' + errors.map(e => `  - ${e}`).join('\n')
    );
  }
}
```

## Examples

See the [examples](./examples) directory for complete implementations:

- **Database Integration**: PostgreSQL, MongoDB, Redis adapters
- **API Integration**: REST, GraphQL client adapters
- **Message Queues**: RabbitMQ, Kafka event bus adapters
- **File Storage**: S3, local filesystem adapters
- **Authentication**: JWT, OAuth, API key adapters

## Documentation

- **[Getting Started Guide](./docs/getting_started.org)** - Complete tutorial with examples
- **[Infrastructure Story](./docs/story.org)** - The philosophy and evolution of infrastructure patterns
- **[Development Journal](./docs/journal.org)** - Design decisions and lessons learned
- **[Specifications](./docs/specs/)** - Complete infrastructure examples

## Related Packages

TypeScript-EDA Infrastructure is part of the TypeScript-EDA ecosystem:

- **[@typescript-eda/domain](https://github.com/rydnr/typescript-eda-domain)** - Core domain primitives and patterns
- **[@typescript-eda/application](https://github.com/rydnr/typescript-eda-application)** - Application layer and dependency injection
- **[@web-buddy/core](https://github.com/rydnr/web-buddy)** - Web automation built on EDA principles

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [typescript-eda.org/infrastructure](https://typescript-eda.org/infrastructure)
- **Issues**: [GitHub Issues](https://github.com/rydnr/typescript-eda-infrastructure/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rydnr/typescript-eda-infrastructure/discussions)