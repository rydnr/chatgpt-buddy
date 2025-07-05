/**
 * @fileoverview Contract Builder
 * @description Fluent API for building Web-Buddy automation contracts
 */

import {
  WebBuddyContract,
  AutomationCapability,
  CapabilityType,
  SelectorDefinition,
  ParameterDefinition,
  WorkflowDefinition,
  ContractMetadata,
  ContractContext,
  ValidationRules,
  WaitCondition,
  ExecutionCondition,
  CapabilityExample
} from './types/contract-types';

/**
 * Fluent builder for creating Web-Buddy contracts
 */
export class ContractBuilder {
  private contract: Partial<WebBuddyContract> = {
    version: '1.0.0',
    capabilities: {},
    selectors: {},
    workflows: {}
  };

  /**
   * Set basic contract information
   */
  public info(options: {
    domain: string;
    title: string;
    description?: string;
  }): ContractBuilder {
    this.contract.domain = options.domain;
    this.contract.title = options.title;
    if (options.description) {
      this.contract.description = options.description;
    }
    return this;
  }

  /**
   * Set contract metadata
   */
  public metadata(metadata: ContractMetadata): ContractBuilder {
    this.contract.metadata = { ...this.contract.metadata, ...metadata };
    return this;
  }

  /**
   * Set contract context
   */
  public context(context: ContractContext): ContractBuilder {
    this.contract.context = { ...this.contract.context, ...context };
    return this;
  }

  /**
   * Add a capability to the contract
   */
  public capability(name: string): CapabilityBuilder {
    return new CapabilityBuilder(this, name);
  }

  /**
   * Add a reusable selector definition
   */
  public selector(name: string, definition: SelectorDefinition): ContractBuilder {
    if (!this.contract.selectors) {
      this.contract.selectors = {};
    }
    this.contract.selectors[name] = definition;
    return this;
  }

  /**
   * Add a workflow definition
   */
  public workflow(name: string): WorkflowBuilder {
    return new WorkflowBuilder(this, name);
  }

  /**
   * Internal method to add capability
   */
  public addCapability(name: string, capability: AutomationCapability): ContractBuilder {
    this.contract.capabilities![name] = capability;
    return this;
  }

  /**
   * Internal method to add workflow
   */
  public addWorkflow(name: string, workflow: WorkflowDefinition): ContractBuilder {
    if (!this.contract.workflows) {
      this.contract.workflows = {};
    }
    this.contract.workflows[name] = workflow;
    return this;
  }

  /**
   * Build and return the final contract
   */
  public build(): WebBuddyContract {
    if (!this.contract.domain || !this.contract.title) {
      throw new Error('Domain and title are required');
    }

    return this.contract as WebBuddyContract;
  }

  /**
   * Create a new contract builder
   */
  public static create(): ContractBuilder {
    return new ContractBuilder();
  }
}

/**
 * Fluent builder for automation capabilities
 */
export class CapabilityBuilder {
  private capability: Partial<AutomationCapability> = {};

  constructor(
    private contractBuilder: ContractBuilder,
    private name: string
  ) {}

  /**
   * Set capability type and description
   */
  public type(type: CapabilityType, description: string): CapabilityBuilder {
    this.capability.type = type;
    this.capability.description = description;
    return this;
  }

  /**
   * Set the selector for this capability
   */
  public selector(selector: string | SelectorDefinition): CapabilityBuilder {
    this.capability.selector = selector;
    return this;
  }

  /**
   * Add a parameter to this capability
   */
  public parameter(param: ParameterDefinition): CapabilityBuilder {
    if (!this.capability.parameters) {
      this.capability.parameters = [];
    }
    this.capability.parameters.push(param);
    return this;
  }

  /**
   * Set validation rules
   */
  public validation(rules: ValidationRules): CapabilityBuilder {
    this.capability.validation = rules;
    return this;
  }

  /**
   * Set timeout for capability execution
   */
  public timeout(milliseconds: number): CapabilityBuilder {
    this.capability.timeout = milliseconds;
    return this;
  }

  /**
   * Set retry attempts
   */
  public retries(count: number): CapabilityBuilder {
    this.capability.retries = count;
    return this;
  }

  /**
   * Add execution condition
   */
  public condition(condition: ExecutionCondition): CapabilityBuilder {
    if (!this.capability.conditions) {
      this.capability.conditions = [];
    }
    this.capability.conditions.push(condition);
    return this;
  }

  /**
   * Add usage example
   */
  public example(example: CapabilityExample): CapabilityBuilder {
    if (!this.capability.examples) {
      this.capability.examples = [];
    }
    this.capability.examples.push(example);
    return this;
  }

  /**
   * Complete capability and return to contract builder
   */
  public done(): ContractBuilder {
    if (!this.capability.type || !this.capability.description || !this.capability.selector) {
      throw new Error('Type, description, and selector are required for capability');
    }

    return this.contractBuilder.addCapability(this.name, this.capability as AutomationCapability);
  }
}

/**
 * Fluent builder for workflows
 */
export class WorkflowBuilder {
  private workflow: Partial<WorkflowDefinition> = {
    steps: []
  };

  constructor(
    private contractBuilder: ContractBuilder,
    private name: string
  ) {}

  /**
   * Set workflow description
   */
  public description(description: string): WorkflowBuilder {
    this.workflow.description = description;
    return this;
  }

  /**
   * Add a parameter to the workflow
   */
  public parameter(param: ParameterDefinition): WorkflowBuilder {
    if (!this.workflow.parameters) {
      this.workflow.parameters = [];
    }
    this.workflow.parameters.push(param);
    return this;
  }

  /**
   * Add a step to the workflow
   */
  public step(capability: string, parameters?: Record<string, any>): WorkflowBuilder {
    this.workflow.steps!.push({
      capability,
      parameters
    });
    return this;
  }

  /**
   * Complete workflow and return to contract builder
   */
  public done(): ContractBuilder {
    if (!this.workflow.description) {
      throw new Error('Description is required for workflow');
    }

    return this.contractBuilder.addWorkflow(this.name, this.workflow as WorkflowDefinition);
  }
}

/**
 * Utility functions for common capability patterns
 */
export class CapabilityPatterns {
  /**
   * Create a text input capability
   */
  public static textInput(options: {
    selector: string;
    description: string;
    required?: boolean;
    placeholder?: string;
  }): AutomationCapability {
    return {
      type: 'form',
      description: options.description,
      selector: options.selector,
      parameters: [
        {
          name: 'text',
          type: 'string',
          description: 'Text to input',
          required: options.required ?? true,
          validation: options.placeholder ? {
            minLength: 1
          } : undefined
        }
      ],
      validation: {
        elementExists: true,
        elementVisible: true,
        elementEnabled: true
      }
    };
  }

  /**
   * Create a button click capability
   */
  public static button(options: {
    selector: string;
    description: string;
    waitAfterClick?: number;
  }): AutomationCapability {
    const capability: AutomationCapability = {
      type: 'action',
      description: options.description,
      selector: options.selector,
      validation: {
        elementExists: true,
        elementVisible: true,
        elementEnabled: true
      }
    };

    if (options.waitAfterClick) {
      capability.timeout = options.waitAfterClick;
    }

    return capability;
  }

  /**
   * Create a navigation capability
   */
  public static navigation(options: {
    selector: string;
    description: string;
    urlPattern?: string;
  }): AutomationCapability {
    const capability: AutomationCapability = {
      type: 'navigation',
      description: options.description,
      selector: options.selector
    };

    if (options.urlPattern) {
      capability.conditions = [
        {
          type: 'url',
          urlPattern: options.urlPattern
        }
      ];
    }

    return capability;
  }

  /**
   * Create a query capability for extracting data
   */
  public static query(options: {
    selector: string;
    description: string;
    returnType?: 'string' | 'number' | 'array' | 'object';
  }): AutomationCapability {
    return {
      type: 'query',
      description: options.description,
      selector: options.selector,
      returnType: {
        type: options.returnType || 'string',
        description: `Extracted ${options.returnType || 'text'} content`
      }
    };
  }
}

/**
 * Utility functions for common selector patterns
 */
export class SelectorPatterns {
  /**
   * Create a robust selector with multiple fallbacks
   */
  public static robust(options: {
    primary: string;
    fallbacks: string[];
    waitCondition?: WaitCondition;
  }): SelectorDefinition {
    return {
      primary: options.primary,
      fallback: options.fallbacks,
      wait: options.waitCondition
    };
  }

  /**
   * Create an ARIA-based selector
   */
  public static aria(options: {
    role?: string;
    label?: string;
    labelledBy?: string;
    fallback?: string[];
  }): SelectorDefinition {
    let primary = '';
    
    if (options.role) {
      primary += `[role="${options.role}"]`;
    }
    
    if (options.label) {
      primary += `[aria-label*="${options.label}"]`;
    }
    
    if (options.labelledBy) {
      primary += `[aria-labelledby="${options.labelledBy}"]`;
    }

    return {
      primary,
      fallback: options.fallback,
      validator: `
        return element.getAttribute('aria-label') !== null || 
               element.getAttribute('role') !== null ||
               element.getAttribute('aria-labelledby') !== null;
      `
    };
  }

  /**
   * Create a data-testid based selector
   */
  public static testId(testId: string, fallback?: string[]): SelectorDefinition {
    return {
      primary: `[data-testid="${testId}"]`,
      fallback: fallback || [`[data-test="${testId}"]`, `[test-id="${testId}"]`]
    };
  }
}