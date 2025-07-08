import type { Ability, CombatComponent, Entity } from '@/shared/types/game.js';
import { BaseSystem } from './base-system.js';

/**
 * Handles combat mechanics and damage calculation
 */
export class CombatSystem extends BaseSystem {
  readonly requiredComponents = ['combat'] as const;
  readonly priority = 20;

  getName(): string {
    return 'CombatSystem';
  }

  update(entities: readonly Entity[], deltaTime: number): void {
    for (const entity of entities) {
      if (!this.hasRequiredComponents(entity)) continue;

      const combat = this.getRequiredComponent<CombatComponent>(entity, 'combat');

      // Update combat state
      if (combat.combatState === 'combat') {
        // Process ongoing combat effects
        this.processActiveEffects(entity, combat, deltaTime);

        // Regenerate resources
        this.regenerateResources(entity, combat, deltaTime);
      }

      // Update cooldowns
      this.updateCooldowns(entity, combat, deltaTime);
    }
  }

  /**
   * Process active status effects
   */
  private processActiveEffects(_entity: Entity, combat: CombatComponent, deltaTime: number): void {
    combat.activeEffects = combat.activeEffects.filter((effect) => {
      effect.duration -= deltaTime;

      if (effect.duration <= 0) {
        this.emitEvent('effect.expired', {
          entityId: _entity.id,
          effectId: effect.id,
        });
        return false;
      }

      return true;
    });
  }

  /**
   * Regenerate health, mana, and stamina
   */
  private regenerateResources(entity: Entity, combat: CombatComponent, deltaTime: number): void {
    const regenRate = combat.attributes.recovery / 10; // Base regen rate

    // Health regeneration
    if (combat.health < combat.maxHealth) {
      combat.health = Math.min(combat.maxHealth, combat.health + regenRate * deltaTime);
    }

    // Mana regeneration
    if (combat.mana < combat.maxMana) {
      combat.mana = Math.min(
        combat.maxMana,
        combat.mana + regenRate * 2 * deltaTime, // Mana regens faster
      );
    }

    // Stamina regeneration
    if (combat.stamina < combat.maxStamina) {
      combat.stamina = Math.min(
        combat.maxStamina,
        combat.stamina + regenRate * 3 * deltaTime, // Stamina regens fastest
      );
    }
  }

  /**
   * Update ability cooldowns
   */
  private updateCooldowns(_entity: Entity, _combat: CombatComponent, _deltaTime: number): void {
    // This would track and update cooldowns for abilities
    // Implementation depends on how cooldowns are stored
  }

  /**
   * Execute an ability
   */
  useAbility(attacker: Entity, target: Entity, ability: Ability): void {
    const attackerCombat = this.getRequiredComponent<CombatComponent>(attacker, 'combat');
    const targetCombat = this.getRequiredComponent<CombatComponent>(target, 'combat');

    // Check mana cost
    if (attackerCombat.mana < ability.manaCost) {
      this.emitEvent('ability.failed', {
        attackerId: attacker.id,
        reason: 'insufficient_mana',
      });
      return;
    }

    // Deduct mana
    attackerCombat.mana -= ability.manaCost;

    // Calculate damage (simplified)
    const baseDamage = attackerCombat.attributes.power * 2;
    const defense = targetCombat.attributes.speed / 2;
    const finalDamage = Math.max(1, baseDamage - defense);

    // Apply damage
    targetCombat.health = Math.max(0, targetCombat.health - finalDamage);

    // Emit events
    this.emitEvent('ability.used', {
      attackerId: attacker.id,
      targetId: target.id,
      abilityId: ability.id,
      damage: finalDamage,
    });

    if (targetCombat.health <= 0) {
      this.emitEvent('entity.defeated', {
        entityId: target.id,
        defeatedBy: attacker.id,
      });
    }
  }

  onSystemStart(): void {
    this.info('Combat system started');
  }

  onSystemStop(): void {
    this.info('Combat system stopped');
  }
}
