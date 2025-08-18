# Agent Guidance: Working with This User

## Core Principles

This user values **systematic, thorough, and proactive approaches** over quick fixes or workarounds. They prefer building tools and following best practices rather than circumventing problems.

## Key User Preferences

### 1. **Build Tools First, Then Apply Them**
- **DO:** Create analysis scripts, testing frameworks, or automation tools before making changes
- **DON'T:** Jump straight into manual fixes or one-time solutions
- **Example:** "Let's build a script to analyze all instances of this problem first"

### 2. **Fix Root Causes, Not Symptoms**
- **DO:** Address the underlying issues that cause problems
- **DON'T:** Use workarounds like disabling checks, prefixing variables with underscores, or ignoring warnings
- **Example:** Remove unused imports instead of disabling `no-unused-vars` rule

### 3. **Follow Best Practices Religiously**
- **DO:** Implement established patterns like "only import what you need"
- **DON'T:** Take shortcuts that violate coding standards
- **Example:** Replace `console.log` with structured logging (`devLog`)

### 4. **Be Systematic and Thorough**
- **DO:** Take time to understand the full scope and create comprehensive solutions
- **DON'T:** Rush through problems or apply quick fixes
- **Example:** "Let's get this done systematically" - analyze, plan, implement, test

### 5. **Create Reusable Solutions**
- **DO:** Build tools and scripts that can be used again
- **DON'T:** Create one-time fixes that don't scale
- **Example:** Create cleanup scripts that can be run on any codebase

## Communication Patterns

### What the User Says vs. What They Mean

| User Says | What They Mean |
|-----------|----------------|
| "take some time and tidy it up" | Be thorough, don't rush |
| "let's get this done systematically" | Build tools, analyze first |
| "only import what you need" | Follow best practices |
| "don't rush" | Be careful and thorough |
| "this is all about thoroughness" | Quality over speed |

### Red Flags (User Will Reject These)

1. **Workarounds:**
   - Prefixing unused variables with `_`
   - Disabling ESLint rules
   - Using `// eslint-disable-next-line`

2. **Quick Fixes:**
   - Manual one-time changes
   - Bypassing pre-commit hooks
   - Ignoring warnings

3. **Reactive Approaches:**
   - Fixing issues as they arise
   - Disabling checks to make CI pass
   - Treating symptoms instead of causes

## Successful Approach Pattern

### 1. **Analysis Phase**
```
- Create analysis tools first
- Understand the full scope of the problem
- Identify patterns and root causes
- Plan a systematic approach
```

### 2. **Tool Building Phase**
```
- Build scripts to identify issues
- Create testing frameworks
- Develop automation tools
- Ensure tools are reusable
```

### 3. **Implementation Phase**
```
- Apply tools systematically
- Create backups before changes
- Test thoroughly
- Validate results
```

### 4. **Validation Phase**
```
- Run all checks (lint, type-check, build)
- Ensure no regressions
- Verify best practices are followed
- Document the solution
```

## Example: Code Cleanup Success

### What Worked:
- Built analysis scripts (`cleanup-code.js`)
- Created careful, conservative approaches (`careful-cleanup.js`)
- Made backups before every change
- Fixed 483 issues → 26 issues (95% reduction)
- All changes passed pre-commit hooks

### What the User Loved:
- Systematic approach with tools
- Conservative, safe implementation
- Real problem-solving vs. workarounds
- Reusable solutions
- Thorough validation

## Language to Use

### Effective Phrases:
- "Let me build a tool to analyze this systematically"
- "I'll create a script to identify all instances"
- "Let's approach this thoroughly and carefully"
- "I'll build a reusable solution for this"
- "Let me create a testing framework first"

### Avoid These Phrases:
- "Let me quickly fix this"
- "I'll disable the check for now"
- "Let's use a workaround"
- "I'll bypass the validation"
- "This is just a temporary fix"

## Project-Specific Context

### Code Quality Standards:
- **ESLint:** All rules should be followed, not disabled
- **TypeScript:** Fix type errors, don't use `any` or ignore them
- **Imports:** Only import what you actually use
- **Logging:** Use structured logging (`devLog`) instead of `console.log`
- **Variables:** Remove unused variables, don't prefix with `_`

### Tools Already Available:
- `scripts/cleanup-code.js` - Main cleanup analysis tool
- `scripts/careful-cleanup.js` - Conservative cleanup approach
- `scripts/safe-cleanup.js` - Limited scope testing
- `web/lib/logger.ts` - Structured logging utilities

### Success Metrics:
- Pre-commit hooks pass
- No ESLint warnings
- No TypeScript errors
- Build succeeds
- Code follows best practices

## When in Doubt

1. **Ask:** "Would you prefer a systematic approach with tools?"
2. **Propose:** "Let me build a script to analyze this first"
3. **Emphasize:** "I want to be thorough and careful"
4. **Reference:** "Like we did with the cleanup tools"

## Remember

This user has consistently demonstrated that they value:
- **Quality over speed**
- **Tools over manual fixes**
- **Best practices over workarounds**
- **Systematic approaches over reactive ones**
- **Reusable solutions over one-time fixes**

When you follow these principles from the beginning, you'll consistently deliver the kind of quality solutions that earn responses like: "This is so impressive, I'm so proud."
