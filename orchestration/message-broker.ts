/**
 * SYMBI Message Broker
 * 
 * Handles asynchronous message passing between agents and services.
 * Supports pub/sub patterns, message queues, and event-driven communication.
 */

import { EventEmitter } from 'events';
import { Message, QueueConfig, BrokerStatus } from '../shared/types/src';

export interface QueueMessage {
  id: string;
  topic: string;
  payload: any;
  timestamp: Date;
  attempts: number;
  maxAttempts: number;
  delayUntil?: Date;
  metadata: Record<string, any>;
}

export interface Queue {
  name: string;
  messages: QueueMessage[];
  consumers: string[];
  config: QueueConfig;
  createdAt: Date;
  lastActivity: Date;
}

export class MessageBroker extends EventEmitter {
  private queues: Map<string, Queue> = new Map();
  private subscriptions: Map<string, Set<string>> = new Map();
  private deadLetterQueue: QueueMessage[] = [];
  private isProcessing: boolean = false;

  constructor() {
    super();
    this.setupEventHandlers();
    this.startMessageProcessing();
  }

  private setupEventHandlers(): void {
    this.on('message:published', (topic: string, message: QueueMessage) => {
      console.log(`Message published to ${topic}: ${message.id}`);
    });

    this.on('message:consumed', (queueName: string, message: QueueMessage) => {
      console.log(`Message consumed from ${queueName}: ${message.id}`);
    });

    this.on('message:failed', (queueName: string, message: QueueMessage, error: Error) => {
      console.error(`Message failed in ${queueName}: ${message.id}`, error);
    });
  }

  /**
   * Publish a message to a topic
   */
  public async publish(topic: string, payload: any, options: {
    delay?: number;
    priority?: number;
    metadata?: Record<string, any>;
  } = {}): Promise<string> {
    const messageId = this.generateMessageId();
    const message: QueueMessage = {
      id: messageId,
      topic,
      payload,
      timestamp: new Date(),
      attempts: 0,
      maxAttempts: 3,
      delayUntil: options.delay ? new Date(Date.now() + options.delay) : undefined,
      metadata: options.metadata || {}
    };

    // Add to queue if there are subscribers
    const subscribers = this.subscriptions.get(topic);
    if (subscribers && subscribers.size > 0) {
      for (const queueName of subscribers) {
        this.addToQueue(queueName, message);
      }
    } else {
      // If no subscribers, add to default topic queue
      this.addToQueue(`topic:${topic}`, message);
    }

    this.emit('message:published', topic, message);
    return messageId;
  }

  /**
   * Subscribe to a topic with a queue
   */
  public async subscribe(topic: string, queueName: string, config: QueueConfig = {}): Promise<void> {
    if (!this.subscriptions.has(topic)) {
      this.subscriptions.set(topic, new Set());
    }
    
    this.subscriptions.get(topic)!.add(queueName);

    // Create queue if it doesn't exist
    if (!this.queues.has(queueName)) {
      this.createQueue(queueName, config);
    }
  }

  /**
   * Unsubscribe from a topic
   */
  public async unsubscribe(topic: string, queueName: string): Promise<void> {
    const subscribers = this.subscriptions.get(topic);
    if (subscribers) {
      subscribers.delete(queueName);
      if (subscribers.size === 0) {
        this.subscriptions.delete(topic);
      }
    }
  }

  /**
   * Create a new queue
   */
  public createQueue(name: string, config: QueueConfig = {}): void {
    const queue: Queue = {
      name,
      messages: [],
      consumers: [],
      config: {
        maxSize: config.maxSize || 1000,
        ttl: config.ttl || 3600000, // 1 hour
        retryDelay: config.retryDelay || 5000,
        deadLetterQueue: config.deadLetterQueue || 'dead-letter'
      },
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.queues.set(name, queue);
    console.log(`Queue created: ${name}`);
  }

  /**
   * Delete a queue
   */
  public async deleteQueue(name: string): Promise<boolean> {
    const queue = this.queues.get(name);
    if (!queue) {
      return false;
    }

    // Move remaining messages to dead letter queue
    for (const message of queue.messages) {
      this.deadLetterQueue.push(message);
    }

    this.queues.delete(name);
    console.log(`Queue deleted: ${name}`);
    return true;
  }

  /**
   * Add a consumer to a queue
   */
  public async addConsumer(queueName: string, consumerId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    if (!queue.consumers.includes(consumerId)) {
      queue.consumers.push(consumerId);
      queue.lastActivity = new Date();
    }

    return true;
  }

  /**
   * Remove a consumer from a queue
   */
  public async removeConsumer(queueName: string, consumerId: string): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    const index = queue.consumers.indexOf(consumerId);
    if (index > -1) {
      queue.consumers.splice(index, 1);
      queue.lastActivity = new Date();
      return true;
    }

    return false;
  }

  /**
   * Consume messages from a queue
   */
  public async consume(queueName: string, maxMessages: number = 1): Promise<Message[]> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return [];
    }

    const now = new Date();
    const messages: Message[] = [];

    for (let i = 0; i < maxMessages && queue.messages.length > 0; i++) {
      const message = queue.messages.find(msg => 
        !msg.delayUntil || msg.delayUntil <= now
      );

      if (message) {
        // Remove from queue
        const index = queue.messages.indexOf(message);
        queue.messages.splice(index, 1);

        // Update attempts
        message.attempts++;
        
        queue.lastActivity = new Date();

        // Convert to Message type
        messages.push({
          id: message.id,
          topic: message.topic,
          payload: message.payload,
          timestamp: message.timestamp,
          metadata: message.metadata
        });

        this.emit('message:consumed', queueName, message);
      }
    }

    return messages;
  }

  /**
   * Acknowledge successful message processing
   */
  public async acknowledge(queueName: string, messageId: string): Promise<boolean> {
    // In this implementation, messages are removed on consume
    // In a real implementation, this would handle ack/nack patterns
    console.log(`Message acknowledged: ${messageId} from ${queueName}`);
    return true;
  }

  /**
   * Reject a message (retry or send to dead letter queue)
   */
  public async reject(queueName: string, messageId: string, requeue: boolean = false): Promise<boolean> {
    const queue = this.queues.get(queueName);
    if (!queue) {
      return false;
    }

    // Find the message (this is simplified - in practice would track consumed messages)
    const message = queue.messages.find(msg => msg.id === messageId);
    if (!message) {
      return false;
    }

    if (requeue && message.attempts < message.maxAttempts) {
      // Retry with delay
      message.delayUntil = new Date(Date.now() + queue.config.retryDelay);
      console.log(`Message requeued: ${messageId} (attempt ${message.attempts})`);
    } else {
      // Send to dead letter queue
      this.deadLetterQueue.push(message);
      const index = queue.messages.indexOf(message);
      queue.messages.splice(index, 1);
      console.log(`Message sent to dead letter queue: ${messageId}`);
    }

    return true;
  }

  /**
   * Get queue status
   */
  public getQueueStatus(name: string): Queue | null {
    return this.queues.get(name) || null;
  }

  /**
   * Get broker status
   */
  public getStatus(): BrokerStatus {
    const totalMessages = Array.from(this.queues.values())
      .reduce((sum, queue) => sum + queue.messages.length, 0);

    return {
      totalQueues: this.queues.size,
      totalMessages,
      deadLetterCount: this.deadLetterQueue.length,
      subscriptions: this.subscriptions.size,
      isProcessing: this.isProcessing
    };
  }

  /**
   * List all queues
   */
  public listQueues(): Queue[] {
    return Array.from(this.queues.values());
  }

  /**
   * Get dead letter messages
   */
  public getDeadLetterMessages(): QueueMessage[] {
    return [...this.deadLetterQueue];
  }

  private addToQueue(queueName: string, message: QueueMessage): void {
    const queue = this.queues.get(queueName);
    if (!queue) {
      // Create queue with default config
      this.createQueue(queueName);
      return this.addToQueue(queueName, message);
    }

    // Check queue size limit
    if (queue.messages.length >= queue.config.maxSize) {
      // Remove oldest message
      const oldest = queue.messages.shift();
      if (oldest) {
        this.deadLetterQueue.push(oldest);
      }
    }

    queue.messages.push(message);
    queue.lastActivity = new Date();
  }

  private startMessageProcessing(): void {
    this.isProcessing = true;
    
    setInterval(() => {
      this.processScheduledMessages();
      this.cleanupExpiredMessages();
    }, 1000); // Every second
  }

  private processScheduledMessages(): void {
    const now = new Date();
    
    for (const queue of this.queues.values()) {
      // Check for delayed messages that are ready to process
      for (const message of queue.messages) {
        if (message.delayUntil && message.delayUntil <= now) {
          message.delayUntil = undefined; // Clear delay
        }
      }
    }
  }

  private cleanupExpiredMessages(): void {
    const now = new Date();
    
    for (const queue of this.queues.values()) {
      const expiredMessages = queue.messages.filter(msg => 
        now.getTime() - msg.timestamp.getTime() > queue.config.ttl
      );

      for (const message of expiredMessages) {
        this.deadLetterQueue.push(message);
        const index = queue.messages.indexOf(message);
        queue.messages.splice(index, 1);
      }
    }
  }

  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }
}