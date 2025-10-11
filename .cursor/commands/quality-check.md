# Quality Assurance Check

## Description
Comprehensive quality check including TypeScript, linting, testing, and best practices validation.

## Commands
```bash
# Navigate to web directory (monorepo structure)
cd web

# Full quality check (gradual adoption)
npm run types:dev && npm run lint:gradual && npm run test

# Check for specific issues (using new unified config)
npm run lint:gradual -- --rule 'no-console: warn'
npm run lint:gradual -- --rule 'unused-imports/no-unused-vars: error'
npm run lint:gradual -- --rule 'unused-imports/no-unused-imports: error'

# TypeScript strict check
npm run type-check

# Check for hardcoded dates
grep -r "2024-\|2025-\|today\|current date" . --include="*.ts" --include="*.tsx"

# Check for console.log usage
grep -r "console\.log\|console\.error" . --include="*.ts" --include="*.tsx"
```

## Quality Standards
- Zero TypeScript errors
- Zero linting errors
- No hardcoded dates
- No console.log in production code
- No unused variables or imports
- Proper error handling with ApplicationError
- Absolute imports only
