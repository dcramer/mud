# D1 Architecture Proposal for MUD

## Overview

This document explores how we could architect our MUD game using Cloudflare D1 instead of PostgreSQL.

## Key Architectural Changes

### 1. Database Sharding Strategy

Given D1's 10GB limit per database, we'd need to shard our data:

```typescript
// Database per realm/world
const realmDatabases = {
  'realm-1': 'd1-realm-1',
  'realm-2': 'd1-realm-2',
  // Each realm gets its own D1 instance
};

// Separate databases for different concerns
const databases = {
  auth: 'd1-auth',        // Players, sessions, auth tokens
  realm1: 'd1-realm-1',   // Characters, game data for realm 1
  realm2: 'd1-realm-2',   // Characters, game data for realm 2
  social: 'd1-social',    // Friends, guilds, chat history
  economy: 'd1-economy',  // Trades, marketplace
};
```

### 2. Connection Architecture

Since D1 doesn't support TCP connections, we'd need to use Cloudflare Workers:

```typescript
// All database operations through Workers
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const db = env.DB; // D1 binding
    
    // Handle WebSocket upgrade for game connections
    if (request.headers.get('Upgrade') === 'websocket') {
      return handleWebSocketUpgrade(request, env);
    }
    
    // Regular HTTP API
    return handleHttpRequest(request, env);
  },
};
```

### 3. Data Model Adjustments

Adapt our schema for SQLite's limitations:

```sql
-- SQLite doesn't support arrays/jsonb as richly as PostgreSQL
-- Store complex data as JSON strings
CREATE TABLE characters (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  name TEXT NOT NULL UNIQUE,
  -- Store attributes as JSON
  attributes TEXT NOT NULL DEFAULT '{"power":10,"speed":10,"spirit":10,"recovery":10}',
  -- Store inventory as JSON array
  inventory TEXT NOT NULL DEFAULT '[]',
  created_at INTEGER NOT NULL DEFAULT (unixepoch()),
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);

-- Use triggers for updated_at since SQLite lacks some PostgreSQL features
CREATE TRIGGER update_characters_updated_at 
AFTER UPDATE ON characters
BEGIN
  UPDATE characters SET updated_at = unixepoch() WHERE id = NEW.id;
END;
```

### 4. Distributed Game State

Handle eventual consistency with proper game design:

```typescript
// Use Durable Objects for real-time game state
export class GameRoom extends DurableObject {
  private connections = new Map<string, WebSocket>();
  private roomState: RoomState;
  
  async handleConnection(ws: WebSocket, playerId: string) {
    // Real-time state in Durable Object
    this.connections.set(playerId, ws);
    
    // Persist important state to D1 asynchronously
    this.env.DB.prepare(
      'INSERT INTO room_events (room_id, player_id, event_type, data) VALUES (?, ?, ?, ?)'
    ).bind(this.roomId, playerId, 'join', JSON.stringify({})).run();
  }
}
```

### 5. Migration Strategy

```typescript
// Drizzle config for D1
export default defineConfig({
  dialect: 'sqlite',  // D1 uses SQLite
  driver: 'd1',
  dbCredentials: {
    wranglerConfigPath: 'wrangler.toml',
    dbName: 'mud-db',
  },
});
```

## Pros of This Approach

1. **Global edge deployment**: Players get low latency worldwide
2. **No infrastructure management**: Truly serverless
3. **Cost-effective**: Pay only for what you use
4. **Built-in disaster recovery**: Time Travel for rollbacks
5. **Scales horizontally**: Add more databases as needed

## Cons of This Approach

1. **Complexity**: Managing multiple databases and sharding
2. **Feature limitations**: No advanced PostgreSQL features
3. **Vendor lock-in**: Tied to Cloudflare ecosystem
4. **Size constraints**: Need to carefully manage 10GB limits
5. **Consistency challenges**: Eventual consistency requires careful design

## Recommendation

**For a production MUD game, I would NOT recommend D1** for the following reasons:

1. **Size limitations**: MUDs can grow large with player data, logs, and game state
2. **Complex queries**: MUDs often need complex joins and queries that PostgreSQL handles better
3. **Real-time requirements**: TCP connections and strong consistency are important for game state
4. **Ecosystem**: PostgreSQL has better tooling, monitoring, and operational experience

**D1 would be good for:**
- Smaller, experimental MUD projects
- MUD website/forums/wiki (separate from game server)
- Player statistics/leaderboards that can tolerate eventual consistency
- Chat history or other non-critical game data

## Alternative Hybrid Approach

Use PostgreSQL for core game data and D1 for edge cases:

```typescript
// Core game data in PostgreSQL
const gameDb = postgres(DATABASE_URL);

// Edge data in D1 (via Workers)
const edgeData = {
  leaderboards: 'd1-leaderboards',
  analytics: 'd1-analytics',
  staticContent: 'd1-content',
};
```

This gives you the best of both worlds: PostgreSQL's power for game logic and D1's edge performance for suitable use cases.