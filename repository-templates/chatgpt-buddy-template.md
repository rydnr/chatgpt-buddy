# ChatGPT-Buddy Package Repository Template

This template provides the standard structure and configuration for ChatGPT-Buddy AI automation packages.

## Repository Structure

```
chatgpt-buddy-package/
├── .github/
│   ├── workflows/
│   │   ├── ci.yml
│   │   ├── publish.yml
│   │   ├── ai-integration-tests.yml
│   │   └── security.yml
│   ├── ISSUE_TEMPLATE/
│   │   ├── bug_report.md
│   │   ├── feature_request.md
│   │   ├── ai_integration_issue.md
│   │   └── training_issue.md
│   └── pull_request_template.md
├── src/
│   ├── index.ts
│   ├── ai/
│   │   ├── models/
│   │   ├── prompts/
│   │   └── training/
│   ├── automation/
│   │   ├── patterns/
│   │   ├── workflows/
│   │   └── smart-selectors/
│   ├── plugins/
│   ├── services/
│   └── __tests__/
├── training-data/
│   ├── patterns/
│   ├── examples/
│   └── validation/
├── examples/
│   ├── basic-chatgpt-automation/
│   ├── training-workflow/
│   ├── ai-assisted-testing/
│   └── plugin-development/
├── docs/
│   ├── getting_started.org
│   ├── ai_integration.org
│   ├── training_system.org
│   ├── plugin_development.org
│   └── troubleshooting.org
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── ai-integration/
│   └── e2e/
├── scripts/
│   ├── build.sh
│   ├── test.sh
│   ├── ai-test.sh
│   ├── train-models.sh
│   └── publish.sh
├── .env.example
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
  "name": "@chatgpt-buddy/package-name",
  "version": "0.1.0",
  "description": "AI-powered web automation package for ChatGPT integration",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ai": "jest --testPathPattern=ai-integration",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "train": "node scripts/train-models.js",
    "validate-training": "node scripts/validate-training.js",
    "prepublishOnly": "npm run build && npm test",
    "clean": "rimraf dist",
    "examples": "npm run build && node examples/basic-chatgpt-automation/index.js"
  },
  "keywords": [
    "chatgpt",
    "ai-automation",
    "web-automation",
    "machine-learning",
    "typescript",
    "event-driven",
    "web-buddy",
    "intelligent-automation",
    "training-system"
  ],
  "author": "rydnr",
  "license": "GPL-3.0",
  "repository": {
    "type": "git",
    "url": "https://github.com/rydnr/chatgpt-buddy-package-name.git"
  },
  "bugs": {
    "url": "https://github.com/rydnr/chatgpt-buddy-package-name/issues"
  },
  "homepage": "https://chatgpt-buddy.ai/packages/package-name",
  "dependencies": {
    "@typescript-eda/domain": "^1.0.0",
    "@typescript-eda/infrastructure": "^1.0.0",
    "@typescript-eda/application": "^1.0.0",
    "@web-buddy/core": "^1.0.0",
    "@web-buddy/browser-extension": "^1.0.0",
    "axios": "^1.7.0",
    "uuid": "^11.0.0",
    "dotenv": "^16.4.0"
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
    "@web-buddy/core": "^1.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  },
  "files": [
    "dist",
    "training-data",
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
    "tests/**/*",
    "training-data/**/*"
  ]
}
```

## Jest Configuration with AI Testing

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
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
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  testTimeout: 30000,
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/src/**/*.test.ts']
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.ts']
    },
    {
      displayName: 'ai-integration',
      testMatch: ['<rootDir>/tests/ai-integration/**/*.test.ts'],
      testTimeout: 60000
    }
  ]
};
```

## Environment Configuration (.env.example)

```env
# AI API Configuration
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here
COHERE_API_KEY=your_cohere_api_key_here

# ChatGPT-Buddy Configuration
CHATGPT_BUDDY_SERVER_URL=http://localhost:3000
TRAINING_MODE=development
AUTO_TRAINING=false

# Browser Configuration
HEADLESS=true
BROWSER_TIMEOUT=30000
DEFAULT_VIEWPORT_WIDTH=1920
DEFAULT_VIEWPORT_HEIGHT=1080

# Logging and Analytics
LOG_LEVEL=info
ANALYTICS_ENABLED=false
TELEMETRY_ENDPOINT=https://analytics.chatgpt-buddy.ai

# Training Configuration
TRAINING_DATA_PATH=./training-data
MODEL_CACHE_PATH=./models
TRAINING_BATCH_SIZE=32
VALIDATION_SPLIT=0.2

# Development
NODE_ENV=development
DEBUG=chatgpt-buddy:*
```

## GitHub Actions Workflow Templates

### AI Integration Tests (.github/workflows/ai-integration-tests.yml)

```yaml
name: AI Integration Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM

jobs:
  ai-tests:
    runs-on: ubuntu-latest
    timeout-minutes: 30
    
    strategy:
      matrix:
        ai-provider: [openai, anthropic, local]
    
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
    
    - name: Setup AI API keys
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
      run: |
        echo "AI_PROVIDER=${{ matrix.ai-provider }}" >> $GITHUB_ENV
        if [ "${{ matrix.ai-provider }}" = "local" ]; then
          echo "USE_LOCAL_MODELS=true" >> $GITHUB_ENV
        fi
    
    - name: Download AI models (for local testing)
      if: matrix.ai-provider == 'local'
      run: npm run download-models
    
    - name: Build package
      run: npm run build
    
    - name: Run AI integration tests
      run: npm run test:ai
      env:
        OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
        ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        AI_PROVIDER: ${{ matrix.ai-provider }}
    
    - name: Upload AI test results
      uses: actions/upload-artifact@v4
      if: always()
      with:
        name: ai-test-results-${{ matrix.ai-provider }}
        path: |
          coverage/
          ai-test-results/
        retention-days: 30
```

### CI Workflow with Training Validation (.github/workflows/ci.yml)

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
    
    - name: Validate training data
      run: npm run validate-training
    
    - name: Run unit tests
      run: npm run test:coverage
    
    - name: Build package
      run: npm run build
    
    - name: Test examples
      run: npm run examples
    
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        file: ./coverage/lcov.info
        flags: unittests
        name: codecov-umbrella
```

## Example Files

### Basic ChatGPT Automation (examples/basic-chatgpt-automation/index.js)

```javascript
const { ChatGPTBuddy } = require('@chatgpt-buddy/package-name');

async function chatgptAutomation() {
  const buddy = new ChatGPTBuddy({
    aiProvider: 'openai',
    trainingMode: true,
    enableLearning: true
  });

  try {
    // Navigate to ChatGPT
    await buddy.navigate('https://chat.openai.com');
    
    // Auto-detect UI elements using AI
    await buddy.smartClick('new chat button');
    
    // Send a message with AI assistance
    await buddy.aiType('prompt input', 'Explain quantum computing in simple terms');
    
    // Wait for response with intelligent waiting
    await buddy.waitForAIResponse();
    
    // Extract and process the response
    const response = await buddy.extractAIResponse();
    console.log('ChatGPT Response:', response);
    
    // Learn from this interaction for future automation
    await buddy.saveInteractionPattern();
    
  } catch (error) {
    console.error('Automation failed:', error);
  } finally {
    await buddy.close();
  }
}

chatgptAutomation();
```

### Training Workflow Example (examples/training-workflow/index.js)

```javascript
const { TrainingManager } = require('@chatgpt-buddy/package-name');

async function trainingWorkflow() {
  const trainer = new TrainingManager({
    dataPath: './training-data',
    modelPath: './models',
    validationSplit: 0.2
  });

  try {
    // Load training data
    await trainer.loadTrainingData();
    
    // Validate data quality
    const validation = await trainer.validateData();
    console.log('Data validation:', validation);
    
    // Train pattern recognition models
    await trainer.trainPatternRecognition();
    
    // Train smart selector models
    await trainer.trainSmartSelectors();
    
    // Evaluate model performance
    const evaluation = await trainer.evaluateModels();
    console.log('Model evaluation:', evaluation);
    
    // Save trained models
    await trainer.saveModels();
    
  } catch (error) {
    console.error('Training failed:', error);
  }
}

trainingWorkflow();
```

## README.md Template

```markdown
# @chatgpt-buddy/package-name

AI-powered web automation package for intelligent ChatGPT integration and training.

## Installation

```bash
npm install @chatgpt-buddy/package-name
```

## Quick Start

```typescript
import { ChatGPTBuddy } from '@chatgpt-buddy/package-name';

const buddy = new ChatGPTBuddy({
  aiProvider: 'openai',
  trainingMode: true
});

await buddy.navigate('https://chat.openai.com');
await buddy.smartClick('new chat button');
await buddy.aiType('prompt input', 'Your message here');
```

## Features

- 🤖 AI-powered element detection and interaction
- 🧠 Intelligent training system for pattern learning
- 🎯 Smart selectors that adapt to UI changes
- 📊 Built-in analytics and performance monitoring
- 🔌 Plugin architecture for extensibility
- 🎓 Continuous learning from user interactions

## Documentation

- [Getting Started](./docs/getting_started.org)
- [AI Integration](./docs/ai_integration.org)
- [Training System](./docs/training_system.org)
- [Plugin Development](./docs/plugin_development.org)
- [Troubleshooting](./docs/troubleshooting.org)

## Configuration

Create a `.env` file based on `.env.example`:

```env
OPENAI_API_KEY=your_api_key_here
TRAINING_MODE=development
AUTO_TRAINING=false
```

## Examples

- [Basic ChatGPT Automation](./examples/basic-chatgpt-automation/)
- [Training Workflow](./examples/training-workflow/)
- [AI-Assisted Testing](./examples/ai-assisted-testing/)
- [Plugin Development](./examples/plugin-development/)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

GPL-3.0 - see [LICENSE](./LICENSE)
```

## Repository Creation Checklist

- [ ] Create repository from template
- [ ] Update package.json with correct package name and dependencies
- [ ] Configure AI API keys in repository secrets
- [ ] Set up training data structure
- [ ] Configure AI integration tests
- [ ] Update README.md with AI-specific content
- [ ] Set up example automation scenarios
- [ ] Configure branch protection rules
- [ ] Enable GitHub Actions with AI testing
- [ ] Add repository topics including "ai", "chatgpt", "automation"
- [ ] Create initial release with training examples

## Usage Instructions

1. Create new repository using this template
2. Replace `package-name` with actual package name
3. Update dependencies to match Web-Buddy and TypeScript-EDA versions
4. Configure AI API keys and training settings
5. Set up training data and validation
6. Configure repository settings and secrets
7. Push initial code and create first release

This template ensures ChatGPT-Buddy packages have consistent AI integration, training capabilities, and intelligent automation features.