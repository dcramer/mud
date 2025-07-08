import { eq } from 'drizzle-orm';
import type { DrizzleDb } from '../connection.js';
import * as schema from '../schema.js';
import type { CreatePlayerData, Player } from '../types.js';

export class PlayerRepository {
  constructor(private db: DrizzleDb) {}

  async findById(playerId: string): Promise<Player | null> {
    try {
      const result = await this.db
        .select()
        .from(schema.players)
        .where(eq(schema.players.id, playerId))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      // Log error in production, return null for now
      return null;
    }
  }

  async findByUsername(username: string): Promise<Player | null> {
    try {
      const result = await this.db
        .select()
        .from(schema.players)
        .where(eq(schema.players.username, username))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      return null;
    }
  }

  async findByEmail(email: string): Promise<Player | null> {
    try {
      const result = await this.db
        .select()
        .from(schema.players)
        .where(eq(schema.players.email, email))
        .limit(1);

      return result[0] || null;
    } catch (error) {
      return null;
    }
  }

  async create(playerData: CreatePlayerData): Promise<Player> {
    const id = playerData.id || crypto.randomUUID();

    const [player] = await this.db
      .insert(schema.players)
      .values({
        id,
        username: playerData.username,
        email: playerData.email,
        // createdAt is handled by $defaultFn in schema
        lastLogin: playerData.lastLogin ?? null,
      })
      .returning();

    if (!player) {
      throw new Error('Failed to create player');
    }

    return player;
  }

  async updateLastLogin(playerId: string): Promise<void> {
    await this.db
      .update(schema.players)
      .set({ lastLogin: new Date() })
      .where(eq(schema.players.id, playerId));
  }

  async exists(playerId: string): Promise<boolean> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(playerId)) {
        return false;
      }

      const result = await this.db
        .select({ count: schema.players.id })
        .from(schema.players)
        .where(eq(schema.players.id, playerId))
        .limit(1);

      return result.length > 0;
    } catch (error) {
      // Invalid UUID or database error
      return false;
    }
  }
}
