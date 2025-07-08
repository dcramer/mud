# Entity Component System (ECS) Architecture

**Industry-Standard ECS Implementation Following Game Engine Best Practices**

## Overview

This document defines our **complete Entity Component System (ECS)** implementation following established patterns from game engines like Unity, Unreal, and specialized ECS libraries. ECS is the foundation of our game engine, providing flexible object modeling for all game entities.

## Core ECS Principles (Industry Standard)

### 1. Composition Over Inheritance
**Industry Best Practice**: Build complex entities by combining simple components rather than deep inheritance hierarchies.

```typescript
// ✅ Industry standard: Composition
const player = createEntity([
  new LocationComponent({ roomId: 'starting-room' }),
  new CombatComponent({ health: 100, maxHealth: 100 }),
  new InventoryComponent({ items: [], maxSlots: 20 }),
  new EssenceComponent({ essences: [], maxEssences: 4 })
]);

// ❌ Anti-pattern: Deep inheritance
class Entity { }
class LivingEntity extends Entity { }
class PlayerEntity extends LivingEntity { }
class MagePlayerEntity extends PlayerEntity { } // Too deep, inflexible
```

### 2. Data-Oriented Design
**Industry Best Practice**: Components store only data, systems process arrays of similar data for cache efficiency.

```typescript
// ✅ Industry standard: Pure data components
interface Component {
  readonly type: string;
}

interface LocationComponent extends Component {
  readonly type: 'location';
  roomId: string;
  coordinates?: { x: number; y: number; z: number };
  facing?: Direction;
}

// ❌ Anti-pattern: Components with behavior
interface BadComponent extends Component {
  type: 'bad';
  data: any;
  update(): void;    // Breaks ECS principles
  render(): void;    // Violates separation of concerns
}
```

### 3. System Responsibility
**Industry Best Practice**: Each system handles one specific aspect of game logic.

## Component Definitions

### Core Component Interface
```typescript
// Industry standard: Type-safe components
interface Component {
  readonly type: string;
}

// Type-safe component interface with branding
interface TypedComponent<T extends string, D = any> extends Component {
  readonly type: T;
  readonly data: D;
}
```

### Game Components

#### Location Component
```typescript
interface LocationComponent extends Component {
  readonly type: 'location';
  roomId: string;
  coordinates?: { x: number; y: number; z: number };
  facing?: Direction;
}
```

#### Combat Component
```typescript
interface CombatComponent extends Component {
  readonly type: 'combat';
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  attributes: {
    power: number;
    speed: number;
    spirit: number;
    recovery: number;
  };
  abilities: Ability[];
  activeEffects: StatusEffect[];
  combatState: 'idle' | 'combat' | 'cooldown';
}
```

#### Inventory Component
```typescript
interface InventoryComponent extends Component {
  readonly type: 'inventory';
  items: InventoryItem[];
  maxSlots: number;
  expansionLevel: number;
  equipment: {
    weapon?: EquippedItem;
    armor?: EquippedItem;
    accessories?: EquippedItem[];
  };
  currency: {
    spiritCoins: number;
    regularCoins: number;
  };
}
```

#### Essence Component
```typescript
interface EssenceComponent extends Component {
  readonly type: 'essence';
  essences: Array<{
    id: string;
    type: EssenceType;
    attributeBound: AttributeType;
    rankBonded: Rank;
    abilities: EssenceAbility[];
  }>;
  maxEssences: number; // Usually 4
}
```

#### AI Component (for NPCs)
```typescript
interface AIComponent extends Component {
  readonly type: 'ai';
  behavior: 'passive' | 'aggressive' | 'merchant' | 'quest_giver';
  dialogues: Dialogue[];
  schedule?: AISchedule;
  aggression: number;
  detectionRange: number;
  memory: AIMemory;
}
```

## Entity Implementation

### Core Entity Interface
```typescript
interface Entity {
  readonly id: string;
  readonly components: ReadonlyMap<string, Component>;
}

// Type-safe component access
function getComponent<T extends Component>(
  entity: Entity, 
  type: T['type']
): T | undefined {
  return entity.components.get(type) as T | undefined;
}

function hasComponent(entity: Entity, type: string): boolean {
  return entity.components.has(type);
}
```

### Entity Factory Pattern

#### Player Factory
```typescript
export function createPlayer(config: {
  id: string;
  name: string;
  startingRoomId: string;
}): Entity {
  const components = new Map<string, Component>();
  
  // Add all required player components
  components.set('location', {
    type: 'location',
    roomId: config.startingRoomId,
    facing: Direction.North
  });
  
  components.set('combat', {
    type: 'combat',
    health: 100,
    maxHealth: 100,
    mana: 50,
    maxMana: 50,
    stamina: 100,
    maxStamina: 100,
    attributes: {
      power: 10,
      speed: 10,
      spirit: 10,
      recovery: 10
    },
    abilities: [],
    activeEffects: [],
    combatState: 'idle'
  });
  
  components.set('inventory', {
    type: 'inventory',
    items: [],
    maxSlots: 20,
    expansionLevel: 0,
    equipment: {},
    currency: { spiritCoins: 0, regularCoins: 100 }
  });
  
  components.set('essence', {
    type: 'essence',
    essences: [],
    maxEssences: 4
  });
  
  return {
    id: config.id,
    components
  };
}
```

#### Factory Registry Pattern
```typescript
class EntityFactory {
  private factories = new Map<string, (config: any) => Entity>();
  
  register<T extends Record<string, any>>(
    type: string, 
    factory: (config: T) => Entity
  ): void {
    this.factories.set(type, factory);
  }
  
  create<T extends Record<string, any>>(
    type: string, 
    config: T
  ): GameResult<Entity> {
    const factory = this.factories.get(type);
    if (!factory) {
      return failure(new GameError(`Unknown entity type: ${type}`, 'INVALID_INPUT'));
    }
    
    try {
      const entity = factory(config);
      return success(entity);
    } catch (error) {
      return failure(new GameError('Entity creation failed', 'SYSTEM_ERROR'));
    }
  }
}
```

## System Implementation

### Base System Architecture
```typescript
// Industry standard base system
abstract class BaseSystem {
  abstract readonly requiredComponents: readonly string[];
  readonly priority: number = 0;
  
  constructor(
    protected readonly entityManager: EntityManager,
    protected readonly eventEmitter: EventEmitter,
    protected readonly logger: Logger
  ) {}
  
  abstract update(entities: readonly Entity[], deltaTime: number): void;
  
  // Lifecycle hooks (industry standard)
  onSystemStart?(): void;
  onSystemStop?(): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entity: Entity): void;
  
  // Helper methods
  protected getComponent<T extends Component>(
    entity: Entity, 
    type: string
  ): T | undefined {
    return entity.components.get(type) as T | undefined;
  }
  
  protected hasComponent(entity: Entity, type: string): boolean {
    return entity.components.has(type);
  }
  
  protected getRelevantEntities(): Entity[] {
    return this.entityManager.queryEntities({
      with: [...this.requiredComponents]
    });
  }
  
  protected emitEvent<T>(type: string, data: T): void {
    this.eventEmitter.emit(type, {
      type,
      data,
      timestamp: Date.now(),
      source: this.constructor.name
    });
  }
}
```

### Movement System Example
```typescript
class MovementSystem extends BaseSystem {
  readonly requiredComponents = ['location'] as const;
  readonly priority = 10; // Higher priority for movement
  
  constructor(
    entityManager: EntityManager,
    eventEmitter: EventEmitter,
    logger: Logger,
    private readonly roomService: RoomService
  ) {
    super(entityManager, eventEmitter, logger);
  }
  
  update(entities: readonly Entity[], deltaTime: number): void {
    // Process any queued movements
    this.processMovementQueue(entities, deltaTime);
  }
  
  async moveEntity(
    entityId: string, 
    direction: Direction
  ): Promise<GameResult<void>> {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) {
      return failure(GameError.notFound('Entity', entityId));
    }
    
    const location = this.getComponent<LocationComponent>(entity, 'location');
    if (!location) {
      return failure(GameError.missingComponent(entityId, 'location'));
    }
    
    // Validate movement
    const currentRoom = await this.roomService.getRoom(location.roomId);
    if (!currentRoom) {
      return failure(GameError.notFound('Room', location.roomId));
    }
    
    const targetRoomId = currentRoom.exits[direction];
    if (!targetRoomId) {
      return failure(new GameError('No exit in that direction', 'NO_EXIT'));
    }
    
    const targetRoom = await this.roomService.getRoom(targetRoomId);
    if (!targetRoom) {
      return failure(GameError.notFound('Room', targetRoomId));
    }
    
    // Perform movement
    const oldRoomId = location.roomId;
    location.roomId = targetRoomId;
    
    // Emit event for other systems
    this.emitEvent('entity:moved', {
      entityId,
      from: oldRoomId,
      to: targetRoomId,
      direction
    });
    
    return success(undefined);
  }
  
  private processMovementQueue(entities: readonly Entity[], deltaTime: number): void {
    // Implementation for processing scheduled movements
  }
}
```

### Combat System Example
```typescript
export class CombatSystem extends BaseSystem {
  readonly requiredComponents = ['combat', 'location'] as const;
  
  constructor(
    entityManager: EntityManager,
    eventEmitter: GameEventEmitter,
    logger: Logger,
    private readonly abilityService: AbilityService
  ) {
    super(entityManager, eventEmitter, logger);
    
    // Listen for events from other systems
    this.eventEmitter.on('entity:moved', this.onEntityMoved.bind(this));
    this.eventEmitter.on('ability:used', this.onAbilityUsed.bind(this));
  }
  
  update(entities: readonly Entity[], deltaTime: number): void {
    // Process ongoing combats
    this.processCombats(entities, deltaTime);
    
    // Update cooldowns
    this.updateCooldowns(entities, deltaTime);
    
    // Process status effects
    this.processStatusEffects(entities, deltaTime);
  }
  
  private processCombats(entities: readonly Entity[], deltaTime: number): void {
    const combatEntities = entities.filter(entity => {
      const combat = this.getComponent<CombatComponent>(entity, 'combat');
      return combat?.combatState === 'combat';
    });
    
    // Group entities by location for combat processing
    const combatGroups = this.groupByLocation(combatEntities);
    
    for (const [roomId, entitiesInRoom] of combatGroups) {
      this.processCombatInRoom(entitiesInRoom, deltaTime);
    }
  }
  
  async startCombat(attackerId: string, targetId: string): Promise<GameResult<string>> {
    const attacker = this.entityManager.getEntity(attackerId);
    const target = this.entityManager.getEntity(targetId);
    
    if (!attacker || !target) {
      return failure(GameError.notFound('Entity', !attacker ? attackerId : targetId));
    }
    
    // Validate both entities can engage in combat
    const attackerCombat = this.getComponent<CombatComponent>(attacker, 'combat');
    const targetCombat = this.getComponent<CombatComponent>(target, 'combat');
    
    if (!attackerCombat || !targetCombat) {
      return failure(new GameError('Entity cannot engage in combat', 'COMPONENT_MISSING'));
    }
    
    // Check same location
    const attackerLocation = this.getComponent<LocationComponent>(attacker, 'location');
    const targetLocation = this.getComponent<LocationComponent>(target, 'location');
    
    if (attackerLocation?.roomId !== targetLocation?.roomId) {
      return failure(new GameError('Entities not in same location', 'DIFFERENT_LOCATIONS'));
    }
    
    // Start combat
    const combatId = this.generateCombatId();
    
    attackerCombat.combatState = 'combat';
    targetCombat.combatState = 'combat';
    
    this.emitEvent('combat:started', {
      combatId,
      attacker: attackerId,
      target: targetId
    });
    
    return success(combatId);
  }
  
  private generateCombatId(): string {
    return `combat_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}
```

## Entity Manager

### Complete Implementation with Performance Optimizations
```typescript
class EntityManager extends EventEmitter {
  private readonly entities = new Map<string, Entity>();
  private readonly systems: System[] = [];
  private readonly componentIndex = new Map<string, Set<string>>(); // Performance optimization
  private running = false;
  
  constructor(private readonly logger: Logger) {
    super();
  }
  
  // Entity management
  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.updateComponentIndex(entity, 'add');
    
    this.emit('entity:added', entity);
    this.notifySystemsEntityAdded(entity);
  }
  
  removeEntity(entityId: string): boolean {
    const entity = this.entities.get(entityId);
    if (!entity) return false;
    
    this.entities.delete(entityId);
    this.updateComponentIndex(entity, 'remove');
    
    this.emit('entity:removed', entity);
    this.notifySystemsEntityRemoved(entity);
    
    return true;
  }
  
  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }
  
  // Performance optimization: Component indexing
  getEntitiesWithComponent(componentType: string): Entity[] {
    const entityIds = this.componentIndex.get(componentType);
    if (!entityIds) return [];
    
    return Array.from(entityIds)
      .map(id => this.entities.get(id))
      .filter((entity): entity is Entity => entity !== undefined);
  }
  
  // Advanced querying (industry standard)
  queryEntities(query: EntityQuery): Entity[] {
    return Array.from(this.entities.values()).filter(entity => 
      this.entityMatchesQuery(entity, query)
    );
  }
  
  // System management
  addSystem(system: System): void {
    this.systems.push(system);
    this.systems.sort((a, b) => (a.priority || 0) - (b.priority || 0));
    
    if (system.onSystemStart) {
      system.onSystemStart();
    }
    
    this.logger.debug(`Added system: ${system.constructor.name}`);
  }
  
  removeSystem(system: System): void {
    const index = this.systems.indexOf(system);
    if (index >= 0) {
      this.systems.splice(index, 1);
      
      if (system.onSystemStop) {
        system.onSystemStop();
      }
    }
  }
  
  // Game loop
  start(): void {
    this.running = true;
    this.gameLoop();
  }
  
  stop(): void {
    this.running = false;
    this.systems.forEach(system => {
      if (system.onSystemStop) {
        system.onSystemStop();
      }
    });
  }
  
  private gameLoop(): void {
    if (!this.running) return;
    
    const deltaTime = 16; // 60 FPS target
    const entities = Array.from(this.entities.values());
    
    // Update systems in priority order
    for (const system of this.systems) {
      try {
        const relevantEntities = entities.filter(entity =>
          this.entityMatchesSystemRequirements(entity, system)
        );
        
        if (relevantEntities.length > 0) {
          system.update(relevantEntities, deltaTime);
        }
      } catch (error) {
        this.logger.error(`System update failed: ${system.constructor.name}`, error);
      }
    }
    
    // Schedule next update
    setTimeout(() => this.gameLoop(), deltaTime);
  }
  
  // Performance optimization: Component indexing
  private updateComponentIndex(entity: Entity, operation: 'add' | 'remove'): void {
    for (const componentType of entity.components.keys()) {
      if (!this.componentIndex.has(componentType)) {
        this.componentIndex.set(componentType, new Set());
      }
      
      const entitySet = this.componentIndex.get(componentType)!;
      
      if (operation === 'add') {
        entitySet.add(entity.id);
      } else {
        entitySet.delete(entity.id);
      }
    }
  }
  
  private entityMatchesSystemRequirements(entity: Entity, system: System): boolean {
    return system.requiredComponents.every(component =>
      entity.components.has(component)
    );
  }
  
  private entityMatchesQuery(entity: Entity, query: EntityQuery): boolean {
    // Must have all required components
    const hasRequired = query.with.every(component =>
      entity.components.has(component)
    );
    
    // Must not have excluded components
    const hasExcluded = query.without?.some(component =>
      entity.components.has(component)
    ) ?? false;
    
    // Must have at least one of 'any' components
    const hasAny = query.any?.some(component =>
      entity.components.has(component)
    ) ?? true;
    
    return hasRequired && !hasExcluded && hasAny;
  }
  
  private notifySystemsEntityAdded(entity: Entity): void {
    this.systems.forEach(system => {
      if (system.onEntityAdded && this.entityMatchesSystemRequirements(entity, system)) {
        system.onEntityAdded(entity);
      }
    });
  }
  
  private notifySystemsEntityRemoved(entity: Entity): void {
    this.systems.forEach(system => {
      if (system.onEntityRemoved && this.entityMatchesSystemRequirements(entity, system)) {
        system.onEntityRemoved(entity);
      }
    });
  }
}
```

## Advanced Patterns

### Component Registry with Validation
```typescript
class ComponentRegistry {
  private componentTypes = new Map<string, ComponentDefinition>();
  
  register<T extends Component>(
    type: string,
    definition: ComponentDefinition<T>
  ): void {
    this.componentTypes.set(type, definition);
  }
  
  createComponent<T extends Component>(
    type: string,
    data: T['data']
  ): GameResult<T> {
    const definition = this.componentTypes.get(type);
    if (!definition) {
      return failure(new GameError(`Unknown component type: ${type}`, 'INVALID_INPUT'));
    }
    
    // Validate data against schema
    const validation = definition.validate(data);
    if (!validation.success) {
      return failure(new GameError('Invalid component data', 'INVALID_INPUT'));
    }
    
    return success({ type, data } as T);
  }
}

interface ComponentDefinition<T extends Component = Component> {
  validate(data: any): { success: boolean; errors?: string[] };
  default(): T['data'];
}
```

### Inter-System Communication
```typescript
// Systems communicate through events, never direct calls
class CombatSystem extends BaseSystem {
  constructor(entityManager: EntityManager, eventEmitter: GameEventEmitter) {
    super(entityManager, eventEmitter);
    
    // Listen for events from other systems
    this.eventEmitter.on('entity:moved', this.onEntityMoved.bind(this));
    this.eventEmitter.on('ability:used', this.onAbilityUsed.bind(this));
  }
  
  private onEntityMoved(event: GameEvent): void {
    // Handle entity movement affecting combat
    const { entityId, from, to } = event.data;
    this.checkCombatEngagement(entityId, to);
  }
  
  private onAbilityUsed(event: GameEvent): void {
    // Handle ability usage
    const { entityId, abilityId, targets } = event.data;
    this.processAbilityEffect(entityId, abilityId, targets);
  }
}
```

## Benefits of ECS Architecture

### Performance (Industry Standard)
- **Cache-friendly**: Process arrays of similar components together
- **Parallel processing**: Systems can run independently
- **Memory efficient**: Only store data entities actually need
- **Component indexing**: O(1) lookups for entities with specific components
- **Batch operations**: Update many entities simultaneously

### Flexibility (Industry Standard)
- **Dynamic composition**: Add/remove components at runtime
- **No inheritance trees**: Avoid complex class hierarchies
- **Easy feature addition**: New behaviors = new components + systems
- **Modular**: Systems can be developed and tested independently

### Maintainability (Industry Standard)
- **Clear separation**: Data (components) vs behavior (systems)
- **Testable**: Each system can be unit tested in isolation
- **Debuggable**: Clear data flow and responsibilities
- **Scalable**: Easy to add new team members to different systems

## Design Principles

### 1. Composition Over Inheritance
- Entities are built by combining components, not inheriting from classes
- A "FireMage" entity = Entity + Health + Mana + Inventory + SpellCaster components
- Easy to create hybrid entities by mixing components

### 2. Data-Oriented Design
- Components store only data, no methods
- Systems process arrays of similar data for cache efficiency
- Memory layout optimized for iteration performance

### 3. Single Responsibility
- Each system handles one specific aspect of game logic
- Systems are independent and can be developed/tested separately
- Clear separation between data (components) and behavior (systems)

## Query System

```typescript
// Advanced entity querying
interface EntityQuery {
  with: string[];        // Required components
  without?: string[];    // Excluded components  
  any?: string[];        // At least one of these
}

// Usage examples
const livingEntities = entityManager.queryEntities({
  with: ['health'],
  without: ['dead']
});

const combatants = entityManager.queryEntities({
  with: ['health', 'location'],
  any: ['player', 'npc']
});

const merchants = entityManager.queryEntities({
  with: ['ai', 'inventory'],
  without: ['combat']
});
```

## TypeScript Best Practices

### Type-Safe Components
```typescript
// Use branded types for component safety
type ComponentType = 'health' | 'inventory' | 'location' | 'combat';

interface TypedComponent<T extends ComponentType, D = any> {
  type: T;
  data: D;
}

// Specific component interfaces
interface HealthComponent extends TypedComponent<'health', {
  current: number;
  maximum: number;
  regeneration: number;
}> {}

interface InventoryComponent extends TypedComponent<'inventory', {
  items: InventoryItem[];
  maxCapacity: number;
  weight: number;
}> {}
```

This ECS architecture follows proven patterns from the game industry while being specifically adapted for our MUD's needs. It provides the foundation for all game systems while maintaining performance, flexibility, and maintainability.