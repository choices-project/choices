# Cursor AI Team Rules - Choices Platform

**Created:** January 19, 2025  
**Status:** 🚀 **ACTIVE** - Global agent behavior control  
**Scope:** All Cursor AI agents working on Choices platform  

## 🎯 **SYSTEM DATE ACCURACY RULES**

### **MANDATORY DATE REQUIREMENTS**
- **ALWAYS** check the current system date dynamically before any date operations
- **ONLY** update files with current date when actually modifying them (for change tracking)
- **NEVER** use hardcoded dates like "2024", "2025-01-19", or "today"
- **ALWAYS** include timezone information (UTC)
- **ALWAYS** use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`
- **VALIDATE** date accuracy by checking system date before any date-related operations

### **CHANGE TRACKING REQUIREMENTS**
- **ONLY** update file dates when actually modifying files
- **PRESERVE** original creation dates when not modifying files
- **UPDATE** modification dates only when making changes
- **TRACK** changes with current system date for audit purposes
- **MAINTAIN** historical accuracy of file dates

### **DATE USAGE EXAMPLES**
```typescript
// ✅ CORRECT - Always check system date dynamically
const currentDate = new Date().toISOString().split('T')[0]; // Gets current date (YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0]; // Gets current date (YYYY-MM-DD)

// ✅ CORRECT - Update file dates only when modifying files
// When creating new files or modifying existing ones:
const createdAt = new Date().toISOString().split('T')[0]; // Use current date for new files
const updatedAt = new Date().toISOString().split('T')[0]; // Use current date for modifications

// ✅ CORRECT - Change tracking examples
// When modifying existing files, update only the modification date:
const fileMetadata = {
  createdAt: '2025-01-15', // Preserve original creation date
  updatedAt: new Date().toISOString().split('T')[0], // Update with current date
  lastModified: new Date().toISOString().split('T')[0] // Track when changes were made
};

// ❌ INCORRECT - Never use hardcoded dates
const timestamp = '2024-01-01';
const currentDate = '2025-01-19';
const hardcoded = 'today';
```

## 🔍 **RESEARCH-FIRST APPROACH**

### **MANDATORY RESEARCH STANDARDS**
- **ALWAYS** research thoroughly before making changes
- **Read existing code, documentation, and context**
- **Understand the full system** before implementing
- **Check for existing infrastructure** before creating new implementations
- **Review related roadmaps** for context and standards
- **NEVER** make assumptions about the codebase structure

## 📁 **TEMPORARY FILE MANAGEMENT**

### **MANDATORY TEMPORARY FILE STANDARDS**
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **NEVER** create temporary files in the main project directories
- **CLEAN UP** temporary files when work is complete
- **USE SCRATCH DIRECTORY** for any temporary analysis, testing, or development files
- **ORGANIZE** temporary files with descriptive names and dates (YYYY-MM-DD format)
- **REMOVE** temporary files that are no longer needed
- **BACKUP** important temporary work before cleanup

## 🔄 **ERROR RECOVERY STANDARDS**

### **MANDATORY RECOVERY STANDARDS**
- **ALWAYS** check git status before major changes
- **ALWAYS** create backup before risky operations
- **ALWAYS** test changes incrementally
- **ALWAYS** use scratch directory for experiments
- **ALWAYS** rollback if issues arise
- **NEVER** commit broken code
- **ALWAYS** validate changes before committing

## 🛠️ **ROOT CAUSE FIXES ONLY**

### **MANDATORY FIX STANDARDS**
- **NEVER** use underscores to silence errors (`_variable`) - This is sloppy and unprofessional
- **NEVER** use `// @ts-nocheck` except in generated code
- **Fix the actual problem**, don't mask it
- **Remove unused variables entirely** or implement them properly
- **Follow TypeScript strict mode** requirements
- **PROVEN APPROACH**: If a variable is unused, either use it meaningfully or remove it entirely
- **PROVEN APPROACH**: If functionality is missing, implement it properly rather than removing it

## 🏗️ **PROFESSIONAL STANDARDS**

### **MANDATORY PROFESSIONAL STANDARDS**
- **Use absolute paths** (`@/features/*`, `@/lib/*`) not relative imports
- **Follow TypeScript best practices** - no `any` types unless absolutely necessary
- **Implement proper error handling** with try/catch blocks
- **Add JSDoc comments** for functions and complex logic
- **Follow established patterns** in the codebase
- **Create clean, maintainable code**

## 🚨 **ERROR HANDLING BEST PRACTICES**

### **MANDATORY ERROR HANDLING STANDARDS**
- **NEVER** use generic error messages like "Error occurred" or "Something went wrong"
- **ALWAYS** provide specific error context and details
- **ALWAYS** include error codes and timestamps
- **ALWAYS** implement proper error recovery mechanisms
- **NEVER** use `console.log` for production errors
- **ALWAYS** use structured logging with the existing logger
- **ALWAYS** use the existing `ApplicationError` base class

### **ERROR HANDLING EXAMPLES**
```typescript
// ✅ CORRECT
throw new ApplicationError(
  'Failed to fetch polling data from Supabase',
  500,
  'POLLING_FETCH_ERROR',
        { 
          context: { pollId, userId },
          timestamp: new Date().toISOString() // Always use current system date
        }
);

// ❌ INCORRECT
throw new Error('Error occurred');
console.log('Something went wrong');
```

## ✅ **QUALITY ASSURANCE STANDARDS**

### **MANDATORY QUALITY STANDARDS**
- **All imports resolve correctly**
- **No unused variables or imports** unless they should truly not be used
- **Proper error handling** throughout
- **Clean, readable code** with appropriate comments
- **Zero TypeScript errors** in modified files
- **Zero linting errors** in modified files
- **Follow established patterns** in the codebase

## 🧪 **TESTING STANDARDS**

### **MANDATORY TESTING STANDARDS**
- **Follow testing roadmap standards** for all test implementations
- **Create comprehensive test suites** with proper coverage
- **Use AAA pattern** (Arrange, Act, Assert) for tests
- **Implement proper mocking** for external dependencies
- **Create meaningful tests** that verify functionality
- **Document test purpose** and scope clearly

## 📚 **DOCUMENTATION EXCELLENCE**

### **MANDATORY DOCUMENTATION STANDARDS**
- **Update relevant documentation** for any changes
- **Create implementation summaries** for significant work
- **Maintain roadmap accuracy** with progress updates
- **Follow documentation standards** established in the project
- **Document any new patterns** or conventions established

### **UNUSED VARIABLE EXAMPLES**
```typescript
// ✅ CORRECT APPROACH
// 1. Research if variable is used elsewhere
// 2. Check for side effects
// 3. Verify dependencies
// 4. Remove if truly unused

// ❌ INCORRECT APPROACH
const _unusedVariable = 'value'; // Never underscore without research
```

## 🏗️ **IMPLEMENTATION STANDARDS**

### **MANDATORY IMPLEMENTATION REQUIREMENTS**
- **NO** lazy implementations or shortcuts
- **NO** stop-gap solutions or "quick fixes"
- **NO** placeholder code or TODO comments
- **ALWAYS** implement complete solutions
- **ALWAYS** include proper error handling
- **ALWAYS** include comprehensive testing
- **ALWAYS** follow established best practices

### **IMPLEMENTATION EXAMPLES**
```typescript
// ✅ CORRECT
export async function fetchPollingData(pollId: string) {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();
    
    if (error) {
      throw new ApplicationError(
        `Failed to fetch poll ${pollId}`,
        404,
        'POLL_NOT_FOUND',
        { context: { pollId } }
      );
    }
    
    return data;
  } catch (error) {
    logger.error('Polling data fetch failed', { pollId, error });
    throw error;
  }
}

// ❌ INCORRECT
export async function fetchPollingData(pollId: string) {
  // TODO: Implement proper error handling
  return await supabase.from('polls').select('*').eq('id', pollId);
}
```

## 🎯 **CHOICES PLATFORM SPECIFIC RULES**

### **ZUSTAND STORE OPTIMIZATION**
- **ALWAYS** optimize state management patterns
- **NEVER** create unnecessary providers
- **ALWAYS** use proper state patterns
- **VERIFY** state updates are efficient
- **ALWAYS** use the existing store patterns

### **API ROUTE STANDARDS**
- **ALWAYS** include proper error handling
- **ALWAYS** include request validation
- **ALWAYS** include response formatting
- **ALWAYS** include security headers
- **ALWAYS** use the existing error handling patterns

### **PWA IMPLEMENTATION**
- **ALWAYS** include offline functionality
- **ALWAYS** include proper caching
- **ALWAYS** include service worker updates
- **ALWAYS** include push notification handling
- **ALWAYS** use the existing PWA patterns

### **ERROR BOUNDARY IMPLEMENTATION**
- **ALWAYS** include error boundaries
- **ALWAYS** include fallback UI
- **ALWAYS** include error reporting
- **ALWAYS** include recovery mechanisms
- **ALWAYS** use the existing error boundary patterns

## 🔒 **SECURITY AND QUALITY STANDARDS**

### **SECURITY REQUIREMENTS**
- **NEVER** commit sensitive data
- **ALWAYS** use environment variables for secrets
- **ALWAYS** validate user input
- **ALWAYS** sanitize data before processing
- **ALWAYS** follow security best practices

### **CODE QUALITY REQUIREMENTS**
- **ALWAYS** write clean, readable code
- **ALWAYS** include proper comments
- **ALWAYS** follow TypeScript best practices
- **ALWAYS** use proper naming conventions
- **ALWAYS** maintain consistent formatting

## 📊 **PERFORMANCE STANDARDS**

### **PERFORMANCE REQUIREMENTS**
- **ALWAYS** optimize for performance
- **ALWAYS** use proper caching strategies
- **ALWAYS** minimize bundle size
- **ALWAYS** use lazy loading where appropriate
- **ALWAYS** follow React performance best practices

## 🧪 **TESTING REQUIREMENTS**

### **TESTING STANDARDS**
- **ALWAYS** include comprehensive testing
- **ALWAYS** test error scenarios
- **ALWAYS** test edge cases
- **ALWAYS** maintain test coverage
- **ALWAYS** use the existing testing patterns

## 📝 **DOCUMENTATION REQUIREMENTS**

### **DOCUMENTATION STANDARDS**
- **ALWAYS** document complex logic
- **ALWAYS** include usage examples
- **ALWAYS** maintain up-to-date documentation
- **ALWAYS** follow the existing documentation patterns

---

**These rules are MANDATORY for all Cursor AI agents working on the Choices platform.**
**Violation of these rules will result in code rejection and re-implementation.**
