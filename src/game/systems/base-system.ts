import type { EntityManager } from '@/game/entities/entity-manager.js';
import type { GameEventEmitter } from '@/game/events/event-emitter.js';
import type { GameResult } from '@/shared/types/core.js';
import { GameError, GameErrorCode } from '@/shared/types/core.js';
import type { Entity } from '@/shared/types/game.js';
import type { Logger } from '@/shared/utils/logger.js';
import { failure, success } from '@/shared/utils/result.js';
import type { System } from './system.js';

/**
 * Base System class following ECS best practices
 * Provides common functionality for all game systems
 */
export abstract class BaseSystem implements System {
  abstract readonly requiredComponents: readonly string[];
  readonly priority: number = 0;

  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly eventEmitter: GameEventEmitter,
    protected readonly logger: Logger,
  ) {}

  abstract update(entities: readonly Entity[], deltaTime: number): void;

  onSystemStart?(): void;
  onSystemStop?(): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entity: Entity): void;

  /**
   * Type-safe component retrieval
   */
  protected getComponent<T extends { type: string }>(
    entity: Entity,
    componentType: string,
  ): T | undefined {
    return entity.components.get(componentType) as T | undefined;
  }

  /**
   * Get required component or throw error
   */
  protected getRequiredComponent<T extends { type: string }>(
    entity: Entity,
    componentType: string,
  ): T {
    const component = this.getComponent<T>(entity, componentType);
    if (!component) {
      throw this.createComponentError(entity.id, componentType);
    }
    return component;
  }

  /**
   * Check if entity has all required components
   */
  protected hasRequiredComponents(entity: Entity): boolean {
    return this.requiredComponents.every((componentType) => entity.components.has(componentType));
  }

  /**
   * Handle errors consistently
   */
  protected handleError(error: unknown, context: string): GameError {
    if (this.isGameError(error)) {
      return error;
    }

    const message = error instanceof Error ? error.message : String(error);
    this.logger.error(`System error in ${context}:`, { error, system: this.constructor.name });

    return new GameError(`System error: ${message}`, GameErrorCode.SYSTEM_ERROR, {
      context,
      system: this.constructor.name,
    });
  }

  /**
   * Type guard for GameError
   */
  protected isGameError(error: unknown): error is GameError {
    return (
      typeof error === 'object' &&
      error !== null &&
      'message' in error &&
      'code' in error &&
      typeof (error as any).message === 'string' &&
      typeof (error as any).code === 'string'
    );
  }

  /**
   * Create component missing error
   */
  protected createComponentError(entityId: string, componentType: string): GameError {
    return new GameError(
      `Entity ${entityId} missing component: ${componentType}`,
      GameErrorCode.COMPONENT_MISSING,
      { entityId, componentType },
    );
  }

  /**
   * Execute async operation with error handling
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    context: string,
  ): Promise<GameResult<T>> {
    try {
      const result = await operation();
      return success(result);
    } catch (error) {
      return failure(this.handleError(error, context));
    }
  }

  /**
   * Execute sync operation with error handling
   */
  protected safeExecuteSync<T>(operation: () => T, context: string): GameResult<T> {
    try {
      const result = operation();
      return success(result);
    } catch (error) {
      return failure(this.handleError(error, context));
    }
  }

  /**
   * Emit typed event
   */
  protected emitEvent<T>(eventType: string, data: T): void {
    this.eventEmitter.emit(eventType, {
      type: eventType,
      data,
      timestamp: Date.now(),
      source: this.constructor.name,
    });
  }

  /**
   * Subscribe to event
   */
  protected onEvent<T>(eventType: string, handler: (data: T) => void | Promise<void>): void {
    this.eventEmitter.on(eventType, async (event) => {
      try {
        await handler(event.data as T);
      } catch (error) {
        this.logger.error(`Error handling event ${eventType}:`, {
          error,
          system: this.constructor.name,
        });
      }
    });
  }

  /**
   * Log debug message with system context
   */
  protected debug(message: string, context?: Record<string, unknown>): void {
    this.logger.debug(message, {
      system: this.constructor.name,
      ...context,
    });
  }

  /**
   * Log info message with system context
   */
  protected info(message: string, context?: Record<string, unknown>): void {
    this.logger.info(message, {
      system: this.constructor.name,
      ...context,
    });
  }

  /**
   * Log warning with system context
   */
  protected warn(message: string, context?: Record<string, unknown>): void {
    this.logger.warn(message, {
      system: this.constructor.name,
      ...context,
    });
  }
}
