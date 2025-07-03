import { AutomationStorage, StoredAutomation, AutomationSearchCriteria } from '../storage/automation-storage';
import { AutomationRequestedEvent, AutomationImplementedEvent } from '../events/automation';
/**
 * User preference for automation reuse
 */
export interface ReusePreference {
    action: 'reuse' | 'record-new' | 'skip';
    doNotAskFor?: {
        type: 'times' | 'duration';
        value: number;
    };
}
/**
 * Result of automation execution
 */
export interface AutomationExecutionResult {
    success: boolean;
    result?: any;
    error?: string;
    executionTime: number;
    automationId: string;
}
/**
 * Manages the learning workflow and automation storage
 * Coordinates between events, storage, and user preferences
 */
export declare class AutomationManager {
    private storage;
    private userPreferences;
    constructor(storage?: AutomationStorage);
    /**
     * Handle an automation request - core learning workflow
     * Returns the appropriate action: reuse existing, record new, or request guidance
     */
    handleAutomationRequest(event: AutomationRequestedEvent): Promise<{
        action: 'execute' | 'reuse-prompt' | 'record-new';
        automation?: StoredAutomation;
        message?: string;
    }>;
    /**
     * Save a new automation implementation
     */
    saveAutomation(event: AutomationImplementedEvent): Promise<StoredAutomation>;
    /**
     * Execute an existing automation
     */
    executeAutomation(automationId: string, parameters: Record<string, any>, context?: Record<string, any>): Promise<AutomationExecutionResult>;
    /**
     * Set user preference for automation reuse
     */
    setUserPreference(eventType: string, action: string, website: string, preference: ReusePreference): void;
    /**
     * Get all stored automations
     */
    getAllAutomations(): Promise<StoredAutomation[]>;
    /**
     * Delete an automation
     */
    deleteAutomation(id: string): Promise<void>;
    /**
     * Export automations for sharing
     */
    exportAutomations(): Promise<StoredAutomation[]>;
    /**
     * Import automations from sharing
     */
    importAutomations(automations: StoredAutomation[]): Promise<void>;
    /**
     * Search for automations
     */
    searchAutomations(criteria: AutomationSearchCriteria): Promise<StoredAutomation[]>;
    /**
     * Clear all automations (for testing/reset)
     */
    clearAllAutomations(): Promise<void>;
    private createSearchCriteria;
    private getPreferenceKey;
    private getUserPreference;
    private extractWebsite;
    private extractDomain;
    private extractDomainFromMetadata;
    private generateUrlPattern;
    private extractParameters;
    private extractContextPatterns;
    private simulateExecution;
}
//# sourceMappingURL=automation-manager.d.ts.map