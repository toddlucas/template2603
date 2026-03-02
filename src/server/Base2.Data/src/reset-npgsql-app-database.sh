#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
psql -U postgres -a -c "DROP DATABASE IF EXISTS product_name"
psql -U postgres -a -c "DROP USER IF EXISTS product_name_user"
rm -rf ../../Base2.Data.Npgsql/src/Migrations/App
"$SCRIPTDIR/add-npgsql-app-migration.sh" Initial
"$SCRIPTDIR/add-npgsql-app-migration.sh" EnableRowLevelSecurity

python3 "$SCRIPTDIR/Scripts/replace-migration-methods.py" --up "$SCRIPTDIR/Scripts/rls-app-up.txt" --down "$SCRIPTDIR/Scripts/rls-app-down.txt" --no-backup --file-pattern "../../Base2.Data.Npgsql/src/Migrations/App/*_EnableRowLevelSecurity.cs"

"$SCRIPTDIR/update-npgsql-app-database.sh"
psql -U postgres -a -c "ALTER ROLE product_name_user WITH PASSWORD 'abc123'"
