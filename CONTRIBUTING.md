# Contributing to SYMBI Ecosystem Hub

Thank you for your interest in contributing to the SYMBI ecosystem! This document provides guidelines for contributing to the Gammatria site and the broader SYMBI project.

## 🌟 Ways to Contribute

### Code Contributions
- Bug fixes and improvements
- New features and enhancements
- Performance optimizations
- Documentation improvements
- Test coverage expansion

### Research Contributions
- Academic papers and studies
- Verification tests and benchmarks
- Case studies and use cases
- Integration examples

### Community Contributions
- Issue reporting and triage
- Community support and discussions
- Translation and localization
- Educational content creation

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git knowledge
- TypeScript/React experience (for code contributions)
- Understanding of SYMBI concepts (see [/getting-started](https://gammatria.site/getting-started))

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/your-username/gammatria-site.git
   cd gammatria-site
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests and Linting**
   ```bash
   npm run lint
   npm run build  # Ensure build succeeds
   ```

## 📋 Contribution Process

### 1. Issue First
- Check existing issues before creating new ones
- Use issue templates when available
- Provide clear reproduction steps for bugs
- Include relevant context and screenshots

### 2. Branch Strategy
```bash
# Create feature branch from main
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/issue-description
```

### 3. Code Standards

#### TypeScript/React Guidelines
- Use TypeScript for all new code
- Follow existing component patterns
- Implement proper error boundaries
- Ensure accessibility (WCAG 2.1 AA)
- Use semantic HTML elements

#### Styling Guidelines
- Use Tailwind CSS classes
- Follow existing design system patterns
- Ensure responsive design (mobile-first)
- Test in multiple browsers
- Maintain dark theme consistency

#### Performance Guidelines
- Optimize images and assets
- Implement proper loading states
- Use Next.js best practices
- Minimize bundle size impact
- Test Core Web Vitals

### 4. Testing Requirements

#### Before Submitting
- [ ] Code builds without errors
- [ ] Linting passes (`npm run lint`)
- [ ] Manual testing in development
- [ ] Cross-browser compatibility check
- [ ] Mobile responsiveness verified
- [ ] Accessibility tested

#### Testing Checklist
- Interactive components work correctly
- Navigation functions properly
- Forms validate and submit
- External links open correctly
- Analytics consent works
- Error states display properly

### 5. Pull Request Process

#### PR Title Format
```
type(scope): description

Examples:
feat(showcase): add interactive AgentVerse demo
fix(consent): resolve hydration mismatch
docs(api): update authentication examples
```

#### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Refactoring

## Testing
- [ ] Manual testing completed
- [ ] Cross-browser tested
- [ ] Mobile responsive
- [ ] Accessibility verified

## Screenshots
(If applicable)

## Related Issues
Closes #123
```

#### Review Process
1. Automated checks must pass
2. At least one maintainer review required
3. Address feedback promptly
4. Squash commits before merge

## 🎯 Specific Contribution Areas

### Documentation
- API documentation improvements
- Getting started guide enhancements
- Code examples and tutorials
- Research paper summaries

### Interactive Demos
- New SYMBI module showcases
- Enhanced /proof toggle features
- Integration workflow examples
- Performance benchmarking tools

### Research Integration
- Academic paper implementations
- Verification test additions
- Case study documentation
- Benchmark result displays

### Accessibility & UX
- Screen reader compatibility
- Keyboard navigation improvements
- Color contrast enhancements
- Mobile experience optimization

## 🔧 Technical Architecture

### Key Technologies
- **Next.js 15.5.4** - App Router with TypeScript
- **Tailwind CSS** - Utility-first styling
- **React 18** - Component architecture
- **Vercel** - Deployment platform

### Project Structure
```
src/
├── app/                    # Next.js pages (App Router)
├── components/             # Reusable UI components
├── lib/                   # Utility functions
├── styles/                # Global styles
└── types/                 # TypeScript definitions
```

### Component Guidelines
- Use functional components with hooks
- Implement proper TypeScript interfaces
- Include JSDoc comments for complex logic
- Export components with clear naming
- Handle loading and error states

## 🌍 Community Guidelines

### Code of Conduct
- Be respectful and inclusive
- Provide constructive feedback
- Help newcomers learn
- Focus on technical merit
- Maintain professional communication

### Communication Channels
- **GitHub Issues** - Bug reports and feature requests
- **GitHub Discussions** - Community questions and ideas
- **Pull Requests** - Code review and collaboration

## 📚 Resources

### SYMBI Ecosystem
- [Ecosystem Overview](https://gammatria.site/ecosystem)
- [API Documentation](https://gammatria.site/api-docs)
- [Research Papers](https://gammatria.site/research)
- [Getting Started Guide](https://gammatria.site/getting-started)

### Development Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Guide](https://tailwindcss.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [React Documentation](https://react.dev)

## 🏆 Recognition

Contributors are recognized through:
- GitHub contributor graphs
- Release notes mentions
- Community showcase features
- Academic paper acknowledgments

## 📄 License

By contributing, you agree that your contributions will be licensed under:
- **Code**: MIT License
- **Documentation**: CC BY-NC-SA 4.0
- **Research**: Academic use with proper attribution

---

**Questions?** Open a [GitHub Discussion](https://github.com/your-org/gammatria-site/discussions) or reach out to the maintainers.

Thank you for helping advance trustworthy AI through the SYMBI ecosystem! 🚀