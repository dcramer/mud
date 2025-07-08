import { EventEmitter } from 'node:events';

/**
 * Game event structure
 */
export interface GameEvent<T = unknown> {
  type: string;
  data: T;
  timestamp: number;
  source?: string;
  id?: string;
}

/**
 * Type-safe game event emitter interface
 */
export interface GameEventEmitter {
  emit<T>(eventType: string, event: GameEvent<T>): boolean;
  on<T>(eventType: string, listener: (event: GameEvent<T>) => void): this;
  off<T>(eventType: string, listener: (event: GameEvent<T>) => void): this;
  once<T>(eventType: string, listener: (event: GameEvent<T>) => void): this;
}

/**
 * Standard game event emitter implementation
 */
export class StandardGameEventEmitter extends EventEmitter implements GameEventEmitter {
  private eventHistory: GameEvent[] = [];
  private readonly maxHistorySize = 10000;

  emit<T>(eventType: string, event: GameEvent<T>): boolean {
    // Add unique ID if not provided
    if (!event.id) {
      event.id = this.generateEventId();
    }

    // Store for debugging/replay
    this.eventHistory.push(event);

    // Trim history to prevent memory leaks
    if (this.eventHistory.length > this.maxHistorySize) {
      this.eventHistory.shift();
    }

    return super.emit(eventType, event);
  }

  on<T>(eventType: string, listener: (event: GameEvent<T>) => void): this {
    super.on(eventType, listener);
    return this;
  }

  off<T>(eventType: string, listener: (event: GameEvent<T>) => void): this {
    super.off(eventType, listener);
    return this;
  }

  once<T>(eventType: string, listener: (event: GameEvent<T>) => void): this {
    super.once(eventType, listener);
    return this;
  }

  /**
   * Get event history for debugging
   */
  getEventHistory(limit?: number): GameEvent[] {
    if (limit) {
      return this.eventHistory.slice(-limit);
    }
    return [...this.eventHistory];
  }

  /**
   * Clear event history
   */
  clearEventHistory(): void {
    this.eventHistory = [];
  }

  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
