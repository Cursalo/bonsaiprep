#!/bin/bash

echo "Applying migrations to Supabase..."

# Set Supabase project reference - replace with your project reference
SUPABASE_PROJECT_ID="tzekravlcxjpfeetbsfr"

# Loop through migration files and apply them
for migration_file in supabase/migrations/*.sql; do
  echo "Applying migration: $migration_file"
  npx supabase db push --project-ref=$SUPABASE_PROJECT_ID --migrations-dir=supabase/migrations
  
  # Check if the command was successful
  if [ $? -eq 0 ]; then
    echo "✅ Migration applied successfully"
  else
    echo "❌ Failed to apply migration"
    exit 1
  fi
done

echo "All migrations applied successfully!" 