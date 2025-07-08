# MUD Implementation Patterns

This document consolidates the core implementation patterns for the MUD game engine, providing a comprehensive guide for TypeScript implementation following ECS principles.

## Core TypeScript Interfaces

### ECS Foundation Types

```typescript
// Base Component Interface
interface Component {
  type: string;
  data: Record<string, any>;
}

// Type-safe component interface
interface TypedComponent<T extends string, D = any> extends Component {
  type: T;
  data: D;
}

// Entity Interface
interface Entity {
  id: string;
  components: Map<string, Component>;
}

// Entity factory function signature
type EntityFactory<T extends Record<string, any> = {}> = (
  id: string,
  config: T
) => Entity;

// System Interface
interface System {
  requiredComponents: string[];
  priority?: number;
  
  update(entities: Entity[], deltaTime: number): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entity: Entity): void;
}
```

### Entity Manager Interface

```typescript
interface EntityManager {
  // Basic CRUD
  addEntity(entity: Entity): void;
  removeEntity(entityId: string): void;
  getEntity(entityId: string): Entity | undefined;
  
  // Component queries
  getEntitiesWithComponent(componentType: string): Entity[];
  
  // Advanced querying
  query(query: EntityQuery): Entity[];
  
  // System management
  addSystem(system: System): void;
  removeSystem(system: System): void;
  
  // Lifecycle
  start(): void;
  stop(): void;
  update(deltaTime: number): void;
}

interface EntityQuery {
  with: string[];
  without?: string[];
  any?: string[];
}
```

## Error Handling Patterns

### GameResult Pattern

```typescript
interface GameResult<T> {
  success: boolean;
  data?: T;
  error?: GameError;
}

// Success result helper
function success<T>(data: T): GameResult<T> {
  return { success: true, data };
}

// Error result helper
function failure<T>(error: GameError): GameResult<T> {
  return { success: false, error };
}

// Void success helper
function voidSuccess(): GameResult<void> {
  return { success: true };
}
```

### GameError Class

```typescript
class GameError extends Error {
  constructor(
    message: string,
    public code: GameErrorCode,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'GameError';
  }
  
  // Convenience methods
  static notFound(resource: string, id: string): GameError {
    return new GameError(
      `${resource} not found`,
      'ENTITY_NOT_FOUND',
      { resource, id }
    );
  }
  
  static missingComponent(entityId: string, componentType: string): GameError {
    return new GameError(
      `Entity ${entityId} missing component: ${componentType}`,
      'COMPONENT_MISSING',
      { entityId, componentType }
    );
  }
  
  static invalidInput(message: string, input?: any): GameError {
    return new GameError(
      message,
      'INVALID_INPUT',
      { input }
    );
  }
  
  static permissionDenied(action: string, reason?: string): GameError {
    return new GameError(
      `Permission denied: ${action}`,
      'PERMISSION_DENIED',
      { action, reason }
    );
  }
}
```

### Standard Error Codes

```typescript
enum GameErrorCode {
  // Entity/Component errors
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  COMPONENT_MISSING = 'COMPONENT_MISSING',
  INVALID_ENTITY_STATE = 'INVALID_ENTITY_STATE',
  
  // Input/Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MALFORMED_COMMAND = 'MALFORMED_COMMAND',
  UNKNOWN_COMMAND = 'UNKNOWN_COMMAND',
  
  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_RANK = 'INSUFFICIENT_RANK',
  UNAUTHORIZED = 'UNAUTHORIZED',
  
  // Resource errors
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',
  
  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  
  // Game Logic errors
  INVALID_TARGET = 'INVALID_TARGET',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  INVALID_CONDITIONS = 'INVALID_CONDITIONS',
  
  // Combat errors
  ALREADY_IN_COMBAT = 'ALREADY_IN_COMBAT',
  NOT_IN_COMBAT = 'NOT_IN_COMBAT',
  ABILITY_NOT_AVAILABLE = 'ABILITY_NOT_AVAILABLE',
  
  // Movement errors
  NO_EXIT = 'NO_EXIT',
  BLOCKED_PATH = 'BLOCKED_PATH',
  DIFFERENT_LOCATIONS = 'DIFFERENT_LOCATIONS'
}
```

## Event System

### Core Event Interfaces

```typescript
interface GameEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
  source?: string;
  id?: string;
}

// Typed event interface
interface TypedGameEvent<T extends string, D = any> extends GameEvent<D> {
  type: T;
  data: D;
}

interface GameEventEmitter {
  emit<T>(eventType: string, data: T): boolean;
  on<T>(eventType: string, listener: (event: GameEvent<T>) => void): this;
  off<T>(eventType: string, listener: (event: GameEvent<T>) => void): this;
  once<T>(eventType: string, listener: (event: GameEvent<T>) => void): this;
  
  // Typed event methods
  emitTyped<T extends string, D>(event: TypedGameEvent<T, D>): boolean;
  onTyped<T extends string, D>(
    eventType: T, 
    listener: (event: TypedGameEvent<T, D>) => void
  ): this;
}
```

### Event Naming Conventions

```typescript
// Format: category:action or category:state_change
// Examples:
'player:connected'
'player:disconnected'
'player:moved'
'player:died'

'combat:started'
'combat:ended'
'combat:damage'
'combat:healing'

'ability:used'
'ability:cooldown_started'
'ability:cooldown_ended'

'item:picked_up'
'item:dropped'
'item:equipped'
'item:unequipped'

'system:started'
'system:stopped'
'system:error'
```

### Event System Implementation

```typescript
class GameEventSystem extends EventEmitter implements GameEventEmitter {
  private eventHistory: GameEvent[] = [];
  private eventFilters = new Map<string, (event: GameEvent) => boolean>();
  
  emit<T>(eventType: string, data: T): boolean {
    const event: GameEvent<T> = {
      type: eventType,
      data,
      timestamp: Date.now(),
      id: this.generateEventId()
    };
    
    // Store for debugging/replay
    this.eventHistory.push(event);
    
    // Trim history to prevent memory leaks
    if (this.eventHistory.length > 10000) {
      this.eventHistory.shift();
    }
    
    return super.emit(eventType, event);
  }
  
  emitTyped<T extends string, D>(event: TypedGameEvent<T, D>): boolean {
    return this.emit(event.type, event.data);
  }
  
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
```

## Base System Implementation

### System Base Class

```typescript
abstract class BaseSystem implements System {
  abstract requiredComponents: string[];
  priority = 0;
  
  constructor(
    protected entityManager: EntityManager,
    protected eventEmitter: GameEventEmitter,
    protected logger: Logger
  ) {}
  
  abstract update(entities: Entity[], deltaTime: number): void;
  
  protected getComponent<T extends Component>(
    entity: Entity, 
    type: string
  ): T | undefined {
    return entity.components.get(type) as T | undefined;
  }
  
  protected handleError(error: any, context: string): GameError {
    if (error instanceof GameError) {
      return error;
    }
    
    // Log unexpected errors
    this.logger.error(`System error in ${context}:`, error);
    
    return new GameError(
      `System error: ${error.message}`,
      'SYSTEM_ERROR',
      { context, originalError: error.message }
    );
  }
  
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<GameResult<T>> {
    try {
      const result = await operation();
      return success(result);
    } catch (error) {
      return failure(this.handleError(error, context));
    }
  }
  
  protected emitEvent<T>(eventType: string, data: T): void {
    this.eventEmitter.emit(eventType, data);
  }
}
```

### Event-Driven System Communication

```typescript
// Systems never call each other directly
// Always use events for loose coupling

class MovementSystem extends BaseSystem {
  async movePlayer(playerId: string, direction: Direction): Promise<GameResult<void>> {
    // Perform movement logic
    const result = await this.performMovement(playerId, direction);
    
    if (result.success) {
      // Emit event for other systems
      this.emitEvent('player:moved', {
        playerId,
        from: result.data.from,
        to: result.data.to,
        direction
      });
    }
    
    return result;
  }
}

class CombatSystem extends BaseSystem {
  constructor(entityManager: EntityManager, eventEmitter: GameEventEmitter, logger: Logger) {
    super(entityManager, eventEmitter, logger);
    
    // React to movement events
    this.eventEmitter.on('player:moved', (event) => {
      this.checkForCombatTriggers(event.data.playerId, event.data.to);
    });
  }
}
```

## Command System

### Command Interface

```typescript
interface Command {
  name: string;
  aliases: string[];
  description: string;
  usage: string;
  requiredRank?: Rank;
  cooldown?: number;
  
  validate(player: Player, args: string[]): GameResult<void>;
  execute(player: Player, args: string[]): Promise<GameResult<void>>;
}
```

### Base Command Class

```typescript
abstract class BaseCommand implements Command {
  abstract name: string;
  abstract aliases: string[];
  abstract description: string;
  abstract usage: string;
  
  requiredRank?: Rank;
  cooldown?: number;
  
  constructor(
    protected logger: Logger,
    protected eventEmitter: GameEventEmitter
  ) {}
  
  // Template method pattern
  async execute(player: Player, args: string[]): Promise<GameResult<void>> {
    // 1. Validate command
    const validation = this.validate(player, args);
    if (!validation.success) {
      return failure(validation.error!);
    }
    
    // 2. Check cooldown
    const cooldownCheck = this.checkCooldown(player);
    if (!cooldownCheck.success) {
      return failure(cooldownCheck.error!);
    }
    
    // 3. Check rank requirement
    const rankCheck = this.checkRankRequirement(player);
    if (!rankCheck.success) {
      return failure(rankCheck.error!);
    }
    
    // 4. Execute command logic
    try {
      const result = await this.run(player, args);
      
      // 5. Set cooldown if successful
      if (result.success && this.cooldown) {
        this.setCooldown(player);
      }
      
      return result;
    } catch (error) {
      return failure(this.handleError(error));
    }
  }
  
  protected abstract run(player: Player, args: string[]): Promise<GameResult<void>>;
  
  validate(player: Player, args: string[]): GameResult<void> {
    // Base validation - override for specific requirements
    return voidSuccess();
  }
  
  private checkCooldown(player: Player): GameResult<void> {
    if (!this.cooldown) return voidSuccess();
    
    const lastUsed = player.getCommandCooldown(this.name);
    if (lastUsed && Date.now() - lastUsed < this.cooldown) {
      const remaining = Math.ceil((this.cooldown - (Date.now() - lastUsed)) / 1000);
      return failure(new GameError(
        `Command on cooldown for ${remaining} seconds`,
        'COOLDOWN_ACTIVE',
        { command: this.name, remaining }
      ));
    }
    
    return voidSuccess();
  }
  
  private checkRankRequirement(player: Player): GameResult<void> {
    if (!this.requiredRank) return voidSuccess();
    
    if (!player.hasRank(this.requiredRank)) {
      return failure(new GameError(
        `Requires ${this.requiredRank} rank`,
        'INSUFFICIENT_RANK',
        { required: this.requiredRank, current: player.rank }
      ));
    }
    
    return voidSuccess();
  }
  
  private setCooldown(player: Player): void {
    player.setCommandCooldown(this.name, Date.now());
  }
  
  private handleError(error: any): GameError {
    if (error instanceof GameError) {
      return error;
    }
    
    this.logger.error(`Command error in ${this.name}:`, error);
    return new GameError(
      `Command failed: ${error.message}`,
      'SYSTEM_ERROR',
      { command: this.name, originalError: error.message }
    );
  }
}
```

### Command Registry and Execution

```typescript
class CommandRegistry {
  private commands = new Map<string, Command>();
  private aliases = new Map<string, string>();
  
  constructor(private logger: Logger) {}
  
  register(command: Command): void {
    // Register main command name
    this.commands.set(command.name.toLowerCase(), command);
    
    // Register aliases
    command.aliases.forEach(alias => {
      this.aliases.set(alias.toLowerCase(), command.name.toLowerCase());
    });
    
    this.logger.debug(`Registered command: ${command.name} (${command.aliases.join(', ')})`);
  }
  
  get(commandName: string): Command | undefined {
    const normalizedName = commandName.toLowerCase();
    
    // Check direct command name
    let command = this.commands.get(normalizedName);
    if (command) return command;
    
    // Check aliases
    const aliasTarget = this.aliases.get(normalizedName);
    if (aliasTarget) {
      return this.commands.get(aliasTarget);
    }
    
    return undefined;
  }
  
  getAll(): Command[] {
    return Array.from(this.commands.values());
  }
}

class CommandExecutor {
  constructor(
    private registry: CommandRegistry,
    private validator: InputValidator,
    private logger: Logger
  ) {}
  
  async execute(player: Player, input: string): Promise<void> {
    try {
      // 1. Parse and validate input
      const parseResult = this.parseInput(input);
      if (!parseResult.success) {
        await player.send("Invalid command format.");
        return;
      }
      
      const { commandName, args } = parseResult.data!;
      
      // 2. Find command
      const command = this.registry.get(commandName);
      if (!command) {
        await player.send("Unknown command. Type 'help' for available commands.");
        return;
      }
      
      // 3. Execute command
      const result = await command.execute(player, args);
      
      // 4. Handle result
      if (!result.success) {
        await this.sendErrorMessage(player, result.error!);
      }
      
    } catch (error) {
      this.logger.error(`Command execution failed for player ${player.id}:`, error);
      await player.send("An error occurred while processing your command.");
    }
  }
  
  private parseInput(input: string): GameResult<{ commandName: string; args: string[] }> {
    const validation = this.validator.validateCommand(input);
    if (!validation.success) {
      return failure(validation.error!);
    }
    
    const trimmed = input.trim();
    const [commandName, ...args] = trimmed.split(/\s+/);
    
    return success({
      commandName: commandName.toLowerCase(),
      args: args.filter(arg => arg.length > 0)
    });
  }
  
  private async sendErrorMessage(player: Player, error: GameError): Promise<void> {
    const userMessage = this.formatErrorForUser(error);
    await player.send(userMessage);
    
    // Log for debugging
    this.logger.warn(`Command error for player ${player.id}:`, {
      error: error.message,
      code: error.code,
      context: error.context
    });
  }
  
  private formatErrorForUser(error: GameError): string {
    switch (error.code) {
      case 'INSUFFICIENT_RANK':
        return `You need ${error.context?.required} rank to use this command.`;
      case 'COOLDOWN_ACTIVE':
        return `You must wait ${error.context?.remaining} seconds before using this command again.`;
      case 'INVALID_INPUT':
        return error.message;
      case 'PERMISSION_DENIED':
        return "You don't have permission to do that.";
      default:
        return "Command failed.";
    }
  }
}
```

## Component Patterns

### Core Component Types

```typescript
interface LocationComponent extends TypedComponent<'location', {
  roomId: string;
  coordinates?: { x: number; y: number; z: number };
  facing?: Direction;
}> {}

interface CombatComponent extends TypedComponent<'combat', {
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
}> {}

interface InventoryComponent extends TypedComponent<'inventory', {
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
}> {}

interface EssenceComponent extends TypedComponent<'essence', {
  essences: Array<{
    id: string;
    type: EssenceType;
    attributeBound: AttributeType;
    rankBonded: Rank;
    abilities: EssenceAbility[];
  }>;
  maxEssences: number;
}> {}
```

## Common Enums and Types

```typescript
enum Direction {
  North = 'north',
  South = 'south',
  East = 'east',
  West = 'west',
  Up = 'up',
  Down = 'down',
  Northeast = 'northeast',
  Northwest = 'northwest',
  Southeast = 'southeast',
  Southwest = 'southwest'
}

enum Rank {
  Normal = 'normal',
  Iron = 'iron',
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Diamond = 'diamond'
}

enum AttributeType {
  Power = 'power',
  Speed = 'speed',
  Spirit = 'spirit',
  Recovery = 'recovery'
}

// For async operations that can fail
type AsyncGameResult<T> = Promise<GameResult<T>>;

// For component type safety
type ComponentType = LocationComponent | CombatComponent | InventoryComponent | EssenceComponent;

// For entity creation
type EntityConfig = {
  id: string;
  components: ComponentType[];
};
```

## Implementation Best Practices

### Error Handling
- Always use GameResult pattern for operations that can fail
- Provide specific error codes and context
- Log system errors while returning user-friendly messages
- Use type guards (isSuccess/isFailure) for cleaner code

### Event System
- Use events for all cross-system communication
- Follow naming conventions (category:action)
- Emit events after successful operations
- Keep event data minimal but complete

### Command System
- Validate input in validate() method
- Use template method pattern in BaseCommand
- Return GameResult from all command operations
- Format user-facing errors appropriately

### System Design
- Extend BaseSystem for consistent error handling
- Use safeExecute() for async operations
- Never call other systems directly
- React to events for system coordination

This consolidated implementation guide provides the foundation for building a robust, maintainable MUD game engine following TypeScript and ECS best practices.