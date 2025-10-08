**Last Updated**: 2025-09-17
# Contributing to Choices

> **Guidelines for contributing to the Choices democratic polling platform**

## 🤝 Welcome Contributors!

Thank you for your interest in contributing to the Choices platform! We welcome contributions from developers, designers, writers, and community members who share our vision of creating a transparent, privacy-first democratic platform.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Guidelines](#issue-guidelines)
- [Community Guidelines](#community-guidelines)

## 📜 Code of Conduct

This project adheres to our [Code of Conduct](core/CODE_OF_CONDUCT.md). By participating, you agree to uphold this code. Please report unacceptable behavior to [conduct@choices.app](mailto:conduct@choices.app).

## 🚀 Getting Started

### Prerequisites

- **Node.js**: Version 22.19.0 (exact version required)
- **npm**: Latest version
- **Git**: For version control
- **Supabase Account**: For database access

### Development Setup

1. **Fork and Clone**
   ```bash
   # Fork the repository on GitHub
   git clone https://github.com/choices-project/choices.git
   cd choices
   ```

2. **Environment Setup**
   ```bash
   # Use the correct Node.js version
   nvm use
   
   # Install dependencies
   npm install
   
   # Set up environment variables
   node scripts/setup-supabase-env.js
   ```

3. **Configure Environment**
   ```bash
   # Edit web/.env.local with your Supabase credentials
   cp web/.env.example web/.env.local
   # Add your Supabase URL and keys
   ```

4. **Start Development**
   ```bash
   cd web
   npm run dev
   ```

## 🔄 Development Workflow

### Branch Strategy

We use a **GitHub Flow** approach:

- **`main`**: Production-ready code
- **`develop`**: Integration branch for features
- **`feature/*`**: Feature development branches
- **`hotfix/*`**: Critical bug fixes
- **`docs/*`**: Documentation updates

### Branch Naming Convention

```
feature/auth-improvements
bugfix/voting-validation
docs/api-documentation
hotfix/security-patch
```

### Commit Message Format

We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
type(scope): description

[optional body]

[optional footer(s)]
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(auth): add WebAuthn biometric authentication
fix(voting): resolve ranked choice calculation error
docs(api): update authentication endpoints
test(polls): add unit tests for poll creation
```

## 📝 Contributing Guidelines

### Code Quality Standards

#### TypeScript
- **Strict Mode**: All code must pass TypeScript strict checks
- **Type Safety**: No `any` types without explicit justification
- **Interfaces**: Use interfaces for object shapes
- **Enums**: Use enums for fixed value sets

#### Code Style
- **ESLint**: Follow our ESLint configuration
- **Prettier**: Use Prettier for code formatting
- **Naming**: Use descriptive, self-documenting names
- **Comments**: Document complex logic and business rules

#### Testing
- **Unit Tests**: Write tests for all new functionality
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test critical user flows
- **Coverage**: Maintain >80% test coverage

### File Organization

#### Feature-Based Structure
```
features/
├── auth/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── tests/
├── polls/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   ├── types/
│   └── tests/
```

#### Import Guidelines
```typescript
// External libraries first
import React from 'react';
import { NextRequest } from 'next/server';

// Internal imports - absolute paths
import { logger } from '@/lib/logger';
import { Poll } from '@/lib/core/types';

// Relative imports last
import './styles.css';
```

### Security Guidelines

#### Authentication & Authorization
- **WebAuthn First**: Prefer WebAuthn over traditional auth
- **Least Privilege**: Grant minimal required permissions
- **Input Validation**: Validate all user inputs
- **SQL Injection**: Use parameterized queries

#### Data Protection
- **Privacy by Design**: Minimize data collection
- **Encryption**: Encrypt sensitive data
- **Anonymization**: Anonymize analytics data
- **Retention**: Follow data retention policies

## 🔀 Pull Request Process

### Before Submitting

1. **Update Documentation**
   - Update relevant documentation
   - Add JSDoc comments for new functions
   - Update API documentation if applicable

2. **Write Tests**
   - Add unit tests for new functionality
   - Update existing tests if needed
   - Ensure all tests pass

3. **Check Code Quality**
   ```bash
   npm run lint
   npm run typecheck
   npm run test
   ```

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)

## Related Issues
Closes #123
```

### Review Process

1. **Automated Checks**
   - CI/CD pipeline runs automatically
   - All checks must pass before review

2. **Code Review**
   - At least one maintainer review required
   - Address all feedback before merging
   - Squash commits for clean history

3. **Merge Strategy**
   - Use "Squash and merge" for feature branches
   - Use "Merge commit" for hotfixes
   - Delete feature branches after merge

## 🐛 Issue Guidelines

### Bug Reports

Use the bug report template:

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Browser: [e.g. Chrome, Firefox, Safari]
- Version: [e.g. 1.0.0]

**Additional context**
Any other context about the problem.
```

### Feature Requests

Use the feature request template:

```markdown
**Is your feature request related to a problem?**
A clear description of what the problem is.

**Describe the solution you'd like**
A clear description of what you want to happen.

**Describe alternatives you've considered**
Alternative solutions or features you've considered.

**Additional context**
Any other context or screenshots about the feature request.
```

### Issue Labels

- **`bug`**: Something isn't working
- **`enhancement`**: New feature or request
- **`documentation`**: Improvements to documentation
- **`good first issue`**: Good for newcomers
- **`help wanted`**: Extra attention is needed
- **`priority: high`**: High priority issues
- **`priority: low`**: Low priority issues

## 👥 Community Guidelines

### Communication Channels

- **GitHub Issues**: Bug reports and feature requests
- **GitHub Discussions**: General questions and ideas
- **Pull Requests**: Code contributions and reviews
- **Email**: [contact@choices.app](mailto:contact@choices.app) for private matters

### Getting Help

1. **Check Documentation**: Review existing docs first
2. **Search Issues**: Look for similar issues
3. **Ask Questions**: Use GitHub Discussions
4. **Be Patient**: Maintainers are volunteers

### Recognition

Contributors are recognized in:
- **CONTRIBUTORS.md**: List of all contributors
- **Release Notes**: Major contributors highlighted
- **GitHub**: Contributor statistics and activity

## 🏆 Recognition Levels

### Contributor
- First successful contribution
- Listed in CONTRIBUTORS.md

### Regular Contributor
- 5+ merged pull requests
- Active in discussions
- GitHub badge recognition

### Core Contributor
- 20+ merged pull requests
- Significant feature contributions
- Maintainer consideration

### Maintainer
- Invited by existing maintainers
- Repository write access
- Release management responsibilities

## 📚 Resources

### Documentation
- [System Architecture](core/SYSTEM_ARCHITECTURE.md)
- [Security Model](core/SECURITY.md)
- [Authentication System](core/AUTHENTICATION.md)
- [API Documentation](api/README.md)

### Development Tools
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [WebAuthn Guide](https://webauthn.guide/)

### Community
- [Code of Conduct](core/CODE_OF_CONDUCT.md)
- [Governance](core/GOVERNANCE.md)
- [Neutrality Policy](core/NEUTRALITY_POLICY.md)

## 🆘 Support

### Getting Help
- **Documentation**: Check the `docs/` directory
- **Issues**: Open a GitHub issue
- **Discussions**: Use GitHub Discussions
- **Email**: [contact@choices.app](mailto:contact@choices.app)

### Reporting Security Issues

**DO NOT** report security vulnerabilities through public GitHub issues.

Instead, please:
1. Email [security@choices.app](mailto:security@choices.app)
2. Include detailed information about the vulnerability
3. Allow reasonable time for response before disclosure

---

**Thank you for contributing to Choices!** 🎉

Your contributions help build a more transparent, secure, and democratic future.

---

**Created**: December 15, 2024  
**Last Updated**: December 15, 2024  
**Version**: 1.0.0  
**Maintainers**: [@michaeltempesta](https://github.com/michaeltempesta)  
**Organization**: [@choices-project](https://github.com/choices-project)












