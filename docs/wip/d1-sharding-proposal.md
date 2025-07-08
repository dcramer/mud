# D1 Sharding Proposal

## Executive Summary

Design our database schema for sharding from day one, even when running on a single D1 instance. This allows us to scale horizontally without data migration, only adding new databases as we grow.

## Core Principle: Entity Group Sharding

Keep related data together, minimize cross-shard queries, and design for eventual distribution.

## Proposed Database Separation

### 1. Auth Database (Never Sharded)
```typescript
// d1-auth: ~100MB, globally shared
- players (id, username, email, created_at, last_login)
- ssh_keys (player lookups)
- auth_tokens (ephemeral)
```

### 2. Game Databases (Shardable by Realm)
```typescript
// d1-game-{realm}: ~3GB per realm
- characters (with denormalized player_username)
- character_essences
- character_abilities  
- character_inventory
- character_skills
- rooms (world data)
- npcs
- items
```

### 3. Social Database (Eventually Shardable)
```typescript
// d1-social: ~1GB
- friends
- guilds
- guild_members
- private_messages
- block_lists
```

### 4. Market Database (Shardable by Server)
```typescript
// d1-market-{server}: ~2GB per server
- market_listings
- transaction_history
- price_history
```

### 5. Analytics Database (Time-Sharded)
```typescript
// d1-analytics-{YYYY-MM}: ~500MB/month
- player_events
- combat_logs
- chat_logs (public)
- system_metrics
```

## Schema Changes for Sharding

### 1. Add Shard Keys
```sql
-- Characters table gets realm assignment
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  realm_id TEXT NOT NULL, -- Shard key!
  player_username TEXT NOT NULL, -- Denormalized!
  -- ... rest of fields
  INDEX idx_realm_player (realm_id, player_id)
);
```

### 2. Denormalize Critical Data
```sql
-- Avoid cross-database joins by storing commonly needed data
CREATE TABLE character_inventory (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  character_name TEXT NOT NULL, -- Denormalized!
  player_id TEXT NOT NULL, -- Denormalized!
  player_username TEXT NOT NULL, -- Denormalized!
  item_id TEXT NOT NULL,
  -- Allows inventory queries without joining characters
);
```

### 3. Use Composite Keys
```sql
-- Market listings include server in key
CREATE TABLE market_listings (
  id TEXT PRIMARY KEY,
  server_id TEXT NOT NULL,
  seller_character_id TEXT NOT NULL,
  seller_name TEXT NOT NULL, -- Denormalized
  item_id TEXT NOT NULL,
  price INTEGER NOT NULL,
  INDEX idx_server_item (server_id, item_id)
);
```

## Query Patterns

### Within-Shard Queries (Fast)
```typescript
// All character data in same shard
const character = await gameDb.prepare(`
  SELECT * FROM characters WHERE id = ? AND realm_id = ?
`).bind(characterId, realmId).first();

const inventory = await gameDb.prepare(`
  SELECT * FROM character_inventory WHERE character_id = ?
`).bind(characterId).all();
```

### Cross-Shard Lookups (Use KV)
```typescript
// Store player->realm mapping in KV
await env.PLAYER_REALM.put(
  `player:${playerId}`,
  JSON.stringify({ 
    realm_id: realmId,
    character_ids: [...]
  })
);

// Fast lookup without querying all shards
const playerRealm = await env.PLAYER_REALM.get(`player:${playerId}`);
```

## Migration Path

### Phase 1: Launch (0-1K players)
- Single D1 instance with all tables
- Shard columns present but unused
- All realm_id = 'main'

### Phase 2: Functional Split (1K-10K players)
```typescript
// Split into functional databases
const dbs = {
  auth: env.D1_AUTH,
  game: env.D1_GAME_MAIN,
  social: env.D1_SOCIAL,
  market: env.D1_MARKET_MAIN,
};
```

### Phase 3: Realm Sharding (10K+ players)
```typescript
// Multiple game realms
const gameDb = getGameDb(player.realm_id);
// Returns env.D1_GAME_ALPHA, env.D1_GAME_BETA, etc.
```

### Phase 4: Geographic Distribution (50K+ players)
```typescript
// Realms in different regions
const realmConfig = {
  'us-alpha': { db: 'D1_GAME_US_ALPHA', region: 'us' },
  'eu-alpha': { db: 'D1_GAME_EU_ALPHA', region: 'eu' },
  'asia-alpha': { db: 'D1_GAME_ASIA_ALPHA', region: 'asia' },
};
```

## Implementation Guidelines

### 1. Repository Pattern Updates
```typescript
export class CharacterRepository {
  constructor(
    private gameDb: D1Database,
    private authDb: D1Database,
    private kv: KVNamespace
  ) {}

  async create(data: CreateCharacterData): Promise<Character> {
    // Get player info from auth DB
    const player = await this.authDb
      .prepare("SELECT username FROM players WHERE id = ?")
      .bind(data.playerId)
      .first();

    // Create in game DB with denormalized data
    const character = await this.gameDb
      .prepare(`
        INSERT INTO characters (
          id, player_id, realm_id, player_username, name, ...
        ) VALUES (?, ?, ?, ?, ?, ...)
      `)
      .bind(
        generateId(),
        data.playerId,
        data.realmId,
        player.username, // Denormalized!
        data.name,
        ...
      )
      .run();

    // Update KV mapping
    await this.updatePlayerRealmMapping(data.playerId, data.realmId);
  }
}
```

### 2. Cross-Shard Communication
```typescript
// Use Durable Objects for cross-realm features
export class CrossRealmChat implements DurableObject {
  async handleMessage(realm: string, message: ChatMessage) {
    // Broadcast to all connected realms
    const realms = await this.getActiveRealms();
    for (const targetRealm of realms) {
      if (targetRealm !== realm) {
        await this.forwardMessage(targetRealm, message);
      }
    }
  }
}
```

### 3. Monitoring Shard Health
```typescript
async function getShardMetrics(shardId: string): Promise<ShardMetrics> {
  const db = getGameDb(shardId);
  
  const metrics = await db.prepare(`
    SELECT 
      COUNT(DISTINCT player_id) as active_players,
      COUNT(*) as total_characters,
      (SELECT COUNT(*) FROM character_inventory) as total_items
    FROM characters
    WHERE last_activity > ?
  `).bind(Date.now() - 86400000).first(); // 24h active
  
  const size = await db.prepare(`
    SELECT page_count * page_size / 1024 / 1024 as size_mb
    FROM pragma_page_count(), pragma_page_size()
  `).first();
  
  return { ...metrics, ...size, shardId };
}
```

## Benefits of This Approach

1. **No Data Migration**: New shards are empty, old data stays put
2. **Gradual Scaling**: Add shards as needed
3. **Query Performance**: Most queries stay within one shard
4. **Flexibility**: Can shard by realm, geography, or load
5. **Cost Effective**: Only create databases as needed

## Open Questions

1. **Character Transfers**: How do we handle moving between realms?
2. **Global Features**: Leaderboards, global chat, world events?
3. **Shard Balancing**: How do we prevent one shard from growing too large?

## Next Steps

1. Update schema with shard keys and denormalized fields
2. Create repository interfaces that support multi-database queries
3. Implement KV-based lookup system for cross-shard data
4. Design realm selection system for new players