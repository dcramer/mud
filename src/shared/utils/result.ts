import type { GameResult as GameResultType } from '@/shared/types/core.js';
import { GameError, type GameErrorCode } from '@/shared/types/core.js';

/**
 * Create a successful result
 */
export function success<T>(data: T): GameResultType<T> {
  return {
    success: true,
    data,
  };
}

/**
 * Create a failed result
 */
export function failure<T>(error: GameError): GameResultType<T> {
  return {
    success: false,
    error,
  };
}

/**
 * Create a successful void result
 */
export function voidSuccess(): GameResultType<void> {
  return {
    success: true,
  };
}

/**
 * Type guard to check if result is successful
 */
export function isSuccess<T>(
  result: GameResultType<T>,
): result is GameResultType<T> & { success: true; data: T } {
  return result.success === true;
}

/**
 * Type guard to check if result is failure
 */
export function isFailure<T>(
  result: GameResultType<T>,
): result is GameResultType<T> & { success: false; error: GameError } {
  return result.success === false;
}

/**
 * Map a successful result to a new value
 */
export function mapResult<T, U>(
  result: GameResultType<T>,
  mapper: (value: T) => U,
): GameResultType<U> {
  if (isSuccess(result)) {
    return success(mapper(result.data));
  }
  return result as unknown as GameResultType<U>;
}

/**
 * Chain results together
 */
export async function chainResults<T, U>(
  result: GameResultType<T>,
  next: (value: T) => Promise<GameResultType<U>>,
): Promise<GameResultType<U>> {
  if (isSuccess(result)) {
    return next(result.data);
  }
  return result as unknown as GameResultType<U>;
}

/**
 * Combine multiple results
 */
export function combineResults<T>(results: GameResultType<T>[]): GameResultType<T[]> {
  const values: T[] = [];

  for (const result of results) {
    if (isFailure(result)) {
      return failure(result.error);
    }
    values.push(result.data!);
  }

  return success(values);
}

/**
 * Helper class for creating GameResult instances
 */
export class GameResult {
  static ok<T>(data: T): GameResultType<T> {
    return success(data);
  }

  static error<T>(code: GameErrorCode, message: string): GameResultType<T> {
    return failure(new GameError(message, code));
  }
}
