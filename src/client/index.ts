#!/usr/bin/env node

import { getLocalDb } from '@/server/database/connection.js';
import type { Env } from '@/server/types/worker.js';
import chalk from 'chalk';
import { GameClient } from './game-client.js';

/**
 * Local development client that connects directly to the database
 */
async function main() {
  console.log(chalk.cyan('Starting MUD client in local development mode...'));
  console.log('');

  try {
    // Create a mock environment for local development
    // In production, this would connect via WebSocket to the server
    const mockEnv: Env = {
      DB_AUTH: (await getLocalDb()) as any,
      DB_GAME: (await getLocalDb()) as any,
      DB_SOCIAL: (await getLocalDb()) as any,
      DB_ANALYTICS: (await getLocalDb()) as any,
      PLAYER_CACHE: null as any,
      ROOM_CACHE: null as any,
      SESSION_CACHE: null as any,
      GAME_ROOMS: null as any,
      COMBAT_INSTANCES: null as any,
      ENVIRONMENT: 'development',
    };

    const client = new GameClient(mockEnv);
    await client.start();
  } catch (error) {
    console.error(chalk.red('Failed to start client:'), error);
    process.exit(1);
  }
}

// Check if running in development
if (process.env.NODE_ENV !== 'development') {
  console.error(chalk.red('This client is for local development only.'));
  console.error(chalk.yellow('For production, use the web client or connect via telnet/SSH.'));
  process.exit(1);
}

main().catch(console.error);
