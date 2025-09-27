#!/bin/bash

# Quarantine Future Features Script
# Moves incomplete future features to quarantine directory to prevent CI issues

set -e

echo "🔒 Quarantining Future Features..."

# Create quarantine directory structure
mkdir -p web/quarantine/future-features/{social-sharing,automated-polls,device-flow,contact-information}

# Function to quarantine a file
quarantine_file() {
    local source_file="$1"
    local target_dir="$2"
    local filename=$(basename "$source_file")
    
    if [ -f "$source_file" ]; then
        echo "📦 Quarantining: $source_file -> $target_dir/$filename.disabled"
        cp "$source_file" "$target_dir/$filename.disabled"
        echo "✅ Quarantined: $filename"
    else
        echo "⚠️  File not found: $source_file"
    fi
}

# Quarantine social sharing features
echo "🔒 Quarantining Social Sharing Features..."
quarantine_file "web/lib/social-sharing.ts" "web/quarantine/future-features/social-sharing"
quarantine_file "web/features/auth/components/SocialLoginButtons.tsx" "web/quarantine/future-features/social-sharing"
quarantine_file "web/components/auth/SocialSignup.tsx" "web/quarantine/future-features/social-sharing"

# Quarantine automated polls
echo "🔒 Quarantining Automated Polls..."
quarantine_file "web/dev/lib/automated-polls.ts" "web/quarantine/future-features/automated-polls"

# Quarantine device flow
echo "🔒 Quarantining Device Flow..."
quarantine_file "web/lib/core/auth/device-flow.ts" "web/quarantine/future-features/device-flow"
quarantine_file "web/components/auth/DeviceFlowAuth.tsx" "web/quarantine/future-features/device-flow"
quarantine_file "web/features/auth/pages/device-flow/complete/page.tsx" "web/quarantine/future-features/device-flow"

# Quarantine contact information
echo "🔒 Quarantining Contact Information..."
quarantine_file "web/database/contact-information-schema.sql" "web/quarantine/future-features/contact-information"

echo "✅ Quarantine complete!"
echo ""
echo "📋 Next steps:"
echo "1. Review quarantined files in web/quarantine/future-features/"
echo "2. Remove original files if they're properly quarantined"
echo "3. Update imports in production code"
echo "4. Ensure feature flags are set to false"
echo ""
echo "🔍 To unquarantine a feature:"
echo "1. Remove .disabled extension"
echo "2. Move to appropriate production directory"
echo "3. Set feature flag to true"
echo "4. Update CI configuration"
