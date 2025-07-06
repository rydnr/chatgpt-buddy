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
 * @fileoverview Semantic automation contract-related events
 * @author Semantest Team
 * @module domain/semantic-automation/events/semantest-contract-events
 */

import { Event } from '../../event';
import { SemanTestContract } from '../semantest-contract.entity';

/**
 * Contract discovered event payload
 */
export interface ContractDiscoveredPayload {
  readonly contract: SemanTestContract;
  readonly domain: string;
  readonly discoveryMethod: 'automatic' | 'manual' | 'ai-assisted';
  readonly confidence: number;
  readonly timestamp: Date;
  readonly discoveryContext?: {
    readonly url?: string;
    readonly userAgent?: string;
    readonly discoveredBy?: string;
  };
}

/**
 * Contract validated event payload
 */
export interface ContractValidatedPayload {
  readonly contractId: string;
  readonly domain: string;
  readonly validationResult: {
    readonly valid: boolean;
    readonly errors: string[];
    readonly warnings: string[];
    readonly score: number;
  };
  readonly validationType: 'structure' | 'execution' | 'cross-browser' | 'accessibility';
  readonly timestamp: Date;
  readonly validationContext?: {
    readonly browser?: string;
    readonly environment?: string;
    readonly performanceMetrics?: Record<string, number>;
  };
}

/**
 * Contract executed event payload
 */
export interface ContractExecutedPayload {
  readonly contractId: string;
  readonly domain: string;
  readonly capabilityName: string;
  readonly parameters: Record<string, any>;
  readonly result: {
    readonly success: boolean;
    readonly data?: any;
    readonly error?: string;
    readonly executionTime: number;
  };
  readonly timestamp: Date;
  readonly executionContext?: {
    readonly correlationId?: string;
    readonly sessionId?: string;
    readonly clientId?: string;
    readonly browser?: string;
  };
}

/**
 * Contract updated event payload
 */
export interface ContractUpdatedPayload {
  readonly contractId: string;
  readonly domain: string;
  readonly previousVersion: string;
  readonly newVersion: string;
  readonly changes: {
    readonly type: 'capability_added' | 'capability_removed' | 'capability_modified' | 'metadata_updated';
    readonly details: Record<string, any>;
  }[];
  readonly updatedBy: string;
  readonly timestamp: Date;
}

/**
 * Contract learning updated event payload
 */
export interface ContractLearningUpdatedPayload {
  readonly contractId: string;
  readonly domain: string;
  readonly learningType: 'success_pattern' | 'failure_pattern' | 'performance_optimization' | 'selector_improvement';
  readonly improvement: {
    readonly description: string;
    readonly confidence: number;
    readonly impact: 'low' | 'medium' | 'high';
    readonly appliedAutomatically: boolean;
  };
  readonly timestamp: Date;
  readonly learningContext?: {
    readonly dataPoints: number;
    readonly learningAlgorithm?: string;
    readonly trainingPeriod?: string;
  };
}

/**
 * Event fired when a new automation contract is discovered
 */
export class ContractDiscoveredEvent extends Event {
  constructor(payload: ContractDiscoveredPayload) {
    super(payload);
  }

  /**
   * Get the discovered contract
   */
  getContract(): SemanTestContract {
    return (this.payload as ContractDiscoveredPayload).contract;
  }

  /**
   * Get the domain where contract was discovered
   */
  getDomain(): string {
    return (this.payload as ContractDiscoveredPayload).domain;
  }

  /**
   * Get discovery method
   */
  getDiscoveryMethod(): 'automatic' | 'manual' | 'ai-assisted' {
    return (this.payload as ContractDiscoveredPayload).discoveryMethod;
  }

  /**
   * Get discovery confidence score
   */
  getConfidence(): number {
    return (this.payload as ContractDiscoveredPayload).confidence;
  }

  /**
   * Get discovery timestamp
   */
  getTimestamp(): Date {
    return (this.payload as ContractDiscoveredPayload).timestamp;
  }
}

/**
 * Event fired when a contract is validated
 */
export class ContractValidatedEvent extends Event {
  constructor(payload: ContractValidatedPayload) {
    super(payload);
  }

  /**
   * Get contract ID
   */
  getContractId(): string {
    return (this.payload as ContractValidatedPayload).contractId;
  }

  /**
   * Get validation result
   */
  getValidationResult(): ContractValidatedPayload['validationResult'] {
    return (this.payload as ContractValidatedPayload).validationResult;
  }

  /**
   * Check if validation passed
   */
  isValid(): boolean {
    return (this.payload as ContractValidatedPayload).validationResult.valid;
  }

  /**
   * Get validation type
   */
  getValidationType(): ContractValidatedPayload['validationType'] {
    return (this.payload as ContractValidatedPayload).validationType;
  }
}

/**
 * Event fired when a contract capability is executed
 */
export class ContractExecutedEvent extends Event {
  constructor(payload: ContractExecutedPayload) {
    super(payload);
  }

  /**
   * Get contract ID
   */
  getContractId(): string {
    return (this.payload as ContractExecutedPayload).contractId;
  }

  /**
   * Get executed capability name
   */
  getCapabilityName(): string {
    return (this.payload as ContractExecutedPayload).capabilityName;
  }

  /**
   * Get execution parameters
   */
  getParameters(): Record<string, any> {
    return (this.payload as ContractExecutedPayload).parameters;
  }

  /**
   * Get execution result
   */
  getResult(): ContractExecutedPayload['result'] {
    return (this.payload as ContractExecutedPayload).result;
  }

  /**
   * Check if execution was successful
   */
  isSuccessful(): boolean {
    return (this.payload as ContractExecutedPayload).result.success;
  }

  /**
   * Get execution time in milliseconds
   */
  getExecutionTime(): number {
    return (this.payload as ContractExecutedPayload).result.executionTime;
  }
}

/**
 * Event fired when a contract is updated
 */
export class ContractUpdatedEvent extends Event {
  constructor(payload: ContractUpdatedPayload) {
    super(payload);
  }

  /**
   * Get contract ID
   */
  getContractId(): string {
    return (this.payload as ContractUpdatedPayload).contractId;
  }

  /**
   * Get previous version
   */
  getPreviousVersion(): string {
    return (this.payload as ContractUpdatedPayload).previousVersion;
  }

  /**
   * Get new version
   */
  getNewVersion(): string {
    return (this.payload as ContractUpdatedPayload).newVersion;
  }

  /**
   * Get list of changes
   */
  getChanges(): ContractUpdatedPayload['changes'] {
    return (this.payload as ContractUpdatedPayload).changes;
  }

  /**
   * Get who updated the contract
   */
  getUpdatedBy(): string {
    return (this.payload as ContractUpdatedPayload).updatedBy;
  }
}

/**
 * Event fired when contract learning is updated through AI/ML
 */
export class ContractLearningUpdatedEvent extends Event {
  constructor(payload: ContractLearningUpdatedPayload) {
    super(payload);
  }

  /**
   * Get contract ID
   */
  getContractId(): string {
    return (this.payload as ContractLearningUpdatedPayload).contractId;
  }

  /**
   * Get learning type
   */
  getLearningType(): ContractLearningUpdatedPayload['learningType'] {
    return (this.payload as ContractLearningUpdatedPayload).learningType;
  }

  /**
   * Get improvement details
   */
  getImprovement(): ContractLearningUpdatedPayload['improvement'] {
    return (this.payload as ContractLearningUpdatedPayload).improvement;
  }

  /**
   * Check if improvement was applied automatically
   */
  wasAppliedAutomatically(): boolean {
    return (this.payload as ContractLearningUpdatedPayload).improvement.appliedAutomatically;
  }

  /**
   * Get improvement confidence score
   */
  getConfidence(): number {
    return (this.payload as ContractLearningUpdatedPayload).improvement.confidence;
  }
}