#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

echo "Adding RLS migration for PostgreSQL..."
cd "$SCRIPTDIR"
dotnet ef migrations add EnableRowLevelSecurity --context AppDbContext --project ../Base2.Data.Npgsql --startup-project ../../Base2.Web

echo "Migration created. Please review and run update-database when ready."
read -p "Press Enter to continue..."
