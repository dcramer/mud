import type { Direction, Entity, LocationComponent } from '@/shared/types/game.js';
import { BaseSystem } from './base-system.js';

/**
 * Handles entity movement through the game world
 */
export class MovementSystem extends BaseSystem {
  readonly requiredComponents = ['location'] as const;
  readonly priority = 10;

  getName(): string {
    return 'MovementSystem';
  }

  update(entities: readonly Entity[], _deltaTime: number): void {
    // Movement system would process movement commands here
    for (const entity of entities) {
      if (!this.hasRequiredComponents(entity)) continue;

      const location = this.getRequiredComponent<LocationComponent>(entity, 'location');

      // Process any pending movement for this entity
      // This would be triggered by movement commands
      this.debug('Processing movement for entity', {
        entityId: entity.id,
        currentRoom: location.roomId,
      });
    }
  }

  /**
   * Move an entity in a direction
   */
  moveEntity(entity: Entity, direction: Direction): void {
    const location = this.getRequiredComponent<LocationComponent>(entity, 'location');

    // This would:
    // 1. Check if the direction is valid from current room
    // 2. Check if the path is blocked
    // 3. Update the entity's location
    // 4. Emit movement events

    this.emitEvent('entity.moved', {
      entityId: entity.id,
      fromRoom: location.roomId,
      direction,
    });
  }

  /**
   * Teleport an entity to a specific room
   */
  teleportEntity(entity: Entity, targetRoomId: string): void {
    const location = this.getRequiredComponent<LocationComponent>(entity, 'location');
    const oldRoom = location.roomId;

    // Update location
    location.roomId = targetRoomId as any;

    this.emitEvent('entity.teleported', {
      entityId: entity.id,
      fromRoom: oldRoom,
      toRoom: targetRoomId,
    });
  }

  onSystemStart(): void {
    this.info('Movement system started');
  }

  onSystemStop(): void {
    this.info('Movement system stopped');
  }
}
