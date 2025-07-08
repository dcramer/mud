// Database and persistence types

import type { EntityId, PlayerId, RoomId } from './core.js';
import type { AttributeType, Rank } from './game.js';

// Database entity types matching our Drizzle schema
export interface PlayerRecord {
  id: PlayerId;
  username: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
  lastLogin?: Date;
}

export interface CharacterRecord {
  id: EntityId;
  playerId: PlayerId;
  name: string;
  rank: Rank;

  // Attributes
  power: number;
  speed: number;
  spirit: number;
  recovery: number;

  // Current state
  currentRoomId?: RoomId;
  health: number;
  mana: number;
  stamina: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface EssenceRecord {
  id: string;
  characterId: EntityId;
  essenceType: string;
  attributeBound: AttributeType;
  rankBonded: Rank;
  createdAt: Date;
}

export interface AbilityRecord {
  id: string;
  characterId: EntityId;
  essenceId: string;
  abilityName: string;
  currentRank: Rank;
  awakened: boolean;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface InventoryRecord {
  id: string;
  characterId: EntityId;
  itemId: string;
  quantity: number;
  slot?: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface RoomRecord {
  id: RoomId;
  areaId: string;
  title: string;
  description: string;
  exits: Record<string, string>;
  properties: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

// Service interfaces
export interface DatabaseService {
  // Player operations
  getPlayer(playerId: PlayerId): Promise<PlayerRecord | null>;
  savePlayer(player: PlayerRecord): Promise<void>;

  // Character operations
  getCharacter(characterId: EntityId): Promise<CharacterRecord | null>;
  saveCharacter(character: CharacterRecord): Promise<void>;

  // Room operations
  getRoom(roomId: RoomId): Promise<RoomRecord | null>;
  saveRoom(room: RoomRecord): Promise<void>;
}
