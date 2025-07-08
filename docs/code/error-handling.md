# Error Handling Patterns

## Result Pattern for Game Operations

### Core Result Type
```typescript
// ✅ DO - Game-specific Result type
type GameResult<T, E = GameError> = 
  | { success: true; data: T }
  | { success: false; error: E };

class GameError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly playerId?: string
  ) {
    super(message);
    this.name = 'GameError';
  }
}
```

### Usage in Game Systems
```typescript
async function useAbility(
  player: Player, 
  abilityId: string, 
  target?: Player
): Promise<GameResult<CombatResult, GameError>> {
  try {
    const ability = player.abilities.find(a => a.id === abilityId);
    if (!ability) {
      return {
        success: false,
        error: new GameError('Ability not found', 'ABILITY_NOT_FOUND', player.id)
      };
    }

    if (ability.cooldownRemaining > 0) {
      return {
        success: false,
        error: new GameError('Ability on cooldown', 'ABILITY_COOLDOWN', player.id)
      };
    }

    const result = await executeCombatAbility(player, ability, target);
    return { success: true, data: result };
  } catch (error) {
    return {
      success: false,
      error: new GameError('Ability execution failed', 'EXECUTION_ERROR', player.id)
    };
  }
}
```

## Game Error Categories

### Standard Error Codes
```typescript
// Common game error codes
export const GameErrorCodes = {
  // Player errors
  PLAYER_NOT_FOUND: 'PLAYER_NOT_FOUND',
  PLAYER_NOT_AUTHORIZED: 'PLAYER_NOT_AUTHORIZED',
  PLAYER_ALREADY_IN_COMBAT: 'PLAYER_ALREADY_IN_COMBAT',
  
  // Ability errors
  ABILITY_NOT_FOUND: 'ABILITY_NOT_FOUND',
  ABILITY_COOLDOWN: 'ABILITY_COOLDOWN',
  INSUFFICIENT_MANA: 'INSUFFICIENT_MANA',
  INVALID_TARGET: 'INVALID_TARGET',
  
  // Item/inventory errors
  ITEM_NOT_FOUND: 'ITEM_NOT_FOUND',
  INVENTORY_FULL: 'INVENTORY_FULL',
  INSUFFICIENT_CURRENCY: 'INSUFFICIENT_CURRENCY',
  
  // System errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR'
} as const;

type GameErrorCode = typeof GameErrorCodes[keyof typeof GameErrorCodes];
```

### Specific Error Types
```typescript
export class ValidationError extends GameError {
  constructor(
    field: string,
    value: unknown,
    playerId?: string
  ) {
    super(
      `Invalid ${field}: ${value}`,
      GameErrorCodes.VALIDATION_ERROR,
      playerId
    );
  }
}

export class CombatError extends GameError {
  constructor(
    message: string,
    code: GameErrorCode,
    public readonly combatId?: string,
    playerId?: string
  ) {
    super(message, code, playerId);
  }
}
```

## Input Validation

### Security-First Validation
```typescript
class SecurityManager {
  private readonly MAX_COMMAND_LENGTH = 255;
  private readonly ALLOWED_CHARS = /^[a-zA-Z0-9\s\-_.,!?']+$/;
  
  validateInput(input: string): GameResult<string, ValidationError> {
    if (input.length > this.MAX_COMMAND_LENGTH) {
      return {
        success: false,
        error: new ValidationError('input', 'Too long')
      };
    }
    
    if (!this.ALLOWED_CHARS.test(input)) {
      return {
        success: false,
        error: new ValidationError('input', 'Contains invalid characters')
      };
    }
    
    return { success: true, data: input.trim() };
  }
  
  sanitizeInput(input: string): string {
    return input
      .replace(/[<>"&]/g, '') // Remove dangerous HTML chars
      .trim()
      .substring(0, this.MAX_COMMAND_LENGTH);
  }
}
```

### Game Data Validation
```typescript
export const gameValidators = {
  isValidPlayerName: (name: string): boolean => 
    /^[a-zA-Z][a-zA-Z0-9_]{2,19}$/.test(name),
    
  isValidRoomTransition: (from: Room, to: Room, direction: Direction): boolean =>
    from.exits[direction] === to.id,
    
  canPlayerAfford: (player: Player, cost: Currency): boolean =>
    Object.entries(cost).every(([type, amount]) => 
      (player.currency[type as keyof Currency] ?? 0) >= amount
    ),
    
  isAbilityUsable: (ability: Ability, player: Player): GameResult<void, GameError> => {
    if (ability.cooldownRemaining > 0) {
      return {
        success: false,
        error: new GameError('Ability on cooldown', GameErrorCodes.ABILITY_COOLDOWN)
      };
    }
    
    if (player.mana < ability.manaCost) {
      return {
        success: false,
        error: new GameError('Insufficient mana', GameErrorCodes.INSUFFICIENT_MANA)
      };
    }
    
    if (player.rank < ability.requiredRank) {
      return {
        success: false,
        error: new GameError('Rank too low', GameErrorCodes.PLAYER_NOT_AUTHORIZED)
      };
    }
    
    return { success: true, data: undefined };
  }
};
```

## Error Handling Best Practices

### Command Execution Safety
```typescript
class SecureCommandExecutor {
  async execute(player: Player, commandName: string, args: string[]): Promise<void> {
    try {
      // 1. Validate command exists in whitelist
      const command = this.getCommand(commandName);
      if (!command) {
        await this.sendError(player, 'Unknown command');
        return;
      }
      
      // 2. Check player permissions
      const authResult = this.checkAuthorization(player, command);
      if (!authResult.success) {
        await this.sendError(player, authResult.error.message);
        return;
      }
      
      // 3. Rate limit command execution
      const rateLimitResult = await this.checkRateLimit(player, commandName);
      if (!rateLimitResult.success) {
        await this.sendError(player, 'Command rate limited');
        return;
      }
      
      // 4. Execute in safe context
      const result = await command.execute(player, args);
      if (!result.success) {
        await this.sendError(player, result.error.message);
        return;
      }
      
      // 5. Log successful execution
      this.logger.info(`Player ${player.id} executed ${commandName}`, {
        playerId: player.id,
        command: commandName,
        args: args.join(' ')
      });
      
    } catch (error) {
      // 6. Handle unexpected errors gracefully
      this.logger.error('Command execution failed', {
        playerId: player.id,
        command: commandName,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      await this.sendError(player, 'Command failed. Please try again.');
    }
  }
  
  private async sendError(player: Player, message: string): Promise<void> {
    await player.send(`Error: ${message}`);
  }
}
```

### Never Use These Patterns
```typescript
// ❌ NEVER - Dynamic code execution
// eval() - Security vulnerability
// new Function() - Security vulnerability
// Dynamic imports of user input - Security vulnerability

// ❌ NEVER - Unhandled promises
someAsyncFunction(); // Missing await or .catch()

// ❌ NEVER - Silent failures
try {
  dangerousOperation();
} catch {
  // Swallowing errors without logging
}

// ✅ DO - Proper error handling
try {
  await dangerousOperation();
} catch (error) {
  this.logger.error('Operation failed', { error, context });
  return { success: false, error: new GameError('Operation failed', 'OPERATION_ERROR') };
}
```