#!/bin/bash

echo "Applying migrations to Supabase..."

# Ensure you are logged in and the project is linked.
# The supabase link command should have been run interactively before this script.

echo "Pushing all pending migrations from supabase/migrations..."
npx supabase db push

# Check if the command was successful
if [ $? -eq 0 ]; then
  echo "✅ All pending migrations applied successfully."
else
  echo "❌ Failed to apply migrations. Please check the output above and ensure your project is linked correctly and you have the correct permissions."
  exit 1
fi

echo "Database migration process complete." 