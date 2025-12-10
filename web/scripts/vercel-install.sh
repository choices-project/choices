#!/bin/bash
set -e

# Copy civics-shared into web/ directory if it exists and hasn't been copied yet
if [ -d ../services/civics-shared ] && [ ! -d ./services-civics-shared ]; then
  cp -r ../services/civics-shared ./services-civics-shared
  npm pkg set dependencies.@choices/civics-shared=file:./services-civics-shared
  npm install --package-lock-only
fi

# Run npm ci
npm ci

