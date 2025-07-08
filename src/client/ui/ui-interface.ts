/**
 * Shared UI interface that can be implemented by both terminal (Ink) and web (Xterm.js) clients
 */

import type { EventEmitter } from 'node:events';

export interface UIColor {
  red: string;
  green: string;
  blue: string;
  yellow: string;
  cyan: string;
  magenta: string;
  white: string;
  gray: string;
}

export interface UITheme {
  colors: UIColor;
  success: string;
  error: string;
  warning: string;
  info: string;
  primary: string;
  secondary: string;
}

export interface UIEvents {
  command: (input: string) => void;
  exit: () => void;
  resize: (width: number, height: number) => void;
}

export interface MenuItem {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface PromptOptions {
  mask?: boolean; // For password input
  placeholder?: string;
  defaultValue?: string;
  validator?: (value: string) => boolean | string;
}

export interface ProgressOptions {
  label?: string;
  showPercentage?: boolean;
  barWidth?: number;
}

export interface BoxStyle {
  borderColor?: keyof UIColor;
  padding?: number;
  margin?: number;
  title?: string;
}

/**
 * Core UI interface that all implementations must follow
 */
export interface GameUI extends EventEmitter {
  // Lifecycle methods
  initialize(): Promise<void>;
  destroy(): void;

  // Output methods
  clear(): void;
  writeLine(text: string, color?: keyof UIColor): void;
  write(text: string, color?: keyof UIColor): void;

  // Formatted output
  header(text: string, color?: keyof UIColor): void;
  box(content: string[], style?: BoxStyle): void;
  error(message: string): void;
  success(message: string): void;
  warning(message: string): void;
  info(message: string): void;

  // Input methods
  prompt(message?: string, options?: PromptOptions): Promise<string>;
  confirm(message: string): Promise<boolean>;
  menu(title: string, items: MenuItem[]): Promise<string>;

  // Progress indication
  showProgress(current: number, total: number, options?: ProgressOptions): void;
  hideProgress(): void;
  showSpinner(message: string): void;
  hideSpinner(): void;

  // Screen management
  pushScreen(screenId: string): void;
  popScreen(): void;
  getCurrentScreen(): string | null;

  // Theme
  setTheme(theme: Partial<UITheme>): void;
  getTheme(): UITheme;
}

/**
 * Screen components that can be rendered
 */
export interface UIScreen {
  id: string;
  render(): void;
  onMount?(): void;
  onUnmount?(): void;
  handleInput?(input: string): void;
}

/**
 * Factory for creating UI instances
 */
export interface UIFactory {
  createUI(type: 'terminal' | 'web', options?: any): GameUI;
}
