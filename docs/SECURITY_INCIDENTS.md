# Security Incident Response Runbook

**Created:** December 19, 2024  
**Updated:** December 19, 2024

## 🚨 Secret Leak Response (10-Minute Checklist)

### 1. **Contain** (Immediate - 2 minutes)
- [ ] **Revoke/Rotate** the exposed key at the provider (Supabase, Vercel, etc.)
- [ ] **Disable** any affected services if necessary
- [ ] **Document** the incident start time and affected resources

### 2. **Purge** (5 minutes)
- [ ] **Remove** the secret from the current codebase
- [ ] **Check** if secret exists in git history:
  ```bash
  git log --all --full-history --grep="SECRET_NAME" --oneline
  git log --all --full-history -S "SECRET_VALUE" --oneline
  ```
- [ ] **If in history**: Use `git filter-repo` or BFG to remove from history:
  ```bash
  # Install git-filter-repo if not available
  pip install git-filter-repo
  
  # Remove secret from history
  git filter-repo --replace-text <(echo "SECRET_VALUE==>REDACTED")
  
  # Force push (coordinate with team)
  git push --force-with-lease origin main
  ```

### 3. **Invalidate** (2 minutes)
- [ ] **Delete** affected releases/builds from GitHub
- [ ] **Clear** Vercel deployment caches
- [ ] **Rotate** any related credentials or tokens
- [ ] **Check** CI/CD logs for secret exposure

### 4. **Audit** (1 minute)
- [ ] **Review** who had access to the secret
- [ ] **Check** CI logs for any secret logging
- [ ] **Verify** no other instances exist in the codebase
- [ ] **Document** the incident details

### 5. **Prevent Recurrence**
- [ ] **Add** targeted GitLeaks rule if needed
- [ ] **Update** allowlist if false positive
- [ ] **Review** pre-commit hooks effectiveness
- [ ] **Record** incident + rotation date in this file

## 📋 Incident Log Template

```markdown
## Incident #[NUMBER] - [DATE]

**Secret Type:** [API Key/JWT/Database URL/etc.]  
**Provider:** [Supabase/Vercel/etc.]  
**Exposure:** [Code/Docs/CI Logs/etc.]  
**Containment Time:** [TIMESTAMP]  
**Rotation Time:** [TIMESTAMP]  
**Root Cause:** [Copy-paste error/CI logging/etc.]  
**Prevention:** [Added GitLeaks rule/etc.]  

**Status:** ✅ RESOLVED
```

## 🔧 Emergency Contacts

- **Supabase:** [Your Supabase Dashboard]
- **Vercel:** [Your Vercel Dashboard]
- **GitHub:** [Repository Settings > Security]

## 📚 Additional Resources

- [GitLeaks Documentation](https://github.com/gitleaks/gitleaks)
- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)

---

**Remember:** Stay calm, act quickly, and document everything. Most secret leaks are recoverable with prompt action.
