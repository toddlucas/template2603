#!/usr/bin/env bash
set -euo pipefail
SCRIPTDIR="$(cd "$(dirname "$0")" && pwd)"

cd "$SCRIPTDIR"
dotnet ef migrations remove --context AppDbContext --project ../../Base2.Data.Sqlite/src --startup-project ../../Base2.Web/src
