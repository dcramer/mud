// Network and communication types

import type { PlayerId } from './core.js';

// WebSocket message types
export interface WebSocketMessage<T = unknown> {
  readonly type: string;
  readonly data: T;
  readonly timestamp: number;
  readonly id?: string;
}

// Event types for type-safe communication
export type GameEventType = 'player' | 'combat' | 'ability' | 'item' | 'system';
export type GameEventAction = 'started' | 'ended' | 'used' | 'moved' | 'updated';

// Template literal types for event names (modern TypeScript)
export type GameEventName = `${GameEventType}:${GameEventAction}`;

// Game events
export interface GameEvent<T = unknown> {
  readonly type: GameEventName;
  readonly data: T;
  readonly timestamp: number;
  readonly source?: string;
  readonly playerId?: PlayerId;
}

// Connection management
export interface Connection {
  readonly id: string;
  readonly playerId?: PlayerId;
  readonly type: 'websocket' | 'telnet';

  send(message: string): Promise<void>;
  close(): Promise<void>;
  isConnected(): boolean;
}

// Network service interfaces
export interface NetworkService {
  sendToPlayer(playerId: PlayerId, message: string): Promise<void>;
  broadcastToRoom(roomId: string, message: string, exclude?: PlayerId[]): Promise<void>;
  broadcastGlobal(message: string, exclude?: PlayerId[]): Promise<void>;
}
