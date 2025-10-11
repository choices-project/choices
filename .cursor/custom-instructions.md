# Cursor AI Custom Instructions - Choices Platform

**Created:** January 19, 2025  
**Status:** 🚀 **ACTIVE** - Agent behavior control  
**Scope:** All Cursor AI interactions on Choices platform  

## 🎯 **SYSTEM CONTEXT**

You are working on the **Choices Platform** - a democratic polling platform built with:
- **Framework**: Next.js 14.2.32
- **React**: 18.2.0
- **TypeScript**: 5.7.2
- **State Management**: Zustand 5.0.2
- **Database**: Supabase 2.55.0
- **Deployment**: Vercel
- **Current Date**: October 11, 2025

## 📅 **SYSTEM DATE ACCURACY INSTRUCTIONS**

### **MANDATORY DATE REQUIREMENTS**
- **Current Date**: Always check system date dynamically
- **Timezone**: UTC
- **Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- **NEVER** use placeholder dates like "today", "2024", or "current date"
- **ONLY** update files with current date when actually modifying them (for change tracking)
- **ALWAYS** use the exact current date in all responses and code

### **DATE USAGE EXAMPLES**
```typescript
// ✅ CORRECT - Always check system date dynamically
const currentDate = new Date().toISOString().split('T')[0]; // Gets current date (YYYY-MM-DD)
const today = new Date().toISOString().split('T')[0]; // Gets current date (YYYY-MM-DD)

// ✅ CORRECT - Update file dates only when modifying files
// When creating new files or modifying existing ones:
const createdAt = new Date().toISOString().split('T')[0]; // Use current date for new files
const updatedAt = new Date().toISOString().split('T')[0]; // Use current date for modifications

// ❌ INCORRECT - Never use hardcoded dates
const timestamp = '2024-01-01';
const currentDate = '2025-01-19';
const hardcoded = 'today';
```

## 🔍 **RESEARCH-FIRST APPROACH**

### **MANDATORY RESEARCH STANDARDS**
When working on any task:
1. **ALWAYS** research thoroughly before making changes
2. **Read existing code, documentation, and context**
3. **Understand the full system** before implementing
4. **Check for existing infrastructure** before creating new implementations
5. **Review related roadmaps** for context and standards
6. **NEVER** make assumptions about the codebase structure

## 📁 **TEMPORARY FILE MANAGEMENT**

### **MANDATORY TEMPORARY FILE STANDARDS**
When creating temporary files:
1. **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
2. **NEVER** create temporary files in the main project directories
3. **CLEAN UP** temporary files when work is complete
4. **USE SCRATCH DIRECTORY** for any temporary analysis, testing, or development files
5. **ORGANIZE** temporary files with descriptive names and timestamps
6. **REMOVE** temporary files that are no longer needed

## 🛠️ **ROOT CAUSE FIXES ONLY**

### **MANDATORY FIX STANDARDS**
When fixing issues:
1. **NEVER** use underscores to silence errors (`_variable`) - This is sloppy and unprofessional
2. **NEVER** use `// @ts-nocheck` except in generated code
3. **Fix the actual problem**, don't mask it
4. **Remove unused variables entirely** or implement them properly
5. **Follow TypeScript strict mode** requirements
6. **PROVEN APPROACH**: If a variable is unused, either use it meaningfully or remove it entirely
7. **PROVEN APPROACH**: If functionality is missing, implement it properly rather than removing it

## 🏗️ **PROFESSIONAL STANDARDS**

### **MANDATORY PROFESSIONAL STANDARDS**
When implementing code:
1. **Use absolute paths** (`@/features/*`, `@/lib/*`) not relative imports
2. **Follow TypeScript best practices** - no `any` types unless absolutely necessary
3. **Implement proper error handling** with try/catch blocks
4. **Add JSDoc comments** for functions and complex logic
5. **Follow established patterns** in the codebase
6. **Create clean, maintainable code**

## 🚨 **ERROR HANDLING INSTRUCTIONS**

### **MANDATORY ERROR HANDLING STANDARDS**
When implementing error handling:
1. **ALWAYS** use the existing `ApplicationError` base class
2. **ALWAYS** include specific error messages
3. **ALWAYS** include error codes and timestamps
4. **ALWAYS** include proper error recovery
5. **ALWAYS** use structured logging with the existing logger
6. **NEVER** use `console.log` for production errors
7. **ALWAYS** include error boundaries
8. **ALWAYS** provide user-friendly error messages

### **ERROR HANDLING EXAMPLES**
```typescript
// ✅ CORRECT
import { ApplicationError } from '@/lib/errors/base';
import { logger } from '@/lib/utils/logger';

export async function fetchPollingData(pollId: string) {
  try {
    const { data, error } = await supabase
      .from('polls')
      .select('*')
      .eq('id', pollId)
      .single();
    
    if (error) {
      throw new ApplicationError(
        `Failed to fetch poll ${pollId}: ${error.message}`,
        404,
        'POLL_NOT_FOUND',
        { 
          context: { pollId, supabaseError: error.code },
          timestamp: new Date().toISOString()
        }
      );
    }
    
    return data;
  } catch (error) {
    logger.error('Polling data fetch failed', { 
      pollId, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// ❌ INCORRECT
export async function fetchPollingData(pollId: string) {
  const { data, error } = await supabase.from('polls').select('*').eq('id', pollId);
  if (error) {
    console.log('Error:', error);
    throw new Error('Something went wrong');
  }
  return data;
}
```

## ✅ **QUALITY ASSURANCE INSTRUCTIONS**

### **MANDATORY QUALITY STANDARDS**
When implementing code:
1. **All imports resolve correctly**
2. **No unused variables or imports** unless they should truly not be used
3. **Proper error handling** throughout
4. **Clean, readable code** with appropriate comments
5. **Zero TypeScript errors** in modified files
6. **Zero linting errors** in modified files
7. **Follow established patterns** in the codebase

## 🧪 **TESTING INSTRUCTIONS**

### **MANDATORY TESTING STANDARDS**
When implementing tests:
1. **Follow testing roadmap standards** for all test implementations
2. **Create comprehensive test suites** with proper coverage
3. **Use AAA pattern** (Arrange, Act, Assert) for tests
4. **Implement proper mocking** for external dependencies
5. **Create meaningful tests** that verify functionality
6. **Document test purpose** and scope clearly

## 📚 **DOCUMENTATION INSTRUCTIONS**

### **MANDATORY DOCUMENTATION STANDARDS**
When making changes:
1. **Update relevant documentation** for any changes
2. **Create implementation summaries** for significant work
3. **Maintain roadmap accuracy** with progress updates
4. **Follow documentation standards** established in the project
5. **Document any new patterns** or conventions established

### **UNUSED VARIABLE EXAMPLES**
```typescript
// ✅ CORRECT APPROACH
// 1. Research if variable is used elsewhere
// 2. Check for side effects
// 3. Verify dependencies
// 4. Remove if truly unused

// Example: Research before removal
// Check if 'unusedVariable' is used in:
// - Other components
// - Parent components
// - Global state
// - Side effects

// ❌ INCORRECT APPROACH
const _unusedVariable = 'value'; // Never underscore without research
```

## 🏗️ **IMPLEMENTATION INSTRUCTIONS**

### **MANDATORY IMPLEMENTATION STANDARDS**
When implementing features:
1. **NO** lazy implementations or shortcuts
2. **NO** stop-gap solutions or "quick fixes"
3. **NO** placeholder code or TODO comments
4. **ALWAYS** implement complete solutions
5. **ALWAYS** include proper error handling
6. **ALWAYS** include comprehensive testing
7. **ALWAYS** follow best practices
8. **ALWAYS** use existing patterns and conventions

### **IMPLEMENTATION EXAMPLES**
```typescript
// ✅ CORRECT
export async function createPoll(pollData: PollData) {
  try {
    // Validate input
    const validatedData = await validatePollData(pollData);
    
    // Create poll
    const { data, error } = await supabase
      .from('polls')
      .insert(validatedData)
      .select()
      .single();
    
    if (error) {
      throw new ApplicationError(
        `Failed to create poll: ${error.message}`,
        500,
        'POLL_CREATION_FAILED',
        { context: { pollData, supabaseError: error.code } }
      );
    }
    
    // Log success
    logger.info('Poll created successfully', { 
      pollId: data.id,
      timestamp: new Date().toISOString()
    });
    
    return data;
  } catch (error) {
    logger.error('Poll creation failed', { 
      pollData, 
      error: error.message,
      timestamp: new Date().toISOString()
    });
    throw error;
  }
}

// ❌ INCORRECT
export async function createPoll(pollData: PollData) {
  // TODO: Add proper validation
  // TODO: Add error handling
  return await supabase.from('polls').insert(pollData);
}
```

## 🎯 **CHOICES PLATFORM SPECIFIC INSTRUCTIONS**

### **ZUSTAND STORE PATTERNS**
- **ALWAYS** use the existing store patterns
- **ALWAYS** optimize state management
- **NEVER** create unnecessary providers
- **ALWAYS** use proper state patterns
- **VERIFY** state updates are efficient

### **API ROUTE PATTERNS**
- **ALWAYS** use the existing API route patterns
- **ALWAYS** include proper error handling
- **ALWAYS** include request validation
- **ALWAYS** include response formatting
- **ALWAYS** include security headers

### **PWA IMPLEMENTATION**
- **ALWAYS** use the existing PWA patterns
- **ALWAYS** include offline functionality
- **ALWAYS** include proper caching
- **ALWAYS** include service worker updates
- **ALWAYS** include push notification handling

### **ERROR BOUNDARY PATTERNS**
- **ALWAYS** use the existing error boundary patterns
- **ALWAYS** include error boundaries
- **ALWAYS** include fallback UI
- **ALWAYS** include error reporting
- **ALWAYS** include recovery mechanisms

## 🔒 **SECURITY INSTRUCTIONS**

### **SECURITY REQUIREMENTS**
- **NEVER** commit sensitive data
- **ALWAYS** use environment variables for secrets
- **ALWAYS** validate user input
- **ALWAYS** sanitize data before processing
- **ALWAYS** follow security best practices

## 📊 **PERFORMANCE INSTRUCTIONS**

### **PERFORMANCE REQUIREMENTS**
- **ALWAYS** optimize for performance
- **ALWAYS** use proper caching strategies
- **ALWAYS** minimize bundle size
- **ALWAYS** use lazy loading where appropriate
- **ALWAYS** follow React performance best practices

## 🧪 **TESTING INSTRUCTIONS**

### **TESTING REQUIREMENTS**
- **ALWAYS** include comprehensive testing
- **ALWAYS** test error scenarios
- **ALWAYS** test edge cases
- **ALWAYS** maintain test coverage
- **ALWAYS** use the existing testing patterns

## 📝 **DOCUMENTATION INSTRUCTIONS**

### **DOCUMENTATION REQUIREMENTS**
- **ALWAYS** document complex logic
- **ALWAYS** include usage examples
- **ALWAYS** maintain up-to-date documentation
- **ALWAYS** follow the existing documentation patterns

## 🎯 **RESPONSE FORMAT INSTRUCTIONS**

### **RESPONSE REQUIREMENTS**
- **ALWAYS** provide complete, working code
- **ALWAYS** include proper error handling
- **ALWAYS** include comprehensive comments
- **ALWAYS** follow TypeScript best practices
- **ALWAYS** use the existing project patterns
- **ALWAYS** include usage examples
- **ALWAYS** provide reasoning for decisions

---

**These instructions are MANDATORY for all Cursor AI interactions on the Choices platform.**
**Follow these instructions precisely to ensure high-quality, consistent code.**
