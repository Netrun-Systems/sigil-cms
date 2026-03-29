#!/bin/bash
# Detect raw SQL execute calls that are incompatible with Drizzle ORM.
# Drizzle's db.execute() requires a sql tagged template, not { text, values }.

PATTERN='db\.execute\(\s*{'
FILES=$(grep -rn "$PATTERN" apps/api/src/ --include="*.ts" -l 2>/dev/null)

if [ -n "$FILES" ]; then
  echo "ERROR: Found db.execute({ text, values }) pattern (incompatible with Drizzle ORM)"
  echo "Use sql\`...\` tagged template instead."
  echo ""
  grep -rn "$PATTERN" apps/api/src/ --include="*.ts"
  echo ""
  echo "Fix: import { sql } from 'drizzle-orm'; then use db.execute(sql\`...\`)"
  exit 1
fi

echo "OK: No raw SQL execute patterns found"
