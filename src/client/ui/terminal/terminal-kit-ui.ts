import { EventEmitter } from 'node:events';
import terminalKit from 'terminal-kit';
import type { 
  GameUI, 
  UITheme, 
  UIColor, 
  MenuItem, 
  PromptOptions, 
  ProgressOptions, 
  BoxStyle,
  UIScreen 
} from '../ui-interface.js';

const term = terminalKit.terminal;

const DEFAULT_THEME: UITheme = {
  colors: {
    red: 'red',
    green: 'green',
    blue: 'blue',
    yellow: 'yellow',
    cyan: 'cyan',
    magenta: 'magenta',
    white: 'white',
    gray: 'gray',
  },
  success: 'green',
  error: 'red',
  warning: 'yellow',
  info: 'blue',
  primary: 'cyan',
  secondary: 'gray',
};

export class TerminalKitUI extends EventEmitter implements GameUI {
  private theme: UITheme = DEFAULT_THEME;
  private screens: UIScreen[] = [];
  private currentProgressBar: any = null;
  private currentSpinner: any = null;
  private isInitialized = false;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    // Set up terminal
    term.fullscreen(true);
    term.alternateScreenBuffer(true);
    term.hideCursor(false);
    term.grabInput(true);

    // Handle terminal events
    term.on('key', (name: string, matches: any, data: any) => {
      // Ctrl+C to exit
      if (name === 'CTRL_C') {
        this.emit('exit');
        return;
      }

      // Emit key events for screens to handle
      this.emit('key', { name, matches, data });
    });

    term.on('resize', (width: number, height: number) => {
      this.emit('resize', width, height);
    });

    this.isInitialized = true;
  }

  destroy(): void {
    if (!this.isInitialized) return;

    // Clean up progress/spinner
    this.hideProgress();
    this.hideSpinner();

    // Restore terminal
    term.grabInput(false);
    term.fullscreen(false);
    term.alternateScreenBuffer(false);
    term.hideCursor(false);

    this.removeAllListeners();
    this.isInitialized = false;
  }

  clear(): void {
    term.clear();
  }

  writeLine(text: string, color?: keyof UIColor): void {
    if (color && this.theme.colors[color]) {
      term.styleReset();
      term.color(this.theme.colors[color] as any);
    }
    term(text + '\n');
    if (color) {
      term.styleReset();
    }
  }

  write(text: string, color?: keyof UIColor): void {
    if (color && this.theme.colors[color]) {
      term.styleReset();
      term.color(this.theme.colors[color] as any);
    }
    term(text);
    if (color) {
      term.styleReset();
    }
  }

  header(text: string, color?: keyof UIColor): void {
    const line = '═'.repeat(text.length + 4);
    const c = color || 'blue';
    this.writeLine(line, c);
    this.writeLine(`║ ${text} ║`, c);
    this.writeLine(line, c);
  }

  box(content: string[], style?: BoxStyle): void {
    const maxLength = Math.max(...content.map(line => line.length));
    const color = style?.borderColor || 'white';
    
    if (style?.title) {
      this.writeLine(`┌─ ${style.title} ${'─'.repeat(Math.max(0, maxLength - style.title.length - 1))}┐`, color);
    } else {
      this.writeLine('┌' + '─'.repeat(maxLength + 2) + '┐', color);
    }
    
    for (const line of content) {
      const padding = ' '.repeat(maxLength - line.length);
      this.writeLine(`│ ${line}${padding} │`, color);
    }
    
    this.writeLine('└' + '─'.repeat(maxLength + 2) + '┘', color);
  }

  error(message: string): void {
    this.writeLine(`✖ ${message}`, 'red');
  }

  success(message: string): void {
    this.writeLine(`✔ ${message}`, 'green');
  }

  warning(message: string): void {
    this.writeLine(`⚠ ${message}`, 'yellow');
  }

  info(message: string): void {
    this.writeLine(`ℹ ${message}`, 'blue');
  }

  async prompt(message = '', options: PromptOptions = {}): Promise<string> {
    return new Promise((resolve) => {
      if (message) {
        term.color(this.theme.colors.cyan as any);
        term(message + ' ');
        term.styleReset();
      }

      const input = options.mask ? term.inputField({
        echo: false,
        echoChar: '*'
      }) : term.inputField();

      input.promise.then((value: string | undefined) => {
        term('\n');
        
        const inputValue = value || '';
        
        // Validate if validator provided
        if (options.validator) {
          const validation = options.validator(inputValue);
          if (validation !== true) {
            this.error(typeof validation === 'string' ? validation : 'Invalid input');
            // Retry
            this.prompt(message, options).then(resolve);
            return;
          }
        }
        
        resolve(inputValue || options.defaultValue || '');
      });
    });
  }

  async confirm(message: string): Promise<boolean> {
    return new Promise((resolve) => {
      term.color(this.theme.colors.cyan as any);
      term(message + ' (y/n) ');
      term.styleReset();

      const input = term.inputField({ maxLength: 1 });
      input.promise.then((value: string | undefined) => {
        term('\n');
        const confirmed = (value || '').toLowerCase() === 'y';
        resolve(confirmed);
      });
    });
  }

  async menu(title: string, items: MenuItem[]): Promise<string> {
    return new Promise((resolve) => {
      term.color(this.theme.colors.cyan as any);
      term(title + '\n\n');
      term.styleReset();

      const menuItems = items.map(item => item.label);
      
      term.singleColumnMenu(menuItems, (error: any, response: any) => {
        if (error) {
          this.error('Menu selection failed');
          resolve('');
          return;
        }

        const selectedItem = items[response.selectedIndex];
        resolve(selectedItem?.value || '');
      });
    });
  }

  showProgress(current: number, total: number, options: ProgressOptions = {}): void {
    const percentage = current / total;
    const width = options.barWidth || 30;
    const filled = Math.floor(percentage * width);
    const empty = width - filled;
    
    // Create a simple text-based progress bar
    const bar = '█'.repeat(filled) + '░'.repeat(empty);
    const percentText = options.showPercentage !== false ? ` ${Math.floor(percentage * 100)}%` : '';
    
    // Clear the current line and draw the progress bar
    term.column(1);
    term.eraseLine();
    
    if (options.label) {
      term.color('cyan');
      term(options.label + ': ');
      term.styleReset();
    }
    
    term.color('green');
    term(bar);
    term.styleReset();
    term(percentText);
    
    if (current >= total) {
      this.hideProgress();
    }
  }

  hideProgress(): void {
    // Clear the progress bar line and move to next line
    term.column(1);
    term.eraseLine();
    term('\n');
    this.currentProgressBar = null;
  }

  showSpinner(message: string): void {
    this.hideSpinner(); // Clean up any existing spinner

    // Create a simple text-based spinner
    term(message + ' ');
    term.color('cyan');
    term('⠋');
    term.styleReset();
    
    // Mark that we have a spinner active
    this.currentSpinner = { active: true };
  }

  hideSpinner(): void {
    if (this.currentSpinner) {
      // Clear the spinner line and move to next line
      term.column(1);
      term.eraseLine();
      term('\n');
      this.currentSpinner = null;
    }
  }

  pushScreen(screenId: string): void {
    // Screen management - basic implementation
    const screen: UIScreen = {
      id: screenId,
      render: () => {
        // Default render - screens should override
      }
    };
    this.screens.push(screen);
  }

  popScreen(): void {
    if (this.screens.length > 0) {
      const screen = this.screens.pop();
      if (screen?.onUnmount) {
        screen.onUnmount();
      }
    }
  }

  getCurrentScreen(): string | null {
    return this.screens.length > 0 
      ? this.screens[this.screens.length - 1].id 
      : null;
  }

  setTheme(theme: Partial<UITheme>): void {
    this.theme = { ...this.theme, ...theme };
  }

  getTheme(): UITheme {
    return this.theme;
  }

  // Terminal-kit specific methods for game features
  
  /**
   * Get terminal dimensions
   */
  getSize(): { width: number; height: number } {
    return { width: term.width, height: term.height };
  }

  /**
   * Move cursor to specific position
   */
  moveTo(x: number, y: number): void {
    term.moveTo(x, y);
  }

  /**
   * Save and restore cursor position
   */
  saveCursor(): void {
    term.saveCursor();
  }

  restoreCursor(): void {
    term.restoreCursor();
  }

  /**
   * Handle raw key input for games
   */
  onKey(callback: (key: { name: string; matches: any; data: any }) => void): void {
    this.on('key', callback);
  }

  /**
   * Remove key handler
   */
  offKey(callback: (key: { name: string; matches: any; data: any }) => void): void {
    this.off('key', callback);
  }

  /**
   * Create a scrolling text area for game output
   */
  createGameOutput(x: number, y: number, width: number, height: number) {
    // Terminal-kit doesn't have createInlineMenu
    // This would need to be implemented using lower-level terminal operations
    // For now, we'll just return a placeholder
    return {
      x, y, width, height,
      // Methods would be implemented here for a real scrolling area
    };
  }

  /**
   * Create a status bar
   */
  drawStatusBar(y: number, content: string): void {
    term.moveTo(1, y);
    term.eraseLine();
    term.inverse(content.padEnd(term.width));
    term.styleReset();
  }
}