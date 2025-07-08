import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../connection.js';
import * as schema from '../schema.js';
import type { Character, CreateCharacterData, UpdateCharacterData } from '../types.js';

export class CharacterRepository {
  constructor(private db: DrizzleDb) {}

  async findById(characterId: string): Promise<Character | null> {
    const result = await this.db
      .select()
      .from(schema.characters)
      .where(eq(schema.characters.id, characterId))
      .limit(1);

    return result[0] || null;
  }

  async findByPlayerId(playerId: string): Promise<Character[]> {
    const results = await this.db
      .select()
      .from(schema.characters)
      .where(eq(schema.characters.playerId, playerId));

    return results;
  }

  async findByName(name: string, realmId = 'main'): Promise<Character | null> {
    const result = await this.db
      .select()
      .from(schema.characters)
      .where(and(eq(schema.characters.name, name), eq(schema.characters.realmId, realmId)))
      .limit(1);

    return result[0] || null;
  }

  async create(data: CreateCharacterData): Promise<Character> {
    const id = data.id || crypto.randomUUID();

    const [character] = await this.db
      .insert(schema.characters)
      .values({
        id,
        playerId: data.playerId,
        realmId: data.realmId || 'main',
        playerUsername: data.playerUsername,
        name: data.name,
        rank: data.rank || 'normal',
        attributes:
          data.attributes ||
          JSON.stringify({
            power: 10,
            speed: 10,
            spirit: 10,
            recovery: 10,
          }),
        currentRoomId: data.currentRoomId || null,
        currentZoneId: data.currentZoneId || null,
        health: data.health || 100,
        maxHealth: data.maxHealth || 100,
        mana: data.mana || 50,
        maxMana: data.maxMana || 50,
        stamina: data.stamina || 100,
        maxStamina: data.maxStamina || 100,
        isActive: data.isActive ?? 1,
        lastActivity: data.lastActivity || new Date(),
        // createdAt and updatedAt handled by $defaultFn in schema
      })
      .returning();

    if (!character) {
      throw new Error('Failed to create character');
    }

    return character;
  }

  async update(characterId: string, updates: UpdateCharacterData): Promise<Character | null> {
    const [character] = await this.db
      .update(schema.characters)
      .set({
        ...updates,
        // updatedAt handled by $onUpdateFn in schema
      })
      .where(eq(schema.characters.id, characterId))
      .returning();

    return character || null;
  }

  async delete(characterId: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.characters)
      .where(eq(schema.characters.id, characterId))
      .returning();

    return result.length > 0;
  }

  async updateLastActivity(characterId: string): Promise<void> {
    await this.db
      .update(schema.characters)
      .set({
        lastActivity: new Date(),
        // updatedAt handled by $onUpdateFn in schema
      })
      .where(eq(schema.characters.id, characterId));
  }

  async setActiveStatus(characterId: string, isActive: boolean): Promise<void> {
    await this.db
      .update(schema.characters)
      .set({
        isActive: isActive ? 1 : 0,
        // updatedAt handled by $onUpdateFn in schema
      })
      .where(eq(schema.characters.id, characterId));
  }
}
