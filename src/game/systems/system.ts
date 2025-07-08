// System interface following ECS patterns
import type { Entity } from '@/shared/types/game.js';

export interface System {
  readonly requiredComponents: readonly string[];
  readonly priority?: number;

  update(entities: readonly Entity[], deltaTime: number): void;
  onSystemStart?(): void;
  onSystemStop?(): void;
  onEntityAdded?(entity: Entity): void;
  onEntityRemoved?(entity: Entity): void;
}
