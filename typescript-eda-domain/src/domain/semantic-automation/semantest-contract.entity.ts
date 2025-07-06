// Copyright 2025-today Semantest Team
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview SemanTestContract entity representing automation contracts
 * @author Semantest Team
 * @module domain/semantic-automation/semantest-contract
 */

import { Entity } from '../entity';
import { SemanTestCapability } from './semantest-capability.entity';

/**
 * Properties for SemanTestContract entity
 */
export interface SemanTestContractProps {
  readonly id: string;
  readonly version: string;
  readonly domain: string;
  readonly title: string;
  readonly description?: string;
  readonly capabilities: Record<string, SemanTestCapability>;
  readonly workflows?: Record<string, WorkflowDefinition>;
  readonly metadata?: ContractMetadata;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Workflow definition for multi-step automation
 */
export interface WorkflowDefinition {
  readonly description: string;
  readonly parameters?: ParameterDefinition[];
  readonly steps: WorkflowStep[];
  readonly errorHandling?: ErrorHandling;
}

/**
 * Individual workflow step
 */
export interface WorkflowStep {
  readonly capability: string;
  readonly parameters?: Record<string, any>;
  readonly condition?: ExecutionCondition;
  readonly onSuccess?: string;
  readonly onFailure?: string;
  readonly retry?: RetryConfiguration;
}

/**
 * Parameter definition for workflows and capabilities
 */
export interface ParameterDefinition {
  readonly name: string;
  readonly type: ParameterType;
  readonly description?: string;
  readonly required?: boolean;
  readonly default?: any;
  readonly validation?: ParameterValidation;
  readonly examples?: any[];
}

/**
 * Parameter data types
 */
export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

/**
 * Parameter validation rules
 */
export interface ParameterValidation {
  readonly minLength?: number;
  readonly maxLength?: number;
  readonly pattern?: string;
  readonly minimum?: number;
  readonly maximum?: number;
  readonly enum?: any[];
}

/**
 * Execution conditions
 */
export interface ExecutionCondition {
  readonly type: ConditionType;
  readonly selector?: string;
  readonly urlPattern?: string;
  readonly text?: string;
  readonly customCondition?: string;
  readonly negate?: boolean;
}

/**
 * Condition types
 */
export type ConditionType = 'element' | 'url' | 'text' | 'custom';

/**
 * Retry configuration
 */
export interface RetryConfiguration {
  readonly attempts: number;
  readonly delay: number;
}

/**
 * Error handling strategy
 */
export interface ErrorHandling {
  readonly strategy: ErrorStrategy;
  readonly maxRetries?: number;
  readonly fallbackCapability?: string;
}

/**
 * Error handling strategies
 */
export type ErrorStrategy = 'abort' | 'continue' | 'retry' | 'fallback';

/**
 * Contract metadata
 */
export interface ContractMetadata {
  readonly author?: string;
  readonly tags?: string[];
  readonly compatibilityScore?: number;
  readonly validationResults?: ValidationResult[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly timestamp: Date;
}

/**
 * SemanTestContract entity representing automation contracts
 * Extends Entity from typescript-eda-domain for consistent domain modeling
 */
export class SemanTestContract extends Entity<SemanTestContractProps> {
  
  constructor(props: SemanTestContractProps) {
    super(props);
  }

  /**
   * Factory method to create a new contract
   */
  static create(
    id: string,
    version: string,
    domain: string,
    title: string,
    capabilities: Record<string, SemanTestCapability>,
    options?: {
      description?: string;
      workflows?: Record<string, WorkflowDefinition>;
      metadata?: ContractMetadata;
    }
  ): SemanTestContract {
    const now = new Date();
    
    return new SemanTestContract({
      id,
      version,
      domain,
      title,
      description: options?.description,
      capabilities,
      workflows: options?.workflows,
      metadata: options?.metadata,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Get contract ID
   */
  getId(): string {
    return this.get('id');
  }

  /**
   * Get contract version
   */
  getVersion(): string {
    return this.get('version');
  }

  /**
   * Get target domain
   */
  getDomain(): string {
    return this.get('domain');
  }

  /**
   * Get contract title
   */
  getTitle(): string {
    return this.get('title');
  }

  /**
   * Get contract description
   */
  getDescription(): string | undefined {
    return this.get('description');
  }

  /**
   * Get all capabilities
   */
  getCapabilities(): Record<string, SemanTestCapability> {
    return this.get('capabilities');
  }

  /**
   * Get specific capability by name
   */
  getCapability(name: string): SemanTestCapability | undefined {
    return this.get('capabilities')[name];
  }

  /**
   * Get capability names
   */
  getCapabilityNames(): string[] {
    return Object.keys(this.get('capabilities'));
  }

  /**
   * Check if contract has capability
   */
  hasCapability(name: string): boolean {
    return name in this.get('capabilities');
  }

  /**
   * Get workflows
   */
  getWorkflows(): Record<string, WorkflowDefinition> | undefined {
    return this.get('workflows');
  }

  /**
   * Get specific workflow by name
   */
  getWorkflow(name: string): WorkflowDefinition | undefined {
    const workflows = this.get('workflows');
    return workflows ? workflows[name] : undefined;
  }

  /**
   * Get contract metadata
   */
  getMetadata(): ContractMetadata | undefined {
    return this.get('metadata');
  }

  /**
   * Get creation timestamp
   */
  getCreatedAt(): Date {
    return this.get('createdAt');
  }

  /**
   * Get last update timestamp
   */
  getUpdatedAt(): Date {
    return this.get('updatedAt');
  }

  /**
   * Add or update capability
   */
  withCapability(name: string, capability: SemanTestCapability): SemanTestContract {
    const capabilities = { ...this.get('capabilities') };
    capabilities[name] = capability;
    
    return new SemanTestContract({
      ...this.props,
      capabilities,
      updatedAt: new Date()
    });
  }

  /**
   * Remove capability
   */
  withoutCapability(name: string): SemanTestContract {
    const capabilities = { ...this.get('capabilities') };
    delete capabilities[name];
    
    return new SemanTestContract({
      ...this.props,
      capabilities,
      updatedAt: new Date()
    });
  }

  /**
   * Update contract metadata
   */
  withMetadata(metadata: ContractMetadata): SemanTestContract {
    return new SemanTestContract({
      ...this.props,
      metadata,
      updatedAt: new Date()
    });
  }

  /**
   * Add workflow
   */
  withWorkflow(name: string, workflow: WorkflowDefinition): SemanTestContract {
    const workflows = { ...this.get('workflows') };
    workflows[name] = workflow;
    
    return new SemanTestContract({
      ...this.props,
      workflows,
      updatedAt: new Date()
    });
  }

  /**
   * Validate contract structure and capabilities
   */
  validate(): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!this.getId()) {
      errors.push('Contract ID is required');
    }

    if (!this.getVersion()) {
      errors.push('Contract version is required');
    }

    if (!this.getDomain()) {
      errors.push('Contract domain is required');
    }

    if (!this.getTitle()) {
      errors.push('Contract title is required');
    }

    // Validate capabilities
    const capabilities = this.getCapabilities();
    if (Object.keys(capabilities).length === 0) {
      warnings.push('Contract has no capabilities defined');
    }

    // Validate each capability
    for (const [name, capability] of Object.entries(capabilities)) {
      try {
        const capabilityValidation = capability.validate();
        if (!capabilityValidation.valid) {
          errors.push(`Capability '${name}': ${capabilityValidation.errors.join(', ')}`);
        }
        if (capabilityValidation.warnings.length > 0) {
          warnings.push(`Capability '${name}': ${capabilityValidation.warnings.join(', ')}`);
        }
      } catch (error) {
        errors.push(`Capability '${name}': ${error.message}`);
      }
    }

    // Validate workflows
    const workflows = this.getWorkflows();
    if (workflows) {
      for (const [name, workflow] of Object.entries(workflows)) {
        for (const step of workflow.steps) {
          if (!this.hasCapability(step.capability)) {
            errors.push(`Workflow '${name}' references unknown capability '${step.capability}'`);
          }
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      timestamp: new Date()
    };
  }

  /**
   * Convert contract to JSON for serialization
   */
  toJSON(): Record<string, any> {
    const capabilities: Record<string, any> = {};
    for (const [name, capability] of Object.entries(this.get('capabilities'))) {
      capabilities[name] = capability.toJSON();
    }

    return {
      id: this.getId(),
      version: this.getVersion(),
      domain: this.getDomain(),
      title: this.getTitle(),
      description: this.getDescription(),
      capabilities,
      workflows: this.getWorkflows(),
      metadata: this.getMetadata(),
      createdAt: this.getCreatedAt().toISOString(),
      updatedAt: this.getUpdatedAt().toISOString()
    };
  }

  /**
   * Create contract from JSON
   */
  static fromJSON(json: any): SemanTestContract {
    // Convert capabilities from JSON
    const capabilities: Record<string, SemanTestCapability> = {};
    if (json.capabilities) {
      for (const [name, capabilityJson] of Object.entries(json.capabilities)) {
        capabilities[name] = SemanTestCapability.fromJSON(capabilityJson);
      }
    }

    return new SemanTestContract({
      id: json.id,
      version: json.version,
      domain: json.domain,
      title: json.title,
      description: json.description,
      capabilities,
      workflows: json.workflows,
      metadata: json.metadata,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    });
  }
}