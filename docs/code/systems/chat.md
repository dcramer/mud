# Chat System Implementation

**Critical Infrastructure: Real-time Communication System**

## Overview

The chat system provides **real-time communication** between players using multiple channels and contexts. This is **essential MUD infrastructure** that handles all player-to-player and system-to-player messaging.

## Core Requirements

### Industry Standards We Follow
- **WebSocket-based** real-time messaging
- **Channel-based** communication (similar to Discord/Slack)
- **Event-driven** architecture following our ECS patterns
- **Type-safe** message handling with TypeScript
- **Security-first** input validation and filtering

## Chat Channels

### Built-in Channels
```typescript
enum ChatChannel {
  // Local communication
  SAY = 'say',           // Same room only
  WHISPER = 'whisper',   // Private to one player
  EMOTE = 'emote',       // Roleplay actions in room
  
  // Global communication  
  OOC = 'ooc',           // Out-of-character global
  NEWBIE = 'newbie',     // Help channel for new players
  
  // Group communication
  PARTY = 'party',       // Current party members
  GUILD = 'guild',       // Guild members
  
  // System communication
  SYSTEM = 'system',     // Server announcements
  COMBAT = 'combat',     // Combat messages
  DEATH = 'death',       // Death notifications
}
```

### Channel Properties
```typescript
interface ChatChannelConfig {
  readonly name: string;
  readonly description: string;
  readonly scope: 'room' | 'global' | 'group' | 'private' | 'system';
  readonly requiredRank?: Rank;
  readonly rateLimitMs: number;
  readonly maxMessageLength: number;
  readonly allowColors: boolean;
  readonly logMessages: boolean;
}

// Example configurations
const CHANNEL_CONFIGS: Record<ChatChannel, ChatChannelConfig> = {
  [ChatChannel.SAY]: {
    name: 'Say',
    description: 'Talk to players in the same room',
    scope: 'room',
    rateLimitMs: 1000,
    maxMessageLength: 255,
    allowColors: false,
    logMessages: true,
  },
  [ChatChannel.OOC]: {
    name: 'Out of Character',
    description: 'Global out-of-character chat',
    scope: 'global',
    rateLimitMs: 3000,
    maxMessageLength: 255,
    allowColors: true,
    logMessages: true,
  },
  // ... other configs
};
```

## Message Types

### Core Message Interface
```typescript
interface ChatMessage {
  readonly id: string;
  readonly channel: ChatChannel;
  readonly senderId: PlayerId;
  readonly senderName: string;
  readonly content: string;
  readonly timestamp: Date;
  readonly targetId?: PlayerId;  // For whispers
  readonly metadata?: MessageMetadata;
}

interface MessageMetadata {
  readonly roomId?: RoomId;
  readonly formatted?: string;    // Pre-formatted display text
  readonly isEmote?: boolean;
  readonly isSystem?: boolean;
}
```

### Message Events
```typescript
// Chat events following our event system patterns
type ChatEventName = 
  | 'chat:message_sent'
  | 'chat:message_received'
  | 'chat:channel_joined'
  | 'chat:channel_left'
  | 'chat:player_muted'
  | 'chat:player_unmuted';

interface ChatMessageEvent {
  type: 'chat:message_sent';
  data: {
    message: ChatMessage;
    recipients: PlayerId[];
  };
}
```

## Implementation Architecture

### Chat System Class
```typescript
class ChatSystem extends BaseSystem {
  readonly requiredComponents = ['player'] as const;
  
  constructor(
    entityManager: EntityManager,
    eventEmitter: GameEventEmitter,
    private readonly networkService: NetworkService,
    private readonly rateLimiter: RateLimiter,
    private readonly messageFilter: MessageFilter,
  ) {
    super(entityManager, eventEmitter);
  }
  
  async sendMessage(
    senderId: PlayerId,
    channel: ChatChannel,
    content: string,
    targetId?: PlayerId,
  ): Promise<Result<void>> {
    // 1. Validate sender
    const sender = this.entityManager.getEntity(senderId);
    if (!sender) {
      return failure(GameError.notFound('Player', senderId));
    }
    
    // 2. Rate limiting
    const rateLimitResult = await this.rateLimiter.checkLimit(senderId, channel);
    if (!rateLimitResult.success) {
      return rateLimitResult;
    }
    
    // 3. Content filtering
    const filterResult = this.messageFilter.validate(content, channel);
    if (!filterResult.success) {
      return filterResult;
    }
    
    // 4. Create message
    const message: ChatMessage = {
      id: generateMessageId(),
      channel,
      senderId,
      senderName: sender.name,
      content: filterResult.data,
      timestamp: new Date(),
      targetId,
      metadata: await this.buildMetadata(sender, channel, content),
    };
    
    // 5. Determine recipients
    const recipients = await this.getRecipients(message);
    
    // 6. Send to recipients
    await this.deliverMessage(message, recipients);
    
    // 7. Emit event
    this.emitEvent('chat:message_sent', { message, recipients });
    
    return success(undefined);
  }
  
  private async getRecipients(message: ChatMessage): Promise<PlayerId[]> {
    const config = CHANNEL_CONFIGS[message.channel];
    
    switch (config.scope) {
      case 'room':
        return this.getPlayersInRoom(message.metadata?.roomId);
      case 'global':
        return this.getAllConnectedPlayers();
      case 'private':
        return message.targetId ? [message.targetId] : [];
      case 'group':
        return this.getGroupMembers(message.senderId, message.channel);
      case 'system':
        return this.getAllConnectedPlayers();
      default:
        return [];
    }
  }
  
  private async deliverMessage(
    message: ChatMessage,
    recipients: PlayerId[],
  ): Promise<void> {
    const formattedMessage = this.formatMessage(message);
    
    await Promise.all(
      recipients.map(async (playerId) => {
        try {
          await this.networkService.sendToPlayer(playerId, formattedMessage);
        } catch (error) {
          // Log delivery failure but don't fail the entire operation
          this.logger.warn(`Failed to deliver message to ${playerId}`, { error });
        }
      }),
    );
  }
  
  private formatMessage(message: ChatMessage): string {
    const config = CHANNEL_CONFIGS[message.channel];
    const timestamp = message.timestamp.toISOString();
    
    switch (message.channel) {
      case ChatChannel.SAY:
        return `[${timestamp}] ${message.senderName} says: ${message.content}`;
      case ChatChannel.WHISPER:
        return `[${timestamp}] ${message.senderName} whispers: ${message.content}`;
      case ChatChannel.EMOTE:
        return `[${timestamp}] ${message.senderName} ${message.content}`;
      case ChatChannel.OOC:
        return `[${timestamp}] [OOC] ${message.senderName}: ${message.content}`;
      case ChatChannel.SYSTEM:
        return `[${timestamp}] [SYSTEM] ${message.content}`;
      default:
        return `[${timestamp}] [${config.name}] ${message.senderName}: ${message.content}`;
    }
  }
}
```

### Security and Filtering

#### Input Validation
```typescript
class MessageFilter {
  private readonly MAX_LENGTH = 255;
  private readonly SAFE_CHARS = /^[a-zA-Z0-9\s\-_.,!?'"()[\]{}:;@#$%^&*+=<>/\\|`~]*$/;
  
  validate(content: string, channel: ChatChannel): Result<string> {
    if (!content || content.trim().length === 0) {
      return failure(GameError.invalidInput('Message cannot be empty'));
    }
    
    const config = CHANNEL_CONFIGS[channel];
    
    if (content.length > config.maxMessageLength) {
      return failure(GameError.invalidInput('Message too long'));
    }
    
    if (!this.SAFE_CHARS.test(content)) {
      return failure(GameError.invalidInput('Message contains invalid characters'));
    }
    
    // Additional filtering
    const filtered = this.applyFilters(content, channel);
    
    return success(filtered);
  }
  
  private applyFilters(content: string, channel: ChatChannel): string {
    let filtered = content;
    
    // Remove excessive whitespace
    filtered = filtered.replace(/\s+/g, ' ').trim();
    
    // Apply profanity filter if needed
    if (channel === ChatChannel.NEWBIE) {
      filtered = this.profanityFilter(filtered);
    }
    
    // Strip colors if not allowed
    const config = CHANNEL_CONFIGS[channel];
    if (!config.allowColors) {
      filtered = this.stripColorCodes(filtered);
    }
    
    return filtered;
  }
}
```

#### Rate Limiting
```typescript
class RateLimiter {
  private readonly limits = new Map<string, number[]>();
  
  async checkLimit(playerId: PlayerId, channel: ChatChannel): Promise<Result<void>> {
    const config = CHANNEL_CONFIGS[channel];
    const key = `${playerId}:${channel}`;
    const now = Date.now();
    
    const timestamps = this.limits.get(key) || [];
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(
      (timestamp) => now - timestamp < config.rateLimitMs,
    );
    
    // Check if limit exceeded
    if (validTimestamps.length >= this.getMaxMessages(channel)) {
      return failure(new GameError(
        'Rate limit exceeded',
        GameErrorCode.RESOURCE_EXHAUSTED,
        { channel, cooldownMs: config.rateLimitMs },
      ));
    }
    
    // Add current timestamp
    validTimestamps.push(now);
    this.limits.set(key, validTimestamps);
    
    return success(undefined);
  }
  
  private getMaxMessages(channel: ChatChannel): number {
    // Different limits per channel
    switch (channel) {
      case ChatChannel.SAY:
      case ChatChannel.EMOTE:
        return 10; // 10 messages per rate limit window
      case ChatChannel.WHISPER:
        return 5;
      case ChatChannel.OOC:
      case ChatChannel.NEWBIE:
        return 3;
      default:
        return 5;
    }
  }
}
```

## Chat Commands

### Command Integration
```typescript
class SayCommand extends BaseCommand {
  name = 'say';
  aliases = ['s', "'"];
  description = 'Say something to players in your room';
  usage = 'say <message>';
  
  constructor(
    logger: Logger,
    eventEmitter: GameEventEmitter,
    private readonly chatSystem: ChatSystem,
  ) {
    super(logger, eventEmitter);
  }
  
  validate(player: Player, args: string[]): GameResult<void> {
    if (args.length === 0) {
      return failure(GameError.invalidInput('Usage: say <message>'));
    }
    return success(undefined);
  }
  
  protected async run(player: Player, args: string[]): Promise<GameResult<void>> {
    const message = args.join(' ');
    return await this.chatSystem.sendMessage(
      player.id,
      ChatChannel.SAY,
      message,
    );
  }
}

class WhisperCommand extends BaseCommand {
  name = 'whisper';
  aliases = ['w', 'tell'];
  description = 'Send a private message to another player';
  usage = 'whisper <player> <message>';
  
  protected async run(player: Player, args: string[]): Promise<GameResult<void>> {
    if (args.length < 2) {
      return failure(GameError.invalidInput('Usage: whisper <player> <message>'));
    }
    
    const [targetName, ...messageParts] = args;
    const message = messageParts.join(' ');
    
    // Find target player
    const targetId = await this.findPlayerByName(targetName);
    if (!targetId) {
      return failure(GameError.notFound('Player', targetName));
    }
    
    return await this.chatSystem.sendMessage(
      player.id,
      ChatChannel.WHISPER,
      message,
      targetId,
    );
  }
}
```

## Storage and Logging

### Message Persistence
```typescript
interface ChatMessageRecord {
  id: string;
  channel: string;
  senderId: string;
  senderName: string;
  content: string;
  timestamp: Date;
  targetId?: string;
  roomId?: string;
  metadata?: Record<string, unknown>;
}

class ChatStorage {
  constructor(private readonly db: DatabaseService) {}
  
  async saveMessage(message: ChatMessage): Promise<void> {
    const config = CHANNEL_CONFIGS[message.channel];
    
    if (config.logMessages) {
      await this.db.saveChatMessage({
        id: message.id,
        channel: message.channel,
        senderId: message.senderId,
        senderName: message.senderName,
        content: message.content,
        timestamp: message.timestamp,
        targetId: message.targetId,
        roomId: message.metadata?.roomId,
        metadata: message.metadata,
      });
    }
  }
  
  async getChatHistory(
    channel: ChatChannel,
    limit = 50,
  ): Promise<ChatMessage[]> {
    return await this.db.getChatHistory(channel, limit);
  }
}
```

## Integration with Game Systems

### Room-based Chat
```typescript
// Chat system integrates with movement system
class MovementSystem extends BaseSystem {
  onEntityMoved(event: GameEvent): void {
    const { entityId, from, to } = event.data;
    
    // Player sees who's in the new room
    this.chatSystem.sendRoomInfo(entityId, to);
  }
}
```

### Combat Integration
```typescript
// Combat system can send chat messages
class CombatSystem extends BaseSystem {
  private announceAttack(attackerId: PlayerId, targetId: PlayerId, damage: number): void {
    this.chatSystem.sendMessage(
      attackerId,
      ChatChannel.COMBAT,
      `${attackerId} attacks ${targetId} for ${damage} damage!`,
    );
  }
}
```

This chat system provides **essential communication infrastructure** for the MUD while following our industry-standard patterns for type safety, security, and performance.