import crypto from 'node:crypto';
import type { DrizzleDb } from '@/server/database/connection.js';
import { PlayerRepository } from '@/server/database/repositories/player-repository.js';
import type { AuthToken, Player } from '@/server/database/types.js';
import { GameResult } from '@/shared/utils/result.js';
import { AuthTokenRepository } from '../repositories/auth-token-repository.js';

export interface MagicLinkRequest {
  email: string;
}

export interface MagicLinkVerifyRequest {
  token: string;
}

export interface MagicLinkResult {
  player: Player;
  isNewPlayer: boolean;
}

export class MagicLinkService {
  private authTokenRepo: AuthTokenRepository;
  private playerRepo: PlayerRepository;
  private readonly TOKEN_EXPIRY_MINUTES = 15;

  constructor(db: DrizzleDb) {
    this.authTokenRepo = new AuthTokenRepository(db);
    this.playerRepo = new PlayerRepository(db);
  }

  /**
   * Generate a magic link token for email authentication
   */
  async generateMagicLink(request: MagicLinkRequest): Promise<GameResult<string>> {
    try {
      const { email } = request;

      // Validate email format
      if (!this.isValidEmail(email)) {
        return GameResult.error('INVALID_INPUT', 'Invalid email address');
      }

      // Check if player exists with this email
      const existingPlayer = await this.playerRepo.findByEmail(email);

      // Generate secure token
      const token = this.generateSecureToken();
      const expiresAt = new Date(Date.now() + this.TOKEN_EXPIRY_MINUTES * 60 * 1000);

      // Create auth token
      await this.authTokenRepo.createMagicLink(email, token, expiresAt, existingPlayer?.id);

      // In a real application, you would send this token via email
      // For development/testing, we'll return it directly
      // TODO: Implement email sending

      return GameResult.ok(token);
    } catch (error) {
      console.error('Magic link generation error:', error);
      return GameResult.error('INTERNAL_ERROR', 'Failed to generate magic link');
    }
  }

  /**
   * Verify a magic link token and authenticate the user
   */
  async verifyMagicLink(request: MagicLinkVerifyRequest): Promise<GameResult<MagicLinkResult>> {
    try {
      const { token } = request;

      // Validate token
      const isValid = await this.authTokenRepo.isValidToken(token);
      if (!isValid) {
        return GameResult.error('AUTH_FAILED', 'Invalid or expired token');
      }

      // Get token details
      const authToken = await this.authTokenRepo.findByToken(token);
      if (!authToken) {
        return GameResult.error('AUTH_FAILED', 'Token not found');
      }

      // Mark token as used
      await this.authTokenRepo.markAsUsed(authToken.id);

      let player: Player;
      let isNewPlayer = false;

      if (authToken.playerId) {
        // Existing player login
        const existingPlayer = await this.playerRepo.findById(authToken.playerId);
        if (!existingPlayer) {
          return GameResult.error('INTERNAL_ERROR', 'Player not found');
        }
        player = existingPlayer;

        // Update last login
        await this.playerRepo.updateLastLogin(player.id);
      } else if (authToken.email) {
        // New player registration
        const username = this.generateUsernameFromEmail(authToken.email);

        // Check if username is taken
        let finalUsername = username;
        let counter = 1;
        while (await this.playerRepo.findByUsername(finalUsername)) {
          finalUsername = `${username}${counter}`;
          counter++;
        }

        // Create new player
        player = await this.playerRepo.create({
          username: finalUsername,
          email: authToken.email,
        });
        isNewPlayer = true;
      } else {
        return GameResult.error('INTERNAL_ERROR', 'Invalid token data');
      }

      return GameResult.ok({
        player,
        isNewPlayer,
      });
    } catch (error) {
      return GameResult.error('INTERNAL_ERROR', 'Failed to verify magic link');
    }
  }

  /**
   * Clean up expired tokens
   */
  async cleanupExpiredTokens(): Promise<number> {
    return this.authTokenRepo.deleteExpiredTokens();
  }

  /**
   * Generate a secure random token
   */
  private generateSecureToken(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Generate a username from email
   */
  private generateUsernameFromEmail(email: string): string {
    const [localPart] = email.split('@');
    // Remove special characters and convert to lowercase
    const cleaned = localPart.toLowerCase().replace(/[^a-z0-9]/g, '');
    // Ensure minimum length
    return cleaned.length >= 3 ? cleaned : `player${cleaned}`;
  }
}
