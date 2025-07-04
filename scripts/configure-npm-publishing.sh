#!/bin/bash

# NPM Publishing Configuration Script
# This script configures NPM publishing order and dependency management
# for the TypeScript-EDA ecosystem.

set -euo pipefail

echo "📦 Configuring NPM Publishing Order & Dependency Management"
echo "=========================================================="

# Define publishing order (dependencies first)
PUBLISHING_ORDER=(
    "typescript-eda-domain"
    "typescript-eda-infrastructure" 
    "typescript-eda-application"
    "web-buddy-nodejs-server"
    "web-buddy-browser-extension"
    "chatgpt-buddy-server"
    "chatgpt-buddy-extension"
    "chatgpt-buddy-client"
)

# Define dependency relationships
declare -A DEPENDENCIES=(
    ["typescript-eda-infrastructure"]="@typescript-eda/domain"
    ["typescript-eda-application"]="@typescript-eda/domain @typescript-eda/infrastructure"
    ["web-buddy-nodejs-server"]="@typescript-eda/domain @typescript-eda/infrastructure @typescript-eda/application"
    ["web-buddy-browser-extension"]="@typescript-eda/domain @typescript-eda/infrastructure @typescript-eda/application"
    ["chatgpt-buddy-server"]="@typescript-eda/domain @typescript-eda/infrastructure @typescript-eda/application @web-buddy/nodejs-server"
    ["chatgpt-buddy-extension"]="@typescript-eda/domain @typescript-eda/infrastructure @typescript-eda/application @web-buddy/browser-extension"
    ["chatgpt-buddy-client"]="@typescript-eda/domain @typescript-eda/infrastructure @typescript-eda/application"
)

# Define package-specific additional dependencies
declare -A ADDITIONAL_DEPS=(
    ["web-buddy-nodejs-server"]="express cors helmet compression morgan winston express-rate-limit"
    ["web-buddy-browser-extension"]="webextension-polyfill"
    ["chatgpt-buddy-server"]="openai anthropic axios dotenv"
    ["chatgpt-buddy-extension"]="openai axios"
    ["chatgpt-buddy-client"]="axios ws"
)

MIGRATION_DIR="./migration-workspace"

# Function to update package.json with correct dependencies
update_package_dependencies() {
    local repo_name="$1"
    local package_file="$MIGRATION_DIR/$repo_name/package.json"
    
    echo "🔄 Updating dependencies for $repo_name"
    
    if [ ! -f "$package_file" ]; then
        echo "❌ Package.json not found for $repo_name"
        return 1
    fi
    
    # Create a temporary file for jq operations
    local temp_file=$(mktemp)
    
    # Add TypeScript-EDA ecosystem dependencies
    local deps="${DEPENDENCIES[$repo_name]:-}"
    if [ -n "$deps" ]; then
        echo "  📦 Adding ecosystem dependencies: $deps"
        for dep in $deps; do
            jq --arg dep "$dep" --arg version "^1.0.0" '.dependencies[$dep] = $version' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
        done
    fi
    
    # Add additional package-specific dependencies
    local additional="${ADDITIONAL_DEPS[$repo_name]:-}"
    if [ -n "$additional" ]; then
        echo "  📦 Adding additional dependencies: $additional"
        for dep in $additional; do
            # Define versions for common packages
            local version="^1.0.0"
            case "$dep" in
                "express") version="^4.18.0" ;;
                "cors") version="^2.8.5" ;;
                "helmet") version="^7.0.0" ;;
                "compression") version="^1.7.4" ;;
                "morgan") version="^1.10.0" ;;
                "winston") version="^3.8.0" ;;
                "express-rate-limit") version="^6.7.0" ;;
                "webextension-polyfill") version="^0.10.0" ;;
                "openai") version="^4.0.0" ;;
                "anthropic") version="^0.20.0" ;;
                "axios") version="^1.4.0" ;;
                "dotenv") version="^16.0.0" ;;
                "ws") version="^8.13.0" ;;
            esac
            
            jq --arg dep "$dep" --arg version "$version" '.dependencies[$dep] = $version' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
        done
    fi
    
    # Add common devDependencies for all packages
    echo "  🛠️  Adding common devDependencies"
    local dev_deps=(
        "@types/jest:^29.5.0"
        "@types/node:^18.15.0"
        "@typescript-eslint/eslint-plugin:^5.57.0"
        "@typescript-eslint/parser:^5.57.0"
        "eslint:^8.37.0"
        "jest:^29.5.0"
        "ts-jest:^29.1.0"
        "typescript:^5.0.0"
    )
    
    for dep_version in "${dev_deps[@]}"; do
        local dep="${dep_version%:*}"
        local version="${dep_version#*:}"
        jq --arg dep "$dep" --arg version "$version" '.devDependencies[$dep] = $version' "$package_file" > "$temp_file"
        mv "$temp_file" "$package_file"
    done
    
    # Add package-specific devDependencies
    case "$repo_name" in
        "web-buddy-nodejs-server"|"chatgpt-buddy-server")
            echo "  🛠️  Adding server-specific devDependencies"
            jq '.devDependencies["@types/express"] = "^4.17.0"' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
            jq '.devDependencies["@types/cors"] = "^2.8.0"' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
            jq '.devDependencies["nodemon"] = "^2.0.0"' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
            ;;
        "web-buddy-browser-extension"|"chatgpt-buddy-extension")
            echo "  🛠️  Adding extension-specific devDependencies"
            jq '.devDependencies["@types/webextension-polyfill"] = "^0.10.0"' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
            jq '.devDependencies["web-ext"] = "^7.6.0"' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
            ;;
        "chatgpt-buddy-client")
            echo "  🛠️  Adding client-specific devDependencies"
            jq '.devDependencies["@types/ws"] = "^8.5.0"' "$package_file" > "$temp_file"
            mv "$temp_file" "$package_file"
            ;;
    esac
    
    # Clean up temporary file
    rm -f "$temp_file"
    
    echo "✅ Updated dependencies for $repo_name"
}

# Function to create publishing workflow
create_publishing_workflow() {
    local repo_name="$1"
    local workflow_file="$MIGRATION_DIR/$repo_name/.github/workflows/publish.yml"
    
    echo "🚀 Creating publishing workflow for $repo_name"
    
    mkdir -p "$(dirname "$workflow_file")"
    
    cat > "$workflow_file" << 'EOF'
name: Publish Package

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        registry-url: 'https://registry.npmjs.org'
    
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
    
    - name: Create GitHub Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        body: |
          Changes in this Release
          - Update package dependencies
          - Bug fixes and improvements
        draft: false
        prerelease: false
EOF

    echo "✅ Created publishing workflow for $repo_name"
}

# Function to create version bump script
create_version_scripts() {
    local repo_name="$1"
    local target_dir="$MIGRATION_DIR/$repo_name"
    
    echo "📋 Creating version management scripts for $repo_name"
    
    mkdir -p "$target_dir/scripts"
    
    # Create version bump script
    cat > "$target_dir/scripts/version-bump.sh" << 'EOF'
#!/bin/bash

# Version bump script for automated releases
# Usage: ./scripts/version-bump.sh [patch|minor|major]

set -euo pipefail

VERSION_TYPE=${1:-patch}

echo "🔄 Bumping $VERSION_TYPE version..."

# Update package.json version
npm version "$VERSION_TYPE" --no-git-tag-version

# Get new version
NEW_VERSION=$(node -p "require('./package.json').version")

echo "📦 New version: $NEW_VERSION"

# Create git tag
git add package.json
git commit -m "chore: bump version to $NEW_VERSION

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git tag "v$NEW_VERSION"

echo "✅ Version bumped to $NEW_VERSION"
echo "🚀 Push with: git push origin main --tags"
EOF

    chmod +x "$target_dir/scripts/version-bump.sh"
    
    # Create release preparation script
    cat > "$target_dir/scripts/prepare-release.sh" << 'EOF'
#!/bin/bash

# Release preparation script
# Runs all checks before publishing

set -euo pipefail

echo "🔍 Preparing release..."

echo "🧪 Running tests..."
npm test

echo "🔍 Running linter..."
npm run lint

echo "🏗️  Building package..."
npm run build

echo "📦 Checking package contents..."
npm pack --dry-run

echo "✅ Release preparation complete!"
echo "🚀 Ready to publish!"
EOF

    chmod +x "$target_dir/scripts/prepare-release.sh"
    
    echo "✅ Created version management scripts for $repo_name"
}

# Function to create cross-package integration test
create_integration_tests() {
    echo "🧪 Creating cross-package integration tests"
    
    local integration_dir="$MIGRATION_DIR/integration-tests"
    mkdir -p "$integration_dir"
    
    cat > "$integration_dir/package.json" << 'EOF'
{
  "name": "typescript-eda-integration-tests",
  "version": "1.0.0",
  "description": "Integration tests for TypeScript-EDA ecosystem",
  "private": true,
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  },
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^18.15.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  },
  "dependencies": {
    "@typescript-eda/domain": "^1.0.0",
    "@typescript-eda/infrastructure": "^1.0.0",
    "@typescript-eda/application": "^1.0.0",
    "@web-buddy/nodejs-server": "^1.0.0",
    "@web-buddy/browser-extension": "^1.0.0",
    "@chatgpt-buddy/server": "^1.0.0",
    "@chatgpt-buddy/extension": "^1.0.0",
    "@chatgpt-buddy/client": "^1.0.0"
  }
}
EOF

    cat > "$integration_dir/jest.config.js" << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.integration.test.ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'tests/**/*.ts',
    '!tests/**/*.d.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  testTimeout: 30000,
};
EOF

    mkdir -p "$integration_dir/tests"
    
    cat > "$integration_dir/tests/ecosystem.integration.test.ts" << 'EOF'
/**
 * Cross-package integration tests for TypeScript-EDA ecosystem
 */

describe('TypeScript-EDA Ecosystem Integration', () => {
  describe('Package Loading', () => {
    it('should load all foundation packages', async () => {
      const domain = await import('@typescript-eda/domain');
      const infrastructure = await import('@typescript-eda/infrastructure');
      const application = await import('@typescript-eda/application');
      
      expect(domain).toBeDefined();
      expect(infrastructure).toBeDefined();
      expect(application).toBeDefined();
    });
    
    it('should load Web-Buddy framework packages', async () => {
      const server = await import('@web-buddy/nodejs-server');
      const extension = await import('@web-buddy/browser-extension');
      
      expect(server).toBeDefined();
      expect(extension).toBeDefined();
    });
    
    it('should load ChatGPT-Buddy implementation packages', async () => {
      const server = await import('@chatgpt-buddy/server');
      const extension = await import('@chatgpt-buddy/extension');
      const client = await import('@chatgpt-buddy/client');
      
      expect(server).toBeDefined();
      expect(extension).toBeDefined();
      expect(client).toBeDefined();
    });
  });
  
  describe('Dependency Chain', () => {
    it('should create event-driven application stack', async () => {
      // This test will be implemented after packages are published
      expect(true).toBe(true);
    });
    
    it('should handle cross-package event communication', async () => {
      // This test will be implemented after packages are published
      expect(true).toBe(true);
    });
  });
});
EOF

    cat > "$integration_dir/tests/setup.ts" << 'EOF'
/**
 * Test setup for integration tests
 */

// Set test timeout
jest.setTimeout(30000);

// Mock console methods if needed
beforeEach(() => {
  jest.clearAllMocks();
});
EOF

    echo "✅ Created cross-package integration tests"
}

# Function to create publishing order documentation
create_publishing_docs() {
    echo "📚 Creating publishing order documentation"
    
    cat > "$MIGRATION_DIR/PUBLISHING_GUIDE.md" << 'EOF'
# NPM Publishing Guide

This guide outlines the publishing order and process for the TypeScript-EDA ecosystem packages.

## Publishing Order

The packages must be published in dependency order to ensure all dependencies are available:

1. **@typescript-eda/domain** - Foundation domain patterns
2. **@typescript-eda/infrastructure** - Infrastructure adapters (depends on domain)
3. **@typescript-eda/application** - Application orchestration (depends on domain + infrastructure)
4. **@web-buddy/nodejs-server** - Server framework (depends on all TypeScript-EDA packages)
5. **@web-buddy/browser-extension** - Extension framework (depends on all TypeScript-EDA packages)
6. **@chatgpt-buddy/server** - AI server implementation (depends on TypeScript-EDA + Web-Buddy server)
7. **@chatgpt-buddy/extension** - AI extension implementation (depends on TypeScript-EDA + Web-Buddy extension)
8. **@chatgpt-buddy/client** - Client SDKs (depends on TypeScript-EDA packages)

## Prerequisites

1. **NPM Organizations Setup**:
   ```bash
   npm org:create @typescript-eda
   npm org:create @web-buddy
   npm org:create @chatgpt-buddy
   ```

2. **NPM Authentication**:
   ```bash
   npm login
   npm token create --read-write
   ```

3. **GitHub Repository Creation**:
   - Create repositories for each package
   - Set up NPM_TOKEN secret in each repository

## Publishing Process

### Manual Publishing

For each package in order:

```bash
cd migration-workspace/{package-name}
npm run prepare-release
npm publish --access public
```

### Automated Publishing

1. **Tag-based Publishing**:
   ```bash
   cd migration-workspace/{package-name}
   ./scripts/version-bump.sh patch
   git push origin main --tags
   ```

2. **GitHub Actions will automatically**:
   - Run tests
   - Build package
   - Publish to NPM
   - Create GitHub release

## Version Management

### Semantic Versioning

- **Major** (X.y.z): Breaking changes
- **Minor** (x.Y.z): New features, backward compatible
- **Patch** (x.y.Z): Bug fixes, backward compatible

### Cross-Package Compatibility

- All packages in the same major version should be compatible
- Use `^1.0.0` for ecosystem dependencies to allow minor updates
- Lock major versions to prevent breaking changes

## Dependency Updates

When updating dependencies across packages:

1. Update foundation packages first
2. Verify integration tests pass
3. Update framework packages
4. Update implementation packages
5. Run full ecosystem integration tests

## Troubleshooting

### Common Issues

1. **Publishing fails with 403**: Check NPM authentication and organization membership
2. **Dependency resolution fails**: Ensure all dependencies are published and accessible
3. **Version conflicts**: Check that all packages use compatible versions

### Recovery Process

If publishing fails partway through:

1. Identify which packages were published successfully
2. Continue from the next package in the dependency order
3. Update version constraints if needed
4. Re-run integration tests

## Monitoring

After publishing:

1. Verify packages are available on NPM
2. Test installation in a clean environment
3. Run integration tests against published packages
4. Monitor for issues in the first 24 hours

## Support

For publishing issues:
- Check GitHub Actions logs
- Review NPM audit logs
- Contact maintainers via GitHub Issues
EOF

    echo "✅ Created publishing order documentation"
}

# Main execution
echo "🏁 Starting NPM publishing configuration..."

# Check if migration workspace exists
if [ ! -d "$MIGRATION_DIR" ]; then
    echo "❌ Migration workspace not found. Run prepare-repository-migration.sh first."
    exit 1
fi

# Update dependencies for each package
for repo_name in "${PUBLISHING_ORDER[@]}"; do
    if [ -d "$MIGRATION_DIR/$repo_name" ]; then
        update_package_dependencies "$repo_name"
        create_publishing_workflow "$repo_name"
        create_version_scripts "$repo_name"
    else
        echo "⚠️  Repository $repo_name not found in migration workspace"
    fi
done

# Create cross-package integration tests
create_integration_tests

# Create publishing documentation
create_publishing_docs

echo ""
echo "🎉 NPM Publishing Configuration Complete!"
echo "========================================"
echo ""
echo "📋 Publishing order configured:"
for i in "${!PUBLISHING_ORDER[@]}"; do
    echo "   $((i+1)). ${PUBLISHING_ORDER[$i]}"
done
echo ""
echo "🔄 Next steps:"
echo "   1. Review dependency configurations"
echo "   2. Set up NPM organizations (@typescript-eda, @web-buddy, @chatgpt-buddy)"
echo "   3. Create GitHub repositories"
echo "   4. Configure NPM_TOKEN secrets"
echo "   5. Test publishing workflow with a single package"
echo "   6. Publish packages in dependency order"
echo ""
echo "📚 See PUBLISHING_GUIDE.md for detailed instructions"
echo "🚀 Ready for NPM publishing!"