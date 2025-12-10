#!/bin/bash
set -e

# Copy civics-shared into web/ directory if it exists and hasn't been copied yet
# Check multiple possible locations for the source directory
CIVICS_SOURCE=""
if [ -d ../services/civics-shared ]; then
  CIVICS_SOURCE="../services/civics-shared"
elif [ -d ../../services/civics-shared ]; then
  CIVICS_SOURCE="../../services/civics-shared"
elif [ -d ./services/civics-shared ]; then
  CIVICS_SOURCE="./services/civics-shared"
fi

if [ -n "$CIVICS_SOURCE" ] && [ ! -d ./services-civics-shared ]; then
  echo "Copying civics-shared from $CIVICS_SOURCE..."
  cp -r "$CIVICS_SOURCE" ./services-civics-shared
  echo "Updating package.json..."
  npm pkg set dependencies.@choices/civics-shared=file:./services-civics-shared
  echo "Updating package-lock.json..."
  npm install --package-lock-only
fi

# Run npm ci to install dependencies
echo "Running npm ci..."
npm ci

# Verify civics-shared is installed - create symlink if needed
if [ ! -e ./node_modules/@choices/civics-shared ]; then
  echo "Warning: @choices/civics-shared not found in node_modules after npm ci"
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

