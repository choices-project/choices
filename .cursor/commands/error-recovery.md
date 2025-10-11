# Error Recovery and Rollback

## Description
Recover from errors and rollback changes when needed.

## Commands
```bash
# Check git status
git status

# See recent commits
git log --oneline -10

# Rollback last commit (if needed)
git reset --soft HEAD~1

# Check for uncommitted changes
git diff --name-only

# Backup current state
git stash push -m "backup-$(date +%Y-%m-%d)"

# Restore from backup
git stash pop
```

## Recovery Checklist
- [ ] Check git status before major changes
- [ ] Create backup before risky operations
- [ ] Use scratch directory for experiments
- [ ] Test changes incrementally
- [ ] Rollback if issues arise
