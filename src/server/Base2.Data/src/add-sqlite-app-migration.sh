#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
dotnet ef migrations add "$1" --context AppDbContext --project ../../Base2.Data.Sqlite/src --output-dir Migrations/App --startup-project ../../Base2.Web/src
