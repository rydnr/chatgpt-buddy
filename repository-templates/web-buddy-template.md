# Web-Buddy Package Repository Template

This template provides the standard structure and configuration for Web-Buddy framework packages.

## Repository Structure

```
web-buddy-package/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── publish.yml
│   │   ├── browser-tests.yml
│   │   └── security.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   └── automation_issue.md
│   └── pull_request_template.md
├── src/
│   ├── index.ts
│   ├── core/
│   ├── adapters/
│   ├── plugins/
│   ├── contracts/
│   └── __tests__/
├── examples/
│   ├── basic-usage/
│   ├── advanced-automation/
│   └── contract-integration/
├── docs/
│   ├── getting_started.org
│   ├── automation_guide.org
│   ├── contract_specification.org
│   └── plugin_development.org
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   ├── e2e-test.sh
│   └── publish.sh
├── .gitignore
├── .npmignore
├── package.json
├── tsconfig.json
├── jest.config.js
├── playwright.config.js
├── README.md
├── LICENSE
├── CHANGELOG.md
└── CONTRIBUTING.md
```

## Package.json Template

```json
{
  "name": "@web-buddy/package-name",
  "version": "1.0.0",
  "description": "Web-Buddy framework package for web automation",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "prepublishOnly": "npm run build && npm test",
    "clean": "rimraf dist",
    "examples": "npm run build && node examples/basic-usage/index.js"
  },
  "keywords": [
    "web-automation",
    "browser-automation",
    "typescript",
    "event-driven",
    "web-buddy",
    "playwright",
    "testing"
  ],
  "author": "rydnr",
  "license": "GPL-3.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/rydnr/web-buddy-package-name.git"
  },
  "bugs": {
    "url": "https://github.com/rydnr/web-buddy-package-name/issues"
  },
  "homepage": "https://web-buddy.org/packages/package-name",
  "dependencies": {
    "@typescript-eda/domain": "^1.0.0",
    "@typescript-eda/infrastructure": "^1.0.0",
    "@typescript-eda/application": "^1.0.0",
    "uuid": "^11.0.0"
  },
  "devDependencies": {
    "@playwright/test": "^1.48.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.0.0",
    "@types/uuid": "^10.0.0",
    "@typescript-eslint/eslint-plugin": "^8.0.0",
    "@typescript-eslint/parser": "^8.0.0",
    "eslint": "^9.0.0",
    "jest": "^30.0.0",
    "playwright": "^1.48.0",
    "rimraf": "^6.0.0",
    "ts-jest": "^29.2.0",
    "typescript": "^5.8.0"
  },
  "peerDependencies": {
    "@typescript-eda/domain": "^1.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "files": [
    "dist",
    "examples",
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
    "lib": ["ES2020", "DOM"],
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
    "emitDecoratorMetadata": true,
    "moduleResolution": "node"
  },
  "include": [
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    "dist",
    "**/*.test.ts",
    "**/*.spec.ts",
    "tests/**/*"
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
      branches: 75,
      functions: 75,
      lines: 75,
      statements: 75
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts']
};
```

## Playwright Configuration

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run start',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
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
    
    - name: Run unit tests
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

### Browser Tests Workflow (.github/workflows/browser-tests.yml)

```yaml
name: Browser Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    timeout-minutes: 60
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
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Build package
      run: npm run build
    
    - name: Run Playwright tests
      run: npm run test:e2e
    
    - name: Upload Playwright Report
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: playwright-report
        path: playwright-report/
        retention-days: 30
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
    
    - name: Install Playwright Browsers
      run: npx playwright install --with-deps
    
    - name: Run tests
      run: npm test
    
    - name: Run E2E tests
      run: npm run test:e2e
    
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

## Example Files

### Basic Usage Example (examples/basic-usage/index.js)

```javascript
const { WebBuddyCore } = require('@web-buddy/package-name');

async function basicExample() {
  const webBuddy = new WebBuddyCore({
    headless: false,
    defaultTimeout: 5000
  });

  try {
    await webBuddy.navigate('https://example.com');
    await webBuddy.click('button[data-testid="submit"]');
    await webBuddy.waitForSelector('.success-message');
    console.log('Automation completed successfully!');
  } catch (error) {
    console.error('Automation failed:', error);
  } finally {
    await webBuddy.close();
  }
}

basicExample();
```

## README.md Template

```markdown
# @web-buddy/package-name

Brief description of the Web-Buddy package and its automation capabilities.

## Installation

```bash
npm install @web-buddy/package-name
```

## Quick Start

```typescript
import { SomeClass } from '@web-buddy/package-name';

const instance = new SomeClass();
await instance.automateWebPage();
```

## Features

- 🤖 Event-driven web automation
- 🔧 TypeScript-first development
- 🎯 Contract-based web app integration
- 🚀 Plugin architecture
- 📊 Built-in analytics and monitoring

## Documentation

- [Getting Started](./docs/getting_started.org)
- [Automation Guide](./docs/automation_guide.org)
- [Contract Specification](./docs/contract_specification.org)
- [Plugin Development](./docs/plugin_development.org)

## Examples

See the [examples](./examples) directory for complete usage examples.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

GPL-3.0 - see [LICENSE](./LICENSE)
```

## Repository Creation Checklist

- [ ] Create repository from template
- [ ] Update package.json with correct package name and dependencies
- [ ] Update README.md with package-specific content
- [ ] Configure Playwright browsers
- [ ] Set up example automation scenarios
- [ ] Configure branch protection rules
- [ ] Set up NPM token secret
- [ ] Enable GitHub Actions
- [ ] Add repository topics and description
- [ ] Create initial release with examples

## Usage Instructions

1. Create new repository using this template
2. Replace `package-name` with actual package name
3. Update dependencies to match TypeScript-EDA versions
4. Configure browser testing requirements
5. Set up automation examples
6. Configure repository settings and secrets
7. Push initial code and create first release

This template ensures Web-Buddy packages have consistent automation capabilities, testing infrastructure, and documentation standards.