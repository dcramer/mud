import type { AuthToken } from '@/server/database/types.js';
import { eq, lt } from 'drizzle-orm';
import type { DrizzleDb } from '../../database/connection.js';
import * as schema from '../../database/schema.js';

export class AuthTokenRepository {
  constructor(private db: DrizzleDb) {}

  async findByToken(token: string): Promise<AuthToken | null> {
    const result = await this.db
      .select()
      .from(schema.authTokens)
      .where(eq(schema.authTokens.token, token))
      .limit(1);

    return result[0] || null;
  }

  async createMagicLink(
    email: string | null,
    token: string,
    expiresAt: Date,
    playerId?: string,
  ): Promise<AuthToken> {
    const id = crypto.randomUUID();

    const [created] = await this.db
      .insert(schema.authTokens)
      .values({
        id,
        playerId: playerId || null,
        email: email || null,
        token,
        type: 'magic_link',
        expiresAt,
        usedAt: null,
        // createdAt handled by $defaultFn in schema
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create magic link token');
    }

    return created;
  }

  async createDeviceToken(playerId: string, token: string, expiresAt: Date): Promise<AuthToken> {
    const id = crypto.randomUUID();

    const [created] = await this.db
      .insert(schema.authTokens)
      .values({
        id,
        playerId,
        email: null,
        token,
        type: 'device',
        expiresAt,
        usedAt: null,
        // createdAt handled by $defaultFn in schema
      })
      .returning();

    if (!created) {
      throw new Error('Failed to create device token');
    }

    return created;
  }

  async markAsUsed(tokenId: string): Promise<void> {
    await this.db
      .update(schema.authTokens)
      .set({ usedAt: new Date() })
      .where(eq(schema.authTokens.id, tokenId));
  }

  async deleteExpiredTokens(): Promise<number> {
    const now = new Date();

    const result = await this.db
      .delete(schema.authTokens)
      .where(lt(schema.authTokens.expiresAt, now))
      .returning();

    return result.length;
  }

  async isValidToken(token: string): Promise<boolean> {
    const authToken = await this.findByToken(token);

    if (!authToken) {
      return false;
    }

    const now = new Date();

    // Check if expired (compare Date objects)
    if (authToken.expiresAt < now) {
      return false;
    }

    // Check if already used
    if (authToken.usedAt !== null) {
      return false;
    }

    return true;
  }
}
