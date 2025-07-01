module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/tests/e2e/.*\\.spec\\.(ts|js)$',
    '/tests/e2e/.*\\.e2e\\.test\\.(ts|js)$'
  ],
  collectCoverageFrom: [
    'packages/*/src/**/*.ts',
    'extension/src/**/*.ts',
    'client/*/src/**/*.ts',
    'server/src/**/*.ts',
    '!packages/*/src/**/*.d.ts',
    '!**/node_modules/**',
    '!**/dist/**',
    '!**/build/**'
  ],
  moduleNameMapper: {
    '^@chatgpt-buddy/(.*)$': '<rootDir>/packages/chatgpt-buddy-$1/src',
    '^@web-buddy/(.*)$': '<rootDir>/packages/web-buddy-$1/src',
    '^@typescript-eda/(.*)$': '<rootDir>/typescript-eda/packages/$1/src',
    '^typescript-eda$': '<rootDir>/typescript-eda/packages/core/src'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      useESM: true,
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        skipLibCheck: true,
        noImplicitAny: false
      }
    }]
  },
  extensionsToTreatAsEsm: ['.ts'],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageDirectory: '<rootDir>/coverage',
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70
    }
  }
};