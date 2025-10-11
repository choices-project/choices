# Fix TypeScript and Linting Errors

## Description
Automatically fix TypeScript and linting errors according to project best practices.

## Commands
```bash
# Navigate to web directory (monorepo structure)
cd web

# Run TypeScript check
npm run types:dev

# Run linting (unified config with gradual adoption)
npm run lint:gradual

# Fix auto-fixable linting errors
npm run lint:fix:gradual

# Run strict linting (for production)
npm run lint:strict

# Run type checking with strict mode
npm run type-check

# Check for unused variables (using new plugin)
npm run lint:gradual -- --rule 'unused-imports/no-unused-vars: error'

# Fix unused imports (using new plugin)
npm run lint:fix:gradual -- --rule 'unused-imports/no-unused-imports: error'
```

## Best Practices Applied
- **NEVER** use underscores to silence errors (`_variable`)
- **NEVER** use `// @ts-nocheck` except in generated code
- **Fix the actual problem**, don't mask it
- **Remove unused variables entirely** or implement them properly
- **Follow TypeScript strict mode** requirements
- **Use absolute paths** (`@/features/*`, `@/lib/*`) not relative imports
- **Follow established patterns** in the codebase
