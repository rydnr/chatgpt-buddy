#!/usr/bin/env bash

# Semantest Monorepo Separation Script
# This script helps separate the monorepo into individual repositories

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SEMANTEST_ORG="semantest"
TYPESCRIPT_EDA_ORG="typescript-eda"
BASE_DIR="$PWD"
WORKSPACE_DIR="$HOME/github/rydnr/semantest-workspace"

echo -e "${GREEN}Semantest Monorepo Separation Script${NC}"
echo -e "${YELLOW}This script will help you separate the monorepo into individual repositories${NC}"
echo ""

# Check prerequisites
check_prerequisites() {
    echo -e "${YELLOW}Checking prerequisites...${NC}"
    
    # Check git version
    if ! command -v git &> /dev/null; then
        echo -e "${RED}Error: git is not installed${NC}"
        exit 1
    fi
    
    # Check GitHub CLI
    if ! command -v gh &> /dev/null; then
        echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
        echo "Install from: https://cli.github.com/"
        exit 1
    fi
    
    # Check if authenticated
    if ! gh auth status &> /dev/null; then
        echo -e "${RED}Error: Not authenticated with GitHub CLI${NC}"
        echo "Run: gh auth login"
        exit 1
    fi
    
    # Check working directory is clean
    if [[ -n $(git status --porcelain) ]]; then
        echo -e "${RED}Error: Working directory has uncommitted changes${NC}"
        echo "Please commit or stash your changes first"
        exit 1
    fi
    
    echo -e "${GREEN}✓ All prerequisites met${NC}"
}

# Function to extract and create repository
extract_component() {
    local prefix=$1
    local branch_name=$2
    local org_name=$3
    local repo_name=$4
    local description=$5
    
    echo -e "\n${YELLOW}Extracting $org_name/$repo_name...${NC}"
    
    # Create branch with component history
    echo "Creating branch with $prefix history..."
    if git show-ref --quiet refs/heads/$branch_name; then
        git branch -D $branch_name
    fi
    git subtree split --prefix=$prefix -b $branch_name
    
    # Create GitHub repository
    echo "Creating GitHub repository..."
    if gh repo view $org_name/$repo_name &> /dev/null; then
        echo -e "${YELLOW}Repository $org_name/$repo_name already exists, skipping creation${NC}"
    else
        gh repo create $org_name/$repo_name --public --description "$description"
    fi
    
    # Clone and push
    echo "Cloning and pushing to new repository..."
    cd "$WORKSPACE_DIR"
    if [ -d "$repo_name" ]; then
        rm -rf "$repo_name"
    fi
    git clone https://github.com/$org_name/$repo_name.git
    cd $repo_name
    git pull $BASE_DIR $branch_name
    git push origin main
    
    echo -e "${GREEN}✓ Successfully created $org_name/$repo_name${NC}"
    cd $BASE_DIR
}

# Create workspace directory
create_workspace() {
    echo -e "\n${YELLOW}Creating workspace directory...${NC}"
    mkdir -p "$WORKSPACE_DIR"
    echo -e "${GREEN}✓ Created $WORKSPACE_DIR${NC}"
}

# Main execution
main() {
    check_prerequisites
    
    echo -e "\n${YELLOW}Current directory: $BASE_DIR${NC}"
    echo -e "${YELLOW}Workspace will be created at: $WORKSPACE_DIR${NC}"
    echo -e "\n${RED}Warning: This will create repositories under two organizations:${NC}"
    echo -e "${RED}- typescript-eda (for TypeScript-EDA framework)${NC}"
    echo -e "${RED}- semantest (for Semantest browser automation)${NC}"
    echo -e "\n${YELLOW}Make sure both organizations exist on GitHub before proceeding!${NC}"
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Aborted."
        exit 1
    fi
    
    create_workspace
    
    # Push current changes
    echo -e "\n${YELLOW}Pushing current changes to origin...${NC}"
    git push origin main || echo -e "${YELLOW}Warning: Could not push to origin${NC}"
    
    # Extract TypeScript-EDA components (3 separate repositories under typescript-eda org)
    extract_component "typescript-eda-domain" "ts-eda-domain-only" "$TYPESCRIPT_EDA_ORG" "domain" "Core domain primitives for event-driven architecture"
    extract_component "typescript-eda-infrastructure" "ts-eda-infra-only" "$TYPESCRIPT_EDA_ORG" "infrastructure" "Infrastructure adapters for TypeScript-EDA"
    extract_component "typescript-eda-application" "ts-eda-app-only" "$TYPESCRIPT_EDA_ORG" "application" "Application layer orchestration for TypeScript-EDA"
    
    # Extract Semantest components (under semantest org)
    extract_component "web-buddy/packages/core" "browser-only" "$SEMANTEST_ORG" "browser" "Core browser automation framework for Semantest"
    extract_component "web-buddy-nodejs-server" "nodejs-server-only" "$SEMANTEST_ORG" "nodejs.server" "Node.js server for Semantest browser automation"
    extract_component "web-buddy/packages/semantest-google" "google-only" "$SEMANTEST_ORG" "google.com" "Google search automation for Semantest"
    extract_component "web-buddy/packages/semantest-chatgpt.com" "chatgpt-only" "$SEMANTEST_ORG" "chatgpt.com" "ChatGPT automation for Semantest"
    extract_component "extension" "extension-chrome-only" "$SEMANTEST_ORG" "extension.chrome" "Chrome extension for Semantest"
    extract_component "client" "client-typescript-only" "$SEMANTEST_ORG" "client.typescript" "TypeScript client SDK for Semantest"
    extract_component "docs" "docs-only" "$SEMANTEST_ORG" "docs" "Documentation for Semantest ecosystem"
    extract_component "deploy" "deploy-only" "$SEMANTEST_ORG" "deploy" "Deployment configurations for Semantest"
    
    # Create workspace readme
    echo -e "\n${YELLOW}Creating workspace README...${NC}"
    cd "$WORKSPACE_DIR"
    cat > README.md << 'EOF'
# Semantest Workspace

This directory contains all Semantest repositories for local development.

## Repositories

### TypeScript-EDA Framework (under typescript-eda organization)
- `domain/` - Core domain primitives (Entity, Event, ValueObject)
- `infrastructure/` - Infrastructure adapters and ports
- `application/` - Application layer orchestration

### Browser Automation (under semantest organization)
- `browser/` - Core browser automation framework  
- `nodejs.server/` - Node.js server component
- `extension.chrome/` - Chrome browser extension

### Website Implementations
- `google.com/` - Google search automation
- `chatgpt.com/` - ChatGPT automation

### SDKs and Tools
- `client.typescript/` - TypeScript client SDK
- `docs/` - Documentation site
- `deploy/` - Deployment configurations

## Quick Start

```bash
# Install dependencies in all repositories
for repo in */; do
  echo "Installing dependencies in $repo"
  cd "$repo"
  npm install
  cd ..
done
```

## Development

Each repository can be developed independently. See individual repository READMEs for specific instructions.

## Publishing

Each repository has its own CI/CD pipeline that publishes to npm when changes are pushed to main.
EOF
    
    echo -e "${GREEN}✓ Workspace setup complete${NC}"
    
    # Clean up branches
    echo -e "\n${YELLOW}Cleaning up temporary branches...${NC}"
    cd $BASE_DIR
    git branch -D ts-eda-domain-only ts-eda-infra-only ts-eda-app-only browser-only nodejs-server-only google-only chatgpt-only extension-chrome-only client-typescript-only docs-only deploy-only 2>/dev/null || true
    
    echo -e "\n${GREEN}✓ Monorepo separation complete!${NC}"
    echo -e "\n${YELLOW}Next steps:${NC}"
    echo "1. Remove .git directory from $BASE_DIR to make it git-less:"
    echo "   ${GREEN}rm -rf $BASE_DIR/.git${NC}"
    echo "2. Navigate to workspace:"
    echo "   ${GREEN}cd $WORKSPACE_DIR${NC}"
    echo "3. Update package.json files to use published npm packages instead of workspace references"
    echo "4. Set up CI/CD for each repository"
}

# Run main function
main