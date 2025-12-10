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
    if [ -n "$VERCEL" ]; then
      echo "Building in Vercel - checking if we need to handle this differently..."
      # In Vercel, we can't access parent directories due to rootDirectory setting
      # Check if package.json needs to be updated
      CURRENT_DEP=$(node -p "require('./package.json').dependencies['@choices/civics-shared']" 2>/dev/null || echo "")
      if [ "$CURRENT_DEP" = "file:../services/civics-shared" ]; then
        echo "Error: package.json references file:../services/civics-shared but parent directory not accessible in Vercel."
        echo "Vercel builds with rootDirectory='web', so ../services/civics-shared is not available."
        echo ""
        echo "Solution: The GitHub Actions workflow should commit the updated package.json,"
        echo "or we need to include services-civics-shared in the repo."
        echo ""
        echo "For now, attempting to install dependencies - this may fail if civics-shared is required..."
        # Don't exit here - let npm install try and fail with a clearer error
      fi
    else
      echo "This is expected in Vercel builds with rootDirectory set"
    fi
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
  if [ -n "$VERCEL" ]; then
    echo "Error: In Vercel builds, parent directories are not accessible due to rootDirectory setting."
    echo "The package.json must reference file:./services-civics-shared and the directory must exist."
    echo ""
    echo "This means either:"
    echo "1. services-civics-shared must be committed to the repo in web/services-civics-shared, OR"
    echo "2. The GitHub Actions workflow must update package.json and commit it before Vercel builds"
    echo ""
    echo "Attempting npm install - this will likely fail..."
    # Don't exit - let npm install show the actual error
  else
    echo "This may cause npm install to fail if the directory doesn't exist"
  fi
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
    echo "Error: services-civics-shared directory not found."
    echo "Current directory: $(pwd)"
    echo "Checking package.json dependency path..."
    CURRENT_DEP=$(node -p "require('./package.json').dependencies['@choices/civics-shared']" 2>/dev/null || echo "")
    echo "package.json references: $CURRENT_DEP"
    
    # If package.json references parent directory, we need to update it
    # This happens when Vercel builds directly from repo (not from GitHub Actions)
    if [ "$CURRENT_DEP" = "file:../services/civics-shared" ]; then
      echo "Warning: package.json references file:../services/civics-shared but parent directory not accessible in Vercel."
      echo "This is expected when Vercel builds directly from the repo."
      echo "The GitHub Actions workflow should have copied it, but Vercel builds independently."
      echo ""
      echo "Attempting to install without civics-shared (build may fail if it's required)..."
      # Try to continue - the build will fail if civics-shared is actually needed
      # But at least we'll get a clearer error message
    elif [ "$CURRENT_DEP" = "file:./services-civics-shared" ]; then
      echo "Error: package.json references file:./services-civics-shared but directory doesn't exist."
      echo "This should have been copied by the GitHub Actions workflow."
      echo "Vercel builds directly from the repo, so the copy step doesn't run."
      exit 1
    else
      echo "package.json references: $CURRENT_DEP"
      echo "npm install should handle this dependency. Continuing build..."
    fi
  fi
else
  echo "✓ @choices/civics-shared found in node_modules"
fi

# Now run the build
echo "Running npm run build..."
npm run build

# Workaround for Vercel route group client reference manifest issue
# Vercel expects this file even though Next.js doesn't generate it for server components in route groups
echo "Creating workaround for route group client reference manifest..."
MANIFEST_DIR=".next/server/app/(app)"
MANIFEST_FILE="$MANIFEST_DIR/page_client-reference-manifest.js"
if [ ! -f "$MANIFEST_FILE" ]; then
  echo "Creating missing client reference manifest file..."
  mkdir -p "$MANIFEST_DIR"
  # Create a proper client reference manifest structure
  # This matches the format Next.js uses for client reference manifests
  cat > "$MANIFEST_FILE" << 'EOF'
module.exports = {
  clientModules: [],
  rsc: {
    moduleId: "",
    chunks: []
  }
};
EOF
  echo "✓ Created $MANIFEST_FILE"
else
  echo "✓ $MANIFEST_FILE already exists"
fi

