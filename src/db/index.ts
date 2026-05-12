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
  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is missing in production environment');
  }
}

const connectionString = process.env.DATABASE_URL || '';
const pool = new Pool({ connectionString });

export const db = drizzle(pool, { schema });

export type DB = typeof db;
