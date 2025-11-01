#!/bin/bash

# Script to add React imports to TSX files that need them
# This fixes the "React is not defined" errors

echo "🔧 Adding React imports to TSX files..."

# Find all TSX files that don't have React imports but use JSX
find . -name "*.tsx" -not -path "./node_modules/*" -not -path "./.next/*" | while read file; do
    # Skip if file already has React import
    if grep -q "import.*React" "$file"; then
        continue
    fi
    
    # Skip if file doesn't use JSX (no < or /> in the file)
    if ! grep -q "[<>]" "$file"; then
        continue
    fi
    
    echo "Processing: $file"
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Check if file has 'use client' directive
    if head -5 "$file" | grep -q "'use client'"; then
        # File has 'use client', add React import after it
        awk '
        /^'\''use client'\'';?$/ { 
            print $0; 
            print ""; 
            print "import React from '\''react'\'';"; 
            next 
        }
        { print }
        ' "$file" > "$temp_file"
    else
        # File doesn't have 'use client', add React import at the top
        {
            echo "import React from 'react';"
            echo ""
            cat "$file"
        } > "$temp_file"
    fi
    
    # Replace original file with updated version
    mv "$temp_file" "$file"
done

echo "✅ React imports added to TSX files!"
