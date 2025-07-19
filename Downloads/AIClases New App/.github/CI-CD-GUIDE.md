# 🚀 CI/CD System Documentation

## Overview

AIClases 4.0 features a comprehensive CI/CD system built with GitHub Actions, providing automated testing, security scanning, performance monitoring, and deployment capabilities.

## 🔄 Workflow Architecture

### 1. **Continuous Integration (`ci.yml`)**
Runs on every push and pull request to ensure code quality.

**Jobs:**
- **Code Quality**: ESLint, Prettier formatting checks
- **Type Checking**: TypeScript compilation verification
- **Testing**: Unit tests with coverage reporting
- **Build & Performance**: Production build with bundle analysis
- **E2E Tests**: Playwright end-to-end testing
- **Security Scan**: Vulnerability and secret scanning
- **Lighthouse CI**: Performance auditing

**Triggers:**
- Push to `main`, `develop`, `feature/*`, `hotfix/*`
- Pull requests to `main`, `develop`

### 2. **Deployment (`deploy.yml`)**
Automated deployment to staging and production environments.

**Features:**
- Environment-specific deployments
- Database migrations
- Post-deployment health checks
- Rollback capabilities
- Slack notifications

**Environments:**
- **Staging**: `develop` branch → `staging.aiclases.com`
- **Production**: `main` branch → `aiclases.com`

### 3. **Security & Compliance (`security.yml`)**
Daily security scanning and compliance checks.

**Security Checks:**
- Dependency vulnerability scanning
- Secret detection (API keys, tokens)
- Static Application Security Testing (SAST)
- License compliance verification
- Docker container security
- Infrastructure as Code (IaC) scanning

### 4. **Release Management (`release.yml`)**
Automated semantic versioning and release creation.

**Features:**
- Conventional commit parsing
- Automatic version bumping
- Release notes generation
- GitHub release creation
- Documentation updates

### 5. **Performance Monitoring (`performance.yml`)**
Continuous performance monitoring and regression detection.

**Monitoring:**
- Bundle size analysis
- Lighthouse CI scoring
- Core Web Vitals tracking
- Performance regression detection
- Alert system for degradations

## 🎯 Branch Strategy

```
main (production)
├── develop (staging)
├── feature/feature-name
├── hotfix/fix-name
└── release/version-number
```

### Branch Protections

**Main Branch:**
- Requires PR reviews (2 reviewers)
- Status checks must pass
- No direct pushes allowed
- Dismiss stale reviews on new commits

**Develop Branch:**
- Requires PR reviews (1 reviewer)
- Status checks must pass
- Allow administrators to bypass

## 🔐 Security Configuration

### Required Secrets

Add these secrets in GitHub Settings → Secrets and variables → Actions:

```bash
# Deployment
VERCEL_TOKEN=your_vercel_token
VERCEL_ORG_ID=your_org_id
VERCEL_PROJECT_ID=your_project_id

# Database
DATABASE_URL=your_production_database_url
SUPABASE_ACCESS_TOKEN=your_supabase_token

# Monitoring
CODECOV_TOKEN=your_codecov_token
LHCI_GITHUB_APP_TOKEN=your_lighthouse_token

# Notifications
SLACK_WEBHOOK_URL=your_slack_webhook
```

### Security Scanning

**Daily Scans:**
- Dependency vulnerabilities
- Secret exposure
- License compliance
- Container security

**PR Scans:**
- Code quality
- Security rules
- SAST analysis

## 📊 Performance Standards

### Lighthouse Thresholds
- **Performance**: ≥ 85
- **Accessibility**: ≥ 90
- **Best Practices**: ≥ 90
- **SEO**: ≥ 90
- **PWA**: ≥ 80

### Bundle Size Limits
- Main bundle: < 250kb gzipped
- Total JS: < 1MB gzipped
- First Load JS: < 130kb

## 🚀 Deployment Process

### Automatic Deployments

1. **Push to `develop`** → Staging deployment
2. **Push to `main`** → Production deployment

### Manual Deployments

```bash
# Trigger manual deployment
gh workflow run deploy.yml -f environment=production
```

### Deployment Steps

1. **Pre-deployment**: Security & quality checks
2. **Build**: Production build with optimizations
3. **Deploy**: Vercel deployment with environment configs
4. **Migrate**: Database migrations (production only)
5. **Test**: Post-deployment health checks
6. **Monitor**: Performance validation
7. **Notify**: Team notifications

## 🔄 Release Process

### Automatic Releases

Releases are triggered automatically on `main` branch pushes when:
- Conventional commits are detected
- Breaking changes, features, or fixes are present

### Manual Releases

```bash
# Create manual release
gh workflow run release.yml -f release_type=minor
```

### Version Bumping

- **major**: Breaking changes (`BREAKING CHANGE:`)
- **minor**: New features (`feat:`)
- **patch**: Bug fixes (`fix:`)

## 🧪 Testing Strategy

### Test Types

1. **Unit Tests**: Component and utility testing
2. **Integration Tests**: API and service testing  
3. **E2E Tests**: User workflow testing
4. **Performance Tests**: Lighthouse and bundle analysis
5. **Security Tests**: Vulnerability and compliance scanning

### Test Commands

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test --coverage

# Run E2E tests
pnpm test:e2e

# Run specific test file
pnpm test Button.test.tsx
```

## 📈 Monitoring & Alerts

### Performance Alerts

Automatic alerts are triggered when:
- Lighthouse performance score < 85
- Bundle size increases > 20%
- Core Web Vitals exceed thresholds

### Security Alerts

Immediate alerts for:
- High/Critical vulnerabilities
- Secret exposure
- Failed security scans
- License compliance issues

### Notification Channels

- **GitHub Issues**: Automatic issue creation
- **Slack**: Real-time notifications
- **Email**: Critical security alerts

## 🛠️ Configuration Files

### Lighthouse CI (`.lighthouserc.json`)
```json
{
  "ci": {
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.85 }]
      }
    }
  }
}
```

### ESLint Security (`.eslintrc.security.js`)
```javascript
module.exports = {
  plugins: ['security'],
  rules: {
    'security/detect-unsafe-regex': 'error'
  }
}
```

### CodeQL Configuration (`.github/codeql/codeql-config.yml`)
```yaml
queries:
  - uses: security-extended
paths:
  - apps/web/app
  - apps/web/components
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures:**
```bash
# Clear cache and reinstall
pnpm clean
pnpm install
pnpm build
```

**Test Failures:**
```bash
# Update snapshots
pnpm test -- --updateSnapshot

# Run tests in watch mode
pnpm test --watch
```

**Deployment Issues:**
```bash
# Check deployment logs
gh run list --workflow=deploy.yml
gh run view [run-id]
```

### Debug Commands

```bash
# View workflow status
gh workflow list

# Run workflow manually
gh workflow run ci.yml

# View recent runs
gh run list --limit 10

# Download artifacts
gh run download [run-id]
```

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Guide](https://vercel.com/docs)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [CodeQL Documentation](https://codeql.github.com/docs/)

## 🤝 Contributing

### PR Workflow

1. Create feature branch from `develop`
2. Make changes with conventional commits
3. Push branch and create PR
4. Wait for CI checks to pass
5. Request reviews
6. Merge when approved

### Commit Convention

```bash
feat: add new login component
fix: resolve authentication bug
docs: update API documentation
style: format code with prettier
refactor: reorganize component structure
test: add unit tests for utils
chore: update dependencies
```

## 📞 Support

For CI/CD issues:
1. Check [workflow runs](https://github.com/Cursalo/aiclases/actions)
2. Review [deployment logs](https://vercel.com/dashboard)
3. Contact DevOps team via Slack `#devops`

---

**Last Updated**: $(date)
**Version**: 1.0.0