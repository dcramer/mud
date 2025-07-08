# Database Sharding Analysis for MUD Architecture

## Executive Summary

Based on extensive research into MUD/MMO sharding practices and analysis of our current schema, this document provides concrete recommendations for designing a database architecture that supports future sharding without requiring data migration. The analysis considers D1's constraints (separate databases, no cross-database joins) and successful patterns from production MMOs.

## Key Findings

### 1. Common MMO Sharding Strategies

**Geographic/Zone-Based Sharding**
- Most common approach in MMOs (World of Warcraft, EverQuest)
- Natural boundaries make logical sense for players
- Can lead to load imbalances in popular zones

**Player-Based Sharding**
- Players assigned to "home worlds" or realms
- Ensures friends can play together if they choose same realm
- Used by Final Fantasy XIV, Guild Wars 2

**Hybrid Approaches**
- Combine multiple strategies for optimal performance
- EVE Online uses single-shard with dedicated hardware for busy systems
- Some games shard by function (chat, economy, gameplay)

### 2. Data Isolation Analysis

Based on our schema analysis, here's how tables can be categorized:

**Highly Isolated (Easy to Shard)**
- `rooms` - Static world data, can be replicated per shard
- `sshKeys`, `authTokens` - Authentication data, belongs in auth shard
- `sessions` - Ephemeral data, perfect for KV storage

**Moderately Coupled (Requires Colocation)**
- `characters` + related tables (essences, abilities, inventory, skills)
- These form an "entity group" that should stay together
- All reference the character_id foreign key

**Cross-Cutting Concerns (Challenging)**
- `players` - Referenced by characters across potential shards
- Social features (future: friends, guilds, chat)
- Economy/marketplace (future: trades between players)

### 3. Cross-Shard Query Patterns

Research revealed four primary workarounds for D1's no-join limitation:

1. **Reference Table Replication**: Copy static data to all shards
2. **Entity Group Colocation**: Keep related data on same shard
3. **Lookup Indexes**: Mapping tables to find data location
4. **Precomputed Joins**: Denormalized views for performance

## Concrete Recommendations

### 1. Immediate Schema Optimizations

```sql
-- Add shard_id to enable future partitioning
ALTER TABLE characters ADD COLUMN shard_id TEXT DEFAULT 'main';
ALTER TABLE character_essences ADD COLUMN shard_id TEXT DEFAULT 'main';
ALTER TABLE character_abilities ADD COLUMN shard_id TEXT DEFAULT 'main';
ALTER TABLE character_inventory ADD COLUMN shard_id TEXT DEFAULT 'main';
ALTER TABLE character_skills ADD COLUMN shard_id TEXT DEFAULT 'main';

-- Create composite indexes for shard-aware queries
CREATE INDEX idx_characters_shard_player ON characters(shard_id, player_id);
CREATE INDEX idx_characters_shard_name ON characters(shard_id, name);
```

### 2. Database Architecture Strategy

```typescript
// Proposed database separation for D1
const databases = {
  // Core authentication database (small, rarely changes)
  auth: {
    tables: ['players', 'sshKeys', 'authTokens'],
    size: '~100MB',
    sharding: 'none', // Single source of truth
  },
  
  // Game world databases (shardable by realm)
  realm_main: {
    tables: ['characters', 'character_*', 'rooms'],
    size: '~2-3GB per realm',
    sharding: 'by_realm',
  },
  
  // Social/economy database (cross-realm features)
  social: {
    tables: ['friends', 'guilds', 'chat_history', 'marketplace'],
    size: '~1GB',
    sharding: 'none initially, later by region',
  },
  
  // Analytics/logging database
  analytics: {
    tables: ['events', 'metrics', 'audit_logs'],
    size: '~4GB',
    sharding: 'by_time', // Archive old data
  },
};
```

### 3. Entity Group Design Pattern

```typescript
// Keep related data together to avoid cross-shard queries
interface CharacterEntityGroup {
  // Root entity
  character: {
    id: string;
    player_id: string; // Denormalize from auth DB
    player_username: string; // Denormalize for display
    shard_id: string;
    // ... other fields
  };
  
  // Child entities (all share character_id)
  essences: CharacterEssence[];
  abilities: CharacterAbility[];
  inventory: CharacterInventory[];
  skills: CharacterSkill[];
}

// Query pattern - single shard access
async function loadCharacter(characterId: string, shardId: string) {
  const db = getShardDatabase(shardId);
  
  // All data on same shard, can use joins
  return db.query.characters.findFirst({
    where: and(
      eq(characters.id, characterId),
      eq(characters.shard_id, shardId)
    ),
    with: {
      essences: true,
      abilities: true,
      inventory: true,
      skills: true,
    },
  });
}
```

### 4. Denormalization Strategy

```sql
-- Denormalize frequently accessed player data
ALTER TABLE characters ADD COLUMN player_username TEXT;
ALTER TABLE characters ADD COLUMN player_email TEXT;

-- Denormalize room data for quick lookups
CREATE TABLE room_cache (
  room_id TEXT PRIMARY KEY,
  area_id TEXT NOT NULL,
  title TEXT NOT NULL,
  brief_description TEXT NOT NULL,
  exits TEXT NOT NULL, -- JSON array
  player_count INTEGER DEFAULT 0,
  last_updated INTEGER NOT NULL
);
```

### 5. Cross-Shard Communication Patterns

```typescript
// Use KV for cross-shard player lookups
interface PlayerShardMapping {
  player_id: string;
  username: string;
  active_shard: string;
  active_character_id?: string;
  online: boolean;
}

// Store in KV with TTL
await env.PLAYER_SHARD_MAP.put(
  `player:${playerId}`,
  JSON.stringify(mapping),
  { expirationTtl: 3600 } // 1 hour TTL
);

// Cross-shard messaging via Durable Objects
export class CrossShardMessenger extends DurableObject {
  async sendMessage(fromShard: string, toPlayerId: string, message: any) {
    // Find target shard
    const mapping = await env.PLAYER_SHARD_MAP.get(`player:${toPlayerId}`);
    if (!mapping) return;
    
    const target = JSON.parse(mapping);
    const targetShard = env.GAME_SHARDS.get(
      env.GAME_SHARDS.idFromName(target.active_shard)
    );
    
    // Route message to appropriate shard
    await targetShard.fetch('/message', {
      method: 'POST',
      body: JSON.stringify({ toPlayerId, message }),
    });
  }
}
```

### 6. Migration Path

**Phase 1: Single Database (Launch)**
- Use default 'main' shard_id for all data
- Monitor growth patterns and hotspots
- Implement denormalization gradually

**Phase 2: Functional Sharding (1K+ players)**
- Separate auth database
- Move sessions to KV
- Split analytics to separate database

**Phase 3: Realm Sharding (10K+ players)**
- Create new realms as separate databases
- New players choose realm at character creation
- Each realm is fully self-contained

**Phase 4: Geographic Distribution (50K+ players)**
- Deploy realm databases to regional data centers
- Use Cloudflare's global network for routing
- Implement cross-region communication patterns

### 7. Schema Design Rules for Sharding

1. **Always include shard_id** in shardable tables
2. **Denormalize user-facing data** (usernames, display names)
3. **Avoid cross-entity foreign keys** except within entity groups
4. **Use UUIDs** for all IDs to avoid conflicts
5. **Design for eventual consistency** in cross-shard features
6. **Separate hot and cold data** (active vs archived)

### 8. Query Pattern Guidelines

```typescript
// DO: Query within a shard
const character = await db.query.characters.findFirst({
  where: and(
    eq(characters.name, 'PlayerName'),
    eq(characters.shard_id, 'realm-1')
  ),
});

// DON'T: Query across shards
// This would require multiple database connections
const allCharacters = await getAllShards().map(shard => 
  shard.query.characters.findMany()
);

// DO: Use lookup tables for cross-shard data
const playerShard = await env.PLAYER_SHARD_MAP.get(`player:${playerId}`);
const character = await getShardDatabase(playerShard).query...
```

## Testing Recommendations

1. **Load test with sharding simulation** even on single database
2. **Benchmark denormalized vs normalized queries**
3. **Test cross-shard messaging latency**
4. **Simulate shard failures and recovery**
5. **Monitor query patterns for optimization opportunities**

## Conclusion

By implementing these patterns from day one, the MUD can scale from hundreds to millions of players without major architectural changes. The key is designing for distribution even when running on a single database, making future sharding a configuration change rather than a code rewrite.

The combination of D1's edge deployment, KV caching, and Durable Objects for real-time state provides a modern, scalable architecture that learns from 20+ years of MMO development while leveraging cutting-edge serverless technology.