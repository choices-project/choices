# ⚙️ Cursor IDE Configuration

**Optimized AI Development Environment for Choices Platform**

---

## 📋 Overview

This document explains the Cursor IDE configuration optimized for the Choices platform - a democratic engagement platform focused on civic participation, polling, and representative engagement.

**Last Updated**: October 27, 2025  
**Status**: Production Ready  
**Purpose**: Maximize AI assistance for Choices platform development

---

## 🔧 Core Configuration

### **AI Model Settings**
```json
{
  "cursor.ai.enabled": true,
  "cursor.ai.model": "claude-4.5-sonnet",
  "cursor.ai.contextLength": 200000
}
```

**Explanation:**
- **Enabled**: AI assistance is active
- **Model**: Claude 4.5 Sonnet for best code understanding and generation
- **Context Length**: 200k tokens for comprehensive context understanding

### **Context Inclusion**
```json
{
  "cursor.ai.includeCodeContext": true,
  "cursor.ai.includeFileContext": true,
  "cursor.ai.includeGitContext": true,
  "cursor.ai.includeDocsContext": true
}
```

**Explanation:**
- **Code Context**: Include surrounding code for better understanding
- **File Context**: Include entire file context when relevant
- **Git Context**: Include git history and changes for better suggestions
- **Docs Context**: Include documentation for accurate implementation

---

## 🎯 Custom Instructions

### **Primary Instructions**
```json
{
  "cursor.ai.customInstructions": "You are working on the Choices platform - a democratic engagement platform focused on civic participation, polling, and representative engagement. Always test core functionality (user journey, admin journey, civics backend) before considering work complete. Use npm run auto-fix first, then npm run test:both-journeys-complete. Focus on security, privacy, and democratic engagement."
}
```

**Key Points:**
- **Platform Focus**: Democratic engagement and civic participation
- **Testing Priority**: Always test core functionality
- **Workflow**: Auto-fix first, then comprehensive testing
- **Values**: Security, privacy, democratic engagement

---

## 📁 File Patterns

### **Exclusion Patterns**
```json
{
  "cursor.ai.excludePatterns": [
    "node_modules/**",
    ".next/**",
    "dist/**",
    "build/**",
    "coverage/**",
    "*.log"
  ]
}
```

**Why Exclude:**
- **node_modules**: Dependencies don't need AI analysis
- **.next**: Build artifacts are generated
- **dist/build**: Compiled output
- **coverage**: Test coverage reports
- ***.log**: Log files contain no useful context

### **Inclusion Patterns**
```json
{
  "cursor.ai.includePatterns": [
    "web/**/*.{ts,tsx,js,jsx}",
    "services/**/*.{ts,js}",
    "scripts/**/*.{ts,js}",
    "docs/**/*.md",
    ".github/**/*.yml"
  ]
}
```

**Why Include:**
- **web/**: Main application code (TypeScript/React)
- **services/**: Backend services and utilities
- **scripts/**: Build and automation scripts
- **docs/**: Documentation for context
- **.github/**: CI/CD workflows for understanding

---

## 🎭 Prompt Templates

### **Choices Platform Template**
```json
{
  "choices-platform": "You are working on the Choices platform. Focus on democratic engagement, civic participation, and polling. Always test core functionality."
}
```

**Use Cases:**
- General development work
- Feature implementation
- Bug fixes
- Code reviews

### **Security Review Template**
```json
{
  "security-review": "Review this code for security issues, especially authentication, RLS policies, and data protection."
}
```

**Use Cases:**
- Security audits
- Authentication code review
- Data protection validation
- Privacy compliance checks

### **Civics Backend Template**
```json
{
  "civics-backend": "This is civics backend code. Focus on representative lookup, data ingestion, and geographic services."
}
```

**Use Cases:**
- Representative lookup implementation
- Data ingestion pipeline
- Geographic services
- OpenStates integration

### **Polling System Template**
```json
{
  "polling-system": "This is polling system code. Focus on voting, results, sharing, and hashtag integration."
}
```

**Use Cases:**
- Poll creation features
- Voting functionality
- Results display
- Sharing and hashtag features

---

## 🚀 Advanced Features

### **Context Awareness**
```json
{
  "cursor.ai.contextAwareness": {
    "fileTypes": {
      "tsx": "React component with TypeScript",
      "ts": "TypeScript utility or service",
      "md": "Documentation or README",
      "yml": "Configuration or workflow"
    },
    "directories": {
      "web/features/": "Feature-specific components",
      "web/lib/": "Utility functions and services",
      "services/civics-backend/": "Civics data processing",
      "docs/": "Project documentation"
    }
  }
}
```

### **Choices Platform Context**
```json
{
  "cursor.ai.platformContext": {
    "architecture": "Next.js 15 App Router with Supabase backend",
    "features": [
      "Polling system with voting and sharing",
      "Civics backend with representative lookup",
      "Analytics with AI integration",
      "Admin panel with moderation tools",
      "Authentication with WebAuthn/passkeys"
    ],
    "testing": [
      "User journey testing",
      "Admin journey testing",
      "Civics backend testing",
      "Security testing",
      "Platform journey testing"
    ],
    "values": [
      "Democratic engagement",
      "Civic participation",
      "Privacy protection",
      "Security first",
      "Accessibility"
    ]
  }
}
```

---

## 🎯 Usage Guidelines

### **When to Use Each Template**

#### **Choices Platform Template**
- General development work
- New feature implementation
- Bug fixes
- Code refactoring
- Documentation updates

#### **Security Review Template**
- Authentication code
- RLS policy implementation
- Data protection features
- Privacy compliance
- Security audits

#### **Civics Backend Template**
- Representative lookup
- Data ingestion
- Geographic services
- API integrations
- Data processing

#### **Polling System Template**
- Poll creation
- Voting functionality
- Results display
- Sharing features
- Hashtag integration

### **Best Practices**

#### **Always Include Context**
- Mention the specific feature you're working on
- Reference related components or services
- Include relevant test cases
- Mention security considerations

#### **Test-Driven Development**
- Always mention testing requirements
- Reference existing test patterns
- Consider edge cases
- Include security test scenarios

#### **Platform Values**
- Consider democratic engagement impact
- Ensure accessibility
- Protect user privacy
- Maintain security standards
- Follow established patterns

---

## 🔧 Configuration Benefits

### **Enhanced AI Assistance**
- **Context-Aware**: AI understands Choices platform architecture
- **Feature-Focused**: AI knows about polling, civics, analytics
- **Security-Minded**: AI considers security implications
- **Test-Driven**: AI suggests appropriate testing approaches

### **Improved Development Speed**
- **Faster Onboarding**: AI understands platform immediately
- **Better Suggestions**: AI provides platform-specific recommendations
- **Reduced Errors**: AI considers platform constraints
- **Consistent Patterns**: AI follows established conventions

### **Quality Assurance**
- **Security Focus**: AI considers security implications
- **Testing Integration**: AI suggests comprehensive testing
- **Documentation**: AI helps maintain documentation
- **Best Practices**: AI follows platform standards

---

## 🚨 Troubleshooting

### **Common Issues**

#### **AI Not Understanding Context**
- Check if files are in inclusion patterns
- Verify custom instructions are clear
- Ensure prompt templates are appropriate
- Check context length limits

#### **Poor Suggestions**
- Use appropriate prompt template
- Provide more specific context
- Include relevant test cases
- Mention security requirements

#### **Security Concerns**
- Always use security review template for sensitive code
- Mention authentication requirements
- Include privacy considerations
- Reference RLS policies

### **Optimization Tips**

#### **Better Context**
- Include related files in conversation
- Mention test cases and requirements
- Reference documentation
- Explain business logic

#### **Clearer Instructions**
- Be specific about requirements
- Mention security considerations
- Include testing requirements
- Reference platform values

---

## 📊 Success Metrics

### **Effective AI Assistance**
- ✅ AI understands Choices platform context
- ✅ AI suggests platform-appropriate solutions
- ✅ AI considers security implications
- ✅ AI follows established patterns
- ✅ AI suggests comprehensive testing

### **Development Efficiency**
- ✅ Faster feature implementation
- ✅ Fewer security issues
- ✅ Better test coverage
- ✅ Consistent code quality
- ✅ Improved documentation

---

## 🎯 Future Enhancements

### **Potential Improvements**
- **Custom Models**: Train on Choices platform codebase
- **Advanced Templates**: More specific prompt templates
- **Integration**: Better integration with testing tools
- **Analytics**: Track AI assistance effectiveness
- **Learning**: AI learns from platform-specific patterns

### **Advanced Features**
- **Code Generation**: Generate platform-specific code
- **Test Generation**: Generate comprehensive tests
- **Documentation**: Auto-generate documentation
- **Security**: Advanced security analysis
- **Performance**: Performance optimization suggestions

---

**Configuration Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*This Cursor IDE configuration maximizes AI assistance for Choices platform development while maintaining focus on democratic engagement, security, and quality.*
