/**
 * @fileoverview Contract Execution Service
 * @description Service for executing automation based on discovered contracts
 */
import { contractDiscovery } from './contract-discovery-adapter';
/**
 * Service for executing automation using discovered contracts
 */
export class ContractExecutionService {
    constructor() {
        this.discoveryAdapter = contractDiscovery;
    }
    /**
     * Execute action using contract-based automation
     */
    async executeWithContract(params) {
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
                    const result = await this.discoveryAdapter.executeCapability(this.generateContractId(contract), capability.name, params.parameters);
                    return {
                        success: true,
                        data: result,
                        executionTime: Date.now() - startTime,
                        contractId: this.generateContractId(contract),
                        capabilityName: capability.name,
                        timestamp: new Date().toISOString()
                    };
                }
                catch (contractError) {
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
        }
        catch (error) {
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
    async checkContractAvailability() {
        const domain = window.location.hostname;
        const contracts = this.discoveryAdapter.getContractsByDomain(domain);
        const capabilities = [];
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
    getAvailableActions() {
        const domain = window.location.hostname;
        const contracts = this.discoveryAdapter.getContractsByDomain(domain);
        const actions = [];
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
    validateExecutionParams(action, parameters) {
        const errors = [];
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
            if (foundCapability)
                break;
        }
        if (!foundCapability) {
            errors.push(`No capability found for action: ${action}`);
        }
        return { valid: errors.length === 0, errors };
    }
    /**
     * Get contract recommendations for current page
     */
    getContractRecommendations() {
        const allContracts = this.discoveryAdapter.getDiscoveredContracts();
        const currentDomain = window.location.hostname;
        const recommendations = [];
        for (const contract of allContracts) {
            const capabilityCount = Object.keys(contract.capabilities).length;
            let recommendation = '';
            if (contract.domain === currentDomain) {
                recommendation = 'Perfect match for current domain';
            }
            else if (this.domainMatches(currentDomain, contract.domain)) {
                recommendation = 'Compatible with current domain pattern';
            }
            else {
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
    async exportExecutionStats() {
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
    findSuitableContracts(params) {
        const domain = params.domain || window.location.hostname;
        let contracts = this.discoveryAdapter.getContractsByDomain(domain);
        // If preferred contract specified, prioritize it
        if (params.preferredContract) {
            contracts = contracts.filter(c => this.generateContractId(c) === params.preferredContract ||
                c.title === params.preferredContract).concat(contracts.filter(c => this.generateContractId(c) !== params.preferredContract &&
                c.title !== params.preferredContract));
        }
        // Filter contracts that have the requested action
        return contracts.filter(contract => {
            return this.findMatchingCapability(contract, params.action) !== null;
        });
    }
    /**
     * Find matching capability in contract
     */
    findMatchingCapability(contract, action) {
        // Direct name match
        if (contract.capabilities[action]) {
            return { name: action, capability: contract.capabilities[action] };
        }
        // Description match
        for (const [name, capability] of Object.entries(contract.capabilities)) {
            if (capability.description.toLowerCase().includes(action.toLowerCase())) {
                return { name, capability };
            }
        }
        return null;
    }
    /**
     * Validate parameter type
     */
    validateParameterType(value, expectedType) {
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
    domainMatches(domain, pattern) {
        if (pattern.includes('*')) {
            const regex = new RegExp(pattern.replace(/\*/g, '.*'));
            return regex.test(domain);
        }
        return domain === pattern;
    }
    /**
     * Generate contract ID
     */
    generateContractId(contract) {
        return `${contract.domain}_${contract.title.replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;
    }
}
// Global contract execution service instance
export const contractExecution = new ContractExecutionService();
