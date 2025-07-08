import { createRepositoryTest } from '@/test/repository-test-base.js';
import { beforeEach, describe, expect, it } from 'vitest';
import { SSHKeyRepository } from './ssh-key-repository.js';

describe('SSHKeyRepository (Integration)', () => {
  let testContext: ReturnType<typeof createRepositoryTest<SSHKeyRepository>>;
  let testPlayerId: string;

  beforeEach(async () => {
    testContext = createRepositoryTest(
      (connectionString) => new SSHKeyRepository(connectionString),
    );

    // Create a test player for SSH keys
    const player = await testContext.fixtures.createPlayer({
      username: 'sshkeyuser',
      email: 'sshkey@example.com',
    });
    testPlayerId = player.id;
  });

  describe('findByFingerprint', () => {
    it('should return SSH key when found', async () => {
      // Create an SSH key using fixtures
      const createdKey = await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'Test Key',
        publicKey: 'ssh-rsa AAAAB3NzaC1yc2E... test@example.com',
        fingerprint: 'SHA256:unique-fingerprint-123',
      });

      const result = await testContext.repository.findByFingerprint(
        'SHA256:unique-fingerprint-123',
      );

      expect(result).not.toBeNull();
      expect(result?.id).toBe(createdKey.id);
      expect(result?.name).toBe('Test Key');
      expect(result?.fingerprint).toBe('SHA256:unique-fingerprint-123');
    });

    it('should return null when key not found', async () => {
      const result = await testContext.repository.findByFingerprint('SHA256:non-existent');

      expect(result).toBeNull();
    });
  });

  describe('findByPlayerId', () => {
    it('should return all SSH keys for a player', async () => {
      // Create multiple SSH keys
      await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'Laptop Key',
        publicKey: 'ssh-rsa AAAAB3NzaC1yc2E... laptop@example.com',
        fingerprint: 'SHA256:laptop-key-123',
      });

      await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'Desktop Key',
        publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5... desktop@example.com',
        fingerprint: 'SHA256:desktop-key-456',
      });

      const result = await testContext.repository.findByPlayerId(testPlayerId);

      expect(result).toHaveLength(2);
      expect(result.map((k) => k.name).sort()).toEqual(['Desktop Key', 'Laptop Key']);
    });

    it('should return empty array when player has no keys', async () => {
      const result = await testContext.repository.findByPlayerId(testPlayerId);

      expect(result).toEqual([]);
    });

    it('should not return keys from other players', async () => {
      // Create another player
      const otherPlayer = await testContext.fixtures.createPlayer({
        username: 'otheruser',
        email: 'other@example.com',
      });

      // Create keys for both players
      await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'My Key',
        fingerprint: 'SHA256:my-key',
      });

      await testContext.fixtures.createSSHKey(otherPlayer.id, {
        name: 'Other Key',
        fingerprint: 'SHA256:other-key',
      });

      const result = await testContext.repository.findByPlayerId(testPlayerId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('My Key');
    });
  });

  describe('create', () => {
    it('should create new SSH key', async () => {
      const createData = {
        playerId: testPlayerId,
        name: 'New SSH Key',
        publicKey: 'ssh-rsa AAAAB3NzaC1yc2E... new@example.com',
        fingerprint: 'SHA256:new-key-fingerprint',
      };

      const result = await testContext.repository.create(createData);

      expect(result).toBeDefined();
      expect(result.name).toBe('New SSH Key');
      expect(result.fingerprint).toBe('SHA256:new-key-fingerprint');
      expect(result.createdAt).toBeInstanceOf(Date);
      expect(result.lastUsed).toBeNull();

      // Verify it was saved
      const found = await testContext.repository.findByFingerprint('SHA256:new-key-fingerprint');
      expect(found).not.toBeNull();
    });

    it('should fail on duplicate fingerprint', async () => {
      // Create first key
      await testContext.repository.create({
        playerId: testPlayerId,
        name: 'First Key',
        publicKey: 'ssh-rsa AAAAB3NzaC1yc2E...',
        fingerprint: 'SHA256:duplicate-fingerprint',
      });

      // Try to create with same fingerprint
      await expect(
        testContext.repository.create({
          playerId: testPlayerId,
          name: 'Second Key',
          publicKey: 'ssh-rsa AAAAB3NzaC1yc2E...',
          fingerprint: 'SHA256:duplicate-fingerprint',
        }),
      ).rejects.toThrow();
    });
  });

  describe('updateLastUsed', () => {
    it('should update last used timestamp', async () => {
      const key = await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'Update Test Key',
        fingerprint: 'SHA256:update-test',
      });

      expect(key.lastUsed).toBeNull();

      await testContext.repository.updateLastUsed(key.id);

      const updated = await testContext.repository.findByFingerprint('SHA256:update-test');
      expect(updated).not.toBeNull();
      expect(updated?.lastUsed).toBeInstanceOf(Date);
      expect(updated?.lastUsed?.getTime()).toBeCloseTo(Date.now(), -3); // Within 1 second
    });

    it('should not throw for non-existent key', async () => {
      await expect(
        testContext.repository.updateLastUsed(crypto.randomUUID()),
      ).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete SSH key', async () => {
      const key = await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'Delete Test Key',
        fingerprint: 'SHA256:delete-test',
      });

      const deleteResult = await testContext.repository.delete(key.id);
      expect(deleteResult).toBe(true);

      // Verify it was deleted
      const found = await testContext.repository.findByFingerprint('SHA256:delete-test');
      expect(found).toBeNull();
    });

    it('should return false when key not found', async () => {
      const result = await testContext.repository.delete(crypto.randomUUID());
      expect(result).toBe(false);
    });

    it('should only delete the specified key', async () => {
      // Create two keys
      const key1 = await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'Keep Key',
        fingerprint: 'SHA256:keep-key',
      });

      const key2 = await testContext.fixtures.createSSHKey(testPlayerId, {
        name: 'Delete Key',
        fingerprint: 'SHA256:delete-key',
      });

      await testContext.repository.delete(key2.id);

      // Verify only one was deleted
      const remaining = await testContext.repository.findByPlayerId(testPlayerId);
      expect(remaining).toHaveLength(1);
      expect(remaining[0].name).toBe('Keep Key');
    });
  });
});
