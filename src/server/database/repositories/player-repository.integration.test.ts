import type { CreatePlayerData } from '@/server/database/types.js';
import { createRepositoryTest } from '@/test/repository-test-base.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { PlayerRepository } from './player-repository.js';

describe('PlayerRepository (Integration)', () => {
  let testContext: ReturnType<typeof createRepositoryTest<PlayerRepository>>;

  beforeEach(() => {
    testContext = createRepositoryTest(
      (connectionString) => new PlayerRepository(connectionString),
    );
  });

  describe('findById', () => {
    it('should return player when found', async () => {
      // Create a player using fixtures
      const player = await testContext.fixtures.createPlayer({
        username: 'testuser',
        email: 'test@example.com',
      });

      const result = await testContext.repository.findById(player.id);

      expect(result).not.toBeNull();
      expect(result?.id).toBe(player.id);
      expect(result?.username).toBe('testuser');
      expect(result?.email).toBe('test@example.com');
      expect(result?.characters).toEqual([]);
    });

    it('should return null when player not found', async () => {
      const result = await testContext.repository.findById('00000000-0000-0000-0000-000000000000');

      expect(result).toBeNull();
    });

    it('should include characters when present', async () => {
      // Create player with character
      const player = await testContext.fixtures.createPlayer({
        username: 'playerWithChar',
        email: 'char@example.com',
      });

      const character = await testContext.fixtures.createCharacter(player.id, {
        name: 'TestCharacter',
        rank: 'iron',
      });

      const result = await testContext.repository.findById(player.id);

      expect(result).not.toBeNull();
      expect(result?.characters).toHaveLength(1);
      expect(result?.characters[0].id).toBe(character.id);
      expect(result?.characters[0].name).toBe('TestCharacter');
    });
  });

  describe('findByUsername', () => {
    it('should return player when found by username', async () => {
      const player = await testContext.fixtures.createPlayer({
        username: 'uniqueuser',
        email: 'unique@example.com',
      });

      const result = await testContext.repository.findByUsername('uniqueuser');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(player.id);
      expect(result?.username).toBe('uniqueuser');
    });

    it('should return null when username not found', async () => {
      const result = await testContext.repository.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should be case sensitive', async () => {
      await testContext.fixtures.createPlayer({
        username: 'CaseSensitive',
        email: 'case@example.com',
      });

      const result1 = await testContext.repository.findByUsername('CaseSensitive');
      const result2 = await testContext.repository.findByUsername('casesensitive');

      expect(result1).not.toBeNull();
      expect(result2).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return player when found by email', async () => {
      const player = await testContext.fixtures.createPlayer({
        username: 'emailuser',
        email: 'findme@example.com',
      });

      const result = await testContext.repository.findByEmail('findme@example.com');

      expect(result).not.toBeNull();
      expect(result?.id).toBe(player.id);
      expect(result?.email).toBe('findme@example.com');
    });

    it('should return null when email not found', async () => {
      const result = await testContext.repository.findByEmail('notfound@example.com');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create new player successfully', async () => {
      const createData: CreatePlayerData = {
        username: 'newuser',
        email: 'new@example.com',
      };

      const result = await testContext.repository.create(createData);

      expect(result).toBeDefined();
      expect(result.username).toBe('newuser');
      expect(result.email).toBe('new@example.com');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastLogin).toBeNull();
      expect(result.characters).toEqual([]);

      // Verify it was actually saved
      const found = await testContext.repository.findById(result.id);
      expect(found).not.toBeNull();
      expect(found?.username).toBe('newuser');
    });

    it('should fail on duplicate username', async () => {
      await testContext.repository.create({
        username: 'duplicate',
        email: 'first@example.com',
      });

      await expect(
        testContext.repository.create({
          username: 'duplicate',
          email: 'second@example.com',
        }),
      ).rejects.toThrow();
    });

    it('should fail on duplicate email', async () => {
      await testContext.repository.create({
        username: 'first',
        email: 'duplicate@example.com',
      });

      await expect(
        testContext.repository.create({
          username: 'second',
          email: 'duplicate@example.com',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateLastLogin', () => {
    it('should update last login timestamp', async () => {
      const player = await testContext.fixtures.createPlayer({
        username: 'loginuser',
        email: 'login@example.com',
      });

      expect(player.lastLogin).toBeNull();

      await testContext.repository.updateLastLogin(player.id);

      const updated = await testContext.repository.findById(player.id);
      expect(updated).not.toBeNull();
      expect(updated?.lastLogin).toBeInstanceOf(Date);
      expect(updated?.lastLogin?.getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
    });

    it('should not throw for non-existent player', async () => {
      await expect(
        testContext.repository.updateLastLogin(crypto.randomUUID()),
      ).resolves.not.toThrow();
    });
  });

  describe('exists', () => {
    it('should return true when player exists', async () => {
      const player = await testContext.fixtures.createPlayer({
        username: 'existinguser',
        email: 'exists@example.com',
      });

      const result = await testContext.repository.exists(player.id);

      expect(result).toBe(true);
    });

    it('should return false when player does not exist', async () => {
      const result = await testContext.repository.exists(crypto.randomUUID());

      expect(result).toBe(false);
    });
  });
});
