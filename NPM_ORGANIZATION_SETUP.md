# NPM Organization Setup Guide

This document outlines the setup and configuration of NPM organizations for the ChatGPT-Buddy ecosystem packages.

## Overview

Based on the dependency audit, three NPM organizations are required:

1. **@typescript-eda** - Core event-driven architecture framework
2. **@web-buddy** - Generic web automation framework
3. **@chatgpt-buddy** - AI-powered automation implementation

## Organization Structure

### @typescript-eda Organization

**Purpose**: Foundational event-driven architecture framework
**Owner**: rydnr
**Packages**:
- `@typescript-eda/domain` - Core domain entities and events
- `@typescript-eda/infrastructure` - Infrastructure layer adapters
- `@typescript-eda/application` - Application orchestration layer
- `typescript-eda` - Main framework package (meta-package)

**Publishing Order**: 1st (Foundation)
**Dependencies**: None (only external npm packages)

### @web-buddy Organization

**Purpose**: Generic web automation framework built on TypeScript-EDA
**Owner**: rydnr
**Packages**:
- `@web-buddy/core` - Core automation framework
- `@web-buddy/contract-declaration` - Web app contract system
- `@web-buddy/nodejs-server` - Server coordination framework
- `@web-buddy/browser-extension` - Browser extension framework
- `@web-buddy/google-buddy` - Google services implementation
- `@web-buddy/framework` - Meta-package for ecosystem

**Publishing Order**: 2nd (Framework)
**Dependencies**: Depends on @typescript-eda packages

### @chatgpt-buddy Organization

**Purpose**: AI-powered automation implementation
**Owner**: rydnr
**Packages**:
- `@chatgpt-buddy/core` - Core ChatGPT automation logic
- `@chatgpt-buddy/server` - Node.js server implementation
- `@chatgpt-buddy/extension` - Browser extension
- `@chatgpt-buddy/client-ts` - TypeScript client SDK
- `chatgpt-buddy` - Main application package

**Publishing Order**: 3rd (Implementation)
**Dependencies**: Depends on both @typescript-eda and @web-buddy packages

## Organization Setup Steps

### 1. Create NPM Organizations

```bash
# Create @typescript-eda organization
npm org create typescript-eda

# Create @web-buddy organization  
npm org create web-buddy

# Create @chatgpt-buddy organization
npm org create chatgpt-buddy
```

### 2. Configure Organization Settings

For each organization:

1. **Access Control**:
   - Set organization to "Public" for open source packages
   - Add maintainer permissions for core team members
   - Configure two-factor authentication requirement

2. **Billing Configuration**:
   - Organizations are free for public packages
   - No billing setup required for open source

3. **Package Access**:
   - Set default package access to "Public"
   - Configure publish permissions for organization members

### 3. Organization Member Management

```bash
# Add members to organizations
npm org add typescript-eda <username>
npm org add web-buddy <username>
npm org add chatgpt-buddy <username>

# Set member roles
npm org role typescript-eda <username> developer
npm org role web-buddy <username> developer
npm org role chatgpt-buddy <username> developer
```

## Package Publishing Configuration

### Publishing Workflow

1. **Automated Publishing**:
   - GitHub Actions workflow for each repository
   - Triggered on version tags (v1.0.0, v1.0.1, etc.)
   - Automated dependency version updates

2. **Manual Publishing Fallback**:
   - Direct npm publish for emergency releases
   - Manual version coordination for major updates

### Package.json Configuration

Each package requires specific configuration:

```json
{
  "name": "@org-name/package-name",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "repository": {
    "type": "git",
    "url": "https://github.com/rydnr/package-name.git"
  }
}
```

### Version Management Strategy

1. **Semantic Versioning**:
   - Major.Minor.Patch (1.0.0)
   - Breaking changes increment major version
   - New features increment minor version
   - Bug fixes increment patch version

2. **Coordinated Releases**:
   - TypeScript-EDA packages released together
   - Web-Buddy packages released together
   - ChatGPT-Buddy packages released together

3. **Dependency Pinning**:
   - Pin exact versions for internal dependencies
   - Use caret (^) for external dependencies
   - Lock file commitment for reproducible builds

## CI/CD Integration

### GitHub Actions Workflow Template

```yaml
name: NPM Publishing
on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run tests
        run: npm test
      
      - name: Build package
        run: npm run build
      
      - name: Publish to NPM
        run: npm publish
        env:
          NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
```

### Required Secrets

For each repository:
- `NPM_TOKEN` - Authentication token for publishing
- `GITHUB_TOKEN` - For repository operations (automatically provided)

## Security Considerations

### Package Security

1. **Vulnerability Scanning**:
   - npm audit on every build
   - Dependabot security updates
   - Regular dependency updates

2. **Access Control**:
   - Two-factor authentication required
   - Limited publish permissions
   - Audit logging enabled

3. **Code Signing**:
   - Package integrity verification
   - Provenance tracking
   - Supply chain security

### Token Management

1. **NPM Tokens**:
   - Organization-scoped tokens
   - Time-limited tokens where possible
   - Regular token rotation

2. **Repository Secrets**:
   - Environment-specific tokens
   - Minimal required permissions
   - Regular secret auditing

## Migration Timeline

### Phase 1: Organization Setup (Week 1)
- [ ] Create NPM organizations
- [ ] Configure organization settings
- [ ] Set up access control

### Phase 2: Repository Preparation (Week 2)
- [ ] Update package.json configurations
- [ ] Set up CI/CD workflows
- [ ] Configure publishing scripts

### Phase 3: Initial Publishing (Week 3)
- [ ] Publish TypeScript-EDA packages
- [ ] Publish Web-Buddy packages
- [ ] Publish ChatGPT-Buddy packages

### Phase 4: Validation (Week 4)
- [ ] Test package installations
- [ ] Validate dependency resolution
- [ ] Document integration examples

## Troubleshooting

### Common Issues

1. **Publishing Failures**:
   - Check NPM token permissions
   - Verify package.json configuration
   - Review organization membership

2. **Dependency Resolution**:
   - Clear npm cache: `npm cache clean --force`
   - Remove node_modules and reinstall
   - Check version compatibility

3. **Access Denied**:
   - Verify organization membership
   - Check two-factor authentication
   - Confirm package scope permissions

### Support Resources

- NPM Support: https://www.npmjs.com/support
- Organization Documentation: https://docs.npmjs.com/organizations
- Publishing Guide: https://docs.npmjs.com/packages-and-modules/contributing-packages-to-the-registry

## Next Steps

After organization setup:
1. Create repository templates and CI/CD workflows
2. Migrate code to separate repositories
3. Configure cross-package dependencies
4. Set up automated publishing
5. Create migration guides for users

This setup provides the foundation for the multi-repository publishing strategy outlined in the dependency audit.