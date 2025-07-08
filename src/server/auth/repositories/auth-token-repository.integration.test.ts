import * as schema from '@/server/database/schema.js';
import { getTestDb } from '@/server/database/test-setup.js';
import type { AuthToken } from '@/server/database/types.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthTokenRepository } from './auth-token-repository.js';

describe('AuthTokenRepository (Integration)', () => {
  let repository: AuthTokenRepository;
  let db: ReturnType<typeof getTestDb>;
  let testPlayerId: string;

  beforeEach(async () => {
    const connectionString =
      process.env.TEST_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/mud_test';
    repository = new AuthTokenRepository(connectionString);
    db = getTestDb();

    // Create a test player
    const [player] = await db
      .insert(schema.players)
      .values({
        username: 'tokenuser',
        email: 'token@example.com',
      })
      .returning();
    testPlayerId = player.id;
  });

  describe('findByToken', () => {
    it('should return token when found', async () => {
      const [createdToken] = await db
        .insert(schema.authTokens)
        .values({
          playerId: testPlayerId,
          token: 'test-token-123',
          type: 'magic_link',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        })
        .returning();

      const result = await repository.findByToken('test-token-123');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdToken.id);
      expect(result?.token).toBe('test-token-123');
      expect(result?.type).toBe('magic_link');
    });

    it('should return null when token not found', async () => {
      const result = await repository.findByToken('non-existent-token');

      expect(result).toBeNull();
    });
  });

  describe('createMagicLink', () => {
    it('should create magic link token for registration', async () => {
      const email = 'newuser@example.com';
      const token = `magic_${crypto.randomUUID()}`;
      const expiresAt = new Date(Date.now() + 900000); // 15 minutes

      const result = await repository.createMagicLink(email, token, expiresAt);

      expect(result).toBeDefined();
      expect(result.email).toBe(email);
      expect(result.token).toBe(token);
      expect(result.type).toBe('magic_link');
      expect(result.playerId).toBeNull();
      expect(result.expiresAt).toEqual(expiresAt);
      expect(result.usedAt).toBeNull();

      // Verify it was saved
      const found = await repository.findByToken(token);
      expect(found).not.toBeNull();
    });

    it('should create magic link token for existing player', async () => {
      const token = `magic_${crypto.randomUUID()}`;
      const expiresAt = new Date(Date.now() + 900000);

      const result = await repository.createMagicLink(null, token, expiresAt, testPlayerId);

      expect(result).toBeDefined();
      expect(result.playerId).toBe(testPlayerId);
      expect(result.email).toBeNull();
      expect(result.type).toBe('magic_link');
    });

    it('should fail on duplicate token', async () => {
      const duplicateToken = 'duplicate-token';
      const expiresAt = new Date(Date.now() + 900000);

      await repository.createMagicLink('first@example.com', duplicateToken, expiresAt);

      await expect(
        repository.createMagicLink('second@example.com', duplicateToken, expiresAt),
      ).rejects.toThrow();
    });
  });

  describe('createDeviceToken', () => {
    it('should create device token', async () => {
      const token = `device_${crypto.randomUUID()}`;
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const result = await repository.createDeviceToken(testPlayerId, token, expiresAt);

      expect(result).toBeDefined();
      expect(result.playerId).toBe(testPlayerId);
      expect(result.token).toBe(token);
      expect(result.type).toBe('device');
      expect(result.expiresAt).toEqual(expiresAt);
    });
  });

  describe('markAsUsed', () => {
    it('should mark token as used', async () => {
      const [token] = await db
        .insert(schema.authTokens)
        .values({
          playerId: testPlayerId,
          token: 'unused-token',
          type: 'magic_link',
          expiresAt: new Date(Date.now() + 3600000),
          usedAt: null,
        })
        .returning();

      expect(token.usedAt).toBeNull();

      await repository.markAsUsed(token.id);

      const updated = await repository.findByToken('unused-token');
      expect(updated).not.toBeNull();
      expect(updated?.usedAt).toBeInstanceOf(Date);
      expect(updated?.usedAt?.getTime()).toBeCloseTo(Date.now(), -3);
    });

    it('should not throw for non-existent token', async () => {
      await expect(repository.markAsUsed(crypto.randomUUID())).resolves.not.toThrow();
    });
  });

  describe('deleteExpiredTokens', () => {
    it('should delete only expired tokens', async () => {
      // Create expired and valid tokens
      await db.insert(schema.authTokens).values([
        {
          token: 'expired-1',
          type: 'magic_link',
          expiresAt: new Date(Date.now() - 3600000), // 1 hour ago
        },
        {
          token: 'expired-2',
          type: 'device',
          expiresAt: new Date(Date.now() - 7200000), // 2 hours ago
        },
        {
          token: 'valid-1',
          type: 'magic_link',
          expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
        },
      ]);

      const deletedCount = await repository.deleteExpiredTokens();

      expect(deletedCount).toBe(2);

      // Verify expired tokens are gone
      const expired1 = await repository.findByToken('expired-1');
      const expired2 = await repository.findByToken('expired-2');
      const valid1 = await repository.findByToken('valid-1');

      expect(expired1).toBeNull();
      expect(expired2).toBeNull();
      expect(valid1).not.toBeNull();
    });

    it('should return 0 when no expired tokens', async () => {
      // Create only valid tokens
      await db.insert(schema.authTokens).values({
        token: 'valid-token',
        type: 'magic_link',
        expiresAt: new Date(Date.now() + 3600000),
      });

      const deletedCount = await repository.deleteExpiredTokens();

      expect(deletedCount).toBe(0);
    });
  });

  describe('isValidToken', () => {
    it('should return true for unexpired unused token', async () => {
      await db.insert(schema.authTokens).values({
        playerId: testPlayerId,
        token: 'valid-token',
        type: 'magic_link',
        expiresAt: new Date(Date.now() + 3600000), // Future
        usedAt: null,
      });

      const result = await repository.isValidToken('valid-token');

      expect(result).toBe(true);
    });

    it('should return false for expired token', async () => {
      await db.insert(schema.authTokens).values({
        playerId: testPlayerId,
        token: 'expired-token',
        type: 'magic_link',
        expiresAt: new Date(Date.now() - 3600000), // Past
        usedAt: null,
      });

      const result = await repository.isValidToken('expired-token');

      expect(result).toBe(false);
    });

    it('should return false for used token', async () => {
      await db.insert(schema.authTokens).values({
        playerId: testPlayerId,
        token: 'used-token',
        type: 'magic_link',
        expiresAt: new Date(Date.now() + 3600000),
        usedAt: new Date(), // Already used
      });

      const result = await repository.isValidToken('used-token');

      expect(result).toBe(false);
    });

    it('should return false for non-existent token', async () => {
      const result = await repository.isValidToken('non-existent');

      expect(result).toBe(false);
    });
  });
});
