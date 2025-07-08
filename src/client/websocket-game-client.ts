import { EventEmitter } from 'node:events';
import WebSocket from 'ws';

export interface GameMessage {
  type: string;
  [key: string]: any;
}

export class WebSocketGameClient extends EventEmitter {
  private ws?: WebSocket;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private sessionToken?: string;
  private isConnected = false;

  constructor(private wsUrl: string) {
    super();
  }

  connect(sessionToken: string): void {
    this.sessionToken = sessionToken;
    this.attemptConnection();
  }

  private attemptConnection(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close();
    }

    const url = `${this.wsUrl}?token=${this.sessionToken}`;
    this.ws = new WebSocket(url);

    this.ws.on('open', () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.ws.on('message', (data: WebSocket.Data) => {
      try {
        const message = JSON.parse(data.toString()) as GameMessage;
        this.handleMessage(message);
      } catch (error) {
        console.error('Failed to parse message:', error);
      }
    });

    this.ws.on('close', (code, reason) => {
      this.isConnected = false;
      this.emit('disconnected', { code, reason: reason.toString() });

      // Attempt reconnection if not a clean close
      if (code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

        setTimeout(() => {
          this.emit('reconnecting', { attempt: this.reconnectAttempts });
          this.attemptConnection();
        }, delay);
      }
    });

    this.ws.on('error', (error) => {
      this.emit('error', error);
    });

    this.ws.on('ping', () => {
      this.ws?.pong();
    });
  }

  private handleMessage(message: GameMessage): void {
    // Emit specific event for message type
    this.emit(message.type, message);

    // Also emit generic message event
    this.emit('message', message);
  }

  send(type: string, data: any = {}): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      this.emit('error', new Error('Not connected to server'));
      return;
    }

    const message: GameMessage = { type, ...data };
    this.ws.send(JSON.stringify(message));
  }

  disconnect(): void {
    this.reconnectAttempts = this.maxReconnectAttempts; // Prevent reconnection
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = undefined;
    }
    this.isConnected = false;
  }

  getConnectionState(): 'connected' | 'disconnected' | 'connecting' {
    if (!this.ws) return 'disconnected';

    switch (this.ws.readyState) {
      case WebSocket.CONNECTING:
        return 'connecting';
      case WebSocket.OPEN:
        return 'connected';
      default:
        return 'disconnected';
    }
  }

  isConnectedToServer(): boolean {
    return this.isConnected;
  }
}
