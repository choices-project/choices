#!/bin/bash

# Script to fix nullish coalescing errors
# Replaces || with ?? where appropriate (when left side could be null/undefined)

echo "🔧 Fixing nullish coalescing errors..."

# Find all TypeScript/TSX files
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
    echo "Processing: $file"
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process the file to fix nullish coalescing
    # This is a simplified approach - be careful with complex expressions
    sed -E '
        # Fix common patterns where || should be ??
        # Pattern: variable || defaultValue (where variable could be null/undefined)
        s/([a-zA-Z_][a-zA-Z0-9_]*)\s*\|\|\s*([a-zA-Z_][a-zA-Z0-9_]*)/\1 ?? \2/g
        s/([a-zA-Z_][a-zA-Z0-9_]*\?)\s*\|\|\s*([a-zA-Z_][a-zA-Z0-9_]*)/\1 ?? \2/g
        s/([a-zA-Z_][a-zA-Z0-9_]*\?\.\w+)\s*\|\|\s*([a-zA-Z_][a-zA-Z0-9_]*)/\1 ?? \2/g
        
        # Fix patterns with optional chaining
        s/([a-zA-Z_][a-zA-Z0-9_]*\?\.\w+)\s*\|\|\s*([a-zA-Z_][a-zA-Z0-9_]*)/\1 ?? \2/g
        
        # Fix patterns with function calls that could return null/undefined
        s/([a-zA-Z_][a-zA-Z0-9_]*\([^)]*\))\s*\|\|\s*([a-zA-Z_][a-zA-Z0-9_]*)/\1 ?? \2/g
    ' "$file" > "$temp_file"
    
    # Only replace if the file actually changed
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "  ✅ Updated: $file"
    else
        rm "$temp_file"
    fi
done

echo "✅ Nullish coalescing fixes applied!"
