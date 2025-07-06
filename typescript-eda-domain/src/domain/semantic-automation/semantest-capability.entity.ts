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
 * @fileoverview SemanTestCapability entity representing automation capabilities
 * @author Semantest Team
 * @module domain/semantic-automation/semantest-capability
 */

import { Entity } from '../entity';
import { ParameterDefinition, ParameterType } from './semantest-contract.entity';

/**
 * Properties for SemanTestCapability entity
 */
export interface SemanTestCapabilityProps {
  readonly id: string;
  readonly name: string;
  readonly type: CapabilityType;
  readonly description: string;
  readonly selector: string | SelectorDefinition;
  readonly parameters?: ParameterDefinition[];
  readonly returnType?: ReturnTypeDefinition;
  readonly validation?: ValidationRules;
  readonly timeout?: number;
  readonly retries?: number;
  readonly conditions?: ExecutionCondition[];
  readonly examples?: CapabilityExample[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * Types of automation capabilities
 */
export type CapabilityType = 'action' | 'query' | 'navigation' | 'form' | 'file' | 'wait' | 'validation';

/**
 * Selector definition with fallback strategies
 */
export interface SelectorDefinition {
  readonly primary: string;
  readonly fallback?: string[];
  readonly wait?: WaitCondition;
  readonly validator?: string;
  readonly frame?: string;
  readonly shadowRoot?: boolean;
}

/**
 * Return type definition
 */
export interface ReturnTypeDefinition {
  readonly type: ParameterType | 'void';
  readonly description?: string;
  readonly schema?: object;
  readonly examples?: any[];
}

/**
 * Validation rules for capabilities
 */
export interface ValidationRules {
  readonly elementExists?: boolean;
  readonly elementVisible?: boolean;
  readonly elementEnabled?: boolean;
  readonly customValidator?: string;
}

/**
 * Wait condition definitions
 */
export interface WaitCondition {
  readonly type: WaitType;
  readonly timeout?: number;
  readonly text?: string;
  readonly customCondition?: string;
}

/**
 * Wait types
 */
export type WaitType = 'visible' | 'present' | 'hidden' | 'enabled' | 'text' | 'custom';

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
 * Capability examples
 */
export interface CapabilityExample {
  readonly description: string;
  readonly parameters: Record<string, any>;
  readonly expectedResult?: any;
  readonly executionTime?: number;
}

/**
 * Validation result for capabilities
 */
export interface CapabilityValidationResult {
  readonly valid: boolean;
  readonly errors: string[];
  readonly warnings: string[];
  readonly timestamp: Date;
}

/**
 * SemanTestCapability entity representing individual automation capabilities
 * Extends Entity from typescript-eda-domain for consistent domain modeling
 */
export class SemanTestCapability extends Entity<SemanTestCapabilityProps> {
  
  constructor(props: SemanTestCapabilityProps) {
    super(props);
  }

  /**
   * Factory method to create a new capability
   */
  static create(
    id: string,
    name: string,
    type: CapabilityType,
    description: string,
    selector: string | SelectorDefinition,
    options?: {
      parameters?: ParameterDefinition[];
      returnType?: ReturnTypeDefinition;
      validation?: ValidationRules;
      timeout?: number;
      retries?: number;
      conditions?: ExecutionCondition[];
      examples?: CapabilityExample[];
    }
  ): SemanTestCapability {
    const now = new Date();
    
    return new SemanTestCapability({
      id,
      name,
      type,
      description,
      selector,
      parameters: options?.parameters,
      returnType: options?.returnType,
      validation: options?.validation,
      timeout: options?.timeout,
      retries: options?.retries,
      conditions: options?.conditions,
      examples: options?.examples,
      createdAt: now,
      updatedAt: now
    });
  }

  /**
   * Get capability ID
   */
  getId(): string {
    return this.get('id');
  }

  /**
   * Get capability name
   */
  getName(): string {
    return this.get('name');
  }

  /**
   * Get capability type
   */
  getType(): CapabilityType {
    return this.get('type');
  }

  /**
   * Get capability description
   */
  getDescription(): string {
    return this.get('description');
  }

  /**
   * Get element selector
   */
  getSelector(): string | SelectorDefinition {
    return this.get('selector');
  }

  /**
   * Get primary selector string
   */
  getPrimarySelector(): string {
    const selector = this.getSelector();
    return typeof selector === 'string' ? selector : selector.primary;
  }

  /**
   * Get fallback selectors
   */
  getFallbackSelectors(): string[] {
    const selector = this.getSelector();
    return typeof selector === 'string' ? [] : (selector.fallback || []);
  }

  /**
   * Get all selectors (primary + fallbacks)
   */
  getAllSelectors(): string[] {
    return [this.getPrimarySelector(), ...this.getFallbackSelectors()];
  }

  /**
   * Get capability parameters
   */
  getParameters(): ParameterDefinition[] {
    return this.get('parameters') || [];
  }

  /**
   * Get required parameters
   */
  getRequiredParameters(): ParameterDefinition[] {
    return this.getParameters().filter(param => param.required);
  }

  /**
   * Get optional parameters
   */
  getOptionalParameters(): ParameterDefinition[] {
    return this.getParameters().filter(param => !param.required);
  }

  /**
   * Get parameter by name
   */
  getParameter(name: string): ParameterDefinition | undefined {
    return this.getParameters().find(param => param.name === name);
  }

  /**
   * Check if capability has parameter
   */
  hasParameter(name: string): boolean {
    return this.getParameters().some(param => param.name === name);
  }

  /**
   * Get return type definition
   */
  getReturnType(): ReturnTypeDefinition | undefined {
    return this.get('returnType');
  }

  /**
   * Get validation rules
   */
  getValidation(): ValidationRules | undefined {
    return this.get('validation');
  }

  /**
   * Get execution timeout
   */
  getTimeout(): number | undefined {
    return this.get('timeout');
  }

  /**
   * Get retry attempts
   */
  getRetries(): number | undefined {
    return this.get('retries');
  }

  /**
   * Get execution conditions
   */
  getConditions(): ExecutionCondition[] {
    return this.get('conditions') || [];
  }

  /**
   * Get capability examples
   */
  getExamples(): CapabilityExample[] {
    return this.get('examples') || [];
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
   * Check if capability is an action type
   */
  isAction(): boolean {
    return this.getType() === 'action';
  }

  /**
   * Check if capability is a query type
   */
  isQuery(): boolean {
    return this.getType() === 'query';
  }

  /**
   * Check if capability is a form type
   */
  isForm(): boolean {
    return this.getType() === 'form';
  }

  /**
   * Check if capability requires parameters
   */
  requiresParameters(): boolean {
    return this.getRequiredParameters().length > 0;
  }

  /**
   * Validate parameter values against capability definition
   */
  validateParameters(parameters: Record<string, any>): {
    valid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required parameters
    for (const requiredParam of this.getRequiredParameters()) {
      if (!(requiredParam.name in parameters)) {
        errors.push(`Required parameter '${requiredParam.name}' is missing`);
      }
    }

    // Validate provided parameters
    for (const [paramName, paramValue] of Object.entries(parameters)) {
      const paramDef = this.getParameter(paramName);
      
      if (!paramDef) {
        warnings.push(`Unknown parameter '${paramName}' provided`);
        continue;
      }

      // Type validation
      const expectedType = paramDef.type;
      const actualType = typeof paramValue;
      
      if (expectedType === 'array' && !Array.isArray(paramValue)) {
        errors.push(`Parameter '${paramName}' expected array, got ${actualType}`);
      } else if (expectedType !== 'array' && actualType !== expectedType) {
        errors.push(`Parameter '${paramName}' expected ${expectedType}, got ${actualType}`);
      }

      // Validation rules
      if (paramDef.validation) {
        const validation = paramDef.validation;
        
        if (typeof paramValue === 'string') {
          if (validation.minLength && paramValue.length < validation.minLength) {
            errors.push(`Parameter '${paramName}' must be at least ${validation.minLength} characters`);
          }
          if (validation.maxLength && paramValue.length > validation.maxLength) {
            errors.push(`Parameter '${paramName}' must be at most ${validation.maxLength} characters`);
          }
          if (validation.pattern && !new RegExp(validation.pattern).test(paramValue)) {
            errors.push(`Parameter '${paramName}' does not match required pattern`);
          }
        }
        
        if (typeof paramValue === 'number') {
          if (validation.minimum !== undefined && paramValue < validation.minimum) {
            errors.push(`Parameter '${paramName}' must be at least ${validation.minimum}`);
          }
          if (validation.maximum !== undefined && paramValue > validation.maximum) {
            errors.push(`Parameter '${paramName}' must be at most ${validation.maximum}`);
          }
        }
        
        if (validation.enum && !validation.enum.includes(paramValue)) {
          errors.push(`Parameter '${paramName}' must be one of: ${validation.enum.join(', ')}`);
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Validate capability structure and configuration
   */
  validate(): CapabilityValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate required fields
    if (!this.getId()) {
      errors.push('Capability ID is required');
    }

    if (!this.getName()) {
      errors.push('Capability name is required');
    }

    if (!this.getDescription()) {
      errors.push('Capability description is required');
    }

    if (!this.getPrimarySelector()) {
      errors.push('Primary selector is required');
    }

    // Validate selector syntax (basic check)
    try {
      const primarySelector = this.getPrimarySelector();
      if (primarySelector && !this.isValidCSSSelector(primarySelector)) {
        warnings.push('Primary selector may not be valid CSS');
      }

      const fallbackSelectors = this.getFallbackSelectors();
      for (const selector of fallbackSelectors) {
        if (!this.isValidCSSSelector(selector)) {
          warnings.push(`Fallback selector '${selector}' may not be valid CSS`);
        }
      }
    } catch (error) {
      warnings.push('Could not validate selector syntax');
    }

    // Validate parameters
    const paramNames = new Set<string>();
    for (const param of this.getParameters()) {
      if (paramNames.has(param.name)) {
        errors.push(`Duplicate parameter name: ${param.name}`);
      }
      paramNames.add(param.name);

      if (!param.name) {
        errors.push('Parameter name is required');
      }

      if (!param.type) {
        errors.push(`Parameter '${param.name}' type is required`);
      }
    }

    // Validate examples
    for (const [index, example] of this.getExamples().entries()) {
      if (!example.description) {
        warnings.push(`Example ${index + 1} is missing description`);
      }

      // Validate example parameters against capability definition
      const paramValidation = this.validateParameters(example.parameters);
      if (!paramValidation.valid) {
        errors.push(`Example ${index + 1}: ${paramValidation.errors.join(', ')}`);
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
   * Basic CSS selector validation
   */
  private isValidCSSSelector(selector: string): boolean {
    try {
      // Basic syntax check - this could be more comprehensive
      return selector.trim().length > 0 && 
             !selector.includes('><') && 
             !selector.includes('<<');
    } catch {
      return false;
    }
  }

  /**
   * Convert capability to JSON for serialization
   */
  toJSON(): Record<string, any> {
    return {
      id: this.getId(),
      name: this.getName(),
      type: this.getType(),
      description: this.getDescription(),
      selector: this.getSelector(),
      parameters: this.getParameters(),
      returnType: this.getReturnType(),
      validation: this.getValidation(),
      timeout: this.getTimeout(),
      retries: this.getRetries(),
      conditions: this.getConditions(),
      examples: this.getExamples(),
      createdAt: this.getCreatedAt().toISOString(),
      updatedAt: this.getUpdatedAt().toISOString()
    };
  }

  /**
   * Create capability from JSON
   */
  static fromJSON(json: any): SemanTestCapability {
    return new SemanTestCapability({
      id: json.id,
      name: json.name,
      type: json.type,
      description: json.description,
      selector: json.selector,
      parameters: json.parameters,
      returnType: json.returnType,
      validation: json.validation,
      timeout: json.timeout,
      retries: json.retries,
      conditions: json.conditions,
      examples: json.examples,
      createdAt: new Date(json.createdAt),
      updatedAt: new Date(json.updatedAt)
    });
  }
}