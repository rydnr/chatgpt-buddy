# Monorepo Separation Guide

## Overview
This guide will help you transform the current monorepo into separate repositories following the Semantest DNS-style naming convention.

## Prerequisites
- Git 2.20+ (for `git subtree` command)
- GitHub CLI (`gh`) installed and authenticated
- Clean working directory (no uncommitted changes)

## Step 1: Backup Current Repository

```bash
# Create a backup of the entire repository
cd ~/github/rydnr
cp -r chatgpt-buddy chatgpt-buddy-backup-$(date +%Y%m%d)
```

## Step 2: Push Current Changes to Remote

```bash
cd ~/github/rydnr/chatgpt-buddy
git push origin main
```

## Step 3: Create GitHub Organizations (if needed)

Create the Semantest organization on GitHub if it doesn't exist:
```bash
# Go to https://github.com/organizations/new
# Organization name: semantest
# Email: your-email@example.com
```

## Step 4: Extract Components Using Git Subtree

We'll use `git subtree split` to preserve history for each component.

### 4.1 Extract TypeScript-EDA Framework

```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with only typescript-eda history
git subtree split --prefix=typescript-eda -b typescript-eda-only

# Create new repository
gh repo create semantest/typescript-eda --public --description "Event-driven architecture framework for TypeScript"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/typescript-eda.git
cd typescript-eda
git pull ~/github/rydnr/chatgpt-buddy typescript-eda-only
git push origin main
```

### 4.2 Extract Web-Buddy Core Browser Package

```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with only the browser package history
git subtree split --prefix=web-buddy/packages/core -b web-buddy-browser-only

# Create new repository
gh repo create semantest/browser --public --description "Core browser automation framework for Semantest"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/browser.git
cd browser
git pull ~/github/rydnr/chatgpt-buddy web-buddy-browser-only
git push origin main
```

### 4.3 Extract Node.js Server

```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with only nodejs server history
git subtree split --prefix=web-buddy-nodejs-server -b nodejs-server-only

# Create new repository
gh repo create semantest/nodejs.server --public --description "Node.js server for Semantest browser automation"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/nodejs.server.git
cd nodejs.server
git pull ~/github/rydnr/chatgpt-buddy nodejs-server-only
git push origin main
```

### 4.4 Extract Domain Implementations

#### Google.com Implementation
```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with only google implementation
git subtree split --prefix=web-buddy/packages/semantest-google -b google-implementation-only

# Create new repository
gh repo create semantest/google.com --public --description "Google search automation for Semantest"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/google.com.git
cd google.com
git pull ~/github/rydnr/chatgpt-buddy google-implementation-only
git push origin main
```

#### ChatGPT.com Implementation
```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with only chatgpt implementation
git subtree split --prefix=web-buddy/packages/semantest-chatgpt.com -b chatgpt-implementation-only

# Create new repository
gh repo create semantest/chatgpt.com --public --description "ChatGPT automation for Semantest"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/chatgpt.com.git
cd chatgpt.com
git pull ~/github/rydnr/chatgpt-buddy chatgpt-implementation-only
git push origin main
```

### 4.5 Extract Browser Extensions

#### Chrome Extension
```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with extension code
git subtree split --prefix=extension -b extension-chrome-only

# Create new repository
gh repo create semantest/extension.chrome --public --description "Chrome extension for Semantest"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/extension.chrome.git
cd extension.chrome
git pull ~/github/rydnr/chatgpt-buddy extension-chrome-only
git push origin main
```

### 4.6 Extract Client SDKs

#### TypeScript Client
```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with client code
git subtree split --prefix=client -b client-typescript-only

# Create new repository
gh repo create semantest/client.typescript --public --description "TypeScript client SDK for Semantest"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/client.typescript.git
cd client.typescript
git pull ~/github/rydnr/chatgpt-buddy client-typescript-only
git push origin main
```

### 4.7 Extract Documentation

```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with docs
git subtree split --prefix=docs -b docs-only

# Create new repository
gh repo create semantest/docs --public --description "Documentation for Semantest ecosystem"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/docs.git
cd docs
git pull ~/github/rydnr/chatgpt-buddy docs-only
git push origin main
```

### 4.8 Extract Deployment Configurations

```bash
cd ~/github/rydnr/chatgpt-buddy

# Create a branch with deployment configs
git subtree split --prefix=deploy -b deploy-only

# Create new repository
gh repo create semantest/deploy --public --description "Deployment configurations for Semantest"

# Push to new repository
cd ~/github/rydnr
git clone https://github.com/semantest/deploy.git
cd deploy
git pull ~/github/rydnr/chatgpt-buddy deploy-only
git push origin main
```

## Step 5: Clean Up Original Repository

```bash
cd ~/github/rydnr/chatgpt-buddy

# Remove git from the original directory
rm -rf .git

# Delete the temporary branches
# (This is safe since we've pushed everything to new repos)
```

## Step 6: Set Up New Workspace Structure

```bash
# Create a new workspace directory
cd ~/github/rydnr
mkdir semantest-workspace
cd semantest-workspace

# Clone all the new repositories
git clone https://github.com/semantest/typescript-eda.git
git clone https://github.com/semantest/browser.git
git clone https://github.com/semantest/nodejs.server.git
git clone https://github.com/semantest/google.com.git
git clone https://github.com/semantest/chatgpt.com.git
git clone https://github.com/semantest/extension.chrome.git
git clone https://github.com/semantest/client.typescript.git
git clone https://github.com/semantest/docs.git
git clone https://github.com/semantest/deploy.git

# Create a workspace configuration file
cat > workspace.json << 'EOF'
{
  "name": "semantest-workspace",
  "version": "1.0.0",
  "repositories": [
    "typescript-eda",
    "browser",
    "nodejs.server",
    "google.com",
    "chatgpt.com",
    "extension.chrome",
    "client.typescript",
    "docs",
    "deploy"
  ]
}
EOF
```

## Step 7: Update Package Dependencies

Each repository will need its package.json updated to reference the published npm packages instead of workspace references.

### Example for google.com repository:
```bash
cd ~/github/rydnr/semantest-workspace/google.com

# Update package.json to use npm packages
# Change "@semantest/browser": "workspace:*"
# To "@semantest/browser": "^2.0.0"
```

## Step 8: Set Up CI/CD for Each Repository

Create `.github/workflows/ci.yml` in each repository:

```yaml
name: CI

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run build
```

## Step 9: Create Root Workspace README

```bash
cd ~/github/rydnr/semantest-workspace

cat > README.md << 'EOF'
# Semantest Workspace

This directory contains all Semantest repositories for local development.

## Repositories

- `typescript-eda/` - Event-driven architecture framework
- `browser/` - Core browser automation framework
- `nodejs.server/` - Node.js server component
- `google.com/` - Google search automation
- `chatgpt.com/` - ChatGPT automation
- `extension.chrome/` - Chrome browser extension
- `client.typescript/` - TypeScript client SDK
- `docs/` - Documentation site
- `deploy/` - Deployment configurations

## Development Setup

1. Clone all repositories using the setup script
2. Install dependencies in each repository
3. Link local packages for development

See individual repository READMEs for specific instructions.
EOF
```

## Step 10: Verify Everything Works

```bash
# Test that each repository builds successfully
for repo in typescript-eda browser nodejs.server google.com chatgpt.com; do
  echo "Testing $repo..."
  cd ~/github/rydnr/semantest-workspace/$repo
  npm install
  npm run build
  npm test
done
```

## Notes

1. **History Preservation**: Using `git subtree split` preserves the commit history for each component
2. **Clean Separation**: Each repository now has only its relevant history
3. **Independent Development**: Each component can now be versioned and released independently
4. **Workspace Structure**: The new structure makes it easy to work on multiple components

## Troubleshooting

- If `git subtree split` fails, ensure the path is correct
- If GitHub repo creation fails, you may need to create them manually
- For private repositories, add `--private` flag to `gh repo create`
- If you encounter permission issues, ensure you're authenticated with `gh auth login`