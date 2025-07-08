# D1 Database Design Guide

## Overview

This guide documents how to structure our D1 database for scale from day one, avoiding common pitfalls and planning for growth within D1's constraints.

## D1 Scaling Strategy

### 1. Understanding D1 Limits
- **10GB per database** - Plan data distribution before hitting this
- **No connection pooling needed** - Each Worker request isolated
- **SQLite under the hood** - Design around SQLite's strengths
- **Global replication** - Data available at edge locations

### 2. Data Distribution Architecture

#### Sharding by Domain
```typescript
// Separate databases by logical domain
const databases = {
  core: 'player-auth-db',      // Players, sessions (~1GB)
  game: 'game-world-db',       // Characters, inventory (~3GB)  
  social: 'social-db',         // Chat, friends (~2GB)
  analytics: 'analytics-db',   // Events, metrics (~4GB)
};
```

#### Hot vs Cold Data
```typescript
// D1 for persistent data
const d1Data = {
  players: true,           // Persistent, needs consistency
  characters: true,        // Persistent, needs transactions
  worldRooms: true,        // Static, rarely changes
};

// KV for cache layer
const kvCache = {
  sessions: true,          // Hot, TTL-based
  roomDescriptions: true,  // Read-heavy, cacheable
  onlinePlayers: true,     // Ephemeral state
};

// Durable Objects for real-time
const durableObjects = {
  activeRooms: true,       // Live player positions
  combatState: true,       // Real-time combat
  partyGroups: true,       // Temporary formations
};
```

### 3. Schema Design for Scale

#### Efficient ID Strategy
```typescript
// Use TEXT for IDs but keep them efficient
id: text('id').primaryKey() // 36 chars for UUID

// For high-volume tables, consider shorter IDs
id: text('id').primaryKey() // 21 chars for nanoid
```

#### Minimize Storage
```typescript
// Store timestamps as integers (Unix seconds)
created_at: integer('created_at').notNull()

// Use INTEGER for booleans
is_active: integer('is_active').default(1) // 0 or 1

// Compress JSON data
metadata: text('metadata') // Consider compression for large JSON
```

#### Strategic Denormalization
```sql
-- Instead of joining across tables frequently
CREATE TABLE character_profiles (
  id TEXT PRIMARY KEY,
  -- Denormalized for read performance
  player_username TEXT NOT NULL,
  character_name TEXT NOT NULL,
  character_level INTEGER NOT NULL,
  last_seen INTEGER NOT NULL
);
```

### 4. Query Patterns for Scale

#### Pagination Strategy
```sql
-- Use cursor-based pagination for large datasets
SELECT * FROM characters 
WHERE created_at < ? 
ORDER BY created_at DESC 
LIMIT 20;
```

#### Batch Loading
```typescript
// Load related data in batches to avoid N+1
const players = await db.batch(
  playerIds.map(id => 
    db.prepare("SELECT * FROM players WHERE id = ?").bind(id)
  )
);
```

## D1-Specific Optimizations

### 1. Index Strategy
```sql
-- Critical indexes for a MUD game
CREATE INDEX idx_characters_player_id ON characters(player_id);
CREATE INDEX idx_characters_room ON characters(current_room_id);
CREATE INDEX idx_inventory_character ON character_inventory(character_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

-- Composite indexes for common queries
CREATE INDEX idx_character_player_active 
  ON characters(player_id, is_active);
```

### 2. Query Optimization
```typescript
// Minimize data transfer
const activeCharacters = await db.prepare(`
  SELECT id, name, current_room_id 
  FROM characters 
  WHERE player_id = ? AND is_active = 1
`).bind(playerId).all();

// Use EXISTS for existence checks
const hasCharacter = await db.prepare(`
  SELECT EXISTS(
    SELECT 1 FROM characters WHERE player_id = ? LIMIT 1
  ) as has_char
`).bind(playerId).first();
```

### 3. Write Patterns
```typescript
// Batch inserts when possible
const stmt = db.prepare(`
  INSERT INTO character_inventory (id, character_id, item_id, quantity)
  VALUES (?, ?, ?, ?)
`);

await db.batch(
  items.map(item => 
    stmt.bind(crypto.randomUUID(), characterId, item.id, item.quantity)
  )
);
```

## Scaling Milestones

### Phase 1: Launch (0-1K players)
- Single D1 database is fine
- Monitor query performance
- Establish baseline metrics

### Phase 2: Growth (1K-10K players)
- Implement KV caching layer
- Move sessions to KV
- Add read replicas via caching

### Phase 3: Scale (10K+ players)
- Shard by realm/world
- Implement Durable Objects for rooms
- Archive old data to R2

## Monitoring and Alerts

### Database Size Tracking
```typescript
// Monitor weekly
async function checkDatabaseSize() {
  const result = await db.prepare(`
    SELECT 
      page_count * page_size / 1024 / 1024 as size_mb
    FROM pragma_page_count(), pragma_page_size()
  `).first();
  
  if (result.size_mb > 8000) { // 8GB warning
    console.error('Database approaching size limit!');
  }
}
```

### Query Performance
```typescript
// Log slow queries
const start = Date.now();
const result = await db.prepare(query).bind(...params).all();
const duration = Date.now() - start;

if (duration > 100) { // 100ms threshold
  console.warn(`Slow query: ${duration}ms`, query);
}
```

## Data Archival Strategy

### 1. Time-based Archival
```typescript
// Move old data to separate archive database
async function archiveOldSessions() {
  const cutoff = Date.now() / 1000 - (90 * 24 * 60 * 60); // 90 days
  
  await db.prepare(`
    INSERT INTO archive_db.sessions 
    SELECT * FROM sessions WHERE created_at < ?
  `).bind(cutoff).run();
  
  await db.prepare(`
    DELETE FROM sessions WHERE created_at < ?
  `).bind(cutoff).run();
}
```

### 2. Cold Storage
- Move inactive player data to R2
- Keep active player cache in D1
- Lazy-load from R2 when needed

## Schema Patterns

### 1. Soft Deletes
```sql
-- Add to all player-visible content
deleted_at INTEGER DEFAULT NULL,
-- Index for filtering
CREATE INDEX idx_not_deleted ON items(deleted_at) WHERE deleted_at IS NULL;
```

### 2. Event Sourcing for Critical Data
```sql
-- Log all important state changes
CREATE TABLE character_events (
  id TEXT PRIMARY KEY,
  character_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_data TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  INDEX idx_character_events (character_id, created_at)
);

-- CRITICAL: Item transfer audit log (append-only)
CREATE TABLE item_transfer_log (
  id TEXT PRIMARY KEY,
  from_character_id TEXT NOT NULL,
  from_character_name TEXT NOT NULL,
  to_character_id TEXT NOT NULL,
  to_character_name TEXT NOT NULL,
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  transfer_type TEXT NOT NULL, -- 'trade', 'drop', 'pickup', 'quest', 'admin'
  metadata TEXT, -- JSON with context (location, trade_id, etc)
  created_at INTEGER NOT NULL,
  INDEX idx_transfers_from (from_character_id, created_at),
  INDEX idx_transfers_to (to_character_id, created_at),
  INDEX idx_transfers_item (item_id, created_at)
);
```

### 3. Versioning for Game Data
```sql
-- Track schema/data versions
CREATE TABLE game_versions (
  component TEXT PRIMARY KEY,
  version INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
```

## Critical Implementation Notes

### Item Transfer Logging (REQUIRED)
**IMPORTANT**: Every item transfer MUST be logged to `item_transfer_log` table for:
- Bug investigation and item restoration
- Exploit/duping detection  
- Customer support tools
- Economy health monitoring

See `/docs/wip/item-tracking-requirements.md` for full requirements.

## Enforcement Checklist

Before implementing any database feature:
- [ ] Calculate storage impact at scale
- [ ] Plan sharding strategy if needed
- [ ] Identify what goes in D1 vs KV vs Durable Objects
- [ ] Create appropriate indexes
- [ ] Test with realistic data volumes
- [ ] Plan archival strategy for old data
- [ ] Monitor query performance
- [ ] Ensure audit logging for critical operations (especially items)