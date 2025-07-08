#!/usr/bin/env node

import Database from 'better-sqlite3';
import chalk from 'chalk';

/**
 * Initialize local database with schema
 */
async function initLocalDb() {
  console.log(chalk.cyan('Initializing local database...'));

  try {
    const sqlite = new Database('src/server/database/.db/local.db');

    // Enable foreign keys
    sqlite.pragma('foreign_keys = ON');

    // Create all tables
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

    sqlite.exec(createTables);

    // Create indexes
    console.log(chalk.gray('Creating indexes...'));

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

    sqlite.exec(createIndexes);

    console.log(chalk.green('✓ Database initialized successfully!'));

    sqlite.close();
  } catch (error) {
    console.error(chalk.red('Failed to initialize database:'), error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initLocalDb();
}
