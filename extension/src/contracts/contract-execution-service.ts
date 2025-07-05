/**
 * @fileoverview Contract Execution Service
 * @description Service for executing automation based on discovered contracts
 */

import { contractDiscovery, ContractDiscoveryAdapter } from './contract-discovery-adapter';

/**
 * Execution result interface
 */
interface ExecutionResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  contractId?: string;
  capabilityName?: string;
  timestamp: string;
}

/**
 * Contract-based execution parameters
 */
interface ContractExecutionParams {
  domain?: string;
  action: string;
  parameters: Record<string, any>;
  preferredContract?: string;
  timeout?: number;
}

/**
 * Service for executing automation using discovered contracts
 */
export class ContractExecutionService {
  private discoveryAdapter: ContractDiscoveryAdapter;

  constructor() {
    this.discoveryAdapter = contractDiscovery;
  }

  /**
   * Execute action using contract-based automation
   */
  public async executeWithContract(params: ContractExecutionParams): Promise<ExecutionResult> {
    const startTime = Date.now();
    
    try {
      console.log(`🎯 Executing contract-based action: ${params.action}`);

      // Find suitable contracts
      const contracts = this.findSuitableContracts(params);
      
      if (contracts.length === 0) {
        return {
          success: false,
          error: `No suitable contracts found for action: ${params.action}`,
          executionTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        };
      }

      // Try contracts in priority order
      for (const contract of contracts) {
        try {
          const capability = this.findMatchingCapability(contract, params.action);
          if (!capability) {
            continue;
          }

          console.log(`📋 Using contract: ${contract.title} for capability: ${capability.name}`);

          const result = await this.discoveryAdapter.executeCapability(
            this.generateContractId(contract),
            capability.name,
            params.parameters
          );

          return {
            success: true,
            data: result,
            executionTime: Date.now() - startTime,
            contractId: this.generateContractId(contract),
            capabilityName: capability.name,
            timestamp: new Date().toISOString()
          };

        } catch (contractError) {
          console.warn(`⚠️ Contract execution failed, trying next: ${contractError}`);
          continue;
        }
      }

      return {
        success: false,
        error: `All contract executions failed for action: ${params.action}`,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Unknown contract execution error',
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Check if contracts are available for current page
   */
  public async checkContractAvailability(): Promise<{
    available: boolean;
    contractCount: number;
    capabilities: string[];
    domain: string;
  }> {
    const domain = window.location.hostname;
    const contracts = this.discoveryAdapter.getContractsByDomain(domain);
    
    const capabilities: string[] = [];
    for (const contract of contracts) {
      capabilities.push(...Object.keys(contract.capabilities));
    }

    return {
      available: contracts.length > 0,
      contractCount: contracts.length,
      capabilities: Array.from(new Set(capabilities)),
      domain
    };
  }

  /**
   * Get available actions for current page
   */
  public getAvailableActions(): Array<{
    action: string;
    description: string;
    contractTitle: string;
    parameters: string[];
  }> {
    const domain = window.location.hostname;
    const contracts = this.discoveryAdapter.getContractsByDomain(domain);
    const actions: Array<{
      action: string;
      description: string;
      contractTitle: string;
      parameters: string[];
    }> = [];

    for (const contract of contracts) {
      for (const [name, capability] of Object.entries(contract.capabilities)) {
        actions.push({
          action: name,
          description: capability.description,
          contractTitle: contract.title,
          parameters: capability.parameters?.map(p => p.name) || []
        });
      }
    }

    return actions;
  }

  /**
   * Validate contract execution parameters
   */
  public validateExecutionParams(
    action: string, 
    parameters: Record<string, any>
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const domain = window.location.hostname;
    const contracts = this.discoveryAdapter.getContractsByDomain(domain);

    // Find capability in contracts
    let foundCapability = false;
    for (const contract of contracts) {
      for (const [name, capability] of Object.entries(contract.capabilities)) {
        if (name === action || capability.description.toLowerCase().includes(action.toLowerCase())) {
          foundCapability = true;

          // Validate required parameters
          if (capability.parameters) {
            for (const param of capability.parameters) {
              if (param.required && !(param.name in parameters)) {
                errors.push(`Required parameter missing: ${param.name}`);
              }

              // Validate parameter types
              if (param.name in parameters) {
                const value = parameters[param.name];
                if (!this.validateParameterType(value, param.type)) {
                  errors.push(`Invalid type for parameter ${param.name}: expected ${param.type}`);
                }
              }
            }
          }
          break;
        }
      }
      if (foundCapability) break;
    }

    if (!foundCapability) {
      errors.push(`No capability found for action: ${action}`);
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Get contract recommendations for current page
   */
  public getContractRecommendations(): Array<{
    contractTitle: string;
    domain: string;
    capabilities: number;
    recommendation: string;
  }> {
    const allContracts = this.discoveryAdapter.getDiscoveredContracts();
    const currentDomain = window.location.hostname;
    const recommendations: Array<{
      contractTitle: string;
      domain: string;
      capabilities: number;
      recommendation: string;
    }> = [];

    for (const contract of allContracts) {
      const capabilityCount = Object.keys(contract.capabilities).length;
      let recommendation = '';

      if (contract.domain === currentDomain) {
        recommendation = 'Perfect match for current domain';
      } else if (this.domainMatches(currentDomain, contract.domain)) {
        recommendation = 'Compatible with current domain pattern';
      } else {
        recommendation = 'Available for cross-domain automation';
      }

      recommendations.push({
        contractTitle: contract.title,
        domain: contract.domain,
        capabilities: capabilityCount,
        recommendation
      });
    }

    return recommendations.sort((a, b) => b.capabilities - a.capabilities);
  }

  /**
   * Export contract execution statistics
   */
  public async exportExecutionStats(): Promise<{
    totalExecutions: number;
    successRate: number;
    averageExecutionTime: number;
    contractUsage: Record<string, number>;
    capabilityUsage: Record<string, number>;
  }> {
    // This would typically read from storage
    // For now, return mock data
    return {
      totalExecutions: 0,
      successRate: 0,
      averageExecutionTime: 0,
      contractUsage: {},
      capabilityUsage: {}
    };
  }

  /**
   * Find suitable contracts for execution parameters
   */
  private findSuitableContracts(params: ContractExecutionParams): any[] {
    const domain = params.domain || window.location.hostname;
    let contracts = this.discoveryAdapter.getContractsByDomain(domain);

    // If preferred contract specified, prioritize it
    if (params.preferredContract) {
      contracts = contracts.filter(c => 
        this.generateContractId(c) === params.preferredContract ||
        c.title === params.preferredContract
      ).concat(contracts.filter(c => 
        this.generateContractId(c) !== params.preferredContract &&
        c.title !== params.preferredContract
      ));
    }

    // Filter contracts that have the requested action
    return contracts.filter(contract => {
      return this.findMatchingCapability(contract, params.action) !== null;
    });
  }

  /**
   * Find matching capability in contract
   */
  private findMatchingCapability(contract: any, action: string): { name: string; capability: any } | null {
    // Direct name match
    if (contract.capabilities[action]) {
      return { name: action, capability: contract.capabilities[action] };
    }

    // Description match
    for (const [name, capability] of Object.entries(contract.capabilities)) {
      if ((capability as any).description.toLowerCase().includes(action.toLowerCase())) {
        return { name, capability };
      }
    }

    return null;
  }

  /**
   * Validate parameter type
   */
  private validateParameterType(value: any, expectedType: string): boolean {
    switch (expectedType) {
      case 'string':
        return typeof value === 'string';
      case 'number':
        return typeof value === 'number' && !isNaN(value);
      case 'boolean':
        return typeof value === 'boolean';
      case 'object':
        return typeof value === 'object' && value !== null && !Array.isArray(value);
      case 'array':
        return Array.isArray(value);
      case 'file':
        return value instanceof File || typeof value === 'string';
      default:
        return true;
    }
  }

  /**
   * Check if domain matches pattern
   */
  private domainMatches(domain: string, pattern: string): boolean {
    if (pattern.includes('*')) {
      const regex = new RegExp(pattern.replace(/\*/g, '.*'));
      return regex.test(domain);
    }
    return domain === pattern;
  }

  /**
   * Generate contract ID
   */
  private generateContractId(contract: any): string {
    return `${contract.domain}_${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
  }
}

// Global contract execution service instance
export const contractExecution = new ContractExecutionService();