# Quick Reference Guide

## 🚀 **Quick Commands**
- `fix-errors` - Fix TypeScript and linting errors
- `quality-check` - Comprehensive quality assurance
- `research-first` - Research existing code before changes
- `complete-workflow` - End-to-end development workflow
- `error-recovery` - Error recovery and rollback

## 📋 **Common Tasks**

### Fix Errors
```bash
cd web
npm run types:dev
npm run lint:fix
npm run lint -- --rule 'no-unused-vars: error'
```

### Research Before Changes
```bash
cd web
grep -r "ApplicationError" . --include="*.ts"
find . -name "*.ts" -o -name "*.tsx" | xargs grep -l "try.*catch"
```

### Quality Check
```bash
cd web
npm run types:dev && npm run lint:strict && npm run test
grep -r "console\.log" . --include="*.ts" --include="*.tsx"
```

## 🎯 **Best Practices Summary**
- **NEVER** underscore variables (`_variable`)
- **NEVER** use `// @ts-nocheck`
- **ALWAYS** use `ApplicationError` for errors
- **ALWAYS** use absolute imports (`@/features/*`)
- **ALWAYS** check system date dynamically
- **ALWAYS** use scratch directory for temp files
- **ALWAYS** research before implementing
- **ALWAYS** fix root causes, not symptoms

## 📁 **File Organization**
- **Main Code**: `web/` directory
- **Temporary Files**: `scratch/` directory
- **Documentation**: `docs/` directory
- **Configuration**: `.cursor/` directory
