# MUD Technical Architecture

## Overview

This document outlines the technical architecture for implementing our "He Who Fights With Monsters" inspired MUD using TypeScript and modern web technologies.

## Core Technology Stack

### Primary Technologies
```typescript
// Recommended Stack
Runtime: Node.js (Latest LTS)
Language: TypeScript (strict mode)
Networking: WebSocket (primary) + Telnet (legacy support)
Database: PostgreSQL + Drizzle ORM (persistence) + Redis (cache/sessions)
Testing: Vitest
Build: Vite
Process Management: PM2 (production)
```

### Development Tools
```bash
Package Manager: pnpm
Linting: ESLint + TypeScript ESLint
Formatting: Prettier
Type Checking: TypeScript compiler
Database: Drizzle ORM + Drizzle Kit (migrations)
Testing: Vitest + supertest
Monitoring: (TBD - likely Grafana + Prometheus)
Code Standards: See CODING-GUIDELINES.md
```

## Architecture Patterns

### Event-Driven Architecture
Following the **RanvierMUD** pattern - our primary inspiration:

```typescript
class GameEngine extends EventEmitter {
  // Central event hub for all game activities
  processCommand(player: Player, command: string) {
    this.emit('command:input', { player, command });
  }
  
  handleCombat(attacker: Player, target: Entity) {
    this.emit('combat:attack', { attacker, target });
  }
  
  handleMovement(player: Player, direction: Direction) {
    this.emit('player:move', { player, direction });
  }
}
```

**Benefits for our MUD**:
- Perfect for turn-based/command-based gameplay
- Entities idle when not acting (efficient)
- Easy to add new systems without core changes
- Natural fit for our essence ability system

### Modular Bundle System
Inspired by RanvierMUD's approach:

```
src/
├── bundles/
│   ├── core-combat/        # Combat system bundle
│   ├── essence-system/     # Essence and ability management
│   ├── adventure-society/  # Quest and contract system
│   ├── crafting/          # Alchemy, artifice, inscription
│   └── world-greenstone/  # Starting world content
```

**Advantages**:
- Systems can be developed independently
- Easy to disable/enable features
- Clean separation of concerns
- Supports our phased development approach

## Network Architecture

### Dual Protocol Support

#### WebSocket (Primary)
```typescript
// Modern web client support
interface WebSocketMessage {
  type: 'command' | 'output' | 'state' | 'event';
  data: any;
  timestamp: number;
}

class WebSocketHandler {
  handleConnection(ws: WebSocket, playerId: string) {
    ws.on('message', (data) => {
      const message: WebSocketMessage = JSON.parse(data.toString());
      this.processMessage(playerId, message);
    });
  }
}
```

#### Telnet (Legacy Compatibility)
```typescript
// Traditional MUD client support
class TelnetHandler {
  handleConnection(socket: net.Socket) {
    socket.on('data', (data) => {
      const command = data.toString().trim();
      this.processCommand(socket.playerId, command);
    });
  }
}
```

### Connection Management
```typescript
class ConnectionManager {
  private connections = new Map<string, Connection>();
  
  // Unified interface regardless of connection type
  sendToPlayer(playerId: string, message: string): void {
    const connection = this.connections.get(playerId);
    if (connection) {
      connection.send(message);
    }
  }
  
  broadcastToRoom(roomId: string, message: string, exclude?: string[]): void {
    // Efficient room-based messaging
  }
}
```

## Data Architecture

### Layered Storage Strategy
```typescript
// Four-tier data architecture
Level 1: JSON Files (backup/import)     // Static world data, migrations
Level 2: PostgreSQL + Drizzle (persistent storage)   // Player data, dynamic world
Level 3: Redis (cache layer)           // Sessions, temporary state
Level 4: Memory (active game state)    // Real-time gameplay
```

### Database Schemas

#### Drizzle Schema Definitions
```typescript
import { pgTable, uuid, varchar, integer, timestamp, boolean, jsonb, text } from 'drizzle-orm/pg-core';

// Core player/account table
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  lastLogin: timestamp('last_login'),
});

// Character data
export const characters = pgTable('characters', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').references(() => players.id).notNull(),
  name: varchar('name', { length: 50 }).notNull().unique(),
  rank: varchar('rank', { length: 20 }).notNull().default('normal'),
  
  // Attributes
  power: integer('power').notNull().default(10),
  speed: integer('speed').notNull().default(10),
  spirit: integer('spirit').notNull().default(10),
  recovery: integer('recovery').notNull().default(10),
  
  // Current state
  currentRoomId: varchar('current_room_id', { length: 100 }),
  health: integer('health').notNull(),
  mana: integer('mana').notNull(),
  stamina: integer('stamina').notNull(),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Essence data
export const characterEssences = pgTable('character_essences', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  essenceType: varchar('essence_type', { length: 50 }).notNull(),
  attributeBound: varchar('attribute_bound', { length: 20 }).notNull(),
  rankBonded: varchar('rank_bonded', { length: 20 }).notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

// Abilities
export const characterAbilities = pgTable('character_abilities', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  essenceId: uuid('essence_id').references(() => characterEssences.id).notNull(),
  abilityName: varchar('ability_name', { length: 100 }).notNull(),
  currentRank: varchar('current_rank', { length: 20 }).notNull(),
  awakened: boolean('awakened').default(false),
  metadata: jsonb('metadata'), // For ability-specific data
  createdAt: timestamp('created_at').defaultNow(),
});

// Inventory
export const characterInventory = pgTable('character_inventory', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  itemId: varchar('item_id', { length: 100 }).notNull(),
  quantity: integer('quantity').notNull().default(1),
  slot: integer('slot'), // null for unequipped items
  metadata: jsonb('metadata'), // For item modifications, enchantments
  createdAt: timestamp('created_at').defaultNow(),
});

// World/Room definitions
export const rooms = pgTable('rooms', {
  id: varchar('id', { length: 100 }).primaryKey(),
  areaId: varchar('area_id', { length: 100 }).notNull(),
  title: varchar('title', { length: 255 }).notNull(),
  description: text('description').notNull(),
  exits: jsonb('exits'), // { "north": "room_id", "south": "room_id" }
  properties: jsonb('properties'), // { safe: true, magicDensity: "normal" }
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Skills
export const characterSkills = pgTable('character_skills', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  skillName: varchar('skill_name', { length: 100 }).notNull(),
  proficiency: integer('proficiency').notNull().default(0), // 0-100
  experience: integer('experience').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Quest progress
export const characterQuests = pgTable('character_quests', {
  id: uuid('id').primaryKey().defaultRandom(),
  characterId: uuid('character_id').references(() => characters.id).notNull(),
  questId: varchar('quest_id', { length: 100 }).notNull(),
  status: varchar('status', { length: 20 }).notNull(), // active, completed, failed
  progress: jsonb('progress'), // Quest-specific progress data
  startedAt: timestamp('started_at').defaultNow(),
  completedAt: timestamp('completed_at'),
});
```

#### Redis Structures
```typescript
// Active sessions
"session:{playerId}" -> SessionData
"room_players:{roomId}" -> Set<playerId>
"combat:{combatId}" -> CombatState
"message_queue:{playerId}" -> List<Message>
```

## Game Systems Architecture

### Entity Component System (ECS)
```typescript
// Flexible object modeling for all game entities
interface Entity {
  id: string;
  components: Map<string, Component>;
}

interface Component {
  type: string;
  data: any;
}

// Examples:
// Player = Entity + LocationComponent + InventoryComponent + CombatComponent
// NPC = Entity + LocationComponent + AIComponent + CombatComponent  
// Item = Entity + InventoryComponent + UsableComponent
```

### Command System
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
```

### State Management
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
}
```

## Security Architecture

### Input Validation
```typescript
class SecurityManager {
  private readonly MAX_COMMAND_LENGTH = 255;
  private readonly ALLOWED_CHARS = /^[a-zA-Z0-9\s\-_.,!?']+$/;
  
  validateInput(input: string): boolean {
    return input.length <= this.MAX_COMMAND_LENGTH &&
           this.ALLOWED_CHARS.test(input);
  }
  
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>\"&]/g, '') // Remove dangerous HTML chars
      .trim()
      .substring(0, this.MAX_COMMAND_LENGTH);
  }
}
```

### Command Execution Safety
```typescript
// Never use eval() or dynamic code execution
// Always use whitelisted commands
// Implement proper authorization checks

class SecureCommandExecutor {
  async execute(player: Player, commandName: string, args: string[]): Promise<void> {
    // 1. Validate command exists in whitelist
    // 2. Check player permissions
    // 3. Rate limit command execution
    // 4. Log all command executions
    // 5. Execute in safe context
  }
}
```

## Performance Optimizations

### Memory Management
```typescript
// Object pooling for frequently created objects
class ObjectPool<T> {
  private available: T[] = [];
  private createFn: () => T;
  
  constructor(createFn: () => T, initialSize: number = 10) {
    this.createFn = createFn;
    for (let i = 0; i < initialSize; i++) {
      this.available.push(createFn());
    }
  }
  
  acquire(): T {
    return this.available.pop() || this.createFn();
  }
  
  release(obj: T): void {
    // Reset object state
    this.available.push(obj);
  }
}

// Use for: Combat events, messages, temporary objects
```

### Efficient Broadcasting
```typescript
class EfficientBroadcaster {
  // Only send to players who need updates
  broadcastRoomEvent(roomId: string, event: GameEvent, exclude?: string[]): void {
    const players = this.getPlayersInRoom(roomId);
    const message = this.serializeEvent(event);
    
    players.forEach(player => {
      if (!exclude?.includes(player.id)) {
        player.send(message);
      }
    });
  }
}
```

### Database Management with Drizzle
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

class DatabaseManager {
  private db: ReturnType<typeof drizzle>;
  private redisClient: Redis;
  private cache = new Map<string, any>();
  
  constructor() {
    const connectionString = process.env.DATABASE_URL!;
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }
  
  async getCharacter(characterId: string): Promise<Character | null> {
    // 1. Check memory cache
    if (this.cache.has(characterId)) {
      return this.cache.get(characterId);
    }
    
    // 2. Check Redis cache
    const cached = await this.redisClient.get(`character:${characterId}`);
    if (cached) {
      const character = JSON.parse(cached);
      this.cache.set(characterId, character);
      return character;
    }
    
    // 3. Query PostgreSQL with Drizzle
    const character = await this.db.query.characters.findFirst({
      where: eq(schema.characters.id, characterId),
      with: {
        essences: true,
        abilities: true,
        inventory: true,
        skills: true,
      }
    });
    
    // 4. Cache result
    if (character) {
      await this.redisClient.setex(`character:${characterId}`, 300, JSON.stringify(character));
      this.cache.set(characterId, character);
    }
    
    return character || null;
  }
  
  async saveCharacter(character: Character): Promise<void> {
    // Update database
    await this.db.update(schema.characters)
      .set({
        currentRoomId: character.location.roomId,
        health: character.health,
        mana: character.mana,
        stamina: character.stamina,
        updatedAt: new Date(),
      })
      .where(eq(schema.characters.id, character.id));
    
    // Update cache
    this.cache.set(character.id, character);
    await this.redisClient.setex(`character:${character.id}`, 300, JSON.stringify(character));
  }
}
```

## Development Workflow

### Project Structure
```
src/
├── server/
│   ├── networking/        # WebSocket + Telnet handlers
│   ├── database/         # MongoDB + Redis connections
│   ├── security/         # Input validation, auth
│   └── core/            # Core game engine
├── game/
│   ├── entities/        # Player, NPC, Item classes
│   ├── systems/         # Combat, progression, etc.
│   ├── commands/        # All game commands
│   └── events/          # Event definitions
├── bundles/
│   ├── core-combat/     # Combat system bundle
│   ├── essence-system/  # Essence mechanics
│   └── world-content/   # Areas, NPCs, quests
├── shared/
│   ├── types/          # TypeScript definitions
│   ├── protocols/      # Network protocols
│   └── constants/      # Game constants
└── tests/
    ├── unit/           # Unit tests
    ├── integration/    # Integration tests
    └── load/           # Performance tests
```

### Essential Commands
```bash
# Development
pnpm run dev           # Start development server
pnpm run build         # Build for production
pnpm run typecheck     # TypeScript checking
pnpm run lint          # Code linting
pnpm run test          # Run all tests
pnpm run test:watch    # Watch mode testing

# Database
pnpm run db:generate   # Generate Drizzle migrations
pnpm run db:migrate    # Run database migrations
pnpm run db:studio     # Open Drizzle Studio
pnpm run db:seed       # Seed database with initial data

# Production
pnpm run start         # Start production server
pnpm run monitor       # Monitor server health
```

## Deployment Architecture

### Production Setup
```typescript
// PM2 ecosystem configuration
module.exports = {
  apps: [{
    name: 'mud-server',
    script: 'dist/server/index.js',
    instances: 1, // Single instance for state consistency
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000,
      MONGODB_URI: 'mongodb://localhost:27017/mud',
      REDIS_URI: 'redis://localhost:6379'
    }
  }]
};
```

### Monitoring
- Health check endpoints
- Performance metrics collection
- Error tracking and logging
- Player activity analytics

## Integration with Game Design

This technical architecture directly supports our game design requirements:

- **Event-driven**: Perfect for essence abilities and combat systems
- **Modular**: Supports our phased development approach
- **Extensible**: Easy to add new essence types and abilities
- **Performant**: Handles multiple concurrent players efficiently
- **Secure**: Protects against common MUD vulnerabilities
- **Modern**: Web-based while maintaining MUD traditions

The architecture provides a solid foundation for implementing all systems defined in our game design documentation while maintaining flexibility for future enhancements.