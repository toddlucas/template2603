#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
if [ -f ../../Base2.Web/src/warehouse.db ]; then
  cp -f ../../Base2.Web/src/warehouse.db ../../Base2.Web/src/warehouse.db.bak
fi
rm -f ../../Base2.Web/src/warehouse.db
rm -rf ../../Base2.Data.Sqlite/src/Migrations/Warehouse
"$SCRIPTDIR/add-sqlite-warehouse-migration.sh" Initial
"$SCRIPTDIR/update-sqlite-warehouse-database.sh"
