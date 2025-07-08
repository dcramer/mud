import * as schema from '@/server/database/schema.js';
import { getTestDb } from '@/server/database/test-setup.js';
import type { Character, Player } from '@/server/database/types.js';

/**
 * Test fixtures for D1/SQLite database
 */
export const fixtures = {
  /**
   * Create a test player
   */
  async createPlayer(data: Partial<{ username: string; email: string }> = {}): Promise<Player> {
    const db = getTestDb();
    const id = crypto.randomUUID();

    const [player] = await db
      .insert(schema.players)
      .values({
        id,
        username: data.username || `testuser_${id.substring(0, 8)}`,
        email: data.email || `test_${id.substring(0, 8)}@example.com`,
        // createdAt handled by $defaultFn in schema
        lastLogin: null,
      })
      .returning();

    if (!player) {
      throw new Error('Failed to create test player');
    }

    return player;
  },

  /**
   * Create a test character
   */
  async createCharacter(
    playerId: string,
    data: Partial<{ name: string; rank: string; realmId: string }> = {},
  ): Promise<Character> {
    const db = getTestDb();
    const id = crypto.randomUUID();

    // Get player username for denormalization
    const [player] = await db
      .select({ username: schema.players.username })
      .from(schema.players)
      .where(eq(schema.players.id, playerId))
      .limit(1);

    if (!player) throw new Error('Player not found');

    const [character] = await db
      .insert(schema.characters)
      .values({
        id,
        playerId,
        realmId: data.realmId || 'test-realm',
        playerUsername: player.username,
        name: data.name || `testchar_${id.substring(0, 8)}`,
        rank: data.rank || 'normal',
        attributes: JSON.stringify({
          power: 10,
          speed: 10,
          spirit: 10,
          recovery: 10,
        }),
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        stamina: 100,
        maxStamina: 100,
        isActive: 1,
        // createdAt and updatedAt handled by $defaultFn in schema
      })
      .returning();

    if (!character) {
      throw new Error('Failed to create test character');
    }

    return character;
  },

  /**
   * Create a test SSH key
   */
  async createSSHKey(
    playerId: string,
    data: Partial<{
      name: string;
      publicKey: string;
      fingerprint: string;
    }> = {},
  ) {
    const db = getTestDb();
    const id = crypto.randomUUID();

    const [sshKey] = await db
      .insert(schema.sshKeys)
      .values({
        id,
        playerId,
        name: data.name || 'Test SSH Key',
        publicKey: data.publicKey || `ssh-rsa AAAAB3NzaC1yc2E... test@example.com`,
        fingerprint: data.fingerprint || `SHA256:test-fingerprint-${id.substring(0, 8)}`,
        lastUsed: null,
        // createdAt handled by $defaultFn in schema
      })
      .returning();

    return sshKey;
  },

  /**
   * Create a test auth token
   */
  async createAuthToken(
    data: Partial<{
      playerId: string;
      email: string;
      type: 'magic_link' | 'device';
      expiresInMinutes: number;
    }> = {},
  ) {
    const db = getTestDb();
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (data.expiresInMinutes || 15) * 60 * 1000);

    const [authToken] = await db
      .insert(schema.authTokens)
      .values({
        id,
        playerId: data.playerId || null,
        email: data.email || null,
        token: `token_${crypto.randomUUID()}`,
        type: data.type || 'magic_link',
        expiresAt,
        usedAt: null,
        // createdAt handled by $defaultFn in schema
      })
      .returning();

    return authToken;
  },

  /**
   * Create a test session
   */
  async createSession(
    playerId: string,
    data: Partial<{
      characterId: string;
      realmId: string;
      expiresInHours: number;
    }> = {},
  ) {
    const db = getTestDb();
    const id = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + (data.expiresInHours || 24) * 3600 * 1000);

    // Get player username
    const [player] = await db
      .select({ username: schema.players.username })
      .from(schema.players)
      .where(eq(schema.players.id, playerId))
      .limit(1);

    if (!player) throw new Error('Player not found');

    let characterName = null;
    if (data.characterId) {
      const [character] = await db
        .select({ name: schema.characters.name })
        .from(schema.characters)
        .where(eq(schema.characters.id, data.characterId))
        .limit(1);

      characterName = character?.name || null;
    }

    const [session] = await db
      .insert(schema.sessions)
      .values({
        id,
        playerId,
        token: `session_${crypto.randomUUID()}`,
        playerUsername: player.username,
        realmId: data.realmId || null,
        characterId: data.characterId || null,
        characterName,
        deviceInfo: JSON.stringify({ os: 'test', version: '1.0' }),
        expiresAt,
        // createdAt and lastActivity handled by $defaultFn in schema
      })
      .returning();

    return session;
  },
};

// Import eq for queries
import { eq } from 'drizzle-orm';
