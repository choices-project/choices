# Contributing to Choices Platform

Thank you for your interest in contributing to the Choices Platform! This document provides guidelines and information for contributors.

## 🎯 **Project Overview**

Choices is a privacy-first democratic platform that levels the playing field for all candidates. We provide equal access to local representatives and enable community-driven voting on important issues with transparent AI analytics.

## 🚀 **Getting Started**

### Prerequisites

- Node.js 22.19.0 (use `.nvmrc` file)
- npm 10.9.3
- Git
- Supabase CLI (for database operations)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/Choices.git
   cd Choices/web
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Database Setup**
   ```bash
   npx supabase start
   npx supabase db reset
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

## 📝 **Development Guidelines**

### Code Style

- Use TypeScript for all new code
- Follow ESLint configuration
- Use Prettier for formatting
- Write meaningful commit messages
- Add JSDoc comments for public APIs

### Testing

- Write tests for new features
- Maintain test coverage above 90%
- Use E2E tests for user journeys
- Unit tests for business logic only

### Git Workflow

1. **Create Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Write code
   - Add tests
   - Update documentation

3. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

4. **Push and Create PR**
   ```bash
   git push origin feature/your-feature-name
   ```

## 🏗️ **Project Structure**

```
web/
├── app/                    # Next.js App Router pages
├── components/             # Reusable UI components
├── features/              # Feature-specific modules
├── lib/                   # Utility libraries
├── tests/                 # Test suites
│   ├── jest/             # Unit tests
│   └── playwright/       # E2E tests
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## 🧪 **Testing**

### Running Tests

```bash
# Unit tests
npm run test:jest

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Type checking
npm run type-check
```

### Test Guidelines

- **Unit Tests**: Test business logic, utilities, and pure functions
- **E2E Tests**: Test user journeys and integration flows
- **Avoid**: Testing implementation details or UI components

## 📚 **Documentation**

### Code Documentation

- Add JSDoc comments for all public functions
- Include examples in complex functions
- Document component props and usage

### README Updates

- Update README.md for new features
- Add screenshots for UI changes
- Update installation instructions

## 🐛 **Bug Reports**

When reporting bugs, please include:

1. **Description**: Clear description of the issue
2. **Steps to Reproduce**: Detailed steps to reproduce
3. **Expected Behavior**: What should happen
4. **Actual Behavior**: What actually happens
5. **Environment**: OS, browser, Node.js version
6. **Screenshots**: If applicable

## ✨ **Feature Requests**

When requesting features, please include:

1. **Use Case**: Why is this feature needed?
2. **Description**: Detailed description of the feature
3. **Mockups**: Visual representation if applicable
4. **Alternatives**: Other solutions considered

## 🔒 **Security**

- Report security issues privately to security@choices-platform.com
- Do not create public issues for security vulnerabilities
- Follow responsible disclosure practices

## 📋 **Pull Request Process**

1. **Fork** the repository
2. **Create** a feature branch
3. **Make** your changes
4. **Add** tests for new functionality
5. **Update** documentation
6. **Run** all tests and ensure they pass
7. **Submit** a pull request

### PR Guidelines

- Use descriptive titles
- Include detailed descriptions
- Link related issues
- Add screenshots for UI changes
- Ensure CI passes

## 🏷️ **Commit Message Format**

We use conventional commits:

```
type(scope): description

[optional body]

[optional footer]
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test changes
- `chore`: Build process or auxiliary tool changes

### Examples

```
feat(auth): add OAuth2 integration
fix(ui): resolve mobile layout issues
docs(api): update authentication endpoints
```

## 🤝 **Code of Conduct**

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Respect different viewpoints
- Help others learn and grow

## 📞 **Getting Help**

- **Discord**: Join our community Discord
- **GitHub Discussions**: Use GitHub Discussions for questions
- **Email**: Contact us at support@choices-platform.com

## 🙏 **Recognition**

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to making democracy more accessible! 🗳️
