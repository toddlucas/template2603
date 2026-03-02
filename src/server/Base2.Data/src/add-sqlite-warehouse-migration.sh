#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
dotnet ef migrations add "$1" --context WarehouseDbContext --project ../../Base2.Data.Sqlite/src --output-dir Migrations/Warehouse --startup-project ../../Base2.Web/src
