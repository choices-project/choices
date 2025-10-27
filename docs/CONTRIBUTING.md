# 🤝 Contributing to Choices

**Contribution Guidelines for Choices Platform**

---

## 🎯 **Overview**

Thank you for your interest in contributing to the Choices platform! This guide outlines how to contribute effectively to the project.

**Last Updated**: October 27, 2025  
**Status**: Open for Contributions  
**Community**: Welcome to all contributors

---

## 🚀 **Getting Started**

### **Prerequisites**
- **Node.js**: 22.19.0 (exact version required)
- **npm**: 10.9.3 (exact version required)
- **Git**: Latest version
- **GitHub Account**: For contributing
- **TypeScript/React Knowledge**: Basic understanding required

### **Development Setup**
```bash
# Fork and clone the repository
git clone https://github.com/your-username/choices.git
cd choices

# Navigate to web directory
cd web

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Start development server
npm run dev
```

### **Environment Setup**
Create `.env.local` with:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Optional: AI Services
OLLAMA_API_URL=http://localhost:11434
HUGGING_FACE_API_KEY=your_hf_api_key
```

---

## 🔧 **Development Workflow**

### **Solo Developer Workflow**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Make changes
# ... implement your feature ...

# Run tests
npm run test
npm run test:e2e

# Check code quality
npm run lint
npm run type-check

# Build to verify
npm run build

# Commit changes
git add .
git commit -m "feat: add your feature description"

# Push to your fork
git push origin feature/your-feature-name

# Create pull request
# Go to GitHub and create PR
```

### **Code Quality Standards**
- **TypeScript**: Use strict typing, avoid `any`
- **ESLint**: Follow project linting rules
- **Testing**: Write tests for new features
- **Documentation**: Update docs when changing APIs
- **Performance**: Consider performance implications

### **Commit Message Format**
```
type(scope): description

feat(auth): add WebAuthn authentication
fix(polls): resolve voting validation issue
docs(api): update API documentation
test(analytics): add analytics test coverage
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `test`: Test additions/changes
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `chore`: Maintenance tasks

---

## 🏗️ **Project Structure**

### **Directory Organization**
```
web/
├── app/                    # Next.js App Router
│   ├── (app)/             # Authenticated routes
│   ├── (landing)/         # Public landing pages
│   ├── api/               # API routes
│   └── auth/              # Authentication pages
├── components/            # Reusable React components
│   ├── ui/                # Basic UI components
│   ├── shared/            # Shared components
│   └── business/           # Business logic components
├── features/              # Feature-specific code
│   ├── auth/              # Authentication feature
│   ├── polls/             # Polling feature
│   ├── analytics/         # Analytics feature
│   └── civics/            # Civic engagement feature
├── lib/                   # Utilities and services
│   ├── auth/              # Authentication utilities
│   ├── database/          # Database utilities
│   ├── ai/                # AI service integrations
│   └── utils/             # General utilities
├── tests/                 # Test suites
│   ├── jest/              # Unit tests
│   ├── playwright/        # E2E tests
│   └── helpers/           # Test utilities
└── docs/                  # Documentation
```

### **Component Guidelines**
```typescript
// Component structure
interface ComponentProps {
  // Define props interface
}

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Hooks
  const [state, setState] = useState();
  
  // Event handlers
  const handleEvent = useCallback(() => {
    // Handle event
  }, []);
  
  // Effects
  useEffect(() => {
    // Side effects
  }, []);
  
  // Render
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default Component;
```

### **API Route Guidelines**
```typescript
// API route structure
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Validate request
    // Process request
    // Return response
    return NextResponse.json({ data });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = schema.parse(body);
    
    // Process request
    const result = await processData(validatedData);
    
    return NextResponse.json({ result });
  } catch (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}
```

---

## 🧪 **Testing Guidelines**

### **Testing Requirements**
- **Unit Tests**: Test individual functions and components
- **Integration Tests**: Test API routes and database interactions
- **E2E Tests**: Test complete user journeys
- **Test Coverage**: Maintain 70%+ coverage

### **Writing Tests**
```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { PollCard } from '@/components/business/PollCard';

describe('PollCard Component', () => {
  it('renders poll information correctly', () => {
    const mockPoll = {
      id: 'poll-123',
      title: 'Test Poll',
      options: [
        { id: 'opt-1', text: 'Option A', votes: 10 },
        { id: 'opt-2', text: 'Option B', votes: 15 }
      ]
    };
    
    render(<PollCard poll={mockPoll} />);
    
    expect(screen.getByText('Test Poll')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });
  
  it('handles vote button clicks', () => {
    const mockOnVote = jest.fn();
    render(<PollCard poll={mockPoll} onVote={mockOnVote} />);
    
    const voteButton = screen.getByText('Vote');
    fireEvent.click(voteButton);
    
    expect(mockOnVote).toHaveBeenCalledWith('poll-123');
  });
});
```

### **Running Tests**
```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage
```

---

## 📝 **Documentation Guidelines**

### **Code Documentation**
```typescript
/**
 * Creates a new poll with the provided data
 * @param pollData - The poll data to create
 * @param userId - The ID of the user creating the poll
 * @returns Promise resolving to the created poll
 * @throws {ValidationError} When poll data is invalid
 * @throws {DatabaseError} When database operation fails
 */
export async function createPoll(
  pollData: CreatePollData,
  userId: string
): Promise<Poll> {
  // Implementation
}
```

### **API Documentation**
```typescript
/**
 * @api {post} /api/polls Create Poll
 * @apiName CreatePoll
 * @apiGroup Polls
 * @apiVersion 1.0.0
 * 
 * @apiParam {String} title Poll title
 * @apiParam {String} [description] Poll description
 * @apiParam {Array} options Poll options
 * @apiParam {String} privacy_level Poll privacy level
 * 
 * @apiSuccess {Object} poll Created poll object
 * @apiSuccess {String} poll.id Poll ID
 * @apiSuccess {String} poll.title Poll title
 * 
 * @apiError {Object} 400 Bad Request
 * @apiError {String} 400.error Error message
 */
```

### **Updating Documentation**
- **API Changes**: Update API documentation when changing endpoints
- **Feature Changes**: Update feature documentation when adding features
- **Architecture Changes**: Update architecture documentation for major changes
- **README Updates**: Update README for significant changes

---

## 🔍 **Code Review Process**

### **Pull Request Guidelines**
1. **Clear Description**: Provide clear description of changes
2. **Testing**: Include tests for new features
3. **Documentation**: Update relevant documentation
4. **Performance**: Consider performance implications
5. **Security**: Review security implications

### **Review Checklist**
- [ ] Code follows project conventions
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Performance is acceptable
- [ ] Security is considered
- [ ] No breaking changes (or properly documented)

### **Review Process**
1. **Self Review**: Review your own code first
2. **Automated Checks**: Ensure all CI checks pass
3. **Manual Review**: Request review from maintainers
4. **Address Feedback**: Address review comments
5. **Merge**: Merge after approval

---

## 🐛 **Bug Reports**

### **Reporting Bugs**
When reporting bugs, please include:
- **Clear Description**: What happened vs. what was expected
- **Steps to Reproduce**: Detailed steps to reproduce the issue
- **Environment**: Browser, OS, Node.js version
- **Screenshots**: If applicable
- **Logs**: Relevant error logs or console output

### **Bug Report Template**
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

## Expected Behavior
What you expected to happen

## Actual Behavior
What actually happened

## Environment
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Node.js Version: [e.g. 22.19.0]
- Platform Version: [e.g. 1.0.0]

## Additional Context
Any other context about the problem
```

---

## 💡 **Feature Requests**

### **Requesting Features**
When requesting features, please include:
- **Use Case**: Why this feature is needed
- **Proposed Solution**: How you think it should work
- **Alternatives**: Other solutions you've considered
- **Additional Context**: Any other relevant information

### **Feature Request Template**
```markdown
## Feature Description
Brief description of the feature

## Use Case
Why is this feature needed?

## Proposed Solution
How should this feature work?

## Alternatives Considered
What other solutions have you considered?

## Additional Context
Any other context about the feature request
```

---

## 🔒 **Security**

### **Security Guidelines**
- **Never commit secrets**: API keys, passwords, tokens
- **Report vulnerabilities**: Use private security reporting
- **Follow security best practices**: Validate input, sanitize output
- **Keep dependencies updated**: Regular security updates

### **Reporting Security Issues**
For security issues, please:
1. **Don't create public issues**: Use private reporting
2. **Provide details**: Include steps to reproduce
3. **Be patient**: Allow time for investigation and fix
4. **Follow responsible disclosure**: Don't disclose until fixed

---

## 📊 **Performance Guidelines**

### **Performance Considerations**
- **Bundle Size**: Keep bundle size reasonable
- **Database Queries**: Optimize database queries
- **Image Optimization**: Use Next.js Image component
- **Caching**: Implement appropriate caching
- **Code Splitting**: Use dynamic imports for large components

### **Performance Testing**
```bash
# Check bundle size
npm run build
npx @next/bundle-analyzer

# Check performance
npm run lighthouse

# Profile performance
npm run profile
```

---

## 🎯 **Contribution Areas**

### **Areas Needing Help**
- **Testing**: Improve test coverage and quality
- **Documentation**: Improve and expand documentation
- **Performance**: Optimize performance and bundle size
- **Accessibility**: Improve accessibility compliance
- **Internationalization**: Add multi-language support

### **Getting Started with Contributions**
1. **Good First Issues**: Look for issues labeled "good first issue"
2. **Documentation**: Help improve documentation
3. **Testing**: Add tests for existing features
4. **Bug Fixes**: Fix reported bugs
5. **Performance**: Optimize existing code

---

## 📞 **Getting Help**

### **Community Resources**
- **GitHub Issues**: Report bugs and request features
- **GitHub Discussions**: Ask questions and get help
- **Documentation**: Comprehensive guides and references
- **Code Examples**: Look at existing code for patterns

### **Communication Guidelines**
- **Be Respectful**: Treat everyone with respect
- **Be Patient**: Allow time for responses
- **Be Clear**: Provide clear descriptions and questions
- **Be Helpful**: Help others when you can

---

## 📋 **Contribution Checklist**

### **Before Contributing**
- [ ] Read this contributing guide
- [ ] Set up development environment
- [ ] Understand project structure
- [ ] Review existing code
- [ ] Check for existing issues/PRs

### **When Contributing**
- [ ] Follow coding standards
- [ ] Write tests for new features
- [ ] Update documentation
- [ ] Test your changes
- [ ] Submit clear PR description

### **After Contributing**
- [ ] Respond to review feedback
- [ ] Address any issues
- [ ] Update documentation if needed
- [ ] Help others with similar contributions

---

**Contributing Guide Version**: 1.0.0  
**Last Updated**: October 27, 2025  
**Status**: ✅ Production Ready

---

*Thank you for contributing to the Choices platform! Your contributions help make democracy more accessible.*