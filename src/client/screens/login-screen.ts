import type { MagicLinkService } from '@/server/auth/services/magic-link-service.js';
import type { SessionService } from '@/server/auth/services/session-service.js';
import chalk from 'chalk';
import type { TerminalUI } from '../terminal/terminal-ui.js';

export class LoginScreen {
  constructor(
    private ui: TerminalUI,
    private magicLinkService: MagicLinkService,
    private sessionService: SessionService,
  ) {}

  async show(): Promise<{ sessionToken: string; isNewPlayer: boolean }> {
    this.displayWelcome();

    while (true) {
      const choice = await this.ui.menu('How would you like to connect?', [
        'Login with Magic Link (Email)',
        'Login with SSH Key',
        'Create New Account',
        'Exit',
      ]);

      switch (choice) {
        case 0: // Magic Link Login
          const loginResult = await this.handleMagicLinkLogin();
          if (loginResult) return loginResult;
          break;

        case 1: // SSH Key Login
          this.ui.warning('SSH key authentication coming soon!');
          break;

        case 2: // Create Account
          const createResult = await this.handleCreateAccount();
          if (createResult) return createResult;
          break;

        case 3: // Exit
          this.ui.writeLine(chalk.yellow('\nFarewell, adventurer!'));
          process.exit(0);
      }
    }
  }

  private displayWelcome(): void {
    this.ui.clear();

    // ASCII Art Banner
    const banner = [
      '███╗   ███╗██╗   ██╗██████╗ ',
      '████╗ ████║██║   ██║██╔══██╗',
      '██╔████╔██║██║   ██║██║  ██║',
      '██║╚██╔╝██║██║   ██║██║  ██║',
      '██║ ╚═╝ ██║╚██████╔╝██████╔╝',
      '╚═╝     ╚═╝ ╚═════╝ ╚═════╝ ',
    ];

    banner.forEach((line) => this.ui.writeLine(chalk.cyan(line)));
    this.ui.writeLine('');
    this.ui.writeLine(chalk.gray('A Multi-User Dungeon Adventure'));
    this.ui.writeLine('');

    this.ui.box(
      [
        'Welcome to the realm!',
        '',
        'This is a text-based multiplayer game where you can:',
        '• Explore vast worlds and discover hidden secrets',
        '• Battle fierce monsters and collect legendary items',
        '• Team up with other players for epic quests',
        '• Build your character and master powerful abilities',
      ],
      'gray',
    );

    this.ui.writeLine('');
  }

  private async handleMagicLinkLogin(): Promise<{
    sessionToken: string;
    isNewPlayer: boolean;
  } | null> {
    this.ui.writeLine('');
    this.ui.info('Login with Magic Link');
    this.ui.writeLine(chalk.gray("We'll send a secure login link to your email."));
    this.ui.writeLine('');

    const email = await this.ui.question('Enter your email address:');

    if (!email) {
      this.ui.error('Email is required');
      return null;
    }

    // Generate magic link
    this.ui.info('Generating magic link...');
    const linkResult = await this.magicLinkService.generateMagicLink({ email });

    if (!linkResult.success) {
      this.ui.error(linkResult.error.message);
      return null;
    }

    // In development, show the token directly
    this.ui.writeLine('');
    this.ui.box(
      [
        'Magic Link Token (Development Mode):',
        '',
        linkResult.data,
        '',
        'In production, this would be sent to your email.',
      ],
      'gray',
    );
    this.ui.writeLine('');

    // Ask for token
    const token = await this.ui.question('Enter the token from your email:');

    if (!token) {
      this.ui.error('Token is required');
      return null;
    }

    // Verify token
    this.ui.info('Verifying token...');
    const verifyResult = await this.magicLinkService.verifyMagicLink({ token });

    if (!verifyResult.success) {
      this.ui.error(verifyResult.error.message);
      return null;
    }

    const { player, isNewPlayer } = verifyResult.data;

    // Create session
    const sessionResult = await this.sessionService.createSession({
      playerId: player.id,
      playerUsername: player.username,
      deviceInfo: {
        client: 'terminal',
        version: '1.0.0',
      },
    });

    if (!sessionResult.success) {
      this.ui.error('Failed to create session');
      return null;
    }

    if (isNewPlayer) {
      this.ui.writeLine('');
      this.ui.success(`Welcome to the realm, ${player.username}!`);
      this.ui.writeLine('');
      this.ui.box(
        [
          'Your account has been created!',
          '',
          `Username: ${player.username}`,
          `Email: ${player.email}`,
          '',
          'You can customize your character next.',
        ],
        'gray',
      );
    } else {
      this.ui.writeLine('');
      this.ui.success(`Welcome back, ${player.username}!`);
    }

    await this.ui.question('Press Enter to continue...');

    return {
      sessionToken: sessionResult.data.token,
      isNewPlayer,
    };
  }

  private async handleCreateAccount(): Promise<{
    sessionToken: string;
    isNewPlayer: boolean;
  } | null> {
    this.ui.writeLine('');
    this.ui.header('Create New Account', 'green');
    this.ui.writeLine('');

    const email = await this.ui.question('Enter your email address:');

    if (!email) {
      this.ui.error('Email is required');
      return null;
    }

    // For new accounts, we use the same magic link flow
    return this.handleMagicLinkLogin();
  }
}
