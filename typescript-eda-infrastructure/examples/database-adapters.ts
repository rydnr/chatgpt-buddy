/**
 * Example database adapter implementations for TypeScript-EDA Infrastructure
 * 
 * This file demonstrates how to create robust database adapters that translate
 * between domain objects and persistence layers.
 */

import { AdapterFor } from '@typescript-eda/infrastructure';
import { Repository, Entity, ValueObject } from '@typescript-eda/domain';

// Example domain objects (would be defined in domain layer)
class UserId extends ValueObject {
  constructor(private value: string) { super(); }
  getValue(): string { return this.value; }
  protected getEqualityComponents(): unknown[] { return [this.value]; }
}

class Email extends ValueObject {
  constructor(private value: string) { super(); }
  getValue(): string { return this.value; }
  protected getEqualityComponents(): unknown[] { return [this.value]; }
}

class User extends Entity<UserId> {
  constructor(
    id: UserId,
    private email: Email,
    private name: string,
    private createdAt: Date = new Date()
  ) {
    super(id);
  }

  getEmail(): Email { return this.email; }
  getName(): string { return this.name; }
  getCreatedAt(): Date { return this.createdAt; }
}

// Domain repository contract
abstract class UserRepository extends Repository<User, UserId> {
  public abstract findByEmail(email: Email): Promise<User | null>;
  public abstract findActiveUsers(): Promise<User[]>;
  public abstract countByDomain(domain: string): Promise<number>;
}

// PostgreSQL Adapter Implementation
@AdapterFor(UserRepository)
export class PostgresUserRepository extends UserRepository {
  constructor(
    private connection: PostgresConnection,
    private logger: Logger
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      await this.connection.query('SELECT 1');
      this.logger.info('PostgreSQL user repository initialized');
    } catch (error) {
      throw new DatabaseConnectionError('Failed to initialize PostgreSQL repository', error);
    }
  }

  public async findById(id: UserId): Promise<User | null> {
    const startTime = Date.now();
    
    try {
      const result = await this.connection.query(
        'SELECT id, email, name, created_at FROM users WHERE id = $1',
        [id.getValue()]
      );

      this.logQueryPerformance('findById', Date.now() - startTime);

      return result.rows.length > 0 
        ? this.mapRowToUser(result.rows[0]) 
        : null;
    } catch (error) {
      this.logger.error('Failed to find user by ID', { userId: id.getValue(), error });
      throw new UserRepositoryError('Failed to find user by ID', error);
    }
  }

  public async findByEmail(email: Email): Promise<User | null> {
    try {
      const result = await this.connection.query(
        'SELECT id, email, name, created_at FROM users WHERE email = $1',
        [email.getValue()]
      );

      return result.rows.length > 0 
        ? this.mapRowToUser(result.rows[0]) 
        : null;
    } catch (error) {
      throw new UserRepositoryError('Failed to find user by email', error);
    }
  }

  public async save(user: User): Promise<void> {
    const query = `
      INSERT INTO users (id, email, name, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) 
      DO UPDATE SET 
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = EXCLUDED.updated_at
    `;

    try {
      await this.connection.query(query, [
        user.id.getValue(),
        user.getEmail().getValue(),
        user.getName(),
        user.getCreatedAt(),
        new Date()
      ]);
    } catch (error) {
      throw new UserRepositoryError('Failed to save user', error);
    }
  }

  public async delete(id: UserId): Promise<void> {
    try {
      const result = await this.connection.query(
        'DELETE FROM users WHERE id = $1',
        [id.getValue()]
      );

      if (result.rowCount === 0) {
        throw new UserNotFoundError(`User with ID ${id.getValue()} not found`);
      }
    } catch (error) {
      if (error instanceof UserNotFoundError) throw error;
      throw new UserRepositoryError('Failed to delete user', error);
    }
  }

  public async findAll(): Promise<User[]> {
    try {
      const result = await this.connection.query(
        'SELECT id, email, name, created_at FROM users ORDER BY created_at DESC'
      );
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw new UserRepositoryError('Failed to find all users', error);
    }
  }

  public async findActiveUsers(): Promise<User[]> {
    try {
      const result = await this.connection.query(
        'SELECT id, email, name, created_at FROM users WHERE status = $1 ORDER BY created_at DESC',
        ['active']
      );
      return result.rows.map(row => this.mapRowToUser(row));
    } catch (error) {
      throw new UserRepositoryError('Failed to find active users', error);
    }
  }

  public async countByDomain(domain: string): Promise<number> {
    try {
      const result = await this.connection.query(
        'SELECT COUNT(*) as count FROM users WHERE email LIKE $1',
        [`%@${domain}`]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      throw new UserRepositoryError('Failed to count users by domain', error);
    }
  }

  private mapRowToUser(row: any): User {
    return new User(
      new UserId(row.id),
      new Email(row.email),
      row.name,
      row.created_at
    );
  }

  private logQueryPerformance(operation: string, duration: number): void {
    if (duration > 1000) {
      this.logger.warn('Slow database query detected', { operation, duration });
    }
  }

  public async shutdown(): Promise<void> {
    await this.connection.close();
    this.logger.info('PostgreSQL user repository shut down');
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.connection.query('SELECT 1');
      return true;
    } catch {
      return false;
    }
  }
}

// MongoDB Adapter Implementation
@AdapterFor(UserRepository)
export class MongoUserRepository extends UserRepository {
  constructor(
    private collection: MongoCollection,
    private logger: Logger
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      await this.collection.findOne({});
      this.logger.info('MongoDB user repository initialized');
    } catch (error) {
      throw new DatabaseConnectionError('Failed to initialize MongoDB repository', error);
    }
  }

  public async findById(id: UserId): Promise<User | null> {
    try {
      const document = await this.collection.findOne({ _id: id.getValue() });
      return document ? this.mapDocumentToUser(document) : null;
    } catch (error) {
      throw new UserRepositoryError('Failed to find user by ID', error);
    }
  }

  public async findByEmail(email: Email): Promise<User | null> {
    try {
      const document = await this.collection.findOne({ email: email.getValue() });
      return document ? this.mapDocumentToUser(document) : null;
    } catch (error) {
      throw new UserRepositoryError('Failed to find user by email', error);
    }
  }

  public async save(user: User): Promise<void> {
    try {
      await this.collection.replaceOne(
        { _id: user.id.getValue() },
        {
          _id: user.id.getValue(),
          email: user.getEmail().getValue(),
          name: user.getName(),
          createdAt: user.getCreatedAt(),
          updatedAt: new Date()
        },
        { upsert: true }
      );
    } catch (error) {
      throw new UserRepositoryError('Failed to save user', error);
    }
  }

  public async delete(id: UserId): Promise<void> {
    try {
      const result = await this.collection.deleteOne({ _id: id.getValue() });
      if (result.deletedCount === 0) {
        throw new UserNotFoundError(`User with ID ${id.getValue()} not found`);
      }
    } catch (error) {
      if (error instanceof UserNotFoundError) throw error;
      throw new UserRepositoryError('Failed to delete user', error);
    }
  }

  public async findAll(): Promise<User[]> {
    try {
      const documents = await this.collection.find({}).sort({ createdAt: -1 }).toArray();
      return documents.map(doc => this.mapDocumentToUser(doc));
    } catch (error) {
      throw new UserRepositoryError('Failed to find all users', error);
    }
  }

  public async findActiveUsers(): Promise<User[]> {
    try {
      const documents = await this.collection
        .find({ status: 'active' })
        .sort({ createdAt: -1 })
        .toArray();
      return documents.map(doc => this.mapDocumentToUser(doc));
    } catch (error) {
      throw new UserRepositoryError('Failed to find active users', error);
    }
  }

  public async countByDomain(domain: string): Promise<number> {
    try {
      return await this.collection.countDocuments({
        email: { $regex: `@${domain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' }
      });
    } catch (error) {
      throw new UserRepositoryError('Failed to count users by domain', error);
    }
  }

  private mapDocumentToUser(document: any): User {
    return new User(
      new UserId(document._id),
      new Email(document.email),
      document.name,
      document.createdAt
    );
  }

  public async shutdown(): Promise<void> {
    // MongoDB client manages connection lifecycle
    this.logger.info('MongoDB user repository shut down');
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.collection.findOne({});
      return true;
    } catch {
      return false;
    }
  }
}

// Redis Cache Adapter (for caching layer)
@AdapterFor(UserRepository)
export class RedisUserCacheRepository extends UserRepository {
  constructor(
    private redisClient: RedisClient,
    private baseRepository: UserRepository,
    private ttlSeconds: number = 3600
  ) {
    super();
  }

  public async findById(id: UserId): Promise<User | null> {
    const cacheKey = `user:${id.getValue()}`;
    
    try {
      // Try cache first
      const cached = await this.redisClient.get(cacheKey);
      if (cached) {
        return this.deserializeUser(JSON.parse(cached));
      }

      // Cache miss - fetch from base repository
      const user = await this.baseRepository.findById(id);
      if (user) {
        await this.redisClient.setex(cacheKey, this.ttlSeconds, JSON.stringify(this.serializeUser(user)));
      }

      return user;
    } catch (error) {
      // If cache fails, fall back to base repository
      return this.baseRepository.findById(id);
    }
  }

  public async save(user: User): Promise<void> {
    await this.baseRepository.save(user);
    
    // Update cache
    const cacheKey = `user:${user.id.getValue()}`;
    try {
      await this.redisClient.setex(cacheKey, this.ttlSeconds, JSON.stringify(this.serializeUser(user)));
    } catch (error) {
      // Cache update failure shouldn't fail the operation
      console.warn('Failed to update cache:', error);
    }
  }

  public async delete(id: UserId): Promise<void> {
    await this.baseRepository.delete(id);
    
    // Remove from cache
    const cacheKey = `user:${id.getValue()}`;
    try {
      await this.redisClient.del(cacheKey);
    } catch (error) {
      console.warn('Failed to remove from cache:', error);
    }
  }

  // Delegate other operations to base repository
  public async findByEmail(email: Email): Promise<User | null> {
    return this.baseRepository.findByEmail(email);
  }

  public async findAll(): Promise<User[]> {
    return this.baseRepository.findAll();
  }

  public async findActiveUsers(): Promise<User[]> {
    return this.baseRepository.findActiveUsers();
  }

  public async countByDomain(domain: string): Promise<number> {
    return this.baseRepository.countByDomain(domain);
  }

  private serializeUser(user: User): any {
    return {
      id: user.id.getValue(),
      email: user.getEmail().getValue(),
      name: user.getName(),
      createdAt: user.getCreatedAt().toISOString()
    };
  }

  private deserializeUser(data: any): User {
    return new User(
      new UserId(data.id),
      new Email(data.email),
      data.name,
      new Date(data.createdAt)
    );
  }

  public async initialize(): Promise<void> {
    await this.baseRepository.initialize();
  }

  public async shutdown(): Promise<void> {
    await this.baseRepository.shutdown();
    await this.redisClient.quit();
  }

  public async isHealthy(): Promise<boolean> {
    const baseHealthy = await this.baseRepository.isHealthy();
    try {
      await this.redisClient.ping();
      return baseHealthy;
    } catch {
      return baseHealthy; // Cache failure doesn't affect health if base is healthy
    }
  }
}

// Custom errors
export class UserRepositoryError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'UserRepositoryError';
  }
}

export class UserNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UserNotFoundError';
  }
}

export class DatabaseConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'DatabaseConnectionError';
  }
}

// Interface definitions (would be implemented by actual database libraries)
interface PostgresConnection {
  query(sql: string, params?: any[]): Promise<{ rows: any[]; rowCount: number }>;
  close(): Promise<void>;
}

interface MongoCollection {
  findOne(filter: any): Promise<any>;
  find(filter: any): { sort(sort: any): { toArray(): Promise<any[]> } };
  replaceOne(filter: any, doc: any, options?: any): Promise<any>;
  deleteOne(filter: any): Promise<{ deletedCount: number }>;
  countDocuments(filter: any): Promise<number>;
}

interface RedisClient {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
  del(key: string): Promise<number>;
  ping(): Promise<string>;
  quit(): Promise<void>;
}

interface Logger {
  info(message: string, meta?: any): void;
  warn(message: string, meta?: any): void;
  error(message: string, meta?: any): void;
}