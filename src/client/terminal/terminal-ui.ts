import { EventEmitter } from 'node:events';
import readline from 'node:readline';
import chalk from 'chalk';

export interface TerminalUIEvents {
  command: (input: string) => void;
  exit: () => void;
}

export class TerminalUI extends EventEmitter {
  private rl: readline.Interface;
  private isPrompting = false;

  constructor() {
    super();

    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      prompt: chalk.green('> '),
    });

    this.setupHandlers();
  }

  private setupHandlers(): void {
    this.rl.on('line', (input) => {
      const trimmed = input.trim();
      if (trimmed) {
        this.emit('command', trimmed);
      }
      if (this.isPrompting) {
        this.prompt();
      }
    });

    this.rl.on('close', () => {
      this.emit('exit');
    });

    // Handle Ctrl+C gracefully
    process.on('SIGINT', () => {
      this.writeLine('\n' + chalk.yellow('Goodbye!'));
      this.close();
    });
  }

  /**
   * Write a line to the terminal
   */
  writeLine(text: string): void {
    console.log(text);
    if (this.isPrompting && this.rl) {
      this.rl.prompt(true);
    }
  }

  /**
   * Write text without newline
   */
  write(text: string): void {
    process.stdout.write(text);
  }

  /**
   * Clear the terminal screen
   */
  clear(): void {
    console.clear();
  }

  /**
   * Display a header with formatting
   */
  header(text: string, color: 'blue' | 'green' | 'yellow' | 'red' = 'blue'): void {
    const colors = {
      blue: chalk.blue,
      green: chalk.green,
      yellow: chalk.yellow,
      red: chalk.red,
    };

    const line = '═'.repeat(text.length + 4);
    this.writeLine(colors[color](line));
    this.writeLine(colors[color](`║ ${text} ║`));
    this.writeLine(colors[color](line));
  }

  /**
   * Display a box with content
   */
  box(content: string[], color: 'white' | 'gray' = 'white'): void {
    const maxLength = Math.max(...content.map((line) => line.length));
    const colorFn = color === 'gray' ? chalk.gray : chalk.white;

    const topLine = '┌' + '─'.repeat(maxLength + 2) + '┐';
    const bottomLine = '└' + '─'.repeat(maxLength + 2) + '┘';

    this.writeLine(colorFn(topLine));
    for (const line of content) {
      const padding = ' '.repeat(maxLength - line.length);
      this.writeLine(colorFn(`│ ${line}${padding} │`));
    }
    this.writeLine(colorFn(bottomLine));
  }

  /**
   * Display an error message
   */
  error(message: string): void {
    this.writeLine(chalk.red(`✖ ${message}`));
  }

  /**
   * Display a success message
   */
  success(message: string): void {
    this.writeLine(chalk.green(`✔ ${message}`));
  }

  /**
   * Display a warning message
   */
  warning(message: string): void {
    this.writeLine(chalk.yellow(`⚠ ${message}`));
  }

  /**
   * Display an info message
   */
  info(message: string): void {
    this.writeLine(chalk.blue(`ℹ ${message}`));
  }

  /**
   * Start prompting for input
   */
  prompt(): void {
    this.isPrompting = true;
    this.rl.prompt();
  }

  /**
   * Stop prompting for input
   */
  pausePrompt(): void {
    this.isPrompting = false;
  }

  /**
   * Ask a question and wait for answer
   */
  async question(query: string): Promise<string> {
    return new Promise((resolve) => {
      this.rl.question(chalk.cyan(query + ' '), (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Ask for password (hidden input)
   */
  async questionPassword(query: string): Promise<string> {
    return new Promise((resolve) => {
      const stdin = process.stdin;
      const wasRaw = stdin.isRaw;

      stdin.setRawMode?.(true);
      process.stdout.write(chalk.cyan(query + ' '));

      let password = '';

      const onData = (char: Buffer) => {
        const str = char.toString();

        switch (str) {
          case '\n':
          case '\r':
          case '\r\n':
            stdin.setRawMode?.(wasRaw || false);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            resolve(password);
            break;
          case '\u0003': // Ctrl+C
            stdin.setRawMode?.(wasRaw || false);
            stdin.removeListener('data', onData);
            process.stdout.write('\n');
            process.exit();
            break;
          case '\u007f': // Backspace
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\b \b');
            }
            break;
          default:
            password += str;
            process.stdout.write('*');
        }
      };

      stdin.on('data', onData);
    });
  }

  /**
   * Display a menu and get selection
   */
  async menu(title: string, options: string[]): Promise<number> {
    this.writeLine(chalk.cyan(title));
    this.writeLine('');

    options.forEach((option, index) => {
      this.writeLine(chalk.white(`  ${index + 1}. ${option}`));
    });

    this.writeLine('');

    while (true) {
      const answer = await this.question('Select an option (number):');
      const selection = Number.parseInt(answer, 10);

      if (selection >= 1 && selection <= options.length) {
        return selection - 1;
      }

      this.error('Invalid selection. Please try again.');
    }
  }

  /**
   * Display a progress bar
   */
  showProgress(current: number, total: number, label?: string): void {
    const percentage = Math.floor((current / total) * 100);
    const barLength = 30;
    const filled = Math.floor((current / total) * barLength);
    const empty = barLength - filled;

    const bar = chalk.green('█'.repeat(filled)) + chalk.gray('░'.repeat(empty));
    const text = label ? `${label}: ` : '';

    process.stdout.write(`\r${text}[${bar}] ${percentage}%`);

    if (current >= total) {
      process.stdout.write('\n');
    }
  }

  /**
   * Close the terminal interface
   */
  close(): void {
    this.isPrompting = false;
    this.rl.close();
  }
}
