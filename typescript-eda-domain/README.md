# TypeScript-EDA Domain

Core domain primitives for event-driven architecture in TypeScript.

## Overview

TypeScript-EDA Domain provides the fundamental building blocks for implementing Domain-Driven Design (DDD) patterns in event-driven architectures. This package contains the essential abstractions and tools for modeling rich business domains with clear separation of concerns.

## Features

- **Rich Domain Entities** with identity and behavior
- **Immutable Value Objects** with business rule validation
- **Domain Events** for capturing business occurrences
- **Repository Abstractions** for domain-friendly data access
- **Port Definitions** for clean architecture boundaries
- **@listen Decorator** for declarative event handling
- **Type-Safe** with full TypeScript support

## Installation

```bash
npm install @typescript-eda/domain
# or
pnpm add @typescript-eda/domain
```

## Quick Start

### Define a Value Object

```typescript
import { ValueObject } from '@typescript-eda/domain';

export class Email extends ValueObject {
  constructor(private readonly value: string) {
    super();
    this.validate(value);
  }

  private validate(email: string): void {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Invalid email: ${email}`);
    }
  }

  public getValue(): string {
    return this.value;
  }

  protected getEqualityComponents(): unknown[] {
    return [this.value];
  }
}
```

### Create a Domain Event

```typescript
import { Event } from '@typescript-eda/domain';

export class UserRegistered extends Event {
  public readonly type = 'UserRegistered';

  constructor(
    public readonly userId: string,
    public readonly email: Email
  ) {
    super();
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      userId: this.userId,
      email: this.email.getValue(),
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}
```

### Build a Domain Entity

```typescript
import { Entity, listen } from '@typescript-eda/domain';

export class User extends Entity<UserId> {
  constructor(
    id: UserId,
    private email: Email,
    private status: UserStatus
  ) {
    super(id);
  }

  @listen(EmailVerified)
  public async verifyEmail(event: EmailVerified): Promise<void> {
    if (!this.id.equals(event.userId)) return;
    
    this.status = UserStatus.ACTIVE;
  }

  public changeEmail(newEmail: Email): EmailChangeRequested {
    if (!this.status.isActive()) {
      throw new Error('User must be active to change email');
    }
    
    this.email = newEmail;
    return new EmailChangeRequested(this.id, newEmail);
  }
}
```

### Define a Repository

```typescript
import { Repository } from '@typescript-eda/domain';

export abstract class UserRepository extends Repository<User, UserId> {
  public abstract findByEmail(email: Email): Promise<User | null>;
  public abstract findActiveUsers(): Promise<User[]>;
}
```

## Core Concepts

### Entities

Entities have identity that persists over time. They encapsulate business behavior and maintain consistency through their lifecycle.

```typescript
export abstract class Entity<T extends ValueObject> {
  constructor(protected readonly _id: T) {}
  
  public get id(): T {
    return this._id;
  }
  
  public equals(other: Entity<T>): boolean {
    return this._id.equals(other._id);
  }
}
```

### Value Objects

Value Objects are immutable and defined by their attributes. They encapsulate business rules and prevent invalid states.

```typescript
export abstract class ValueObject {
  protected abstract getEqualityComponents(): unknown[];
  
  public equals(other: ValueObject): boolean {
    // Structural equality based on components
  }
}
```

### Domain Events

Events capture important business occurrences and enable loose coupling between domain components.

```typescript
export abstract class Event {
  public abstract readonly type: string;
  public readonly timestamp: Date;
  public readonly id: string;
  
  public abstract toJSON(): Record<string, unknown>;
}
```

### Event Handling

The `@listen` decorator enables declarative event handling within entities:

```typescript
export class Order extends Entity<OrderId> {
  @listen(PaymentProcessed)
  public async markAsPaid(event: PaymentProcessed): Promise<OrderPaid> {
    // Handle payment processed event
  }
}
```

## Architecture

TypeScript-EDA Domain follows clean architecture principles:

```
┌─────────────────────────────────────┐
│           Application Layer         │ ← Uses domain abstractions
├─────────────────────────────────────┤
│            Domain Layer             │ ← This package
│  • Entities • Value Objects        │
│  • Events   • Repositories         │
│  • Services • Domain Rules         │
├─────────────────────────────────────┤
│         Infrastructure Layer        │ ← Implements domain contracts
└─────────────────────────────────────┘
```

## Best Practices

### Entity Design

- Keep entities focused on business behavior
- Use factories for complex creation logic
- Return events from state-changing operations
- Validate business rules within entities

### Value Object Design

- Make them immutable
- Validate in constructor
- Use factory methods for complex validation
- Include business logic relevant to the value

### Event Design

- Use past tense names (UserRegistered, not RegisterUser)
- Include all necessary data for event handlers
- Make events immutable
- Provide meaningful toJSON() implementations

### Repository Design

- Define interfaces in domain layer
- Use domain language in method names
- Return domain objects, not DTOs
- Keep queries focused on business needs

## Testing

Domain models are easy to test since they contain pure business logic:

```typescript
describe('User', () => {
  it('should verify email when verification event occurs', async () => {
    const user = new User(userId, email, UserStatus.PENDING);
    const event = new EmailVerified(userId);
    
    await user.verifyEmail(event);
    
    expect(user.getStatus()).toBe(UserStatus.ACTIVE);
  });
});
```

## Examples

See the [examples](./examples) directory for complete domain implementations:

- **User Management**: Registration, verification, and profile management
- **E-commerce**: Orders, products, and inventory
- **Content Management**: Articles, authors, and publishing workflows

## Documentation

- **[Getting Started Guide](./docs/getting_started.org)** - Step-by-step tutorial
- **[Domain Story](./docs/story.org)** - The philosophy and evolution of domain design
- **[Development Journal](./docs/journal.org)** - Design decisions and lessons learned
- **[Specifications](./docs/specs/)** - Complete domain examples

## Related Packages

TypeScript-EDA Domain is part of the TypeScript-EDA ecosystem:

- **[@typescript-eda/infrastructure](https://github.com/rydnr/typescript-eda-infrastructure)** - Infrastructure adapters and implementations
- **[@typescript-eda/application](https://github.com/rydnr/typescript-eda-application)** - Application layer and dependency injection
- **[@web-buddy/core](https://github.com/rydnr/web-buddy)** - Web automation built on EDA principles

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Support

- **Documentation**: [typescript-eda.org/domain](https://typescript-eda.org/domain)
- **Issues**: [GitHub Issues](https://github.com/rydnr/typescript-eda-domain/issues)
- **Discussions**: [GitHub Discussions](https://github.com/rydnr/typescript-eda-domain/discussions)