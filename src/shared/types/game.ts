// Game-specific types following ECS patterns from our docs

import type { EntityId, PlayerId, RoomId } from './core.js';

// Re-export types that are used elsewhere
export type { EntityId, PlayerId, RoomId } from './core.js';

// Standard enums from our docs
export enum Direction {
  North = 'north',
  South = 'south',
  East = 'east',
  West = 'west',
  Up = 'up',
  Down = 'down',
  Northeast = 'northeast',
  Northwest = 'northwest',
  Southeast = 'southeast',
  Southwest = 'southwest',
}

export enum Rank {
  Normal = 'normal',
  Iron = 'iron',
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Diamond = 'diamond',
}

export enum AttributeType {
  Power = 'power',
  Speed = 'speed',
  Spirit = 'spirit',
  Recovery = 'recovery',
}

// ECS Core interfaces (industry standard)
export interface Component {
  readonly type: string;
}

export interface Entity {
  readonly id: EntityId;
  readonly components: ReadonlyMap<string, Component>;
}

// Component definitions following our docs
export interface LocationComponent extends Component {
  readonly type: 'location';
  roomId: RoomId;
  coordinates?: { x: number; y: number; z: number };
  facing?: Direction;
}

export interface CombatComponent extends Component {
  readonly type: 'combat';
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
  attributes: {
    power: number;
    speed: number;
    spirit: number;
    recovery: number;
  };
  abilities: Ability[];
  activeEffects: StatusEffect[];
  combatState: 'idle' | 'combat' | 'cooldown';
}

export interface InventoryComponent extends Component {
  readonly type: 'inventory';
  items: InventoryItem[];
  maxSlots: number;
  expansionLevel: number;
  equipment: {
    weapon?: EquippedItem;
    armor?: EquippedItem;
    accessories?: EquippedItem[];
  };
  currency: {
    spiritCoins: number;
    regularCoins: number;
  };
}

export interface EssenceComponent extends Component {
  readonly type: 'essence';
  essences: Array<{
    id: string;
    type: EssenceType;
    attributeBound: AttributeType;
    rankBonded: Rank;
    abilities: EssenceAbility[];
  }>;
  maxEssences: number;
}

// Supporting game types
export interface Ability {
  id: string;
  name: string;
  description: string;
  manaCost: number;
  cooldown: number;
  requiredRank: Rank;
  effects: AbilityEffect[];
}

export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number;
  effects: StatusEffectModifier[];
}

export interface InventoryItem {
  id: string;
  quantity: number;
  metadata?: Record<string, unknown>;
}

export interface EquippedItem {
  itemId: string;
  bonuses: Record<string, number>;
  enchantments?: string[];
}

// Placeholder types for full implementation
export type EssenceType = string;
export type EssenceAbility = unknown;
export type AbilityEffect = unknown;
export type StatusEffectModifier = unknown;

// Entity queries (ECS standard)
export interface EntityQuery {
  with: string[];
  without?: string[];
  any?: string[];
}

// Character representation for UI/client use
export interface Character {
  id: string;
  name: string;
  level: number;
  rank: string;
  attributes: {
    power: number;
    speed: number;
    spirit: number;
    recovery: number;
  };
  health: number;
  maxHealth: number;
  mana: number;
  maxMana: number;
  stamina: number;
  maxStamina: number;
}
