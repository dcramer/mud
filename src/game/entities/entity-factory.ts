import { createEntityId } from '@/shared/types/core.js';
import type {
  CombatComponent,
  Component,
  Entity,
  EssenceComponent,
  InventoryComponent,
  LocationComponent,
} from '@/shared/types/game.js';

/**
 * Factory for creating game entities with proper typing
 */
export class EntityFactory {
  /**
   * Create a player entity
   */
  static createPlayer(data: {
    id?: string;
    roomId: string;
    health?: number;
    maxHealth?: number;
    mana?: number;
    maxMana?: number;
    stamina?: number;
    maxStamina?: number;
    attributes?: {
      power: number;
      speed: number;
      spirit: number;
      recovery: number;
    };
  }): Entity {
    const entityId = createEntityId(data.id || crypto.randomUUID());
    const components = new Map<string, Component>();

    // Location component
    const location: LocationComponent = {
      type: 'location',
      roomId: data.roomId as any,
    };
    components.set('location', location);

    // Combat component
    const combat: CombatComponent = {
      type: 'combat',
      health: data.health ?? 100,
      maxHealth: data.maxHealth ?? 100,
      mana: data.mana ?? 50,
      maxMana: data.maxMana ?? 50,
      stamina: data.stamina ?? 100,
      maxStamina: data.maxStamina ?? 100,
      attributes: data.attributes ?? {
        power: 10,
        speed: 10,
        spirit: 10,
        recovery: 10,
      },
      abilities: [],
      activeEffects: [],
      combatState: 'idle',
    };
    components.set('combat', combat);

    // Inventory component
    const inventory: InventoryComponent = {
      type: 'inventory',
      items: [],
      maxSlots: 20,
      expansionLevel: 0,
      equipment: {},
      currency: {
        spiritCoins: 0,
        regularCoins: 0,
      },
    };
    components.set('inventory', inventory);

    // Essence component
    const essence: EssenceComponent = {
      type: 'essence',
      essences: [],
      maxEssences: 5,
    };
    components.set('essence', essence);

    return {
      id: entityId,
      components,
    };
  }

  /**
   * Create an NPC entity
   */
  static createNPC(data: {
    id?: string;
    roomId: string;
    health?: number;
    maxHealth?: number;
  }): Entity {
    const entityId = createEntityId(data.id || crypto.randomUUID());
    const components = new Map<string, Component>();

    // Location component
    const location: LocationComponent = {
      type: 'location',
      roomId: data.roomId as any,
    };
    components.set('location', location);

    // Combat component (simplified for NPCs)
    const combat: CombatComponent = {
      type: 'combat',
      health: data.health ?? 50,
      maxHealth: data.maxHealth ?? 50,
      mana: 0,
      maxMana: 0,
      stamina: 100,
      maxStamina: 100,
      attributes: {
        power: 5,
        speed: 5,
        spirit: 5,
        recovery: 5,
      },
      abilities: [],
      activeEffects: [],
      combatState: 'idle',
    };
    components.set('combat', combat);

    return {
      id: entityId,
      components,
    };
  }

  /**
   * Create an item entity
   */
  static createItem(data: {
    id?: string;
    roomId?: string;
    name: string;
    description: string;
    value?: number;
  }): Entity {
    const entityId = createEntityId(data.id || crypto.randomUUID());
    const components = new Map<string, Component>();

    // If the item is on the ground, add location
    if (data.roomId) {
      const location: LocationComponent = {
        type: 'location',
        roomId: data.roomId as any,
      };
      components.set('location', location);
    }

    // Item-specific component (would be defined in a real implementation)
    const item: Component = {
      type: 'item',
      // Additional item properties would go here
    };
    components.set('item', item);

    return {
      id: entityId,
      components,
    };
  }
}
