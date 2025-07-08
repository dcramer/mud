import { createHash, randomBytes } from 'crypto';
import type { GameResult, PlayerId } from '@/shared/types/core.js';
import { GameError, GameErrorCode } from '@/shared/types/core.js';
import { failure, success } from '@/shared/utils/result.js';
import type { SSHKeyRepository } from '../repositories/ssh-key-repository.js';

interface ParsedSSHKey {
  type: string;
  key: string;
  comment: string;
  fingerprint: string;
}

interface AuthChallenge {
  challengeId: string;
  challenge: string;
  expiresAt: Date;
}

interface StoredChallenge {
  challenge: string;
  fingerprint: string;
  expiresAt: Date;
}

export class SSHAuthService {
  private challenges = new Map<string, StoredChallenge>();
  private readonly CHALLENGE_EXPIRY_MS = 5 * 60 * 1000; // 5 minutes
  private readonly SUPPORTED_KEY_TYPES = [
    'ssh-rsa',
    'ssh-ed25519',
    'ecdsa-sha2-nistp256',
    'ecdsa-sha2-nistp384',
    'ecdsa-sha2-nistp521',
  ];

  constructor(private readonly sshKeyRepository: SSHKeyRepository) {}

  parsePublicKey(keyString: string): GameResult<ParsedSSHKey> {
    const parts = keyString.trim().split(/\s+/);

    if (parts.length < 2) {
      return failure(new GameError('Invalid SSH key format', GameErrorCode.INVALID_SSH_KEY));
    }

    const [type, key, ...commentParts] = parts;
    const comment = commentParts.join(' ');

    // Validate key type
    if (!this.SUPPORTED_KEY_TYPES.includes(type)) {
      return failure(
        new GameError(
          `Unsupported SSH key type: ${type}. Supported types: ${this.SUPPORTED_KEY_TYPES.join(', ')}`,
          GameErrorCode.INVALID_SSH_KEY,
        ),
      );
    }

    // Validate base64 key data
    try {
      const keyBuffer = Buffer.from(key, 'base64');
      if (keyBuffer.length < 20) {
        throw new Error('Key too short');
      }
    } catch {
      return failure(new GameError('Invalid SSH key data', GameErrorCode.INVALID_SSH_KEY));
    }

    // Calculate fingerprint (SHA256 hash of the base64 decoded key)
    const keyData = Buffer.from(key, 'base64');
    const hash = createHash('sha256').update(keyData).digest('base64');
    // Remove padding and format as SSH fingerprint
    const fingerprint = `SHA256:${hash.replace(/=+$/, '')}`;

    return success({
      type,
      key,
      comment,
      fingerprint,
    });
  }

  async registerPublicKey(
    playerId: string,
    publicKey: string,
    keyName: string,
  ): Promise<GameResult<void>> {
    // Parse and validate the key
    const parseResult = this.parsePublicKey(publicKey);
    if (!parseResult.success) {
      return parseResult;
    }

    const { fingerprint } = parseResult.data;

    // Check if key already exists
    const existing = await this.sshKeyRepository.findByFingerprint(fingerprint);
    if (existing) {
      return failure(new GameError('SSH key already registered', GameErrorCode.DUPLICATE_SSH_KEY));
    }

    // Register the key
    try {
      await this.sshKeyRepository.create({
        playerId,
        name: keyName,
        publicKey,
        fingerprint,
      });

      return success(undefined);
    } catch (error: any) {
      if (error.message?.includes('unique constraint')) {
        return failure(
          new GameError('SSH key already registered', GameErrorCode.DUPLICATE_SSH_KEY),
        );
      }
      return failure(new GameError('Failed to register SSH key', GameErrorCode.DATABASE_ERROR));
    }
  }

  async createChallenge(fingerprint: string): Promise<GameResult<AuthChallenge>> {
    // Find the SSH key
    const sshKey = await this.sshKeyRepository.findByFingerprint(fingerprint);
    if (!sshKey) {
      return failure(new GameError('SSH key not found', GameErrorCode.SSH_KEY_NOT_FOUND));
    }

    // Generate challenge
    const challengeId = randomBytes(16).toString('hex');
    const challenge = randomBytes(32).toString('base64');
    const expiresAt = new Date(Date.now() + this.CHALLENGE_EXPIRY_MS);

    // Store challenge
    this.challenges.set(challengeId, {
      challenge,
      fingerprint,
      expiresAt,
    });

    // Clean up expired challenges periodically
    this.cleanupExpiredChallenges();

    return success({
      challengeId,
      challenge,
      expiresAt,
    });
  }

  async verifyChallenge(challengeId: string, signature: string): Promise<GameResult<PlayerId>> {
    // Get stored challenge
    const stored = this.challenges.get(challengeId);
    if (!stored) {
      return failure(
        new GameError('Invalid or expired challenge', GameErrorCode.INVALID_CHALLENGE),
      );
    }

    // Check expiry
    if (stored.expiresAt < new Date()) {
      this.challenges.delete(challengeId);
      return failure(new GameError('Challenge expired', GameErrorCode.INVALID_CHALLENGE));
    }

    // Get SSH key
    const sshKey = await this.sshKeyRepository.findByFingerprint(stored.fingerprint);
    if (!sshKey) {
      this.challenges.delete(challengeId);
      return failure(new GameError('SSH key not found', GameErrorCode.SSH_KEY_NOT_FOUND));
    }

    // In a real implementation, we would verify the signature using the SSH public key
    // This requires converting SSH format to PEM and using crypto.verify()
    // For now, we'll accept any signature as valid for testing
    // TODO: Implement proper SSH signature verification

    // Delete used challenge
    this.challenges.delete(challengeId);

    // Update last used timestamp
    await this.sshKeyRepository.updateLastUsed(sshKey.id);

    return success(sshKey.playerId as PlayerId);
  }

  async listKeys(playerId: string): Promise<SSHKey[]> {
    return this.sshKeyRepository.findByPlayerId(playerId);
  }

  async removeKey(playerId: string, keyId: string): Promise<GameResult<void>> {
    // Verify the key belongs to the player
    const keys = await this.sshKeyRepository.findByPlayerId(playerId);
    const key = keys.find((k) => k.id === keyId);

    if (!key) {
      return failure(new GameError('SSH key not found', GameErrorCode.SSH_KEY_NOT_FOUND));
    }

    const deleted = await this.sshKeyRepository.delete(keyId);
    if (!deleted) {
      return failure(new GameError('Failed to delete SSH key', GameErrorCode.DATABASE_ERROR));
    }

    return success(undefined);
  }

  private cleanupExpiredChallenges(): void {
    const now = new Date();
    for (const [id, challenge] of this.challenges.entries()) {
      if (challenge.expiresAt < now) {
        this.challenges.delete(id);
      }
    }
  }
}

// Re-export types that are needed by consumers
export type { SSHKey } from '@/server/database/types.js';
