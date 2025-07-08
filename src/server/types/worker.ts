/**
 * Cloudflare Worker types for our MUD application
 */

import type {
  D1Database,
  DurableObjectNamespace,
  ExecutionContext,
  KVNamespace,
  ScheduledController,
} from '@cloudflare/workers-types';

/**
 * Environment bindings for our Cloudflare Worker
 */
export interface Env {
  // D1 Databases
  DB_AUTH: D1Database;
  DB_GAME: D1Database;
  DB_SOCIAL: D1Database;
  DB_ANALYTICS: D1Database;

  // KV Namespaces
  PLAYER_CACHE: KVNamespace;
  ROOM_CACHE: KVNamespace;
  SESSION_CACHE: KVNamespace;

  // Durable Objects
  GAME_ROOMS: DurableObjectNamespace;
  COMBAT_INSTANCES: DurableObjectNamespace;

  // Environment variables
  ENVIRONMENT: string;
  LOG_LEVEL?: string;
}

/**
 * Worker handler types
 */
export interface WorkerHandler {
  fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response>;
  scheduled?(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void>;
}

/**
 * Common response types for our API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  timestamp: string;
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  timestamp: string;
}
