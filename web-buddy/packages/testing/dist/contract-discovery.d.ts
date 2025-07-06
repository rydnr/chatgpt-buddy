/**
 * @fileoverview Contract discovery and validation for Web-Buddy ATDD framework
 * @description Discovers and validates automation contracts from web pages and implementations
 */
import { Page } from '@playwright/test';
import { WebBuddyContract, AutomationCapability } from './types/contract-types';
/**
 * Contract discovery result
 */
export interface ContractDiscoveryResult {
    contracts: WebBuddyContract[];
    discoveryMethod: 'meta-tags' | 'script-declaration' | 'api-endpoint' | 'implementation-file';
    url: string;
    timestamp: Date;
    errors: string[];
    warnings: string[];
}
/**
 * Contract validation result
 */
export interface ContractValidationResult {
    isValid: boolean;
    contract: WebBuddyContract;
    errors: ContractValidationError[];
    warnings: ContractValidationWarning[];
    score: number;
}
/**
 * Contract validation error
 */
export interface ContractValidationError {
    field: string;
    message: string;
    severity: 'error' | 'warning';
}
/**
 * Contract validation warning
 */
export interface ContractValidationWarning {
    field: string;
    message: string;
    suggestion?: string;
}
/**
 * Contract discovery and validation engine
 */
export declare class ContractDiscovery {
    /**
     * Discover contracts from a web page
     */
    discoverFromPage(page: Page): Promise<ContractDiscoveryResult>;
    /**
     * Attempt multiple contract discovery methods
     */
    protected attemptDiscoveryMethods(page: Page): Promise<{
        contracts: WebBuddyContract[];
        method: ContractDiscoveryResult['discoveryMethod'];
    }>;
    /**
     * Discover contracts from meta tags
     */
    protected discoverFromMetaTags(page: Page): Promise<WebBuddyContract[]>;
    /**
     * Discover contracts from JavaScript declarations
     */
    protected discoverFromScriptDeclarations(page: Page): Promise<WebBuddyContract[]>;
    /**
     * Discover contracts from API endpoint
     */
    protected discoverFromApiEndpoint(page: Page): Promise<WebBuddyContract[]>;
    /**
     * Generate basic contract from page analysis
     */
    protected generateBasicContract(page: Page): Promise<WebBuddyContract[]>;
    /**
     * Generate capability name from text
     */
    protected generateCapabilityName(text: string): string;
    /**
     * Generate selector for element
     */
    protected generateSelector(element: any): string;
    /**
     * Validate a contract
     */
    validateContract(contract: WebBuddyContract): ContractValidationResult;
    /**
     * Validate required contract fields
     */
    protected validateRequiredFields(contract: WebBuddyContract, result: ContractValidationResult): void;
    /**
     * Validate contract capabilities
     */
    protected validateCapabilities(contract: WebBuddyContract, result: ContractValidationResult): void;
    /**
     * Validate individual capability
     */
    protected validateCapability(name: string, capability: AutomationCapability, result: ContractValidationResult): void;
    /**
     * Validate selectors
     */
    protected validateSelectors(contract: WebBuddyContract, result: ContractValidationResult): void;
    /**
     * Validate individual selector
     */
    protected validateSelector(capabilityName: string, selector: string, result: ContractValidationResult): void;
    /**
     * Calculate contract quality score
     */
    protected calculateScore(result: ContractValidationResult): number;
}
//# sourceMappingURL=contract-discovery.d.ts.map