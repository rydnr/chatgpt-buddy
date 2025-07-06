# Step-by-Step Repository Creation Guide

This guide will walk you through creating the new repositories and setting up your Semantest workspace. Follow each step carefully.

## Prerequisites

1. Make sure you have GitHub CLI installed and authenticated:
```bash
# Check if gh is installed
gh --version

# If not authenticated, login:
gh auth login
```

2. Backup your current repository:
```bash
cd ~/github/rydnr
cp -r chatgpt-buddy chatgpt-buddy-backup-$(date +%Y%m%d)
```

## Step 1: Create GitHub Organization

1. Go to https://github.com/organizations/new
2. Organization account name: `semantest`
3. Contact email: your email
4. Choose the "Free" plan
5. Click "Create organization"

## Step 2: Create Workspace Directory

```bash
mkdir -p ~/github/rydnr/semantest-workspace
```

## Step 3: Extract and Create TypeScript-EDA Repositories

We'll create three separate repositories for TypeScript-EDA:

### 3.1 TypeScript-EDA Domain

```bash
# Navigate to monorepo
cd ~/github/rydnr/chatgpt-buddy

# Create branch with domain history
git subtree split --prefix=typescript-eda-domain -b ts-eda-domain-branch

# Create GitHub repository
gh repo create semantest/typescript-eda-domain --public \
  --description "Core domain primitives for event-driven architecture"

# Clone and push
cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/typescript-eda-domain.git
cd typescript-eda-domain
git pull ~/github/rydnr/chatgpt-buddy ts-eda-domain-branch
git push origin main
```

### 3.2 TypeScript-EDA Infrastructure

```bash
# Go back to monorepo
cd ~/github/rydnr/chatgpt-buddy

# Create branch with infrastructure history
git subtree split --prefix=typescript-eda-infrastructure -b ts-eda-infra-branch

# Create GitHub repository
gh repo create semantest/typescript-eda-infrastructure --public \
  --description "Infrastructure adapters for TypeScript-EDA"

# Clone and push
cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/typescript-eda-infrastructure.git
cd typescript-eda-infrastructure
git pull ~/github/rydnr/chatgpt-buddy ts-eda-infra-branch
git push origin main
```

### 3.3 TypeScript-EDA Application

```bash
# Go back to monorepo
cd ~/github/rydnr/chatgpt-buddy

# Create branch with application history
git subtree split --prefix=typescript-eda-application -b ts-eda-app-branch

# Create GitHub repository
gh repo create semantest/typescript-eda-application --public \
  --description "Application layer orchestration for TypeScript-EDA"

# Clone and push
cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/typescript-eda-application.git
cd typescript-eda-application
git pull ~/github/rydnr/chatgpt-buddy ts-eda-app-branch
git push origin main
```

## Step 4: Extract Browser Core

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=web-buddy/packages/core -b browser-branch

gh repo create semantest/browser --public \
  --description "Core browser automation framework for Semantest"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/browser.git
cd browser
git pull ~/github/rydnr/chatgpt-buddy browser-branch
git push origin main
```

## Step 5: Extract Node.js Server

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=web-buddy-nodejs-server -b nodejs-server-branch

gh repo create semantest/nodejs.server --public \
  --description "Node.js server for Semantest browser automation"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/nodejs.server.git
cd nodejs.server
git pull ~/github/rydnr/chatgpt-buddy nodejs-server-branch
git push origin main
```

## Step 6: Extract Google Implementation

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=web-buddy/packages/semantest-google -b google-branch

gh repo create semantest/google.com --public \
  --description "Google search automation for Semantest"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/google.com.git
cd google.com
git pull ~/github/rydnr/chatgpt-buddy google-branch
git push origin main
```

## Step 7: Extract ChatGPT Implementation

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=web-buddy/packages/semantest-chatgpt.com -b chatgpt-branch

gh repo create semantest/chatgpt.com --public \
  --description "ChatGPT automation for Semantest"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/chatgpt.com.git
cd chatgpt.com
git pull ~/github/rydnr/chatgpt-buddy chatgpt-branch
git push origin main
```

## Step 8: Extract Chrome Extension

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=extension -b extension-branch

gh repo create semantest/extension.chrome --public \
  --description "Chrome extension for Semantest"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/extension.chrome.git
cd extension.chrome
git pull ~/github/rydnr/chatgpt-buddy extension-branch
git push origin main
```

## Step 9: Extract TypeScript Client

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=client -b client-branch

gh repo create semantest/client.typescript --public \
  --description "TypeScript client SDK for Semantest"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/client.typescript.git
cd client.typescript
git pull ~/github/rydnr/chatgpt-buddy client-branch
git push origin main
```

## Step 10: Extract Documentation

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=docs -b docs-branch

gh repo create semantest/docs --public \
  --description "Documentation for Semantest ecosystem"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/docs.git
cd docs
git pull ~/github/rydnr/chatgpt-buddy docs-branch
git push origin main
```

## Step 11: Extract Deploy Configurations

```bash
cd ~/github/rydnr/chatgpt-buddy

git subtree split --prefix=deploy -b deploy-branch

gh repo create semantest/deploy --public \
  --description "Deployment configurations for Semantest"

cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/deploy.git
cd deploy
git pull ~/github/rydnr/chatgpt-buddy deploy-branch
git push origin main
```

## Step 12: Clean Up

```bash
# Go back to original directory
cd ~/github/rydnr/chatgpt-buddy

# Delete all temporary branches
git branch -D ts-eda-domain-branch ts-eda-infra-branch ts-eda-app-branch \
  browser-branch nodejs-server-branch google-branch chatgpt-branch \
  extension-branch client-branch docs-branch deploy-branch

# Make the original directory git-less
rm -rf .git
```

## Step 13: Verify Your Workspace

Your directory structure should now look like:

```
~/github/rydnr/
├── chatgpt-buddy/                    # Original files (now git-less)
├── chatgpt-buddy-backup-YYYYMMDD/    # Backup with git history
└── semantest-workspace/              # New workspace
    ├── typescript-eda-domain/
    ├── typescript-eda-infrastructure/
    ├── typescript-eda-application/
    ├── browser/
    ├── nodejs.server/
    ├── google.com/
    ├── chatgpt.com/
    ├── extension.chrome/
    ├── client.typescript/
    ├── docs/
    └── deploy/
```

## Step 14: Post-Separation Tasks

### Update Package Dependencies

In each repository, update `package.json` to use npm packages instead of workspace references:

```json
// Before
"dependencies": {
  "@typescript-eda/domain": "workspace:*"
}

// After
"dependencies": {
  "@typescript-eda/domain": "^1.0.0"
}
```

### Add GitHub Actions CI/CD

For each repository, create `.github/workflows/ci.yml`:

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

  publish:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
          registry-url: 'https://registry.npmjs.org'
      - run: npm ci
      - run: npm run build
      - run: npm publish --access public
        env:
          NODE_AUTH_TOKEN: ${{secrets.NPM_TOKEN}}
```

### Set up NPM Publishing

1. Create an npm account if you don't have one
2. Generate an automation token: https://www.npmjs.com/settings/~/tokens
3. Add the token as `NPM_TOKEN` secret in each GitHub repository

## Troubleshooting

- **git subtree split is slow**: This is normal, it's processing the entire history
- **Repository already exists**: Delete it from GitHub and try again, or use a different name
- **Permission denied**: Make sure you're authenticated with `gh auth status`
- **Can't push to main**: Check if the repository has branch protection rules

## Next Steps

1. Update READMEs in each repository with specific instructions
2. Set up continuous integration for each repository
3. Publish initial versions to npm
4. Update all inter-package dependencies to use published versions
5. Set up documentation site deployment