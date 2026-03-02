#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
psql -U postgres -a -c "DROP DATABASE IF EXISTS product_name"
rm -rf ../../Base2.Data.Npgsql/src/Migrations/App
"$SCRIPTDIR/add-npgsql-app-migration.sh" Initial
"$SCRIPTDIR/update-npgsql-app-database.sh"
