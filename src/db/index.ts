// src/db/index.ts
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from 'ws';
import * as schema from './schema';

// Required for WebSocket in Node environments (Next.js build/dev)
if (typeof globalThis.window === 'undefined' && (process.env.NODE_ENV === 'development' || !process.env.VERCEL)) {
  neonConfig.webSocketConstructor = ws;
}

if (!process.env.DATABASE_URL) {
  throw new Error('[db/index.ts] DATABASE_URL is not set in environment variables.');
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
