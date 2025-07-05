/**
 * @fileoverview Automation Decorators
 * @description TypeScript decorators for declaring automation capabilities
 */

import { WebBuddyContract, AutomationCapability, CapabilityType } from '../types/contract-types';
import { contractRegistry } from '../contract-registry';

/**
 * Metadata storage for decorator information
 */
const decoratorMetadata = new Map<any, {
  capabilities: Map<string, AutomationCapability>;
  contractInfo?: Partial<WebBuddyContract>;
}>();

/**
 * Class decorator to define a Web-Buddy automation contract
 */
export function AutomationContract(options: {
  domain: string;
  title: string;
  description?: string;
  version?: string;
}): ClassDecorator {
  return function (target: any) {
    const metadata = getOrCreateMetadata(target);
    metadata.contractInfo = {
      domain: options.domain,
      title: options.title,
      description: options.description,
      version: options.version || '1.0.0'
    };

    // Auto-register the contract when class is instantiated
    const originalConstructor = target;
    const newConstructor = function (...args: any[]) {
      const instance = new originalConstructor(...args);
      registerContractFromClass(target);
      return instance;
    };

    // Preserve prototype and static properties
    newConstructor.prototype = originalConstructor.prototype;
    Object.setPrototypeOf(newConstructor, originalConstructor);

    return newConstructor as any;
  };
}

/**
 * Method decorator to define an automation capability
 */
export function Capability(options: {
  type: CapabilityType;
  description: string;
  selector: string;
  timeout?: number;
  retries?: number;
}): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const metadata = getOrCreateMetadata(target.constructor);
    
    const capability: AutomationCapability = {
      type: options.type,
      description: options.description,
      selector: options.selector,
      timeout: options.timeout,
      retries: options.retries
    };

    metadata.capabilities.set(propertyKey.toString(), capability);

    // Enhance method to support automation execution
    const originalMethod = descriptor.value;
    descriptor.value = function (...args: any[]) {
      console.log(`Executing capability: ${propertyKey.toString()}`);
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Method decorator for action capabilities
 */
export function Action(options: {
  description: string;
  selector: string;
  timeout?: number;
}): MethodDecorator {
  return Capability({
    type: 'action',
    description: options.description,
    selector: options.selector,
    timeout: options.timeout
  });
}

/**
 * Method decorator for query capabilities
 */
export function Query(options: {
  description: string;
  selector: string;
  timeout?: number;
}): MethodDecorator {
  return Capability({
    type: 'query',
    description: options.description,
    selector: options.selector,
    timeout: options.timeout
  });
}

/**
 * Method decorator for navigation capabilities
 */
export function Navigation(options: {
  description: string;
  selector: string;
  timeout?: number;
}): MethodDecorator {
  return Capability({
    type: 'navigation',
    description: options.description,
    selector: options.selector,
    timeout: options.timeout
  });
}

/**
 * Method decorator for form capabilities
 */
export function Form(options: {
  description: string;
  selector: string;
  timeout?: number;
}): MethodDecorator {
  return Capability({
    type: 'form',
    description: options.description,
    selector: options.selector,
    timeout: options.timeout
  });
}

/**
 * Parameter decorator to define capability parameters
 */
export function Parameter(options: {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';
  description?: string;
  required?: boolean;
  validation?: any;
}): ParameterDecorator {
  return function (target: any, propertyKey: string | symbol | undefined, parameterIndex: number) {
    // Store parameter metadata for later use
    const existingMetadata = Reflect.getMetadata('automation:parameters', target, propertyKey!) || [];
    existingMetadata[parameterIndex] = options;
    Reflect.defineMetadata('automation:parameters', existingMetadata, target, propertyKey!);
  };
}

/**
 * Property decorator to define selectors
 */
export function Selector(selector: string): PropertyDecorator {
  return function (target: any, propertyKey: string | symbol) {
    // Store selector metadata
    Reflect.defineMetadata('automation:selector', selector, target, propertyKey);
  };
}

/**
 * Get or create metadata for a class
 */
function getOrCreateMetadata(target: any) {
  if (!decoratorMetadata.has(target)) {
    decoratorMetadata.set(target, {
      capabilities: new Map(),
      contractInfo: undefined
    });
  }
  return decoratorMetadata.get(target)!;
}

/**
 * Register contract from decorated class
 */
function registerContractFromClass(target: any): void {
  const metadata = decoratorMetadata.get(target);
  if (!metadata || !metadata.contractInfo) {
    console.warn('No contract metadata found for class');
    return;
  }

  const capabilities: Record<string, AutomationCapability> = {};
  metadata.capabilities.forEach((capability, name) => {
    capabilities[name] = capability;
  });

  const contract: WebBuddyContract = {
    version: metadata.contractInfo.version || '1.0.0',
    domain: metadata.contractInfo.domain!,
    title: metadata.contractInfo.title!,
    description: metadata.contractInfo.description,
    capabilities
  };

  contractRegistry.register(contract);
}

/**
 * Example usage decorator for demonstration
 */
export function Example(description: string, parameters: Record<string, any>): MethodDecorator {
  return function (target: any, propertyKey: string | symbol, descriptor: PropertyDescriptor) {
    const examples = Reflect.getMetadata('automation:examples', target, propertyKey) || [];
    examples.push({ description, parameters });
    Reflect.defineMetadata('automation:examples', examples, target, propertyKey);
    return descriptor;
  };
}

/**
 * Utility to extract contract from decorated class
 */
export function extractContract(classConstructor: any): WebBuddyContract | null {
  const metadata = decoratorMetadata.get(classConstructor);
  if (!metadata || !metadata.contractInfo) {
    return null;
  }

  const capabilities: Record<string, AutomationCapability> = {};
  metadata.capabilities.forEach((capability, name) => {
    capabilities[name] = capability;
  });

  return {
    version: metadata.contractInfo.version || '1.0.0',
    domain: metadata.contractInfo.domain!,
    title: metadata.contractInfo.title!,
    description: metadata.contractInfo.description,
    capabilities
  };
}

/**
 * Utility to get all decorated classes
 */
export function getAllDecoratedContracts(): WebBuddyContract[] {
  const contracts: WebBuddyContract[] = [];
  
  decoratorMetadata.forEach((metadata, target) => {
    if (metadata.contractInfo) {
      const contract = extractContract(target);
      if (contract) {
        contracts.push(contract);
      }
    }
  });

  return contracts;
}

// Make reflect-metadata available if not already loaded
if (typeof Reflect === 'undefined' || !Reflect.getMetadata) {
  console.warn('reflect-metadata is required for automation decorators to work properly');
}