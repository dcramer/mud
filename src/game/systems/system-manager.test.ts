import type { EntityManager } from '@/game/entities/entity-manager.js';
import type { GameEventEmitter } from '@/game/events/event-emitter.js';
import { StandardGameEventEmitter } from '@/game/events/event-emitter.js';
import type { Entity } from '@/shared/types/game.js';
import type { Logger } from '@/shared/utils/logger.js';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SystemManager } from './system-manager.js';
import type { System } from './system.js';

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

const createMockSystem = (
  name: string,
  requiredComponents: string[] = ['test'],
  priority = 0,
): System => ({
  requiredComponents,
  priority,
  update: vi.fn(),
  onSystemStart: vi.fn(),
  onSystemStop: vi.fn(),
});

describe('SystemManager', () => {
  let systemManager: SystemManager;
  let entityManager: EntityManager;
  let eventEmitter: GameEventEmitter;
  let logger: Logger;

  beforeEach(() => {
    entityManager = createMockEntityManager();
    eventEmitter = new StandardGameEventEmitter();
    logger = createMockLogger();
    systemManager = new SystemManager(entityManager, eventEmitter, logger);
  });

  describe('System Registration', () => {
    it('should register a system successfully', () => {
      const system = createMockSystem('test-system');

      const result = systemManager.registerSystem('test-system', system);

      expect(result.success).toBe(true);
      expect(systemManager.getSystem('test-system')).toBe(system);
      expect(entityManager.addSystem).toHaveBeenCalledWith(system);
      expect(logger.info).toHaveBeenCalledWith(
        'Registered system: test-system',
        expect.any(Object),
      );
    });

    it('should reject duplicate system names', () => {
      const system1 = createMockSystem('test-system');
      const system2 = createMockSystem('test-system');

      systemManager.registerSystem('test-system', system1);
      const result = systemManager.registerSystem('test-system', system2);

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_ALREADY_EXISTS');
    });

    it('should warn about systems with no required components', () => {
      const system = createMockSystem('empty-system', []);

      systemManager.registerSystem('empty-system', system);

      expect(logger.warn).toHaveBeenCalledWith("System 'empty-system' has no required components");
    });

    it('should sort systems by priority', () => {
      const system1 = createMockSystem('low-priority', ['test'], 10);
      const system2 = createMockSystem('high-priority', ['test'], 5);
      const system3 = createMockSystem('medium-priority', ['test'], 7);

      systemManager.registerSystem('low-priority', system1);
      systemManager.registerSystem('high-priority', system2);
      systemManager.registerSystem('medium-priority', system3);

      const order = systemManager.getSystemOrder();
      expect(order).toEqual(['high-priority', 'medium-priority', 'low-priority']);
    });

    it('should start system if manager is already initialized', async () => {
      await systemManager.initialize();

      const system = createMockSystem('late-system');
      systemManager.registerSystem('late-system', system);

      expect(system.onSystemStart).toHaveBeenCalled();
    });
  });

  describe('System Unregistration', () => {
    it('should unregister a system successfully', () => {
      const system = createMockSystem('test-system');
      systemManager.registerSystem('test-system', system);

      const result = systemManager.unregisterSystem('test-system');

      expect(result.success).toBe(true);
      expect(systemManager.getSystem('test-system')).toBeUndefined();
      expect(entityManager.removeSystem).toHaveBeenCalledWith(system);
    });

    it('should return error for non-existent system', () => {
      const result = systemManager.unregisterSystem('non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_NOT_FOUND');
    });

    it('should stop system if initialized before unregistering', async () => {
      const system = createMockSystem('test-system');
      systemManager.registerSystem('test-system', system);
      await systemManager.initialize();

      systemManager.unregisterSystem('test-system');

      expect(system.onSystemStop).toHaveBeenCalled();
    });
  });

  describe('Initialization', () => {
    it('should initialize all systems in priority order', async () => {
      const callOrder: string[] = [];
      const system1 = createMockSystem('system1', ['test'], 10);
      const system2 = createMockSystem('system2', ['test'], 5);

      (system1.onSystemStart as any).mockImplementation(() => {
        callOrder.push('system1');
      });
      (system2.onSystemStart as any).mockImplementation(() => {
        callOrder.push('system2');
      });

      systemManager.registerSystem('system1', system1);
      systemManager.registerSystem('system2', system2);

      const result = await systemManager.initialize();

      expect(result.success).toBe(true);
      expect(callOrder).toEqual(['system2', 'system1']); // Lower priority number = higher priority
      expect(systemManager.isInitialized()).toBe(true);
    });

    it('should reject duplicate initialization', async () => {
      await systemManager.initialize();
      const result = await systemManager.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('ALREADY_INITIALIZED');
    });

    it('should handle system startup errors', async () => {
      const system = createMockSystem('failing-system');
      (system.onSystemStart as any).mockImplementation(() => {
        throw new Error('Startup failed');
      });

      systemManager.registerSystem('failing-system', system);
      const result = await systemManager.initialize();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_INITIALIZATION_FAILED');
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('Shutdown', () => {
    it('should shutdown all systems in reverse priority order', async () => {
      const callOrder: string[] = [];
      const system1 = createMockSystem('system1', ['test'], 10);
      const system2 = createMockSystem('system2', ['test'], 5);

      (system1.onSystemStop as any).mockImplementation(() => {
        callOrder.push('system1');
      });
      (system2.onSystemStop as any).mockImplementation(() => {
        callOrder.push('system2');
      });

      systemManager.registerSystem('system1', system1);
      systemManager.registerSystem('system2', system2);
      await systemManager.initialize();

      const result = await systemManager.shutdown();

      expect(result.success).toBe(true);
      expect(callOrder).toEqual(['system1', 'system2']); // Reverse order: higher priority number first
      expect(systemManager.isInitialized()).toBe(false);
    });

    it('should reject shutdown if not initialized', async () => {
      const result = await systemManager.shutdown();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('NOT_INITIALIZED');
    });

    it('should handle system shutdown errors', async () => {
      const system = createMockSystem('failing-system');
      (system.onSystemStop as any).mockImplementation(() => {
        throw new Error('Shutdown failed');
      });

      systemManager.registerSystem('failing-system', system);
      await systemManager.initialize();

      const result = await systemManager.shutdown();

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_SHUTDOWN_FAILED');
    });
  });

  describe('System Reload', () => {
    it('should reload a system successfully', async () => {
      const system = createMockSystem('test-system');
      systemManager.registerSystem('test-system', system);
      await systemManager.initialize();

      const result = await systemManager.reloadSystem('test-system');

      expect(result.success).toBe(true);
      expect(system.onSystemStop).toHaveBeenCalled();
      expect(system.onSystemStart).toHaveBeenCalledTimes(2); // Once on init, once on reload
    });

    it('should return error for non-existent system', async () => {
      const result = await systemManager.reloadSystem('non-existent');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_NOT_FOUND');
    });

    it('should handle reload errors', async () => {
      const system = createMockSystem('failing-system');
      systemManager.registerSystem('failing-system', system);

      // Make onSystemStart fail on second call (reload)
      let callCount = 0;
      (system.onSystemStart as any).mockImplementation(() => {
        callCount++;
        if (callCount > 1) {
          throw new Error('Reload failed');
        }
      });

      await systemManager.initialize();
      const result = await systemManager.reloadSystem('failing-system');

      expect(result.success).toBe(false);
      expect(result.error?.code).toBe('SYSTEM_RELOAD_FAILED');
    });
  });

  describe('System Queries', () => {
    it('should get all systems', () => {
      const system1 = createMockSystem('system1');
      const system2 = createMockSystem('system2');

      systemManager.registerSystem('system1', system1);
      systemManager.registerSystem('system2', system2);

      const allSystems = systemManager.getAllSystems();
      expect(allSystems.size).toBe(2);
      expect(allSystems.get('system1')).toBe(system1);
      expect(allSystems.get('system2')).toBe(system2);
    });

    it('should get statistics', () => {
      const system1 = createMockSystem('system1', ['component1'], 10);
      const system2 = createMockSystem('system2', ['component2', 'component3'], 5);

      systemManager.registerSystem('system1', system1);
      systemManager.registerSystem('system2', system2);

      const stats = systemManager.getStatistics();

      expect(stats.totalSystems).toBe(2);
      expect(stats.initialized).toBe(false);
      expect(stats.systemDetails).toEqual([
        {
          name: 'system2',
          priority: 5,
          requiredComponents: ['component2', 'component3'],
        },
        {
          name: 'system1',
          priority: 10,
          requiredComponents: ['component1'],
        },
      ]);
    });
  });
});
