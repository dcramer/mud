# Database Patterns with Drizzle

## Schema Definitions

### Core Player Schema
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
```

### Game-Specific Schemas
```typescript
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
```

## Database Service Pattern

### Repository Pattern with Drizzle
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, and } from 'drizzle-orm';
import postgres from 'postgres';
import * as schema from './schema';

export class PlayerRepository {
  private db: ReturnType<typeof drizzle>;
  
  constructor(connectionString: string) {
    const client = postgres(connectionString);
    this.db = drizzle(client, { schema });
  }
  
  async findById(playerId: string): Promise<Player | null> {
    const result = await this.db.query.players.findFirst({
      where: eq(schema.players.id, playerId),
      with: {
        characters: {
          with: {
            essences: true,
            abilities: true,
            inventory: true
          }
        }
      }
    });
    
    return result ? this.mapToPlayer(result) : null;
  }
  
  async findByUsername(username: string): Promise<Player | null> {
    const result = await this.db.query.players.findFirst({
      where: eq(schema.players.username, username)
    });
    
    return result ? this.mapToPlayer(result) : null;
  }
  
  async create(playerData: CreatePlayerData): Promise<Player> {
    const [player] = await this.db.insert(schema.players)
      .values({
        username: playerData.username,
        email: playerData.email,
        passwordHash: playerData.passwordHash
      })
      .returning();
    
    return this.mapToPlayer(player);
  }
  
  async updateLastLogin(playerId: string): Promise<void> {
    await this.db.update(schema.players)
      .set({ lastLogin: new Date() })
      .where(eq(schema.players.id, playerId));
  }
  
  private mapToPlayer(dbPlayer: any): Player {
    // Transform database result to domain object
    return {
      id: dbPlayer.id,
      username: dbPlayer.username,
      email: dbPlayer.email,
      createdAt: dbPlayer.createdAt,
      lastLogin: dbPlayer.lastLogin,
      characters: dbPlayer.characters?.map(this.mapToCharacter) || []
    };
  }
}
```

### Character Service with Caching
```typescript
export class CharacterService {
  private cache = new Map<string, Character>();
  
  constructor(
    private db: ReturnType<typeof drizzle>,
    private redisClient: Redis,
    private logger: Logger
  ) {}
  
  async findById(characterId: string): Promise<Character | null> {
    // 1. Check memory cache
    if (this.cache.has(characterId)) {
      return this.cache.get(characterId)!;
    }
    
    // 2. Check Redis cache
    const cached = await this.redisClient.get(`character:${characterId}`);
    if (cached) {
      const character = JSON.parse(cached) as Character;
      this.cache.set(characterId, character);
      return character;
    }
    
    // 3. Query database
    const character = await this.loadFromDatabase(characterId);
    
    // 4. Cache result
    if (character) {
      await this.cacheCharacter(character);
    }
    
    return character;
  }
  
  async save(character: Character): Promise<void> {
    try {
      // Update database
      await this.db.update(schema.characters)
        .set({
          currentRoomId: character.location.roomId,
          health: character.health,
          mana: character.mana,
          stamina: character.stamina,
          power: character.attributes.power,
          speed: character.attributes.speed,
          spirit: character.attributes.spirit,
          recovery: character.attributes.recovery,
          updatedAt: new Date(),
        })
        .where(eq(schema.characters.id, character.id));
      
      // Update cache
      await this.cacheCharacter(character);
      
      this.logger.debug(`Saved character ${character.id}`);
    } catch (error) {
      this.logger.error(`Failed to save character ${character.id}`, { error });
      throw new GameError('Failed to save character', 'DATABASE_ERROR');
    }
  }
  
  private async loadFromDatabase(characterId: string): Promise<Character | null> {
    const result = await this.db.query.characters.findFirst({
      where: eq(schema.characters.id, characterId),
      with: {
        essences: {
          with: {
            abilities: true
          }
        },
        inventory: true,
        skills: true
      }
    });
    
    return result ? this.mapToCharacter(result) : null;
  }
  
  private async cacheCharacter(character: Character): Promise<void> {
    // Update memory cache
    this.cache.set(character.id, character);
    
    // Update Redis cache (5 minute TTL)
    await this.redisClient.setex(
      `character:${character.id}`, 
      300, 
      JSON.stringify(character)
    );
  }
}
```

## Transaction Patterns

### Complex Game Operations
```typescript
export class EssenceService {
  constructor(
    private db: ReturnType<typeof drizzle>,
    private logger: Logger
  ) {}
  
  async bondEssence(
    characterId: string,
    essenceType: EssenceType,
    attribute: AttributeType
  ): Promise<GameResult<Essence>> {
    return await this.db.transaction(async (tx) => {
      try {
        // 1. Verify character exists and has space
        const character = await tx.query.characters.findFirst({
          where: eq(schema.characters.id, characterId),
          with: { essences: true }
        });
        
        if (!character) {
          return {
            success: false,
            error: new GameError('Character not found', 'CHARACTER_NOT_FOUND')
          };
        }
        
        if (character.essences.length >= 4) {
          return {
            success: false,
            error: new GameError('Maximum essences reached', 'MAX_ESSENCES_REACHED')
          };
        }
        
        // 2. Create essence record
        const [essence] = await tx.insert(schema.characterEssences)
          .values({
            characterId,
            essenceType,
            attributeBound: attribute,
            rankBonded: character.rank
          })
          .returning();
        
        // 3. Create initial abilities for the essence
        const initialAbilities = this.getInitialAbilities(essenceType);
        await tx.insert(schema.characterAbilities)
          .values(
            initialAbilities.map(ability => ({
              characterId,
              essenceId: essence.id,
              abilityName: ability.name,
              currentRank: 'normal',
              awakened: false
            }))
          );
        
        // 4. Update character attributes
        const attributeBonus = this.getAttributeBonus(essenceType, attribute);
        await tx.update(schema.characters)
          .set({
            [attribute]: character[attribute] + attributeBonus,
            updatedAt: new Date()
          })
          .where(eq(schema.characters.id, characterId));
        
        this.logger.info(`Character ${characterId} bonded ${essenceType} essence to ${attribute}`);
        
        return {
          success: true,
          data: this.mapToEssence(essence)
        };
        
      } catch (error) {
        this.logger.error('Essence bonding failed', { characterId, essenceType, attribute, error });
        throw error; // Let transaction rollback
      }
    });
  }
}
```

## Migration Patterns

### Schema Evolution
```typescript
// drizzle/migrations/0001_add_character_essences.sql
CREATE TABLE IF NOT EXISTS "character_essences" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "character_id" uuid NOT NULL REFERENCES "characters"("id") ON DELETE CASCADE,
  "essence_type" varchar(50) NOT NULL,
  "attribute_bound" varchar(20) NOT NULL,
  "rank_bonded" varchar(20) NOT NULL,
  "created_at" timestamp DEFAULT now()
);

CREATE INDEX IF NOT EXISTS "idx_character_essences_character_id" ON "character_essences"("character_id");
CREATE INDEX IF NOT EXISTS "idx_character_essences_type" ON "character_essences"("essence_type");
```

### Data Migration Scripts
```typescript
// scripts/migrate-inventory-expansion.ts
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq } from 'drizzle-orm';

export async function migrateInventoryExpansion(db: ReturnType<typeof drizzle>) {
  console.log('Starting inventory expansion migration...');
  
  // Add new columns for expandable inventory
  await db.execute(`
    ALTER TABLE character_inventory 
    ADD COLUMN IF NOT EXISTS max_slots integer DEFAULT 20,
    ADD COLUMN IF NOT EXISTS expansion_level integer DEFAULT 0
  `);
  
  // Update existing characters
  const characters = await db.query.characters.findMany();
  
  for (const character of characters) {
    const inventoryCount = await db.query.characterInventory.findMany({
      where: eq(schema.characterInventory.characterId, character.id)
    });
    
    // Set appropriate expansion level based on current items
    const expansionLevel = Math.ceil(inventoryCount.length / 20) - 1;
    const maxSlots = 20 + (expansionLevel * 10);
    
    await db.update(schema.characterInventory)
      .set({ maxSlots, expansionLevel })
      .where(eq(schema.characterInventory.characterId, character.id));
  }
  
  console.log(`Migrated ${characters.length} characters`);
}
```

## Performance Patterns

### Efficient Queries
```typescript
// ✅ DO - Use selective loading
export class QuestService {
  async getActiveQuests(characterId: string): Promise<Quest[]> {
    // Only load what we need
    const quests = await this.db.query.characterQuests.findMany({
      where: and(
        eq(schema.characterQuests.characterId, characterId),
        eq(schema.characterQuests.status, 'active')
      ),
      columns: {
        id: true,
        questId: true,
        progress: true,
        startedAt: true
      }
    });
    
    return quests.map(this.mapToQuest);
  }
  
  // ❌ DON'T - Load everything
  async getAllPlayerData(characterId: string): Promise<any> {
    return await this.db.query.characters.findFirst({
      where: eq(schema.characters.id, characterId),
      with: {
        essences: {
          with: {
            abilities: true // This could be hundreds of records
          }
        },
        inventory: true, // And hundreds more
        quests: true,    // And more...
        skills: true
      }
    });
  }
}
```

### Batch Operations
```typescript
// ✅ DO - Batch related operations
export class InventoryService {
  async addMultipleItems(
    characterId: string, 
    items: Array<{ itemId: string; quantity: number }>
  ): Promise<GameResult<void>> {
    return await this.db.transaction(async (tx) => {
      const values = items.map(item => ({
        characterId,
        itemId: item.itemId,
        quantity: item.quantity,
        slot: null // Unequipped
      }));
      
      await tx.insert(schema.characterInventory).values(values);
      
      return { success: true, data: undefined };
    });
  }
}
```