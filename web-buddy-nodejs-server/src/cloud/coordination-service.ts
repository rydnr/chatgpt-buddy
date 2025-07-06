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

import { Application } from 'typescript-eda-application';
import { EventBus } from 'typescript-eda-infrastructure';
import { Listen } from 'typescript-eda-infrastructure';
import { 
  AutomationWorkflowSubmittedEvent,
  ClientHeartbeatEvent,
  WorkflowScheduledEvent,
  WorkflowRejectedEvent,
  WorkflowQueuedEvent
} from '../core/events/cloud-events';
import { WorkflowEngine } from './workflow-engine';
import { ClientRegistry } from './client-registry';
import { SecurityService } from './security-service';
import { AutomationWorkflow } from './domain/automation-workflow';

/**
 * Cloud Coordination Service
 * 
 * Central orchestration service managing automation workflows across distributed clients.
 * Handles workflow submission, validation, scheduling, and execution coordination.
 */
export class CloudCoordinationService extends Application {
  constructor(
    eventBus: EventBus,
    private workflowEngine: WorkflowEngine,
    private clientRegistry: ClientRegistry,
    private securityService: SecurityService
  ) {
    super(eventBus, new Map([
      ['workflowEngine', workflowEngine],
      ['clientRegistry', clientRegistry],
      ['securityService', securityService]
    ]));
  }

  /**
   * Handles workflow submission from clients
   */
  @Listen('AutomationWorkflowSubmittedEvent')
  async handleWorkflowSubmitted(event: AutomationWorkflowSubmittedEvent): Promise<void> {
    try {
      // 1. Validate workflow and permissions
      const validation = await this.securityService.validateWorkflow(
        event.workflow,
        event.submittedBy
      );

      if (!validation.isValid) {
        await this.publishEvent(new WorkflowRejectedEvent(
          event.workflowId,
          validation.errors,
          event.correlationId
        ));
        return;
      }

      // 2. Find available clients for execution
      const availableClients = await this.clientRegistry.findCapableClients(
        event.workflow.requiredCapabilities
      );

      if (availableClients.length === 0) {
        await this.publishEvent(new WorkflowQueuedEvent(
          event.workflowId,
          'No available clients with required capabilities',
          event.correlationId
        ));
        return;
      }

      // 3. Select best client based on load and capability match
      const selectedClient = this.selectOptimalClient(
        availableClients,
        event.workflow
      );

      // 4. Schedule workflow execution
      const execution = await this.workflowEngine.scheduleExecution(
        event.workflow,
        selectedClient
      );

      await this.publishEvent(new WorkflowScheduledEvent(
        event.workflowId,
        execution.id,
        selectedClient.id,
        event.correlationId
      ));

    } catch (error) {
      await this.publishEvent(new WorkflowRejectedEvent(
        event.workflowId,
        [`Unexpected error: ${error.message}`],
        event.correlationId
      ));
    }
  }

  /**
   * Handles client heartbeat updates
   */
  @Listen('ClientHeartbeatEvent')
  async handleClientHeartbeat(event: ClientHeartbeatEvent): Promise<void> {
    try {
      // Update client status and capabilities
      await this.clientRegistry.updateClientStatus(
        event.clientId,
        event.status,
        event.capabilities
      );

      // Check for pending workflows that can now be executed
      const pendingWorkflows = await this.workflowEngine.getPendingWorkflows();
      
      for (const workflow of pendingWorkflows) {
        if (this.clientCanExecute(event, workflow)) {
          await this.scheduleWorkflowExecution(workflow, event.clientId);
        }
      }

    } catch (error) {
      console.error(`Failed to process heartbeat from client ${event.clientId}:`, error);
    }
  }

  /**
   * Selects the optimal client for workflow execution
   */
  private selectOptimalClient(
    availableClients: any[],
    workflow: AutomationWorkflow
  ): any {
    // Sort clients by:
    // 1. Capability match score (exact matches preferred)
    // 2. Current load (lower is better)
    // 3. Performance history (faster clients preferred)
    return availableClients.sort((a, b) => {
      const scoreA = this.calculateClientScore(a, workflow);
      const scoreB = this.calculateClientScore(b, workflow);
      return scoreB - scoreA; // Higher score is better
    })[0];
  }

  /**
   * Calculates a score for client selection
   */
  private calculateClientScore(client: any, workflow: AutomationWorkflow): number {
    let score = 0;

    // Capability match score (0-100)
    const capabilityScore = this.calculateCapabilityMatchScore(
      client.capabilities,
      workflow.requiredCapabilities
    );
    score += capabilityScore * 0.4; // 40% weight

    // Load score (0-100, inverted so lower load = higher score)
    const loadScore = Math.max(0, 100 - client.currentLoad);
    score += loadScore * 0.3; // 30% weight

    // Performance score (0-100)
    const performanceScore = client.averageExecutionTime > 0 
      ? Math.min(100, 10000 / client.averageExecutionTime) // Faster = higher score
      : 50; // Default score for new clients
    score += performanceScore * 0.2; // 20% weight

    // Availability score (0-100)
    const availabilityScore = client.uptime * 100;
    score += availabilityScore * 0.1; // 10% weight

    return score;
  }

  /**
   * Calculates how well client capabilities match workflow requirements
   */
  private calculateCapabilityMatchScore(
    clientCapabilities: any[],
    requiredCapabilities: any[]
  ): number {
    if (requiredCapabilities.length === 0) return 100;

    let matchScore = 0;
    for (const required of requiredCapabilities) {
      const match = clientCapabilities.find(cap => 
        cap.name === required.name
      );

      if (match) {
        // Exact version match gets full points
        if (match.version === required.version) {
          matchScore += 100;
        }
        // Compatible version gets partial points
        else if (this.isVersionCompatible(match.version, required.version)) {
          matchScore += 80;
        }
        // Incompatible version gets minimal points
        else {
          matchScore += 20;
        }
      }
      // No capability match gets zero points
    }

    return matchScore / requiredCapabilities.length;
  }

  /**
   * Checks if client can execute a specific workflow
   */
  private clientCanExecute(
    clientEvent: ClientHeartbeatEvent,
    workflow: AutomationWorkflow
  ): boolean {
    // Client must be available
    if (clientEvent.status !== 'available') {
      return false;
    }

    // Client must have all required capabilities
    return workflow.requiredCapabilities.every(required =>
      clientEvent.capabilities.some(available =>
        available.name === required.name &&
        this.isVersionCompatible(available.version, required.version)
      )
    );
  }

  /**
   * Checks if versions are compatible
   */
  private isVersionCompatible(availableVersion: string, requiredVersion: string): boolean {
    // Simple semver compatibility check
    const [availableMajor, availableMinor] = availableVersion.split('.').map(Number);
    const [requiredMajor, requiredMinor] = requiredVersion.split('.').map(Number);

    // Major version must match exactly
    if (availableMajor !== requiredMajor) {
      return false;
    }

    // Minor version must be >= required
    return availableMinor >= requiredMinor;
  }

  /**
   * Schedules workflow execution on specific client
   */
  private async scheduleWorkflowExecution(
    workflow: AutomationWorkflow,
    clientId: string
  ): Promise<void> {
    const execution = await this.workflowEngine.scheduleExecution(
      workflow,
      { id: clientId }
    );

    await this.publishEvent(new WorkflowScheduledEvent(
      workflow.id,
      execution.id,
      clientId,
      workflow.correlationId || 'auto-scheduled'
    ));
  }

  /**
   * Gets service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const [
        workflowEngineHealth,
        clientRegistryHealth,
        securityServiceHealth
      ] = await Promise.all([
        this.workflowEngine.getHealthStatus(),
        this.clientRegistry.getHealthStatus(),
        this.securityService.getHealthStatus()
      ]);

      const allHealthy = [
        workflowEngineHealth,
        clientRegistryHealth,
        securityServiceHealth
      ].every(health => health.status === 'healthy');

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        details: {
          workflowEngine: workflowEngineHealth,
          clientRegistry: clientRegistryHealth,
          securityService: securityServiceHealth,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Gets service metrics for monitoring
   */
  async getMetrics(): Promise<Record<string, any>> {
    const [
      workflowMetrics,
      clientMetrics
    ] = await Promise.all([
      this.workflowEngine.getMetrics(),
      this.clientRegistry.getMetrics()
    ]);

    return {
      workflows: workflowMetrics,
      clients: clientMetrics,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}