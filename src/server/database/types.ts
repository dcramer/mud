/**
 * Database types - use Drizzle's schema inference instead of custom interfaces
 */

import type * as schema from './schema.js';

// Direct exports of Drizzle inferred types
export type Player = typeof schema.players.$inferSelect;
export type CreatePlayerData = typeof schema.players.$inferInsert;

export type Character = typeof schema.characters.$inferSelect;
export type CreateCharacterData = typeof schema.characters.$inferInsert;

export type CharacterEssence = typeof schema.characterEssences.$inferSelect;
export type CreateCharacterEssenceData = typeof schema.characterEssences.$inferInsert;

export type CharacterAbility = typeof schema.characterAbilities.$inferSelect;
export type CreateCharacterAbilityData = typeof schema.characterAbilities.$inferInsert;

export type CharacterInventory = typeof schema.characterInventory.$inferSelect;
export type CreateCharacterInventoryData = typeof schema.characterInventory.$inferInsert;

export type CharacterSkill = typeof schema.characterSkills.$inferSelect;
export type CreateCharacterSkillData = typeof schema.characterSkills.$inferInsert;

// Auth types
export type SSHKey = typeof schema.sshKeys.$inferSelect;
export type CreateSSHKeyData = typeof schema.sshKeys.$inferInsert;

export type AuthToken = typeof schema.authTokens.$inferSelect;
export type CreateAuthTokenData = typeof schema.authTokens.$inferInsert;

export type Session = typeof schema.sessions.$inferSelect;
export type CreateSessionData = typeof schema.sessions.$inferInsert;

// Market types
export type MarketListing = typeof schema.marketListings.$inferSelect;
export type CreateMarketListingData = typeof schema.marketListings.$inferInsert;

// Analytics types
export type PlayerEvent = typeof schema.playerEvents.$inferSelect;
export type CreatePlayerEventData = typeof schema.playerEvents.$inferInsert;

// Helper types for common operations
export type UpdatePlayerData = Partial<Omit<Player, 'id' | 'createdAt'>>;
export type UpdateCharacterData = Partial<Omit<Character, 'id' | 'playerId' | 'createdAt'>>;
export type UpdateSSHKeyData = Partial<Omit<SSHKey, 'id' | 'playerId' | 'createdAt'>>;
export type UpdateAuthTokenData = Partial<Omit<AuthToken, 'id' | 'token' | 'createdAt'>>;
export type UpdateSessionData = Partial<Omit<Session, 'id' | 'playerId' | 'token' | 'createdAt'>>;
