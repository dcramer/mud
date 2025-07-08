# Drizzle ORM Query Patterns for D1

## Overview

This guide documents the preferred Drizzle ORM query patterns for our D1/SQLite database, focusing on performance, maintainability, and D1 compatibility.

## Core Principles

1. **Use Core Query Builder** (.select().from()) for most operations
2. **Use Relational Query API** (.query.*) sparingly for complex nested data
3. **Leverage TypeScript** for compile-time safety
4. **Optimize for D1** with proper indexing and data types

## Query Pattern Hierarchy

### 1. Core Query Builder (Preferred)

Use `.select().from()` patterns for 90% of database operations:

```typescript
// ✅ Preferred: Simple, fast, explicit
const player = await db
  .select()
  .from(schema.players)
  .where(eq(schema.players.id, playerId))
  .limit(1);

// ✅ Preferred: Batch operations
const players = await db
  .insert(schema.players)
  .values(playerDataArray)
  .returning();

// ✅ Preferred: Complex filtering
const activeCharacters = await db
  .select({
    id: schema.characters.id,
    name: schema.characters.name,
    playerUsername: schema.characters.playerUsername,
  })
  .from(schema.characters)
  .where(
    and(
      eq(schema.characters.realmId, realmId),
      eq(schema.characters.isActive, 1),
      gt(schema.characters.lastActivity, cutoffTime)
    )
  )
  .orderBy(desc(schema.characters.lastActivity));
```

### 2. Relational Query API (Limited Use)

Use `.query.*` only when you need complex nested data that's difficult with joins:

```typescript
// ✅ Acceptable: When nested structure is needed
const playerWithCharacters = await db.query.players.findFirst({
  where: eq(schema.players.id, playerId),
  with: {
    characters: {
      where: eq(schema.characters.isActive, 1),
      with: {
        essences: true,
        abilities: true,
      },
    },
  },
});

// ❌ Avoid: Simple queries don't need relational API
const player = await db.query.players.findFirst({
  where: eq(schema.players.id, playerId),
});
```

## CRUD Operation Patterns

### Create Operations

```typescript
// Single insert with returning
async create(data: CreatePlayerData): Promise<Player> {
  const id = crypto.randomUUID();
  const now = Math.floor(Date.now() / 1000);

  const [player] = await this.db
    .insert(schema.players)
    .values({
      id,
      username: data.username,
      email: data.email,
      createdAt: now,
      lastLogin: null,
    })
    .returning();

  return this.mapToPlayer(player);
}

// Batch insert for performance
async createMultiple(items: CreateItemData[]): Promise<Item[]> {
  const values = items.map(item => ({
    id: crypto.randomUUID(),
    ...item,
    createdAt: Math.floor(Date.now() / 1000),
  }));

  return await this.db
    .insert(schema.items)
    .values(values)
    .returning();
}
```

### Read Operations

```typescript
// Simple lookup with explicit column selection
async findByUsername(username: string): Promise<Player | null> {
  const result = await this.db
    .select({
      id: schema.players.id,
      username: schema.players.username,
      email: schema.players.email,
      createdAt: schema.players.createdAt,
      lastLogin: schema.players.lastLogin,
    })
    .from(schema.players)
    .where(eq(schema.players.username, username))
    .limit(1);

  return result[0] ? this.mapToPlayer(result[0]) : null;
}

// Complex query with joins (when relational API isn't suitable)
async getCharacterInventory(characterId: string, realmId: string) {
  return await this.db
    .select({
      item: schema.characterInventory,
      character: {
        id: schema.characters.id,
        name: schema.characters.name,
      },
    })
    .from(schema.characterInventory)
    .innerJoin(
      schema.characters,
      eq(schema.characterInventory.characterId, schema.characters.id)
    )
    .where(
      and(
        eq(schema.characterInventory.characterId, characterId),
        eq(schema.characterInventory.realmId, realmId)
      )
    );
}

// Efficient existence check
async exists(id: string): Promise<boolean> {
  // Validate UUID format first
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(id)) {
    return false;
  }

  const result = await this.db
    .select({ count: sql<number>`1` })
    .from(schema.players)
    .where(eq(schema.players.id, id))
    .limit(1);

  return result.length > 0;
}
```

### Update Operations

```typescript
// Simple update
async updateLastLogin(playerId: string): Promise<void> {
  const now = Math.floor(Date.now() / 1000);
  
  await this.db
    .update(schema.players)
    .set({ lastLogin: now })
    .where(eq(schema.players.id, playerId));
}

// Conditional update with validation
async updateCharacterHealth(
  characterId: string,
  realmId: string,
  health: number
): Promise<boolean> {
  const result = await this.db
    .update(schema.characters)
    .set({ 
      health,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(
      and(
        eq(schema.characters.id, characterId),
        eq(schema.characters.realmId, realmId),
        gte(schema.characters.health, 0) // Only update if not dead
      )
    )
    .returning({ id: schema.characters.id });

  return result.length > 0;
}
```

### Delete Operations

```typescript
// Soft delete (preferred for user data)
async softDelete(playerId: string): Promise<boolean> {
  const now = Math.floor(Date.now() / 1000);
  
  const result = await this.db
    .update(schema.players)
    .set({ deletedAt: now })
    .where(eq(schema.players.id, playerId))
    .returning({ id: schema.players.id });

  return result.length > 0;
}

// Hard delete (for cleanup operations)
async deleteExpiredTokens(): Promise<number> {
  const now = Math.floor(Date.now() / 1000);
  
  const result = await this.db
    .delete(schema.authTokens)
    .where(lt(schema.authTokens.expiresAt, now))
    .returning({ id: schema.authTokens.id });

  return result.length;
}
```

## D1-Specific Optimizations

### Prepared Statements

```typescript
// For frequently used queries
export class PlayerRepository {
  private findByIdPrepared = this.db
    .select()
    .from(schema.players)
    .where(eq(schema.players.id, sql.placeholder('id')))
    .limit(1)
    .prepare();

  async findById(id: string): Promise<Player | null> {
    const result = await this.findByIdPrepared.execute({ id });
    return result[0] ? this.mapToPlayer(result[0]) : null;
  }
}
```

### Batch Operations

```typescript
// Use D1's batch API for multiple related operations
async transferItems(
  transfers: Array<{
    fromCharacterId: string;
    toCharacterId: string;
    itemId: string;
    quantity: number;
  }>
): Promise<void> {
  // Build all statements
  const statements = transfers.flatMap(transfer => [
    this.db
      .update(schema.characterInventory)
      .set({ quantity: sql`quantity - ${transfer.quantity}` })
      .where(
        and(
          eq(schema.characterInventory.characterId, transfer.fromCharacterId),
          eq(schema.characterInventory.itemId, transfer.itemId)
        )
      )
      .prepare(),
    
    this.db
      .insert(schema.characterInventory)
      .values({
        id: crypto.randomUUID(),
        characterId: transfer.toCharacterId,
        itemId: transfer.itemId,
        quantity: transfer.quantity,
        // ... other required fields
      })
      .onConflictDoUpdate({
        target: [schema.characterInventory.characterId, schema.characterInventory.itemId],
        set: { quantity: sql`quantity + ${transfer.quantity}` }
      })
      .prepare(),
  ]);

  // Execute as batch
  await this.db.batch(statements);
}
```

### Efficient Column Selection

```typescript
// Only select columns you need
async getPlayerSummary(playerId: string) {
  return await this.db
    .select({
      id: schema.players.id,
      username: schema.players.username,
      lastLogin: schema.players.lastLogin,
      characterCount: sql<number>`COUNT(${schema.characters.id})`,
    })
    .from(schema.players)
    .leftJoin(schema.characters, eq(schema.players.id, schema.characters.playerId))
    .where(eq(schema.players.id, playerId))
    .groupBy(schema.players.id);
}
```

## Error Handling Patterns

```typescript
// Consistent error handling across repositories
async create(data: CreatePlayerData): Promise<Player> {
  try {
    const id = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    const [player] = await this.db
      .insert(schema.players)
      .values({ id, ...data, createdAt: now })
      .returning();

    return this.mapToPlayer(player);
  } catch (error) {
    // Handle constraint violations
    if (error instanceof Error && error.message.includes('UNIQUE constraint')) {
      if (error.message.includes('username')) {
        throw new Error('Username already exists');
      }
      if (error.message.includes('email')) {
        throw new Error('Email already exists');
      }
    }
    throw error;
  }
}
```

## Type Safety Patterns

```typescript
// Use schema inference for type safety
type PlayerSelect = typeof schema.players.$inferSelect;
type PlayerInsert = typeof schema.players.$inferInsert;

// Map database types to domain types
private mapToPlayer(dbPlayer: PlayerSelect): Player {
  return {
    id: dbPlayer.id as PlayerId,
    username: dbPlayer.username,
    email: dbPlayer.email,
    createdAt: new Date(dbPlayer.createdAt * 1000),
    lastLogin: dbPlayer.lastLogin ? new Date(dbPlayer.lastLogin * 1000) : null,
    characters: [], // Loaded separately in D1 architecture
  };
}
```

## Performance Guidelines

1. **Use indexes** for all WHERE clauses (already in schema)
2. **Limit result sets** with `.limit()` for pagination
3. **Select specific columns** instead of `SELECT *`
4. **Use prepared statements** for repeated queries
5. **Batch operations** when possible
6. **Denormalize data** to avoid joins (as done in character tables)

## Anti-Patterns to Avoid

```typescript
// ❌ Don't use relational API for simple queries
const player = await db.query.players.findFirst({
  where: eq(schema.players.id, playerId),
});

// ✅ Use core query builder instead
const [player] = await db
  .select()
  .from(schema.players)
  .where(eq(schema.players.id, playerId))
  .limit(1);

// ❌ Don't select all columns when you don't need them
const players = await db.select().from(schema.players);

// ✅ Select only needed columns
const players = await db
  .select({
    id: schema.players.id,
    username: schema.players.username,
  })
  .from(schema.players);

// ❌ Don't use multiple queries when batch is possible
for (const item of items) {
  await db.insert(schema.items).values(item);
}

// ✅ Use batch operations
await db.insert(schema.items).values(items);
```