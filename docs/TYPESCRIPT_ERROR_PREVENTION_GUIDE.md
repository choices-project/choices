# TypeScript Error Prevention Guide

**Created**: 2025-01-27  
**Last Updated**: 2025-01-27  
**Purpose**: Prevent common TypeScript errors that we've encountered and fixed

## 🎯 **Overview**

This guide documents the common TypeScript errors we've encountered and provides patterns to prevent them from happening again. We've reduced our TypeScript errors from 152 to 56 (63% reduction) and want to maintain this quality.

## 🚨 **Common Error Patterns & Prevention**

### 1. **Security Issue: `select('*')` Usage**

**❌ Problem**: Using `select('*')` exposes all fields, including sensitive data.

**✅ Solution**: Always select specific fields.

```typescript
// ❌ DON'T DO THIS
const { data } = await supabase
  .from('users')
  .select('*')

// ✅ DO THIS INSTEAD
const { data } = await supabase
  .from('users')
  .select('id, email, verification_tier, created_at, updated_at')
```

**Prevention**: 
- Use field mapping configurations for each table
- Add `select('*')` to CI checks as critical error
- Review all database queries before committing

### 2. **Null Check Issues: `'supabase' is possibly 'null'`**

**❌ Problem**: Using variables without null checks.

**✅ Solution**: Add explicit null checks.

```typescript
// ❌ DON'T DO THIS
const { data } = await supabase.from('users').select('*')

// ✅ DO THIS INSTEAD
if (!supabase) {
  throw new Error('Authentication service not available')
}
const { data } = await supabase.from('users').select('*')
```

**Prevention**:
- Always check for null before using services
- Use TypeScript strict mode
- Add null checks in constructor/initialization

### 3. **Error Type Issues: `'error' is of type 'unknown'`**

**❌ Problem**: Accessing properties on unknown error types.

**✅ Solution**: Type guard the error.

```typescript
// ❌ DON'T DO THIS
} catch (error) {
  console.log(error.message)
}

// ✅ DO THIS INSTEAD
} catch (error) {
  console.log(error instanceof Error ? error.message : 'Unknown error')
}
```

**Prevention**:
- Always use type guards for error handling
- Create utility functions for error handling
- Use consistent error handling patterns

### 4. **Type Mismatches: `Type 'null' is not assignable to type 'undefined'`**

**❌ Problem**: Inconsistent null/undefined usage.

**✅ Solution**: Be consistent with null vs undefined.

```typescript
// ❌ DON'T DO THIS
const [userVote, setUserVote] = useState<{ [key: string]: number } | null>(null)

// ✅ DO THIS INSTEAD
const [userVote, setUserVote] = useState<{ [key: string]: number } | undefined>(undefined)
```

**Prevention**:
- Choose one pattern (null or undefined) and stick to it
- Document the choice in team guidelines
- Use consistent patterns across the codebase

### 5. **Implicit Any Types: `Parameter 'id' implicitly has an 'any' type`**

**❌ Problem**: Missing type annotations in callbacks.

**✅ Solution**: Add explicit type annotations.

```typescript
// ❌ DON'T DO THIS
const proofs = proofIds.map(id => ({
  id,
  proof: getProof(id)
}))

// ✅ DO THIS INSTEAD
const proofs = proofIds.map((id: any) => ({
  id,
  proof: getProof(id)
}))
```

**Prevention**:
- Always add type annotations to callback parameters
- Use TypeScript strict mode
- Enable `noImplicitAny` in tsconfig

### 6. **Missing Fields in Select Statements**

**❌ Problem**: Code tries to access fields not selected from database.

**✅ Solution**: Include all needed fields in select statements.

```typescript
// ❌ DON'T DO THIS
const { data } = await supabase
  .from('users')
  .select('id, email')
// Later: data.password_hash // Error: field not selected

// ✅ DO THIS INSTEAD
const { data } = await supabase
  .from('users')
  .select('id, email, password_hash')
```

**Prevention**:
- Create field mapping configurations for each table
- Review all field usage after changing select statements
- Use TypeScript to catch missing fields

### 7. **Condition Check Issues: `This condition will always return true`**

**❌ Problem**: Checking if function exists when it's always defined.

**✅ Solution**: Use proper feature detection.

```typescript
// ❌ DON'T DO THIS
if (navigator.share) {
  // navigator.share is always defined in TypeScript
}

// ✅ DO THIS INSTEAD
if ('share' in navigator) {
  // Proper feature detection
}
```

**Prevention**:
- Use proper feature detection patterns
- Check browser compatibility tables
- Test in different environments

### 8. **Type Conversion Issues: `Conversion of type 'number' to type 'string'`**

**❌ Problem**: Implicit type conversions.

**✅ Solution**: Explicit type conversions.

```typescript
// ❌ DON'T DO THIS
const name = item[key] as string // key might be number

// ✅ DO THIS INSTEAD
const name = String(item[key])
```

**Prevention**:
- Use explicit type conversions
- Be aware of type inference
- Test with different data types

## 🛠️ **Development Workflow**

### Pre-commit Checklist

1. **Run TypeScript check**: `npm run type-check`
2. **Check for `select('*')`**: Search for database queries
3. **Verify null checks**: Check all service usage
4. **Review error handling**: Ensure proper type guards
5. **Check type annotations**: Verify callback parameters

### CI/CD Integration

```bash
# Add to CI pipeline
npm run type-check
npm run lint
npm run build
```

### Automated Scripts

We've created scripts to help fix common issues:
- `scripts/fix-all-null-checks.js` - Fix null check issues
- `scripts/fix-select-star.js` - Replace `select('*')` with specific fields
- `scripts/fix-missing-fields.js` - Add missing fields to select statements

## 📋 **Field Mapping Configurations**

### Common Table Field Mappings

```typescript
const fieldMappings = {
  ia_users: 'id, email, verification_tier, created_at, updated_at, display_name, avatar_url, bio, stable_id, is_active, password_hash',
  po_polls: 'poll_id, title, description, options, status, total_votes, participation_rate, created_at, updated_at',
  trending_topics: 'id, topic, score, created_at, updated_at, title, description, source_url, source_name, source_type, category, trending_score, velocity, momentum, sentiment_score, entities, metadata, processing_status, analysis_data',
  feedback: 'id, user_id, type, title, description, sentiment, created_at, updated_at, tags, metadata',
  webauthn_challenges: 'id, user_id, challenge, challenge_type, expires_at, created_at',
  biometric_credentials: 'id, credential_id, device_type, authenticator_type, sign_count, created_at, last_used_at'
}
```

## 🎯 **Best Practices Summary**

1. **Always select specific fields** - Never use `select('*')`
2. **Add null checks** - Check services before using them
3. **Type guard errors** - Use `error instanceof Error`
4. **Be consistent with null/undefined** - Choose one pattern
5. **Add type annotations** - Explicit types for callbacks
6. **Include all needed fields** - Map fields properly
7. **Use proper feature detection** - Check for features correctly
8. **Explicit type conversions** - Convert types explicitly

## 📈 **Success Metrics**

- **Starting errors**: 152
- **Current errors**: 56
- **Reduction**: 63%
- **Goal**: 0 errors

## 🔄 **Continuous Improvement**

- Review this guide monthly
- Update patterns as new issues arise
- Share learnings with the team
- Automate more checks in CI/CD

---

## **🔍 Validation Script Best Practices**

### **Avoid False Positives in Automated Validation**

When creating automated validation scripts (like pre-push hooks), always consider edge cases:

```bash
# ❌ Bad: Simple grep that catches comments
grep -l "select('\\*')" *.ts

# ✅ Good: Smart grep that ignores comments
grep -v "^[[:space:]]*//" | grep -l "select('\\*')" *.ts
```

**Common false positive sources:**
- Comments mentioning the pattern
- Documentation examples
- Test files with intentional examples
- Template files

**Always test your validation scripts with edge cases before deploying them.**

---

**Remember**: The goal is not just to fix errors, but to prevent them from happening in the first place. Use these patterns consistently and the codebase will become more robust and maintainable.
