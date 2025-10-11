# Research-First Approach

## Description
Research existing code, documentation, and context before making any changes.

## Commands
```bash
# Search for existing implementations
grep -r "ApplicationError" web/ --include="*.ts" --include="*.tsx"
grep -r "error-handling" web/ --include="*.ts" --include="*.tsx"
grep -r "logger" web/ --include="*.ts" --include="*.tsx"

# Check for existing patterns
find web/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "try.*catch"
find web/ -name "*.ts" -o -name "*.tsx" | xargs grep -l "ApplicationError"

# Review documentation
ls docs/FEATURE_AUDITS/
ls docs/features/
```

## Research Checklist
- [ ] Read existing code and documentation
- [ ] Understand the full system before implementing
- [ ] Check for existing infrastructure
- [ ] Review related roadmaps for context
- [ ] Never make assumptions about codebase structure
- [ ] Use scratch directory for temporary analysis
