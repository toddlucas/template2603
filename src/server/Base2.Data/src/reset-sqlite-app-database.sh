#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
if [ -f ../../Base2.Web/src/base2.db ]; then
  cp -f ../../Base2.Web/src/base2.db ../../Base2.Web/src/base2.db.bak
fi
rm -f ../../Base2.Web/src/base2.db
rm -rf ../../Base2.Data.Sqlite/src/Migrations/App
"$SCRIPTDIR/add-sqlite-app-migration.sh" Initial
"$SCRIPTDIR/update-sqlite-app-database.sh"
