import Database from 'better-sqlite3';
import { sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import * as schema from './schema.js';

let testDb: ReturnType<typeof drizzle> | null = null;

/**
 * Get or create test database instance
 */
export function getTestDb() {
  if (!testDb) {
    // Use in-memory SQLite for tests
    const sqlite = new Database(':memory:');

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    testDb = drizzle(sqlite, { schema });

    // Run migrations
    createTestSchema(testDb);
  }

  return testDb;
}

/**
 * Create test schema
 */
function createTestSchema(db: ReturnType<typeof drizzle>) {
  // Create players table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_login INTEGER
    )
  `);

  // Create indexes
  db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username ON players(username)`);
  db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email ON players(email)`);

  // Create ssh_keys table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS ssh_keys (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id),
      name TEXT NOT NULL,
      public_key TEXT NOT NULL,
      fingerprint TEXT NOT NULL UNIQUE,
      last_used INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(sql`CREATE INDEX IF NOT EXISTS idx_ssh_keys_player ON ssh_keys(player_id)`);
  db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_ssh_keys_fingerprint ON ssh_keys(fingerprint)`);

  // Create auth_tokens table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      player_id TEXT REFERENCES players(id),
      email TEXT,
      token TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL
    )
  `);

  db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at)`);

  // Create characters table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS characters (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      realm_id TEXT NOT NULL,
      player_username TEXT NOT NULL,
      name TEXT NOT NULL,
      rank TEXT NOT NULL DEFAULT 'normal',
      attributes TEXT NOT NULL DEFAULT '{"power":10,"speed":10,"spirit":10,"recovery":10}',
      current_room_id TEXT,
      current_zone_id TEXT,
      health INTEGER NOT NULL DEFAULT 100,
      max_health INTEGER NOT NULL DEFAULT 100,
      mana INTEGER NOT NULL DEFAULT 50,
      max_mana INTEGER NOT NULL DEFAULT 50,
      stamina INTEGER NOT NULL DEFAULT 100,
      max_stamina INTEGER NOT NULL DEFAULT 100,
      is_active INTEGER NOT NULL DEFAULT 1,
      last_activity INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  db.run(
    sql`CREATE INDEX IF NOT EXISTS idx_characters_realm_player ON characters(realm_id, player_id)`,
  );
  db.run(
    sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_realm_name ON characters(realm_id, name)`,
  );

  // Create sessions table
  db.run(sql`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL,
      token TEXT NOT NULL UNIQUE,
      player_username TEXT NOT NULL,
      realm_id TEXT,
      character_id TEXT,
      character_name TEXT,
      device_info TEXT,
      expires_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      last_activity INTEGER NOT NULL
    )
  `);

  db.run(sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id)`);
  db.run(sql`CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at)`);
}

/**
 * Clear all data from test database
 */
export async function clearAllTables(): Promise<void> {
  const db = getTestDb();

  // Disable foreign key checks temporarily
  db.run(sql`PRAGMA foreign_keys = OFF`);

  // Get all table names
  const tables = db.all<{ name: string }>(
    sql`SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'`,
  );

  // Clear each table
  for (const table of tables) {
    db.run(sql.raw(`DELETE FROM ${table.name}`));
  }

  // Re-enable foreign key checks
  db.run(sql`PRAGMA foreign_keys = ON`);
}

/**
 * Reset test database
 */
export function resetTestDb(): void {
  testDb = null;
}

/**
 * Setup test database for vitest
 */
export async function setupTestDatabase(): Promise<void> {
  getTestDb();
}

/**
 * Teardown test database for vitest
 */
export async function teardownTestDatabase(): Promise<void> {
  resetTestDb();
}
