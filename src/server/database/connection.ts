import { drizzle } from 'drizzle-orm/d1';
import type { Env } from '../types/worker.js';
import * as schema from './schema.js';

export type DrizzleDb = ReturnType<typeof drizzle>;
export type { Env };

/**
 * Database connection factory for D1
 */
export class D1ConnectionFactory {
  constructor(private env: Env) {}

  getAuthDb() {
    return drizzle(this.env.DB_AUTH, { schema });
  }

  getGameDb(realmId = 'main') {
    // For now, all realms use the same database
    // In the future, this will map to different D1 instances
    return drizzle(this.env.DB_GAME, { schema });
  }

  getSocialDb() {
    return drizzle(this.env.DB_SOCIAL, { schema });
  }

  getAnalyticsDb() {
    return drizzle(this.env.DB_ANALYTICS, { schema });
  }

  /**
   * Get KV namespaces
   */
  getKV() {
    return {
      playerCache: this.env.PLAYER_CACHE,
      roomCache: this.env.ROOM_CACHE,
      sessionCache: this.env.SESSION_CACHE,
    };
  }
}

/**
 * Helper for local development with better-sqlite3
 */
export async function getLocalDb() {
  if (process.env.NODE_ENV !== 'development') {
    throw new Error('getLocalDb should only be used in development');
  }

  const { drizzle } = await import('drizzle-orm/better-sqlite3');
  const Database = (await import('better-sqlite3')).default;

  const sqlite = new Database('src/server/database/.db/local.db');
  const db = drizzle(sqlite, { schema });

  return db;
}
