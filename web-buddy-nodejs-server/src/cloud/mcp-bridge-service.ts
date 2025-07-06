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
  AIWorkflowRequestedEvent,
  WorkflowExecutionCompletedEvent,
  AIWorkflowGeneratedEvent,
  AIWorkflowGenerationFailedEvent
} from '../core/events/cloud-events';
import { MCPClient } from './adapters/mcp-client';
import { AIModelRegistry } from './ai-model-registry';
import { WorkflowService } from './workflow-service';
import { AutomationWorkflow } from './domain/automation-workflow';

/**
 * MCP Bridge Service
 * 
 * Integration service for Model Context Protocol (MCP) that enables AI-powered
 * workflow generation, optimization, and learning capabilities.
 */
export class MCPBridgeService extends Application {
  constructor(
    eventBus: EventBus,
    private mcpClient: MCPClient,
    private aiModelRegistry: AIModelRegistry,
    private workflowService: WorkflowService
  ) {
    super(eventBus, new Map([
      ['mcpClient', mcpClient],
      ['aiModelRegistry', aiModelRegistry],
      ['workflowService', workflowService]
    ]));
  }

  /**
   * Handles AI workflow generation requests
   */
  @Listen('AIWorkflowRequestedEvent')
  async handleAIWorkflowRequested(event: AIWorkflowRequestedEvent): Promise<void> {
    try {
      // 1. Determine appropriate AI model for the task
      const model = await this.aiModelRegistry.selectModel(
        event.workflowType,
        event.requirements
      );

      if (!model) {
        await this.publishEvent(new AIWorkflowGenerationFailedEvent(
          event.requestId,
          ['No suitable AI model found for workflow type'],
          event.correlationId
        ));
        return;
      }

      // 2. Create MCP context with workflow requirements
      const context = await this.mcpClient.createContext({
        modelId: model.id,
        workflow: event.workflow,
        capabilities: event.availableCapabilities,
        constraints: event.constraints,
        examples: event.examples || [],
        preferences: event.preferences || {}
      });

      // 3. Request AI workflow generation
      const mcpRequest = {
        contextId: context.id,
        objective: event.objective,
        domain: event.domain,
        examples: event.examples || [],
        preferences: event.preferences || {},
        optimizationGoals: event.optimizationGoals || ['reliability', 'performance']
      };

      const aiWorkflow = await this.mcpClient.generateWorkflow(mcpRequest);

      // 4. Validate generated workflow
      const validation = await this.workflowService.validateWorkflow(aiWorkflow);

      if (validation.isValid) {
        // 5. Enhance workflow with metadata
        const enhancedWorkflow = this.enhanceWorkflowWithAIMetadata(
          aiWorkflow,
          model,
          context
        );

        await this.publishEvent(new AIWorkflowGeneratedEvent(
          event.requestId,
          enhancedWorkflow,
          model.id,
          event.correlationId
        ));
      } else {
        // 6. Attempt workflow repair if validation fails
        const repairedWorkflow = await this.attemptWorkflowRepair(
          aiWorkflow,
          validation.errors,
          context
        );

        if (repairedWorkflow) {
          await this.publishEvent(new AIWorkflowGeneratedEvent(
            event.requestId,
            repairedWorkflow,
            model.id,
            event.correlationId
          ));
        } else {
          await this.publishEvent(new AIWorkflowGenerationFailedEvent(
            event.requestId,
            validation.errors,
            event.correlationId
          ));
        }
      }

    } catch (error) {
      await this.publishEvent(new AIWorkflowGenerationFailedEvent(
        event.requestId,
        [`AI workflow generation failed: ${error.message}`],
        event.correlationId
      ));
    }
  }

  /**
   * Handles workflow execution completion for AI learning
   */
  @Listen('WorkflowExecutionCompletedEvent')
  async handleWorkflowCompleted(event: WorkflowExecutionCompletedEvent): Promise<void> {
    try {
      // Only process AI-generated workflows
      if (!event.workflow.metadata?.generatedByAI) {
        return;
      }

      // Provide feedback to AI model for learning
      const feedback = {
        workflowId: event.workflowId,
        modelId: event.workflow.metadata.modelId,
        contextId: event.workflow.metadata.contextId,
        success: event.success,
        performance: {
          executionTime: event.performance.executionTime,
          resourceUsage: event.performance.resourceUsage,
          errorRate: event.performance.errorRate,
          stepSuccessRate: event.performance.stepSuccessRate
        },
        issues: event.issues || [],
        improvements: event.suggestedImprovements || [],
        qualityScore: this.calculateWorkflowQualityScore(event),
        userSatisfaction: event.userFeedback?.satisfaction
      };

      await this.mcpClient.provideFeedback(feedback);

      // Update model performance metrics
      await this.aiModelRegistry.updateModelPerformance(
        feedback.modelId,
        feedback.success,
        feedback.performance,
        feedback.qualityScore
      );

    } catch (error) {
      console.error('Failed to provide AI feedback:', error);
    }
  }

  /**
   * Requests workflow optimization from AI
   */
  async optimizeWorkflow(
    workflow: AutomationWorkflow,
    executionHistory: any[],
    optimizationGoals: string[]
  ): Promise<AutomationWorkflow | null> {
    try {
      const model = await this.aiModelRegistry.selectModel(
        'optimization',
        { domain: workflow.domain }
      );

      if (!model) {
        return null;
      }

      const context = await this.mcpClient.createContext({
        modelId: model.id,
        workflow,
        executionHistory,
        optimizationGoals
      });

      const optimizationRequest = {
        contextId: context.id,
        currentWorkflow: workflow,
        executionHistory,
        optimizationGoals,
        constraints: workflow.constraints || {}
      };

      const optimizedWorkflow = await this.mcpClient.optimizeWorkflow(
        optimizationRequest
      );

      // Validate optimized workflow
      const validation = await this.workflowService.validateWorkflow(
        optimizedWorkflow
      );

      return validation.isValid ? optimizedWorkflow : null;

    } catch (error) {
      console.error('Workflow optimization failed:', error);
      return null;
    }
  }

  /**
   * Generates workflow documentation using AI
   */
  async generateWorkflowDocumentation(
    workflow: AutomationWorkflow
  ): Promise<string | null> {
    try {
      const model = await this.aiModelRegistry.selectModel(
        'documentation',
        { domain: workflow.domain }
      );

      if (!model) {
        return null;
      }

      const context = await this.mcpClient.createContext({
        modelId: model.id,
        workflow
      });

      const documentationRequest = {
        contextId: context.id,
        workflow,
        format: 'markdown',
        includeExamples: true,
        includePerformanceNotes: true
      };

      return await this.mcpClient.generateDocumentation(documentationRequest);

    } catch (error) {
      console.error('Documentation generation failed:', error);
      return null;
    }
  }

  /**
   * Enhances workflow with AI metadata
   */
  private enhanceWorkflowWithAIMetadata(
    workflow: AutomationWorkflow,
    model: any,
    context: any
  ): AutomationWorkflow {
    return {
      ...workflow,
      metadata: {
        ...workflow.metadata,
        generatedByAI: true,
        modelId: model.id,
        modelVersion: model.version,
        contextId: context.id,
        generationTimestamp: new Date().toISOString(),
        confidence: context.confidence || 0.8,
        generationMethod: 'mcp-bridge'
      }
    };
  }

  /**
   * Attempts to repair invalid workflow using AI
   */
  private async attemptWorkflowRepair(
    workflow: AutomationWorkflow,
    errors: string[],
    context: any
  ): Promise<AutomationWorkflow | null> {
    try {
      const repairRequest = {
        contextId: context.id,
        workflow,
        errors,
        repairStrategy: 'conservative'
      };

      const repairedWorkflow = await this.mcpClient.repairWorkflow(repairRequest);
      
      // Validate repaired workflow
      const validation = await this.workflowService.validateWorkflow(repairedWorkflow);
      
      return validation.isValid ? repairedWorkflow : null;

    } catch (error) {
      console.error('Workflow repair failed:', error);
      return null;
    }
  }

  /**
   * Calculates quality score for workflow execution
   */
  private calculateWorkflowQualityScore(event: WorkflowExecutionCompletedEvent): number {
    let score = 0;

    // Success rate (40% weight)
    score += event.success ? 40 : 0;

    // Performance score (30% weight)
    const performanceScore = Math.min(30, 30 * (10000 / event.performance.executionTime));
    score += performanceScore;

    // Error rate score (20% weight)
    const errorScore = Math.max(0, 20 * (1 - event.performance.errorRate));
    score += errorScore;

    // Step success rate (10% weight)
    score += 10 * event.performance.stepSuccessRate;

    return Math.round(score);
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
        mcpClientHealth,
        aiModelRegistryHealth,
        workflowServiceHealth
      ] = await Promise.all([
        this.mcpClient.getHealthStatus(),
        this.aiModelRegistry.getHealthStatus(),
        this.workflowService.getHealthStatus()
      ]);

      const allHealthy = [
        mcpClientHealth,
        aiModelRegistryHealth,
        workflowServiceHealth
      ].every(health => health.status === 'healthy');

      return {
        status: allHealthy ? 'healthy' : 'unhealthy',
        details: {
          mcpClient: mcpClientHealth,
          aiModelRegistry: aiModelRegistryHealth,
          workflowService: workflowServiceHealth,
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
   * Gets service metrics
   */
  async getMetrics(): Promise<Record<string, any>> {
    try {
      const [
        mcpMetrics,
        modelMetrics
      ] = await Promise.all([
        this.mcpClient.getMetrics(),
        this.aiModelRegistry.getMetrics()
      ]);

      return {
        mcp: mcpMetrics,
        models: modelMetrics,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }
}