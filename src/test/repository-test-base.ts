import type { DrizzleDb } from '@/server/database/connection.js';
import { getTestDb } from '@/server/database/test-setup.js';
import { beforeEach } from 'vitest';
import { fixtures } from './fixtures.js';

/**
 * Helper to create a repository test suite for D1/SQLite
 */
export function createRepositoryTest<T>(createRepo: (db: DrizzleDb) => T): {
  repository: T;
  db: DrizzleDb;
  fixtures: typeof fixtures;
} {
  const db = getTestDb();

  return {
    repository: createRepo(db),
    db,
    fixtures,
  };
}
