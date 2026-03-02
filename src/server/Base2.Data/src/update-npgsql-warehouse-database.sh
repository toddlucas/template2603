#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
dotnet ef database update --context WarehouseDbContext --project ../../Base2.Data.Npgsql/src --startup-project ../../Base2.Web/src -- WarehouseDbProvider=Npgsql
