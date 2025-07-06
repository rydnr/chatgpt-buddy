# NPM Organization Setup Guide for @semantest

This document provides comprehensive instructions for setting up and managing the @semantest NPM organization, including package publishing workflows, access control, and migration strategies.

## Table of Contents

1. [Creating the @semantest Organization](#creating-the-semantest-organization)
2. [Package Publishing Workflow](#package-publishing-workflow)
3. [Access Control and Team Management](#access-control-and-team-management)
4. [Version Management Strategy](#version-management-strategy)
5. [Automated Publishing with GitHub Actions](#automated-publishing-with-github-actions)
6. [Security Considerations](#security-considerations)
7. [Package Scope and Naming Conventions](#package-scope-and-naming-conventions)
8. [Migration Strategy](#migration-strategy)
9. [Troubleshooting](#troubleshooting)

## Creating the @semantest Organization

### Prerequisites Checklist

- [ ] NPM account with verified email address
- [ ] Organization name `semantest` is available
- [ ] Payment method configured (if planning private packages)
- [ ] Team member NPM accounts collected
- [ ] 2FA enabled on owner account

### Step-by-Step Organization Creation

1. **Login to NPM**
   ```bash
   npm login
   ```

2. **Create Organization**
   - Navigate to https://www.npmjs.com/org/create
   - Enter organization name: `semantest`
   - Select plan: Public (recommended for open source)
   - Accept terms and create organization

3. **Configure Organization Settings**
   ```bash
   # Set organization defaults
   npm config set @semantest:registry https://registry.npmjs.org/
   ```

4. **Verify Organization**
   ```bash
   npm org ls semantest
   ```

## Package Publishing Workflow

### Initial Package Setup

1. **Configure package.json**
   ```json
   {
     "name": "@semantest/package-name",
     "version": "1.0.0",
     "publishConfig": {
       "access": "public",
       "registry": "https://registry.npmjs.org/"
     },
     "files": [
       "dist",
       "src",
       "README.md",
       "CHANGELOG.md"
     ],
     "scripts": {
       "prepublishOnly": "npm run clean && npm run build && npm run test"
     }
   }
   ```

2. **Add .npmignore**
   ```
   # Development files
   *.test.ts
   *.spec.ts
   __tests__/
   coverage/
   .github/
   .vscode/
   
   # Source maps (optional)
   *.map
   
   # Configuration
   .eslintrc*
   .prettierrc*
   jest.config.*
   tsconfig.json
   
   # Build artifacts
   *.log
   node_modules/
   ```

### Manual Publishing Process

1. **Pre-publish Checklist**
   - [ ] All tests passing
   - [ ] Build successful
   - [ ] Version bumped appropriately
   - [ ] CHANGELOG.md updated
   - [ ] README.md current
   - [ ] No sensitive data in code

2. **Publish Command**
   ```bash
   # Dry run first
   npm publish --dry-run
   
   # Actual publish
   npm publish --access public
   
   # With OTP (if 2FA enabled)
   npm publish --otp=123456
   ```

3. **Post-publish Verification**
   ```bash
   # Check package page
   npm view @semantest/package-name
   
   # Test installation
   npm install @semantest/package-name
   ```

## Access Control and Team Management

### Team Structure

```
@semantest
├── owners (full control)
│   ├── founder@semantest.com
│   └── cto@semantest.com
├── maintainers (publish rights)
│   ├── lead-dev@semantest.com
│   └── senior-dev@semantest.com
└── developers (read-only)
    ├── dev1@semantest.com
    └── dev2@semantest.com
```

### Managing Teams

1. **Create Teams**
   ```bash
   npm team create @semantest:maintainers
   npm team create @semantest:developers
   ```

2. **Add Members**
   ```bash
   npm team add @semantest:maintainers username
   npm team add @semantest:developers username
   ```

3. **Grant Package Access**
   ```bash
   npm access grant read-write @semantest:maintainers @semantest/package-name
   npm access grant read-only @semantest:developers @semantest/package-name
   ```

4. **List Access**
   ```bash
   npm access ls-packages @semantest:maintainers
   npm access ls-collaborators @semantest/package-name
   ```

### Access Control Matrix

| Action | Owners | Maintainers | Developers | Public |
|--------|--------|-------------|------------|--------|
| View Package | ✓ | ✓ | ✓ | ✓ |
| Install Package | ✓ | ✓ | ✓ | ✓ |
| Publish Version | ✓ | ✓ | ✗ | ✗ |
| Deprecate Version | ✓ | ✓ | ✗ | ✗ |
| Manage Access | ✓ | ✗ | ✗ | ✗ |
| Delete Package | ✓ | ✗ | ✗ | ✗ |

## Version Management Strategy

### Semantic Versioning

Follow strict semantic versioning (semver):
- **MAJOR.MINOR.PATCH** (e.g., 2.1.3)
- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Version Lifecycle

1. **Development Versions**
   ```bash
   # Alpha releases (internal testing)
   npm version prerelease --preid=alpha
   # 2.0.0-alpha.0
   
   # Beta releases (external testing)
   npm version prerelease --preid=beta
   # 2.0.0-beta.0
   
   # Release candidates
   npm version prerelease --preid=rc
   # 2.0.0-rc.0
   ```

2. **Release Tags**
   ```bash
   # Latest stable
   npm publish --tag latest
   
   # Next version (pre-release)
   npm publish --tag next
   
   # Legacy support
   npm publish --tag legacy
   ```

3. **Version Bumping**
   ```bash
   # Patch release
   npm version patch -m "Fix: %s"
   
   # Minor release
   npm version minor -m "Feature: %s"
   
   # Major release
   npm version major -m "Breaking: %s"
   ```

### Deprecation Policy

```bash
# Deprecate old version
npm deprecate @semantest/package@"< 2.0.0" "Please upgrade to v2.0.0 or higher"

# Deprecate specific version
npm deprecate @semantest/package@1.5.0 "Security vulnerability, upgrade to 1.5.1"
```

## Automated Publishing with GitHub Actions

### Basic Publish Workflow

Create `.github/workflows/publish.yml`:

```yaml
name: Publish to NPM

on:
  release:
    types: [published]

jobs:
  publish:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        registry-url: 'https://registry.npmjs.org'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run tests
      run: npm test
    
    - name: Build package
      run: npm run build
    
    - name: Publish to NPM
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Advanced Monorepo Workflow

Create `.github/workflows/publish-monorepo.yml`:

```yaml
name: Publish Monorepo Packages

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        package:
          - browser
          - server
          - testing
          - contracts
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        registry-url: 'https://registry.npmjs.org'
    
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: 8
    
    - name: Get pnpm store directory
      id: pnpm-cache
      shell: bash
      run: echo "STORE_PATH=$(pnpm store path)" >> $GITHUB_OUTPUT
    
    - name: Setup pnpm cache
      uses: actions/cache@v3
      with:
        path: ${{ steps.pnpm-cache.outputs.STORE_PATH }}
        key: ${{ runner.os }}-pnpm-store-${{ hashFiles('**/pnpm-lock.yaml') }}
        restore-keys: |
          ${{ runner.os }}-pnpm-store-
    
    - name: Install dependencies
      run: pnpm install --frozen-lockfile
    
    - name: Build all packages
      run: pnpm run -r build
    
    - name: Test package
      run: pnpm run test --filter @semantest/${{ matrix.package }}
    
    - name: Publish package
      run: |
        cd packages/${{ matrix.package }}
        npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Automated Version Bumping

Create `.github/workflows/version-bump.yml`:

```yaml
name: Version Bump

on:
  workflow_dispatch:
    inputs:
      version:
        description: 'Version type'
        required: true
        type: choice
        options:
          - patch
          - minor
          - major
          - prerelease

jobs:
  version-bump:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
      with:
        token: ${{ secrets.GITHUB_TOKEN }}
        fetch-depth: 0
    
    - name: Configure Git
      run: |
        git config user.name "semantest-bot"
        git config user.email "bot@semantest.com"
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
    
    - name: Bump version
      run: |
        npm version ${{ github.event.inputs.version }} -m "chore: bump version to %s"
    
    - name: Push changes
      run: |
        git push origin main --follow-tags
```

## Security Considerations

### 2FA Configuration

1. **Enable 2FA for Organization**
   - Navigate to organization settings
   - Security → Enable 2FA requirement
   - Set grace period for team members

2. **Configure Auth Tokens**
   ```bash
   # Generate automation token
   npm token create --read-only=false --cidr=0.0.0.0/0
   
   # List tokens
   npm token list
   
   # Revoke compromised token
   npm token revoke <token-id>
   ```

### Access Token Management

1. **GitHub Secrets Setup**
   - Repository Settings → Secrets → Actions
   - Add `NPM_TOKEN` with publish token
   - Add `GITHUB_TOKEN` for workflow permissions

2. **Token Security Checklist**
   - [ ] Use minimal required permissions
   - [ ] Set CIDR restrictions when possible
   - [ ] Rotate tokens quarterly
   - [ ] Audit token usage monthly
   - [ ] Never commit tokens to repository

### Package Security

1. **Dependency Scanning**
   ```bash
   # Audit dependencies
   npm audit
   
   # Fix vulnerabilities
   npm audit fix
   
   # Check for updates
   npm outdated
   ```

2. **Pre-publish Security Check**
   ```json
   {
     "scripts": {
       "prepublishOnly": "npm audit && npm run test:security"
     }
   }
   ```

3. **Package Signing** (Beta feature)
   ```bash
   # Enable package signing
   npm config set sign-git-tag true
   ```

## Package Scope and Naming Conventions

### Naming Structure

```
@semantest/<category>-<component>
```

### Categories

| Category | Description | Examples |
|----------|-------------|----------|
| `core` | Core framework packages | `@semantest/browser`, `@semantest/server` |
| `contracts` | Contract definitions | `@semantest/contracts-google`, `@semantest/contracts-chatgpt` |
| `plugins` | Extension plugins | `@semantest/plugin-auth`, `@semantest/plugin-storage` |
| `tools` | Development tools | `@semantest/cli`, `@semantest/generator` |
| `adapters` | Third-party integrations | `@semantest/adapter-playwright`, `@semantest/adapter-puppeteer` |

### Package Metadata Standards

```json
{
  "name": "@semantest/category-component",
  "description": "Brief description starting with verb",
  "keywords": [
    "semantest",
    "category",
    "primary-feature",
    "secondary-feature"
  ],
  "homepage": "https://semantest.com/packages/category-component",
  "repository": {
    "type": "git",
    "url": "https://github.com/semantest/semantest.git",
    "directory": "packages/category-component"
  },
  "bugs": "https://github.com/semantest/semantest/issues",
  "semantest": {
    "category": "core|contracts|plugins|tools|adapters",
    "tier": 1,
    "maturity": "experimental|stable|deprecated"
  }
}
```

## Migration Strategy

### Phase 1: Preparation (Week 1-2)

1. **Inventory Current Packages**
   ```bash
   # List all @web-buddy packages
   npm ls -g --depth=0 | grep @web-buddy
   ```

2. **Create Migration Map**
   | Old Package | New Package | Breaking Changes |
   |-------------|-------------|------------------|
   | `@web-buddy/core` | `@semantest/browser` | Class renames |
   | `@web-buddy/server` | `@semantest/server` | Config keys |
   | `@web-buddy/extension` | `@semantest/extension` | Message types |

3. **Setup Compatibility Layer**
   ```typescript
   // compatibility/index.ts
   export { SemanTestClient as WebBuddyClient } from '@semantest/browser';
   export { SEMANTEST_READY as WEB_BUDDY_READY } from '@semantest/browser';
   ```

### Phase 2: Dual Publishing (Week 3-4)

1. **Publish to Both Scopes**
   ```bash
   # Publish as @semantest
   npm publish --access public
   
   # Publish compatibility package
   cd compatibility
   npm publish @web-buddy/core-compat --access public
   ```

2. **Add Deprecation Notices**
   ```bash
   npm deprecate @web-buddy/core "Moved to @semantest/browser"
   ```

### Phase 3: Migration Support (Week 5-8)

1. **Migration Script**
   ```bash
   npx @semantest/migrate --from=@web-buddy --to=@semantest
   ```

2. **Update Documentation**
   - Migration guides
   - API differences
   - Code examples

### Phase 4: Sunset (Week 9-12)

1. **Final Deprecation**
   ```bash
   npm deprecate @web-buddy/core@"*" "Package sunset - use @semantest/browser"
   ```

2. **Archive Repositories**
   - Move old repos to archive org
   - Update README with migration info

### Migration Checklist

- [ ] All packages published under @semantest
- [ ] Compatibility packages available
- [ ] Migration documentation complete
- [ ] Automated migration tools tested
- [ ] Customer communication sent
- [ ] Deprecation notices published
- [ ] Support channels updated
- [ ] Old packages deprecated
- [ ] Monitoring migration metrics

## Troubleshooting

### Common Issues and Solutions

1. **Permission Denied on Publish**
   ```bash
   # Check authentication
   npm whoami
   
   # Verify team membership
   npm team ls @semantest:maintainers
   
   # Check package access
   npm access ls-collaborators @semantest/package-name
   ```

2. **Version Conflict**
   ```bash
   # Force publish specific version
   npm publish --force
   
   # Unpublish within 72 hours
   npm unpublish @semantest/package@1.0.0
   ```

3. **2FA Token Issues**
   ```bash
   # Publish with OTP
   npm publish --otp=123456
   
   # Configure auth-only 2FA
   npm profile set auth-and-writes=auth-only
   ```

4. **Scoped Package Not Found**
   ```bash
   # Ensure scope is configured
   npm config set @semantest:registry https://registry.npmjs.org/
   
   # Clear cache
   npm cache clean --force
   ```

### Emergency Procedures

1. **Compromised Token**
   ```bash
   # Immediately revoke all tokens
   npm token revoke --all
   
   # Generate new tokens
   npm token create
   
   # Update CI/CD secrets
   ```

2. **Accidental Publish**
   ```bash
   # Unpublish within 72 hours
   npm unpublish @semantest/package@version
   
   # Deprecate if beyond 72 hours
   npm deprecate @semantest/package@version "Accidental publish - do not use"
   ```

3. **Broken Package Published**
   ```bash
   # Immediate patch release
   npm version patch
   npm publish
   
   # Deprecate broken version
   npm deprecate @semantest/package@broken-version "Critical bug - upgrade immediately"
   ```

## Monitoring and Metrics

### Key Metrics to Track

1. **Download Statistics**
   ```bash
   # Check weekly downloads
   npm view @semantest/package downloads
   ```

2. **Dependency Analysis**
   - https://www.npmjs.com/package/@semantest/package?activeTab=dependents
   - Track dependent packages
   - Monitor breaking change impact

3. **Security Metrics**
   - Vulnerability reports
   - Token usage audit
   - 2FA compliance rate

### Useful Resources

- [NPM Documentation](https://docs.npmjs.com/)
- [NPM Organizations Guide](https://docs.npmjs.com/organizations)
- [Semantic Versioning Specification](https://semver.org/)
- [NPM Security Best Practices](https://docs.npmjs.com/packages-and-modules/securing-your-code)
- [GitHub Actions NPM Publish](https://docs.github.com/en/actions/publishing-packages/publishing-nodejs-packages)

---

*Last Updated: January 2025*
*Maintained by: Semantest DevOps Team*
*Questions: devops@semantest.com*