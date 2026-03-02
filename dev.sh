#!/bin/zsh
# This script must be SOURCED, not executed, for PATH changes to persist
# Usage: source dev.sh  or  . dev.sh

# Get script directory
_PROJ_DIR="$(cd "$(dirname "${(%):-%x}")" && pwd)"
_PROJ_ROOT="$_PROJ_DIR"
_PROJ_BIN_DIR="$_PROJ_ROOT/bin"

# Check for user-specific dev file
if [ -f "$_PROJ_ROOT/dev-$USER.sh" ]; then
    source "$_PROJ_ROOT/dev-$USER.sh"
else
    echo "$_PROJ_ROOT/dev-$USER.sh"
    echo "No developer environment file dev-$USER.sh was found. Skipping."
fi

# Source pgenv script if it exists
if [ -f "$_PROJ_BIN_DIR/pgenv.sh" ]; then
    source "$_PROJ_BIN_DIR/pgenv.sh"
elif [ -f "$_PROJ_BIN_DIR/pgenv" ]; then
    source "$_PROJ_BIN_DIR/pgenv"
fi

# Add bin directory to PATH (only if not already present)
if [[ ":$PATH:" != *":$_PROJ_BIN_DIR:"* ]]; then
    export PATH="$_PROJ_BIN_DIR:$PATH"
fi

