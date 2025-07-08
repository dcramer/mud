# Event-Driven Patterns

## Type-Safe Event System

### Central Event Type Definition
```typescript
// ✅ DO - Define all game events in a central type
interface GameEventMap {
  'player:connected': { playerId: string; timestamp: Date };
  'player:disconnected': { playerId: string; reason: string };
  'player:moved': { playerId: string; from: string; to: string };
  'player:health_changed': { playerId: string; oldHealth: number; newHealth: number };
  'player:died': { playerId: string; location: string };
  'player:respawned': { playerId: string; location: string };
  
  'combat:started': { combatId: string; attacker: string; target: string };
  'combat:ended': { combatId: string; winner: string; loser: string };
  'combat:round': { combatId: string; round: number; actions: CombatAction[] };
  
  'ability:used': { playerId: string; abilityId: string; target?: string; damage?: number };
  'ability:cooldown_started': { playerId: string; abilityId: string; duration: number };
  'ability:awakened': { playerId: string; abilityId: string; newRank: string };
  
  'quest:started': { playerId: string; questId: string; source: string };
  'quest:completed': { playerId: string; questId: string; reward: QuestReward };
  'quest:failed': { playerId: string; questId: string; reason: string };
  
  'rank:advanced': { playerId: string; oldRank: Rank; newRank: Rank };
  'essence:bonded': { playerId: string; essenceType: string; attribute: string };
  
  'item:acquired': { playerId: string; itemId: string; quantity: number; source: string };
  'item:used': { playerId: string; itemId: string; target?: string };
  'item:equipped': { playerId: string; itemId: string; slot: string };
  
  'room:entered': { playerId: string; roomId: string; fromRoom?: string };
  'room:left': { playerId: string; roomId: string; toRoom?: string };
}
```

### Type-Safe Event Emitter
```typescript
class GameEventEmitter extends EventEmitter {
  emit<K extends keyof GameEventMap>(
    event: K, 
    data: GameEventMap[K]
  ): boolean {
    return super.emit(event, data);
  }
  
  on<K extends keyof GameEventMap>(
    event: K, 
    listener: (data: GameEventMap[K]) => void
  ): this {
    return super.on(event, listener);
  }
  
  once<K extends keyof GameEventMap>(
    event: K, 
    listener: (data: GameEventMap[K]) => void
  ): this {
    return super.once(event, listener);
  }
  
  off<K extends keyof GameEventMap>(
    event: K, 
    listener: (data: GameEventMap[K]) => void
  ): this {
    return super.off(event, listener);
  }
}

// Usage with full type safety
const gameEvents = new GameEventEmitter();

gameEvents.on('combat:started', ({ combatId, attacker, target }) => {
  console.log(`Combat ${combatId} started between ${attacker} and ${target}`);
});

gameEvents.emit('player:moved', {
  playerId: 'player123',
  from: 'room1',
  to: 'room2'
});
```

## Event-Driven Game Systems

### Combat System Events
```typescript
class CombatSystem {
  constructor(private eventEmitter: GameEventEmitter) {
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.eventEmitter.on('player:moved', this.handlePlayerMoved.bind(this));
    this.eventEmitter.on('player:died', this.handlePlayerDied.bind(this));
    this.eventEmitter.on('ability:used', this.handleAbilityUsed.bind(this));
  }
  
  private handlePlayerMoved(data: GameEventMap['player:moved']): void {
    // End combat if player moves away
    const activeCombat = this.findPlayerCombat(data.playerId);
    if (activeCombat) {
      this.endCombat(activeCombat.id, 'player_fled');
    }
  }
  
  private handlePlayerDied(data: GameEventMap['player:died']): void {
    // End all combats involving the dead player
    const playerCombats = this.findPlayerCombats(data.playerId);
    playerCombats.forEach(combat => {
      this.endCombat(combat.id, 'player_death');
    });
  }
  
  private handleAbilityUsed(data: GameEventMap['ability:used']): void {
    // Process combat damage and effects
    if (data.damage && data.target) {
      this.applyDamage(data.target, data.damage);
    }
  }
}
```

### Progression System Events
```typescript
class ProgressionSystem {
  constructor(private eventEmitter: GameEventEmitter) {
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.eventEmitter.on('combat:ended', this.handleCombatEnded.bind(this));
    this.eventEmitter.on('quest:completed', this.handleQuestCompleted.bind(this));
    this.eventEmitter.on('ability:used', this.handleAbilityUsed.bind(this));
  }
  
  private async handleCombatEnded(data: GameEventMap['combat:ended']): Promise<void> {
    // Award rank progress for combat participation
    const winner = await this.playerService.findById(data.winner);
    if (winner) {
      await this.awardRankProgress(winner, 'combat_victory');
    }
  }
  
  private async handleQuestCompleted(data: GameEventMap['quest:completed']): Promise<void> {
    // Award rank progress based on quest difficulty
    const player = await this.playerService.findById(data.playerId);
    if (player) {
      await this.awardRankProgress(player, 'quest_completion', data.reward.rankProgress);
    }
  }
  
  private async handleAbilityUsed(data: GameEventMap['ability:used']): Promise<void> {
    // Track ability usage for advancement
    await this.trackAbilityUsage(data.playerId, data.abilityId);
  }
}
```

## Event Broadcasting Patterns

### Room-Based Broadcasting
```typescript
class RoomManager {
  constructor(private eventEmitter: GameEventEmitter) {
    this.setupEventHandlers();
  }
  
  private setupEventHandlers(): void {
    this.eventEmitter.on('player:moved', this.handlePlayerMoved.bind(this));
    this.eventEmitter.on('ability:used', this.handleAbilityUsed.bind(this));
    this.eventEmitter.on('combat:started', this.handleCombatStarted.bind(this));
  }
  
  private handlePlayerMoved(data: GameEventMap['player:moved']): void {
    // Notify players in both rooms
    this.broadcastToRoom(data.from, `${data.playerId} leaves to the ${this.getDirection(data.from, data.to)}.`);
    this.broadcastToRoom(data.to, `${data.playerId} arrives from the ${this.getDirection(data.to, data.from)}.`);
  }
  
  private handleAbilityUsed(data: GameEventMap['ability:used']): void {
    // Show ability effects to players in the same room
    const player = this.getPlayer(data.playerId);
    if (player) {
      const message = this.formatAbilityMessage(data);
      this.broadcastToRoom(player.location.roomId, message, [data.playerId]);
    }
  }
  
  private handleCombatStarted(data: GameEventMap['combat:started']): void {
    // Announce combat to room
    const attacker = this.getPlayer(data.attacker);
    if (attacker) {
      const message = `${data.attacker} attacks ${data.target}!`;
      this.broadcastToRoom(attacker.location.roomId, message, [data.attacker, data.target]);
    }
  }
  
  private broadcastToRoom(roomId: string, message: string, exclude: string[] = []): void {
    const playersInRoom = this.getPlayersInRoom(roomId);
    playersInRoom
      .filter(player => !exclude.includes(player.id))
      .forEach(player => player.send(message));
  }
}
```

## Event Logging and Analytics

### Event Tracking System
```typescript
class EventTracker {
  constructor(
    private eventEmitter: GameEventEmitter,
    private logger: Logger,
    private analytics: AnalyticsService
  ) {
    this.setupEventTracking();
  }
  
  private setupEventTracking(): void {
    // Track all events for analytics
    Object.keys(this.getEventMap()).forEach(eventName => {
      this.eventEmitter.on(eventName as keyof GameEventMap, (data) => {
        this.trackEvent(eventName, data);
      });
    });
  }
  
  private trackEvent(eventName: string, data: any): void {
    // Log for debugging
    this.logger.debug(`Game event: ${eventName}`, data);
    
    // Send to analytics
    this.analytics.track(eventName, {
      ...data,
      timestamp: new Date().toISOString(),
      server: process.env.SERVER_ID
    });
    
    // Track specific metrics
    switch (eventName) {
      case 'player:connected':
        this.analytics.incrementCounter('player.connections');
        break;
      case 'combat:started':
        this.analytics.incrementCounter('combat.started');
        break;
      case 'quest:completed':
        this.analytics.incrementCounter('quest.completed');
        break;
    }
  }
}
```

## Best Practices

### Event Handler Organization
```typescript
// ✅ DO - Organize by system responsibility
class SystemManager {
  private systems: Array<{ name: string; system: any }> = [];
  
  constructor(private eventEmitter: GameEventEmitter) {}
  
  registerSystem<T>(name: string, system: T): void {
    this.systems.push({ name, system });
    
    // Each system handles its own event setup
    if ('setupEventHandlers' in system && typeof system.setupEventHandlers === 'function') {
      system.setupEventHandlers();
    }
  }
  
  async shutdown(): Promise<void> {
    // Clean shutdown of all systems
    for (const { name, system } of this.systems) {
      if ('cleanup' in system && typeof system.cleanup === 'function') {
        await system.cleanup();
      }
    }
  }
}

// ❌ DON'T - Centralized event handling
class BadEventManager {
  // This becomes unmaintainable
  handleAllEvents(eventName: string, data: any): void {
    switch (eventName) {
      case 'player:moved':
        // Handle combat logic
        // Handle room logic  
        // Handle quest logic
        // etc...
        break;
      // ... hundreds of lines of mixed concerns
    }
  }
}
```

### Error Handling in Events
```typescript
// ✅ DO - Graceful error handling
class EventHandler {
  constructor(private logger: Logger) {}
  
  setupSafeEventHandler<K extends keyof GameEventMap>(
    eventEmitter: GameEventEmitter,
    event: K,
    handler: (data: GameEventMap[K]) => Promise<void> | void
  ): void {
    eventEmitter.on(event, async (data) => {
      try {
        await handler(data);
      } catch (error) {
        this.logger.error(`Error handling event ${event}`, {
          event,
          data,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        // Don't let one handler failure crash the system
      }
    });
  }
}
```