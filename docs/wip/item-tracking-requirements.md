# Item Tracking Requirements

## Critical Requirement

We MUST maintain a complete audit trail of all item movements in the game to handle:
- Bug investigations
- Item restoration requests  
- Exploit detection
- Economy analysis
- Customer support

## Core Principles

1. **Append-Only Logs**: Never delete or modify transfer records
2. **Denormalized Data**: Include names/details at time of transfer
3. **Rich Context**: Log WHERE and WHY transfers happened
4. **Fast Lookups**: Index by character, item, and time

## Item Transfer Log Schema

```sql
CREATE TABLE item_transfer_log (
  id TEXT PRIMARY KEY,
  
  -- Source (NULL for system-generated items)
  from_character_id TEXT,
  from_character_name TEXT,
  from_player_id TEXT,
  from_player_username TEXT,
  
  -- Destination (NULL for destroyed items)
  to_character_id TEXT,
  to_character_name TEXT,
  to_player_id TEXT,
  to_player_username TEXT,
  
  -- Item details (denormalized)
  item_id TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_rarity TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  
  -- Transfer context
  transfer_type TEXT NOT NULL, -- See types below
  realm_id TEXT NOT NULL,
  room_id TEXT,
  
  -- Additional context as JSON
  metadata TEXT,
  
  -- Timestamps
  created_at INTEGER NOT NULL,
  
  -- Indexes for common queries
  INDEX idx_transfers_from (from_character_id, created_at),
  INDEX idx_transfers_to (to_character_id, created_at),
  INDEX idx_transfers_item (item_id, created_at),
  INDEX idx_transfers_type (transfer_type, created_at),
  INDEX idx_transfers_realm_time (realm_id, created_at)
);
```

## Transfer Types

```typescript
enum TransferType {
  // Player-initiated
  TRADE = 'trade',
  DROP = 'drop',
  PICKUP = 'pickup',
  BANK_DEPOSIT = 'bank_deposit',
  BANK_WITHDRAW = 'bank_withdraw',
  MAIL_SEND = 'mail_send',
  MAIL_RECEIVE = 'mail_receive',
  
  // System-initiated
  QUEST_REWARD = 'quest_reward',
  NPC_PURCHASE = 'npc_purchase',
  NPC_SELL = 'npc_sell',
  LOOT_CORPSE = 'loot_corpse',
  LOOT_CHEST = 'loot_chest',
  CRAFT_CREATE = 'craft_create',
  CRAFT_CONSUME = 'craft_consume',
  
  // Admin/Support
  ADMIN_GRANT = 'admin_grant',
  ADMIN_REMOVE = 'admin_remove',
  RESTORE_BUG = 'restore_bug',
  RESTORE_ROLLBACK = 'restore_rollback',
  
  // Special
  DESTROY = 'destroy',
  EXPIRE = 'expire',
  TRANSFORM = 'transform', // Item changing into another
}
```

## Metadata Examples

```typescript
// Trade metadata
{
  trade_id: "uuid",
  location: { room_id: "town_square", x: 10, y: 20 },
  witnessed_by: ["player1", "player2"],
  trade_value: { gold: 1000, items: [...] }
}

// Quest reward metadata
{
  quest_id: "save_the_village",
  quest_step: 3,
  npc_id: "village_elder",
  choices: ["sword", "shield", "gold"]
}

// Admin action metadata
{
  admin_id: "admin_user",
  ticket_id: "SUPPORT-1234",
  reason: "Item lost due to bug #456",
  approved_by: "senior_admin"
}
```

## Common Queries

```typescript
// 1. Track item history
async function getItemHistory(itemId: string): Promise<TransferLog[]> {
  return db.prepare(`
    SELECT * FROM item_transfer_log
    WHERE item_id = ?
    ORDER BY created_at DESC
  `).bind(itemId).all();
}

// 2. Character's recent transfers
async function getCharacterTransfers(
  characterId: string, 
  days: number = 7
): Promise<TransferLog[]> {
  const since = Date.now() / 1000 - (days * 86400);
  return db.prepare(`
    SELECT * FROM item_transfer_log
    WHERE (from_character_id = ? OR to_character_id = ?)
    AND created_at > ?
    ORDER BY created_at DESC
  `).bind(characterId, characterId, since).all();
}

// 3. Suspicious activity detection
async function detectDuplicateItems(itemId: string): Promise<boolean> {
  const result = await db.prepare(`
    SELECT 
      SUM(CASE WHEN to_character_id IS NOT NULL THEN quantity ELSE 0 END) -
      SUM(CASE WHEN from_character_id IS NOT NULL THEN quantity ELSE 0 END) 
      as net_created
    FROM item_transfer_log
    WHERE item_id = ?
  `).bind(itemId).first();
  
  return result.net_created > 1; // More than original
}
```

## Implementation Requirements

### 1. Every Inventory Mutation MUST Log
```typescript
// In InventoryService
async transferItem(from: string, to: string, itemId: string) {
  await db.transaction(async (tx) => {
    // 1. Perform the transfer
    await this.performTransfer(tx, from, to, itemId);
    
    // 2. ALWAYS log it
    await this.logTransfer(tx, {
      from_character_id: from,
      to_character_id: to,
      item_id: itemId,
      transfer_type: TransferType.TRADE,
      // ... other required fields
    });
  });
}
```

### 2. Rich Context Capture
```typescript
// Include as much context as possible
const metadata = {
  ip_address: request.headers.get('CF-Connecting-IP'),
  session_id: session.id,
  command: 'give sword to Bob',
  room_players: await this.getRoomPlayers(character.room_id),
  server_time: new Date().toISOString(),
};
```

### 3. Retention Policy
- Keep transfer logs for minimum 1 year
- Archive to R2 after 90 days for cost optimization
- Never delete logs related to high-value items

## Customer Support Tools

```typescript
// Find lost items
async function findLostItem(
  playerId: string, 
  itemName: string,
  timeframe: { start: number, end: number }
): Promise<PossibleLostItem[]> {
  // Check what they had and lost
  const losses = await db.prepare(`
    SELECT * FROM item_transfer_log
    WHERE from_player_id = ?
    AND item_name LIKE ?
    AND created_at BETWEEN ? AND ?
    AND to_character_id IS NULL  -- Destroyed/dropped
  `).bind(playerId, `%${itemName}%`, timeframe.start, timeframe.end).all();
  
  return losses;
}

// Restore item
async function restoreItem(
  transferLogId: string,
  targetCharacterId: string,
  ticketId: string
): Promise<void> {
  const original = await this.getTransferLog(transferLogId);
  
  await this.grantItem(targetCharacterId, {
    item_id: original.item_id,
    quantity: original.quantity,
    metadata: {
      ...original.metadata,
      restored_from: transferLogId,
      ticket_id: ticketId,
      restored_at: Date.now(),
    },
    transfer_type: TransferType.RESTORE_BUG,
  });
}
```

## Performance Considerations

1. **Async Logging**: Don't block gameplay for logging
2. **Batch Inserts**: Group multiple transfers when possible
3. **Partition by Time**: Use monthly tables for logs
4. **Index Carefully**: Balance query speed vs write performance

## Security Requirements

1. **Immutable Logs**: Use database permissions to prevent updates/deletes
2. **Separate Permissions**: Only senior staff can query logs
3. **PII Considerations**: Be careful with IP addresses in metadata
4. **Audit Admin Actions**: Log who queried logs and why

## Future Enhancements

1. **Real-time Monitoring**: Detect duping exploits immediately
2. **Economy Analytics**: Track item inflation/deflation
3. **Player Behavior**: Identify trading patterns
4. **Automated Restoration**: Self-service for common cases