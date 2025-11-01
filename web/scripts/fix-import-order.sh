#!/bin/bash

# Script to fix import order errors
# This addresses the import/order ESLint errors

echo "🔧 Fixing import order errors..."

# Find all TypeScript/TSX files
find . -name "*.ts" -o -name "*.tsx" | grep -v node_modules | grep -v .next | while read file; do
    echo "Processing: $file"
    
    # Create a temporary file
    temp_file=$(mktemp)
    
    # Process the file to fix import order
    # This is a simplified approach - in practice, you'd want more sophisticated parsing
    awk '
    BEGIN { 
        in_imports = 1
        react_import = ""
        other_imports = ""
        empty_lines = ""
    }
    
    # Detect end of imports
    /^[^[:space:]]/ && !/^(import|export|\/\/|\/\*)/ {
        if (in_imports) {
            in_imports = 0
            # Print all imports in correct order
            if (react_import) print react_import
            if (other_imports) print other_imports
            if (empty_lines) print empty_lines
        }
        print $0
        next
    }
    
    # Process import statements
    /^import.*from.*react/ {
        react_import = $0
        next
    }
    
    /^import/ {
        other_imports = other_imports $0 "\n"
        next
    }
    
    /^$/ && in_imports {
        empty_lines = empty_lines "\n"
        next
    }
    
    # Handle other lines
    {
        if (in_imports) {
            other_imports = other_imports $0 "\n"
        } else {
            print $0
        }
    }
    ' "$file" > "$temp_file"
    
    # Only replace if the file actually changed
    if ! cmp -s "$file" "$temp_file"; then
        mv "$temp_file" "$file"
        echo "  ✅ Updated: $file"
    else
        rm "$temp_file"
    fi
done

echo "✅ Import order fixes applied!"
