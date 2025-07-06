# TypeScript-EDA Package Repository Template

This template provides the standard structure and configuration for TypeScript-EDA framework packages.

## Repository Structure

```
typescript-eda-package/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── publish.yml
│   │   └── security.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── question.md
│   └── pull_request_template.md
├── src/
│   ├── index.ts
│   ├── types/
│   ├── decorators/
│   ├── entities/
│   └── __tests__/
├── docs/
│   ├── getting_started.org
│   ├── api_reference.org
│   └── examples/
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   └── publish.sh
├── .gitignore
├── .npmignore
├── package.json
├── tsconfig.json
├── jest.config.js
├── README.md
├── LICENSE
├── CHANGELOG.md
└── CONTRIBUTING.md
```

## Package.json Template

```json
{
  "name": "@typescript-eda/package-name",
  "version": "1.0.0",
  "description": "TypeScript-EDA framework package description",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "prepublishOnly": "npm run build && npm test",
    "clean": "rimraf dist"
  },
  "keywords": [
    "typescript",
    "event-driven",
    "architecture",
    "domain-driven-design",
    "typescript-eda"
  ],
  "author": "rydnr",
  "license": "GPL-3.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/rydnr/typescript-eda-package-name.git"
  },
  "bugs": {
    "url": "https://github.com/rydnr/typescript-eda-package-name/issues"
  },
  "homepage": "https://typescript-eda.org/packages/package-name",
  "dependencies": {
    "reflect-metadata": "^0.2.2"
  },
  "devDependencies": {
    "@types/jest": "^30.0.0",
    "@types/node": "^22.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "jest": "^30.0.0",
    "rimraf": "^6.0.0",
    "ts-jest": "^29.2.0",
    "typescript": "^5.8.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  }
}
```

## TypeScript Configuration

```json
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
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts"
  ]
}
```

## Jest Configuration

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/*.test.ts', '**/*.spec.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/__tests__/**',
    '!src/**/index.ts'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
};
```

## GitHub Actions Workflow Templates

### CI Workflow (.github/workflows/ci.yml)

```yaml
name: CI

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
        node-version: [18.x, 20.x, 22.x]
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    
    - name: Setup Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:coverage
    
    - name: Build package
      run: npm run build
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

### Publish Workflow (.github/workflows/publish.yml)

```yaml
name: Publish to NPM

on:
  push:
    tags:
      - 'v*'

jobs:
  publish:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        registry-url: 'https://registry.npmjs.org'
        cache: 'npm'
    
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
    
    - name: Create GitHub Release
      uses: actions/create-release@v1
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
      with:
        tag_name: ${{ github.ref }}
        release_name: Release ${{ github.ref }}
        draft: false
        prerelease: false
```

### Security Workflow (.github/workflows/security.yml)

```yaml
name: Security

on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly on Monday
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  security-audit:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout repository
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '20'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run security audit
      run: npm audit
    
    - name: Run CodeQL Analysis
      uses: github/codeql-action/analyze@v3
      with:
        languages: typescript
```

## Essential Files

### .gitignore
```
# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build outputs
dist/
build/
*.tsbuildinfo

# Coverage
coverage/
*.lcov

# Environment
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
logs
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db
```

### .npmignore
```
# Source files
src/
**/*.ts
!**/*.d.ts

# Build tools
tsconfig.json
jest.config.js
.eslintrc.js

# Development
coverage/
.github/
docs/
scripts/
**/*.test.js
**/*.spec.js

# Environment
.env*

# IDE
.vscode/
.idea/
```

### README.md Template
```markdown
# @typescript-eda/package-name

Brief description of the TypeScript-EDA package.

## Installation

```bash
npm install @typescript-eda/package-name
```

## Usage

```typescript
import { SomeClass } from '@typescript-eda/package-name';

const instance = new SomeClass();
```

## API Documentation

[API Documentation](./docs/api_reference.org)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

GPL-3.0 - see [LICENSE](./LICENSE)
```

## Repository Creation Checklist

- [ ] Create repository from template
- [ ] Update package.json with correct package name
- [ ] Update README.md with package-specific content
- [ ] Configure branch protection rules
- [ ] Set up NPM token secret
- [ ] Enable GitHub Actions
- [ ] Add repository topics and description
- [ ] Create initial release

## Usage Instructions

1. Create new repository using this template
2. Replace `package-name` with actual package name
3. Update all references to match the specific package
4. Configure repository settings and secrets
5. Push initial code and create first release

This template ensures consistency across all TypeScript-EDA packages and provides a solid foundation for development and publishing.