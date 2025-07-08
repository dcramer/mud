# Passwordless Authentication Design

## Overview
This document outlines our passwordless authentication approach for the MUD system, supporting both terminal and other client types.

## Authentication Methods

### 1. SSH Key Authentication (Terminal)
For terminal clients, we'll use SSH public key authentication similar to how SSH and Git work.

**Flow:**
1. Client generates SSH keypair locally (`ssh-keygen`)
2. Client registers public key with server
3. For authentication, server sends challenge
4. Client signs challenge with private key
5. Server verifies signature with public key

**Benefits:**
- Standard approach for terminal apps
- Users already familiar with SSH keys
- Very secure (cryptographic signatures)
- No passwords to remember

### 2. Magic Link Authentication (Web/Email)
For web clients or initial setup, we'll use magic links.

**Flow:**
1. User provides email address
2. Server generates secure token and sends email
3. User clicks link in email
4. Server validates token and creates session

**Benefits:**
- No passwords needed
- Works across all platforms
- Easy user experience

### 3. Device Token Authentication (API)
For programmatic access and persistent sessions.

**Flow:**
1. After initial auth (SSH or magic link)
2. Server issues long-lived device token
3. Client stores token securely
4. Token used for subsequent requests

## Implementation Plan

### Database Schema Changes
```typescript
// Remove password fields from players table
export const players = pgTable('players', {
  id: uuid('id').primaryKey().defaultRandom(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  // passwordHash removed
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
});

// SSH keys table
export const sshKeys = pgTable('ssh_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  name: varchar('name', { length: 100 }).notNull(), // e.g., "MacBook Pro"
  publicKey: text('public_key').notNull(),
  fingerprint: varchar('fingerprint', { length: 255 }).notNull().unique(),
  lastUsed: timestamp('last_used'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Magic link tokens
export const authTokens = pgTable('auth_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').references(() => players.id),
  email: varchar('email', { length: 255 }), // For registration
  token: varchar('token', { length: 255 }).notNull().unique(),
  type: varchar('type', { length: 50 }).notNull(), // 'magic_link' or 'device'
  expiresAt: timestamp('expires_at').notNull(),
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Sessions
export const sessions = pgTable('sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  playerId: uuid('player_id').notNull().references(() => players.id),
  token: varchar('token', { length: 255 }).notNull().unique(),
  deviceInfo: jsonb('device_info'), // OS, client version, etc.
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  lastActivity: timestamp('last_activity').defaultNow().notNull(),
});
```

### SSH Key Authentication Service
```typescript
interface SSHAuthService {
  // Register a new SSH public key
  registerPublicKey(playerId: string, publicKey: string, keyName: string): Promise<GameResult<void>>;
  
  // Generate challenge for SSH auth
  createChallenge(fingerprint: string): Promise<GameResult<AuthChallenge>>;
  
  // Verify signed challenge
  verifyChallenge(challengeId: string, signature: string): Promise<GameResult<Player>>;
  
  // Parse and validate SSH public key
  parsePublicKey(keyString: string): GameResult<SSHPublicKey>;
}
```

### Magic Link Service
```typescript
interface MagicLinkService {
  // Send magic link for login
  sendLoginLink(email: string): Promise<GameResult<void>>;
  
  // Send magic link for registration
  sendRegistrationLink(email: string, username: string): Promise<GameResult<void>>;
  
  // Validate magic link token
  validateToken(token: string): Promise<GameResult<Player>>;
}
```

### Terminal Client Flow
```bash
# First time setup
$ mud auth register
Enter email: player@example.com
Enter username: playerone
Magic link sent to player@example.com!

# After clicking link in email
$ mud auth add-key
Adding SSH key: /Users/player/.ssh/id_rsa.pub
SSH key registered successfully!

# Subsequent logins (automatic)
$ mud connect
Authenticating with SSH key...
Welcome back, playerone!

# Manual key management
$ mud auth keys list
$ mud auth keys add ~/.ssh/other_key.pub --name "Work Laptop"
$ mud auth keys remove <fingerprint>
```

### Security Considerations

1. **SSH Key Security:**
   - Validate key format and strength
   - Store only public keys
   - Use fingerprints for identification
   - Rate limit authentication attempts

2. **Magic Link Security:**
   - Short expiration (15 minutes)
   - Single use tokens
   - Secure random generation
   - HTTPS only for web clients

3. **Session Security:**
   - JWT or secure random tokens
   - Reasonable expiration times
   - Activity-based renewal
   - Secure storage on client

### Migration Path

1. Remove password-related code
2. Implement SSH key authentication
3. Implement magic link system
4. Update client to support new auth
5. Migrate existing users (require magic link on next login)

## Benefits

1. **Better Security:** No passwords to leak or crack
2. **Better UX:** No passwords to remember
3. **Terminal Native:** SSH keys are standard for CLI tools
4. **Cross-Platform:** Magic links work everywhere
5. **Future Proof:** Easy to add WebAuthn, passkeys, etc.

## References

- SSH Key Format: RFC 4253
- Magic Link Best Practices: OWASP
- Terminal Auth Examples: GitHub CLI, Heroku CLI