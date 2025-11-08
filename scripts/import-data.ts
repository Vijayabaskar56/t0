/**
 * Import data from data-only.sql using direct SQLite access
 * Uses streaming to avoid memory issues
 */

import { createReadStream } from 'fs';
import { createInterface } from 'readline';
import Database from 'better-sqlite3';
import { resolve } from 'path';

const DB_PATH = resolve('.wrangler/state/v3/d1/miniflare-D1DatabaseObject/ce7b06e6140159768f908a262c0b5cfafca9aeba02ff3e32f57c028aed46c271.sqlite');
const DATA_FILE = resolve('data/data-only.sql');

const BATCH_SIZE = 1000; // Process 1000 inserts at a time

async function importData() {
  console.log('🔄 Starting data import...');
  console.log(`📁 Database: ${DB_PATH}`);
  console.log(`📝 Data file: ${DATA_FILE}`);
  console.log('');

  const db = new Database(DB_PATH);

  // Disable foreign keys during import for speed
  db.pragma('foreign_keys = OFF');

  const input = createReadStream(DATA_FILE, { encoding: 'utf8' });
  const rl = createInterface({ input });

  let batch: string[] = [];
  let totalInserted = 0;
  let inTransaction = false;

  for await (const line of rl) {
    // Skip header/footer
    if (line.startsWith('--') || line.startsWith('PRAGMA') ||
        line.startsWith('BEGIN') || line.startsWith('COMMIT')) {
      continue;
    }

    if (line.startsWith('INSERT INTO')) {
      batch.push(line);

      // Execute batch
      if (batch.length >= BATCH_SIZE) {
        if (!inTransaction) {
          db.exec('BEGIN TRANSACTION');
          inTransaction = true;
        }

        for (const stmt of batch) {
          try {
            db.exec(stmt);
          } catch (err: any) {
            console.error(`Error executing: ${stmt.substring(0, 100)}...`);
            throw err;
          }
        }

        db.exec('COMMIT');
        inTransaction = false;

        totalInserted += batch.length;
        batch = [];

        if (totalInserted % 10000 === 0) {
          console.log(`⏳ Imported ${(totalInserted / 1000).toFixed(0)}k rows...`);
        }
      }
    }
  }

  // Import remaining batch
  if (batch.length > 0) {
    db.exec('BEGIN TRANSACTION');
    for (const stmt of batch) {
      db.exec(stmt);
    }
    db.exec('COMMIT');
    totalInserted += batch.length;
  }

  // Re-enable foreign keys
  db.pragma('foreign_keys = ON');
  db.close();

  console.log('');
  console.log('✅ Import complete!');
  console.log(`📊 Total rows inserted: ${totalInserted.toLocaleString()}`);
}

importData().catch(err => {
  console.error('❌ Import failed:', err);
  process.exit(1);
});
