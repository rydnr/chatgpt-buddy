/*
 * Copyright (C) 2024-present Semantest, rydnr
 *
 * This file is part of @semantest/nodejs.server.
 *
 * @semantest/nodejs.server is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @semantest/nodejs.server is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with @semantest/nodejs.server. If not, see <https://www.gnu.org/licenses/>.
 */

import { Event } from 'typescript-eda-domain';
import { AutomationWorkflow } from '../cloud/domain/automation-workflow';

/**
 * Base interface for user identification
 */
export interface UserId {
  id: string;
  organizationId?: string;
}

/**
 * Client capability definition
 */
export interface ClientCapability {
  name: string;
  version: string;
  description?: string;
  parameters?: Record<string, any>;
}

/**
 * Workflow execution performance metrics
 */
export interface WorkflowPerformance {
  executionTime: number;
  resourceUsage: Record<string, number>;
  errorRate: number;
  stepSuccessRate: number;
}

/**
 * Event fired when an automation workflow is submitted for execution
 */
export class AutomationWorkflowSubmittedEvent extends Event {
  public readonly type = 'AutomationWorkflowSubmittedEvent';

  constructor(
    public readonly workflowId: string,
    public readonly workflow: AutomationWorkflow,
    public readonly submittedBy: UserId,
    public readonly priority: 'low' | 'normal' | 'high' = 'normal',
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      workflowId: this.workflowId,
      workflow: this.workflow,
      submittedBy: this.submittedBy,
      priority: this.priority,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when a workflow is successfully scheduled for execution
 */
export class WorkflowScheduledEvent extends Event {
  public readonly type = 'WorkflowScheduledEvent';

  constructor(
    public readonly workflowId: string,
    public readonly executionId: string,
    public readonly assignedClientId: string,
    private readonly _correlationId: string,
    public readonly scheduledAt: Date = new Date()
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      workflowId: this.workflowId,
      executionId: this.executionId,
      assignedClientId: this.assignedClientId,
      scheduledAt: this.scheduledAt.toISOString(),
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when a workflow is rejected due to validation or permission issues
 */
export class WorkflowRejectedEvent extends Event {
  public readonly type = 'WorkflowRejectedEvent';

  constructor(
    public readonly workflowId: string,
    public readonly reasons: string[],
    private readonly _correlationId: string,
    public readonly rejectedAt: Date = new Date()
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      workflowId: this.workflowId,
      reasons: this.reasons,
      rejectedAt: this.rejectedAt.toISOString(),
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when a workflow is queued due to no available clients
 */
export class WorkflowQueuedEvent extends Event {
  public readonly type = 'WorkflowQueuedEvent';

  constructor(
    public readonly workflowId: string,
    public readonly reason: string,
    private readonly _correlationId: string,
    public readonly queuedAt: Date = new Date()
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      workflowId: this.workflowId,
      reason: this.reason,
      queuedAt: this.queuedAt.toISOString(),
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when a client sends a heartbeat with status and capabilities
 */
export class ClientHeartbeatEvent extends Event {
  public readonly type = 'ClientHeartbeatEvent';

  constructor(
    public readonly clientId: string,
    public readonly status: 'available' | 'busy' | 'offline' | 'maintenance',
    public readonly capabilities: ClientCapability[],
    public readonly currentLoad: number = 0,
    public readonly performance: {
      averageExecutionTime: number;
      successRate: number;
      uptime: number;
    },
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      clientId: this.clientId,
      status: this.status,
      capabilities: this.capabilities,
      currentLoad: this.currentLoad,
      performance: this.performance,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when a workflow execution is completed
 */
export class WorkflowExecutionCompletedEvent extends Event {
  public readonly type = 'WorkflowExecutionCompletedEvent';

  constructor(
    public readonly workflowId: string,
    public readonly executionId: string,
    public readonly clientId: string,
    public readonly success: boolean,
    public readonly workflow: AutomationWorkflow,
    public readonly performance: WorkflowPerformance,
    public readonly result?: any,
    public readonly error?: string,
    public readonly issues: string[] = [],
    public readonly suggestedImprovements: string[] = [],
    public readonly userFeedback?: { satisfaction: number; comments?: string },
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      workflowId: this.workflowId,
      executionId: this.executionId,
      clientId: this.clientId,
      success: this.success,
      workflow: this.workflow,
      performance: this.performance,
      result: this.result,
      error: this.error,
      issues: this.issues,
      suggestedImprovements: this.suggestedImprovements,
      userFeedback: this.userFeedback,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when an AI workflow generation is requested
 */
export class AIWorkflowRequestedEvent extends Event {
  public readonly type = 'AIWorkflowRequestedEvent';

  constructor(
    public readonly requestId: string,
    public readonly workflowType: string,
    public readonly objective: string,
    public readonly domain: string,
    public readonly requirements: Record<string, any>,
    public readonly availableCapabilities: ClientCapability[],
    public readonly constraints: Record<string, any> = {},
    public readonly examples: any[] = [],
    public readonly preferences: Record<string, any> = {},
    public readonly optimizationGoals: string[] = ['reliability', 'performance'],
    public readonly workflow?: AutomationWorkflow,
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      requestId: this.requestId,
      workflowType: this.workflowType,
      objective: this.objective,
      domain: this.domain,
      requirements: this.requirements,
      availableCapabilities: this.availableCapabilities,
      constraints: this.constraints,
      examples: this.examples,
      preferences: this.preferences,
      optimizationGoals: this.optimizationGoals,
      workflow: this.workflow,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when an AI workflow is successfully generated
 */
export class AIWorkflowGeneratedEvent extends Event {
  public readonly type = 'AIWorkflowGeneratedEvent';

  constructor(
    public readonly requestId: string,
    public readonly generatedWorkflow: AutomationWorkflow,
    public readonly modelId: string,
    public readonly confidence: number = 0.8,
    public readonly generationTime: number = 0,
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      requestId: this.requestId,
      generatedWorkflow: this.generatedWorkflow,
      modelId: this.modelId,
      confidence: this.confidence,
      generationTime: this.generationTime,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when AI workflow generation fails
 */
export class AIWorkflowGenerationFailedEvent extends Event {
  public readonly type = 'AIWorkflowGenerationFailedEvent';

  constructor(
    public readonly requestId: string,
    public readonly errors: string[],
    private readonly _correlationId: string,
    public readonly attemptCount: number = 1,
    public readonly maxAttempts: number = 3
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  get canRetry(): boolean {
    return this.attemptCount < this.maxAttempts;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      requestId: this.requestId,
      errors: this.errors,
      attemptCount: this.attemptCount,
      maxAttempts: this.maxAttempts,
      canRetry: this.canRetry,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when a client connects to the cloud service
 */
export class ClientConnectedEvent extends Event {
  public readonly type = 'ClientConnectedEvent';

  constructor(
    public readonly clientId: string,
    public readonly clientType: string,
    public readonly version: string,
    public readonly capabilities: ClientCapability[],
    public readonly metadata: Record<string, any> = {},
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      clientId: this.clientId,
      clientType: this.clientType,
      version: this.version,
      capabilities: this.capabilities,
      metadata: this.metadata,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when a client disconnects from the cloud service
 */
export class ClientDisconnectedEvent extends Event {
  public readonly type = 'ClientDisconnectedEvent';

  constructor(
    public readonly clientId: string,
    public readonly reason: 'graceful' | 'timeout' | 'error' | 'maintenance',
    public readonly lastSeen: Date,
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      clientId: this.clientId,
      reason: this.reason,
      lastSeen: this.lastSeen.toISOString(),
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}

/**
 * Event fired when system security validation is performed
 */
export class SecurityValidationEvent extends Event {
  public readonly type = 'SecurityValidationEvent';

  constructor(
    public readonly validationType: 'authentication' | 'authorization' | 'input-validation' | 'rate-limit',
    public readonly success: boolean,
    public readonly userId?: string,
    public readonly clientId?: string,
    public readonly details: Record<string, any> = {},
    public readonly securityLevel: 'low' | 'medium' | 'high' = 'medium',
    private readonly _correlationId: string
  ) {
    super();
  }

  get correlationId(): string {
    return this._correlationId;
  }

  toJSON(): Record<string, unknown> {
    return {
      type: this.type,
      validationType: this.validationType,
      success: this.success,
      userId: this.userId,
      clientId: this.clientId,
      details: this.details,
      securityLevel: this.securityLevel,
      correlationId: this.correlationId,
      timestamp: this.occurredOn.toISOString()
    };
  }
}