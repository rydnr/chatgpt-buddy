/**
 * Shared types for Web-Buddy framework
 * 
 * These types are used across all Web-Buddy packages and implementations
 */

// Re-export core types from @web-buddy/core
export type {
  CorrelationId,
  WebBuddyMessage,
  WebBuddyResponse,
  WebBuddyClientConfig,
  WebBuddyEvent,
  MessageHandler
} from '../packages/core/src/types/web-buddy-types';

// Common automation result types
export interface AutomationResult {
  success: boolean;
  data?: any;
  error?: string;
  correlationId: string;
  timestamp: number;
  executionTime?: number;
}

// Element interaction types
export interface ElementSelector {
  selector: string;
  waitForVisible?: boolean;
  timeout?: number;
}

export interface ClickOptions {
  button?: 'left' | 'right' | 'middle';
  clickCount?: number;
  delay?: number;
}

export interface TypeOptions {
  delay?: number;
  clear?: boolean;
}

// Page navigation types
export interface NavigationOptions {
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle';
  timeout?: number;
}

// Cross-site automation types
export interface MultiSiteWorkflow {
  id: string;
  name: string;
  description: string;
  sites: string[];
  steps: WorkflowStep[];
}

export interface WorkflowStep {
  id: string;
  site: string;
  action: string;
  parameters: Record<string, any>;
  expectedResult?: any;
}

// Pattern management types
export interface AutomationPattern {
  id: string;
  name: string;
  description: string;
  domain: string;
  version: string;
  steps: PatternStep[];
  metadata: PatternMetadata;
}

export interface PatternStep {
  id: string;
  type: string;
  parameters: Record<string, any>;
  expectedOutcome?: string;
  timeout?: number;
}

export interface PatternMetadata {
  createdBy: string;
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  usageCount: number;
  successRate: number;
}

// Testing and validation types
export interface TestScenario {
  id: string;
  name: string;
  description: string;
  preconditions: string[];
  steps: TestStep[];
  assertions: TestAssertion[];
}

export interface TestStep {
  id: string;
  description: string;
  action: string;
  parameters: Record<string, any>;
}

export interface TestAssertion {
  id: string;
  description: string;
  type: 'element-exists' | 'element-text' | 'page-url' | 'custom';
  selector?: string;
  expectedValue?: any;
  customValidator?: string;
}

// Framework extension types
export interface DomainImplementation {
  domain: string;
  name: string;
  version: string;
  messageTypes: string[];
  handlers: Record<string, any>;
  clientMethods: Record<string, any>;
}

export interface FrameworkExtension {
  name: string;
  version: string;
  description: string;
  domains: DomainImplementation[];
  dependencies: string[];
}