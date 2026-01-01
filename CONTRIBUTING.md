# Contributing to Team-SSO

Thank you for your interest in contributing to Team-SSO. This document provides guidelines for contributing to the project.

---

## Getting Started

### Prerequisites

Before contributing, ensure you have:
- Node.js 18+ installed
- PostgreSQL 14+ running
- Git configured
- Google Cloud account (for API keys)
- Code editor (VS Code recommended)

### Setup Development Environment

1. Fork the repository
2. Clone your fork:
```bash
git clone https://github.com/YOUR_USERNAME/Team-SSO.git
cd Team-SSO
```

3. Install dependencies:
```bash
npm install
cd server && npm install && cd ..
```

4. Configure environment variables:
```bash
cp .env.example .env
cp server/.env.example server/.env
# Edit both files with your credentials
```

5. Setup database:
```bash
cd server
node migrate.js
```

6. Start development servers:
```bash
.\scripts\start.ps1
```

---

## Development Workflow

### Branch Strategy

- `main` - Production-ready code
- `develop` - Integration branch for features
- `feature/*` - New features
- `fix/*` - Bug fixes
- `docs/*` - Documentation updates

### Creating a Branch

```bash
git checkout -b feature/your-feature-name
```

Branch naming conventions:
- `feature/add-benchmarking` - New feature
- `fix/login-redirect` - Bug fix
- `docs/update-readme` - Documentation
- `refactor/api-cleanup` - Code refactoring

---

## Making Changes

### Code Style

**TypeScript/JavaScript**:
- Use TypeScript for all new code
- Follow existing code style
- Use meaningful variable names
- Add comments for complex logic
- Keep functions small and focused

**React Components**:
- Use functional components with hooks
- Implement proper error boundaries
- Use TypeScript interfaces for props
- Keep components under 200 lines

**Backend API**:
- Follow RESTful conventions
- Use proper HTTP status codes
- Validate all inputs
- Handle errors gracefully
- Add comprehensive logging

### Testing

Before submitting:
1. Test your changes locally
2. Verify all existing features still work
3. Check console for errors
4. Test in multiple browsers (Chrome, Firefox, Safari)

### Code Quality

Run these checks before committing:
```bash
# Frontend linting
npm run lint

# Backend linting
cd server && npm run lint

# TypeScript compilation
npm run build
cd server && npm run build
```

---

## Commit Guidelines

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types**:
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks

**Examples**:
```bash
git commit -m "feat(analysis): Add industry benchmarking"
git commit -m "fix(auth): Resolve login redirect issue"
git commit -m "docs(readme): Update installation steps"
```

### Commit Best Practices

- Write clear, concise commit messages
- One logical change per commit
- Reference issue numbers when applicable
- Keep commits atomic and focused

---

## Pull Request Process

### Before Submitting

1. **Update from main**:
```bash
git checkout main
git pull origin main
git checkout your-branch
git rebase main
```

2. **Run tests and checks**:
```bash
npm run lint
npm run build
```

3. **Update documentation**:
- Update README.md if needed
- Add/update code comments
- Update FEATURES.md for new features

### Creating Pull Request

1. Push your branch:
```bash
git push origin feature/your-feature-name
```

2. Open PR on GitHub
3. Fill out PR template:
   - Description of changes
   - Related issue number
   - Screenshots (for UI changes)
   - Testing steps

4. Request review from maintainers

### PR Title Format

```
[Type] Brief description
```

Examples:
- `[Feature] Add dual PDF comparison`
- `[Fix] Resolve authentication redirect loop`
- `[Docs] Update deployment guide`

---

## Code Review

### Review Process

- All PRs require at least one approval
- Address review comments promptly
- Keep discussions focused and respectful
- Update PR based on feedback

### Review Checklist

Reviewers should verify:
- [ ] Code follows project style
- [ ] Changes are well-documented
- [ ] No security vulnerabilities introduced
- [ ] Performance is not negatively impacted
- [ ] Tests pass (if applicable)
- [ ] Documentation is updated

---

## Reporting Issues

### Bug Reports

Include:
- Clear description of the bug
- Steps to reproduce
- Expected vs actual behavior
- Screenshots or error messages
- Environment (OS, browser, Node version)

Example:
```markdown
**Description**: Login redirect fails after OAuth callback

**Steps to Reproduce**:
1. Click "Sign in with Google"
2. Grant permissions
3. Observe redirect behavior

**Expected**: Redirect to dashboard
**Actual**: Stuck on login page

**Environment**: Windows 11, Chrome 120, Node 18.17.0
```

### Feature Requests

Include:
- Clear description of the feature
- Use cases and benefits
- Potential implementation approach
- Related features or dependencies

---

## Documentation

### Documentation Standards

- Write clear, concise documentation
- Use proper markdown formatting
- Include code examples where helpful
- Keep documentation up-to-date with code changes

### Documentation Types

- **README.md** - Project overview and setup
- **FEATURES.md** - Feature descriptions
- **docs/** - Detailed documentation
  - **setup/** - Installation and configuration
  - **api/** - API documentation
  - **features/** - Feature-specific guides

---

## Project Structure

```
Team-SSO/
├── src/                  # Frontend React app
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route pages
│   ├── services/        # API clients
│   └── types/           # TypeScript types
├── server/              # Backend Node.js app
│   ├── src/            # TypeScript source
│   │   ├── routes/    # API routes
│   │   ├── services/  # Business logic
│   │   └── types/     # Type definitions
│   ��── migrations/     # Database migrations
├── docs/                # Documentation
├── scripts/            # Automation scripts
└── sql/                # Database scripts
```

---

## Community Guidelines

### Code of Conduct

- Be respectful and inclusive
- Welcome newcomers
- Focus on constructive feedback
- Maintain professional communication
- Report inappropriate behavior

### Getting Help

- Check existing documentation
- Search closed issues
- Ask in GitHub Discussions
- Contact maintainers if needed

---

## Release Process

### Version Numbering

Follow [Semantic Versioning](https://semver.org/):
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes

Example: `2.1.3`

### Release Checklist

- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Tag created
- [ ] Deployment verified

---

## Recognition

Contributors will be:
- Listed in project README
- Acknowledged in release notes
- Credited in documentation (for significant contributions)

---

## Questions?

For questions about contributing:
- Open a GitHub Discussion
- Review existing documentation
- Contact project maintainers

Thank you for contributing to Team-SSO!
