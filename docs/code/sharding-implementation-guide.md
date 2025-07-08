# Sharding Implementation Guide

## Overview

This guide explains how to implement repositories and services using our sharding-ready schema, ensuring smooth scaling from 1 to 1M+ players.

## Core Principles

1. **Write Locally, Read Globally**: Most operations happen within a single shard
2. **Denormalize for Performance**: Trade storage for query speed
3. **Use KV for Lookups**: Cross-shard lookups via KV, not database queries
4. **Entity Groups**: Keep related data together

## Repository Implementation Patterns

### 1. Multi-Database Repository

```typescript
export class CharacterRepository {
  constructor(
    private gameDb: D1Database,    // Realm-specific
    private authDb: D1Database,    // Global auth
    private kvCache: KVNamespace,  // Cross-shard lookups
    private realmId: string        // Current realm
  ) {}

  async create(data: CreateCharacterData): Promise<Character> {
    // 1. Fetch denormalized data from auth DB
    const player = await this.authDb
      .prepare("SELECT username FROM players WHERE id = ?")
      .bind(data.playerId)
      .first();
    
    if (!player) throw new Error('Player not found');

    // 2. Generate ID and prepare character data
    const characterId = crypto.randomUUID();
    const now = Math.floor(Date.now() / 1000);

    // 3. Create character with denormalized data
    await this.gameDb.prepare(`
      INSERT INTO characters (
        id, player_id, realm_id, player_username,
        name, rank, attributes,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      characterId,
      data.playerId,
      this.realmId,
      player.username, // Denormalized!
      data.name,
      'normal',
      JSON.stringify(DEFAULT_ATTRIBUTES),
      now,
      now
    ).run();

    // 4. Update KV cache for cross-realm lookups
    await this.updatePlayerRealmCache(data.playerId, characterId);

    return this.findById(characterId);
  }

  private async updatePlayerRealmCache(
    playerId: string, 
    characterId: string
  ): Promise<void> {
    const cacheKey = `player_realms:${playerId}`;
    const existing = await this.kvCache.get(cacheKey, 'json');
    
    const data = existing || { realms: {} };
    data.realms[this.realmId] = {
      characters: [...(data.realms[this.realmId]?.characters || []), characterId],
      lastActive: Date.now()
    };

    await this.kvCache.put(cacheKey, JSON.stringify(data), {
      expirationTtl: 86400 * 30 // 30 days
    });
  }
}
```

### 2. Cross-Shard Queries

```typescript
export class PlayerService {
  constructor(
    private authDb: D1Database,
    private kvCache: KVNamespace,
    private gameDbFactory: GameDbFactory
  ) {}

  async getAllCharacters(playerId: string): Promise<Character[]> {
    // 1. Get realm mapping from KV
    const realmData = await this.kvCache.get(
      `player_realms:${playerId}`, 
      'json'
    );

    if (!realmData) return [];

    // 2. Query each realm in parallel
    const characterPromises = Object.entries(realmData.realms).map(
      async ([realmId, data]) => {
        const gameDb = this.gameDbFactory.getDb(realmId);
        const characters = await gameDb.prepare(`
          SELECT * FROM characters 
          WHERE player_id = ? AND realm_id = ?
        `).bind(playerId, realmId).all();
        
        return characters.results;
      }
    );

    // 3. Flatten results
    const allCharacters = await Promise.all(characterPromises);
    return allCharacters.flat();
  }
}
```

### 3. Denormalized Updates

```typescript
export class InventoryService {
  async transferItem(
    fromCharacterId: string,
    toCharacterId: string,
    itemId: string,
    quantity: number,
    transferType: string = 'trade'
  ): Promise<void> {
    // Must be same realm for atomic transaction
    const fromChar = await this.getCharacter(fromCharacterId);
    const toChar = await this.getCharacter(toCharacterId);
    
    if (fromChar.realmId !== toChar.realmId) {
      throw new Error('Cross-realm transfers not supported');
    }

    await this.gameDb.transaction(async (tx) => {
      // Remove from source (includes denormalized data)
      await tx.prepare(`
        UPDATE character_inventory 
        SET quantity = quantity - ?
        WHERE character_id = ? AND item_id = ?
      `).bind(quantity, fromCharacterId, itemId).run();

      // Add to destination (with denormalized data)
      await tx.prepare(`
        INSERT INTO character_inventory (
          id, character_id, realm_id,
          character_name, player_id, player_username,
          item_id, quantity, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          quantity = quantity + excluded.quantity
      `).bind(
        crypto.randomUUID(),
        toCharacterId,
        toChar.realmId,
        toChar.name,
        toChar.playerId,
        toChar.playerUsername,
        itemId,
        quantity,
        Math.floor(Date.now() / 1000)
      ).run();

      // CRITICAL: Log the transfer for audit trail
      // TODO: Implement item_transfer_log table and logging
      // See /docs/wip/item-tracking-requirements.md
      /*
      await tx.prepare(`
        INSERT INTO item_transfer_log (
          id, from_character_id, from_character_name,
          to_character_id, to_character_name,
          item_id, quantity, transfer_type, 
          realm_id, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(...).run();
      */
    });
  }
}
```

## Shard Management

### 1. Database Factory Pattern

```typescript
export class GameDbFactory {
  private databases = new Map<string, D1Database>();

  constructor(private env: CloudflareEnv) {
    // Initialize known realms
    this.databases.set('main', env.D1_GAME_MAIN);
    // Add more as they're created
  }

  getDb(realmId: string): D1Database {
    const db = this.databases.get(realmId);
    if (!db) {
      throw new Error(`Unknown realm: ${realmId}`);
    }
    return db;
  }

  async getHealthyRealm(): Promise<string> {
    // Check realm health and return best option
    for (const [realmId, db] of this.databases) {
      const health = await this.checkRealmHealth(realmId, db);
      if (health.canAcceptNewPlayers) {
        return realmId;
      }
    }
    throw new Error('No healthy realms available');
  }

  private async checkRealmHealth(
    realmId: string, 
    db: D1Database
  ): Promise<RealmHealth> {
    const metrics = await db.prepare(`
      SELECT 
        COUNT(DISTINCT player_id) as active_players,
        COUNT(*) as total_characters
      FROM characters
      WHERE last_activity > ?
    `).bind(Date.now() / 1000 - 86400).first();

    const size = await db.prepare(`
      SELECT page_count * page_size / 1024 / 1024 / 1024 as size_gb
      FROM pragma_page_count(), pragma_page_size()
    `).first();

    return {
      realmId,
      activePlayerCount: metrics.active_players,
      totalCharacters: metrics.total_characters,
      sizeGb: size.size_gb,
      canAcceptNewPlayers: size.size_gb < 8, // 8GB soft limit
    };
  }
}
```

### 2. Realm Selection

```typescript
export class RealmSelectionService {
  async selectRealmForNewCharacter(
    playerId: string
  ): Promise<string> {
    // 1. Check if player has existing characters
    const playerRealms = await this.kvCache.get(
      `player_realms:${playerId}`,
      'json'
    );

    if (playerRealms?.realms) {
      // Prefer realm with existing characters
      const activeRealms = Object.entries(playerRealms.realms)
        .filter(([_, data]) => data.characters.length > 0)
        .sort((a, b) => b[1].lastActive - a[1].lastActive);
      
      if (activeRealms.length > 0) {
        return activeRealms[0][0];
      }
    }

    // 2. Select healthiest realm
    return await this.gameDbFactory.getHealthyRealm();
  }
}
```

## Query Patterns

### 1. Single-Shard Queries (99% of operations)

```typescript
// Character data - all in same shard
const character = await gameDb.prepare(`
  SELECT * FROM characters WHERE id = ? AND realm_id = ?
`).bind(characterId, realmId).first();

const inventory = await gameDb.prepare(`
  SELECT * FROM character_inventory 
  WHERE character_id = ? AND realm_id = ?
`).bind(characterId, realmId).all();

const abilities = await gameDb.prepare(`
  SELECT * FROM character_abilities
  WHERE character_id = ? AND realm_id = ?
`).bind(characterId, realmId).all();
```

### 2. Cross-Shard Lookups (via KV)

```typescript
// Find which realm a character is on
async function findCharacterRealm(
  characterName: string
): Promise<string | null> {
  // Use global character name index in KV
  const realmId = await kvCache.get(
    `char_name:${characterName.toLowerCase()}`
  );
  return realmId;
}

// Update when creating character
await kvCache.put(
  `char_name:${characterName.toLowerCase()}`,
  realmId,
  { expirationTtl: 86400 * 365 } // 1 year
);
```

### 3. Global Queries (via aggregation)

```typescript
// Leaderboards - aggregate from all shards
async function getGlobalLeaderboard(): Promise<LeaderboardEntry[]> {
  const allRealms = await this.gameDbFactory.getAllRealms();
  
  // Query each realm in parallel
  const realmLeaderboards = await Promise.all(
    allRealms.map(async (realmId) => {
      const db = this.gameDbFactory.getDb(realmId);
      return db.prepare(`
        SELECT 
          player_username,
          character_name,
          realm_id,
          JSON_EXTRACT(attributes, '$.power') as power
        FROM characters
        WHERE is_active = 1
        ORDER BY power DESC
        LIMIT 100
      `).all();
    })
  );

  // Merge and sort
  return realmLeaderboards
    .flat()
    .sort((a, b) => b.power - a.power)
    .slice(0, 100);
}
```

## Migration Checklist

When moving from single DB to sharded:

1. **Deploy new schema** with shard columns
2. **Update all writes** to include realm_id
3. **Deploy KV lookup system**
4. **Create realm selection logic**
5. **Test with single realm** (realm_id = 'main')
6. **Add second realm** when needed
7. **No data migration required!**

## Performance Tips

1. **Batch KV operations** when possible
2. **Cache realm assignments** in memory (Worker state)
3. **Use prepared statements** for repeated queries
4. **Monitor shard sizes** weekly
5. **Pre-warm new shards** before directing traffic