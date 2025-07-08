import type { EntityManager } from '@/game/entities/entity-manager.js';
import type { GameEventEmitter } from '@/game/events/event-emitter.js';
import { StandardGameEventEmitter } from '@/game/events/event-emitter.js';
import type { Entity, EntityId } from '@/shared/types/game.js';
import type { Logger } from '@/shared/utils/logger.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BaseSystem } from './base-system.js';

// Mock implementations
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

const createMockEntityManager = (): EntityManager =>
  ({
    addEntity: vi.fn(),
    removeEntity: vi.fn(),
    getEntity: vi.fn(),
    getAllEntities: vi.fn(),
    getEntitiesWithComponent: vi.fn(),
    queryEntities: vi.fn(),
    addSystem: vi.fn(),
    removeSystem: vi.fn(),
    getSystems: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
    isRunning: vi.fn(),
  }) as any;

const createMockEntity = (id: string, components: Map<string, any> = new Map()): Entity => ({
  id: id as EntityId,
  components,
});

// Test implementation of BaseSystem
class TestSystem extends BaseSystem {
  readonly requiredComponents = ['test-component'] as const;
  readonly priority = 10;

  update(entities: readonly Entity[], deltaTime: number): void {
    // Test implementation
  }

  onSystemStart(): void {
    this.debug('System started');
  }
}

describe('BaseSystem', () => {
  let entityManager: EntityManager;
  let eventEmitter: GameEventEmitter;
  let logger: Logger;
  let system: TestSystem;

  beforeEach(() => {
    entityManager = createMockEntityManager();
    eventEmitter = new StandardGameEventEmitter();
    logger = createMockLogger();
    system = new TestSystem(entityManager, eventEmitter, logger);
  });

  describe('Component Management', () => {
    it('should get component from entity', () => {
      const testComponent = { type: 'test-component', value: 42 };
      const entity = createMockEntity('test-1', new Map([['test-component', testComponent]]));

      const component = system['getComponent'](entity, 'test-component');
      expect(component).toBe(testComponent);
    });

    it('should return undefined for missing component', () => {
      const entity = createMockEntity('test-1');
      const component = system['getComponent'](entity, 'missing-component');
      expect(component).toBeUndefined();
    });

    it('should get required component or throw', () => {
      const testComponent = { type: 'test-component', value: 42 };
      const entity = createMockEntity('test-1', new Map([['test-component', testComponent]]));

      const component = system['getRequiredComponent'](entity, 'test-component');
      expect(component).toBe(testComponent);
    });

    it('should throw error for missing required component', () => {
      const entity = createMockEntity('test-1');

      expect(() => system['getRequiredComponent'](entity, 'missing-component')).toThrow();
    });

    it('should check if entity has required components', () => {
      const entity1 = createMockEntity(
        'test-1',
        new Map([['test-component', { type: 'test-component' }]]),
      );
      const entity2 = createMockEntity('test-2');

      expect(system['hasRequiredComponents'](entity1)).toBe(true);
      expect(system['hasRequiredComponents'](entity2)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle GameError properly', () => {
      const gameError = {
        message: 'Test error',
        code: 'TEST_ERROR',
        context: { test: true },
      };

      const result = system['handleError'](gameError, 'test-context');
      expect(result).toBe(gameError);
    });

    it('should handle regular Error', () => {
      const error = new Error('Regular error');
      const result = system['handleError'](error, 'test-context');

      expect(result.message).toBe('System error: Regular error');
      expect(result.code).toBe('SYSTEM_ERROR');
      expect(result.context).toEqual({
        context: 'test-context',
        system: 'TestSystem',
      });
      expect(logger.error).toHaveBeenCalled();
    });

    it('should handle unknown error types', () => {
      const result = system['handleError']('String error', 'test-context');

      expect(result.message).toBe('System error: String error');
      expect(result.code).toBe('SYSTEM_ERROR');
    });

    it('should identify GameError correctly', () => {
      const gameError = { message: 'Test', code: 'TEST_ERROR' };
      const notGameError = { message: 'Test' };
      const alsoNotGameError = { code: 'TEST_ERROR' };

      expect(system['isGameError'](gameError)).toBe(true);
      expect(system['isGameError'](notGameError)).toBe(false);
      expect(system['isGameError'](alsoNotGameError)).toBe(false);
      expect(system['isGameError'](null)).toBe(false);
      expect(system['isGameError'](undefined)).toBe(false);
    });
  });

  describe('Safe Execution', () => {
    it('should execute async operation successfully', async () => {
      const operation = async () => 'success';
      const result = await system['safeExecute'](operation, 'test-context');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('should handle async operation failure', async () => {
      const operation = async () => {
        throw new Error('Async error');
      };
      const result = await system['safeExecute'](operation, 'test-context');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('System error: Async error');
    });

    it('should execute sync operation successfully', () => {
      const operation = () => 'success';
      const result = system['safeExecuteSync'](operation, 'test-context');

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
    });

    it('should handle sync operation failure', () => {
      const operation = () => {
        throw new Error('Sync error');
      };
      const result = system['safeExecuteSync'](operation, 'test-context');

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe('System error: Sync error');
    });
  });

  describe('Event Handling', () => {
    it('should emit events with proper structure', () => {
      const listener = vi.fn();
      eventEmitter.on('test:event', listener);

      system['emitEvent']('test:event', { value: 42 });

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'test:event',
          data: { value: 42 },
          timestamp: expect.any(Number),
          source: 'TestSystem',
        }),
      );
    });

    it('should subscribe to events', async () => {
      const handler = vi.fn();
      system['onEvent']('test:event', handler);

      eventEmitter.emit('test:event', {
        type: 'test:event',
        data: { value: 42 },
        timestamp: Date.now(),
      });

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(handler).toHaveBeenCalledWith({ value: 42 });
    });

    it('should handle event handler errors', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Handler error'));
      system['onEvent']('test:event', handler);

      eventEmitter.emit('test:event', {
        type: 'test:event',
        data: { value: 42 },
        timestamp: Date.now(),
      });

      // Wait for async handler
      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(logger.error).toHaveBeenCalledWith(
        'Error handling event test:event:',
        expect.objectContaining({
          error: expect.any(Error),
          system: 'TestSystem',
        }),
      );
    });
  });

  describe('Logging', () => {
    it('should log debug messages with context', () => {
      system['debug']('Debug message', { extra: 'data' });

      expect(logger.debug).toHaveBeenCalledWith('Debug message', {
        system: 'TestSystem',
        extra: 'data',
      });
    });

    it('should log info messages with context', () => {
      system['info']('Info message');

      expect(logger.info).toHaveBeenCalledWith('Info message', {
        system: 'TestSystem',
      });
    });

    it('should log warnings with context', () => {
      system['warn']('Warning message', { warning: true });

      expect(logger.warn).toHaveBeenCalledWith('Warning message', {
        system: 'TestSystem',
        warning: true,
      });
    });
  });

  describe('System Lifecycle', () => {
    it('should call onSystemStart if defined', () => {
      const startSpy = vi.spyOn(system, 'onSystemStart');
      system.onSystemStart?.();

      expect(startSpy).toHaveBeenCalled();
      expect(logger.debug).toHaveBeenCalledWith('System started', {
        system: 'TestSystem',
      });
    });
  });
});
