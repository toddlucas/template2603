#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
psql -U postgres -a -c "DROP DATABASE IF EXISTS warehouse"
psql -U postgres -a -c "DROP USER IF EXISTS warehouse_user"
rm -rf ../../Base2.Data.Npgsql/src/Migrations/Warehouse
"$SCRIPTDIR/add-npgsql-warehouse-migration.sh" Initial
"$SCRIPTDIR/add-npgsql-warehouse-migration.sh" EnableRowLevelSecurity

python3 "$SCRIPTDIR/Scripts/replace-migration-methods.py" --up "$SCRIPTDIR/Scripts/rls-warehouse-up.txt" --down "$SCRIPTDIR/Scripts/rls-warehouse-down.txt" --no-backup --file-pattern "../../Base2.Data.Npgsql/src/Migrations/Warehouse/*_EnableRowLevelSecurity.cs"

"$SCRIPTDIR/update-npgsql-warehouse-database.sh"
psql -U postgres -a -c "ALTER ROLE warehouse_user WITH PASSWORD 'abc123'"
