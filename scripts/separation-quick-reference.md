# Monorepo Separation Quick Reference

## Essential Commands

### 1. Backup First!
```bash
cp -r ~/github/rydnr/chatgpt-buddy ~/github/rydnr/chatgpt-buddy-backup-$(date +%Y%m%d)
```

### 2. Extract Component Pattern
```bash
# From the monorepo root
cd ~/github/rydnr/chatgpt-buddy

# Extract history for a component
git subtree split --prefix=PATH/TO/COMPONENT -b BRANCH_NAME

# Create GitHub repo
gh repo create semantest/REPO_NAME --public --description "DESCRIPTION"

# Clone and push
cd ~/github/rydnr/semantest-workspace
git clone https://github.com/semantest/REPO_NAME.git
cd REPO_NAME
git pull ~/github/rydnr/chatgpt-buddy BRANCH_NAME
git push origin main
```

### 3. Component Extraction Commands

```bash
# TypeScript-EDA Domain
git subtree split --prefix=typescript-eda-domain -b ts-eda-domain
gh repo create typescript-eda/domain --public

# TypeScript-EDA Infrastructure
git subtree split --prefix=typescript-eda-infrastructure -b ts-eda-infra
gh repo create typescript-eda/infrastructure --public

# TypeScript-EDA Application
git subtree split --prefix=typescript-eda-application -b ts-eda-app
gh repo create typescript-eda/application --public

# Browser Core
git subtree split --prefix=web-buddy/packages/core -b browser
gh repo create semantest/browser --public

# Node.js Server
git subtree split --prefix=web-buddy-nodejs-server -b nodejs-server
gh repo create semantest/nodejs.server --public

# Google Implementation
git subtree split --prefix=web-buddy/packages/semantest-google -b google
gh repo create semantest/google.com --public

# ChatGPT Implementation  
git subtree split --prefix=web-buddy/packages/semantest-chatgpt.com -b chatgpt
gh repo create semantest/chatgpt.com --public

# Chrome Extension
git subtree split --prefix=extension -b chrome-ext
gh repo create semantest/extension.chrome --public

# TypeScript Client
git subtree split --prefix=client -b ts-client
gh repo create semantest/typescript.client --public

# Documentation
git subtree split --prefix=docs -b docs
gh repo create semantest/docs --public

# Deploy Configs
git subtree split --prefix=deploy -b deploy
gh repo create semantest/deploy --public
```

### 4. Clean Up
```bash
# Delete temporary branches
git branch -D ts-eda-domain ts-eda-infra ts-eda-app browser nodejs-server google chatgpt chrome-ext ts-client docs deploy

# Make original directory git-less
rm -rf ~/github/rydnr/chatgpt-buddy/.git
```

### 5. Workspace Structure
```bash
# Your new structure
~/github/rydnr/semantest-workspace/
├── domain/              # typescript-eda/domain
├── infrastructure/      # typescript-eda/infrastructure
├── application/         # typescript-eda/application
├── browser/            # semantest/browser
├── nodejs.server/      # semantest/nodejs.server
├── google.com/         # semantest/google.com
├── chatgpt.com/        # semantest/chatgpt.com
├── extension.chrome/   # semantest/extension.chrome
├── typescript.client/  # semantest/typescript.client
├── docs/               # semantest/docs
└── deploy/             # semantest/deploy
```

## Post-Separation Tasks

1. **Update package.json dependencies** in each repo
2. **Add .github/workflows/ci.yml** for CI/CD
3. **Set up NPM_TOKEN** secret in GitHub
4. **Update README.md** files
5. **Publish initial versions** to npm

## Tips

- Run commands from the monorepo root directory
- Be patient with `git subtree split` - it processes all history
- Create GitHub org first: https://github.com/organizations/new
- Test builds in each new repo before deleting .git from original