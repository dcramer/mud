# Service Implementation Patterns

## When to Use Classes vs Functions

### Use Classes for Stateful Services
```typescript
// ✅ DO - Game systems with state and behavior
class CombatManager {
  private readonly activeCombats = new Map<string, Combat>();
  private readonly eventEmitter: EventEmitter;
  
  constructor(eventEmitter: EventEmitter) {
    this.eventEmitter = eventEmitter;
  }
  
  async startCombat(attacker: Player, target: Player): Promise<GameResult<Combat>> {
    const combatId = this.generateCombatId();
    const combat = new Combat(combatId, attacker, target);
    
    this.activeCombats.set(combatId, combat);
    
    this.eventEmitter.emit('combat:started', {
      combatId,
      attacker: attacker.id,
      target: target.id
    });
    
    return { success: true, data: combat };
  }
  
  private generateCombatId(): string {
    return `combat_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }
}

class EssenceSystem {
  constructor(
    private readonly database: DatabaseManager,
    private readonly logger: Logger
  ) {}
  
  async bondEssence(
    player: Player, 
    essenceType: EssenceType, 
    attribute: AttributeType
  ): Promise<GameResult<Essence>> {
    // Validation and business logic
    if (player.essences.length >= 4) {
      return {
        success: false,
        error: new GameError('Maximum essences reached', 'MAX_ESSENCES_REACHED')
      };
    }
    
    // Create and save essence
    const essence = new Essence(essenceType, attribute);
    await this.database.savePlayerEssence(player.id, essence);
    
    this.logger.info(`Player ${player.name} bonded ${essenceType} essence to ${attribute}`);
    
    return { success: true, data: essence };
  }
}
```

### Use Functions for Stateless Utilities
```typescript
// ✅ DO - Pure functions for game calculations
export const gameCalculations = {
  calculateDamage: (
    baseDamage: number, 
    powerAttribute: number, 
    modifiers: DamageModifiers = {}
  ): number => {
    const { multiplier = 1, bonus = 0, resistance = 0 } = modifiers;
    return Math.max(0, (baseDamage + powerAttribute * 0.1 + bonus) * multiplier - resistance);
  },
  
  calculateExperienceGain: (
    baseXp: number,
    levelDifference: number,
    bonusMultiplier: number = 1
  ): number => {
    const difficultyMultiplier = Math.max(0.1, 1 + levelDifference * 0.1);
    return Math.floor(baseXp * difficultyMultiplier * bonusMultiplier);
  },
  
  isAbilityAvailable: (ability: Ability, player: Player): boolean => {
    return ability.cooldownRemaining <= 0 && 
           player.mana >= ability.manaCost &&
           player.rank >= ability.requiredRank;
  }
};

// Validation utilities
export const gameValidators = {
  isValidPlayerName: (name: string): boolean => 
    /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(name),
    
  isValidRoomTransition: (from: Room, to: Room, direction: Direction): boolean =>
    from.exits[direction] === to.id,
    
  canPlayerAfford: (player: Player, cost: Currency): boolean =>
    Object.entries(cost).every(([type, amount]) => 
      (player.currency[type as keyof Currency] ?? 0) >= amount
    )
};
```

## Dependency Injection

### Interface-Based Dependencies
```typescript
// ✅ DO - Interface-based dependency injection
interface IPlayerService {
  findById(id: string): Promise<Player | null>;
  save(player: Player): Promise<Player>;
  updateLocation(playerId: string, roomId: string): Promise<void>;
}

interface IInventoryService {
  addItem(playerId: string, item: Item): Promise<GameResult<void>>;
  removeItem(playerId: string, itemId: string): Promise<GameResult<void>>;
  getInventory(playerId: string): Promise<InventoryItem[]>;
}

class QuestSystem {
  constructor(
    private readonly playerService: IPlayerService,
    private readonly inventoryService: IInventoryService,
    private readonly eventEmitter: EventEmitter
  ) {}
  
  async completeQuest(
    playerId: string, 
    questId: string
  ): Promise<GameResult<QuestReward>> {
    const player = await this.playerService.findById(playerId);
    if (!player) {
      return { 
        success: false, 
        error: new GameError('Player not found', 'PLAYER_NOT_FOUND') 
      };
    }
    
    // Quest completion logic
    const reward = await this.processQuestReward(player, questId);
    
    this.eventEmitter.emit('quest:completed', {
      playerId,
      questId,
      reward
    });
    
    return { success: true, data: reward };
  }
}
```

## Service Architecture Notes

For the core ECS architecture that underlies all services, see [ECS Architecture](ecs-architecture.md).

All game services interact with the ECS through the EntityManager and work with entities and components.

## Command System Architecture

```typescript
interface Command {
  name: string;
  aliases: string[];
  requiredRank?: Rank;
  cooldown?: number;
  
  validate(player: Player, args: string[]): boolean;
  execute(player: Player, args: string[]): Promise<void>;
}

class CommandRegistry {
  private commands = new Map<string, Command>();
  
  register(command: Command): void {
    this.commands.set(command.name, command);
    command.aliases.forEach(alias => {
      this.commands.set(alias, command);
    });
  }
  
  async execute(player: Player, input: string): Promise<void> {
    const [commandName, ...args] = this.parseInput(input);
    const command = this.commands.get(commandName.toLowerCase());
    
    if (!command) {
      player.send("Unknown command.");
      return;
    }
    
    if (!command.validate(player, args)) {
      player.send("Invalid command usage.");
      return;
    }
    
    await command.execute(player, args);
  }
}

// Example command implementation
class LookCommand implements Command {
  name = 'look';
  aliases = ['l', 'examine'];
  
  validate(player: Player, args: string[]): boolean {
    return args.length <= 1; // Optional target
  }
  
  async execute(player: Player, args: string[]): Promise<void> {
    const target = args[0];
    
    if (!target) {
      // Look at room
      await this.describeRoom(player);
    } else {
      // Look at specific target
      await this.describeTarget(player, target);
    }
  }
  
  private async describeRoom(player: Player): Promise<void> {
    const room = await this.roomService.findById(player.location.roomId);
    if (room) {
      await player.send(room.description);
    }
  }
  
  private async describeTarget(player: Player, target: string): Promise<void> {
    // Implementation for examining specific targets
  }
}
```

## State Management

```typescript
class GameState {
  private players = new Map<string, Player>();
  private rooms = new Map<string, Room>();
  private combats = new Map<string, Combat>();
  
  // Centralized state with event notifications
  movePlayer(playerId: string, roomId: string): void {
    const player = this.players.get(playerId);
    const newRoom = this.rooms.get(roomId);
    
    if (player && newRoom) {
      const oldRoomId = player.location.roomId;
      player.location.roomId = roomId;
      
      // Emit events for all interested systems
      this.emit('player:moved', { 
        player, 
        from: oldRoomId, 
        to: roomId 
      });
    }
  }
  
  updatePlayerHealth(playerId: string, newHealth: number): void {
    const player = this.players.get(playerId);
    if (player) {
      const oldHealth = player.health;
      player.health = Math.max(0, newHealth);
      
      this.emit('player:health_changed', {
        player,
        oldHealth,
        newHealth: player.health
      });
      
      if (player.health === 0) {
        this.emit('player:died', { player });
      }
    }
  }
}
```