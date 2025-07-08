// Logger interface following industry best practices

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

// Console implementation for development
export class ConsoleLogger implements Logger {
  constructor(private readonly name: string) {}

  debug(message: string, context?: Record<string, unknown>): void {
    console.debug(`[${this.name}] ${message}`, context);
  }

  info(message: string, context?: Record<string, unknown>): void {
    console.info(`[${this.name}] ${message}`, context);
  }

  warn(message: string, context?: Record<string, unknown>): void {
    console.warn(`[${this.name}] ${message}`, context);
  }

  error(message: string, context?: Record<string, unknown>): void {
    console.error(`[${this.name}] ${message}`, context);
  }
}
