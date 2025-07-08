import type { TerminalKitUI } from '../terminal/terminal-kit-ui.js';
import type { WebSocketGameClient } from '@/client/websocket-game-client.js';
import type { Character } from '@/shared/types/game.js';

export interface GameScreenProps {
  ui: TerminalKitUI;
  gameClient: WebSocketGameClient;
  sessionToken: string;
  onLogout: () => void;
}

type GameState = 
  | { type: 'loading' }
  | { type: 'character_selection'; characters: Character[] }
  | { type: 'character_creation' }
  | { type: 'in_game'; character: Character }
  | { type: 'error'; message: string };

export class TerminalKitGameScreen {
  private state: GameState = { type: 'loading' };
  private gameOutput: string[] = [];
  private statusBar = {
    hp: 100,
    maxHp: 100,
    mp: 50,
    maxMp: 50,
    stamina: 100,
    maxStamina: 100,
    level: 1,
    rank: 'Normal'
  };

  private maxOutputLines = 20;
  private isInputMode = false;

  constructor(
    private ui: TerminalKitUI,
    private gameClient: WebSocketGameClient,
    private _sessionToken: string,
    private onLogout: () => void
  ) {
    this.setupGameClient();
  }

  async show(): Promise<void> {
    this.ui.clear();
    this.setupKeyHandlers();
    await this.loadCharacters();
    this.render();
    this.runGameLoop();
  }

  private setupGameClient(): void {
    this.gameClient.on('message', this.handleGameMessage.bind(this));
    this.gameClient.on('error', this.handleGameError.bind(this));
    this.gameClient.on('disconnected', this.handleDisconnect.bind(this));
  }

  private setupKeyHandlers(): void {
    this.ui.onKey(this.handleKeyPress.bind(this));
  }

  private async loadCharacters(): Promise<void> {
    try {
      // In a real implementation, this would fetch from the server
      // For now, we'll simulate having no characters
      this.state = { type: 'character_selection', characters: [] };
    } catch (error) {
      this.state = { type: 'error', message: 'Failed to load characters' };
    }
  }

  private handleGameMessage(message: any): void {
    if (message.type === 'room_description') {
      this.addGameOutput('', message.title, message.description);
    } else if (message.type === 'chat') {
      this.addGameOutput(`[${message.channel}] ${message.sender}: ${message.text}`);
    } else if (message.type === 'system') {
      this.addGameOutput(message.text);
    } else if (message.type === 'status_update') {
      this.statusBar = message.status;
      this.renderStatusBar();
    }
  }

  private handleGameError(error: Error): void {
    this.addGameOutput(`[ERROR] ${error.message}`);
  }

  private handleDisconnect(): void {
    this.state = { type: 'error', message: 'Disconnected from server' };
    this.render();
  }

  private handleKeyPress(key: { name: string; matches: any; data: any }): void {
    // Handle game-specific key events when in game
    if (this.state.type === 'in_game' && !this.isInputMode) {
      switch (key.name) {
        case 'ENTER':
          this.startCommandInput();
          break;
        case 'ESC':
          this.onLogout();
          break;
      }
    }
  }

  private async handleCharacterCreate(name: string): Promise<void> {
    if (!name || name.length < 3) {
      this.addGameOutput('Character name must be at least 3 characters long');
      return;
    }

    try {
      // In a real implementation, this would create the character on the server
      const character: Character = {
        id: '1',
        name,
        level: 1,
        rank: 'normal',
        attributes: { power: 10, speed: 10, spirit: 10, recovery: 10 },
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        stamina: 100,
        maxStamina: 100
      };

      // Enter the game world
      this.state = { type: 'in_game', character };
      this.addGameOutput(
        `Welcome to the Realm, ${name}!`,
        '',
        '═══ Town Square ═══',
        '',
        'You stand in the bustling town square of Newbridge. Merchants hawk',
        'their wares from colorful stalls, and adventurers gather around the',
        'central fountain, sharing tales of their exploits.',
        '',
        'Exits: north, east, south, west',
        '',
        'Press ENTER to type commands, ESC to logout',
        'Type "help" for a list of commands.'
      );
      this.render();
    } catch (error) {
      this.state = { type: 'error', message: 'Failed to create character' };
      this.render();
    }
  }

  private async startCommandInput(): Promise<void> {
    this.isInputMode = true;
    
    // Move to input line and show prompt
    const { height } = this.ui.getSize();
    this.ui.moveTo(1, height);
    this.ui.write('> ', 'green');
    
    const command = await this.ui.prompt('', {});
    
    this.isInputMode = false;
    this.handleGameCommand(command);
  }

  private handleGameCommand(command: string): void {
    const cmd = command.toLowerCase().trim();
    
    if (!cmd) {
      this.render();
      return;
    }

    // Echo the command
    this.addGameOutput(`> ${command}`);

    // Handle local commands
    switch (cmd) {
      case 'help':
      case 'h':
        this.addGameOutput(
          '',
          'Available Commands:',
          '  look (l)      - Examine your surroundings',
          '  inventory (i) - Check your inventory',
          '  stats         - View character statistics',
          '  north (n)     - Move north',
          '  south (s)     - Move south',
          '  east (e)      - Move east',
          '  west (w)      - Move west',
          '  say <text>    - Say something to nearby players',
          '  quit          - Exit the game',
          ''
        );
        break;

      case 'look':
      case 'l':
        this.addGameOutput(
          '',
          'Town Square',
          'The heart of Newbridge, where all roads meet. A large fountain',
          'dominates the center, its crystal-clear water sparkling in the',
          'sunlight. You can see:',
          '  • A weathered bulletin board',
          '  • Several merchant stalls',
          '  • Other adventurers going about their business',
          ''
        );
        break;

      case 'inventory':
      case 'inv':
      case 'i':
        this.addGameOutput(
          '',
          'Inventory:',
          '  • Starter Sword (equipped)',
          '  • Leather Armor (equipped)',
          '  • Health Potion x3',
          '  • 50 gold coins',
          ''
        );
        break;

      case 'stats':
        if (this.state.type === 'in_game') {
          this.addGameOutput(
            '',
            `Character: ${this.state.character.name}`,
            `Level: ${this.state.character.level} (${this.state.character.rank} Rank)`,
            'Attributes:',
            `  • Power: ${this.state.character.attributes.power}`,
            `  • Speed: ${this.state.character.attributes.speed}`,
            `  • Spirit: ${this.state.character.attributes.spirit}`,
            `  • Recovery: ${this.state.character.attributes.recovery}`,
            ''
          );
        }
        break;

      case 'quit':
      case 'exit':
        this.onLogout();
        return;

      default:
        if (cmd.startsWith('say ')) {
          const message = command.substring(4);
          this.addGameOutput(`You say, "${message}"`);
          // In a real implementation, this would send to the server
        } else if (['n', 'north', 's', 'south', 'e', 'east', 'w', 'west'].includes(cmd)) {
          this.addGameOutput(
            `You head ${cmd}...`,
            '(In the full game, this would take you to a new area)'
          );
        } else {
          this.addGameOutput(
            `Unknown command: ${cmd}`,
            'Type "help" for available commands.'
          );
        }
    }

    this.render();
  }

  private addGameOutput(...lines: string[]): void {
    this.gameOutput.push(...lines);
    
    // Keep only the last N lines
    if (this.gameOutput.length > this.maxOutputLines) {
      this.gameOutput = this.gameOutput.slice(-this.maxOutputLines);
    }
  }

  private render(): void {
    this.ui.clear();

    switch (this.state.type) {
      case 'loading':
        this.ui.writeLine('Loading...', 'cyan');
        break;

      case 'character_selection':
        this.renderCharacterSelection();
        break;

      case 'character_creation':
        this.renderCharacterCreation();
        break;

      case 'in_game':
        this.renderGame();
        break;

      case 'error':
        this.renderError();
        break;
    }
  }

  private renderCharacterSelection(): void {
    if (this.state.type !== 'character_selection') return;

    this.ui.writeLine('Character Selection', 'cyan');
    this.ui.writeLine('');

    if (this.state.characters.length === 0) {
      this.ui.writeLine('You have no characters yet. Let\'s create your first character!');
      this.ui.writeLine('');
      this.promptCharacterName();
    } else {
      this.ui.writeLine('Character list would appear here');
    }
  }

  private async promptCharacterName(): Promise<void> {
    const name = await this.ui.prompt('Character name:', {
      validator: (value: string) => {
        if (!value || value.length < 3) {
          return 'Character name must be at least 3 characters long';
        }
        return true;
      }
    });

    if (name) {
      await this.handleCharacterCreate(name);
    }
  }

  private renderCharacterCreation(): void {
    this.ui.writeLine('Character Creation', 'cyan');
    this.ui.writeLine('(Character creation screen would be here)');
  }

  private renderGame(): void {
    if (this.state.type !== 'in_game') return;

    const { height } = this.ui.getSize();

    // Render game output (leave space for status bar and input)
    const outputHeight = height - 3;
    
    for (let i = 0; i < Math.min(this.gameOutput.length, outputHeight); i++) {
      const line = this.gameOutput[i];
      if (line !== undefined) {
        const color = line.startsWith('>') ? 'cyan' : 'white';
        this.ui.writeLine(line, color);
      }
    }

    // Fill remaining space
    const remainingLines = outputHeight - Math.min(this.gameOutput.length, outputHeight);
    for (let i = 0; i < remainingLines; i++) {
      this.ui.writeLine('');
    }

    // Render status bar
    this.renderStatusBar();

    // Position cursor for input
    this.ui.moveTo(1, height);
    this.ui.write('Press ENTER to type, ESC to logout', 'gray');
  }

  private renderStatusBar(): void {
    const { height } = this.ui.getSize();
    const statusContent = 
      `HP: ${this.statusBar.hp}/${this.statusBar.maxHp}  ` +
      `MP: ${this.statusBar.mp}/${this.statusBar.maxMp}  ` +
      `Stamina: ${this.statusBar.stamina}/${this.statusBar.maxStamina}  ` +
      `Level: ${this.statusBar.level} (${this.statusBar.rank} Rank)`;

    this.ui.drawStatusBar(height - 1, statusContent);
  }

  private renderError(): void {
    if (this.state.type !== 'error') return;
    
    this.ui.error(`Error: ${this.state.message}`);
    this.ui.writeLine('');
    this.ui.writeLine('Press any key to continue', 'gray');
  }

  private async runGameLoop(): Promise<void> {
    // Simple game loop - mainly for handling input in game mode
    // Terminal-kit handles most of the real-time updates via events
  }
}