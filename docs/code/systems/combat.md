# Combat System

## System Overview

The Combat System manages all combat-related operations including ability usage, damage calculation, status effects, and combat state management through the ECS architecture.

## Core Responsibilities

- Initiate and manage combat encounters
- Process ability usage and effects
- Calculate damage and healing
- Manage status effects (afflictions/boons)
- Handle combat timing and cooldowns

## System Implementation

### Combat System Class
```typescript
export class CombatSystem {
  constructor(
    private entityManager: EntityManager,
    private eventEmitter: GameEventEmitter,
    private logger: Logger
  ) {}
  
  async useAbility(
    casterId: string,
    abilityId: string,
    targetId?: string
  ): Promise<GameResult<AbilityResult>> {
    const caster = this.entityManager.getEntity(casterId);
    if (!caster) {
      return {
        success: false,
        error: new GameError('Caster not found', 'ENTITY_NOT_FOUND')
      };
    }
    
    const combat = this.getComponent<CombatComponent>(caster, 'combat');
    if (!combat) {
      return {
        success: false,
        error: new GameError('Entity cannot use abilities', 'NO_COMBAT_COMPONENT')
      };
    }
    
    const ability = combat.data.abilities.find(a => a.id === abilityId);
    if (!ability) {
      return {
        success: false,
        error: new GameError('Ability not found', 'ABILITY_NOT_FOUND')
      };
    }
    
    // Validate ability usage
    const validationResult = this.validateAbilityUsage(caster, ability);
    if (!validationResult.success) {
      return validationResult;
    }
    
    // Get target if specified
    const target = targetId ? this.entityManager.getEntity(targetId) : caster;
    if (targetId && !target) {
      return {
        success: false,
        error: new GameError('Target not found', 'TARGET_NOT_FOUND')
      };
    }
    
    // Execute ability
    const result = await this.executeAbility(caster, ability, target);
    
    if (result.success) {
      // Apply cooldown
      ability.cooldownRemaining = ability.cooldownDuration;
      
      // Consume resources
      combat.data.mana -= ability.manaCost;
      combat.data.stamina -= ability.staminaCost;
      
      // Emit event
      this.eventEmitter.emit('ability:used', {
        playerId: casterId,
        abilityId,
        target: targetId,
        damage: result.data.damage
      });
    }
    
    return result;
  }
  
  private validateAbilityUsage(
    caster: Entity, 
    ability: Ability
  ): GameResult<void> {
    const combat = this.getComponent<CombatComponent>(caster, 'combat')!;
    
    if (ability.cooldownRemaining > 0) {
      return {
        success: false,
        error: new GameError('Ability on cooldown', 'ABILITY_COOLDOWN')
      };
    }
    
    if (combat.data.mana < ability.manaCost) {
      return {
        success: false,
        error: new GameError('Insufficient mana', 'INSUFFICIENT_MANA')
      };
    }
    
    if (combat.data.stamina < ability.staminaCost) {
      return {
        success: false,
        error: new GameError('Insufficient stamina', 'INSUFFICIENT_STAMINA')
      };
    }
    
    return { success: true, data: undefined };
  }
}
```

## Damage Calculation System

### Damage Types and Modifiers
```typescript
interface DamageCalculation {
  baseDamage: number;
  damageType: 'physical' | 'magical' | 'true';
  powerScaling: number;
  modifiers: {
    criticalChance: number;
    criticalMultiplier: number;
    bonusDamage: number;
    damageReduction: number;
  };
}

export class DamageCalculator {
  calculateDamage(
    attacker: Entity,
    target: Entity,
    ability: Ability
  ): DamageResult {
    const attackerCombat = this.getComponent<CombatComponent>(attacker, 'combat')!;
    const targetCombat = this.getComponent<CombatComponent>(target, 'combat')!;
    
    let damage = ability.baseDamage;
    
    // Apply power scaling
    const powerAttribute = attackerCombat.data.attributes.power;
    damage += powerAttribute * ability.powerScaling;
    
    // Check for critical hit
    const critChance = this.calculateCriticalChance(attacker, ability);
    const isCritical = Math.random() < critChance;
    
    if (isCritical) {
      damage *= this.calculateCriticalMultiplier(attacker, ability);
    }
    
    // Apply damage reduction
    const reduction = this.calculateDamageReduction(target, ability.damageType);
    damage = Math.max(1, damage - reduction);
    
    // Apply final damage
    const finalDamage = Math.floor(damage);
    targetCombat.data.health = Math.max(0, targetCombat.data.health - finalDamage);
    
    // Check for death
    if (targetCombat.data.health === 0) {
      this.eventEmitter.emit('player:died', {
        playerId: target.id,
        location: this.getLocation(target)
      });
    }
    
    return {
      damage: finalDamage,
      isCritical,
      damageType: ability.damageType,
      targetHealth: targetCombat.data.health
    };
  }
  
  private calculateCriticalChance(attacker: Entity, ability: Ability): number {
    const combat = this.getComponent<CombatComponent>(attacker, 'combat')!;
    const speedAttribute = combat.data.attributes.speed;
    
    // Base crit chance from ability + speed scaling
    return ability.criticalChance + (speedAttribute * 0.001);
  }
  
  private calculateDamageReduction(target: Entity, damageType: string): number {
    const combat = this.getComponent<CombatComponent>(target, 'combat')!;
    const recoveryAttribute = combat.data.attributes.recovery;
    
    // Base reduction from recovery attribute
    let reduction = recoveryAttribute * 0.1;
    
    // Apply status effect modifiers
    combat.data.activeEffects.forEach(effect => {
      if (effect.type === 'damage_resistance' && effect.damageType === damageType) {
        reduction += effect.value;
      }
    });
    
    return reduction;
  }
}
```

## Status Effect Management

### Status Effect Application
```typescript
export interface StatusEffect {
  id: string;
  name: string;
  type: 'affliction' | 'boon';
  duration: number;
  tickInterval?: number;
  stacks: number;
  maxStacks: number;
  effects: {
    attributeModifiers?: AttributeModifiers;
    damageOverTime?: DOTEffect;
    healingOverTime?: HOTEffect;
    abilityModifiers?: AbilityModifiers;
  };
}

export class StatusEffectManager {
  applyStatusEffect(
    target: Entity,
    effect: StatusEffect,
    source?: Entity
  ): GameResult<void> {
    const combat = this.getComponent<CombatComponent>(target, 'combat');
    if (!combat) {
      return {
        success: false,
        error: new GameError('Target cannot receive status effects', 'NO_COMBAT_COMPONENT')
      };
    }
    
    // Check if effect already exists
    const existingEffect = combat.data.activeEffects.find(e => e.name === effect.name);
    
    if (existingEffect) {
      // Stack or refresh the effect
      if (existingEffect.stacks < effect.maxStacks) {
        existingEffect.stacks++;
        existingEffect.duration = Math.max(existingEffect.duration, effect.duration);
      } else {
        // Refresh duration
        existingEffect.duration = effect.duration;
      }
    } else {
      // Add new effect
      combat.data.activeEffects.push({
        ...effect,
        stacks: 1
      });
    }
    
    this.logger.debug(`Applied ${effect.name} to ${target.id}`);
    return { success: true, data: undefined };
  }
  
  processStatusEffects(entities: Entity[], deltaTime: number): void {
    entities.forEach(entity => {
      const combat = this.getComponent<CombatComponent>(entity, 'combat');
      if (!combat) return;
      
      combat.data.activeEffects = combat.data.activeEffects.filter(effect => {
        // Update duration
        effect.duration -= deltaTime;
        
        // Process tick effects
        if (effect.tickInterval && effect.duration % effect.tickInterval === 0) {
          this.processTickEffect(entity, effect);
        }
        
        // Remove expired effects
        if (effect.duration <= 0) {
          this.removeStatusEffect(entity, effect);
          return false;
        }
        
        return true;
      });
    });
  }
  
  private processTickEffect(target: Entity, effect: StatusEffect): void {
    const combat = this.getComponent<CombatComponent>(target, 'combat')!;
    
    if (effect.effects.damageOverTime) {
      const damage = effect.effects.damageOverTime.damage * effect.stacks;
      combat.data.health = Math.max(0, combat.data.health - damage);
      
      if (combat.data.health === 0) {
        this.eventEmitter.emit('player:died', {
          playerId: target.id,
          location: this.getLocation(target)
        });
      }
    }
    
    if (effect.effects.healingOverTime) {
      const healing = effect.effects.healingOverTime.healing * effect.stacks;
      combat.data.health = Math.min(
        combat.data.maxHealth,
        combat.data.health + healing
      );
    }
  }
}
```

## Combat State Management

### Combat Flow Control
```typescript
export class CombatStateManager {
  startCombat(attackerId: string, targetId: string): GameResult<string> {
    const attacker = this.entityManager.getEntity(attackerId);
    const target = this.entityManager.getEntity(targetId);
    
    if (!attacker || !target) {
      return {
        success: false,
        error: new GameError('Entity not found', 'ENTITY_NOT_FOUND')
      };
    }
    
    // Validate combat can start
    const validation = this.validateCombatStart(attacker, target);
    if (!validation.success) {
      return validation;
    }
    
    // Set combat states
    const attackerCombat = this.getComponent<CombatComponent>(attacker, 'combat')!;
    const targetCombat = this.getComponent<CombatComponent>(target, 'combat')!;
    
    attackerCombat.data.combatState = 'combat';
    targetCombat.data.combatState = 'combat';
    
    const combatId = this.generateCombatId();
    
    this.eventEmitter.emit('combat:started', {
      combatId,
      attacker: attackerId,
      target: targetId
    });
    
    return { success: true, data: combatId };
  }
  
  endCombat(combatId: string, reason: string): void {
    // Find entities in this combat and reset their states
    const combatEntities = this.entityManager.getEntitiesWithComponent('combat')
      .filter(entity => {
        const combat = this.getComponent<CombatComponent>(entity, 'combat');
        return combat?.data.combatState === 'combat';
      });
    
    combatEntities.forEach(entity => {
      const combat = this.getComponent<CombatComponent>(entity, 'combat')!;
      combat.data.combatState = 'cooldown';
      
      // Start recovery cooldown
      setTimeout(() => {
        combat.data.combatState = 'idle';
      }, 5000); // 5 second cooldown after combat
    });
    
    this.eventEmitter.emit('combat:ended', {
      combatId,
      reason,
      participants: combatEntities.map(e => e.id)
    });
  }
}
```

This Combat System provides the foundation for all combat mechanics while integrating seamlessly with the ECS architecture.