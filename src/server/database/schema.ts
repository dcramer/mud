import { relations } from 'drizzle-orm';
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

/**
 * D1 Schema designed for horizontal scaling from day one.
 *
 * Key principles:
 * 1. Entity groups stay together (character + related data)
 * 2. Denormalize to avoid cross-database joins
 * 3. Include shard keys even when running single database
 * 4. Use composite indexes for shard-aware queries
 */

// ============================================
// AUTH DATABASE TABLES (Never Sharded)
// ============================================

export const players = sqliteTable(
  'players',
  {
    id: text('id').primaryKey(), // crypto.randomUUID()
    username: text('username').notNull().unique(),
    email: text('email').notNull().unique(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    lastLogin: integer('last_login', { mode: 'timestamp' }),
  },
  (table) => ({
    usernameIdx: uniqueIndex('idx_players_username').on(table.username),
    emailIdx: uniqueIndex('idx_players_email').on(table.email),
  }),
);

export const sshKeys = sqliteTable(
  'ssh_keys',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id')
      .notNull()
      .references(() => players.id),
    name: text('name').notNull(),
    publicKey: text('public_key').notNull(),
    fingerprint: text('fingerprint').notNull().unique(),
    lastUsed: integer('last_used', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    playerIdx: index('idx_ssh_keys_player').on(table.playerId),
    fingerprintIdx: uniqueIndex('idx_ssh_keys_fingerprint').on(table.fingerprint),
  }),
);

export const authTokens = sqliteTable(
  'auth_tokens',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id').references(() => players.id),
    email: text('email'),
    token: text('token').notNull().unique(),
    type: text('type').notNull(), // 'magic_link' or 'device'
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    usedAt: integer('used_at', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    tokenIdx: uniqueIndex('idx_auth_tokens_token').on(table.token),
    expiresIdx: index('idx_auth_tokens_expires').on(table.expiresAt),
  }),
);

// ============================================
// GAME DATABASE TABLES (Shardable by Realm)
// ============================================

export const characters = sqliteTable(
  'characters',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id').notNull(),
    realmId: text('realm_id').notNull(), // Shard key!

    // Denormalized from players table to avoid cross-DB joins
    playerUsername: text('player_username').notNull(),

    name: text('name').notNull(),
    rank: text('rank').notNull().default('normal'),

    // Attributes stored as JSON for flexibility
    attributes: text('attributes')
      .notNull()
      .default('{"power":10,"speed":10,"spirit":10,"recovery":10}'),

    // Current state
    currentRoomId: text('current_room_id'),
    currentZoneId: text('current_zone_id'), // For zone-based sharding
    health: integer('health').notNull().default(100),
    maxHealth: integer('max_health').notNull().default(100),
    mana: integer('mana').notNull().default(50),
    maxMana: integer('max_mana').notNull().default(50),
    stamina: integer('stamina').notNull().default(100),
    maxStamina: integer('max_stamina').notNull().default(100),

    // Metadata
    isActive: integer('is_active').notNull().default(1), // 0 or 1
    lastActivity: integer('last_activity', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    // Composite index for shard-aware queries
    realmPlayerIdx: index('idx_characters_realm_player').on(table.realmId, table.playerId),
    realmNameIdx: uniqueIndex('idx_characters_realm_name').on(table.realmId, table.name),
    realmActiveIdx: index('idx_characters_realm_active').on(table.realmId, table.isActive),
    zoneIdx: index('idx_characters_zone').on(table.currentZoneId),
  }),
);

export const characterEssences = sqliteTable(
  'character_essences',
  {
    id: text('id').primaryKey(),
    characterId: text('character_id').notNull(),
    realmId: text('realm_id').notNull(), // Shard key!

    // Denormalized for query efficiency
    characterName: text('character_name').notNull(),
    playerId: text('player_id').notNull(),

    essenceType: text('essence_type').notNull(),
    attributeBound: text('attribute_bound').notNull(),
    rankBonded: text('rank_bonded').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    characterIdx: index('idx_essences_character').on(table.characterId),
    realmCharacterIdx: index('idx_essences_realm_character').on(table.realmId, table.characterId),
  }),
);

export const characterAbilities = sqliteTable(
  'character_abilities',
  {
    id: text('id').primaryKey(),
    characterId: text('character_id').notNull(),
    essenceId: text('essence_id').notNull(),
    realmId: text('realm_id').notNull(), // Shard key!

    // Denormalized
    characterName: text('character_name').notNull(),
    playerId: text('player_id').notNull(),

    abilityName: text('ability_name').notNull(),
    currentRank: text('current_rank').notNull(),
    awakened: integer('awakened').default(0), // 0 or 1
    metadata: text('metadata'), // JSON for ability-specific data
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    characterIdx: index('idx_abilities_character').on(table.characterId),
    realmCharacterIdx: index('idx_abilities_realm_character').on(table.realmId, table.characterId),
  }),
);

export const characterInventory = sqliteTable(
  'character_inventory',
  {
    id: text('id').primaryKey(),
    characterId: text('character_id').notNull(),
    realmId: text('realm_id').notNull(), // Shard key!

    // Denormalized for inventory queries without joins
    characterName: text('character_name').notNull(),
    playerId: text('player_id').notNull(),
    playerUsername: text('player_username').notNull(),

    itemId: text('item_id').notNull(),
    quantity: integer('quantity').notNull().default(1),
    slot: integer('slot'), // null for unequipped items
    metadata: text('metadata'), // JSON for item modifications
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    characterIdx: index('idx_inventory_character').on(table.characterId),
    realmCharacterIdx: index('idx_inventory_realm_character').on(table.realmId, table.characterId),
    slotIdx: index('idx_inventory_slot').on(table.characterId, table.slot),
  }),
);

export const characterSkills = sqliteTable(
  'character_skills',
  {
    id: text('id').primaryKey(),
    characterId: text('character_id').notNull(),
    realmId: text('realm_id').notNull(), // Shard key!

    // Denormalized
    characterName: text('character_name').notNull(),
    playerId: text('player_id').notNull(),

    skillName: text('skill_name').notNull(),
    level: integer('level').notNull().default(1),
    experience: integer('experience').notNull().default(0),
    isPassiveTraining: integer('is_passive_training').default(0), // 0 or 1
    passiveTrainingStarted: integer('passive_training_started', { mode: 'timestamp' }),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    updatedAt: integer('updated_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date())
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    characterIdx: index('idx_skills_character').on(table.characterId),
    realmCharacterIdx: index('idx_skills_realm_character').on(table.realmId, table.characterId),
    trainingIdx: index('idx_skills_training').on(table.isPassiveTraining),
  }),
);

// ============================================
// SOCIAL DATABASE TABLES (Eventually Shardable)
// ============================================

export const sessions = sqliteTable(
  'sessions',
  {
    id: text('id').primaryKey(),
    playerId: text('player_id').notNull(),
    token: text('token').notNull().unique(),

    // Denormalized for session validation without auth DB lookup
    playerUsername: text('player_username').notNull(),

    // Track which realm they're connected to
    realmId: text('realm_id'),
    characterId: text('character_id'),
    characterName: text('character_name'),

    deviceInfo: text('device_info'), // JSON
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    lastActivity: integer('last_activity', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
  },
  (table) => ({
    tokenIdx: uniqueIndex('idx_sessions_token').on(table.token),
    playerIdx: index('idx_sessions_player').on(table.playerId),
    expiresIdx: index('idx_sessions_expires').on(table.expiresAt),
  }),
);

// ============================================
// MARKET DATABASE TABLES (Shardable by Server)
// ============================================

export const marketListings = sqliteTable(
  'market_listings',
  {
    id: text('id').primaryKey(),
    serverId: text('server_id').notNull(), // Shard key!

    // Seller info (denormalized)
    sellerCharacterId: text('seller_character_id').notNull(),
    sellerCharacterName: text('seller_character_name').notNull(),
    sellerPlayerId: text('seller_player_id').notNull(),
    sellerPlayerUsername: text('seller_player_username').notNull(),

    itemId: text('item_id').notNull(),
    itemData: text('item_data').notNull(), // JSON with full item details

    price: integer('price').notNull(),
    quantity: integer('quantity').notNull(),

    status: text('status').notNull().default('active'), // active, sold, cancelled
    createdAt: integer('created_at', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  },
  (table) => ({
    serverItemIdx: index('idx_market_server_item').on(table.serverId, table.itemId),
    serverStatusIdx: index('idx_market_server_status').on(table.serverId, table.status),
    sellerIdx: index('idx_market_seller').on(table.sellerCharacterId),
    expiresIdx: index('idx_market_expires').on(table.expiresAt),
  }),
);

// ============================================
// ANALYTICS DATABASE TABLES (Time-Sharded)
// ============================================

export const playerEvents = sqliteTable(
  'player_events',
  {
    id: text('id').primaryKey(),
    timestamp: integer('timestamp', { mode: 'timestamp' })
      .notNull()
      .$defaultFn(() => new Date()),
    playerId: text('player_id').notNull(),
    characterId: text('character_id'),
    realmId: text('realm_id'),
    eventType: text('event_type').notNull(),
    eventData: text('event_data').notNull(), // JSON

    // Partitioning helper for time-based sharding
    yearMonth: text('year_month').notNull(), // YYYY-MM
  },
  (table) => ({
    timestampIdx: index('idx_events_timestamp').on(table.timestamp),
    playerIdx: index('idx_events_player').on(table.playerId),
    typeIdx: index('idx_events_type').on(table.eventType),
    partitionIdx: index('idx_events_partition').on(table.yearMonth, table.timestamp),
  }),
);

// ============================================
// Define Relations (for Drizzle ORM)
// ============================================

export const playersRelations = relations(players, ({ many }) => ({
  sshKeys: many(sshKeys),
  authTokens: many(authTokens),
}));

export const sshKeysRelations = relations(sshKeys, ({ one }) => ({
  player: one(players, {
    fields: [sshKeys.playerId],
    references: [players.id],
  }),
}));

export const authTokensRelations = relations(authTokens, ({ one }) => ({
  player: one(players, {
    fields: [authTokens.playerId],
    references: [players.id],
  }),
}));
