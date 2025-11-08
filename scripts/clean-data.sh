#!/bin/bash
# Remove BEGIN TRANSACTION, COMMIT, and PRAGMA statements from data-only.sql

echo "Cleaning data file..."
grep -v "^BEGIN TRANSACTION;" data/data-only.sql | \
grep -v "^COMMIT;" | \
grep -v "^PRAGMA foreign_keys" | \
grep -v "^-- " | \
grep -v "^$" > data/data-clean.sql

echo "✓ Created data/data-clean.sql (INSERT statements only)"
wc -l data/data-clean.sql
