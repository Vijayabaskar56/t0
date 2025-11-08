#!/usr/bin/env node
/**
 * Extract only INSERT statements from converted SQLite file
 * This produces a data-only file that can be imported into existing schema
 */

import { createReadStream, createWriteStream } from 'fs';
import { createInterface } from 'readline';

const INPUT_FILE = './data/data-sqlite.sql';
const OUTPUT_FILE = './data/data-only.sql';

let insertCount = 0;

async function extract() {
  console.log('🔄 Extracting INSERT statements...');

  const input = createReadStream(INPUT_FILE, { encoding: 'utf8' });
  const output = createWriteStream(OUTPUT_FILE, { encoding: 'utf8' });
  const rl = createInterface({ input });

  // Write header
  output.write('-- Data-only SQLite import\n');
  output.write('PRAGMA foreign_keys = OFF;\n');
  output.write('BEGIN TRANSACTION;\n\n');

  for await (const line of rl) {
    if (line.startsWith('INSERT INTO')) {
      output.write(line + '\n');
      insertCount++;

      if (insertCount % 100000 === 0) {
        console.log(`⏳ Extracted ${(insertCount / 1000).toFixed(0)}k INSERT statements...`);
      }
    }
  }

  // Write footer
  output.write('\nCOMMIT;\n');
  output.write('PRAGMA foreign_keys = ON;\n');
  output.end();

  await new Promise(resolve => output.on('finish', resolve));

  console.log('');
  console.log('✅ Extraction complete!');
  console.log(`📊 Total INSERT statements: ${insertCount.toLocaleString()}`);
  console.log(`📁 Output: ${OUTPUT_FILE}`);
}

extract().catch(err => {
  console.error('❌ Extraction failed:', err);
  process.exit(1);
});
