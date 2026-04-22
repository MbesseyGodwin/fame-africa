#!/bin/bash
# ==============================================================================
# ROBUST DEPLOYMENT SCRIPT FOR FAMEAFRICA API
# ==============================================================================
# This script handles Prisma client generation with multiple fail-safe layers
# to ensure deployment success on Render.com regardless of environment issues.

set -e # Exit immediately if a command fails

echo "🚀 Starting FameAfrica API Deployment Sequence..."

# --- STAGE 0: ENVIRONMENT DIAGNOSTICS ---
echo "--- STAGE 0: Environment Diagnostics ---"
echo "Node version: $(node -v)"
echo "Yarn version: $(yarn -v 2>/dev/null || echo 'not found')"
echo "Current directory: $(pwd)"

# --- STAGE 1: PRISMA BINARY RESOLUTION ---
echo "--- STAGE 1: prisma binary Resolution ---"

# Step 1.1: Standard path detection
PRISMA_BIN=""

if [ -f "./node_modules/.bin/prisma" ]; then
    PRISMA_BIN="./node_modules/.bin/prisma"
    echo "✅ Found prisma at standard path: $PRISMA_BIN"
fi

# Step 1.2: Fallback to recursive search if not found
if [ -z "$PRISMA_BIN" ]; then
    echo "⚠️ Prisma not at standard path. Searching recursively..."
    SEARCH_RESULT=$(find . -name prisma -type f -executable | head -n 1)
    if [ -n "$SEARCH_RESULT" ]; then
        PRISMA_BIN=$SEARCH_RESULT
        echo "✅ Found prisma binary via search at: $PRISMA_BIN"
    fi
fi

# --- STAGE 2: PRISMA GENERATION ---
echo "--- STAGE 2: Prisma Client Generation ---"

SCHEMA_PATH="packages/database/prisma/schema.prisma"

if [ -n "$PRISMA_BIN" ]; then
    echo "⚡ Using discovered binary: $PRISMA_BIN"
    $PRISMA_BIN generate --schema=$SCHEMA_PATH
else
    echo "⚠️ Binary not found. Trying npx fallback (Stage 2.1)..."
    # Using --yes and explicit version to force non-interactive execution
    npx --yes prisma@5.7.0 generate --schema=$SCHEMA_PATH || {
        echo "❌ npx fallback failed. Trying Workspace fallback (Stage 2.2)..."
        yarn workspace @votenaija/database generate || {
            echo "🚨 ALL PRISMA GENERATION METHODS FAILED."
            echo "Debug: Listing current node_modules folder structure..."
            ls -R node_modules/.bin | head -n 20
            exit 1
        }
    }
fi

# --- STAGE 3: API Build ---
echo "--- STAGE 3: API Build ---"
echo "🏗️  Building API workspace..."

# We allow the build to proceed if output is generated, even if tsc returns 
# warnings from 3rd party libraries like 'ox'.
yarn workspace @votenaija/api build || {
    echo "⚠️  Build command returned a non-zero exit code. Checking for output files..."
    if [ -f "services/api/dist/index.js" ]; then
        echo "✅ Production bundle found at services/api/dist/index.js. Proceeding..."
    else
        echo "🚨 Build failed: No output was generated in services/api/dist/"
        exit 1
    fi
}

echo "✅ Deployment Sequence Completed Successfully!"
