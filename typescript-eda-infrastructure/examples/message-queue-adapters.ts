/**
 * Example message queue adapter implementations for TypeScript-EDA Infrastructure
 * 
 * This file demonstrates how to create robust message queue adapters that handle
 * event-driven communication with proper error handling and resilience.
 */

import { AdapterFor } from '@typescript-eda/infrastructure';
import { Port, Event, PrimaryPort } from '@typescript-eda/domain';

// Domain port contracts
abstract class EventBusPort extends Port {
  public readonly name = 'EventBusPort';
  
  public abstract publishEvent(event: Event): Promise<void>;
  public abstract subscribeToEvents(eventTypes: string[], handler: EventHandler): Promise<void>;
  public abstract unsubscribeFromEvents(eventTypes: string[]): Promise<void>;
}

abstract class MessageQueuePort extends Port {
  public readonly name = 'MessageQueuePort';
  
  public abstract sendMessage(queue: string, message: QueueMessage): Promise<void>;
  public abstract receiveMessages(queue: string, handler: MessageHandler): Promise<void>;
  public abstract createQueue(name: string, options?: QueueOptions): Promise<void>;
  public abstract deleteQueue(name: string): Promise<void>;
}

// RabbitMQ Event Bus Adapter
@AdapterFor(EventBusPort)
export class RabbitMQEventBusAdapter extends EventBusPort implements PrimaryPort {
  private connection?: amqp.Connection;
  private channel?: amqp.Channel;
  private consumerTags: Map<string, string> = new Map();

  constructor(
    private connectionUrl: string,
    private exchangeName: string = 'domain-events',
    private config: RabbitMQConfig
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.connectionUrl, {
        heartbeat: this.config.heartbeat || 60,
        ...this.config.connectionOptions
      });

      this.channel = await this.connection.createChannel();
      
      // Set up event exchange
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true,
        autoDelete: false
      });

      // Set prefetch to control message processing
      await this.channel.prefetch(this.config.prefetchCount || 10);

      // Handle connection events
      this.connection.on('error', this.handleConnectionError.bind(this));
      this.connection.on('close', this.handleConnectionClose.bind(this));

      console.log('✅ RabbitMQ event bus adapter initialized');
    } catch (error) {
      throw new MessageQueueAdapterError('Failed to initialize RabbitMQ adapter', error);
    }
  }

  public async accept(app: Application): Promise<void> {
    // Primary port implementation - start consuming events
    await this.setupEventConsumers(app);
  }

  public async publishEvent(event: Event): Promise<void> {
    if (!this.channel) {
      throw new MessageQueueAdapterError('RabbitMQ channel not initialized');
    }

    const routingKey = this.buildRoutingKey(event);
    const message = Buffer.from(JSON.stringify(event.toJSON()));

    try {
      const published = this.channel.publish(this.exchangeName, routingKey, message, {
        persistent: true,
        messageId: event.id,
        timestamp: event.timestamp.getTime(),
        type: event.type,
        headers: {
          eventVersion: '1.0',
          publishedAt: new Date().toISOString()
        }
      });

      if (!published) {
        // Channel is full, wait for confirmation
        await new Promise((resolve, reject) => {
          this.channel!.once('drain', resolve);
          setTimeout(() => reject(new Error('Channel drain timeout')), 5000);
        });
      }

      console.log(`📤 Event published: ${event.type} (${event.id})`);
    } catch (error) {
      throw new EventPublishError(`Failed to publish event ${event.type}`, error);
    }
  }

  public async subscribeToEvents(eventTypes: string[], handler: EventHandler): Promise<void> {
    if (!this.channel) {
      throw new MessageQueueAdapterError('RabbitMQ channel not initialized');
    }

    // Create a consumer queue for this subscription
    const queueName = `events_${this.config.serviceName}_${Date.now()}`;
    const queue = await this.channel.assertQueue(queueName, {
      exclusive: true,
      autoDelete: true
    });

    // Bind queue to event types
    for (const eventType of eventTypes) {
      const routingKey = this.buildRoutingKey({ type: eventType } as Event);
      await this.channel.bindQueue(queue.queue, this.exchangeName, routingKey);
    }

    // Start consuming
    const consumerTag = await this.channel.consume(queue.queue, async (msg) => {
      if (msg) {
        await this.handleMessage(msg, handler);
      }
    }, {
      noAck: false
    });

    // Store consumer tag for cleanup
    const subscriptionKey = eventTypes.join(',');
    this.consumerTags.set(subscriptionKey, consumerTag.consumerTag);

    console.log(`🔔 Subscribed to events: ${eventTypes.join(', ')}`);
  }

  public async unsubscribeFromEvents(eventTypes: string[]): Promise<void> {
    if (!this.channel) return;

    const subscriptionKey = eventTypes.join(',');
    const consumerTag = this.consumerTags.get(subscriptionKey);

    if (consumerTag) {
      await this.channel.cancel(consumerTag);
      this.consumerTags.delete(subscriptionKey);
      console.log(`🔕 Unsubscribed from events: ${eventTypes.join(', ')}`);
    }
  }

  private async setupEventConsumers(app: Application): Promise<void> {
    // Set up general event consumption for the application
    const queueName = `app_events_${this.config.serviceName}`;
    const queue = await this.channel!.assertQueue(queueName, {
      durable: true,
      autoDelete: false
    });

    // Bind to all events (or specific patterns based on configuration)
    const eventPatterns = this.config.eventPatterns || ['events.*'];
    for (const pattern of eventPatterns) {
      await this.channel!.bindQueue(queue.queue, this.exchangeName, pattern);
    }

    await this.channel!.consume(queue.queue, async (msg) => {
      if (msg) {
        try {
          const event = this.deserializeEvent(msg.content);
          await app.handle(event);
          this.channel!.ack(msg);
        } catch (error) {
          console.error('Failed to process event:', error);
          this.channel!.nack(msg, false, false); // Dead letter the message
        }
      }
    });
  }

  private async handleMessage(msg: amqp.ConsumeMessage, handler: EventHandler): Promise<void> {
    try {
      const event = this.deserializeEvent(msg.content);
      await handler(event);
      this.channel!.ack(msg);
    } catch (error) {
      console.error('Event handler failed:', error);
      
      // Implement retry logic
      const retryCount = (msg.properties.headers?.retryCount || 0) + 1;
      const maxRetries = this.config.maxRetries || 3;

      if (retryCount <= maxRetries) {
        // Re-publish with retry count
        const retryMessage = Buffer.from(msg.content);
        await this.channel!.publish(this.exchangeName, msg.fields.routingKey, retryMessage, {
          ...msg.properties,
          headers: {
            ...msg.properties.headers,
            retryCount,
            originalFailure: error.message
          }
        });
        this.channel!.ack(msg);
      } else {
        // Max retries exceeded, dead letter
        this.channel!.nack(msg, false, false);
      }
    }
  }

  private buildRoutingKey(event: Event): string {
    return `events.${event.type}`;
  }

  private deserializeEvent(content: Buffer): Event {
    try {
      const data = JSON.parse(content.toString());
      return this.reconstructEvent(data);
    } catch (error) {
      throw new EventDeserializationError('Failed to deserialize event', error);
    }
  }

  private reconstructEvent(data: any): Event {
    // This would typically use an event registry to reconstruct the proper event type
    // For simplicity, we'll create a generic event
    return new GenericEvent(data.type, data, new Date(data.timestamp), data.id);
  }

  private handleConnectionError(error: Error): void {
    console.error('RabbitMQ connection error:', error);
    // Implement reconnection logic
    this.reconnect();
  }

  private handleConnectionClose(): void {
    console.warn('RabbitMQ connection closed, attempting to reconnect...');
    this.reconnect();
  }

  private async reconnect(): Promise<void> {
    try {
      await this.shutdown();
      await new Promise(resolve => setTimeout(resolve, this.config.reconnectDelay || 5000));
      await this.initialize();
    } catch (error) {
      console.error('Failed to reconnect to RabbitMQ:', error);
      setTimeout(() => this.reconnect(), this.config.reconnectDelay || 5000);
    }
  }

  public async shutdown(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('🐰 RabbitMQ event bus adapter shut down');
    } catch (error) {
      console.warn('Error during RabbitMQ shutdown:', error);
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      return this.connection?.connection?.stream?.readable === true;
    } catch {
      return false;
    }
  }
}

// AWS SQS Message Queue Adapter
@AdapterFor(MessageQueuePort)
export class SQSMessageQueueAdapter extends MessageQueuePort {
  constructor(
    private sqsClient: AWS.SQS,
    private config: SQSConfig
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      // Verify SQS connectivity
      await this.sqsClient.listQueues().promise();
      console.log('✅ SQS message queue adapter initialized');
    } catch (error) {
      throw new MessageQueueAdapterError('Failed to initialize SQS adapter', error);
    }
  }

  public async sendMessage(queueName: string, message: QueueMessage): Promise<void> {
    try {
      const queueUrl = await this.getQueueUrl(queueName);
      
      const params: AWS.SQS.SendMessageRequest = {
        QueueUrl: queueUrl,
        MessageBody: JSON.stringify(message.body),
        MessageAttributes: this.buildMessageAttributes(message.attributes),
        DelaySeconds: message.delaySeconds,
        MessageGroupId: message.groupId, // For FIFO queues
        MessageDeduplicationId: message.deduplicationId
      };

      const result = await this.sqsClient.sendMessage(params).promise();
      
      console.log(`📤 Message sent to SQS queue ${queueName}: ${result.MessageId}`);
    } catch (error) {
      throw new MessageSendError(`Failed to send message to queue ${queueName}`, error);
    }
  }

  public async receiveMessages(queueName: string, handler: MessageHandler): Promise<void> {
    const queueUrl = await this.getQueueUrl(queueName);
    
    // Start polling for messages
    const poll = async (): Promise<void> => {
      try {
        const params: AWS.SQS.ReceiveMessageRequest = {
          QueueUrl: queueUrl,
          MaxNumberOfMessages: this.config.maxMessages || 10,
          WaitTimeSeconds: this.config.waitTimeSeconds || 20,
          MessageAttributeNames: ['All'],
          AttributeNames: ['All']
        };

        const result = await this.sqsClient.receiveMessage(params).promise();
        
        if (result.Messages) {
          await Promise.all(result.Messages.map(msg => this.processMessage(msg, queueUrl, handler)));
        }

        // Continue polling
        setImmediate(poll);
      } catch (error) {
        console.error('SQS polling error:', error);
        setTimeout(poll, this.config.errorRetryDelay || 5000);
      }
    };

    poll();
  }

  private async processMessage(
    sqsMessage: AWS.SQS.Message,
    queueUrl: string,
    handler: MessageHandler
  ): Promise<void> {
    try {
      const message = new QueueMessage(
        JSON.parse(sqsMessage.Body!),
        this.parseMessageAttributes(sqsMessage.MessageAttributes),
        sqsMessage.MessageId!,
        new Date()
      );

      await handler(message);

      // Delete message after successful processing
      await this.sqsClient.deleteMessage({
        QueueUrl: queueUrl,
        ReceiptHandle: sqsMessage.ReceiptHandle!
      }).promise();

      console.log(`✅ Processed SQS message: ${sqsMessage.MessageId}`);
    } catch (error) {
      console.error(`Failed to process SQS message ${sqsMessage.MessageId}:`, error);
      
      // Implement dead letter queue logic or retry logic here
      // For now, we'll let SQS handle retries based on queue configuration
    }
  }

  public async createQueue(name: string, options: QueueOptions = {}): Promise<void> {
    try {
      const params: AWS.SQS.CreateQueueRequest = {
        QueueName: name,
        Attributes: {
          VisibilityTimeoutSeconds: options.visibilityTimeout?.toString() || '30',
          MessageRetentionPeriod: options.messageRetentionPeriod?.toString() || '1209600',
          DelaySeconds: options.delaySeconds?.toString() || '0',
          ReceiveMessageWaitTimeSeconds: options.waitTimeSeconds?.toString() || '0'
        }
      };

      if (options.fifo) {
        params.QueueName += '.fifo';
        params.Attributes!['FifoQueue'] = 'true';
        params.Attributes!['ContentBasedDeduplication'] = 'true';
      }

      if (options.deadLetterQueue) {
        params.Attributes!['RedrivePolicy'] = JSON.stringify({
          deadLetterTargetArn: options.deadLetterQueue.arn,
          maxReceiveCount: options.deadLetterQueue.maxReceiveCount || 3
        });
      }

      const result = await this.sqsClient.createQueue(params).promise();
      console.log(`📋 Created SQS queue: ${name} (${result.QueueUrl})`);
    } catch (error) {
      throw new QueueCreationError(`Failed to create queue ${name}`, error);
    }
  }

  public async deleteQueue(name: string): Promise<void> {
    try {
      const queueUrl = await this.getQueueUrl(name);
      await this.sqsClient.deleteQueue({ QueueUrl: queueUrl }).promise();
      console.log(`🗑️ Deleted SQS queue: ${name}`);
    } catch (error) {
      throw new QueueDeletionError(`Failed to delete queue ${name}`, error);
    }
  }

  private async getQueueUrl(queueName: string): Promise<string> {
    try {
      const result = await this.sqsClient.getQueueUrl({ QueueName: queueName }).promise();
      return result.QueueUrl!;
    } catch (error) {
      throw new QueueNotFoundError(`Queue ${queueName} not found`);
    }
  }

  private buildMessageAttributes(attributes: Record<string, any> = {}): AWS.SQS.MessageBodyAttributeMap {
    const sqsAttributes: AWS.SQS.MessageBodyAttributeMap = {};

    for (const [key, value] of Object.entries(attributes)) {
      sqsAttributes[key] = {
        DataType: typeof value === 'number' ? 'Number' : 'String',
        StringValue: value.toString()
      };
    }

    return sqsAttributes;
  }

  private parseMessageAttributes(attributes: AWS.SQS.MessageBodyAttributeMap = {}): Record<string, any> {
    const parsed: Record<string, any> = {};

    for (const [key, attribute] of Object.entries(attributes)) {
      if (attribute.DataType === 'Number' && attribute.StringValue) {
        parsed[key] = parseFloat(attribute.StringValue);
      } else if (attribute.StringValue) {
        parsed[key] = attribute.StringValue;
      }
    }

    return parsed;
  }

  public async shutdown(): Promise<void> {
    console.log('☁️ SQS message queue adapter shut down');
  }

  public async isHealthy(): Promise<boolean> {
    try {
      await this.sqsClient.listQueues({ MaxResults: 1 }).promise();
      return true;
    } catch {
      return false;
    }
  }
}

// Apache Kafka Event Streaming Adapter
@AdapterFor(EventBusPort)
export class KafkaEventBusAdapter extends EventBusPort {
  private producer?: kafka.Producer;
  private consumer?: kafka.Consumer;
  private admin?: kafka.Admin;

  constructor(
    private kafka: kafka.Kafka,
    private topicName: string = 'domain-events',
    private config: KafkaConfig
  ) {
    super();
  }

  public async initialize(): Promise<void> {
    try {
      this.producer = this.kafka.producer(this.config.producerConfig);
      this.consumer = this.kafka.consumer({ 
        groupId: this.config.consumerGroupId,
        ...this.config.consumerConfig 
      });
      this.admin = this.kafka.admin();

      await Promise.all([
        this.producer.connect(),
        this.consumer.connect(),
        this.admin.connect()
      ]);

      // Ensure topic exists
      await this.ensureTopicExists();

      console.log('✅ Kafka event bus adapter initialized');
    } catch (error) {
      throw new MessageQueueAdapterError('Failed to initialize Kafka adapter', error);
    }
  }

  public async publishEvent(event: Event): Promise<void> {
    if (!this.producer) {
      throw new MessageQueueAdapterError('Kafka producer not initialized');
    }

    try {
      const message = {
        key: event.id,
        value: JSON.stringify(event.toJSON()),
        partition: this.calculatePartition(event),
        headers: {
          eventType: event.type,
          eventVersion: '1.0',
          publishedAt: new Date().toISOString()
        }
      };

      await this.producer.send({
        topic: this.topicName,
        messages: [message]
      });

      console.log(`📤 Event published to Kafka: ${event.type} (${event.id})`);
    } catch (error) {
      throw new EventPublishError(`Failed to publish event ${event.type} to Kafka`, error);
    }
  }

  public async subscribeToEvents(eventTypes: string[], handler: EventHandler): Promise<void> {
    if (!this.consumer) {
      throw new MessageQueueAdapterError('Kafka consumer not initialized');
    }

    try {
      await this.consumer.subscribe({ topic: this.topicName });

      await this.consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const eventType = message.headers?.eventType?.toString();
            
            if (!eventTypes.includes(eventType!)) {
              return; // Skip events we're not interested in
            }

            const event = this.deserializeEvent(message.value!);
            await handler(event);

            console.log(`✅ Processed Kafka event: ${eventType} from partition ${partition}`);
          } catch (error) {
            console.error('Failed to process Kafka message:', error);
            // Kafka will automatically retry based on configuration
          }
        }
      });

      console.log(`🔔 Subscribed to Kafka events: ${eventTypes.join(', ')}`);
    } catch (error) {
      throw new EventSubscriptionError('Failed to subscribe to Kafka events', error);
    }
  }

  public async unsubscribeFromEvents(eventTypes: string[]): Promise<void> {
    if (this.consumer) {
      await this.consumer.stop();
      console.log(`🔕 Unsubscribed from Kafka events: ${eventTypes.join(', ')}`);
    }
  }

  private async ensureTopicExists(): Promise<void> {
    if (!this.admin) return;

    try {
      const topics = await this.admin.listTopics();
      
      if (!topics.includes(this.topicName)) {
        await this.admin.createTopics({
          topics: [{
            topic: this.topicName,
            numPartitions: this.config.partitions || 3,
            replicationFactor: this.config.replicationFactor || 1,
            configEntries: [
              { name: 'retention.ms', value: '604800000' }, // 7 days
              { name: 'cleanup.policy', value: 'delete' }
            ]
          }]
        });
        console.log(`📋 Created Kafka topic: ${this.topicName}`);
      }
    } catch (error) {
      console.warn('Failed to ensure Kafka topic exists:', error);
    }
  }

  private calculatePartition(event: Event): number | undefined {
    if (this.config.partitionStrategy === 'event-type') {
      return this.hashString(event.type) % (this.config.partitions || 3);
    }
    if (this.config.partitionStrategy === 'event-id') {
      return this.hashString(event.id) % (this.config.partitions || 3);
    }
    return undefined; // Let Kafka decide
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  private deserializeEvent(buffer: Buffer): Event {
    try {
      const data = JSON.parse(buffer.toString());
      return this.reconstructEvent(data);
    } catch (error) {
      throw new EventDeserializationError('Failed to deserialize Kafka event', error);
    }
  }

  private reconstructEvent(data: any): Event {
    return new GenericEvent(data.type, data, new Date(data.timestamp), data.id);
  }

  public async shutdown(): Promise<void> {
    try {
      await Promise.all([
        this.producer?.disconnect(),
        this.consumer?.disconnect(),
        this.admin?.disconnect()
      ]);
      console.log('🌊 Kafka event bus adapter shut down');
    } catch (error) {
      console.warn('Error during Kafka shutdown:', error);
    }
  }

  public async isHealthy(): Promise<boolean> {
    try {
      if (!this.admin) return false;
      await this.admin.listTopics();
      return true;
    } catch {
      return false;
    }
  }
}

// Configuration interfaces
export interface RabbitMQConfig {
  serviceName: string;
  heartbeat?: number;
  prefetchCount?: number;
  maxRetries?: number;
  reconnectDelay?: number;
  eventPatterns?: string[];
  connectionOptions?: any;
}

export interface SQSConfig {
  maxMessages?: number;
  waitTimeSeconds?: number;
  errorRetryDelay?: number;
}

export interface KafkaConfig {
  consumerGroupId: string;
  partitions?: number;
  replicationFactor?: number;
  partitionStrategy?: 'event-type' | 'event-id' | 'random';
  producerConfig?: any;
  consumerConfig?: any;
}

// Domain objects
export class QueueMessage {
  constructor(
    public readonly body: any,
    public readonly attributes: Record<string, any> = {},
    public readonly id?: string,
    public readonly timestamp?: Date,
    public readonly delaySeconds?: number,
    public readonly groupId?: string,
    public readonly deduplicationId?: string
  ) {}
}

export interface QueueOptions {
  visibilityTimeout?: number;
  messageRetentionPeriod?: number;
  delaySeconds?: number;
  waitTimeSeconds?: number;
  fifo?: boolean;
  deadLetterQueue?: {
    arn: string;
    maxReceiveCount: number;
  };
}

export class GenericEvent extends Event {
  constructor(
    public readonly type: string,
    private data: any,
    timestamp?: Date,
    id?: string
  ) {
    super();
    if (timestamp) this.timestamp = timestamp;
    if (id) this.id = id;
  }

  public toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      ...this.data,
      timestamp: this.timestamp.toISOString(),
      id: this.id
    };
  }
}

// Type definitions
export type EventHandler = (event: Event) => Promise<void>;
export type MessageHandler = (message: QueueMessage) => Promise<void>;

// Custom errors
export class MessageQueueAdapterError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'MessageQueueAdapterError';
  }
}

export class EventPublishError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EventPublishError';
  }
}

export class EventSubscriptionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EventSubscriptionError';
  }
}

export class EventDeserializationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'EventDeserializationError';
  }
}

export class MessageSendError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'MessageSendError';
  }
}

export class QueueCreationError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'QueueCreationError';
  }
}

export class QueueDeletionError extends Error {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'QueueDeletionError';
  }
}

export class QueueNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QueueNotFoundError';
  }
}