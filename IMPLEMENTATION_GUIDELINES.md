# Implementation Guidelines & Best Practices

## 🎯 **Core Principles**

### **1. Research-First Approach**
- **MANDATORY**: Conduct thorough research before any implementation
- **Minimum Research Time**: 30 minutes for simple features, 2+ hours for complex features
- **Research Deliverables**: 
  - Technical analysis document
  - Architecture comparison
  - Security considerations
  - Performance implications
  - Alternative approaches evaluated

### **2. Security-First Development**
- **Security is NOT an afterthought** - it's the foundation
- **Every feature must have security review** before implementation
- **Default to most restrictive permissions**
- **Assume all inputs are malicious**
- **Log all security-relevant actions**

### **3. Testing-Driven Development**
- **Write tests BEFORE implementation**
- **Coverage requirements**: 90%+ for critical paths
- **Integration tests for all API endpoints**
- **Security tests for all user inputs**
- **Performance tests for database operations**

### **4. Documentation-Driven Development**
- **Document the plan BEFORE coding**
- **Update documentation WITH code changes**
- **Include architecture diagrams**
- **Document security decisions and rationale**

## 📋 **Pre-Implementation Checklist**

### **Research Phase (MANDATORY)**
- [ ] **Industry Analysis**: How do other platforms solve this?
- [ ] **Technology Research**: Best tools/libraries for this use case?
- [ ] **Security Research**: What are the security implications?
- [ ] **Performance Research**: What are the performance considerations?
- [ ] **Scalability Research**: How will this scale?
- [ ] **Compliance Research**: Any legal/regulatory requirements?

### **Planning Phase (MANDATORY)**
- [ ] **Architecture Design**: Document the technical architecture
- [ ] **Security Design**: Document security measures
- [ ] **API Design**: Design all API endpoints
- [ ] **Database Design**: Design database schema changes
- [ ] **UI/UX Design**: Design user interface
- [ ] **Testing Strategy**: Plan comprehensive testing approach

### **Implementation Plan (MANDATORY)**
- [ ] **Phase 1**: Core infrastructure
- [ ] **Phase 2**: Security implementation
- [ ] **Phase 3**: Feature implementation
- [ ] **Phase 4**: Testing and validation
- [ ] **Phase 5**: Documentation and deployment

## 🔒 **Security Implementation Standards**

### **Authentication & Authorization**
```typescript
// MANDATORY: Always implement proper auth checks
const isAuthorized = await checkUserPermissions(userId, action, resource);
if (!isAuthorized) {
  throw new SecurityError('Unauthorized access');
}

// MANDATORY: Validate all inputs
const sanitizedInput = sanitizeUserInput(rawInput);
if (!isValidInput(sanitizedInput)) {
  throw new ValidationError('Invalid input');
}
```

### **Database Security**
```sql
-- MANDATORY: Row Level Security on ALL tables
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- MANDATORY: Restrictive policies by default
CREATE POLICY "Users can only access own data" ON table_name
  FOR ALL USING (auth.uid()::text = user_id);
```

### **API Security**
```typescript
// MANDATORY: Rate limiting
const rateLimiter = new RateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// MANDATORY: Input validation
const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});
```

## 🧪 **Testing Standards**

### **Unit Testing Requirements**
```typescript
// MANDATORY: Test all business logic
describe('UserService', () => {
  it('should create user with valid data', async () => {
    const user = await createUser(validUserData);
    expect(user).toBeDefined();
    expect(user.email).toBe(validUserData.email);
  });

  it('should reject invalid email', async () => {
    await expect(createUser(invalidUserData))
      .rejects.toThrow('Invalid email');
  });
});
```

### **Integration Testing Requirements**
```typescript
// MANDATORY: Test all API endpoints
describe('POST /api/users', () => {
  it('should create user when authenticated', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${validToken}`)
      .send(validUserData);
    
    expect(response.status).toBe(201);
    expect(response.body.user).toBeDefined();
  });

  it('should reject unauthenticated requests', async () => {
    const response = await request(app)
      .post('/api/users')
      .send(validUserData);
    
    expect(response.status).toBe(401);
  });
});
```

### **Security Testing Requirements**
```typescript
// MANDATORY: Test security vulnerabilities
describe('Security Tests', () => {
  it('should prevent SQL injection', async () => {
    const maliciousInput = "'; DROP TABLE users; --";
    const response = await request(app)
      .post('/api/search')
      .send({ query: maliciousInput });
    
    expect(response.status).toBe(400);
  });

  it('should prevent XSS attacks', async () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const response = await request(app)
      .post('/api/comments')
      .send({ content: maliciousInput });
    
    expect(response.body.content).not.toContain('<script>');
  });
});
```

## 📊 **Quality Assurance Standards**

### **Code Quality Requirements**
- [ ] **ESLint**: Zero warnings/errors
- [ ] **TypeScript**: Strict mode enabled, no `any` types
- [ ] **Prettier**: Consistent code formatting
- [ ] **Code Coverage**: 90%+ for critical paths
- [ ] **Security Scan**: Zero high/critical vulnerabilities
- [ ] **Performance**: Response times under 200ms for API calls

### **Documentation Requirements**
- [ ] **README**: Updated with new features
- [ ] **API Documentation**: All endpoints documented
- [ ] **Architecture Documentation**: Updated diagrams
- [ ] **Security Documentation**: Security decisions documented
- [ ] **Deployment Documentation**: Deployment procedures updated

### **Review Requirements**
- [ ] **Self-Review**: Review own code before committing
- [ ] **Security Review**: Security implications reviewed
- [ ] **Performance Review**: Performance impact assessed
- [ ] **Documentation Review**: Documentation updated and reviewed

## 🚀 **Implementation Workflow**

### **Step 1: Research & Analysis (MANDATORY)**
```markdown
## Research Document Template

### Problem Statement
[Clear description of what we're solving]

### Current Solutions Analysis
- [Solution A]: Pros/Cons, Security implications
- [Solution B]: Pros/Cons, Security implications
- [Solution C]: Pros/Cons, Security implications

### Recommended Approach
[Justified recommendation with security considerations]

### Security Implications
- [List all security considerations]
- [Mitigation strategies]

### Performance Implications
- [Performance considerations]
- [Optimization strategies]
```

### **Step 2: Architecture Design (MANDATORY)**
```markdown
## Architecture Document Template

### System Design
[High-level architecture diagram]

### Database Design
[Schema changes, relationships, indexes]

### API Design
[All endpoints, request/response formats]

### Security Design
[Authentication, authorization, data protection]

### Testing Strategy
[Unit, integration, security, performance tests]
```

### **Step 3: Implementation (With Testing)**
```bash
# MANDATORY: Create feature branch
git checkout -b feature/descriptive-name

# MANDATORY: Write tests first
npm run test:watch

# MANDATORY: Implement with security in mind
# [Implementation with security checks]

# MANDATORY: Run all tests
npm run test
npm run test:security
npm run test:performance

# MANDATORY: Update documentation
# [Update all relevant documentation]
```

### **Step 4: Review & Validation (MANDATORY)**
```bash
# MANDATORY: Self-review checklist
- [ ] All tests pass
- [ ] Security review completed
- [ ] Performance review completed
- [ ] Documentation updated
- [ ] Code quality standards met

# MANDATORY: Security validation
npm run security:scan
npm run security:test

# MANDATORY: Performance validation
npm run performance:test
```

## 🔍 **Quality Gates**

### **Pre-Commit Gates**
- [ ] All tests pass
- [ ] Code coverage >= 90%
- [ ] Security scan passes
- [ ] Linting passes
- [ ] TypeScript compilation succeeds

### **Pre-Deploy Gates**
- [ ] Integration tests pass
- [ ] Security tests pass
- [ ] Performance tests pass
- [ ] Documentation complete
- [ ] Architecture review completed

### **Post-Deploy Gates**
- [ ] Monitoring alerts configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Security monitoring active

## 📈 **Continuous Improvement**

### **Weekly Reviews**
- [ ] Review implementation quality
- [ ] Assess security posture
- [ ] Evaluate performance metrics
- [ ] Update guidelines based on lessons learned

### **Monthly Assessments**
- [ ] Architecture review
- [ ] Security audit
- [ ] Performance optimization
- [ ] Technology stack evaluation

## 🎯 **Success Metrics**

### **Quality Metrics**
- **Test Coverage**: 90%+ for critical paths
- **Security Vulnerabilities**: Zero high/critical
- **Performance**: <200ms API response times
- **Error Rate**: <1% for user-facing features
- **Documentation**: 100% of features documented

### **Process Metrics**
- **Research Time**: 30min+ for simple features, 2hr+ for complex
- **Testing Time**: 50% of development time
- **Review Time**: 20% of development time
- **Documentation Time**: 15% of development time

---

## 🚨 **Critical Reminders**

1. **Security is NOT optional** - it's the foundation
2. **Testing is NOT optional** - it's the validation
3. **Documentation is NOT optional** - it's the knowledge
4. **Research is NOT optional** - it's the preparation
5. **Quality is NOT optional** - it's the standard

**Remember**: It's better to do it right the first time than to fix it later. Quality, security, and thoroughness are not trade-offs - they are requirements.
