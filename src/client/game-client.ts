import { MagicLinkService } from '@/server/auth/services/magic-link-service.js';
import { SessionService } from '@/server/auth/services/session-service.js';
import { D1ConnectionFactory } from '@/server/database/connection.js';
import type { Env } from '@/server/types/worker.js';
import chalk from 'chalk';
import { LoginScreen } from './screens/login-screen.js';
import { TerminalUI } from './terminal/terminal-ui.js';

export interface GameState {
  sessionToken: string;
  playerId: string;
  playerUsername: string;
  characterId?: string;
  characterName?: string;
  currentRoom?: string;
}

export class GameClient {
  private ui: TerminalUI;
  private state?: GameState;
  private magicLinkService: MagicLinkService;
  private sessionService: SessionService;

  constructor(private env: Env) {
    this.ui = new TerminalUI();

    // Initialize services
    const dbFactory = new D1ConnectionFactory(this.env);
    const authDb = dbFactory.getAuthDb();

    this.magicLinkService = new MagicLinkService(authDb);
    this.sessionService = new SessionService(authDb);

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.ui.on('command', (input: string) => {
      this.handleCommand(input);
    });

    this.ui.on('exit', () => {
      this.shutdown();
    });
  }

  async start(): Promise<void> {
    try {
      // Show login screen
      const loginScreen = new LoginScreen(this.ui, this.magicLinkService, this.sessionService);

      const loginResult = await loginScreen.show();

      // Validate session
      const sessionResult = await this.sessionService.validateSession(loginResult.sessionToken);

      if (!sessionResult.success) {
        this.ui.error('Failed to validate session');
        process.exit(1);
      }

      const { session, player } = sessionResult.data;

      // Set up game state
      this.state = {
        sessionToken: session.token,
        playerId: player.id,
        playerUsername: player.username,
      };

      // Show main game screen
      await this.showMainScreen();
    } catch (error) {
      this.ui.error('Failed to start game client');
      console.error(error);
      process.exit(1);
    }
  }

  private async showMainScreen(): Promise<void> {
    if (!this.state) return;

    this.ui.clear();
    this.ui.header(`Welcome, ${this.state.playerUsername}!`, 'green');
    this.ui.writeLine('');

    if (!this.state.characterId) {
      this.ui.info('You need to create or select a character to play.');
      this.ui.writeLine('');

      const choice = await this.ui.menu('What would you like to do?', [
        'Create a new character',
        'Select existing character',
        'Account settings',
        'Logout',
      ]);

      switch (choice) {
        case 0:
          this.ui.info('Character creation coming soon!');
          break;
        case 1:
          this.ui.info('Character selection coming soon!');
          break;
        case 2:
          this.ui.info('Account settings coming soon!');
          break;
        case 3:
          await this.logout();
          return;
      }
    } else {
      // Show game world
      this.showGameWorld();
    }

    // Start command prompt
    this.ui.writeLine('');
    this.ui.info('Type "help" for available commands.');
    this.ui.writeLine('');
    this.ui.prompt();
  }

  private showGameWorld(): void {
    this.ui.box([
      'You are in the Town Square',
      '',
      'The bustling center of town is filled with adventurers',
      'preparing for their journeys. Merchants hawk their wares',
      'while guards patrol the cobblestone streets.',
      '',
      'Exits: [north] [south] [east] [west]',
    ]);
  }

  private async handleCommand(input: string): Promise<void> {
    const [command, ...args] = input.toLowerCase().split(' ');

    switch (command) {
      case 'help':
        this.showHelp();
        break;

      case 'look':
      case 'l':
        this.showGameWorld();
        break;

      case 'north':
      case 'n':
      case 'south':
      case 's':
      case 'east':
      case 'e':
      case 'west':
      case 'w':
        this.ui.info(`You can't go that way yet. Movement coming soon!`);
        break;

      case 'who':
        this.ui.info('Player list coming soon!');
        break;

      case 'say':
        if (args.length === 0) {
          this.ui.error('Say what?');
        } else {
          const message = args.join(' ');
          this.ui.writeLine(chalk.cyan(`You say: "${message}"`));
        }
        break;

      case 'quit':
      case 'exit':
        await this.logout();
        break;

      case 'clear':
      case 'cls':
        this.ui.clear();
        this.showGameWorld();
        break;

      default:
        this.ui.error(`Unknown command: ${command}. Type "help" for available commands.`);
    }
  }

  private showHelp(): void {
    this.ui.writeLine('');
    this.ui.header('Available Commands', 'blue');
    this.ui.writeLine('');

    const commands = [
      ['help', 'Show this help message'],
      ['look (l)', 'Look at your surroundings'],
      ['north (n)', 'Move north'],
      ['south (s)', 'Move south'],
      ['east (e)', 'Move east'],
      ['west (w)', 'Move west'],
      ['say <message>', 'Say something out loud'],
      ['who', 'List online players'],
      ['clear (cls)', 'Clear the screen'],
      ['quit (exit)', 'Exit the game'],
    ];

    for (const [cmd, desc] of commands) {
      this.ui.writeLine(`  ${chalk.yellow(cmd!.padEnd(15))} ${chalk.gray(desc)}`);
    }

    this.ui.writeLine('');
  }

  private async logout(): Promise<void> {
    if (!this.state) return;

    this.ui.info('Logging out...');

    await this.sessionService.invalidateSession(this.state.sessionToken);

    this.ui.writeLine('');
    this.ui.success('Thanks for playing! See you next time.');
    this.ui.writeLine('');

    this.shutdown();
  }

  private shutdown(): void {
    this.ui.close();
    process.exit(0);
  }
}
