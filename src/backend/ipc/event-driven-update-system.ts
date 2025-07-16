// src/backend/ipc/event-driven-update-system.ts

import { BrowserWindow } from 'electron';
import { EventEmitter } from 'events';
import { Playlist, Song } from '../models';
import { StructuredLoggerService } from '../services/structured-logger-service';

// Event Types
export type PlaylistEventType =
  | 'playlist:created'
  | 'playlist:updated'
  | 'playlist:deleted'
  | 'playlist:duplicated'
  | 'song:created'
  | 'song:updated'
  | 'song:deleted'
  | 'song:added-to-playlist'
  | 'song:removed-from-playlist'
  | 'song:reordered-in-playlist'
  | 'import:started'
  | 'import:progress'
  | 'import:completed'
  | 'import:failed'
  | 'import:cancelled';

export interface PlaylistEvent {
  type: PlaylistEventType;
  timestamp: Date;
  userId?: string;
  sessionId?: string;
  data: any;
  metadata?: {
    source: string;
    version: number;
    correlationId?: string;
  };
}

export interface EventBatch {
  id: string;
  events: PlaylistEvent[];
  timestamp: Date;
  size: number;
}

export interface EventSubscription {
  id: string;
  eventTypes: PlaylistEventType[];
  callback: (event: PlaylistEvent) => void;
  filter?: (event: PlaylistEvent) => boolean;
  userId?: string;
  sessionId?: string;
  active: boolean;
}

export interface EventPersistenceOptions {
  enabled: boolean;
  maxEvents: number;
  retentionDays: number;
  batchSize: number;
  flushInterval: number; // milliseconds
}

export interface EventBatchingOptions {
  enabled: boolean;
  maxBatchSize: number;
  maxWaitTime: number; // milliseconds
  groupByType: boolean;
  groupByUser: boolean;
}

export class EventDrivenUpdateSystem extends EventEmitter {
  private logger: StructuredLoggerService;
  private mainWindow: BrowserWindow | null = null;
  private subscriptions: Map<string, EventSubscription> = new Map();
  private eventHistory: PlaylistEvent[] = [];
  private pendingBatches: Map<string, PlaylistEvent[]> = new Map();
  private batchTimers: Map<string, NodeJS.Timeout> = new Map();
  private persistenceBuffer: PlaylistEvent[] = [];
  private flushTimer: NodeJS.Timeout | null = null;

  private persistenceOptions: EventPersistenceOptions = {
    enabled: true,
    maxEvents: 10000,
    retentionDays: 30,
    batchSize: 100,
    flushInterval: 5000, // 5 seconds
  };

  private batchingOptions: EventBatchingOptions = {
    enabled: true,
    maxBatchSize: 50,
    maxWaitTime: 1000, // 1 second
    groupByType: true,
    groupByUser: false,
  };

  constructor(logger?: StructuredLoggerService) {
    super();
    this.logger = logger || new StructuredLoggerService();
    this.setupInternalEventHandlers();
    this.startPeriodicCleanup();
  }

  /**
   * Set main window for real-time updates
   */
  setMainWindow(window: BrowserWindow): void {
    this.mainWindow = window;
    this.logger.info('Main window set for event-driven updates');
  }

  /**
   * Configure event persistence options
   */
  configurePersistence(options: Partial<EventPersistenceOptions>): void {
    this.persistenceOptions = { ...this.persistenceOptions, ...options };

    if (this.persistenceOptions.enabled && !this.flushTimer) {
      this.startPersistenceTimer();
    } else if (!this.persistenceOptions.enabled && this.flushTimer) {
      this.stopPersistenceTimer();
    }

    this.logger.info('Event persistence configured', {
      options: this.persistenceOptions,
    });
  }

  /**
   * Configure event batching options
   */
  configureBatching(options: Partial<EventBatchingOptions>): void {
    this.batchingOptions = { ...this.batchingOptions, ...options };
    this.logger.info('Event batching configured', {
      options: this.batchingOptions,
    });
  }

  // Event Publishing

  /**
   * Publish playlist event
   */
  publishEvent(
    type: PlaylistEventType,
    data: any,
    userId?: string,
    sessionId?: string,
    metadata?: any,
  ): void {
    const event: PlaylistEvent = {
      type,
      timestamp: new Date(),
      userId,
      sessionId,
      data,
      metadata: {
        source: 'playlist-service',
        version: 1,
        correlationId: this.generateCorrelationId(),
        ...metadata,
      },
    };

    this.processEvent(event);
  }

  /**
   * Publish playlist created event
   */
  publishPlaylistCreated(
    playlist: Playlist,
    userId?: string,
    sessionId?: string,
  ): void {
    this.publishEvent('playlist:created', { playlist }, userId, sessionId);
  }

  /**
   * Publish playlist updated event
   */
  publishPlaylistUpdated(
    playlist: Playlist,
    changes: any,
    userId?: string,
    sessionId?: string,
  ): void {
    this.publishEvent(
      'playlist:updated',
      { playlist, changes },
      userId,
      sessionId,
    );
  }

  /**
   * Publish playlist deleted event
   */
  publishPlaylistDeleted(
    playlistId: string,
    userId?: string,
    sessionId?: string,
  ): void {
    this.publishEvent('playlist:deleted', { playlistId }, userId, sessionId);
  }

  /**
   * Publish song added to playlist event
   */
  publishSongAddedToPlaylist(
    playlistId: string,
    song: Song,
    position: number,
    userId?: string,
    sessionId?: string,
  ): void {
    this.publishEvent(
      'song:added-to-playlist',
      {
        playlistId,
        song,
        position,
      },
      userId,
      sessionId,
    );
  }

  /**
   * Publish song removed from playlist event
   */
  publishSongRemovedFromPlaylist(
    playlistId: string,
    songId: string,
    userId?: string,
    sessionId?: string,
  ): void {
    this.publishEvent(
      'song:removed-from-playlist',
      {
        playlistId,
        songId,
      },
      userId,
      sessionId,
    );
  }

  /**
   * Publish import progress event
   */
  publishImportProgress(
    jobId: string,
    progress: any,
    userId?: string,
    sessionId?: string,
  ): void {
    this.publishEvent(
      'import:progress',
      {
        jobId,
        progress,
      },
      userId,
      sessionId,
    );
  }

  // Event Subscription

  /**
   * Subscribe to events
   */
  subscribe(
    eventTypes: PlaylistEventType[],
    callback: (event: PlaylistEvent) => void,
    options: {
      filter?: (event: PlaylistEvent) => boolean;
      userId?: string;
      sessionId?: string;
    } = {},
  ): string {
    const subscriptionId = this.generateSubscriptionId();

    const subscription: EventSubscription = {
      id: subscriptionId,
      eventTypes,
      callback,
      filter: options.filter,
      userId: options.userId,
      sessionId: options.sessionId,
      active: true,
    };

    this.subscriptions.set(subscriptionId, subscription);

    this.logger.debug('Event subscription created', {
      subscriptionId,
      eventTypes,
      userId: options.userId,
    });

    return subscriptionId;
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(subscriptionId: string): boolean {
    const subscription = this.subscriptions.get(subscriptionId);
    if (subscription) {
      subscription.active = false;
      this.subscriptions.delete(subscriptionId);

      this.logger.debug('Event subscription removed', { subscriptionId });
      return true;
    }
    return false;
  }

  /**
   * Subscribe to frontend updates (IPC)
   */
  subscribeToFrontendUpdates(): string {
    return this.subscribe(
      [
        'playlist:created',
        'playlist:updated',
        'playlist:deleted',
        'song:added-to-playlist',
        'song:removed-from-playlist',
        'song:reordered-in-playlist',
        'import:progress',
        'import:completed',
        'import:failed',
      ],
      event => this.sendToFrontend(event),
      { filter: event => this.shouldSendToFrontend(event) },
    );
  }

  // Event Processing

  /**
   * Process individual event
   */
  private processEvent(event: PlaylistEvent): void {
    try {
      // Add to history
      this.addToHistory(event);

      // Add to persistence buffer
      if (this.persistenceOptions.enabled) {
        this.addToPersistenceBuffer(event);
      }

      // Process through batching or direct delivery
      if (this.batchingOptions.enabled) {
        this.addToBatch(event);
      } else {
        this.deliverEvent(event);
      }

      // Emit internal event
      this.emit('event-processed', event);
    } catch (error) {
      this.logger.error(
        'Failed to process event',
        error instanceof Error ? error : new Error(String(error)),
        {
          event: this.sanitizeEvent(event),
        },
      );
    }
  }

  /**
   * Deliver event to subscribers
   */
  private deliverEvent(event: PlaylistEvent): void {
    const matchingSubscriptions = Array.from(
      this.subscriptions.values(),
    ).filter(sub => sub.active && this.eventMatches(event, sub));

    for (const subscription of matchingSubscriptions) {
      try {
        subscription.callback(event);
      } catch (error) {
        this.logger.error(
          'Event delivery failed',
          error instanceof Error ? error : new Error(String(error)),
          {
            subscriptionId: subscription.id,
            eventType: event.type,
          },
        );
      }
    }

    this.logger.debug('Event delivered', {
      eventType: event.type,
      subscriberCount: matchingSubscriptions.length,
      timestamp: event.timestamp,
    });
  }

  /**
   * Check if event matches subscription
   */
  private eventMatches(
    event: PlaylistEvent,
    subscription: EventSubscription,
  ): boolean {
    // Check event type
    if (!subscription.eventTypes.includes(event.type)) {
      return false;
    }

    // Check user filter
    if (subscription.userId && event.userId !== subscription.userId) {
      return false;
    }

    // Check session filter
    if (subscription.sessionId && event.sessionId !== subscription.sessionId) {
      return false;
    }

    // Check custom filter
    if (subscription.filter && !subscription.filter(event)) {
      return false;
    }

    return true;
  }

  // Event Batching

  /**
   * Add event to batch
   */
  private addToBatch(event: PlaylistEvent): void {
    const batchKey = this.getBatchKey(event);

    if (!this.pendingBatches.has(batchKey)) {
      this.pendingBatches.set(batchKey, []);
    }

    const batch = this.pendingBatches.get(batchKey)!;
    batch.push(event);

    // Check if batch should be flushed
    if (batch.length >= this.batchingOptions.maxBatchSize) {
      this.flushBatch(batchKey);
    } else if (!this.batchTimers.has(batchKey)) {
      // Set timer for batch flush
      const timer = setTimeout(() => {
        this.flushBatch(batchKey);
      }, this.batchingOptions.maxWaitTime);

      this.batchTimers.set(batchKey, timer);
    }
  }

  /**
   * Get batch key for event grouping
   */
  private getBatchKey(event: PlaylistEvent): string {
    const parts: string[] = [];

    if (this.batchingOptions.groupByType) {
      parts.push(event.type);
    }

    if (this.batchingOptions.groupByUser && event.userId) {
      parts.push(event.userId);
    }

    return parts.length > 0 ? parts.join(':') : 'default';
  }

  /**
   * Flush batch of events
   */
  private flushBatch(batchKey: string): void {
    const events = this.pendingBatches.get(batchKey);
    if (!events || events.length === 0) {
      return;
    }

    // Clear timer
    const timer = this.batchTimers.get(batchKey);
    if (timer) {
      clearTimeout(timer);
      this.batchTimers.delete(batchKey);
    }

    // Create batch
    const batch: EventBatch = {
      id: this.generateBatchId(),
      events: [...events],
      timestamp: new Date(),
      size: events.length,
    };

    // Clear pending batch
    this.pendingBatches.set(batchKey, []);

    // Deliver batch
    this.deliverBatch(batch);

    this.logger.debug('Event batch flushed', {
      batchKey,
      batchId: batch.id,
      eventCount: batch.size,
    });
  }

  /**
   * Deliver batch to subscribers
   */
  private deliverBatch(batch: EventBatch): void {
    // Deliver individual events in batch
    for (const event of batch.events) {
      this.deliverEvent(event);
    }

    // Emit batch event
    this.emit('batch-delivered', batch);
  }

  // Event Persistence

  /**
   * Add event to persistence buffer
   */
  private addToPersistenceBuffer(event: PlaylistEvent): void {
    this.persistenceBuffer.push(event);

    if (this.persistenceBuffer.length >= this.persistenceOptions.batchSize) {
      this.flushPersistenceBuffer();
    }
  }

  /**
   * Flush persistence buffer
   */
  private flushPersistenceBuffer(): void {
    if (this.persistenceBuffer.length === 0) {
      return;
    }

    const events = [...this.persistenceBuffer];
    this.persistenceBuffer = [];

    // In a real implementation, you would persist to database or file
    this.persistEvents(events);

    this.logger.debug('Persistence buffer flushed', {
      eventCount: events.length,
    });
  }

  /**
   * Persist events (placeholder implementation)
   */
  private persistEvents(events: PlaylistEvent[]): void {
    // In a real implementation, this would save to database or file system
    this.logger.debug('Events persisted', {
      eventCount: events.length,
      firstEvent: events[0]?.type,
      lastEvent: events[events.length - 1]?.type,
    });
  }

  /**
   * Start persistence timer
   */
  private startPersistenceTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      this.flushPersistenceBuffer();
    }, this.persistenceOptions.flushInterval);
  }

  /**
   * Stop persistence timer
   */
  private stopPersistenceTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
  }

  // Event History

  /**
   * Add event to history
   */
  private addToHistory(event: PlaylistEvent): void {
    this.eventHistory.push(event);

    // Trim history if it exceeds max size
    if (this.eventHistory.length > this.persistenceOptions.maxEvents) {
      this.eventHistory = this.eventHistory.slice(
        -this.persistenceOptions.maxEvents,
      );
    }
  }

  /**
   * Get event history
   */
  getEventHistory(filter?: {
    eventTypes?: PlaylistEventType[];
    userId?: string;
    sessionId?: string;
    since?: Date;
    limit?: number;
  }): PlaylistEvent[] {
    let events = [...this.eventHistory];

    if (filter) {
      if (filter.eventTypes) {
        events = events.filter(e => filter.eventTypes!.includes(e.type));
      }

      if (filter.userId) {
        events = events.filter(e => e.userId === filter.userId);
      }

      if (filter.sessionId) {
        events = events.filter(e => e.sessionId === filter.sessionId);
      }

      if (filter.since) {
        events = events.filter(e => e.timestamp >= filter.since!);
      }

      if (filter.limit) {
        events = events.slice(-filter.limit);
      }
    }

    return events;
  }

  // Frontend Communication

  /**
   * Send event to frontend via IPC
   */
  private sendToFrontend(event: PlaylistEvent): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      this.mainWindow.webContents.send('playlist-event', {
        type: event.type,
        data: event.data,
        timestamp: event.timestamp.toISOString(),
        userId: event.userId,
        sessionId: event.sessionId,
        metadata: event.metadata,
      });
    }
  }

  /**
   * Check if event should be sent to frontend
   */
  private shouldSendToFrontend(event: PlaylistEvent): boolean {
    // Filter out high-frequency events that might flood the UI
    const highFrequencyEvents: PlaylistEventType[] = ['import:progress'];

    if (highFrequencyEvents.includes(event.type)) {
      // Only send every 10th progress event to avoid UI flooding
      return Math.random() < 0.1;
    }

    return true;
  }

  // Utility Methods

  /**
   * Setup internal event handlers
   */
  private setupInternalEventHandlers(): void {
    this.on('event-processed', (event: PlaylistEvent) => {
      // Could add metrics collection here
    });

    this.on('batch-delivered', (batch: EventBatch) => {
      // Could add batch metrics here
    });
  }

  /**
   * Start periodic cleanup
   */
  private startPeriodicCleanup(): void {
    // Clean up old events every hour
    setInterval(
      () => {
        this.cleanupOldEvents();
        this.cleanupInactiveSubscriptions();
      },
      60 * 60 * 1000,
    ); // 1 hour
  }

  /**
   * Clean up old events
   */
  private cleanupOldEvents(): void {
    const cutoffDate = new Date(
      Date.now() - this.persistenceOptions.retentionDays * 24 * 60 * 60 * 1000,
    );

    const originalLength = this.eventHistory.length;
    this.eventHistory = this.eventHistory.filter(
      event => event.timestamp >= cutoffDate,
    );

    const cleanedCount = originalLength - this.eventHistory.length;
    if (cleanedCount > 0) {
      this.logger.info('Old events cleaned up', {
        cleanedCount,
        remainingCount: this.eventHistory.length,
        cutoffDate,
      });
    }
  }

  /**
   * Clean up inactive subscriptions
   */
  private cleanupInactiveSubscriptions(): void {
    const inactiveSubscriptions = Array.from(
      this.subscriptions.entries(),
    ).filter(([_, sub]) => !sub.active);

    for (const [id, _] of inactiveSubscriptions) {
      this.subscriptions.delete(id);
    }

    if (inactiveSubscriptions.length > 0) {
      this.logger.info('Inactive subscriptions cleaned up', {
        cleanedCount: inactiveSubscriptions.length,
        activeCount: this.subscriptions.size,
      });
    }
  }

  /**
   * Generate correlation ID
   */
  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate subscription ID
   */
  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate batch ID
   */
  private generateBatchId(): string {
    return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sanitize event for logging
   */
  private sanitizeEvent(event: PlaylistEvent): any {
    return {
      type: event.type,
      timestamp: event.timestamp,
      userId: event.userId,
      sessionId: event.sessionId,
      dataKeys: event.data ? Object.keys(event.data) : [],
      metadata: event.metadata,
    };
  }

  /**
   * Get system statistics
   */
  getStats(): {
    eventHistory: number;
    activeSubscriptions: number;
    pendingBatches: number;
    persistenceBufferSize: number;
    uptime: number;
  } {
    return {
      eventHistory: this.eventHistory.length,
      activeSubscriptions: this.subscriptions.size,
      pendingBatches: this.pendingBatches.size,
      persistenceBufferSize: this.persistenceBuffer.length,
      uptime: process.uptime(),
    };
  }

  /**
   * Shutdown and cleanup
   */
  shutdown(): void {
    // Flush any pending batches
    for (const batchKey of this.pendingBatches.keys()) {
      this.flushBatch(batchKey);
    }

    // Flush persistence buffer
    this.flushPersistenceBuffer();

    // Clear timers
    for (const timer of this.batchTimers.values()) {
      clearTimeout(timer);
    }
    this.batchTimers.clear();

    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }

    // Clear subscriptions
    this.subscriptions.clear();

    this.logger.info('Event-driven update system shutdown completed');
  }
}
