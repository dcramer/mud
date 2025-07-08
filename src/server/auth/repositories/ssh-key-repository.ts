import type { CreateSSHKeyData, SSHKey } from '@/server/database/types.js';
import { eq } from 'drizzle-orm';
import type { DrizzleDb } from '../../database/connection.js';
import * as schema from '../../database/schema.js';

export class SSHKeyRepository {
  constructor(private db: DrizzleDb) {}

  async findByFingerprint(fingerprint: string): Promise<SSHKey | null> {
    const result = await this.db
      .select()
      .from(schema.sshKeys)
      .where(eq(schema.sshKeys.fingerprint, fingerprint))
      .limit(1);

    return result[0] || null;
  }

  async findByPlayerId(playerId: string): Promise<SSHKey[]> {
    const results = await this.db
      .select()
      .from(schema.sshKeys)
      .where(eq(schema.sshKeys.playerId, playerId));

    return results;
  }

  async create(data: CreateSSHKeyData): Promise<SSHKey> {
    const id = crypto.randomUUID();

    const [key] = await this.db
      .insert(schema.sshKeys)
      .values({
        id,
        playerId: data.playerId,
        name: data.name,
        publicKey: data.publicKey,
        fingerprint: data.fingerprint,
        lastUsed: null,
        // createdAt handled by $defaultFn in schema
      })
      .returning();

    if (!key) {
      throw new Error('Failed to create SSH key');
    }

    return key;
  }

  async updateLastUsed(keyId: string): Promise<void> {
    await this.db
      .update(schema.sshKeys)
      .set({ lastUsed: new Date() })
      .where(eq(schema.sshKeys.id, keyId));
  }

  async delete(keyId: string): Promise<boolean> {
    const result = await this.db
      .delete(schema.sshKeys)
      .where(eq(schema.sshKeys.id, keyId))
      .returning();

    return result.length > 0;
  }
}
