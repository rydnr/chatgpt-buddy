# Web-Buddy Contract Declaration Library

A JavaScript library for web applications to declare automation contracts, enabling zero-fragility automation by moving from selector-based to contract-based interaction patterns.

## Overview

This library allows web applications to declaratively expose their automation capabilities through standardized contracts. Instead of brittle CSS selectors, automation tools can discover and use stable, semantic contracts that remain functional across UI changes.

## Key Features

- **Contract-based automation** - Define stable automation interfaces independent of DOM structure
- **Auto-discovery** - Automatic detection of contracts on web pages
- **ARIA integration** - Built-in accessibility compliance and screen reader compatibility
- **Web Components support** - Full integration with modern Web Component architectures
- **TypeScript decorators** - Clean, declarative syntax for TypeScript applications
- **Robust selectors** - Intelligent fallback strategies and element validation
- **Real-time validation** - Contract and selector validation against live page content

## Quick Start

### Basic Usage

```html
<!-- Include the library -->
<script src="https://unpkg.com/@web-buddy/contract-declaration@latest/dist/index.js"></script>

<script>
// Quick registration for simple cases
WebBuddyContracts.quickRegister({
  domain: 'myapp.com',
  title: 'My App Automation Contract',
  description: 'Automation capabilities for My App',
  capabilities: [
    {
      name: 'loginButton',
      type: 'action',
      description: 'Click the login button',
      selector: '[data-testid="login-btn"]'
    },
    {
      name: 'usernameInput',
      type: 'form',
      description: 'Enter username',
      selector: '#username'
    },
    {
      name: 'userProfile',
      type: 'query',
      description: 'Get user profile information',
      selector: '.user-profile'
    }
  ]
});
</script>
```

### Advanced Contract Building

```javascript
import { ContractBuilder, CapabilityPatterns, SelectorPatterns } from '@web-buddy/contract-declaration';

const contract = ContractBuilder.create()
  .info({
    domain: 'myapp.com',
    title: 'My App Automation Contract',
    description: 'Comprehensive automation capabilities for My App'
  })
  .context({
    urlPatterns: ['https://myapp.com/*', 'https://*.myapp.com/*'],
    prerequisites: [
      {
        type: 'authentication',
        description: 'User must be logged in',
        required: true
      }
    ]
  })
  .capability('loginUser')
    .type('form', 'Log in a user with credentials')
    .selector(SelectorPatterns.robust({
      primary: '[data-testid="login-form"]',
      fallbacks: ['#login-form', '.login-form'],
      waitCondition: { type: 'visible', timeout: 5000 }
    }))
    .parameter({
      name: 'username',
      type: 'string',
      description: 'User username',
      required: true,
      validation: { minLength: 3, maxLength: 50 }
    })
    .parameter({
      name: 'password',
      type: 'string',
      description: 'User password',
      required: true,
      validation: { minLength: 8 }
    })
    .example({
      description: 'Login with test credentials',
      parameters: { username: 'testuser', password: 'password123' }
    })
    .done()
  .capability('searchProducts')
    .type('query', 'Search for products')
    .selector('[data-testid="search-input"]')
    .parameter({
      name: 'query',
      type: 'string',
      description: 'Search query',
      required: true
    })
    .done()
  .workflow('completeLogin')
    .description('Complete user login workflow')
    .parameter({
      name: 'credentials',
      type: 'object',
      description: 'User credentials',
      required: true
    })
    .step('loginUser', { username: '${credentials.username}', password: '${credentials.password}' })
    .step('verifyLogin')
    .done()
  .build();

// Register the contract
contractRegistry.register(contract);
```

### TypeScript Decorators

```typescript
import { AutomationContract, Capability, Action, Query, Form } from '@web-buddy/contract-declaration';

@AutomationContract({
  domain: 'myapp.com',
  title: 'My App Contract',
  description: 'TypeScript-based automation contract'
})
class MyAppContract {
  @Action({
    description: 'Click login button',
    selector: '[data-testid="login-btn"]'
  })
  async clickLogin() {
    // Implementation
  }

  @Form({
    description: 'Enter username',
    selector: '#username'
  })
  async enterUsername(text: string) {
    // Implementation
  }

  @Query({
    description: 'Get user profile',
    selector: '.user-profile'
  })
  async getUserProfile() {
    // Implementation
    return { name: 'John Doe', email: 'john@example.com' };
  }
}

// The contract is automatically registered when the class is instantiated
const contract = new MyAppContract();
```

## API Reference

### Core Classes

#### ContractBuilder
Fluent API for building automation contracts.

```javascript
const builder = ContractBuilder.create()
  .info({ domain, title, description })
  .context({ urlPatterns, prerequisites })
  .capability(name)
    .type(type, description)
    .selector(selectorDef)
    .parameter(paramDef)
    .done()
  .build();
```

#### ContractRegistry
Manages contract registration and discovery.

```javascript
// Register a contract
contractRegistry.register(contract);

// Get all contracts
const contracts = contractRegistry.getAll();

// Find by domain
const appContracts = contractRegistry.getByDomain('myapp.com');

// Auto-discovery
const discovered = await contractRegistry.discoverContracts();
```

#### ContractValidator
Validates contracts and selectors.

```javascript
const validator = new ContractValidator();
const result = validator.validate(contract);

if (!result.valid) {
  console.error('Validation errors:', result.errors);
}

// Validate against current page
const pageResult = validator.validateAgainstPage(contract);
```

### Integration Modules

#### ARIA Integration
Accessibility-first automation with ARIA support.

```javascript
import { AriaIntegration } from '@web-buddy/contract-declaration';

// Create contract from ARIA elements
const ariaContract = AriaIntegration.createAriaContract(
  'myapp.com',
  'My App ARIA Contract'
);

// Execute accessible actions
await AriaIntegration.executeAccessibleAction(
  element,
  'click',
  { announceToScreenReader: true }
);
```

#### Web Components Integration
Full support for Web Components and Custom Elements.

```javascript
import { WebComponentsIntegration } from '@web-buddy/contract-declaration';

// Register custom element with automation
WebComponentsIntegration.registerCustomElement('my-component', contract);

// Execute capabilities on custom elements
await WebComponentsIntegration.executeCapability(
  element,
  'submitForm',
  { data: formData }
);
```

### Utility Classes

#### SelectorUtils
Robust element selection with fallback strategies.

```javascript
import { SelectorUtils } from '@web-buddy/contract-declaration';

// Find element with robust selection
const element = await SelectorUtils.findElement(selectorDef);

// Generate selector for existing element
const selector = SelectorUtils.generateRobustSelector(element);

// Highlight element for debugging
SelectorUtils.highlightElement(element, 3000);
```

## Contract Specification

Contracts follow the [Web-Buddy Contract Specification v1.0.0](../specs/web-buddy-contract-specification.json) JSON Schema.

### Basic Structure

```json
{
  "version": "1.0.0",
  "domain": "myapp.com",
  "title": "My App Contract",
  "description": "Automation contract for My App",
  "capabilities": {
    "capabilityName": {
      "type": "action|query|form|navigation|file|wait",
      "description": "Human-readable description",
      "selector": "CSS selector or SelectorDefinition object",
      "parameters": [...],
      "validation": {...},
      "examples": [...]
    }
  },
  "context": {
    "urlPatterns": ["https://myapp.com/*"],
    "prerequisites": [...],
    "accessibility": {...}
  }
}
```

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

Requires ES2020 support for modern JavaScript features.

## Installation

```bash
npm install @web-buddy/contract-declaration
```

Or via CDN:
```html
<script src="https://unpkg.com/@web-buddy/contract-declaration@latest/dist/index.js"></script>
```

## Contributing

This library is part of the [Web-Buddy ecosystem](https://github.com/web-buddy). Contributions welcome!

## License

MIT License - see [LICENSE](LICENSE) file for details.