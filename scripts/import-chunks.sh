#!/bin/bash
# Split large SQL file into chunks and import via wrangler

set -e

CHUNK_SIZE=50000  # 50k lines per chunk
INPUT_FILE="data/data-only.sql"
CHUNK_DIR="data/chunks"
DB_NAME="tanstack-fast-db"

echo "🔄 Preparing chunked import..."

# Create chunks directory
mkdir -p "$CHUNK_DIR"
rm -f "$CHUNK_DIR"/*.sql

# Extract header (first 3 lines)
head -n 3 "$INPUT_FILE" > "$CHUNK_DIR/header.sql"

# Extract footer (last 2 lines)
tail -n 2 "$INPUT_FILE" > "$CHUNK_DIR/footer.sql"

# Split the main content (skip header and footer, split INSERT statements)
echo "📦 Splitting into chunks..."
sed -n '4,$p' "$INPUT_FILE" | head -n -2 | split -l $CHUNK_SIZE - "$CHUNK_DIR/chunk_"

# Get total chunks
TOTAL_CHUNKS=$(ls -1 "$CHUNK_DIR"/chunk_* 2>/dev/null | wc -l)
echo "📊 Created $TOTAL_CHUNKS chunks"

# Import each chunk
CURRENT=0
for chunk in "$CHUNK_DIR"/chunk_*; do
  CURRENT=$((CURRENT + 1))
  echo ""
  echo "⏳ Importing chunk $CURRENT/$TOTAL_CHUNKS..."

  # Create complete SQL file with header and footer
  TEMP_SQL="$CHUNK_DIR/temp_import.sql"
  cat "$CHUNK_DIR/header.sql" "$chunk" "$CHUNK_DIR/footer.sql" > "$TEMP_SQL"

  # Import via wrangler
  pnpm wrangler d1 execute "$DB_NAME" --local --file="$TEMP_SQL"

  # Clean up temp file
  rm "$TEMP_SQL"
done

echo ""
echo "✅ Import complete!"
echo "🧹 Cleaning up chunks..."
rm -rf "$CHUNK_DIR"

echo "✅ Done!"
