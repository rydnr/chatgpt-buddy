/*
                        Semantest Browser Automation Framework

    Copyright (C) 2025-today  Semantest Team

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

/**
 * @fileoverview Core type definitions for Semantest framework
 * @description TypeScript type definitions for intelligent web automation
 */

/**
 * Semantest client configuration options
 */
export interface SemanTestClientOptions {
  /** WebSocket server URL for communication */
  serverUrl: string;
  
  /** Connection timeout in milliseconds */
  timeout?: number;
  
  /** Maximum retry attempts for failed operations */
  retries?: number;
  
  /** Enable debug logging */
  debug?: boolean;
  
  /** Custom headers for WebSocket connection */
  headers?: Record<string, string>;
  
  /** Client identification */
  clientId?: string;
  
  /** User agent string */
  userAgent?: string;
  
  /** Enable contract validation */
  enableContractValidation?: boolean;
  
  /** Enable performance monitoring */
  enablePerformanceMonitoring?: boolean;
  
  /** Enable AI learning capabilities */
  enableAILearning?: boolean;
}

/**
 * Semantest server configuration options
 */
export interface SemanTestServerOptions {
  /** HTTP server port */
  port?: number;
  
  /** WebSocket server port (if different from HTTP) */
  wsPort?: number;
  
  /** Host address to bind to */
  host?: string;
  
  /** Enable CORS */
  enableCors?: boolean;
  
  /** CORS allowed origins */
  corsOrigins?: string[];
  
  /** Maximum concurrent connections */
  maxConnections?: number;
  
  /** Session timeout in milliseconds */
  sessionTimeout?: number;
  
  /** Enable request logging */
  enableLogging?: boolean;
  
  /** Enable metrics collection */
  enableMetrics?: boolean;
}

/**
 * Semantest message configuration options
 */
export interface SemanTestMessageOptions {
  /** Message type identifier */
  type: string;
  
  /** Message payload data */
  payload: Record<string, any>;
  
  /** Correlation ID for request tracking */
  correlationId?: string;
  
  /** Target domain for the message */
  domain?: string;
  
  /** Message priority level */
  priority?: MessagePriority;
  
  /** Message timeout in milliseconds */
  timeout?: number;
  
  /** Enable retry on failure */
  enableRetry?: boolean;
  
  /** Maximum retry attempts */
  maxRetries?: number;
}

/**
 * Semantest contract configuration options
 */
export interface SemanTestContractOptions {
  /** Contract version */
  version: string;
  
  /** Target domain */
  domain: string;
  
  /** Contract title */
  title: string;
  
  /** Contract description */
  description?: string;
  
  /** Contract capabilities */
  capabilities: Record<string, SemanTestCapabilityOptions>;
  
  /** Contract workflows */
  workflows?: Record<string, WorkflowOptions>;
  
  /** Contract metadata */
  metadata?: ContractMetadata;
  
  /** Validation rules */
  validation?: ContractValidationRules;
}

/**
 * Semantest capability configuration options
 */
export interface SemanTestCapabilityOptions {
  /** Capability type */
  type: CapabilityType;
  
  /** Capability description */
  description: string;
  
  /** Element selector */
  selector: string | SelectorDefinition;
  
  /** Capability parameters */
  parameters?: ParameterDefinition[];
  
  /** Return type definition */
  returnType?: ReturnTypeDefinition;
  
  /** Validation rules */
  validation?: ValidationRules;
  
  /** Execution timeout */
  timeout?: number;
  
  /** Retry configuration */
  retries?: number;
  
  /** Execution conditions */
  conditions?: ExecutionCondition[];
  
  /** Usage examples */
  examples?: CapabilityExample[];
}

/**
 * Message priority levels
 */
export type MessagePriority = 'low' | 'normal' | 'high' | 'critical';

/**
 * Capability types
 */
export type CapabilityType = 'action' | 'query' | 'navigation' | 'form' | 'file' | 'wait' | 'validation';

/**
 * Selector definition with fallback strategies
 */
export interface SelectorDefinition {
  /** Primary selector */
  primary: string;
  
  /** Fallback selectors */
  fallback?: string[];
  
  /** Wait condition */
  wait?: WaitCondition;
  
  /** Selector validator */
  validator?: string;
  
  /** Frame context */
  frame?: string;
  
  /** Shadow DOM support */
  shadowRoot?: boolean;
}

/**
 * Parameter definition for capabilities
 */
export interface ParameterDefinition {
  /** Parameter name */
  name: string;
  
  /** Parameter type */
  type: ParameterType;
  
  /** Parameter description */
  description?: string;
  
  /** Required parameter */
  required?: boolean;
  
  /** Default value */
  default?: any;
  
  /** Validation rules */
  validation?: ParameterValidation;
  
  /** Usage examples */
  examples?: any[];
  
  /** Minimum length (for strings) */
  minLength?: number;
  
  /** Maximum length (for strings) */
  maxLength?: number;
  
  /** Minimum value (for numbers) */
  minimum?: number;
  
  /** Maximum value (for numbers) */
  maximum?: number;
}

/**
 * Parameter data types
 */
export type ParameterType = 'string' | 'number' | 'boolean' | 'object' | 'array' | 'file';

/**
 * Return type definition
 */
export interface ReturnTypeDefinition {
  /** Return type */
  type: ParameterType | 'void';
  
  /** Return description */
  description?: string;
  
  /** Return schema */
  schema?: object;
  
  /** Return examples */
  examples?: any[];
}

/**
 * Validation rules for capabilities
 */
export interface ValidationRules {
  /** Element must exist */
  elementExists?: boolean;
  
  /** Element must be visible */
  elementVisible?: boolean;
  
  /** Element must be enabled */
  elementEnabled?: boolean;
  
  /** Custom validator function */
  customValidator?: string;
}

/**
 * Parameter validation rules
 */
export interface ParameterValidation {
  /** Minimum length */
  minLength?: number;
  
  /** Maximum length */
  maxLength?: number;
  
  /** Pattern validation */
  pattern?: string;
  
  /** Minimum value */
  minimum?: number;
  
  /** Maximum value */
  maximum?: number;
  
  /** Enumerated values */
  enum?: any[];
}

/**
 * Wait condition definitions
 */
export interface WaitCondition {
  /** Wait type */
  type: WaitType;
  
  /** Wait timeout */
  timeout?: number;
  
  /** Expected text */
  text?: string;
  
  /** Custom condition */
  customCondition?: string;
}

/**
 * Wait types
 */
export type WaitType = 'visible' | 'present' | 'hidden' | 'enabled' | 'text' | 'custom';

/**
 * Execution conditions
 */
export interface ExecutionCondition {
  /** Condition type */
  type: ConditionType;
  
  /** Target selector */
  selector?: string;
  
  /** URL pattern */
  urlPattern?: string;
  
  /** Expected text */
  text?: string;
  
  /** Custom condition */
  customCondition?: string;
  
  /** Negate condition */
  negate?: boolean;
}

/**
 * Condition types
 */
export type ConditionType = 'element' | 'url' | 'text' | 'custom';

/**
 * Capability examples
 */
export interface CapabilityExample {
  /** Example description */
  description: string;
  
  /** Example parameters */
  parameters: Record<string, any>;
  
  /** Expected result */
  expectedResult?: any;
}

/**
 * Workflow options
 */
export interface WorkflowOptions {
  /** Workflow description */
  description: string;
  
  /** Workflow parameters */
  parameters?: ParameterDefinition[];
  
  /** Workflow steps */
  steps: WorkflowStep[];
  
  /** Error handling */
  errorHandling?: ErrorHandling;
}

/**
 * Workflow step definition
 */
export interface WorkflowStep {
  /** Target capability */
  capability: string;
  
  /** Step parameters */
  parameters?: Record<string, any>;
  
  /** Execution condition */
  condition?: ExecutionCondition;
  
  /** Success action */
  onSuccess?: string;
  
  /** Failure action */
  onFailure?: string;
  
  /** Retry configuration */
  retry?: RetryConfiguration;
}

/**
 * Retry configuration
 */
export interface RetryConfiguration {
  /** Retry attempts */
  attempts: number;
  
  /** Retry delay */
  delay: number;
}

/**
 * Error handling strategy
 */
export interface ErrorHandling {
  /** Handling strategy */
  strategy: ErrorStrategy;
  
  /** Maximum retries */
  maxRetries?: number;
  
  /** Fallback capability */
  fallbackCapability?: string;
}

/**
 * Error handling strategies
 */
export type ErrorStrategy = 'abort' | 'continue' | 'retry' | 'fallback';

/**
 * Contract metadata
 */
export interface ContractMetadata {
  /** Contract author */
  author?: string;
  
  /** Creation date */
  created?: string;
  
  /** Last updated date */
  updated?: string;
  
  /** Compatibility score */
  compatibilityScore?: number;
  
  /** Contract tags */
  tags?: string[];
}

/**
 * Contract validation rules
 */
export interface ContractValidationRules {
  /** Require all capabilities to be validated */
  validateAllCapabilities?: boolean;
  
  /** Strict parameter validation */
  strictParameters?: boolean;
  
  /** Performance thresholds */
  performanceThresholds?: PerformanceThresholds;
  
  /** Accessibility requirements */
  accessibilityRequirements?: AccessibilityRequirements;
}

/**
 * Performance thresholds
 */
export interface PerformanceThresholds {
  /** Maximum execution time per capability */
  maxExecutionTime?: number;
  
  /** Maximum total workflow time */
  maxWorkflowTime?: number;
  
  /** Memory usage limits */
  maxMemoryUsage?: number;
}

/**
 * Accessibility requirements
 */
export interface AccessibilityRequirements {
  /** Require ARIA labels */
  requireAriaLabels?: boolean;
  
  /** Require keyboard accessibility */
  requireKeyboardAccess?: boolean;
  
  /** Minimum color contrast */
  minColorContrast?: number;
  
  /** Support screen readers */
  supportScreenReaders?: boolean;
}