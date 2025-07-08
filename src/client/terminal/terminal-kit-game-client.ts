#!/usr/bin/env node

import { EventEmitter } from 'node:events';
import { config as loadEnv } from 'dotenv';
import { TerminalKitUI } from '../ui/terminal/terminal-kit-ui.js';
import { TerminalKitLoginScreen } from '../ui/screens/terminal-kit-login-screen.js';
import { TerminalKitGameScreen } from '../ui/screens/terminal-kit-game-screen.js';
import { createApiClient, type ApiClient } from '../api-client.js';
import type { AuthService } from '@/client/types/auth.js';
import { WebSocketGameClient } from '../websocket-game-client.js';

// Load environment variables
loadEnv();

interface AppState {
  sessionToken: string | null;
  isConnected: boolean;
  error: string | null;
}

// Mock AuthService for client-side use
class ClientAuthService extends EventEmitter implements Pick<AuthService, 'sendMagicLink' | 'verifyMagicLink'> {
  private apiClient: ApiClient;

  constructor(apiUrl: string) {
    super();
    this.apiClient = createApiClient(apiUrl);
  }

  async sendMagicLink(request: { email: string }) {
    try {
      const response = await fetch(`${this.apiClient.baseUrl}/auth/magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        return { 
          success: false as const, 
          error: { 
            message: error.message || 'Failed to send magic link',
            code: 'MAGIC_LINK_ERROR' as any,
            details: error
          }
        };
      }

      return { success: true as const, data: undefined };
    } catch (error: unknown) {
      return { 
        success: false as const, 
        error: { 
          message: 'Network error',
          code: 'NETWORK_ERROR' as any,
          details: error
        }
      };
    }
  }

  async verifyMagicLink(request: { token: string }) {
    try {
      const response = await fetch(`${this.apiClient.baseUrl}/auth/verify-magic-link`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ 
          message: `HTTP ${response.status}: ${response.statusText}` 
        }));
        return { 
          success: false as const, 
          error: { 
            message: error.message || 'Invalid or expired token',
            code: 'INVALID_TOKEN' as any,
            details: error
          }
        };
      }

      const data = await response.json() as unknown;
      return { 
        success: true as const, 
        data: {
          sessionToken: (data as any).sessionToken,
          player: (data as any).player
        }
      };
    } catch (error: unknown) {
      return { 
        success: false as const, 
        error: { 
          message: 'Network error',
          code: 'NETWORK_ERROR' as any,
          details: error
        }
      };
    }
  }
}

class TerminalKitGameApp {
  private appState: AppState = {
    sessionToken: null,
    isConnected: false,
    error: null
  };

  private ui: TerminalKitUI;
  private authService: ClientAuthService;
  private gameClient: WebSocketGameClient;

  constructor() {
    this.ui = new TerminalKitUI();
    this.authService = new ClientAuthService(
      process.env.API_URL || 'http://localhost:8787'
    );
    this.gameClient = new WebSocketGameClient(
      process.env.WEBSOCKET_URL || 'ws://localhost:8787'
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Handle UI events
    this.ui.on('exit', () => {
      this.shutdown();
    });

    // Handle game client events
    this.gameClient.on('connected', () => {
      this.appState.isConnected = true;
    });

    this.gameClient.on('error', (error: Error) => {
      this.appState.error = error.message;
      this.appState.isConnected = false;
    });

    this.gameClient.on('disconnected', () => {
      this.appState.isConnected = false;
    });

    // Handle process termination
    process.on('SIGINT', () => {
      this.shutdown();
    });

    process.on('SIGTERM', () => {
      this.shutdown();
    });

    // Handle uncaught errors
    process.on('uncaughtException', (error) => {
      console.error('Uncaught exception:', error);
      this.shutdown();
    });

    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled rejection:', reason);
      this.shutdown();
    });
  }

  async start(): Promise<void> {
    try {
      await this.ui.initialize();
      await this.showLoginScreen();
    } catch (error) {
      console.error('Failed to start game client:', error);
      this.shutdown();
    }
  }

  private async showLoginScreen(): Promise<void> {
    const loginScreen = new TerminalKitLoginScreen(
      this.ui,
      this.authService,
      this.handleLogin.bind(this)
    );

    await loginScreen.show();
  }

  private handleLogin(sessionToken: string): void {
    this.appState.sessionToken = sessionToken;
    
    // Connect to game server
    this.gameClient.connect(sessionToken);
    
    // Wait for connection before showing game screen
    this.gameClient.once('connected', () => {
      this.showGameScreen();
    });
    
    this.gameClient.once('error', (error: Error) => {
      this.showError(`Failed to connect to game server: ${error.message}`);
    });
  }

  private async showGameScreen(): Promise<void> {
    if (!this.appState.sessionToken) {
      this.showError('No session token available');
      return;
    }

    const gameScreen = new TerminalKitGameScreen(
      this.ui,
      this.gameClient,
      this.appState.sessionToken,
      this.handleLogout.bind(this)
    );

    await gameScreen.show();
  }

  private handleLogout(): void {
    this.gameClient.disconnect();
    this.appState = {
      sessionToken: null,
      isConnected: false,
      error: null
    };

    // Return to login screen
    this.showLoginScreen();
  }

  private showError(message: string): void {
    this.ui.clear();
    this.ui.error(message);
    this.ui.writeLine('');
    this.ui.prompt('Press Enter to return to login').then(() => {
      this.showLoginScreen();
    });
  }

  private shutdown(): void {
    this.gameClient.disconnect();
    this.ui.destroy();
    process.exit(0);
  }
}

// Create and start the application
const app = new TerminalKitGameApp();
app.start().catch((error) => {
  console.error('Application failed to start:', error);
  process.exit(1);
});