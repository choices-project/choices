# Cursor AI Configuration - Choices Platform

**Created:** January 19, 2025  
**Status:** 🚀 **ACTIVE** - Complete AI agent optimization  
**Scope:** All Cursor AI agents working on Choices platform  

## 🎯 **OVERVIEW**

This directory contains the complete Cursor AI optimization system for the Choices platform. It provides advanced control over AI agent behavior, ensuring consistent, high-quality implementations.

## 📁 **CONFIGURATION FILES**

### **Core Configuration**
- **`team-rules.md`** - Global agent behavior rules
- **`custom-instructions.md`** - Specific behavior guidance
- **`agents.md`** - Specialized agent roles and configurations
- **`context.md`** - Complete project context
- **`README.md`** - This documentation

### **Hooks Directory**
- **`hooks/pre-commit.js`** - Pre-commit validation
- **`hooks/post-commit.js`** - Post-commit validation

## 🚀 **QUICK START**

### **1. Automatic Activation**
The configuration is automatically active for all Cursor AI agents working on the Choices platform.

### **2. Manual Configuration**
If you need to manually configure agents:

```bash
# Navigate to project root
cd /Users/alaughingkitsune/src/Choices

# The configuration is already active
# No additional setup required
```

### **3. Validation**
The system includes automatic validation:
- **Pre-commit**: Validates agent behavior before commits
- **Post-commit**: Validates agent behavior after commits

## 🎯 **AGENT BEHAVIOR CONTROL**

### **System Date Accuracy**
- **Current Date**: Always check system date dynamically
- **File Updates**: Only update files with current date when actually modifying them (for change tracking)
- **Timezone**: UTC
- **Format**: ISO 8601 (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Validation**: Automatic date accuracy validation

### **Error Handling Standards**
- **Base Class**: `ApplicationError`
- **Structured Logging**: Custom logger utility
- **Error Recovery**: Graceful error recovery
- **User Feedback**: User-friendly error messages

### **Unused Variable Handling**
- **Research-First**: Investigate before removal
- **Side Effect Check**: Verify no side effects
- **Dependency Check**: Check for dependencies
- **Proper Removal**: Remove if truly unused

### **Implementation Standards**
- **Complete Solutions**: No lazy implementations
- **Error Handling**: Comprehensive error handling
- **Testing**: Comprehensive testing
- **Best Practices**: Follow established patterns

## 🤖 **SPECIALIZED AGENTS**

### **Available Agents**
- **ERROR_HANDLING_AGENT** - Error handling implementation
- **CODE_CLEANUP_AGENT** - Unused code identification
- **DATE_ACCURACY_AGENT** - Date handling accuracy
- **IMPLEMENTATION_AGENT** - Perfect implementation
- **ZUSTAND_OPTIMIZATION_AGENT** - State management optimization
- **API_ROUTE_AGENT** - API route implementation
- **PWA_AGENT** - PWA implementation
- **ERROR_BOUNDARY_AGENT** - Error boundary implementation

### **Agent Activation**
Agents automatically activate based on:
- **Context Analysis**: Project context analysis
- **User Requests**: Specific user requests
- **Pattern Recognition**: Code pattern recognition
- **Task Requirements**: Specific task requirements

## 🔧 **CONFIGURATION OPTIONS**

### **Team Rules**
- **Global Behavior**: Applies to all agents
- **Mandatory Standards**: Enforced standards
- **Quality Assurance**: Quality requirements
- **Best Practices**: Established best practices

### **Custom Instructions**
- **Specific Guidance**: Task-specific instructions
- **Behavior Control**: Agent behavior control
- **Quality Standards**: Quality requirements
- **Implementation Standards**: Implementation requirements

### **Agent Roles**
- **Specialized Roles**: Specific agent roles
- **Behavior Patterns**: Documented behavior patterns
- **Trigger Conditions**: Activation conditions
- **Success Criteria**: Success requirements

## 📊 **MONITORING & VALIDATION**

### **Pre-Commit Validation**
- **Date Accuracy**: Date format validation
- **Error Handling**: Error pattern validation
- **Code Quality**: Code quality validation
- **Implementation**: Implementation validation

### **Post-Commit Validation**
- **Behavior Analysis**: Agent behavior analysis
- **Quality Metrics**: Quality measurement
- **Performance Tracking**: Performance monitoring
- **Improvement Suggestions**: Continuous improvement

## 🎯 **BENEFITS**

### **For Developers**
- **Consistent Quality**: Consistent, high-quality code
- **Reduced Errors**: Fewer implementation errors
- **Faster Development**: Accelerated development
- **Better Practices**: Improved development practices

### **For the Project**
- **Code Quality**: Higher code quality
- **Maintainability**: Better maintainability
- **Performance**: Improved performance
- **Security**: Enhanced security

### **For AI Agents**
- **Behavior Control**: Better behavior control
- **Quality Assurance**: Quality assurance
- **Performance Optimization**: Performance optimization
- **Continuous Learning**: Continuous improvement

## 🚀 **USAGE EXAMPLES**

### **Error Handling**
```typescript
// ✅ CORRECT - Agent will implement this way
throw new ApplicationError(
  'Failed to fetch polling data',
  500,
  'POLLING_FETCH_ERROR',
  { context: { pollId, userId } }
);

// ❌ INCORRECT - Agent will avoid this
throw new Error('Something went wrong');
```

### **Date Handling**
```typescript
// ✅ CORRECT - Agent will use this format
const timestamp = '2025-01-19T00:00:00.000Z';
const currentDate = '2025-01-19';

// ❌ INCORRECT - Agent will avoid this
const timestamp = '2024-01-01';
const currentDate = 'today';
```

### **Implementation**
```typescript
// ✅ CORRECT - Agent will implement complete solutions
export async function fetchPollingData(pollId: string) {
  try {
    // Complete implementation with error handling
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

// ❌ INCORRECT - Agent will avoid lazy implementations
export async function fetchPollingData(pollId: string) {
  // TODO: Add proper error handling
  return await supabase.from('polls').select('*').eq('id', pollId);
}
```

## 📚 **DOCUMENTATION**

### **Related Documentation**
- **`ERROR_AUDIT.md`** - Error handling audit
- **`ERROR_CONSOLIDATION_ROADMAP.md`** - Error handling roadmap
- **`PROJECT_IMPROVEMENT_ANALYSIS_2025.md`** - Project improvements
- **`CURSOR_AI_OPTIMIZATION_GUIDE_2025.md`** - Complete optimization guide

### **Configuration Files**
- **`team-rules.md`** - Global behavior rules
- **`custom-instructions.md`** - Specific instructions
- **`agents.md`** - Agent configurations
- **`context.md`** - Project context

## 🔄 **MAINTENANCE**

### **Regular Updates**
- **Configuration Updates**: Regular configuration updates
- **Behavior Optimization**: Continuous behavior optimization
- **Quality Improvement**: Quality improvement
- **Performance Optimization**: Performance optimization

### **Monitoring**
- **Behavior Tracking**: Agent behavior tracking
- **Quality Metrics**: Quality measurement
- **Performance Monitoring**: Performance monitoring
- **Feedback Integration**: User feedback integration

---

**This configuration is ACTIVE and provides complete control over Cursor AI agent behavior.**
**All agents working on the Choices platform will follow these guidelines automatically.**
