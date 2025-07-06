#!/usr/bin/env bash

# Repository Migration Preparation Script
# This script prepares the current monorepo for separation into multiple repositories
# while preserving git history for each component.

set -euo pipefail

echo "🚀 Preparing Repository Migration with Git History Preservation"
echo "=============================================================="

# Define repository mapping
declare -A REPOSITORIES=(
    ["typescript-eda-domain"]="typescript-eda/domain"
    ["typescript-eda-infrastructure"]="typescript-eda/infrastructure"
    ["typescript-eda-application"]="typescript-eda/application"
    ["web-buddy-nodejs-server"]="web-buddy/server"
    ["web-buddy-browser-extension"]="web-buddy/extension"
    ["chatgpt-buddy-server"]="server"
    ["chatgpt-buddy-extension"]="extension"
    ["chatgpt-buddy-client"]="client"
)

# Create migration directory
MIGRATION_DIR="./migration-workspace"
mkdir -p "$MIGRATION_DIR"
echo "📁 Created migration workspace: $MIGRATION_DIR"

# Function to extract repository with git history
extract_repository() {
    local repo_name="$1"
    local source_path="$2"
    local target_dir="$MIGRATION_DIR/$repo_name"
    
    echo ""
    echo "🔄 Extracting $repo_name from $source_path"
    echo "----------------------------------------"
    
    # Clone the current repository to preserve original
    if [ ! -d "$target_dir" ]; then
        git clone . "$target_dir"
        echo "✅ Cloned repository to $target_dir"
    fi
    
    cd "$target_dir"
    
    # Use git filter-branch to preserve only the relevant path
    echo "🔍 Filtering git history for path: $source_path"
    
    # Check if the path exists in git history
    if git log --oneline --follow -- "$source_path" | head -1 > /dev/null 2>&1; then
        # Use filter-repo if available, otherwise fall back to filter-branch
        if command -v git-filter-repo >/dev/null 2>&1; then
            echo "🎯 Using git-filter-repo for clean history extraction"
            git filter-repo --path "$source_path" --force
        else
            echo "⚠️  git-filter-repo not found, using filter-branch (less optimal)"
            git filter-branch --prune-empty --subdirectory-filter "$source_path" HEAD
        fi
        
        # Move files to root if they're in a subdirectory
        if [ -d "$source_path" ] && [ "$source_path" != "." ]; then
            echo "📁 Moving files from $source_path to repository root"
            
            # Create a temporary branch for restructuring
            git checkout -b restructure
            
            # Move all files to root
            find "$source_path" -mindepth 1 -maxdepth 1 -exec mv {} . \;
            rmdir "$source_path" 2>/dev/null || true
            
            # Commit the restructuring
            git add .
            git commit -m "Restructure: Move files to repository root for $repo_name

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || true
            
            # Switch back to main branch and merge
            git checkout main
            git merge restructure
            git branch -d restructure
        fi
        
        echo "✅ Successfully extracted $repo_name with preserved history"
    else
        echo "⚠️  No git history found for path: $source_path"
        echo "Creating new repository structure..."
        
        # If no history exists, create initial structure
        rm -rf .git
        git init
        git branch -m main
        
        # Copy current files if they exist
        if [ -d "../$source_path" ]; then
            cp -r "../$source_path/"* . 2>/dev/null || true
        fi
        
        # Create initial commit
        git add .
        git commit -m "Initial commit for $repo_name

Extracted from chatgpt-buddy monorepo.

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>" || true
        
        echo "✅ Created new repository structure for $repo_name"
    fi
    
    cd - > /dev/null
}

# Function to create package.json for each repository
create_package_json() {
    local repo_name="$1"
    local target_dir="$MIGRATION_DIR/$repo_name"
    local package_file="$target_dir/package.json"
    
    echo "📦 Creating package.json for $repo_name"
    
    # Define package-specific metadata
    local package_scope=""
    local package_description=""
    local package_keywords=""
    
    case "$repo_name" in
        "typescript-eda-domain")
            package_scope="@typescript-eda"
            package_description="Core domain patterns for event-driven architecture in TypeScript"
            package_keywords='"event-driven", "domain-driven-design", "typescript", "eda", "ddd"'
            ;;
        "typescript-eda-infrastructure")
            package_scope="@typescript-eda"
            package_description="Infrastructure adapters and port implementations for TypeScript-EDA"
            package_keywords='"event-driven", "hexagonal-architecture", "adapters", "typescript", "infrastructure"'
            ;;
        "typescript-eda-application")
            package_scope="@typescript-eda"
            package_description="Application orchestration with @Enable decorators for TypeScript-EDA"
            package_keywords='"event-driven", "application-layer", "decorators", "typescript", "orchestration"'
            ;;
        "web-buddy-nodejs-server")
            package_scope="@web-buddy"
            package_description="Event-driven Node.js server for coordinating browser extension automation"
            package_keywords='"web-automation", "browser-extension", "nodejs", "server", "coordination"'
            ;;
        "web-buddy-browser-extension")
            package_scope="@web-buddy"
            package_description="Browser extension framework with intelligent training system"
            package_keywords='"browser-extension", "web-automation", "training", "pattern-learning", "chrome"'
            ;;
        "chatgpt-buddy-server")
            package_scope="@chatgpt-buddy"
            package_description="AI-enhanced automation server for ChatGPT and language models"
            package_keywords='"chatgpt", "ai-automation", "language-models", "openai", "server"'
            ;;
        "chatgpt-buddy-extension")
            package_scope="@chatgpt-buddy"
            package_description="AI automation browser extension built on Web-Buddy framework"
            package_keywords='"chatgpt", "ai-automation", "browser-extension", "training", "patterns"'
            ;;
        "chatgpt-buddy-client")
            package_scope="@chatgpt-buddy"
            package_description="TypeScript/Python SDKs for ChatGPT automation"
            package_keywords='"chatgpt", "ai-automation", "sdk", "client", "typescript"'
            ;;
    esac
    
    cat > "$package_file" << EOF
{
  "name": "${package_scope}/${repo_name#*-}",
  "version": "1.0.0",
  "description": "$package_description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "lint": "eslint src/**/*.ts",
    "clean": "rm -rf dist",
    "prepublishOnly": "npm run clean && npm run build"
  },
  "keywords": [$package_keywords],
  "author": "rydnr",
  "license": "GPL-3.0",
  "repository": {
    "type": "git",
    "url": "git+https://github.com/rydnr/${repo_name}.git"
  },
  "bugs": {
    "url": "https://github.com/rydnr/${repo_name}/issues"
  },
  "homepage": "https://github.com/rydnr/${repo_name}#readme",
  "devDependencies": {
    "@types/jest": "^29.5.0",
    "@types/node": "^18.15.0",
    "@typescript-eslint/eslint-plugin": "^5.57.0",
    "@typescript-eslint/parser": "^5.57.0",
    "eslint": "^8.37.0",
    "jest": "^29.5.0",
    "ts-jest": "^29.1.0",
    "typescript": "^5.0.0"
  }
}
EOF

    echo "✅ Created package.json for $package_scope/${repo_name#*-}"
}

# Function to create GitHub repository configuration
create_github_config() {
    local repo_name="$1"
    local target_dir="$MIGRATION_DIR/$repo_name"
    
    echo "🐙 Creating GitHub configuration for $repo_name"
    
    # Create .github directory
    mkdir -p "$target_dir/.github/workflows"
    
    # Create CI/CD workflow
    cat > "$target_dir/.github/workflows/ci.yml" << 'EOF'
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v4
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - run: npm ci
    - run: npm run build
    - run: npm test
    - run: npm run lint

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'
    
    steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
      with:
        node-version: '20.x'
        registry-url: 'https://registry.npmjs.org'
    
    - run: npm ci
    - run: npm run build
    
    - name: Publish to NPM
      run: npm publish --access public
      env:
        NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}
EOF

    # Create issue templates
    mkdir -p "$target_dir/.github/ISSUE_TEMPLATE"
    
    cat > "$target_dir/.github/ISSUE_TEMPLATE/bug_report.md" << 'EOF'
---
name: Bug report
about: Create a report to help us improve
title: '[BUG] '
labels: 'bug'
assignees: ''
---

**Describe the bug**
A clear and concise description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '....'
3. Scroll down to '....'
4. See error

**Expected behavior**
A clear and concise description of what you expected to happen.

**Environment:**
 - OS: [e.g. Ubuntu 20.04]
 - Node.js version: [e.g. 18.16.0]
 - Package version: [e.g. 1.0.0]

**Additional context**
Add any other context about the problem here.
EOF

    cat > "$target_dir/.github/ISSUE_TEMPLATE/feature_request.md" << 'EOF'
---
name: Feature request
about: Suggest an idea for this project
title: '[FEATURE] '
labels: 'enhancement'
assignees: ''
---

**Is your feature request related to a problem? Please describe.**
A clear and concise description of what the problem is. Ex. I'm always frustrated when [...]

**Describe the solution you'd like**
A clear and concise description of what you want to happen.

**Describe alternatives you've considered**
A clear and concise description of any alternative solutions or features you've considered.

**Additional context**
Add any other context or screenshots about the feature request here.
EOF

    echo "✅ Created GitHub configuration for $repo_name"
}

# Function to create TypeScript configuration
create_typescript_config() {
    local repo_name="$1"
    local target_dir="$MIGRATION_DIR/$repo_name"
    
    echo "📝 Creating TypeScript configuration for $repo_name"
    
    cat > "$target_dir/tsconfig.json" << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts"
  ]
}
EOF

    echo "✅ Created TypeScript configuration for $repo_name"
}

# Function to create Jest configuration
create_jest_config() {
    local repo_name="$1"
    local target_dir="$MIGRATION_DIR/$repo_name"
    
    echo "🧪 Creating Jest configuration for $repo_name"
    
    cat > "$target_dir/jest.config.js" << 'EOF'
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
};
EOF

    echo "✅ Created Jest configuration for $repo_name"
}

# Function to create ESLint configuration
create_eslint_config() {
    local repo_name="$1"
    local target_dir="$MIGRATION_DIR/$repo_name"
    
    echo "🔍 Creating ESLint configuration for $repo_name"
    
    cat > "$target_dir/.eslintrc.js" << 'EOF'
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  rules: {
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/explicit-function-return-type': 'warn',
  },
  env: {
    node: true,
    jest: true,
  },
};
EOF

    echo "✅ Created ESLint configuration for $repo_name"
}

# Function to create README for each repository
create_readme() {
    local repo_name="$1"
    local target_dir="$MIGRATION_DIR/$repo_name"
    
    echo "📖 Creating README for $repo_name"
    
    # Get package scope and description from package.json
    local package_scope=""
    local package_description=""
    
    case "$repo_name" in
        "typescript-eda-domain")
            package_scope="@typescript-eda"
            package_description="Core domain patterns for event-driven architecture in TypeScript"
            ;;
        "typescript-eda-infrastructure")
            package_scope="@typescript-eda"
            package_description="Infrastructure adapters and port implementations for TypeScript-EDA"
            ;;
        "typescript-eda-application")
            package_scope="@typescript-eda"
            package_description="Application orchestration with @Enable decorators for TypeScript-EDA"
            ;;
        "web-buddy-nodejs-server")
            package_scope="@web-buddy"
            package_description="Event-driven Node.js server for coordinating browser extension automation"
            ;;
        "web-buddy-browser-extension")
            package_scope="@web-buddy"
            package_description="Browser extension framework with intelligent training system"
            ;;
        "chatgpt-buddy-server")
            package_scope="@chatgpt-buddy"
            package_description="AI-enhanced automation server for ChatGPT and language models"
            ;;
        "chatgpt-buddy-extension")
            package_scope="@chatgpt-buddy"
            package_description="AI automation browser extension built on Web-Buddy framework"
            ;;
        "chatgpt-buddy-client")
            package_scope="@chatgpt-buddy"
            package_description="TypeScript/Python SDKs for ChatGPT automation"
            ;;
    esac
    
    cat > "$target_dir/README.md" << EOF
# ${package_scope}/${repo_name#*-}

$package_description

## Installation

\`\`\`bash
npm install ${package_scope}/${repo_name#*-}
\`\`\`

## Usage

\`\`\`typescript
import { /* exports */ } from '${package_scope}/${repo_name#*-}';

// Usage examples will be added here
\`\`\`

## Documentation

For comprehensive documentation, visit the [TypeScript-EDA Ecosystem Documentation](https://rydnr.github.io/chatgpt-buddy/).

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the GPL-3.0 License - see the [LICENSE](LICENSE) file for details.

## Part of the TypeScript-EDA Ecosystem

This package is part of the TypeScript-EDA ecosystem:

- **Foundation Layer**: Event-driven architecture patterns
  - [@typescript-eda/domain](https://npmjs.com/package/@typescript-eda/domain)
  - [@typescript-eda/infrastructure](https://npmjs.com/package/@typescript-eda/infrastructure)
  - [@typescript-eda/application](https://npmjs.com/package/@typescript-eda/application)

- **Framework Layer**: Web automation framework
  - [@web-buddy/nodejs-server](https://npmjs.com/package/@web-buddy/nodejs-server)
  - [@web-buddy/browser-extension](https://npmjs.com/package/@web-buddy/browser-extension)

- **Implementation Layer**: Specialized automation tools
  - [@chatgpt-buddy/server](https://npmjs.com/package/@chatgpt-buddy/server)
  - [@chatgpt-buddy/extension](https://npmjs.com/package/@chatgpt-buddy/extension)
  - [@chatgpt-buddy/client](https://npmjs.com/package/@chatgpt-buddy/client)
EOF

    echo "✅ Created README for $package_scope/${repo_name#*-}"
}

# Main execution
echo "🏁 Starting repository extraction process..."
echo ""

# Extract each repository with preserved history
for repo_name in "${!REPOSITORIES[@]}"; do
    source_path="${REPOSITORIES[$repo_name]}"
    extract_repository "$repo_name" "$source_path"
    create_package_json "$repo_name"
    create_github_config "$repo_name"
    create_typescript_config "$repo_name"
    create_jest_config "$repo_name"
    create_eslint_config "$repo_name"
    create_readme "$repo_name"
done

echo ""
echo "🎉 Repository Migration Preparation Complete!"
echo "=============================================="
echo ""
echo "📁 Migration workspace created at: $MIGRATION_DIR"
echo "📋 Extracted repositories:"
for repo_name in "${!REPOSITORIES[@]}"; do
    echo "   - $repo_name (from ${REPOSITORIES[$repo_name]})"
done
echo ""
echo "🔄 Next steps:"
echo "   1. Review the extracted repositories in $MIGRATION_DIR"
echo "   2. Test each repository independently"
echo "   3. Create GitHub repositories"
echo "   4. Set up NPM organizations"
echo "   5. Configure CI/CD pipelines"
echo "   6. Publish initial versions"
echo ""
echo "🚀 Ready for repository migration!"