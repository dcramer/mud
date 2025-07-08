// Core types following our industry-standard patterns from coding docs

// Branded types for ID safety (TypeScript best practice)
declare const EntityIdBrand: unique symbol;
export type EntityId = string & { readonly [EntityIdBrand]: never };

declare const PlayerIdBrand: unique symbol;
export type PlayerId = string & { readonly [PlayerIdBrand]: never };

declare const RoomIdBrand: unique symbol;
export type RoomId = string & { readonly [RoomIdBrand]: never };

// Factory functions for type safety
export const createEntityId = (id: string): EntityId => id as EntityId;
export const createPlayerId = (id: string): PlayerId => id as PlayerId;
export const createRoomId = (id: string): RoomId => id as RoomId;

// Result pattern (Rust-inspired, industry standard)
export interface GameResult<T> {
  readonly success: boolean;
  readonly data?: T;
  readonly error?: GameError;
}

export interface Success<T> extends GameResult<T> {
  readonly success: true;
  readonly data: T;
}

export interface Failure<T> extends GameResult<T> {
  readonly success: false;
  readonly error: GameError;
}

export type Result<T> = Success<T> | Failure<T>;

// Error handling (industry standard)
export enum GameErrorCode {
  // Entity/Component errors
  ENTITY_NOT_FOUND = 'ENTITY_NOT_FOUND',
  COMPONENT_MISSING = 'COMPONENT_MISSING',
  INVALID_ENTITY_STATE = 'INVALID_ENTITY_STATE',

  // Input/Validation errors
  INVALID_INPUT = 'INVALID_INPUT',
  MALFORMED_COMMAND = 'MALFORMED_COMMAND',
  UNKNOWN_COMMAND = 'UNKNOWN_COMMAND',

  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  INSUFFICIENT_RANK = 'INSUFFICIENT_RANK',
  UNAUTHORIZED = 'UNAUTHORIZED',

  // Resource errors
  RESOURCE_EXHAUSTED = 'RESOURCE_EXHAUSTED',
  RESOURCE_LOCKED = 'RESOURCE_LOCKED',
  COOLDOWN_ACTIVE = 'COOLDOWN_ACTIVE',

  // System errors
  SYSTEM_ERROR = 'SYSTEM_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',

  // Game Logic errors
  INVALID_TARGET = 'INVALID_TARGET',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  INVALID_CONDITIONS = 'INVALID_CONDITIONS',

  // Combat errors
  ALREADY_IN_COMBAT = 'ALREADY_IN_COMBAT',
  NOT_IN_COMBAT = 'NOT_IN_COMBAT',
  ABILITY_NOT_AVAILABLE = 'ABILITY_NOT_AVAILABLE',

  // Movement errors
  NO_EXIT = 'NO_EXIT',
  BLOCKED_PATH = 'BLOCKED_PATH',
  DIFFERENT_LOCATIONS = 'DIFFERENT_LOCATIONS',

  // Auth errors
  INVALID_CREDENTIALS = 'INVALID_CREDENTIALS',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  INVALID_SSH_KEY = 'INVALID_SSH_KEY',
  DUPLICATE_SSH_KEY = 'DUPLICATE_SSH_KEY',
  SSH_KEY_NOT_FOUND = 'SSH_KEY_NOT_FOUND',
  INVALID_CHALLENGE = 'INVALID_CHALLENGE',

  // Player/Character errors
  DUPLICATE_USERNAME = 'DUPLICATE_USERNAME',
  DUPLICATE_CHARACTER_NAME = 'DUPLICATE_CHARACTER_NAME',
  CHARACTER_LIMIT_REACHED = 'CHARACTER_LIMIT_REACHED',

  // General errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',

  // System management errors
  SYSTEM_ALREADY_EXISTS = 'SYSTEM_ALREADY_EXISTS',
  SYSTEM_NOT_FOUND = 'SYSTEM_NOT_FOUND',
  ALREADY_INITIALIZED = 'ALREADY_INITIALIZED',
  NOT_INITIALIZED = 'NOT_INITIALIZED',
  SYSTEM_INITIALIZATION_FAILED = 'SYSTEM_INITIALIZATION_FAILED',
  SYSTEM_SHUTDOWN_FAILED = 'SYSTEM_SHUTDOWN_FAILED',
  SYSTEM_RELOAD_FAILED = 'SYSTEM_RELOAD_FAILED',
}

// Game enums
export enum Rank {
  Normal = 'normal',
  Iron = 'iron',
  Bronze = 'bronze',
  Silver = 'silver',
  Gold = 'gold',
  Diamond = 'diamond',
}

export class GameError extends Error {
  constructor(
    message: string,
    public readonly code: GameErrorCode,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'GameError';
  }

  // Convenience factory methods
  static notFound(resource: string, id: string): GameError {
    return new GameError(`${resource} not found`, GameErrorCode.ENTITY_NOT_FOUND, { resource, id });
  }

  static missingComponent(entityId: string, componentType: string): GameError {
    return new GameError(
      `Entity ${entityId} missing component: ${componentType}`,
      GameErrorCode.COMPONENT_MISSING,
      { entityId, componentType },
    );
  }

  static invalidInput(message: string, input?: unknown): GameError {
    return new GameError(message, GameErrorCode.INVALID_INPUT, { input });
  }

  static permissionDenied(action: string, reason?: string): GameError {
    return new GameError(`Permission denied: ${action}`, GameErrorCode.PERMISSION_DENIED, {
      action,
      reason,
    });
  }
}

// Helper functions for Result pattern
export const success = <T>(data: T): Success<T> => ({ success: true, data });
export const failure = <T>(error: GameError): Failure<T> => ({ success: false, error });

// Type guards
export const isSuccess = <T>(result: Result<T>): result is Success<T> => {
  return result.success;
};

export const isFailure = <T>(result: Result<T>): result is Failure<T> => {
  return !result.success;
};
