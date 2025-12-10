#!/bin/bash
set -e

# This script handles the civics-shared dependency setup and then builds
# We use this instead of installCommand because Vercel checks for Next.js
# during deployment creation (before installCommand runs), and it needs
# to see Next.js in package.json to detect the framework.

echo "=== VERCEL BUILD SCRIPT ==="
echo "Current directory: $(pwd)"

# Check if services-civics-shared already exists locally
if [ -d ./services-civics-shared ]; then
  echo "✓ services-civics-shared directory already exists locally"
else
  # Try to copy civics-shared from parent directory if it exists
  # Check multiple possible locations for the source directory
  CIVICS_SOURCE=""
  if [ -d ../services/civics-shared ]; then
    CIVICS_SOURCE="../services/civics-shared"
  elif [ -d ../../services/civics-shared ]; then
    CIVICS_SOURCE="../../services/civics-shared"
  elif [ -d ./services/civics-shared ]; then
    CIVICS_SOURCE="./services/civics-shared"
  fi

  if [ -n "$CIVICS_SOURCE" ]; then
    echo "Copying civics-shared from $CIVICS_SOURCE..."
    cp -r "$CIVICS_SOURCE" ./services-civics-shared
  else
    echo "Warning: Could not find civics-shared source directory"
    echo "This is expected in Vercel builds with rootDirectory set"
  fi
fi

# Check package.json dependency path and update if needed
CURRENT_DEP=$(node -p "require('./package.json').dependencies['@choices/civics-shared']" 2>/dev/null || echo "")
if [ -d ./services-civics-shared ]; then
  # If local copy exists, ensure package.json references it
  if [ "$CURRENT_DEP" != "file:./services-civics-shared" ]; then
    echo "Updating package.json to reference local services-civics-shared..."
    npm pkg set dependencies.@choices/civics-shared=file:./services-civics-shared
    echo "Regenerating package-lock.json to match updated package.json..."
    npm install --package-lock-only --no-save
  fi
elif [ "$CURRENT_DEP" = "file:../services/civics-shared" ]; then
  # If package.json references parent directory but it doesn't exist, this will fail
  echo "Warning: package.json references ../services/civics-shared but source not found"
  echo "This may cause npm install to fail if the directory doesn't exist"
fi

# Verify civics-shared is installed - create symlink if needed
if [ ! -e ./node_modules/@choices/civics-shared ]; then
  echo "Warning: @choices/civics-shared not found in node_modules"
  if [ -d ./services-civics-shared ]; then
    echo "Creating manual symlink from services-civics-shared..."
    mkdir -p ./node_modules/@choices
    # Remove existing symlink or directory if it exists
    rm -rf ./node_modules/@choices/civics-shared
    ln -sf ../../services-civics-shared ./node_modules/@choices/civics-shared
    echo "Symlink created: $(ls -la ./node_modules/@choices/civics-shared)"
  else
    echo "Error: services-civics-shared directory not found. Cannot create symlink."
    echo "Current directory: $(pwd)"
    echo "Directory contents: $(ls -la)"
    exit 1
  fi
else
  echo "✓ @choices/civics-shared found in node_modules"
fi

# Now run the build
echo "Running npm run build..."
npm run build

