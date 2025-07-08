/**
 * Cloudflare Worker entry point for the MUD game server
 */

import type { ExecutionContext, ScheduledController } from '@cloudflare/workers-types';
import { D1ConnectionFactory } from './database/connection.js';
import { PlayerRepository } from './database/repositories/player-repository.js';
import type { Env, WorkerHandler } from './types/worker.js';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    try {
      // Initialize database connections
      const dbFactory = new D1ConnectionFactory(env);

      // Handle different endpoints
      if (url.pathname === '/health') {
        return new Response('OK', { status: 200 });
      }

      if (url.pathname === '/api/players' && request.method === 'GET') {
        return await handleGetPlayers(dbFactory);
      }

      if (url.pathname === '/api/players' && request.method === 'POST') {
        return await handleCreatePlayer(request, dbFactory);
      }

      // WebSocket upgrade for game connections
      if (request.headers.get('Upgrade') === 'websocket') {
        return await handleWebSocketUpgrade(request, env);
      }

      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};

/**
 * Handle player listing endpoint
 */
async function handleGetPlayers(dbFactory: D1ConnectionFactory): Promise<Response> {
  const authDb = dbFactory.getAuthDb();
  const playerRepo = new PlayerRepository(authDb);

  // For demo purposes, return a simple response
  // In real implementation, this would have pagination, filtering, etc.
  return new Response(JSON.stringify({ message: 'Players endpoint - not yet implemented' }), {
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Handle player creation endpoint
 */
async function handleCreatePlayer(
  request: Request,
  dbFactory: D1ConnectionFactory,
): Promise<Response> {
  try {
    const body = (await request.json()) as {
      username: string;
      email: string;
    };

    if (!body.username || !body.email) {
      return new Response(JSON.stringify({ error: 'Username and email are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const authDb = dbFactory.getAuthDb();
    const playerRepo = new PlayerRepository(authDb);

    const player = await playerRepo.create({
      username: body.username,
      email: body.email,
    });

    return new Response(
      JSON.stringify({
        id: player.id,
        username: player.username,
        email: player.email,
        createdAt: player.createdAt.toISOString(),
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Create player error:', error);

    if (error instanceof Error) {
      if (error.message.includes('UNIQUE constraint')) {
        return new Response(JSON.stringify({ error: 'Username or email already exists' }), {
          status: 409,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Failed to create player' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * Handle WebSocket upgrade for real-time game connections
 */
async function handleWebSocketUpgrade(request: Request, env: Env): Promise<Response> {
  // TODO: Implement WebSocket handling with Durable Objects
  // This will be used for real-time game communication

  return new Response('WebSocket upgrade not yet implemented', { status: 501 });
}

/**
 * Scheduled task handler (for cron jobs)
 */
export async function scheduled(
  controller: ScheduledController,
  env: Env,
  ctx: ExecutionContext,
): Promise<void> {
  // TODO: Implement scheduled tasks
  // - Clean up expired sessions
  // - Archive old data
  // - Generate daily reports
  console.log('Scheduled task triggered:', controller.cron);
}
