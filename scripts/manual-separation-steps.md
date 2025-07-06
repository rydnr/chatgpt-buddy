# Manual Monorepo Separation Steps

## Quick Step-by-Step Guide

Follow these steps to separate your monorepo into individual repositories.

### 1. First, backup your current repository

```bash
cd ~/github/rydnr
cp -r chatgpt-buddy chatgpt-buddy-backup-$(date +%Y%m%d)
```

### 2. Create the Semantest organization on GitHub

1. Go to https://github.com/organizations/new
2. Organization name: `semantest`
3. Contact email: your email
4. Choose "Free" plan

### 3. Create new workspace directory

```bash
mkdir ~/github/rydnr/semantest-workspace
cd ~/github/rydnr/semantest-workspace
```

### 4. Extract and create TypeScript-EDA repositories (3 separate repos)

```bash
# Go back to original repo
cd ~/github/rydnr/chatgpt-buddy

# Extract TypeScript-EDA Domain
git subtree split --prefix=typescript-eda-domain -b ts-eda-domain-branch
gh repo create semantest/typescript-eda-domain --public --description "Core domain primitives for event-driven architecture"

# Extract TypeScript-EDA Infrastructure
git subtree split --prefix=typescript-eda-infrastructure -b ts-eda-infra-branch
gh repo create semantest/typescript-eda-infrastructure --public --description "Infrastructure adapters for TypeScript-EDA"

# Extract TypeScript-EDA Application
git subtree split --prefix=typescript-eda-application -b ts-eda-app-branch
gh repo create semantest/typescript-eda-application --public --description "Application layer orchestration for TypeScript-EDA"

# Clone and push each repository
cd ~/github/rydnr/semantest-workspace

# Domain
git clone https://github.com/semantest/typescript-eda-domain.git
cd typescript-eda-domain
git pull ~/github/rydnr/chatgpt-buddy ts-eda-domain-branch
git push origin main
cd ..

# Infrastructure
git clone https://github.com/semantest/typescript-eda-infrastructure.git
cd typescript-eda-infrastructure
git pull ~/github/rydnr/chatgpt-buddy ts-eda-infra-branch
git push origin main
cd ..

# Application
git clone https://github.com/semantest/typescript-eda-application.git
cd typescript-eda-application
git pull ~/github/rydnr/chatgpt-buddy ts-eda-app-branch
git push origin main
cd ..
```

### 5. Repeat for each component

Here's the list of components to extract:

| Component | Source Path | New Repo Name | Description |
|-----------|------------|---------------|-------------|
| Browser Core | web-buddy/packages/core | semantest/browser | Core browser automation framework |
| Node.js Server | web-buddy-nodejs-server | semantest/nodejs.server | Node.js server for Semantest |
| Google Implementation | web-buddy/packages/semantest-google | semantest/google.com | Google search automation |
| ChatGPT Implementation | web-buddy/packages/semantest-chatgpt.com | semantest/chatgpt.com | ChatGPT automation |
| Chrome Extension | extension | semantest/extension.chrome | Chrome extension |
| TypeScript Client | client | semantest/typescript.client | TypeScript client SDK |
| Documentation | docs | semantest/docs | Documentation site |
| Deploy Configs | deploy | semantest/deploy | Deployment configurations |

### 6. Example: Extract Browser Core

```bash
cd ~/github/rydnr/chatgpt-buddy

# Create branch with browser core history
git subtree split --prefix=web-buddy/packages/core -b browser-branch

# Create GitHub repo
gh repo create semantest/browser --public --description "Core browser automation framework"

# Clone and push
cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/browser.git
cd browser
git pull ~/github/rydnr/chatgpt-buddy browser-branch
git push origin main
```

### 7. After extracting all components

```bash
# Go back to original directory
cd ~/github/rydnr/chatgpt-buddy

# Clean up temporary branches
git branch -D ts-eda-domain-branch ts-eda-infra-branch ts-eda-app-branch browser-branch nodejs-server-branch # etc...

# Remove git from original directory (this makes it git-less)
rm -rf .git
```

### 8. Your new workspace structure

```
~/github/rydnr/
├── chatgpt-buddy/          # Original files (now git-less)
├── chatgpt-buddy-backup-YYYYMMDD/  # Backup with git history
└── semantest-workspace/    # New workspace with separate repos
    ├── typescript-eda-domain/
    ├── typescript-eda-infrastructure/
    ├── typescript-eda-application/
    ├── browser/
    ├── nodejs.server/
    ├── google.com/
    ├── chatgpt.com/
    ├── extension.chrome/
    ├── typescript.client/
    ├── docs/
    └── deploy/
```

### 9. Update dependencies in each repo

For each repository, update the `package.json` to use npm packages instead of workspace references:

```json
// Before (workspace reference)
"dependencies": {
  "@semantest/browser": "workspace:*"
}

// After (npm package)
"dependencies": {
  "@semantest/browser": "^2.0.0"
}
```

### 10. Add basic CI/CD to each repo

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

## Important Notes

1. **Git History**: The `git subtree split` command preserves the commit history for each component
2. **Organization**: Make sure you have admin rights to create repos under the `semantest` organization
3. **NPM Publishing**: You'll need to set up NPM_TOKEN as a secret in each GitHub repository
4. **Dependencies**: After separation, you'll need to publish each package to npm and update dependencies

## Troubleshooting

- If `git subtree split` takes a long time, be patient - it's processing history
- If you get "path not found" errors, double-check the directory paths
- If GitHub repo creation fails, create them manually through the web interface
- Make sure to push your current changes before starting the separation