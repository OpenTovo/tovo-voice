#!/bin/bash
# Update version.json from package.json

set -e

# Get the directory of this script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPS_WEB_DIR="$SCRIPT_DIR/../apps/web"

# Read version from package.json
VERSION=$(node -p "require('$APPS_WEB_DIR/package.json').version")
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%S.%3NZ")

# Update version.json
cat > "$APPS_WEB_DIR/public/version.json" << EOF
{
  "version": "$VERSION",
  "timestamp": "$TIMESTAMP"
}
EOF

echo "Updated version.json with version $VERSION"
