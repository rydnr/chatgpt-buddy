/**
 * Example API adapter implementations for TypeScript-EDA Infrastructure
 * 
 * This file demonstrates how to create robust API adapters that handle
 * external service integration with proper error handling and resilience.
 */

import { AdapterFor } from '@typescript-eda/infrastructure';
import { Port } from '@typescript-eda/domain';

// Example domain objects
class Email extends ValueObject {
  constructor(private value: string) { super(); }
  getValue(): string { return this.value; }
  protected getEqualityComponents(): unknown[] { return [this.value]; }
}

class UserId extends ValueObject {
  constructor(private value: string) { super(); }
  getValue(): string { return this.value; }
  protected getEqualityComponents(): unknown[] { return [this.value]; }
}

// Domain port contracts
abstract class NotificationPort extends Port {
  public readonly name = 'NotificationPort';
  
  public abstract sendEmail(to: Email, subject: string, body: string): Promise<void>;
  public abstract sendSMS(phoneNumber: string, message: string): Promise<void>;
}

abstract class UserSyncPort extends Port {
  public readonly name = 'UserSyncPort';
  
  public abstract syncUser(user: User): Promise<SyncResult>;
  public abstract getUserFromExternal(externalId: string): Promise<ExternalUser | null>;
}

// SendGrid Email Adapter
@AdapterFor(NotificationPort)
export class SendGridNotificationAdapter extends NotificationPort {
  constructor(
    private apiKey: string,
    private httpClient: HttpClient,
    private config: SendGridConfig
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      // Verify API key and connectivity
      const response = await this.httpClient.get('https://api.sendgrid.com/v3/user/profile', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`SendGrid API validation failed: ${response.status}`);
      }

      console.log('✅ SendGrid notification adapter initialized');
    } catch (error) {
      throw new NotificationAdapterError('Failed to initialize SendGrid adapter', error);
    }
  }

  public async sendEmail(to: Email, subject: string, body: string): Promise<void> {
    const retryPolicy = new ExponentialBackoffRetry({
      maxAttempts: 3,
      baseDelay: 1000,
      maxDelay: 10000
    });

    return retryPolicy.execute(async () => {
      const payload = {
        personalizations: [{
          to: [{ email: to.getValue() }],
          subject: subject
        }],
        from: { 
          email: this.config.fromEmail,
          name: this.config.fromName || 'Application'
        },
        content: [{
          type: 'text/html',
          value: body
        }],
        tracking_settings: {
          click_tracking: { enable: true },
          open_tracking: { enable: true }
        }
      };

      try {
        const response = await this.httpClient.post('https://api.sendgrid.com/v3/mail/send', {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          timeout: 30000
        });

        if (!response.ok) {
          throw new Error(`SendGrid API error: ${response.status} ${response.statusText}`);
        }

        console.log(`📧 Email sent successfully to ${to.getValue()}`);
      } catch (error) {
        throw this.translateSendGridError(error, to);
      }
    });
  }

  public async sendSMS(phoneNumber: string, message: string): Promise<void> {
    throw new NotificationAdapterError('SMS not supported by SendGrid adapter');
  }

  private translateSendGridError(error: any, email: Email): Error {
    if (error.response?.status === 400) {
      return new InvalidEmailError(`Invalid email address: ${email.getValue()}`);
    }
    
    if (error.response?.status === 401) {
      return new AuthenticationError('SendGrid API authentication failed');
    }
    
    if (error.response?.status === 429) {
      const retryAfter = parseInt(error.response.headers['x-ratelimit-reset']) || 60;
      return new RateLimitError('SendGrid rate limit exceeded', retryAfter);
    }
    
    if (error.response?.status >= 500) {
      return new ExternalServiceError('SendGrid service temporarily unavailable', error);
    }

    return new NotificationDeliveryError(`Failed to send email: ${error.message}`, error);
  }

  public async shutdown(): Promise<void> {
    console.log('📧 SendGrid notification adapter shut down');
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const response = await this.httpClient.get('https://api.sendgrid.com/v3/user/profile', {
        headers: { 'Authorization': `Bearer ${this.apiKey}` },
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Twilio SMS Adapter
@AdapterFor(NotificationPort)
export class TwilioNotificationAdapter extends NotificationPort {
  constructor(
    private accountSid: string,
    private authToken: string,
    private fromPhoneNumber: string,
    private httpClient: HttpClient
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      // Verify Twilio credentials
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const response = await this.httpClient.get(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`, {
        headers: {
          'Authorization': `Basic ${auth}`
        }
      });

      if (!response.ok) {
        throw new Error(`Twilio API validation failed: ${response.status}`);
      }

      console.log('✅ Twilio notification adapter initialized');
    } catch (error) {
      throw new NotificationAdapterError('Failed to initialize Twilio adapter', error);
    }
  }

  public async sendEmail(to: Email, subject: string, body: string): Promise<void> {
    throw new NotificationAdapterError('Email not supported by Twilio adapter');
  }

  public async sendSMS(phoneNumber: string, message: string): Promise<void> {
    const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
    
    try {
      const response = await this.httpClient.post(
        `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`,
        {
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams({
            From: this.fromPhoneNumber,
            To: phoneNumber,
            Body: message
          }).toString()
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio API error: ${response.status} ${response.statusText}`);
      }

      console.log(`📱 SMS sent successfully to ${phoneNumber}`);
    } catch (error) {
      throw this.translateTwilioError(error, phoneNumber);
    }
  }

  private translateTwilioError(error: any, phoneNumber: string): Error {
    if (error.response?.status === 400) {
      return new InvalidPhoneNumberError(`Invalid phone number: ${phoneNumber}`);
    }
    
    if (error.response?.status === 401) {
      return new AuthenticationError('Twilio API authentication failed');
    }
    
    if (error.response?.status === 429) {
      return new RateLimitError('Twilio rate limit exceeded', 60);
    }

    return new NotificationDeliveryError(`Failed to send SMS: ${error.message}`, error);
  }

  public async shutdown(): Promise<void> {
    console.log('📱 Twilio notification adapter shut down');
  }

  public async isHealthy(): Promise<boolean> {
    try {
      const auth = Buffer.from(`${this.accountSid}:${this.authToken}`).toString('base64');
      const response = await this.httpClient.get(`https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}.json`, {
        headers: { 'Authorization': `Basic ${auth}` },
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Salesforce CRM Integration Adapter
@AdapterFor(UserSyncPort)
export class SalesforceUserSyncAdapter extends UserSyncPort {
  private accessToken?: string;
  private instanceUrl?: string;

  constructor(
    private clientId: string,
    private clientSecret: string,
    private username: string,
    private password: string,
    private securityToken: string,
    private httpClient: HttpClient
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      await this.authenticate();
      console.log('✅ Salesforce user sync adapter initialized');
    } catch (error) {
      throw new UserSyncAdapterError('Failed to initialize Salesforce adapter', error);
    }
  }

  private async authenticate(): Promise<void> {
    const authPayload = new URLSearchParams({
      grant_type: 'password',
      client_id: this.clientId,
      client_secret: this.clientSecret,
      username: this.username,
      password: this.password + this.securityToken
    });

    const response = await this.httpClient.post('https://login.salesforce.com/services/oauth2/token', {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: authPayload.toString()
    });

    if (!response.ok) {
      throw new AuthenticationError('Salesforce authentication failed');
    }

    const data = await response.json();
    this.accessToken = data.access_token;
    this.instanceUrl = data.instance_url;
  }

  public async syncUser(user: User): Promise<SyncResult> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      // Check if user exists in Salesforce
      const existingContact = await this.findContactByEmail(user.getEmail());

      if (existingContact) {
        // Update existing contact
        return await this.updateContact(existingContact.Id, user);
      } else {
        // Create new contact
        return await this.createContact(user);
      }
    } catch (error) {
      if (error.response?.status === 401) {
        // Token expired, re-authenticate and retry
        await this.authenticate();
        return this.syncUser(user);
      }
      throw this.translateSalesforceError(error);
    }
  }

  private async findContactByEmail(email: Email): Promise<any> {
    const query = `SELECT Id, Email, FirstName, LastName FROM Contact WHERE Email = '${email.getValue()}'`;
    const response = await this.httpClient.get(`${this.instanceUrl}/services/data/v52.0/query/`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      params: { q: query }
    });

    if (!response.ok) {
      throw new Error(`Salesforce query failed: ${response.status}`);
    }

    const data = await response.json();
    return data.records.length > 0 ? data.records[0] : null;
  }

  private async createContact(user: User): Promise<SyncResult> {
    const contactData = {
      FirstName: user.getName().split(' ')[0],
      LastName: user.getName().split(' ').slice(1).join(' ') || 'Unknown',
      Email: user.getEmail().getValue(),
      Description: `Synced from application on ${new Date().toISOString()}`
    };

    const response = await this.httpClient.post(`${this.instanceUrl}/services/data/v52.0/sobjects/Contact/`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      throw new Error(`Failed to create Salesforce contact: ${response.status}`);
    }

    const data = await response.json();
    return new SyncResult(
      user.id,
      data.id,
      SyncOperation.CREATE,
      new Date(),
      true
    );
  }

  private async updateContact(contactId: string, user: User): Promise<SyncResult> {
    const contactData = {
      FirstName: user.getName().split(' ')[0],
      LastName: user.getName().split(' ').slice(1).join(' ') || 'Unknown',
      Email: user.getEmail().getValue(),
      Description: `Updated from application on ${new Date().toISOString()}`
    };

    const response = await this.httpClient.patch(`${this.instanceUrl}/services/data/v52.0/sobjects/Contact/${contactId}`, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(contactData)
    });

    if (!response.ok) {
      throw new Error(`Failed to update Salesforce contact: ${response.status}`);
    }

    return new SyncResult(
      user.id,
      contactId,
      SyncOperation.UPDATE,
      new Date(),
      true
    );
  }

  public async getUserFromExternal(externalId: string): Promise<ExternalUser | null> {
    if (!this.accessToken) {
      await this.authenticate();
    }

    try {
      const response = await this.httpClient.get(`${this.instanceUrl}/services/data/v52.0/sobjects/Contact/${externalId}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(`Failed to fetch Salesforce contact: ${response.status}`);
      }

      const contact = await response.json();
      return new ExternalUser(
        contact.Id,
        contact.Email,
        `${contact.FirstName} ${contact.LastName}`,
        contact.CreatedDate ? new Date(contact.CreatedDate) : new Date()
      );
    } catch (error) {
      throw this.translateSalesforceError(error);
    }
  }

  private translateSalesforceError(error: any): Error {
    if (error.response?.status === 401) {
      return new AuthenticationError('Salesforce authentication failed');
    }
    
    if (error.response?.status === 403) {
      return new AuthorizationError('Insufficient Salesforce permissions');
    }
    
    if (error.response?.status === 429) {
      return new RateLimitError('Salesforce API rate limit exceeded', 300);
    }
    
    if (error.response?.status >= 500) {
      return new ExternalServiceError('Salesforce service temporarily unavailable', error);
    }

    return new UserSyncError(`Salesforce sync failed: ${error.message}`, error);
  }

  public async shutdown(): Promise<void> {
    console.log('🔄 Salesforce user sync adapter shut down');
  }

  public async isHealthy(): Promise<boolean> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }
      
      const response = await this.httpClient.get(`${this.instanceUrl}/services/data/v52.0/limits/`, {
        headers: { 'Authorization': `Bearer ${this.accessToken}` },
        timeout: 5000
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Base HTTP API Adapter (reusable pattern)
export abstract class BaseHttpApiAdapter extends Port {
  constructor(
    protected baseUrl: string,
    protected httpClient: HttpClient,
    protected config: ApiConfig
  ) {
    super();
  }

  protected async makeRequest<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'User-Agent': 'TypeScript-EDA/1.0',
      ...this.getAuthHeaders(),
      ...options.headers
    };

    const requestConfig = {
      method,
      url,
      headers,
      timeout: options.timeout || this.config.defaultTimeout || 30000,
      ...options
    };

    try {
      const response = await this.httpClient.request(requestConfig);
      
      if (!response.ok) {
        throw new ApiError(`API request failed: ${response.status} ${response.statusText}`, response.status);
      }

      return response.json();
    } catch (error) {
      throw this.translateApiError(error);
    }
  }

  protected abstract getAuthHeaders(): Record<string, string>;

  protected translateApiError(error: any): Error {
    if (error instanceof ApiError) {
      return error;
    }

    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      return new ConnectionError(`Cannot connect to API: ${this.baseUrl}`, error);
    }

    if (error.code === 'ETIMEDOUT') {
      return new TimeoutError('API request timed out', error);
    }

    return new ExternalServiceError(`Unexpected API error: ${error.message}`, error);
  }

  protected async withRetry<T>(operation: () => Promise<T>, maxAttempts: number = 3): Promise<T> {
    const retryPolicy = new ExponentialBackoffRetry({
      maxAttempts,
      baseDelay: 1000,
      maxDelay: 10000
    });

    return retryPolicy.execute(operation);
  }
}

// Configuration interfaces
export interface SendGridConfig {
  fromEmail: string;
  fromName?: string;
  trackingEnabled?: boolean;
}

export interface ApiConfig {
  defaultTimeout?: number;
  retryAttempts?: number;
  rateLimit?: {
    requestsPerSecond: number;
    burstLimit: number;
  };
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  body?: string;
  params?: Record<string, string>;
}

// Domain objects for sync operations
export class SyncResult {
  constructor(
    public readonly userId: UserId,
    public readonly externalId: string,
    public readonly operation: SyncOperation,
    public readonly syncedAt: Date,
    public readonly success: boolean,
    public readonly error?: string
  ) {}
}

export enum SyncOperation {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete'
}

export class ExternalUser {
  constructor(
    public readonly externalId: string,
    public readonly email: string,
    public readonly name: string,
    public readonly createdAt: Date
  ) {}
}

// Custom errors
export class NotificationAdapterError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NotificationAdapterError';
  }
}

export class NotificationDeliveryError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'NotificationDeliveryError';
  }
}

export class InvalidEmailError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidEmailError';
  }
}

export class InvalidPhoneNumberError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPhoneNumberError';
  }
}

export class UserSyncAdapterError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'UserSyncAdapterError';
  }
}

export class UserSyncError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'UserSyncError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class AuthorizationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthorizationError';
  }
}

export class RateLimitError extends Error {
  constructor(message: string, public readonly retryAfter: number) {
    super(message);
    this.name = 'RateLimitError';
  }
}

export class ExternalServiceError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ExternalServiceError';
  }
}

export class ApiError extends Error {
  constructor(message: string, public readonly statusCode: number) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ConnectionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'ConnectionError';
  }
}

export class TimeoutError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TimeoutError';
  }
}

// Utility classes
export class ExponentialBackoffRetry {
  constructor(private config: {
    maxAttempts: number;
    baseDelay: number;
    maxDelay: number;
  }) {}

  public async execute<T>(operation: () => Promise<T>): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= this.config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        if (attempt === this.config.maxAttempts) {
          throw lastError;
        }

        // Don't retry on authentication errors
        if (error instanceof AuthenticationError || error instanceof AuthorizationError) {
          throw error;
        }

        const delay = Math.min(
          this.config.baseDelay * Math.pow(2, attempt - 1),
          this.config.maxDelay
        );

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }
}

// Interface definitions (would be implemented by actual HTTP libraries)
interface HttpClient {
  get(url: string, config?: any): Promise<HttpResponse>;
  post(url: string, config?: any): Promise<HttpResponse>;
  put(url: string, config?: any): Promise<HttpResponse>;
  patch(url: string, config?: any): Promise<HttpResponse>;
  delete(url: string, config?: any): Promise<HttpResponse>;
  request(config: any): Promise<HttpResponse>;
}

interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  json(): Promise<any>;
  text(): Promise<string>;
}