#!/bin/bash
set -e

# Copy civics-shared into web/ directory if it exists and hasn't been copied yet
if [ -d ../services/civics-shared ] && [ ! -d ./services-civics-shared ]; then
  echo "Copying civics-shared directory..."
  cp -r ../services/civics-shared ./services-civics-shared
  echo "Updating package.json..."
  npm pkg set dependencies.@choices/civics-shared=file:./services-civics-shared
  echo "Updating package-lock.json..."
  npm install --package-lock-only
fi

# Run npm ci to install dependencies
echo "Running npm ci..."
npm ci

# Verify civics-shared is installed
if [ ! -e ./node_modules/@choices/civics-shared ]; then
  echo "Warning: @choices/civics-shared not found in node_modules after npm ci"
  if [ -d ./services-civics-shared ]; then
    echo "Creating manual symlink..."
    mkdir -p ./node_modules/@choices
    ln -sf ../../services-civics-shared ./node_modules/@choices/civics-shared
  fi
fi

