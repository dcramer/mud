import type { System } from '@/game/systems/system.js';
import type { Entity, EntityId, EntityQuery } from '@/shared/types/game.js';
import type { Logger } from '@/shared/utils/logger.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { EntityManager } from './entity-manager.js';

// Mock logger
const createMockLogger = (): Logger => ({
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
});

// Mock entity factory
const createMockEntity = (id: string, componentTypes: string[] = []): Entity => {
  const components = new Map();
  componentTypes.forEach((type) => {
    components.set(type, { type });
  });

  return {
    id: id as EntityId,
    components,
  };
};

// Mock system factory
const createMockSystem = (requiredComponents: string[] = [], priority = 0): System => ({
  requiredComponents,
  priority,
  update: vi.fn(),
  onSystemStart: vi.fn(),
  onSystemStop: vi.fn(),
  onEntityAdded: vi.fn(),
  onEntityRemoved: vi.fn(),
});

describe('EntityManager', () => {
  let entityManager: EntityManager;
  let logger: Logger;

  beforeEach(() => {
    logger = createMockLogger();
    entityManager = new EntityManager(logger);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Entity Management', () => {
    it('should add entities', () => {
      const entity = createMockEntity('test-1', ['location', 'combat']);

      entityManager.addEntity(entity);

      expect(entityManager.getEntity(entity.id)).toBe(entity);
      expect(logger.debug).toHaveBeenCalledWith('Added entity test-1');
    });

    it('should remove entities', () => {
      const entity = createMockEntity('test-1');
      entityManager.addEntity(entity);

      const result = entityManager.removeEntity(entity.id);

      expect(result).toBe(true);
      expect(entityManager.getEntity(entity.id)).toBeUndefined();
      expect(logger.debug).toHaveBeenCalledWith('Removed entity test-1');
    });

    it('should return false when removing non-existent entity', () => {
      const result = entityManager.removeEntity('non-existent' as EntityId);

      expect(result).toBe(false);
    });

    it('should get all entities', () => {
      const entity1 = createMockEntity('test-1');
      const entity2 = createMockEntity('test-2');

      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);

      const entities = entityManager.getAllEntities();
      expect(entities).toHaveLength(2);
      expect(entities).toContain(entity1);
      expect(entities).toContain(entity2);
    });

    it('should emit events when entities are added/removed', () => {
      const entity = createMockEntity('test-1');
      const addedListener = vi.fn();
      const removedListener = vi.fn();

      entityManager.on('entity:added', addedListener);
      entityManager.on('entity:removed', removedListener);

      entityManager.addEntity(entity);
      expect(addedListener).toHaveBeenCalledWith(entity);

      entityManager.removeEntity(entity.id);
      expect(removedListener).toHaveBeenCalledWith(entity);
    });
  });

  describe('Component Indexing', () => {
    it('should index entities by component type', () => {
      const entity1 = createMockEntity('test-1', ['location', 'combat']);
      const entity2 = createMockEntity('test-2', ['location']);
      const entity3 = createMockEntity('test-3', ['combat']);

      entityManager.addEntity(entity1);
      entityManager.addEntity(entity2);
      entityManager.addEntity(entity3);

      const locationEntities = entityManager.getEntitiesWithComponent('location');
      expect(locationEntities).toHaveLength(2);
      expect(locationEntities).toContain(entity1);
      expect(locationEntities).toContain(entity2);

      const combatEntities = entityManager.getEntitiesWithComponent('combat');
      expect(combatEntities).toHaveLength(2);
      expect(combatEntities).toContain(entity1);
      expect(combatEntities).toContain(entity3);
    });

    it('should update index when entities are removed', () => {
      const entity = createMockEntity('test-1', ['location']);

      entityManager.addEntity(entity);
      expect(entityManager.getEntitiesWithComponent('location')).toHaveLength(1);

      entityManager.removeEntity(entity.id);
      expect(entityManager.getEntitiesWithComponent('location')).toHaveLength(0);
    });

    it('should return empty array for non-existent component types', () => {
      const entities = entityManager.getEntitiesWithComponent('non-existent');
      expect(entities).toEqual([]);
    });
  });

  describe('Entity Queries', () => {
    beforeEach(() => {
      // Add test entities with various component combinations
      entityManager.addEntity(createMockEntity('e1', ['location', 'combat', 'inventory']));
      entityManager.addEntity(createMockEntity('e2', ['location', 'combat']));
      entityManager.addEntity(createMockEntity('e3', ['location', 'inventory']));
      entityManager.addEntity(createMockEntity('e4', ['combat', 'inventory']));
      entityManager.addEntity(createMockEntity('e5', ['location']));
    });

    it('should query entities with required components', () => {
      const query: EntityQuery = {
        with: ['location', 'combat'],
      };

      const results = entityManager.queryEntities(query);
      expect(results).toHaveLength(2);
      expect(results.map((e) => e.id)).toContain('e1' as EntityId);
      expect(results.map((e) => e.id)).toContain('e2' as EntityId);
    });

    it('should query entities excluding components', () => {
      const query: EntityQuery = {
        with: ['location'],
        without: ['combat'],
      };

      const results = entityManager.queryEntities(query);
      expect(results).toHaveLength(2);
      expect(results.map((e) => e.id)).toContain('e3' as EntityId);
      expect(results.map((e) => e.id)).toContain('e5' as EntityId);
    });

    it('should query entities with any of specified components', () => {
      const query: EntityQuery = {
        with: ['location'],
        any: ['combat', 'inventory'],
      };

      const results = entityManager.queryEntities(query);
      expect(results).toHaveLength(3);
      expect(results.map((e) => e.id)).toContain('e1' as EntityId);
      expect(results.map((e) => e.id)).toContain('e2' as EntityId);
      expect(results.map((e) => e.id)).toContain('e3' as EntityId);
    });
  });

  describe('System Management', () => {
    it('should add systems and sort by priority', () => {
      const system1 = createMockSystem(['location'], 10);
      const system2 = createMockSystem(['combat'], 5);
      const system3 = createMockSystem(['inventory'], 15);

      entityManager.addSystem(system1);
      entityManager.addSystem(system2);
      entityManager.addSystem(system3);

      const systems = entityManager.getSystems();
      expect(systems).toHaveLength(3);
      expect(systems[0]).toBe(system2); // priority 5
      expect(systems[1]).toBe(system1); // priority 10
      expect(systems[2]).toBe(system3); // priority 15
    });

    it('should call onSystemStart when adding system', () => {
      const system = createMockSystem();

      entityManager.addSystem(system);

      expect(system.onSystemStart).toHaveBeenCalled();
    });

    it('should remove systems', () => {
      const system = createMockSystem();
      entityManager.addSystem(system);

      entityManager.removeSystem(system);

      expect(entityManager.getSystems()).not.toContain(system);
      expect(system.onSystemStop).toHaveBeenCalled();
    });

    it('should notify systems when entities are added/removed', () => {
      const system = createMockSystem(['location']);
      entityManager.addSystem(system);

      const entity = createMockEntity('test-1', ['location']);
      entityManager.addEntity(entity);

      expect(system.onEntityAdded).toHaveBeenCalledWith(entity);

      entityManager.removeEntity(entity.id);
      expect(system.onEntityRemoved).toHaveBeenCalledWith(entity);
    });

    it('should only notify systems for matching entities', () => {
      const system = createMockSystem(['combat']);
      entityManager.addSystem(system);

      const nonMatchingEntity = createMockEntity('test-1', ['location']);
      entityManager.addEntity(nonMatchingEntity);

      expect(system.onEntityAdded).not.toHaveBeenCalled();
    });
  });

  describe('Game Loop', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should start and stop the game loop', () => {
      expect(entityManager.isRunning()).toBe(false);

      entityManager.start();
      expect(entityManager.isRunning()).toBe(true);
      expect(logger.info).toHaveBeenCalledWith('EntityManager started');

      entityManager.stop();
      expect(entityManager.isRunning()).toBe(false);
      expect(logger.info).toHaveBeenCalledWith('EntityManager stopped');
    });

    it('should warn when trying to start already running manager', () => {
      entityManager.start();
      entityManager.start();

      expect(logger.warn).toHaveBeenCalledWith('EntityManager already running');
    });

    it('should warn when trying to stop non-running manager', () => {
      entityManager.stop();

      expect(logger.warn).toHaveBeenCalledWith('EntityManager not running');
    });

    it('should update systems at 60 FPS', () => {
      const system = createMockSystem(['location']);
      const entity = createMockEntity('test-1', ['location']);

      entityManager.addSystem(system);
      entityManager.addEntity(entity);

      entityManager.start();

      // Initial update happens immediately on start
      expect(system.update).toHaveBeenCalledTimes(1);
      expect(system.update).toHaveBeenCalledWith([entity], expect.any(Number));

      // Advance time by 16ms (60 FPS) - triggers second update
      vi.advanceTimersByTime(16);
      expect(system.update).toHaveBeenCalledTimes(2);

      // Advance time again - triggers third update
      vi.advanceTimersByTime(16);
      expect(system.update).toHaveBeenCalledTimes(3);

      entityManager.stop();
    });

    it('should handle system errors gracefully', () => {
      const system = createMockSystem(['location']);
      const error = new Error('Test error');
      (system.update as any).mockImplementation(() => {
        throw error;
      });

      const entity = createMockEntity('test-1', ['location']);
      entityManager.addSystem(system);
      entityManager.addEntity(entity);

      const errorListener = vi.fn();
      entityManager.on('system:error', errorListener);

      entityManager.start();
      vi.advanceTimersByTime(16);

      expect(logger.error).toHaveBeenCalledWith(expect.stringContaining('System update failed'), {
        error,
      });
      expect(errorListener).toHaveBeenCalledWith({ system, error });

      entityManager.stop();
    });

    it('should only update systems with matching entities', () => {
      const locationSystem = createMockSystem(['location']);
      const combatSystem = createMockSystem(['combat']);

      const locationEntity = createMockEntity('e1', ['location']);
      const combatEntity = createMockEntity('e2', ['combat']);

      entityManager.addSystem(locationSystem);
      entityManager.addSystem(combatSystem);
      entityManager.addEntity(locationEntity);
      entityManager.addEntity(combatEntity);

      entityManager.start();
      vi.advanceTimersByTime(16);

      expect(locationSystem.update).toHaveBeenCalledWith([locationEntity], expect.any(Number));
      expect(combatSystem.update).toHaveBeenCalledWith([combatEntity], expect.any(Number));

      entityManager.stop();
    });
  });
});
