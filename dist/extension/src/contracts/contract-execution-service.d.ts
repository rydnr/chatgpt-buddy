/**
 * @fileoverview Contract Execution Service
 * @description Service for executing automation based on discovered contracts
 */
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
export declare class ContractExecutionService {
    private discoveryAdapter;
    constructor();
    /**
     * Execute action using contract-based automation
     */
    executeWithContract(params: ContractExecutionParams): Promise<ExecutionResult>;
    /**
     * Check if contracts are available for current page
     */
    checkContractAvailability(): Promise<{
        available: boolean;
        contractCount: number;
        capabilities: string[];
        domain: string;
    }>;
    /**
     * Get available actions for current page
     */
    getAvailableActions(): Array<{
        action: string;
        description: string;
        contractTitle: string;
        parameters: string[];
    }>;
    /**
     * Validate contract execution parameters
     */
    validateExecutionParams(action: string, parameters: Record<string, any>): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get contract recommendations for current page
     */
    getContractRecommendations(): Array<{
        contractTitle: string;
        domain: string;
        capabilities: number;
        recommendation: string;
    }>;
    /**
     * Export contract execution statistics
     */
    exportExecutionStats(): Promise<{
        totalExecutions: number;
        successRate: number;
        averageExecutionTime: number;
        contractUsage: Record<string, number>;
        capabilityUsage: Record<string, number>;
    }>;
    /**
     * Find suitable contracts for execution parameters
     */
    private findSuitableContracts;
    /**
     * Find matching capability in contract
     */
    private findMatchingCapability;
    /**
     * Validate parameter type
     */
    private validateParameterType;
    /**
     * Check if domain matches pattern
     */
    private domainMatches;
    /**
     * Generate contract ID
     */
    private generateContractId;
}
export declare const contractExecution: ContractExecutionService;
export {};
//# sourceMappingURL=contract-execution-service.d.ts.map