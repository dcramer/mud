import type { EntityManager } from '@/game/entities/entity-manager.js';
import type { GameEventEmitter } from '@/game/events/event-emitter.js';
import type { GameResult } from '@/shared/types/core.js';
import { GameError, GameErrorCode } from '@/shared/types/core.js';
import type { Logger } from '@/shared/utils/logger.js';
import { failure, success } from '@/shared/utils/result.js';
import type { System } from './system.js';

/**
 * Manages all game systems and their lifecycle
 * Coordinates system initialization, updates, and shutdown
 */
export class SystemManager {
  private readonly systems = new Map<string, System>();
  private readonly systemOrder: string[] = [];
  private initialized = false;

  constructor(
    private readonly entityManager: EntityManager,
    private readonly _eventEmitter: GameEventEmitter,
    private readonly logger: Logger,
  ) {}

  /**
   * Register a system with the manager
   */
  registerSystem(name: string, system: System): GameResult<void> {
    if (this.systems.has(name)) {
      return failure(
        new GameError(
          `System '${name}' is already registered`,
          GameErrorCode.SYSTEM_ALREADY_EXISTS,
          { systemName: name },
        ),
      );
    }

    // Validate system
    if (!system.requiredComponents || system.requiredComponents.length === 0) {
      this.logger.warn(`System '${name}' has no required components`);
    }

    this.systems.set(name, system);
    this.systemOrder.push(name);

    // Sort by priority
    this.sortSystemsByPriority();

    // Add to entity manager
    this.entityManager.addSystem(system);

    this.logger.info(`Registered system: ${name}`, {
      priority: system.priority || 0,
      requiredComponents: system.requiredComponents,
    });

    // If already initialized, start the new system
    if (this.initialized && system.onSystemStart) {
      try {
        system.onSystemStart();
      } catch (error) {
        this.logger.error(`Failed to start system '${name}':`, { error });
      }
    }

    return success(undefined);
  }

  /**
   * Unregister a system
   */
  unregisterSystem(name: string): GameResult<void> {
    const system = this.systems.get(name);
    if (!system) {
      return failure(
        new GameError(`System '${name}' not found`, GameErrorCode.SYSTEM_NOT_FOUND, {
          systemName: name,
        }),
      );
    }

    // Stop the system if running
    if (this.initialized && system.onSystemStop) {
      try {
        system.onSystemStop();
      } catch (error) {
        this.logger.error(`Error stopping system '${name}':`, { error });
      }
    }

    // Remove from entity manager
    this.entityManager.removeSystem(system);

    // Remove from our tracking
    this.systems.delete(name);
    const index = this.systemOrder.indexOf(name);
    if (index !== -1) {
      this.systemOrder.splice(index, 1);
    }

    this.logger.info(`Unregistered system: ${name}`);

    return success(undefined);
  }

  /**
   * Get a system by name
   */
  getSystem<T extends System>(name: string): T | undefined {
    return this.systems.get(name) as T | undefined;
  }

  /**
   * Get all registered systems
   */
  getAllSystems(): ReadonlyMap<string, System> {
    return this.systems;
  }

  /**
   * Get system names in priority order
   */
  getSystemOrder(): readonly string[] {
    return this.systemOrder;
  }

  /**
   * Initialize all systems
   */
  async initialize(): Promise<GameResult<void>> {
    if (this.initialized) {
      return failure(
        new GameError('SystemManager already initialized', GameErrorCode.ALREADY_INITIALIZED),
      );
    }

    this.logger.info('Initializing SystemManager...');

    const errors: Array<{ system: string; error: unknown }> = [];

    // Initialize systems in priority order
    for (const systemName of this.systemOrder) {
      const system = this.systems.get(systemName)!;

      if (system.onSystemStart) {
        try {
          this.logger.debug(`Starting system: ${systemName}`);
          system.onSystemStart();
        } catch (error) {
          this.logger.error(`Failed to start system '${systemName}':`, { error });
          errors.push({ system: systemName, error });
        }
      }
    }

    this.initialized = true;

    if (errors.length > 0) {
      return failure(
        new GameError(
          `Failed to initialize ${errors.length} system(s)`,
          GameErrorCode.SYSTEM_INITIALIZATION_FAILED,
          { errors },
        ),
      );
    }

    this.logger.info('SystemManager initialized successfully', {
      systemCount: this.systems.size,
    });

    return success(undefined);
  }

  /**
   * Shutdown all systems
   */
  async shutdown(): Promise<GameResult<void>> {
    if (!this.initialized) {
      return failure(new GameError('SystemManager not initialized', GameErrorCode.NOT_INITIALIZED));
    }

    this.logger.info('Shutting down SystemManager...');

    const errors: Array<{ system: string; error: unknown }> = [];

    // Shutdown systems in reverse priority order
    const reverseOrder = [...this.systemOrder].reverse();

    for (const systemName of reverseOrder) {
      const system = this.systems.get(systemName)!;

      if (system.onSystemStop) {
        try {
          this.logger.debug(`Stopping system: ${systemName}`);
          system.onSystemStop();
        } catch (error) {
          this.logger.error(`Failed to stop system '${systemName}':`, { error });
          errors.push({ system: systemName, error });
        }
      }
    }

    this.initialized = false;

    if (errors.length > 0) {
      return failure(
        new GameError(
          `Failed to shutdown ${errors.length} system(s)`,
          GameErrorCode.SYSTEM_SHUTDOWN_FAILED,
          { errors },
        ),
      );
    }

    this.logger.info('SystemManager shut down successfully');

    return success(undefined);
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Reload a specific system (stop and start)
   */
  async reloadSystem(name: string): Promise<GameResult<void>> {
    const system = this.systems.get(name);
    if (!system) {
      return failure(
        new GameError(`System '${name}' not found`, GameErrorCode.SYSTEM_NOT_FOUND, {
          systemName: name,
        }),
      );
    }

    this.logger.info(`Reloading system: ${name}`);

    // Stop the system
    if (system.onSystemStop) {
      try {
        system.onSystemStop();
      } catch (error) {
        this.logger.error(`Error stopping system '${name}' during reload:`, { error });
      }
    }

    // Start the system
    if (system.onSystemStart) {
      try {
        system.onSystemStart();
      } catch (error) {
        return failure(
          new GameError(`Failed to restart system '${name}'`, GameErrorCode.SYSTEM_RELOAD_FAILED, {
            systemName: name,
            error,
          }),
        );
      }
    }

    this.logger.info(`System '${name}' reloaded successfully`);

    return success(undefined);
  }

  /**
   * Sort systems by priority
   */
  private sortSystemsByPriority(): void {
    this.systemOrder.sort((a, b) => {
      const systemA = this.systems.get(a)!;
      const systemB = this.systems.get(b)!;
      const priorityA = systemA.priority || 0;
      const priorityB = systemB.priority || 0;
      return priorityA - priorityB;
    });
  }

  /**
   * Get system statistics
   */
  getStatistics(): {
    totalSystems: number;
    initialized: boolean;
    systemDetails: Array<{
      name: string;
      priority: number;
      requiredComponents: readonly string[];
    }>;
  } {
    const systemDetails = this.systemOrder.map((name) => {
      const system = this.systems.get(name)!;
      return {
        name,
        priority: system.priority || 0,
        requiredComponents: system.requiredComponents,
      };
    });

    return {
      totalSystems: this.systems.size,
      initialized: this.initialized,
      systemDetails,
    };
  }
}
