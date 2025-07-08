# Entity Component System (ECS) Architecture

## Core Architecture Pattern

The ECS pattern is the foundation of our game engine, providing flexible object modeling for all game entities (players, NPCs, items, rooms).

### Basic ECS Concepts

```typescript
// Core ECS interfaces
interface Entity {
  id: string;
  components: Map<string, Component>;
}

interface Component {
  type: string;
  data: any;
}

interface System {
  requiredComponents: string[];
  update(entities: Entity[], deltaTime: number): void;
}
```

## Component Definitions

### Location Component
```typescript
interface LocationComponent extends Component {
  type: 'location';
  data: {
    roomId: string;
    coordinates?: { x: number; y: number; z: number };
    facing?: Direction;
  };
}
```

### Combat Component
```typescript
interface CombatComponent extends Component {
  type: 'combat';
  data: {
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
  };
}
```

### Inventory Component
```typescript
interface InventoryComponent extends Component {
  type: 'inventory';
  data: {
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
  };
}
```

### Essence Component
```typescript
interface EssenceComponent extends Component {
  type: 'essence';
  data: {
    essences: Array<{
      id: string;
      type: EssenceType;
      attributeBound: AttributeType;
      rankBonded: Rank;
      abilities: EssenceAbility[];
    }>;
    maxEssences: number; // Usually 4
  };
}
```

### AI Component (for NPCs)
```typescript
interface AIComponent extends Component {
  type: 'ai';
  data: {
    behavior: 'passive' | 'aggressive' | 'merchant' | 'quest_giver';
    dialogues: Dialogue[];
    schedule?: AISchedule;
    aggression: number;
    detectionRange: number;
    memory: AIMemory;
  };
}
```

## Entity Factory Patterns

### Player Entity Creation
```typescript
export function createPlayer(id: string, name: string, playerData: PlayerCreationData): Entity {
  return {
    id,
    components: new Map([
      ['location', {
        type: 'location',
        data: { roomId: 'starting_room', facing: 'north' }
      }],
      ['combat', {
        type: 'combat',
        data: {
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
        }
      }],
      ['inventory', {
        type: 'inventory',
        data: {
          items: [],
          maxSlots: 20,
          expansionLevel: 0,
          equipment: {},
          currency: { spiritCoins: 0, regularCoins: 100 }
        }
      }],
      ['essence', {
        type: 'essence',
        data: {
          essences: [],
          maxEssences: 4
        }
      }]
    ])
  };
}
```

### NPC Entity Creation
```typescript
export function createNPC(id: string, npcTemplate: NPCTemplate): Entity {
  return {
    id,
    components: new Map([
      ['location', {
        type: 'location',
        data: { roomId: npcTemplate.startingRoom }
      }],
      ['combat', {
        type: 'combat',
        data: {
          health: npcTemplate.maxHealth,
          maxHealth: npcTemplate.maxHealth,
          mana: npcTemplate.maxMana,
          maxMana: npcTemplate.maxMana,
          stamina: npcTemplate.maxStamina,
          maxStamina: npcTemplate.maxStamina,
          attributes: npcTemplate.attributes,
          abilities: npcTemplate.abilities,
          activeEffects: [],
          combatState: 'idle'
        }
      }],
      ['ai', {
        type: 'ai',
        data: {
          behavior: npcTemplate.behavior,
          dialogues: npcTemplate.dialogues,
          aggression: npcTemplate.aggression,
          detectionRange: npcTemplate.detectionRange,
          memory: { knownPlayers: [], recentEvents: [] }
        }
      }]
    ])
  };
}
```

### Item Entity Creation
```typescript
export function createItem(id: string, itemTemplate: ItemTemplate): Entity {
  const components = new Map([
    ['usable', {
      type: 'usable',
      data: {
        effects: itemTemplate.effects,
        cooldown: itemTemplate.cooldown,
        consumable: itemTemplate.consumable
      }
    }]
  ]);
  
  // Add equipment component if it's equippable
  if (itemTemplate.equipSlot) {
    components.set('equipment', {
      type: 'equipment',
      data: {
        slot: itemTemplate.equipSlot,
        bonuses: itemTemplate.bonuses,
        requirements: itemTemplate.requirements
      }
    });
  }
  
  return { id, components };
}
```

## System Implementations

### Combat System
```typescript
export class CombatSystem implements System {
  requiredComponents = ['combat', 'location'];
  
  constructor(
    private eventEmitter: GameEventEmitter,
    private entityManager: EntityManager
  ) {}
  
  update(entities: Entity[], deltaTime: number): void {
    // Process ongoing combats
    this.processCombats(entities, deltaTime);
    
    // Update cooldowns
    this.updateCooldowns(entities, deltaTime);
    
    // Process status effects
    this.processStatusEffects(entities, deltaTime);
  }
  
  private processCombats(entities: Entity[], deltaTime: number): void {
    const combatEntities = entities.filter(entity => {
      const combat = this.getComponent<CombatComponent>(entity, 'combat');
      return combat?.data.combatState === 'combat';
    });
    
    // Group entities by location for combat processing
    const combatGroups = this.groupByLocation(combatEntities);
    
    for (const [roomId, entitiesInRoom] of combatGroups) {
      this.processCombatInRoom(entitiesInRoom, deltaTime);
    }
  }
  
  public startCombat(attackerId: string, targetId: string): GameResult<string> {
    const attacker = this.entityManager.getEntity(attackerId);
    const target = this.entityManager.getEntity(targetId);
    
    if (!attacker || !target) {
      return {
        success: false,
        error: new GameError('Entity not found', 'ENTITY_NOT_FOUND')
      };
    }
    
    // Validate both entities can engage in combat
    const attackerCombat = this.getComponent<CombatComponent>(attacker, 'combat');
    const targetCombat = this.getComponent<CombatComponent>(target, 'combat');
    
    if (!attackerCombat || !targetCombat) {
      return {
        success: false,
        error: new GameError('Entity cannot engage in combat', 'NO_COMBAT_COMPONENT')
      };
    }
    
    // Check same location
    const attackerLocation = this.getComponent<LocationComponent>(attacker, 'location');
    const targetLocation = this.getComponent<LocationComponent>(target, 'location');
    
    if (attackerLocation?.data.roomId !== targetLocation?.data.roomId) {
      return {
        success: false,
        error: new GameError('Entities not in same location', 'DIFFERENT_LOCATIONS')
      };
    }
    
    // Start combat
    const combatId = this.generateCombatId();
    
    attackerCombat.data.combatState = 'combat';
    targetCombat.data.combatState = 'combat';
    
    this.eventEmitter.emit('combat:started', {
      combatId,
      attacker: attackerId,
      target: targetId
    });
    
    return { success: true, data: combatId };
  }
  
  private getComponent<T extends Component>(entity: Entity, type: string): T | undefined {
    return entity.components.get(type) as T | undefined;
  }
}
```

### Movement System
```typescript
export class MovementSystem implements System {
  requiredComponents = ['location'];
  
  constructor(
    private eventEmitter: GameEventEmitter,
    private roomService: RoomService
  ) {}
  
  update(entities: Entity[], deltaTime: number): void {
    // Movement system mainly responds to events rather than continuous updates
    // But we could handle things like:
    // - Automatic following
    // - Scheduled NPC movement
    // - Environmental effects on movement
  }
  
  public async moveEntity(
    entityId: string, 
    direction: Direction
  ): Promise<GameResult<void>> {
    const entity = this.entityManager.getEntity(entityId);
    if (!entity) {
      return {
        success: false,
        error: new GameError('Entity not found', 'ENTITY_NOT_FOUND')
      };
    }
    
    const location = this.getComponent<LocationComponent>(entity, 'location');
    if (!location) {
      return {
        success: false,
        error: new GameError('Entity has no location', 'NO_LOCATION_COMPONENT')
      };
    }
    
    const currentRoom = await this.roomService.getRoom(location.data.roomId);
    if (!currentRoom) {
      return {
        success: false,
        error: new GameError('Current room not found', 'ROOM_NOT_FOUND')
      };
    }
    
    const targetRoomId = currentRoom.exits[direction];
    if (!targetRoomId) {
      return {
        success: false,
        error: new GameError('No exit in that direction', 'NO_EXIT')
      };
    }
    
    const targetRoom = await this.roomService.getRoom(targetRoomId);
    if (!targetRoom) {
      return {
        success: false,
        error: new GameError('Target room not found', 'TARGET_ROOM_NOT_FOUND')
      };
    }
    
    // Perform the move
    const oldRoomId = location.data.roomId;
    location.data.roomId = targetRoomId;
    
    this.eventEmitter.emit('player:moved', {
      playerId: entityId,
      from: oldRoomId,
      to: targetRoomId
    });
    
    return { success: true, data: undefined };
  }
}
```

## Entity Manager

### Central Entity Management
```typescript
export class EntityManager {
  private entities = new Map<string, Entity>();
  private systems: System[] = [];
  private running = false;
  
  constructor(private logger: Logger) {}
  
  addEntity(entity: Entity): void {
    this.entities.set(entity.id, entity);
    this.logger.debug(`Added entity ${entity.id}`);
  }
  
  removeEntity(entityId: string): void {
    this.entities.delete(entityId);
    this.logger.debug(`Removed entity ${entityId}`);
  }
  
  getEntity(entityId: string): Entity | undefined {
    return this.entities.get(entityId);
  }
  
  getEntitiesWithComponent(componentType: string): Entity[] {
    return Array.from(this.entities.values())
      .filter(entity => entity.components.has(componentType));
  }
  
  addSystem(system: System): void {
    this.systems.push(system);
    this.logger.debug(`Added system requiring components: ${system.requiredComponents.join(', ')}`);
  }
  
  start(): void {
    this.running = true;
    this.gameLoop();
  }
  
  stop(): void {
    this.running = false;
  }
  
  private gameLoop(): void {
    if (!this.running) return;
    
    const deltaTime = 16; // ~60 FPS
    const entitiesArray = Array.from(this.entities.values());
    
    // Update all systems
    for (const system of this.systems) {
      try {
        system.update(entitiesArray, deltaTime);
      } catch (error) {
        this.logger.error(`System update failed`, { 
          system: system.constructor.name, 
          error 
        });
      }
    }
    
    // Schedule next update
    setTimeout(() => this.gameLoop(), deltaTime);
  }
}
```

## Benefits of ECS Architecture

### Flexibility
- **Composition over inheritance**: Entities are composed of components
- **Easy to add new behaviors**: Just add new components
- **Runtime modification**: Components can be added/removed dynamically

### Performance
- **Data locality**: Systems process arrays of similar data
- **Parallel processing**: Different systems can run independently
- **Memory efficiency**: Only store data that entities actually need

### Maintainability
- **Separation of concerns**: Each system handles one responsibility
- **Testability**: Systems can be tested independently
- **Modularity**: Systems can be developed by different team members

This ECS architecture forms the core of our game engine, with all other systems (combat, quests, crafting, etc.) built on top of this foundation.