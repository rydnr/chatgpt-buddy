/**
 * @fileoverview Contract Type Definitions
 * @description TypeScript type definitions for Web-Buddy automation contracts
 */

/**
 * Web-Buddy automation contract specification
 */
export interface WebBuddyContract {
  version: string;
  domain: string;
  title: string;
  description?: string;
  metadata?: ContractMetadata;
  context?: ContractContext;
  capabilities: Record<string, AutomationCapability>;
  selectors?: Record<string, SelectorDefinition>;
  workflows?: Record<string, WorkflowDefinition>;
  events?: EventConfiguration;
}

/**
 * Contract metadata and versioning information
 */
export interface ContractMetadata {
  author?: string;
  created?: string;
  updated?: string;
  compatibilityScore?: number;
  tags?: string[];
}

/**
 * Context conditions for when contract applies
 */
export interface ContractContext {
  urlPatterns?: string[];
  titlePatterns?: string[];
  bodyClasses?: string[];
  prerequisites?: PrerequisiteCondition[];
}

/**
 * Automation capability definition
 */
export interface AutomationCapability {
  type: CapabilityType;
  description: string;
  selector: string | SelectorDefinition;
  parameters?: ParameterDefinition[];
  returnType?: ReturnTypeDefinition;
  validation?: ValidationRules;
  timeout?: number;
  retries?: number;
  conditions?: ExecutionCondition[];
  examples?: CapabilityExample[];
}

/**
 * Types of automation capabilities
 */
export type CapabilityType = 'action' | 'query' | 'navigation' | 'form' | 'file' | 'wait';

/**
 * Selector definition with fallback strategies
 */
export interface SelectorDefinition {
  primary: string;
  fallback?: string[];
  wait?: WaitCondition;
  validator?: string;
  frame?: string;
  shadowRoot?: boolean;
}

/**
 * Parameter definition for capabilities
 */
export interface ParameterDefinition {
  name: string;
  type: ParameterType;
  description?: string;
  required?: boolean;
  default?: any;
  validation?: ParameterValidation;
  examples?: any[];
}

/**
 * Parameter data types
 */
export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

/**
 * Return type definition
 */
export interface ReturnTypeDefinition {
  type: ParameterType | 'void';
  description?: string;
  schema?: object;
  examples?: any[];
}

/**
 * Validation rules for capabilities
 */
export interface ValidationRules {
  elementExists?: boolean;
  elementVisible?: boolean;
  elementEnabled?: boolean;
  customValidator?: string;
}

/**
 * Parameter validation rules
 */
export interface ParameterValidation {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  minimum?: number;
  maximum?: number;
  enum?: any[];
}

/**
 * Wait condition definitions
 */
export interface WaitCondition {
  type: WaitType;
  timeout?: number;
  text?: string;
  customCondition?: string;
}

/**
 * Types of wait conditions
 */
export type WaitType = 'visible' | 'present' | 'hidden' | 'enabled' | 'text' | 'custom';

/**
 * Execution conditions
 */
export interface ExecutionCondition {
  type: ConditionType;
  selector?: string;
  urlPattern?: string;
  text?: string;
  customCondition?: string;
  negate?: boolean;
}

/**
 * Types of execution conditions
 */
export type ConditionType = 'element' | 'url' | 'text' | 'custom';

/**
 * Prerequisite conditions
 */
export interface PrerequisiteCondition {
  type: PrerequisiteType;
  description: string;
  selector?: string;
  required?: boolean;
}

/**
 * Types of prerequisites
 */
export type PrerequisiteType = 'authentication' | 'permission' | 'feature' | 'element';

/**
 * Workflow definition for multi-step automation
 */
export interface WorkflowDefinition {
  description: string;
  parameters?: ParameterDefinition[];
  steps: WorkflowStep[];
  errorHandling?: ErrorHandling;
}

/**
 * Individual workflow step
 */
export interface WorkflowStep {
  capability: string;
  parameters?: Record<string, any>;
  condition?: ExecutionCondition;
  onSuccess?: string;
  onFailure?: string;
  retry?: RetryConfiguration;
}

/**
 * Retry configuration
 */
export interface RetryConfiguration {
  attempts: number;
  delay: number;
}

/**
 * Error handling strategy
 */
export interface ErrorHandling {
  strategy: ErrorStrategy;
  maxRetries?: number;
  fallbackCapability?: string;
}

/**
 * Error handling strategies
 */
export type ErrorStrategy = 'abort' | 'continue' | 'retry' | 'fallback';

/**
 * Event configuration
 */
export interface EventConfiguration {
  incoming?: EventDefinition[];
  outgoing?: EventDefinition[];
}

/**
 * Event definition
 */
export interface EventDefinition {
  name: string;
  description: string;
  schema?: object;
  examples?: any[];
}

/**
 * Capability example
 */
export interface CapabilityExample {
  description: string;
  parameters: Record<string, any>;
  expectedResult?: any;
}

/**
 * Contract validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  path: string;
  message: string;
  code: string;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
}