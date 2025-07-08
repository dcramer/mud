import { beforeAll, afterAll, beforeEach } from 'vitest';
import { setupTestDatabase, teardownTestDatabase, clearAllTables } from './src/server/database/test-setup.js';

// Setup test database once before all tests
beforeAll(async () => {
  await setupTestDatabase();
});

// Cleanup after all tests
afterAll(async () => {
  await teardownTestDatabase();
});

// Clear tables before each test for isolation
beforeEach(async () => {
  await clearAllTables();
});