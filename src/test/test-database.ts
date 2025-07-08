import * as schema from '@/server/database/schema.js';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import type { BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';

let testDb: BetterSQLite3Database<typeof schema> | null = null;
let sqliteDb: Database.Database | null = null;

/**
 * Create an in-memory test database
 */
export async function createTestDatabase(): Promise<BetterSQLite3Database<typeof schema>> {
  if (testDb) {
    return testDb;
  }

  // Create in-memory database
  sqliteDb = new Database(':memory:');
  sqliteDb.pragma('foreign_keys = ON');

  // Create schema
  const createTables = `
    -- Players table
    CREATE TABLE IF NOT EXISTS players (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      last_login INTEGER
    );

    -- SSH Keys table
    CREATE TABLE IF NOT EXISTS ssh_keys (
      id TEXT PRIMARY KEY,
      player_id TEXT NOT NULL REFERENCES players(id),
      name TEXT NOT NULL,
      public_key TEXT NOT NULL,
      fingerprint TEXT NOT NULL UNIQUE,
      last_used INTEGER,
      created_at INTEGER NOT NULL
    );

    -- Auth Tokens table
    CREATE TABLE IF NOT EXISTS auth_tokens (
      id TEXT PRIMARY KEY,
      player_id TEXT REFERENCES players(id),
      email TEXT,
      token TEXT NOT NULL UNIQUE,
      type TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      used_at INTEGER,
      created_at INTEGER NOT NULL
    );

    -- Sessions table
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
    );

    -- Characters table
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
    );
  `;

  sqliteDb.exec(createTables);

  // Create indexes
  const createIndexes = `
    -- Player indexes
    CREATE UNIQUE INDEX IF NOT EXISTS idx_players_username ON players(username);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_players_email ON players(email);
    
    -- SSH key indexes
    CREATE INDEX IF NOT EXISTS idx_ssh_keys_player ON ssh_keys(player_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_ssh_keys_fingerprint ON ssh_keys(fingerprint);
    
    -- Auth token indexes
    CREATE UNIQUE INDEX IF NOT EXISTS idx_auth_tokens_token ON auth_tokens(token);
    CREATE INDEX IF NOT EXISTS idx_auth_tokens_expires ON auth_tokens(expires_at);
    
    -- Session indexes
    CREATE UNIQUE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
    CREATE INDEX IF NOT EXISTS idx_sessions_player ON sessions(player_id);
    CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);
    
    -- Character indexes
    CREATE INDEX IF NOT EXISTS idx_characters_realm_player ON characters(realm_id, player_id);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_characters_realm_name ON characters(realm_id, name);
  `;

  sqliteDb.exec(createIndexes);

  testDb = drizzle(sqliteDb, { schema });
  return testDb;
}

/**
 * Get the test database instance
 */
export function getTestDatabase(): BetterSQLite3Database<typeof schema> {
  if (!testDb) {
    throw new Error('Test database not initialized. Call createTestDatabase() first.');
  }
  return testDb;
}

/**
 * Clear all data from the test database
 */
export async function clearTestDatabase(): Promise<void> {
  if (!sqliteDb) return;

  // Delete in reverse order due to foreign keys
  const tables = ['sessions', 'auth_tokens', 'ssh_keys', 'characters', 'players'];

  for (const table of tables) {
    try {
      sqliteDb.exec(`DELETE FROM ${table}`);
    } catch (error) {
      // Table might not exist
    }
  }
}

/**
 * Teardown the test database
 */
export async function teardownTestDatabase(): Promise<void> {
  if (sqliteDb) {
    sqliteDb.close();
    sqliteDb = null;
  }
  testDb = null;
}
