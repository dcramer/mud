import * as dotenv from 'dotenv';
import { defineConfig } from 'drizzle-kit';

dotenv.config();

const getDbConfig = () => {
  // For local development with wrangler
  if (process.env.NODE_ENV === 'development' || !process.env.CLOUDFLARE_ACCOUNT_ID) {
    return {
      dialect: 'sqlite' as const,
      schema: './src/server/database/schema.ts',
      out: './drizzle',
      dbCredentials: {
        url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/db.sqlite',
      },
    };
  }

  // For remote D1
  return {
    dialect: 'sqlite' as const,
    driver: 'd1-http' as const,
    schema: './src/server/database/schema.ts',
    out: './drizzle',
    dbCredentials: {
      accountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
      databaseId: process.env.CLOUDFLARE_DATABASE_ID || '',
      token: process.env.CLOUDFLARE_D1_TOKEN || '',
    },
  };
};

export default defineConfig(getDbConfig());
