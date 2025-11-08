/**
 * Resumable data import - skips already imported rows
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import Database from 'better-sqlite3';
import { resolve } from 'path';

const DB_PATH = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce7b06e6140159768f908a262c0b5cfafca9aeba02ff3e32f57c028aed46c271.sqlite');
const DATA_FILE = resolve('data/data-only.sql');
const BATCH_SIZE = 500; // Smaller batches to avoid crashes

async function importData() {
  console.log('🔄 Resuming data import...');

  const db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL'); // Better performance
  db.pragma('synchronous = NORMAL');
  db.pragma('foreign_keys = OFF');

  // Check current counts
  const counts = {
    categories: db.prepare('SELECT COUNT(*) as cnt FROM categories').get() as {cnt: number},
    collections: db.prepare('SELECT COUNT(*) as cnt FROM collections').get() as {cnt: number},
    products: db.prepare('SELECT COUNT(*) as cnt FROM products').get() as {cnt: number},
    subcategories: db.prepare('SELECT COUNT(*) as cnt FROM subcategories').get() as {cnt: number},
    subcollections: db.prepare('SELECT COUNT(*) as cnt FROM subcollections').get() as {cnt: number},
    users: db.prepare('SELECT COUNT(*) as cnt FROM users').get() as {cnt: number},
  };

  console.log('📊 Current counts:');
  for (const [table, {cnt}] of Object.entries(counts)) {
    console.log(`  ${table}: ${cnt.toLocaleString()}`);
  }
  console.log('');

  const input = createReadStream(DATA_FILE, { encoding: 'utf8' });
  const rl = createInterface({ input });

  let totalInserted = 0;
  let skipped = 0;
  let currentTable = '';

  for await (const line of rl) {
    if (!line.startsWith('INSERT INTO')) continue;

    const match = line.match(/^INSERT INTO (\w+)/);
    if (!match) continue;

    const table = match[1];

    if (table !== currentTable) {
      currentTable = table;
      console.log(`\n📝 Processing ${table}...`);
    }

    try {
      const stmt = db.prepare(line);
      stmt.run();
      totalInserted++;

      if (totalInserted % 5000 === 0) {
        console.log(`  ✓ ${totalInserted.toLocaleString()} rows inserted`);
      }
    } catch (err: any) {
      // Skip if constraint error (row already exists)
      if (err.message?.includes('UNIQUE') || err.message?.includes('PRIMARY KEY')) {
        skipped++;
      } else {
        console.error(`  ❌ Error: ${err.message}`);
        console.error(`  Statement: ${line.substring(0, 100)}...`);
        // Continue on error instead of crashing
      }
    }
  }

  db.pragma('foreign_keys = ON');
  db.close();

  console.log('\n✅ Import complete!');
  console.log(`📊 New rows inserted: ${totalInserted.toLocaleString()}`);
  console.log(`⏭️  Rows skipped (duplicates): ${skipped.toLocaleString()}`);
}

importData().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
