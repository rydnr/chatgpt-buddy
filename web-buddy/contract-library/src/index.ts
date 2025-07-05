/**
 * @fileoverview Web-Buddy Contract Declaration Library
 * @description JavaScript library for web applications to declare automation contracts
 * @author Web-Buddy Team
 */

// Core types
export * from './types/contract-types';

// Contract building and validation
export { ContractBuilder, CapabilityBuilder, WorkflowBuilder, CapabilityPatterns, SelectorPatterns } from './contract-builder';
export { ContractValidator } from './contract-validator';

// Contract registry and discovery
export { 
  ContractRegistry, 
  ContractRegisteredEvent, 
  ContractsDiscoveredEvent, 
  contractRegistry,
  registerContract,
  discoverContracts
} from './contract-registry';

// Decorators for TypeScript applications
export * from './decorators/automation-decorators';

// Utilities
export { SelectorUtils } from './utils/selector-utils';

// Integration modules
export { WebComponentsIntegration } from './integration/web-components';
export { AriaIntegration } from './integration/aria-integration';

// Re-export for convenience
export { contractRegistry as registry };

/**
 * Initialize the contract library
 */
export function initialize(): void {
  // Auto-discovery is already initialized in the registry
  console.log('✅ Web-Buddy Contract Library initialized');
}

/**
 * Create a simple contract for quick setup
 */
export function createSimpleContract(options: {
  domain: string;
  title: string;
  description?: string;
  capabilities: Array<{
    name: string;
    type: 'action' | 'query' | 'form' | 'navigation';
    description: string;
    selector: string;
  }>;
}) {
  const builder = ContractBuilder.create()
    .info({
      domain: options.domain,
      title: options.title,
      description: options.description
    });

  for (const cap of options.capabilities) {
    builder.capability(cap.name)
      .type(cap.type, cap.description)
      .selector(cap.selector)
      .done();
  }

  return builder.build();
}

/**
 * Quick registration helper
 */
export function quickRegister(options: {
  domain: string;
  title: string;
  description?: string;
  capabilities: Array<{
    name: string;
    type: 'action' | 'query' | 'form' | 'navigation';
    description: string;
    selector: string;
  }>;
}) {
  const contract = createSimpleContract(options);
  return contractRegistry.register(contract);
}

// Auto-initialize when loaded
if (typeof window !== 'undefined') {
  // Browser environment
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }
}