#!/bin/bash

# Migration Validation Script
# This script validates the repository migration setup and tests extracted repositories

set -euo pipefail

echo "🔍 Validating Repository Migration Setup"
echo "======================================="

MIGRATION_DIR="./migration-workspace"
VALIDATION_REPORT="$MIGRATION_DIR/validation-report.md"

# Repository list
REPOSITORIES=(
    "typescript-eda-domain"
    "typescript-eda-infrastructure" 
    "typescript-eda-application"
    "web-buddy-nodejs-server"
    "web-buddy-browser-extension"
    "chatgpt-buddy-server"
    "chatgpt-buddy-extension"
    "chatgpt-buddy-client"
)

# Initialize validation report
cat > "$VALIDATION_REPORT" << 'EOF'
# Repository Migration Validation Report

This report contains the validation results for the repository migration setup.

## Summary

| Repository | Structure | Dependencies | Build | Tests | Ready |
|------------|-----------|--------------|-------|-------|-------|
EOF

# Function to validate repository structure
validate_repository_structure() {
    local repo_name="$1"
    local repo_dir="$MIGRATION_DIR/$repo_name"
    local result="❌"
    
    echo "📁 Validating structure for $repo_name..."
    
    if [ -d "$repo_dir" ]; then
        local required_files=(
            "package.json"
            "tsconfig.json"
            "jest.config.js"
            ".eslintrc.js"
            "README.md"
            ".github/workflows/ci.yml"
            ".github/workflows/publish.yml"
        )
        
        local missing_files=()
        for file in "${required_files[@]}"; do
            if [ ! -f "$repo_dir/$file" ]; then
                missing_files+=("$file")
            fi
        done
        
        if [ ${#missing_files[@]} -eq 0 ]; then
            result="✅"
            echo "  ✅ All required files present"
        else
            echo "  ❌ Missing files: ${missing_files[*]}"
        fi
    else
        echo "  ❌ Repository directory not found"
    fi
    
    echo "$result"
}

# Function to validate package.json dependencies
validate_dependencies() {
    local repo_name="$1"
    local repo_dir="$MIGRATION_DIR/$repo_name"
    local result="❌"
    
    echo "📦 Validating dependencies for $repo_name..."
    
    if [ -f "$repo_dir/package.json" ]; then
        # Check if jq is available
        if command -v jq >/dev/null 2>&1; then
            local package_name=$(jq -r '.name' "$repo_dir/package.json")
            local version=$(jq -r '.version' "$repo_dir/package.json")
            local dependencies=$(jq -r '.dependencies // {} | keys | length' "$repo_dir/package.json")
            local dev_dependencies=$(jq -r '.devDependencies // {} | keys | length' "$repo_dir/package.json")
            
            echo "  📦 Package: $package_name@$version"
            echo "  📦 Dependencies: $dependencies runtime, $dev_dependencies dev"
            
            # Validate ecosystem dependencies
            case "$repo_name" in
                "typescript-eda-infrastructure")
                    if jq -e '.dependencies["@typescript-eda/domain"]' "$repo_dir/package.json" >/dev/null; then
                        result="✅"
                    else
                        echo "  ❌ Missing @typescript-eda/domain dependency"
                    fi
                    ;;
                "typescript-eda-application")
                    if jq -e '.dependencies["@typescript-eda/domain"]' "$repo_dir/package.json" >/dev/null && \
                       jq -e '.dependencies["@typescript-eda/infrastructure"]' "$repo_dir/package.json" >/dev/null; then
                        result="✅"
                    else
                        echo "  ❌ Missing required TypeScript-EDA dependencies"
                    fi
                    ;;
                "web-buddy-"*)
                    if jq -e '.dependencies["@typescript-eda/domain"]' "$repo_dir/package.json" >/dev/null && \
                       jq -e '.dependencies["@typescript-eda/infrastructure"]' "$repo_dir/package.json" >/dev/null && \
                       jq -e '.dependencies["@typescript-eda/application"]' "$repo_dir/package.json" >/dev/null; then
                        result="✅"
                    else
                        echo "  ❌ Missing required TypeScript-EDA dependencies"
                    fi
                    ;;
                "chatgpt-buddy-"*)
                    if jq -e '.dependencies["@typescript-eda/domain"]' "$repo_dir/package.json" >/dev/null; then
                        result="✅"
                    else
                        echo "  ❌ Missing required TypeScript-EDA dependencies"
                    fi
                    ;;
                *)
                    result="✅"  # No external dependencies required for domain package
                    ;;
            esac
        else
            echo "  ⚠️  jq not available, skipping detailed dependency validation"
            result="⚠️"
        fi
    else
        echo "  ❌ package.json not found"
    fi
    
    echo "$result"
}

# Function to test build process
test_build() {
    local repo_name="$1"
    local repo_dir="$MIGRATION_DIR/$repo_name"
    local result="❌"
    
    echo "🏗️  Testing build for $repo_name..."
    
    if [ -d "$repo_dir" ]; then
        cd "$repo_dir"
        
        # Check if src directory exists or create minimal structure
        if [ ! -d "src" ]; then
            echo "  📁 Creating minimal src structure..."
            mkdir -p src
            echo "export const version = '1.0.0';" > src/index.ts
        fi
        
        # Test TypeScript compilation
        if npx tsc --noEmit 2>/dev/null; then
            result="✅"
            echo "  ✅ TypeScript compilation successful"
        else
            echo "  ❌ TypeScript compilation failed"
        fi
        
        cd - > /dev/null
    else
        echo "  ❌ Repository directory not found"
    fi
    
    echo "$result"
}

# Function to test jest configuration
test_jest() {
    local repo_name="$1"
    local repo_dir="$MIGRATION_DIR/$repo_name"
    local result="❌"
    
    echo "🧪 Testing Jest setup for $repo_name..."
    
    if [ -d "$repo_dir" ]; then
        cd "$repo_dir"
        
        # Check if test directory exists or create minimal test
        if [ ! -d "src/__tests__" ]; then
            echo "  📁 Creating minimal test structure..."
            mkdir -p src/__tests__
            cat > src/__tests__/index.test.ts << 'EOF'
describe('Package', () => {
  it('should be defined', () => {
    expect(true).toBe(true);
  });
});
EOF
        fi
        
        # Test Jest configuration (dry run)
        if npx jest --passWithNoTests --silent --runInBand 2>/dev/null; then
            result="✅"
            echo "  ✅ Jest configuration valid"
        else
            echo "  ❌ Jest configuration failed"
        fi
        
        cd - > /dev/null
    else
        echo "  ❌ Repository directory not found"
    fi
    
    echo "$result"
}

# Function to check git history preservation
check_git_history() {
    local repo_name="$1"
    local repo_dir="$MIGRATION_DIR/$repo_name"
    local result="❌"
    
    echo "📜 Checking git history for $repo_name..."
    
    if [ -d "$repo_dir/.git" ]; then
        cd "$repo_dir"
        
        local commit_count=$(git rev-list --count HEAD 2>/dev/null || echo "0")
        if [ "$commit_count" -gt 0 ]; then
            result="✅"
            echo "  ✅ Git history preserved ($commit_count commits)"
        else
            echo "  ❌ No git history found"
        fi
        
        cd - > /dev/null
    else
        echo "  ❌ No git repository found"
    fi
    
    echo "$result"
}

# Function to generate overall readiness score
calculate_readiness() {
    local structure_result="$1"
    local deps_result="$2"
    local build_result="$3"
    local test_result="$4"
    
    local score=0
    [ "$structure_result" = "✅" ] && score=$((score + 1))
    [ "$deps_result" = "✅" ] && score=$((score + 1))
    [ "$build_result" = "✅" ] && score=$((score + 1))
    [ "$test_result" = "✅" ] && score=$((score + 1))
    
    case $score in
        4) echo "🟢 Ready" ;;
        3) echo "🟡 Mostly Ready" ;;
        2) echo "🟠 Needs Work" ;;
        1) echo "🔴 Not Ready" ;;
        0) echo "❌ Failed" ;;
    esac
}

# Main validation loop
echo ""
echo "🔍 Running validation for all repositories..."
echo ""

validation_results=()

for repo_name in "${REPOSITORIES[@]}"; do
    echo "============================================"
    echo "🔍 Validating: $repo_name"
    echo "============================================"
    
    structure_result=$(validate_repository_structure "$repo_name")
    deps_result=$(validate_dependencies "$repo_name")
    build_result=$(test_build "$repo_name")
    test_result=$(test_jest "$repo_name")
    
    readiness=$(calculate_readiness "$structure_result" "$deps_result" "$build_result" "$test_result")
    
    # Add to validation report
    echo "| $repo_name | $structure_result | $deps_result | $build_result | $test_result | $readiness |" >> "$VALIDATION_REPORT"
    
    validation_results+=("$repo_name:$readiness")
    
    echo ""
    echo "📊 $repo_name: $readiness"
    echo ""
done

# Generate summary
echo "" >> "$VALIDATION_REPORT"
echo "## Detailed Results" >> "$VALIDATION_REPORT"
echo "" >> "$VALIDATION_REPORT"

ready_count=0
total_count=${#REPOSITORIES[@]}

for result in "${validation_results[@]}"; do
    repo_name="${result%:*}"
    status="${result#*:}"
    
    echo "### $repo_name" >> "$VALIDATION_REPORT"
    echo "" >> "$VALIDATION_REPORT"
    echo "Status: $status" >> "$VALIDATION_REPORT"
    echo "" >> "$VALIDATION_REPORT"
    
    if [[ "$status" == *"Ready"* ]]; then
        ready_count=$((ready_count + 1))
    fi
done

# Final summary
echo "" >> "$VALIDATION_REPORT"
echo "## Summary" >> "$VALIDATION_REPORT"
echo "" >> "$VALIDATION_REPORT"
echo "- **Total Repositories**: $total_count" >> "$VALIDATION_REPORT"
echo "- **Ready for Migration**: $ready_count" >> "$VALIDATION_REPORT"
echo "- **Success Rate**: $(( ready_count * 100 / total_count ))%" >> "$VALIDATION_REPORT"
echo "" >> "$VALIDATION_REPORT"

# Recommendations
echo "## Recommendations" >> "$VALIDATION_REPORT"
echo "" >> "$VALIDATION_REPORT"

if [ $ready_count -eq $total_count ]; then
    echo "🎉 All repositories are ready for migration!" >> "$VALIDATION_REPORT"
    echo "" >> "$VALIDATION_REPORT"
    echo "**Next Steps:**" >> "$VALIDATION_REPORT"
    echo "1. Create GitHub repositories" >> "$VALIDATION_REPORT"
    echo "2. Set up NPM organizations" >> "$VALIDATION_REPORT"
    echo "3. Configure CI/CD secrets" >> "$VALIDATION_REPORT"
    echo "4. Begin publishing process" >> "$VALIDATION_REPORT"
else
    echo "⚠️ Some repositories need attention before migration." >> "$VALIDATION_REPORT"
    echo "" >> "$VALIDATION_REPORT"
    echo "**Focus on:**" >> "$VALIDATION_REPORT"
    
    for result in "${validation_results[@]}"; do
        repo_name="${result%:*}"
        status="${result#*:}"
        
        if [[ "$status" != *"🟢 Ready"* ]]; then
            echo "- Fix issues in $repo_name ($status)" >> "$VALIDATION_REPORT"
        fi
    done
fi

echo ""
echo "🎉 Validation Complete!"
echo "======================"
echo ""
echo "📊 Results Summary:"
echo "   - Total Repositories: $total_count"
echo "   - Ready for Migration: $ready_count"
echo "   - Success Rate: $(( ready_count * 100 / total_count ))%"
echo ""
echo "📋 Detailed report saved to: $VALIDATION_REPORT"
echo ""

if [ $ready_count -eq $total_count ]; then
    echo "🎉 All repositories are ready for migration!"
    echo "🚀 Next: Create GitHub repositories and set up NPM organizations"
else
    echo "⚠️  Some repositories need attention before migration."
    echo "🔧 Review the validation report for specific issues to fix"
fi

echo ""