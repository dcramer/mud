#!/usr/bin/env node

/**
 * Simple demo showing the terminal-kit MUD interface
 * This runs without needing a server - just shows the UI capabilities
 */

import { TerminalKitUI } from './src/client/ui/terminal/terminal-kit-ui.js';

class MudDemo {
  private ui: TerminalKitUI;
  private gameOutput: string[] = [];
  private playerName = '';
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

  constructor() {
    this.ui = new TerminalKitUI();
  }

  async start(): Promise<void> {
    await this.ui.initialize();
    
    this.ui.on('exit', () => {
      this.shutdown();
    });

    this.showWelcome();
    await this.runDemo();
  }

  private showWelcome(): void {
    this.ui.clear();
    
    // ASCII art title
    const title = [
      '███╗   ███╗██╗   ██╗██████╗ ',
      '████╗ ████║██║   ██║██╔══██╗',
      '██╔████╔██║██║   ██║██║  ██║',
      '██║╚██╔╝██║██║   ██║██║  ██║',
      '██║ ╚═╝ ██║╚██████╔╝██████╔╝',
      '╚═╝     ╚═╝ ╚═════╝ ╚═════╝'
    ];

    for (const line of title) {
      this.ui.writeLine(line, 'green');
    }
    
    this.ui.writeLine('');
    this.ui.writeLine('🎮 Terminal UI Demo - No server required!', 'cyan');
    this.ui.writeLine('');
  }

  private async runDemo(): Promise<void> {
    // Character creation
    this.ui.writeLine('Welcome, adventurer! Let\'s create your character.', 'cyan');
    this.ui.writeLine('');
    
    this.playerName = await this.ui.prompt('Enter your character name:', {
      validator: (name: string) => {
        if (!name || name.length < 3) {
          return 'Name must be at least 3 characters long';
        }
        return true;
      }
    });

    // Show creation progress
    this.ui.writeLine('');
    this.ui.showSpinner('Creating character');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    this.ui.hideSpinner();
    this.ui.success(`Character "${this.playerName}" created successfully!`);
    this.ui.writeLine('');

    // Enter the game world
    await this.enterGameWorld();
  }

  private async enterGameWorld(): Promise<void> {
    this.ui.clear();
    
    // Show game world
    this.addGameOutput(
      `Welcome to the Realm, ${this.playerName}!`,
      '',
      '═══ Town Square ═══',
      '',
      'You stand in the bustling town square of Newbridge. Merchants hawk',
      'their wares from colorful stalls, and adventurers gather around the',
      'central fountain, sharing tales of their exploits.',
      '',
      'Exits: north, east, south, west',
      '',
      'Type commands to interact with the world. Try "help" to get started!'
    );

    // Show command menu
    const commands = [
      'look - Look around',
      'inventory - Check your inventory', 
      'stats - View character stats',
      'help - Show all commands',
      'say hello - Say something',
      'north - Try to move north',
      'demo skills - Show skill demo',
      'demo combat - Show combat demo',
      'quit - Exit the demo'
    ];

    this.addGameOutput('', '📋 Available demo commands:');
    for (const cmd of commands) {
      this.addGameOutput(`  ${cmd}`);
    }

    this.renderGame();
    await this.gameLoop();
  }

  private async gameLoop(): Promise<void> {
    while (true) {
      try {
        const command = await this.ui.prompt('>', {});
        
        if (!command.trim()) {
          continue;
        }

        this.addGameOutput(`> ${command}`);
        await this.handleCommand(command.toLowerCase().trim());
        this.renderGame();
      } catch (error) {
        break; // Exit on error (like Ctrl+C)
      }
    }
  }

  private async handleCommand(command: string): Promise<void> {
    const [cmd, ...args] = command.split(' ');

    switch (cmd) {
      case 'help':
        this.addGameOutput(
          '',
          '🎮 Demo Commands:',
          '  look - Examine your surroundings',
          '  inventory - Check your inventory',
          '  stats - View character statistics',
          '  say <message> - Say something',
          '  north/south/east/west - Try to move',
          '  demo skills - Show skill progression demo',
          '  demo combat - Show combat simulation',
          '  quit - Exit the demo',
          ''
        );
        break;

      case 'look':
        this.addGameOutput(
          '',
          'Town Square',
          'The heart of Newbridge bustles with activity. A large fountain',
          'dominates the center, its crystal-clear water sparkling in the',
          'sunlight. You can see:',
          '  • A weathered bulletin board with notices',
          '  • Colorful merchant stalls selling various goods',
          '  • Other adventurers going about their business',
          '  • A path leading to each cardinal direction',
          ''
        );
        break;

      case 'inventory':
        this.addGameOutput(
          '',
          '🎒 Your Inventory:',
          '  • Starter Sword (equipped) - A basic iron blade',
          '  • Leather Armor (equipped) - Provides basic protection',
          '  • Health Potion x3 - Restores 50 HP',
          '  • Mana Potion x2 - Restores 30 MP',
          '  • 50 gold coins - Local currency',
          '  • Travel Rations x5 - Keeps you fed',
          ''
        );
        break;

      case 'stats':
        this.addGameOutput(
          '',
          `📊 Character: ${this.playerName}`,
          `Level: ${this.statusBar.level} (${this.statusBar.rank} Rank)`,
          '',
          '⚔️  Attributes:',
          '  • Power: 10 - Affects damage and carrying capacity',
          '  • Speed: 10 - Affects movement and dodge chance',
          '  • Spirit: 10 - Affects mana and magical abilities',
          '  • Recovery: 10 - Affects health/mana regeneration',
          '',
          '💪 Combat Stats:',
          `  • Health: ${this.statusBar.hp}/${this.statusBar.maxHp}`,
          `  • Mana: ${this.statusBar.mp}/${this.statusBar.maxMp}`,
          `  • Stamina: ${this.statusBar.stamina}/${this.statusBar.maxStamina}`,
          ''
        );
        break;

      case 'say':
        if (args.length === 0) {
          this.addGameOutput('💬 Say what?');
        } else {
          const message = args.join(' ');
          this.addGameOutput(`💬 You say: "${message}"`);
          this.addGameOutput('💭 (In the real game, other players would hear this)');
        }
        break;

      case 'demo':
        if (args[0] === 'skills') {
          await this.demoSkillProgression();
        } else if (args[0] === 'combat') {
          await this.demoCombat();
        } else {
          this.addGameOutput('💡 Try "demo skills" or "demo combat"');
        }
        break;

      case 'north':
      case 'south':
      case 'east':
      case 'west':
        this.addGameOutput(`🚶 You head ${cmd}...`);
        this.addGameOutput('🚧 (In the full game, this would take you to a new area)');
        this.addGameOutput('🗺️  For now, you remain in the town square.');
        break;

      case 'quit':
      case 'exit':
        this.addGameOutput('');
        this.addGameOutput('👋 Thanks for trying the MUD demo!');
        this.addGameOutput('💻 Run "pnpm start" to play the full game with authentication.');
        this.addGameOutput('');
        await new Promise(resolve => setTimeout(resolve, 2000));
        this.shutdown();
        return;

      default:
        this.addGameOutput(`❓ Unknown command: "${command}"`);
        this.addGameOutput('💡 Type "help" for available commands.');
    }
  }

  private async demoSkillProgression(): Promise<void> {
    this.addGameOutput('', '🎯 Skill Progression Demo:');
    
    const skills = ['Swordsmanship', 'Magic', 'Stealth', 'Crafting'];
    
    for (const skill of skills) {
      this.addGameOutput(`📈 Training ${skill}...`);
      this.renderGame();
      
      // Show progress bar
      for (let i = 0; i <= 100; i += 10) {
        this.ui.showProgress(i, 100, { label: skill, showPercentage: true });
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      this.ui.hideProgress();
      
      // Wait a moment for the progress bar to clear
      await new Promise(resolve => setTimeout(resolve, 100));
      
      this.addGameOutput(`✨ ${skill} improved! (Level up!)`);
    }
    
    this.addGameOutput('', '🎉 Skill training complete!');
  }

  private async demoCombat(): Promise<void> {
    this.addGameOutput('', '⚔️  Combat Demo: Wild Goblin appears!');
    this.addGameOutput('');
    
    let playerHp = 100;
    let enemyHp = 80;
    
    while (playerHp > 0 && enemyHp > 0) {
      // Player attack
      const playerDamage = Math.floor(Math.random() * 20) + 10;
      enemyHp = Math.max(0, enemyHp - playerDamage);
      this.addGameOutput(`⚔️  You strike for ${playerDamage} damage! Goblin HP: ${enemyHp}/80`);
      
      if (enemyHp <= 0) {
        this.addGameOutput('🏆 Victory! The goblin is defeated!');
        this.addGameOutput('💰 You gained 25 gold and 50 experience!');
        break;
      }
      
      // Enemy attack
      const enemyDamage = Math.floor(Math.random() * 15) + 5;
      playerHp = Math.max(0, playerHp - enemyDamage);
      this.addGameOutput(`🗡️  Goblin attacks for ${enemyDamage} damage! Your HP: ${playerHp}/100`);
      
      // Update status bar
      this.statusBar.hp = playerHp;
      this.renderGame();
      
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    if (playerHp <= 0) {
      this.addGameOutput('💀 Defeat! You have been slain!');
      this.addGameOutput('🏥 (Don\'t worry, this is just a demo!)');
      this.statusBar.hp = 100; // Reset for demo
    }
  }

  private addGameOutput(...lines: string[]): void {
    this.gameOutput.push(...lines);
    
    // Keep only the last 15 lines for the demo
    if (this.gameOutput.length > 15) {
      this.gameOutput = this.gameOutput.slice(-15);
    }
  }

  private renderGame(): void {
    this.ui.clear();
    
    // Show title
    this.ui.writeLine(`🎮 MUD Demo - Playing as ${this.playerName}`, 'cyan');
    this.ui.writeLine('');
    
    // Show game output
    for (const line of this.gameOutput) {
      const color = line.startsWith('>') ? 'cyan' : 'white';
      this.ui.writeLine(line, color);
    }
    
    // Show status bar
    this.ui.writeLine('');
    const statusContent = 
      `❤️  HP: ${this.statusBar.hp}/${this.statusBar.maxHp}  ` +
      `🔮 MP: ${this.statusBar.mp}/${this.statusBar.maxMp}  ` +
      `⚡ Stamina: ${this.statusBar.stamina}/${this.statusBar.maxStamina}  ` +
      `📊 Level: ${this.statusBar.level} (${this.statusBar.rank})`;
    
    this.ui.writeLine('─'.repeat(80), 'gray');
    this.ui.writeLine(statusContent, 'yellow');
    this.ui.writeLine('─'.repeat(80), 'gray');
    this.ui.writeLine('');
  }

  private shutdown(): void {
    this.ui.destroy();
    process.exit(0);
  }
}

// Run the demo
const demo = new MudDemo();
demo.start().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});