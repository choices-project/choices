#!/bin/bash
set -e

# Debug: Show current directory and contents
echo "=== VERCEL INSTALL SCRIPT DEBUG ==="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la | head -20
echo ""
echo "Checking for package.json..."
if [ -f ./package.json ]; then
  echo "✓ package.json exists"
  echo "Checking for Next.js in package.json..."
  if grep -q '"next"' ./package.json; then
    echo "✓ Next.js found in package.json"
    echo "Next.js version: $(grep '"next"' ./package.json | head -1)"
  else
    echo "✗ Next.js not found in package.json"
    echo "package.json dependencies section:"
    grep -A 50 '"dependencies"' ./package.json | head -30
  fi
else
  echo "✗ package.json missing"
  echo "Available files:"
  ls -la
fi
echo "=== END DEBUG ==="
echo ""

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
  echo "This may cause npm ci to fail if the directory doesn't exist"
fi

# Run npm ci to install dependencies
echo "Running npm ci..."
if ! npm ci 2>&1 | tee /tmp/npm-ci-output.log; then
  echo "npm ci failed. Checking if package-lock.json needs to be regenerated..."
  # Check if the error is due to lockfile mismatch
  if grep -q "package-lock.json\|lock file\|Missing.*from lock file" /tmp/npm-ci-output.log; then
    echo "Lockfile mismatch detected. Regenerating package-lock.json..."
    # Ensure services-civics-shared exists before regenerating
    if [ -d ./services-civics-shared ]; then
      # Update package.json if needed
      CURRENT_DEP=$(node -p "require('./package.json').dependencies['@choices/civics-shared']" 2>/dev/null || echo "")
      if [ "$CURRENT_DEP" != "file:./services-civics-shared" ]; then
        echo "Updating package.json to reference local services-civics-shared..."
        npm pkg set dependencies.@choices/civics-shared=file:./services-civics-shared
      fi
      echo "Regenerating package-lock.json with npm install..."
      npm install --package-lock-only --no-save
      echo "Retrying npm ci..."
      npm ci || {
        echo "Error: npm ci failed even after regenerating lockfile"
        echo "Trying npm install as fallback..."
        npm install --no-save || {
          echo "Error: Both npm ci and npm install failed"
          exit 1
        }
      }
    else
      echo "Error: services-civics-shared not found, cannot regenerate lockfile"
      exit 1
    fi
  else
    echo "Error: npm ci failed for a different reason (not lockfile mismatch)"
    cat /tmp/npm-ci-output.log
    exit 1
  fi
fi

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

