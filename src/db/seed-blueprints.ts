// src/db/seed-blueprints.ts
import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function main() {
  console.log('Seeding category blueprints...');

  const blueprints = [
    { name: 'Pakaian', attributes: ['Size', 'Color'] },
    { name: 'Sepatu', attributes: ['Size', 'Color', 'Material'] },
    { name: 'Parfum', attributes: ['Volume', 'Type'] },
    { name: 'Jam Tangan', attributes: ['Gender', 'Movement'] },
    { name: 'Tas', attributes: ['Material', 'Color', 'Dimension'] },
  ];

  for (const bp of blueprints) {
    const { sql: dSql } = await import('drizzle-orm');
    await db.update(schema.categories)
      .set({ specifications: { attributes: bp.attributes } })
      .where(dSql`lower(${schema.categories.name}) = ${bp.name.toLowerCase()}`);
    console.log(`Updated ${bp.name}`);
  }

  console.log('Done!');
}

main().catch(console.error);
