#!/usr/bin/env node

/**
 * @fileoverview Compatibility shim generator for @semantest/browser
 * @description Generates backward compatibility layer for Web-Buddy to Semantest migration
 * 
 * This script creates compatibility shims that allow existing @web-buddy/core users
 * to gradually migrate to @semantest/browser without breaking changes.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const COMPAT_DIR = path.join(DIST_DIR, 'compatibility');

/**
 * Compatibility layer mapping old Web-Buddy exports to new Semantest exports
 */
const COMPATIBILITY_MAPPINGS = {
  // Main client class
  WebBuddyClient: 'SemanTestClient',
  
  // Message types  
  WebBuddyMessage: 'SemanTestMessage',
  BaseWebBuddyMessage: 'BaseSemanTestMessage',
  
  // Contract types
  WebBuddyContract: 'SemanTestContract',
  WebBuddyCapability: 'SemanTestCapability',
  
  // Event types
  WebBuddyEvent: 'SemanTestEvent',
  BaseWebBuddyEvent: 'BaseSemanTestEvent',
  
  // Server types
  WebBuddyServer: 'SemanTestServer',
  
  // Error types
  WebBuddyError: 'SemanTestError',
  WebBuddyValidationError: 'SemanTestValidationError',
  
  // Utility types
  WebBuddyUtils: 'SemanTestUtils'
};

/**
 * Type mappings for interfaces and type aliases
 */
const TYPE_MAPPINGS = {
  WebBuddyClientOptions: 'SemanTestClientOptions',
  WebBuddyServerOptions: 'SemanTestServerOptions',
  WebBuddyMessageOptions: 'SemanTestMessageOptions',
  WebBuddyContractOptions: 'SemanTestContractOptions',
  WebBuddyCapabilityOptions: 'SemanTestCapabilityOptions'
};

/**
 * Generate JavaScript compatibility shim
 */
function generateJSCompatibilityShim() {
  const shimContent = `/**
 * @fileoverview Web-Buddy to Semantest compatibility layer (JavaScript)
 * @deprecated Use @semantest/browser directly. This compatibility layer will be removed in v3.0.0
 * 
 * This file provides backward compatibility for existing @web-buddy/core users.
 * It maps old Web-Buddy exports to new Semantest exports with deprecation warnings.
 */

// Import the new Semantest classes
const {
  SemanTestClient,
  SemanTestMessage,
  SemanTestContract,
  SemanTestCapability,
  SemanTestEvent,
  SemanTestServer,
  SemanTestError,
  SemanTestValidationError,
  SemanTestUtils
} = require('../index');

/**
 * Helper function to create deprecation warning
 */
function createDeprecationWarning(oldName, newName) {
  console.warn(
    \`[DEPRECATED] \${oldName} is deprecated and will be removed in v3.0.0. \\n\` +
    \`Please migrate to \${newName} from @semantest/browser. \\n\` +
    \`Migration guide: https://docs.semantest.com/migration/browser\`
  );
}

${Object.entries(COMPATIBILITY_MAPPINGS).map(([oldName, newName]) => `
/**
 * @deprecated Use ${newName} from @semantest/browser instead
 */
class ${oldName} extends ${newName} {
  constructor(...args) {
    createDeprecationWarning('${oldName}', '${newName}');
    super(...args);
  }
}`).join('\n')}

// Export compatibility classes
module.exports = {
${Object.keys(COMPATIBILITY_MAPPINGS).map(oldName => `  ${oldName},`).join('\n')}
  
  // Also export with type prefixes for backwards compatibility
${Object.entries(TYPE_MAPPINGS).map(([oldType, newType]) => `  ${oldType}: '${newType}', // Type mapping`).join('\n')}
  
  // Version info
  WEBBUDDY_VERSION: '1.x',
  SEMANTEST_VERSION: '2.0.0',
  MIGRATION_GUIDE: 'https://docs.semantest.com/migration/browser'
};
`;

  return shimContent;
}

/**
 * Generate TypeScript compatibility shim
 */
function generateTSCompatibilityShim() {
  const shimContent = `/**
 * @fileoverview Web-Buddy to Semantest compatibility layer (TypeScript)
 * @deprecated Use @semantest/browser directly. This compatibility layer will be removed in v3.0.0
 * 
 * This file provides backward compatibility for existing @web-buddy/core users.
 * It maps old Web-Buddy exports to new Semantest exports with deprecation warnings.
 */

// Import the new Semantest types and classes
import {
  SemanTestClient,
  SemanTestMessage,
  SemanTestContract,
  SemanTestCapability,
  SemanTestEvent,
  SemanTestServer,
  SemanTestError,
  SemanTestValidationError,
  SemanTestUtils,
  type SemanTestClientOptions,
  type SemanTestServerOptions,
  type SemanTestMessageOptions,
  type SemanTestContractOptions,
  type SemanTestCapabilityOptions
} from '../index';

/**
 * Helper function to create deprecation warning
 */
function createDeprecationWarning(oldName: string, newName: string): void {
  console.warn(
    \`[DEPRECATED] \${oldName} is deprecated and will be removed in v3.0.0. \\n\` +
    \`Please migrate to \${newName} from @semantest/browser. \\n\` +
    \`Migration guide: https://docs.semantest.com/migration/browser\`
  );
}

${Object.entries(COMPATIBILITY_MAPPINGS).map(([oldName, newName]) => `
/**
 * @deprecated Use ${newName} from @semantest/browser instead
 */
export class ${oldName} extends ${newName} {
  constructor(...args: any[]) {
    createDeprecationWarning('${oldName}', '${newName}');
    super(...args);
  }
}`).join('\n')}

// Type aliases for backward compatibility
${Object.entries(TYPE_MAPPINGS).map(([oldType, newType]) => `
/**
 * @deprecated Use ${newType} from @semantest/browser instead
 */
export type ${oldType} = ${newType};`).join('\n')}

// Export metadata
export const WEBBUDDY_VERSION = '1.x';
export const SEMANTEST_VERSION = '2.0.0';
export const MIGRATION_GUIDE = 'https://docs.semantest.com/migration/browser';

// Default export with all compatibility classes
export default {
${Object.keys(COMPATIBILITY_MAPPINGS).map(oldName => `  ${oldName},`).join('\n')}
  WEBBUDDY_VERSION,
  SEMANTEST_VERSION,
  MIGRATION_GUIDE
};
`;

  return shimContent;
}

/**
 * Generate package.json for compatibility layer
 */
function generateCompatibilityPackageJson() {
  const packageContent = {
    "name": "@web-buddy/core-compat",
    "version": "1.9.0",
    "description": "Compatibility layer for migrating from @web-buddy/core to @semantest/browser",
    "main": "web-buddy-compat.js",
    "types": "web-buddy-compat.d.ts",
    "keywords": [
      "web-buddy",
      "semantest",
      "compatibility",
      "migration",
      "deprecated"
    ],
    "author": "Semantest Team <team@semantest.com>",
    "license": "GPL-3.0",
    "repository": {
      "type": "git",
      "url": "https://github.com/semantest/semantest.git",
      "directory": "packages/semantest-browser/compatibility"
    },
    "peerDependencies": {
      "@semantest/browser": "^2.0.0"
    },
    "deprecated": "This compatibility layer is deprecated. Please migrate to @semantest/browser directly.",
    "publishConfig": {
      "access": "public",
      "registry": "https://registry.npmjs.org/"
    }
  };

  return JSON.stringify(packageContent, null, 2);
}

/**
 * Generate migration guide
 */
function generateMigrationGuide() {
  const guideContent = `# Migration Guide: @web-buddy/core → @semantest/browser

## Quick Migration Checklist

### 1. Update Package Dependencies
\`\`\`bash
# Remove old dependency
npm uninstall @web-buddy/core

# Install new dependency
npm install @semantest/browser
\`\`\`

### 2. Update Import Statements
\`\`\`typescript
// OLD (deprecated)
import { WebBuddyClient } from '@web-buddy/core';

// NEW (recommended)
import { SemanTestClient } from '@semantest/browser';
\`\`\`

### 3. Update Class Names
| Old Name | New Name |
|----------|----------|
${Object.entries(COMPATIBILITY_MAPPINGS).map(([oldName, newName]) => `| \`${oldName}\` | \`${newName}\` |`).join('\n')}

### 4. Update Type Names
| Old Type | New Type |
|----------|----------|
${Object.entries(TYPE_MAPPINGS).map(([oldType, newType]) => `| \`${oldType}\` | \`${newType}\` |`).join('\n')}

## Breaking Changes

### Message Types
- Message type constants have changed from \`WEB_BUDDY_*\` to \`SEMANTEST_*\`
- Update any code that references these constants directly

### Configuration Keys
- Configuration object keys have changed from \`webBuddy.*\` to \`semantest.*\`
- Update your configuration files accordingly

### Event Names
- Event names have changed to reflect the new semantic automation focus
- Update event listeners to use new event names

## Gradual Migration Strategy

### Phase 1: Install Compatibility Layer (Week 1)
\`\`\`bash
npm install @semantest/browser
# Keep using existing @web-buddy/core imports (deprecated warnings will appear)
\`\`\`

### Phase 2: Update Imports (Week 2-3)
\`\`\`typescript
// Update imports one module at a time
import { SemanTestClient } from '@semantest/browser';
\`\`\`

### Phase 3: Update Class Instantiation (Week 4)
\`\`\`typescript
// Update class names and configurations
const client = new SemanTestClient({
  serverUrl: 'ws://localhost:8080',
  // ... other options
});
\`\`\`

### Phase 4: Remove Old Dependencies (Week 5)
\`\`\`bash
npm uninstall @web-buddy/core
\`\`\`

## Migration Tools

### Automated Migration Script
\`\`\`bash
# Run the migration script to automatically update your codebase
npx @semantest/migration-tool migrate --from=@web-buddy/core --to=@semantest/browser
\`\`\`

### Manual Search and Replace
\`\`\`bash
# Find all occurrences of old class names
grep -r "WebBuddyClient" src/
grep -r "WebBuddyMessage" src/

# Replace with new names
sed -i 's/WebBuddyClient/SemanTestClient/g' src/**/*.ts
sed -i 's/WebBuddyMessage/SemanTestMessage/g' src/**/*.ts
\`\`\`

## Support

- **Documentation**: https://docs.semantest.com/migration/browser
- **GitHub Issues**: https://github.com/semantest/semantest/issues
- **Community Support**: https://discord.gg/semantest

## FAQ

### Q: Will my existing code break immediately?
A: No, the compatibility layer provides deprecation warnings but maintains functionality.

### Q: How long will the compatibility layer be supported?
A: The compatibility layer will be maintained until v3.0.0 (estimated 6-12 months).

### Q: Are there any performance impacts?
A: The compatibility layer has minimal overhead. Direct use of @semantest/browser is recommended for new code.

### Q: Can I use both packages simultaneously?
A: Yes, during the migration period you can use both packages, but this is not recommended for production.
`;

  return guideContent;
}

/**
 * Main execution function
 */
function main() {
  console.log('🔄 Generating compatibility shims for @semantest/browser...');

  // Ensure directories exist
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }
  
  if (!fs.existsSync(COMPAT_DIR)) {
    fs.mkdirSync(COMPAT_DIR, { recursive: true });
  }

  try {
    // Generate JavaScript compatibility shim
    const jsShim = generateJSCompatibilityShim();
    fs.writeFileSync(path.join(COMPAT_DIR, 'web-buddy-compat.js'), jsShim);
    console.log('✅ Generated JavaScript compatibility shim');

    // Generate TypeScript compatibility shim
    const tsShim = generateTSCompatibilityShim();
    fs.writeFileSync(path.join(COMPAT_DIR, 'web-buddy-compat.ts'), tsShim);
    fs.writeFileSync(path.join(COMPAT_DIR, 'web-buddy-compat.d.ts'), tsShim);
    console.log('✅ Generated TypeScript compatibility shim');

    // Generate compatibility package.json
    const packageJson = generateCompatibilityPackageJson();
    fs.writeFileSync(path.join(COMPAT_DIR, 'package.json'), packageJson);
    console.log('✅ Generated compatibility package.json');

    // Generate migration guide
    const migrationGuide = generateMigrationGuide();
    fs.writeFileSync(path.join(COMPAT_DIR, 'MIGRATION_GUIDE.md'), migrationGuide);
    console.log('✅ Generated migration guide');

    // Create index file for easy imports
    const indexContent = `// Compatibility layer index
export * from './web-buddy-compat';
`;
    fs.writeFileSync(path.join(COMPAT_DIR, 'index.ts'), indexContent);
    fs.writeFileSync(path.join(COMPAT_DIR, 'index.js'), `module.exports = require('./web-buddy-compat');`);
    console.log('✅ Generated compatibility index files');

    console.log('🎉 Compatibility shims generated successfully!');
    console.log('📁 Generated files:');
    console.log(`   ${path.relative(process.cwd(), COMPAT_DIR)}/web-buddy-compat.js`);
    console.log(`   ${path.relative(process.cwd(), COMPAT_DIR)}/web-buddy-compat.ts`);
    console.log(`   ${path.relative(process.cwd(), COMPAT_DIR)}/web-buddy-compat.d.ts`);
    console.log(`   ${path.relative(process.cwd(), COMPAT_DIR)}/package.json`);
    console.log(`   ${path.relative(process.cwd(), COMPAT_DIR)}/MIGRATION_GUIDE.md`);
    console.log(`   ${path.relative(process.cwd(), COMPAT_DIR)}/index.ts`);
    console.log(`   ${path.relative(process.cwd(), COMPAT_DIR)}/index.js`);

  } catch (error) {
    console.error('❌ Error generating compatibility shims:', error.message);
    process.exit(1);
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  generateJSCompatibilityShim,
  generateTSCompatibilityShim,
  generateCompatibilityPackageJson,
  generateMigrationGuide,
  COMPATIBILITY_MAPPINGS,
  TYPE_MAPPINGS
};