# Complete Development Workflow

## Description
End-to-end development workflow following all best practices.

## Commands
```bash
# 1. Research first
cd web
npm run types:dev
npm run lint:gradual
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "ApplicationError"

# 2. Fix errors with best practices
npm run lint:fix:gradual
npm run type-check

# 3. Quality assurance
npm run test
npm run lint:gradual -- --rule 'no-console: warn'
npm run lint:gradual -- --rule 'unused-imports/no-unused-vars: error'

# 4. Clean up temporary files
rm -rf /Users/alaughingkitsune/src/Choices/scratch/temp_*
```

## Workflow Steps
1. **Research** existing code and patterns
2. **Fix** root causes, not symptoms
3. **Implement** with professional standards
4. **Test** thoroughly
5. **Document** changes
6. **Clean up** temporary files
