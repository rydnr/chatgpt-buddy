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

import axios, { AxiosInstance } from 'axios';
import { AutomationWorkflow } from '../domain/automation-workflow';

/**
 * MCP Client Configuration
 */
export interface MCPConfig {
  endpoint: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  rateLimitPerMinute: number;
}

/**
 * MCP Context Request
 */
export interface MCPContextRequest {
  modelId: string;
  workflow?: AutomationWorkflow;
  capabilities?: any[];
  constraints?: Record<string, any>;
  examples?: any[];
  preferences?: Record<string, any>;
  executionHistory?: any[];
  optimizationGoals?: string[];
}

/**
 * MCP Context Response
 */
export interface MCPContext {
  id: string;
  modelId: string;
  createdAt: Date;
  expiresAt: Date;
  confidence: number;
  capabilities: string[];
  
  static fromJSON(data: any): MCPContext {
    return {
      id: data.id,
      modelId: data.modelId,
      createdAt: new Date(data.createdAt),
      expiresAt: new Date(data.expiresAt),
      confidence: data.confidence || 0.8,
      capabilities: data.capabilities || []
    };
  }
}

/**
 * MCP Workflow Request
 */
export interface MCPWorkflowRequest {
  contextId: string;
  objective: string;
  domain: string;
  examples?: any[];
  preferences?: Record<string, any>;
  optimizationGoals?: string[];
}

/**
 * MCP Feedback Data
 */
export interface MCPFeedback {
  workflowId: string;
  modelId: string;
  contextId: string;
  success: boolean;
  performance: {
    executionTime: number;
    resourceUsage: Record<string, number>;
    errorRate: number;
    stepSuccessRate: number;
  };
  issues: string[];
  improvements: string[];
  qualityScore: number;
  userSatisfaction?: number;
}

/**
 * MCP Client for AI Integration
 * 
 * Provides communication with Model Context Protocol (MCP) services
 * for AI-powered workflow generation, optimization, and learning.
 */
export class MCPClient {
  private httpClient: AxiosInstance;
  private rateLimiter: Map<string, number[]> = new Map();

  constructor(private config: MCPConfig) {
    this.httpClient = axios.create({
      baseURL: config.endpoint,
      timeout: config.timeout,
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Semantest-MCP-Client/1.0.0'
      }
    });

    this.setupInterceptors();
  }

  /**
   * Creates a new MCP context for AI operations
   */
  async createContext(request: MCPContextRequest): Promise<MCPContext> {
    await this.checkRateLimit('createContext');

    try {
      const response = await this.httpClient.post('/contexts', {
        modelId: request.modelId,
        workflow: request.workflow ? this.serializeWorkflow(request.workflow) : null,
        capabilities: request.capabilities || [],
        constraints: request.constraints || {},
        examples: request.examples || [],
        preferences: request.preferences || {},
        executionHistory: request.executionHistory || [],
        optimizationGoals: request.optimizationGoals || []
      });

      return MCPContext.fromJSON(response.data);
    } catch (error) {
      this.handleError('createContext', error);
      throw error;
    }
  }

  /**
   * Generates a new workflow using AI
   */
  async generateWorkflow(request: MCPWorkflowRequest): Promise<AutomationWorkflow> {
    await this.checkRateLimit('generateWorkflow');

    try {
      const response = await this.httpClient.post('/workflows/generate', {
        contextId: request.contextId,
        objective: request.objective,
        domain: request.domain,
        examples: request.examples || [],
        preferences: request.preferences || {},
        optimizationGoals: request.optimizationGoals || ['reliability', 'performance']
      });

      return this.deserializeWorkflow(response.data);
    } catch (error) {
      this.handleError('generateWorkflow', error);
      throw error;
    }
  }

  /**
   * Optimizes an existing workflow using AI
   */
  async optimizeWorkflow(request: {
    contextId: string;
    currentWorkflow: AutomationWorkflow;
    executionHistory: any[];
    optimizationGoals: string[];
    constraints?: Record<string, any>;
  }): Promise<AutomationWorkflow> {
    await this.checkRateLimit('optimizeWorkflow');

    try {
      const response = await this.httpClient.post('/workflows/optimize', {
        contextId: request.contextId,
        currentWorkflow: this.serializeWorkflow(request.currentWorkflow),
        executionHistory: request.executionHistory,
        optimizationGoals: request.optimizationGoals,
        constraints: request.constraints || {}
      });

      return this.deserializeWorkflow(response.data);
    } catch (error) {
      this.handleError('optimizeWorkflow', error);
      throw error;
    }
  }

  /**
   * Repairs a workflow with validation errors using AI
   */
  async repairWorkflow(request: {
    contextId: string;
    workflow: AutomationWorkflow;
    errors: string[];
    repairStrategy: 'conservative' | 'aggressive';
  }): Promise<AutomationWorkflow> {
    await this.checkRateLimit('repairWorkflow');

    try {
      const response = await this.httpClient.post('/workflows/repair', {
        contextId: request.contextId,
        workflow: this.serializeWorkflow(request.workflow),
        errors: request.errors,
        repairStrategy: request.repairStrategy
      });

      return this.deserializeWorkflow(response.data);
    } catch (error) {
      this.handleError('repairWorkflow', error);
      throw error;
    }
  }

  /**
   * Generates documentation for a workflow using AI
   */
  async generateDocumentation(request: {
    contextId: string;
    workflow: AutomationWorkflow;
    format: 'markdown' | 'html' | 'plain';
    includeExamples: boolean;
    includePerformanceNotes: boolean;
  }): Promise<string> {
    await this.checkRateLimit('generateDocumentation');

    try {
      const response = await this.httpClient.post('/documentation/generate', {
        contextId: request.contextId,
        workflow: this.serializeWorkflow(request.workflow),
        format: request.format,
        includeExamples: request.includeExamples,
        includePerformanceNotes: request.includePerformanceNotes
      });

      return response.data.documentation;
    } catch (error) {
      this.handleError('generateDocumentation', error);
      throw error;
    }
  }

  /**
   * Provides feedback to AI model for learning
   */
  async provideFeedback(feedback: MCPFeedback): Promise<void> {
    await this.checkRateLimit('provideFeedback');

    try {
      await this.httpClient.post('/feedback', {
        workflowId: feedback.workflowId,
        modelId: feedback.modelId,
        contextId: feedback.contextId,
        success: feedback.success,
        performance: feedback.performance,
        issues: feedback.issues,
        improvements: feedback.improvements,
        qualityScore: feedback.qualityScore,
        userSatisfaction: feedback.userSatisfaction,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.handleError('provideFeedback', error);
      throw error;
    }
  }

  /**
   * Deletes an MCP context
   */
  async deleteContext(contextId: string): Promise<void> {
    await this.checkRateLimit('deleteContext');

    try {
      await this.httpClient.delete(`/contexts/${contextId}`);
    } catch (error) {
      this.handleError('deleteContext', error);
      throw error;
    }
  }

  /**
   * Gets health status of MCP service
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const response = await this.httpClient.get('/health');
      return {
        status: 'healthy',
        details: response.data
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          endpoint: this.config.endpoint
        }
      };
    }
  }

  /**
   * Gets MCP service metrics
   */
  async getMetrics(): Promise<Record<string, any>> {
    try {
      const response = await this.httpClient.get('/metrics');
      return {
        ...response.data,
        clientMetrics: {
          rateLimitUsage: this.getRateLimitUsage(),
          totalRequests: this.getTotalRequests(),
          lastRequestTime: this.getLastRequestTime()
        }
      };
    } catch (error) {
      return {
        error: error.message,
        clientMetrics: {
          rateLimitUsage: this.getRateLimitUsage(),
          totalRequests: this.getTotalRequests(),
          lastRequestTime: this.getLastRequestTime()
        }
      };
    }
  }

  /**
   * Sets up HTTP interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.httpClient.interceptors.request.use(
      (config) => {
        console.log(`MCP Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('MCP Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.httpClient.interceptors.response.use(
      (response) => {
        console.log(`MCP Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        console.error('MCP Response Error:', error.response?.status, error.response?.data);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Checks rate limit for operation
   */
  private async checkRateLimit(operation: string): Promise<void> {
    const now = Date.now();
    const windowStart = now - 60000; // 1 minute window

    if (!this.rateLimiter.has(operation)) {
      this.rateLimiter.set(operation, []);
    }

    const requests = this.rateLimiter.get(operation)!;
    
    // Remove old requests outside window
    const recentRequests = requests.filter(timestamp => timestamp > windowStart);
    this.rateLimiter.set(operation, recentRequests);

    if (recentRequests.length >= this.config.rateLimitPerMinute) {
      const waitTime = recentRequests[0] + 60000 - now;
      throw new Error(`Rate limit exceeded for ${operation}. Wait ${waitTime}ms`);
    }

    // Add current request
    recentRequests.push(now);
  }

  /**
   * Serializes workflow for API transmission
   */
  private serializeWorkflow(workflow: AutomationWorkflow): any {
    return {
      id: workflow.id,
      name: workflow.name,
      domain: workflow.domain,
      objective: workflow.objective,
      steps: workflow.steps,
      requiredCapabilities: workflow.requiredCapabilities,
      constraints: workflow.constraints,
      metadata: workflow.metadata,
      estimatedDuration: workflow.estimatedDuration
    };
  }

  /**
   * Deserializes workflow from API response
   */
  private deserializeWorkflow(data: any): AutomationWorkflow {
    return {
      id: data.id || `workflow-${Date.now()}`,
      name: data.name || 'AI Generated Workflow',
      domain: data.domain,
      objective: data.objective,
      steps: data.steps || [],
      requiredCapabilities: data.requiredCapabilities || [],
      constraints: data.constraints || {},
      metadata: data.metadata || {},
      estimatedDuration: data.estimatedDuration || 0,
      correlationId: data.correlationId
    };
  }

  /**
   * Handles and logs errors
   */
  private handleError(operation: string, error: any): void {
    console.error(`MCP ${operation} failed:`, {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: {
        url: error.config?.url,
        method: error.config?.method
      }
    });
  }

  /**
   * Gets current rate limit usage
   */
  private getRateLimitUsage(): Record<string, number> {
    const usage: Record<string, number> = {};
    const now = Date.now();
    const windowStart = now - 60000;

    for (const [operation, requests] of this.rateLimiter) {
      const recentRequests = requests.filter(timestamp => timestamp > windowStart);
      usage[operation] = recentRequests.length;
    }

    return usage;
  }

  /**
   * Gets total request count
   */
  private getTotalRequests(): number {
    let total = 0;
    for (const requests of this.rateLimiter.values()) {
      total += requests.length;
    }
    return total;
  }

  /**
   * Gets last request timestamp
   */
  private getLastRequestTime(): Date | null {
    let lastTime = 0;
    for (const requests of this.rateLimiter.values()) {
      if (requests.length > 0) {
        lastTime = Math.max(lastTime, Math.max(...requests));
      }
    }
    return lastTime > 0 ? new Date(lastTime) : null;
  }
}