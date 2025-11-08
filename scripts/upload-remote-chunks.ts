import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { createReadStream } from 'node:fs';
import { createInterface } from 'node:readline';

const CHUNK_SIZE = 50000; // 50k INSERT statements per chunk
const CHECKPOINT_FILE = 'data/upload-checkpoint.json';
const DATA_FILE = 'data/data-ordered.sql';
const DB_NAME = 'tanstack-fast-db';

interface Checkpoint {
  lastCompletedChunk: number;
  totalChunks: number;
  totalLines: number;
  startTime: string;
  lastUpdateTime: string;
}

async function countLines(): Promise<number> {
  let count = 0;
  const rl = createInterface({
    input: createReadStream(DATA_FILE),
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    count++;
  }

  return count;
}

async function loadCheckpoint(): Promise<Checkpoint | null> {
  if (existsSync(CHECKPOINT_FILE)) {
    return JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf-8'));
  }
  return null;
}

function saveCheckpoint(checkpoint: Checkpoint) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

async function uploadChunk(chunkNum: number, lines: string[]): Promise<boolean> {
  const chunkFile = `data/chunk-${chunkNum}.sql`;

  try {
    // Write chunk to temp file
    writeFileSync(chunkFile, lines.join('\n'));

    console.log(`  📤 Uploading chunk ${chunkNum} (${lines.length} statements)...`);

    // Upload via wrangler
    const result = execSync(
      `pnpm wrangler d1 execute ${DB_NAME} --remote --file=${chunkFile}`,
      { encoding: 'utf-8', stdio: 'pipe' }
    );

    // Check for success
    if (result.includes('"success": true')) {
      console.log(`  ✅ Chunk ${chunkNum} uploaded successfully`);

      // Clean up temp file
      execSync(`rm ${chunkFile}`);
      return true;
    } else {
      console.error(`  ❌ Chunk ${chunkNum} failed (no success in response)`);
      return false;
    }
  } catch (err: any) {
    console.error(`  ❌ Chunk ${chunkNum} error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting remote D1 chunked upload...\n');

  // Count total lines
  console.log('📊 Counting lines...');
  const totalLines = await countLines();
  const totalChunks = Math.ceil(totalLines / CHUNK_SIZE);
  console.log(`   Total: ${totalLines.toLocaleString()} statements`);
  console.log(`   Chunks: ${totalChunks} (${CHUNK_SIZE.toLocaleString()} statements each)\n`);

  // Load checkpoint
  let checkpoint = await loadCheckpoint();
  let startChunk = 0;

  if (checkpoint) {
    console.log(`📍 Resuming from checkpoint:`);
    console.log(`   Last completed: Chunk ${checkpoint.lastCompletedChunk}`);
    console.log(`   Started: ${checkpoint.startTime}`);
    console.log(`   Last update: ${checkpoint.lastUpdateTime}\n`);
    startChunk = checkpoint.lastCompletedChunk + 1;
  } else {
    checkpoint = {
      lastCompletedChunk: -1,
      totalChunks,
      totalLines,
      startTime: new Date().toISOString(),
      lastUpdateTime: new Date().toISOString()
    };
  }

  // Process chunks
  const rl = createInterface({
    input: createReadStream(DATA_FILE),
    crlfDelay: Infinity
  });

  let currentChunk = 0;
  let chunkLines: string[] = [];
  let lineNum = 0;
  let skippedLines = 0;

  for await (const line of rl) {
    lineNum++;

    // Skip lines from already-completed chunks
    if (currentChunk < startChunk) {
      skippedLines++;
      if (lineNum % CHUNK_SIZE === 0) {
        currentChunk++;
        console.log(`⏭️  Skipping chunk ${currentChunk - 1} (already completed)`);
      }
      continue;
    }

    chunkLines.push(line);

    // Upload when chunk is full
    if (chunkLines.length === CHUNK_SIZE) {
      const success = await uploadChunk(currentChunk, chunkLines);

      if (!success) {
        console.error(`\n❌ Upload failed at chunk ${currentChunk}. Fix issue and re-run to resume.\n`);
        process.exit(1);
      }

      // Update checkpoint
      checkpoint.lastCompletedChunk = currentChunk;
      checkpoint.lastUpdateTime = new Date().toISOString();
      saveCheckpoint(checkpoint);

      const progress = ((currentChunk + 1) / totalChunks * 100).toFixed(1);
      console.log(`   Progress: ${currentChunk + 1}/${totalChunks} chunks (${progress}%)\n`);

      currentChunk++;
      chunkLines = [];
    }
  }

  // Upload final partial chunk
  if (chunkLines.length > 0) {
    const success = await uploadChunk(currentChunk, chunkLines);

    if (!success) {
      console.error(`\n❌ Upload failed at final chunk ${currentChunk}. Fix issue and re-run to resume.\n`);
      process.exit(1);
    }

    checkpoint.lastCompletedChunk = currentChunk;
    checkpoint.lastUpdateTime = new Date().toISOString();
    saveCheckpoint(checkpoint);
  }

  console.log('\n✅ Upload complete!');
  console.log(`   Total chunks uploaded: ${totalChunks}`);
  console.log(`   Total statements: ${totalLines.toLocaleString()}`);
  console.log(`   Duration: ${new Date().toISOString()}\n`);

  // Clean up checkpoint
  console.log('🧹 Cleaning up checkpoint file...');
  execSync(`rm ${CHECKPOINT_FILE}`);

  console.log('\n🎉 Remote migration complete!\n');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
