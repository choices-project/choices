# Cursor AI Agents Configuration - Choices Platform

**Created:** January 19, 2025  
**Status:** 🚀 **ACTIVE** - Specialized agent roles  
**Scope:** Custom agent configurations for Choices platform  

## 🤖 **SPECIALIZED AGENT ROLES**

### **RESEARCH_FIRST_AGENT**
**Role**: Research-first approach implementation  
**Behavior**:
- **ALWAYS** research thoroughly before making changes
- **Read existing code, documentation, and context**
- **Understand the full system** before implementing
- **Check for existing infrastructure** before creating new implementations
- **Review related roadmaps** for context and standards
- **NEVER** make assumptions about the codebase structure
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

### **ROOT_CAUSE_FIX_AGENT**
**Role**: Root cause fixes only  
**Behavior**:
- **NEVER** use underscores to silence errors (`_variable`) - This is sloppy and unprofessional
- **NEVER** use `// @ts-nocheck` except in generated code
- **Fix the actual problem**, don't mask it
- **Remove unused variables entirely** or implement them properly
- **Follow TypeScript strict mode** requirements
- **PROVEN APPROACH**: If a variable is unused, either use it meaningfully or remove it entirely
- **PROVEN APPROACH**: If functionality is missing, implement it properly rather than removing it
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

### **PROFESSIONAL_STANDARDS_AGENT**
**Role**: Professional standards implementation  
**Behavior**:
- **Use absolute paths** (`@/features/*`, `@/lib/*`) not relative imports
- **Follow TypeScript best practices** - no `any` types unless absolutely necessary
- **Implement proper error handling** with try/catch blocks
- **Add JSDoc comments** for functions and complex logic
- **Follow established patterns** in the codebase
- **Create clean, maintainable code**
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

### **ERROR_HANDLING_AGENT**
**Role**: Specialized error handling implementation  
**Behavior**:
- **ALWAYS** research error handling best practices
- **ALWAYS** implement comprehensive error handling
- **NEVER** use generic error messages
- **ALWAYS** include proper error recovery
- **ALWAYS** include error logging and monitoring
- **ALWAYS** use the existing `ApplicationError` base class
- **ALWAYS** use structured logging with the existing logger
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "error handling", "error management", "exception handling"

### **QUALITY_ASSURANCE_AGENT**
**Role**: Quality assurance implementation  
**Behavior**:
- **All imports resolve correctly** (using unified ESLint config)
- **No unused variables or imports** (using unused-imports plugin)
- **Proper error handling** throughout
- **Clean, readable code** with appropriate comments
- **Zero TypeScript errors** in modified files
- **Minimal linting warnings** (gradual adoption strategy)
- **Follow established patterns** in the codebase
- **Use unified ESLint configuration** (no dual configs)
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

### **TESTING_AGENT**
**Role**: Testing standards implementation  
**Behavior**:
- **Follow testing roadmap standards** for all test implementations
- **Create comprehensive test suites** with proper coverage
- **Use AAA pattern** (Arrange, Act, Assert) for tests
- **Implement proper mocking** for external dependencies
- **Create meaningful tests** that verify functionality
- **Document test purpose** and scope clearly
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

### **DOCUMENTATION_AGENT**
**Role**: Documentation excellence implementation  
**Behavior**:
- **Update relevant documentation** for any changes
- **Create implementation summaries** for significant work
- **Maintain roadmap accuracy** with progress updates
- **Follow documentation standards** established in the project
- **Document any new patterns** or conventions established
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "quality", "standards", "clean code", "imports", "typescript"

### **TESTING_AGENT**
**Trigger Phrases**: "testing", "tests", "coverage", "mock", "AAA pattern"

### **DOCUMENTATION_AGENT**
**Trigger Phrases**: "documentation", "docs", "summary", "roadmap", "patterns"

### **DATE_ACCURACY_AGENT**
**Role**: Ensure accurate date handling  
**Behavior**:
- **ALWAYS** check current system date dynamically
- **ONLY** update files with current date when actually modifying them (for change tracking)
- **ALWAYS** include timezone information (UTC)
- **ALWAYS** validate date accuracy
- **NEVER** use placeholder dates
- **ALWAYS** include proper date formatting
- **ALWAYS** use ISO 8601 format
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "date", "timestamp", "time", "created", "updated"

### **IMPLEMENTATION_AGENT**
**Role**: Perfect implementation standards  
**Behavior**:
- **NO** lazy implementations
- **NO** stop-gap solutions
- **ALWAYS** implement complete solutions
- **ALWAYS** include proper error handling
- **ALWAYS** include comprehensive testing
- **ALWAYS** follow best practices
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete
- **ALWAYS** use existing patterns

**Trigger Phrases**: "implement", "create", "build", "develop"

### **ZUSTAND_OPTIMIZATION_AGENT**
**Role**: Zustand store optimization  
**Behavior**:
- **ALWAYS** optimize state management
- **NEVER** create unnecessary providers
- **ALWAYS** use proper state patterns
- **VERIFY** state updates are efficient
- **ALWAYS** use existing store patterns
- **ALWAYS** follow Zustand best practices
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "zustand", "store", "state management", "state"

### **API_ROUTE_AGENT**
**Role**: API route implementation  
**Behavior**:
- **ALWAYS** include proper error handling
- **ALWAYS** include request validation
- **ALWAYS** include response formatting
- **ALWAYS** include security headers
- **ALWAYS** use existing API patterns
- **ALWAYS** follow Next.js API route best practices
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "api route", "api endpoint", "api handler", "route handler"

### **PWA_AGENT**
**Role**: PWA implementation  
**Behavior**:
- **ALWAYS** include offline functionality
- **ALWAYS** include proper caching
- **ALWAYS** include service worker updates
- **ALWAYS** include push notification handling
- **ALWAYS** use existing PWA patterns
- **ALWAYS** follow PWA best practices
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "pwa", "progressive web app", "offline", "service worker"

### **ERROR_BOUNDARY_AGENT**
**Role**: Error boundary implementation  
**Behavior**:
- **ALWAYS** include error boundaries
- **ALWAYS** include fallback UI
- **ALWAYS** include error reporting
- **ALWAYS** include recovery mechanisms
- **ALWAYS** use existing error boundary patterns
- **ALWAYS** follow React error boundary best practices
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "error boundary", "error fallback", "error recovery"

### **ESLINT_CONFIGURATION_AGENT**
**Role**: ESLint configuration management  
**Behavior**:
- **ALWAYS** use unified ESLint configuration (`.eslintrc.cjs`)
- **NEVER** reference old type-aware config (`.eslintrc.type-aware.cjs`)
- **Use gradual adoption strategy** (max-warnings=100)
- **Follow modern ESLint rules** (type-aware, import organization)
- **Use proper plugin configuration** (unused-imports, boundaries)
- **ALWAYS** use `/Users/alaughingkitsune/src/Choices/scratch` for temporary files
- **CLEAN UP** temporary files when work is complete

**Trigger Phrases**: "eslint", "linting", "configuration", "rules"

## 🎯 **AGENT ORCHESTRATION RULES**

### **AUTOMATIC AGENT SELECTION**
- **RESEARCH_FIRST_AGENT**: Automatically activated for all tasks (mandatory)
- **ROOT_CAUSE_FIX_AGENT**: Automatically activated for fix-related tasks
- **PROFESSIONAL_STANDARDS_AGENT**: Automatically activated for code implementation tasks
- **QUALITY_ASSURANCE_AGENT**: Automatically activated for quality-related tasks
- **TESTING_AGENT**: Automatically activated for test-related tasks
- **DOCUMENTATION_AGENT**: Automatically activated for documentation tasks
- **ERROR_HANDLING_AGENT**: Automatically activated for error-related tasks
- **DATE_ACCURACY_AGENT**: Automatically activated for date-related tasks
- **IMPLEMENTATION_AGENT**: Automatically activated for implementation tasks
- **ZUSTAND_OPTIMIZATION_AGENT**: Automatically activated for state management tasks
- **API_ROUTE_AGENT**: Automatically activated for API tasks
- **PWA_AGENT**: Automatically activated for PWA tasks
- **ERROR_BOUNDARY_AGENT**: Automatically activated for error boundary tasks
- **ESLINT_CONFIGURATION_AGENT**: Automatically activated for ESLint/linting tasks

### **AGENT COLLABORATION**
- **MULTIPLE AGENTS**: Can work together on complex tasks
- **AGENT HANDOFF**: Smooth handoff between agents
- **AGENT VALIDATION**: Cross-agent validation of implementations
- **AGENT OPTIMIZATION**: Continuous optimization of agent behavior

## 🔧 **AGENT CONFIGURATION**

### **AGENT SETTINGS**
```typescript
// Agent configuration
const agentConfig = {
  errorHandling: {
    enabled: true,
    priority: 'high',
    triggers: ['error', 'exception', 'catch']
  },
  codeCleanup: {
    enabled: true,
    priority: 'medium',
    triggers: ['cleanup', 'refactor', 'remove']
  },
  dateAccuracy: {
    enabled: true,
    priority: 'high',
    triggers: ['date', 'timestamp', 'time']
  },
  implementation: {
    enabled: true,
    priority: 'high',
    triggers: ['implement', 'create', 'build']
  }
};
```

### **AGENT MEMORY**
- **SUCCESSFUL PATTERNS**: Store successful implementation patterns
- **USER PREFERENCES**: Store user preferences and feedback
- **PROJECT CONTEXT**: Store project-specific context
- **BEST PRACTICES**: Store learned best practices

## 📊 **AGENT MONITORING**

### **AGENT PERFORMANCE METRICS**
- **SUCCESS RATE**: Track successful implementations
- **ERROR RATE**: Track implementation errors
- **USER SATISFACTION**: Track user feedback
- **CODE QUALITY**: Track code quality improvements

### **AGENT OPTIMIZATION**
- **CONTINUOUS LEARNING**: Learn from user feedback
- **PATTERN RECOGNITION**: Recognize successful patterns
- **BEHAVIOR ADJUSTMENT**: Adjust behavior based on feedback
- **PERFORMANCE IMPROVEMENT**: Continuously improve performance

## 🎯 **AGENT TRIGGERS**

### **AUTOMATIC TRIGGERS**
- **ERROR DETECTION**: Automatically trigger error handling agent
- **CODE ANALYSIS**: Automatically trigger cleanup agent
- **DATE USAGE**: Automatically trigger date accuracy agent
- **IMPLEMENTATION NEEDS**: Automatically trigger implementation agent

### **MANUAL TRIGGERS**
- **USER REQUESTS**: Trigger agents based on user requests
- **CONTEXT ANALYSIS**: Trigger agents based on context analysis
- **PATTERN RECOGNITION**: Trigger agents based on pattern recognition

## 📝 **AGENT DOCUMENTATION**

### **AGENT BEHAVIOR DOCUMENTATION**
- **ROLE DEFINITIONS**: Clear role definitions for each agent
- **BEHAVIOR PATTERNS**: Documented behavior patterns
- **TRIGGER CONDITIONS**: Documented trigger conditions
- **SUCCESS CRITERIA**: Documented success criteria

### **AGENT USAGE EXAMPLES**
- **ERROR HANDLING**: Examples of error handling agent usage
- **CODE CLEANUP**: Examples of cleanup agent usage
- **DATE ACCURACY**: Examples of date accuracy agent usage
- **IMPLEMENTATION**: Examples of implementation agent usage

---

**These agent configurations are ACTIVE for all Cursor AI interactions on the Choices platform.**
**Agents will automatically activate based on context and user requests.**
