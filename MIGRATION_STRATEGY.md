# Repository Migration Strategy

This document outlines the comprehensive strategy for migrating from the current monorepo structure to a multi-repository ecosystem while preserving git history and maintaining backward compatibility.

## Overview

The TypeScript-EDA ecosystem will be split into **8 separate repositories** organized in **3 layers**:

### Foundation Layer (TypeScript-EDA)
- `@typescript-eda/domain` - Core domain patterns
- `@typescript-eda/infrastructure` - Infrastructure adapters
- `@typescript-eda/application` - Application orchestration

### Framework Layer (Web-Buddy)
- `@web-buddy/nodejs-server` - Event-driven server framework
- `@web-buddy/browser-extension` - Browser extension framework

### Implementation Layer (ChatGPT-Buddy)
- `@chatgpt-buddy/server` - AI-enhanced automation server
- `@chatgpt-buddy/extension` - AI automation browser extension
- `@chatgpt-buddy/client` - TypeScript/Python SDKs

## Migration Phases

### Phase 1: Preparation (Current)
✅ **Completed:**
- Repository structure analysis
- Dependency mapping
- Migration scripts creation
- Documentation preparation

🔄 **In Progress:**
- Git history preservation setup
- NPM publishing configuration

### Phase 2: Repository Extraction
**Duration:** 1-2 weeks

1. **Run Migration Scripts**
   ```bash
   ./scripts/prepare-repository-migration.sh
   ./scripts/configure-npm-publishing.sh
   ./scripts/validate-migration.sh
   ```

2. **Create GitHub Repositories**
   - Set up 8 new repositories
   - Configure repository settings
   - Set up branch protection rules

3. **Transfer Code with History**
   - Push extracted repositories to GitHub
   - Verify git history preservation
   - Set up repository links and documentation

### Phase 3: NPM Organizations Setup
**Duration:** 1 week

1. **Create NPM Organizations**
   ```bash
   npm org:create @typescript-eda
   npm org:create @web-buddy
   npm org:create @chatgpt-buddy
   ```

2. **Configure Publishing Access**
   - Set up organization memberships
   - Configure publishing permissions
   - Set up automation tokens

### Phase 4: Initial Publishing
**Duration:** 1-2 weeks

1. **Foundation Layer Publishing**
   - Publish `@typescript-eda/domain` first
   - Publish `@typescript-eda/infrastructure`
   - Publish `@typescript-eda/application`

2. **Framework Layer Publishing**
   - Publish `@web-buddy/nodejs-server`
   - Publish `@web-buddy/browser-extension`

3. **Implementation Layer Publishing**
   - Publish `@chatgpt-buddy/server`
   - Publish `@chatgpt-buddy/extension` 
   - Publish `@chatgpt-buddy/client`

### Phase 5: Integration & Testing
**Duration:** 1-2 weeks

1. **Cross-Package Integration Tests**
   - Run ecosystem integration tests
   - Verify package compatibility
   - Test dependency resolution

2. **Documentation Updates**
   - Update all README files
   - Update ecosystem documentation
   - Create migration guides for users

### Phase 6: Production Rollout
**Duration:** 2-3 weeks

1. **Gradual Migration**
   - Support both monorepo and multi-repo
   - Provide migration tools for users
   - Monitor for issues

2. **Deprecation Planning**
   - Plan monorepo deprecation timeline
   - Communicate changes to users
   - Provide support during transition

## Technical Implementation

### Git History Preservation

The migration uses `git filter-repo` (preferred) or `git filter-branch` (fallback) to:
- Extract relevant paths for each repository
- Preserve commit history and authorship
- Maintain file modification dates
- Keep git blame information

### Dependency Management

**Publishing Order (Critical):**
1. `@typescript-eda/domain` (no dependencies)
2. `@typescript-eda/infrastructure` (depends on domain)
3. `@typescript-eda/application` (depends on domain + infrastructure)
4. `@web-buddy/nodejs-server` (depends on all TypeScript-EDA)
5. `@web-buddy/browser-extension` (depends on all TypeScript-EDA)
6. `@chatgpt-buddy/server` (depends on TypeScript-EDA + Web-Buddy server)
7. `@chatgpt-buddy/extension` (depends on TypeScript-EDA + Web-Buddy extension)
8. `@chatgpt-buddy/client` (depends on TypeScript-EDA)

**Version Strategy:**
- Use semantic versioning (semver)
- Lock major versions across ecosystem
- Use `^1.0.0` for ecosystem dependencies

### CI/CD Pipeline

Each repository includes:
- **Automated Testing**: Jest, ESLint, TypeScript compilation
- **Automated Publishing**: Tag-based releases to NPM
- **Quality Gates**: Tests must pass before publishing
- **GitHub Releases**: Automatic release notes generation

### Backward Compatibility

**During Transition Period (3-6 months):**
- Monorepo remains functional
- Both import styles supported:
  ```typescript
  // Old (monorepo)
  import { Event } from '../typescript-eda/domain';
  
  // New (multi-repo)
  import { Event } from '@typescript-eda/domain';
  ```
- Migration tools provided for automated updates

## Risk Management

### Identified Risks & Mitigations

1. **Dependency Hell**
   - *Risk*: Version conflicts between packages
   - *Mitigation*: Strict version compatibility matrix, integration tests

2. **Publishing Failures**
   - *Risk*: Failed publishes break dependency chain
   - *Mitigation*: Dependency order enforcement, rollback procedures

3. **Git History Loss**
   - *Risk*: Important commit history lost during extraction
   - *Mitigation*: Multiple extraction methods, validation scripts

4. **User Migration Complexity**
   - *Risk*: Users struggle with migration
   - *Mitigation*: Automated migration tools, comprehensive documentation

5. **Performance Impact**
   - *Risk*: Multiple packages slow down installation
   - *Mitigation*: Optimized package sizes, lazy loading patterns

### Rollback Strategy

If critical issues arise:
1. **Immediate**: Revert to monorepo structure
2. **Communication**: Notify users immediately
3. **Issue Resolution**: Fix problems in isolated environment
4. **Gradual Re-release**: Restart migration with fixes

## Success Metrics

### Technical Metrics
- ✅ 100% git history preservation
- ✅ All packages successfully published
- ✅ Cross-package integration tests pass
- ✅ Zero breaking changes for existing users

### Adoption Metrics
- NPM download statistics for new packages
- GitHub stars/forks for new repositories
- Community feedback and issue reports
- Migration completion rate by users

### Performance Metrics
- Package installation time improvements
- Bundle size optimizations
- Build time reductions
- Developer experience scores

## Timeline

### Overall Timeline: 8-12 weeks

| Week | Phase | Activities |
|------|-------|------------|
| 1-2 | Preparation | Complete migration scripts, validation |
| 3-4 | Extraction | Create repositories, transfer code |
| 5-6 | NPM Setup | Organizations, publishing, initial releases |
| 7-8 | Integration | Testing, documentation, bug fixes |
| 9-10 | Rollout | User migration, support, monitoring |
| 11-12 | Completion | Deprecation planning, final cleanup |

## Communication Plan

### Internal Team
- **Weekly sync meetings** during migration
- **Slack channel** for real-time coordination
- **GitHub project board** for task tracking

### Community
- **Blog post** announcing migration plans
- **GitHub discussions** for community input
- **Migration guides** and documentation
- **Office hours** for user support

### Documentation Updates
- Update ecosystem documentation
- Create migration examples
- Record video tutorials
- Update getting started guides

## Post-Migration Benefits

### For Developers
- **Clearer dependencies**: Know exactly what you're importing
- **Smaller bundle sizes**: Use only what you need
- **Better caching**: NPM/bundler can cache packages independently
- **Focused repositories**: Easier to contribute to specific areas

### For Framework Evolution
- **Independent versioning**: Update packages at different rates
- **Specialized teams**: Teams can own specific packages
- **Better testing**: Isolated testing for each package
- **Easier maintenance**: Smaller codebases per repository

### For Ecosystem Growth
- **Plugin architecture**: Easy to add new implementations
- **Third-party extensions**: Community can build on Web-Buddy
- **Reusable components**: TypeScript-EDA usable in other projects
- **Professional appearance**: Mature multi-repo structure

## Resources

### Scripts & Tools
- `scripts/prepare-repository-migration.sh` - Extract repositories with git history
- `scripts/configure-npm-publishing.sh` - Set up NPM publishing workflow
- `scripts/validate-migration.sh` - Validate migration setup

### Documentation
- `PUBLISHING_GUIDE.md` - Detailed publishing instructions
- `docs/ecosystem-overview.html` - Visual ecosystem documentation
- `docs/migration-guides.html` - User migration guides

### External Tools
- **git-filter-repo**: For clean git history extraction
- **jq**: For JSON manipulation in scripts
- **GitHub CLI**: For repository automation
- **NPM CLI**: For organization and publishing management

This migration represents a significant evolution in the TypeScript-EDA ecosystem architecture, positioning it for long-term growth and community adoption while maintaining the high quality and consistency users expect.