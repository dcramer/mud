import { EventEmitter } from 'node:events';
import type { System } from '@/game/systems/system.js';
import type { Entity, EntityId, EntityQuery } from '@/shared/types/game.js';
import type { Logger } from '@/shared/utils/logger.js';

/**
 * Core EntityManager implementation following our ECS patterns
 * Manages all entities and systems in the game world
 */
export class EntityManager extends EventEmitter {
  private readonly entities = new Map<EntityId, Entity>();
  private readonly systems: System[] = [];
  private readonly componentIndex = new Map<string, Set<EntityId>>();
  private running = false;
  private lastUpdateTime = 0;

  constructor(private readonly logger: Logger) {
    super();
  }

  // Entity management
  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.updateComponentIndex(entity, 'add');

    this.emit('entity:added', entity);
    this.notifySystemsEntityAdded(entity);

    this.logger.debug(`Added entity ${entity.id}`);
  }

  removeEntity(entityId: EntityId): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;

    this.entities.delete(entityId);
    this.updateComponentIndex(entity, 'remove');

    this.emit('entity:removed', entity);
    this.notifySystemsEntityRemoved(entity);

    this.logger.debug(`Removed entity ${entityId}`);
    return true;
  }

  getEntity(entityId: EntityId): Entity | undefined {
    return this.entities.get(entityId);
  }

  getAllEntities(): Entity[] {
    return Array.from(this.entities.values());
  }

  // Component indexing for performance
  getEntitiesWithComponent(componentType: string): Entity[] {
    const entityIds = this.componentIndex.get(componentType);
    if (!entityIds) return [];

    return Array.from(entityIds)
      .map((id) => this.entities.get(id))
      .filter((entity): entity is Entity => entity !== undefined);
  }

  // Advanced querying
  queryEntities(query: EntityQuery): Entity[] {
    return Array.from(this.entities.values()).filter((entity) =>
      this.entityMatchesQuery(entity, query),
    );
  }

  // System management
  addSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => (a.priority || 0) - (b.priority || 0));

    if (system.onSystemStart) {
      system.onSystemStart();
    }

    this.logger.debug(
      `Added system: ${system.constructor.name} (priority: ${system.priority || 0})`,
    );
  }

  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index >= 0) {
      this.systems.splice(index, 1);

      if (system.onSystemStop) {
        system.onSystemStop();
      }

      this.logger.debug(`Removed system: ${system.constructor.name}`);
    }
  }

  getSystems(): readonly System[] {
    return this.systems;
  }

  // Game loop
  start(): void {
    if (this.running) {
      this.logger.warn('EntityManager already running');
      return;
    }

    this.running = true;
    this.lastUpdateTime = Date.now();
    this.logger.info('EntityManager started');
    this.gameLoop();
  }

  stop(): void {
    if (!this.running) {
      this.logger.warn('EntityManager not running');
      return;
    }

    this.running = false;

    // Notify all systems
    for (const system of this.systems) {
      if (system.onSystemStop) {
        system.onSystemStop();
      }
    }

    this.logger.info('EntityManager stopped');
  }

  isRunning(): boolean {
    return this.running;
  }

  // Main game loop
  private gameLoop(): void {
    if (!this.running) return;

    const now = Date.now();
    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    // Update all systems
    this.update(deltaTime);

    // Schedule next update (60 FPS target)
    setTimeout(() => this.gameLoop(), 16);
  }

  private update(deltaTime: number): void {
    const entities = Array.from(this.entities.values());

    for (const system of this.systems) {
      try {
        const relevantEntities = entities.filter((entity) =>
          this.entityMatchesSystemRequirements(entity, system),
        );

        if (relevantEntities.length > 0) {
          system.update(relevantEntities, deltaTime);
        }
      } catch (error) {
        this.logger.error(`System update failed: ${system.constructor.name}`, { error });
        this.emit('system:error', { system, error });
      }
    }
  }

  // Component indexing for performance
  private updateComponentIndex(entity: Entity, operation: 'add' | 'remove'): void {
    for (const componentType of entity.components.keys()) {
      if (!this.componentIndex.has(componentType)) {
        this.componentIndex.set(componentType, new Set());
      }

      const entitySet = this.componentIndex.get(componentType);
      if (!entitySet) {
        throw new Error(`Component index corrupted for type: ${componentType}`);
      }

      if (operation === 'add') {
        entitySet.add(entity.id);
      } else {
        entitySet.delete(entity.id);

        // Clean up empty sets
        if (entitySet.size === 0) {
          this.componentIndex.delete(componentType);
        }
      }
    }
  }

  private entityMatchesSystemRequirements(entity: Entity, system: System): boolean {
    return system.requiredComponents.every((component) => entity.components.has(component));
  }

  private entityMatchesQuery(entity: Entity, query: EntityQuery): boolean {
    // Must have all required components
    const hasRequired = query.with.every((component) => entity.components.has(component));

    // Must not have excluded components
    const hasExcluded =
      query.without?.some((component) => entity.components.has(component)) ?? false;

    // Must have at least one of 'any' components
    const hasAny = query.any?.some((component) => entity.components.has(component)) ?? true;

    return hasRequired && !hasExcluded && hasAny;
  }

  private notifySystemsEntityAdded(entity: Entity): void {
    for (const system of this.systems) {
      if (system.onEntityAdded && this.entityMatchesSystemRequirements(entity, system)) {
        try {
          system.onEntityAdded(entity);
        } catch (error) {
          this.logger.error(`System onEntityAdded failed: ${system.constructor.name}`, { error });
        }
      }
    }
  }

  private notifySystemsEntityRemoved(entity: Entity): void {
    for (const system of this.systems) {
      if (system.onEntityRemoved && this.entityMatchesSystemRequirements(entity, system)) {
        try {
          system.onEntityRemoved(entity);
        } catch (error) {
          this.logger.error(`System onEntityRemoved failed: ${system.constructor.name}`, { error });
        }
      }
    }
  }
}
