import crypto from 'node:crypto';
import type { DrizzleDb } from '@/server/database/connection.js';
import * as schema from '@/server/database/schema.js';
import type { Character, Player, Session } from '@/server/database/types.js';
import { GameResult } from '@/shared/utils/result.js';
import { and, eq, gt } from 'drizzle-orm';

export interface CreateSessionRequest {
  playerId: string;
  playerUsername: string;
  deviceInfo?: {
    os?: string;
    version?: string;
    client?: string;
  };
}

export interface SessionInfo {
  session: Session;
  player: Player;
  character?: Character;
}

export class SessionService {
  private readonly SESSION_DURATION_HOURS = 24;

  constructor(private db: DrizzleDb) {}

  /**
   * Create a new session for a player
   */
  async createSession(request: CreateSessionRequest): Promise<GameResult<Session>> {
    try {
      const token = this.generateSessionToken();
      const expiresAt = new Date(Date.now() + this.SESSION_DURATION_HOURS * 60 * 60 * 1000);

      const [session] = await this.db
        .insert(schema.sessions)
        .values({
          id: crypto.randomUUID(),
          playerId: request.playerId,
          token,
          playerUsername: request.playerUsername,
          deviceInfo: request.deviceInfo ? JSON.stringify(request.deviceInfo) : null,
          expiresAt,
          realmId: null,
          characterId: null,
          characterName: null,
        })
        .returning();

      if (!session) {
        throw new Error('Failed to create session');
      }

      return GameResult.ok(session);
    } catch (error) {
      return GameResult.error('INTERNAL_ERROR', 'Failed to create session');
    }
  }

  /**
   * Validate a session token and return session info
   */
  async validateSession(token: string): Promise<GameResult<SessionInfo>> {
    try {
      // Find session by token
      const [session] = await this.db
        .select()
        .from(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .limit(1);

      if (!session) {
        return GameResult.error('AUTH_FAILED', 'Invalid session token');
      }

      // Check if expired
      if (session.expiresAt < new Date()) {
        await this.invalidateSession(token);
        return GameResult.error('AUTH_FAILED', 'Session expired');
      }

      // Update last activity
      await this.updateLastActivity(session.id);

      // For now, return mock player data
      // TODO: Implement proper player lookup
      const player: Player = {
        id: session.playerId,
        username: session.playerUsername,
        email: 'test@example.com',
        createdAt: new Date(),
        lastLogin: new Date(),
      };

      return GameResult.ok({
        session,
        player,
        character: undefined, // TODO: Implement character lookup
      });
    } catch (error) {
      return GameResult.error('INTERNAL_ERROR', 'Failed to validate session');
    }
  }

  /**
   * Attach a character to a session
   */
  async attachCharacter(
    sessionId: string,
    characterId: string,
    characterName: string,
    realmId: string,
  ): Promise<GameResult<void>> {
    try {
      const result = await this.db
        .update(schema.sessions)
        .set({
          characterId,
          characterName,
          realmId,
        })
        .where(eq(schema.sessions.id, sessionId))
        .returning();

      if (result.length === 0) {
        return GameResult.error('NOT_FOUND', 'Session not found');
      }

      return GameResult.ok(undefined);
    } catch (error) {
      return GameResult.error('INTERNAL_ERROR', 'Failed to attach character to session');
    }
  }

  /**
   * Detach character from session (logout from character)
   */
  async detachCharacter(sessionId: string): Promise<GameResult<void>> {
    try {
      const result = await this.db
        .update(schema.sessions)
        .set({
          characterId: null,
          characterName: null,
          realmId: null,
        })
        .where(eq(schema.sessions.id, sessionId))
        .returning();

      if (result.length === 0) {
        return GameResult.error('NOT_FOUND', 'Session not found');
      }

      return GameResult.ok(undefined);
    } catch (error) {
      return GameResult.error('INTERNAL_ERROR', 'Failed to detach character from session');
    }
  }

  /**
   * Invalidate a session (logout)
   */
  async invalidateSession(token: string): Promise<GameResult<void>> {
    try {
      const result = await this.db
        .delete(schema.sessions)
        .where(eq(schema.sessions.token, token))
        .returning();

      if (result.length === 0) {
        return GameResult.error('NOT_FOUND', 'Session not found');
      }

      return GameResult.ok(undefined);
    } catch (error) {
      return GameResult.error('INTERNAL_ERROR', 'Failed to invalidate session');
    }
  }

  /**
   * Get all active sessions for a player
   */
  async getPlayerSessions(playerId: string): Promise<Session[]> {
    const now = new Date();

    const sessions = await this.db
      .select()
      .from(schema.sessions)
      .where(and(eq(schema.sessions.playerId, playerId), gt(schema.sessions.expiresAt, now)));

    return sessions;
  }

  /**
   * Clean up expired sessions
   */
  async cleanupExpiredSessions(): Promise<number> {
    const now = new Date();

    const result = await this.db
      .delete(schema.sessions)
      .where(gt(now, schema.sessions.expiresAt))
      .returning();

    return result.length;
  }

  /**
   * Extend session expiration
   */
  async extendSession(sessionId: string): Promise<GameResult<void>> {
    try {
      const newExpiry = new Date(Date.now() + this.SESSION_DURATION_HOURS * 60 * 60 * 1000);

      const result = await this.db
        .update(schema.sessions)
        .set({ expiresAt: newExpiry })
        .where(eq(schema.sessions.id, sessionId))
        .returning();

      if (result.length === 0) {
        return GameResult.error('NOT_FOUND', 'Session not found');
      }

      return GameResult.ok(undefined);
    } catch (error) {
      return GameResult.error('INTERNAL_ERROR', 'Failed to extend session');
    }
  }

  /**
   * Update session last activity
   */
  private async updateLastActivity(sessionId: string): Promise<void> {
    await this.db
      .update(schema.sessions)
      .set({ lastActivity: new Date() })
      .where(eq(schema.sessions.id, sessionId));
  }

  /**
   * Generate a secure session token
   */
  private generateSessionToken(): string {
    return `sess_${crypto.randomBytes(32).toString('base64url')}`;
  }
}
