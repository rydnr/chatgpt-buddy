/**
 * Persistent storage for automation implementations using IndexedDB
 * Enables the "reuse this automation?" workflow
 */
/**
 * Stored automation implementation
 */
export interface StoredAutomation {
    id: string;
    eventType: string;
    action: string;
    website: string;
    parameters: string[];
    playwrightScript: string;
    templatedScript: string;
    metadata: {
        recordedAt: Date;
        lastUsed?: Date;
        useCount: number;
        actionsCount: number;
        recordingDuration?: number;
        tags?: string[];
        userNotes?: string;
        confidence: number;
    };
    matching: {
        urlPattern?: string;
        domainPattern?: string;
        exactParameters: string[];
        contextPatterns?: Record<string, any>;
    };
    version: number;
}
/**
 * Search criteria for finding automations
 */
export interface AutomationSearchCriteria {
    eventType?: string;
    action?: string;
    website?: string;
    parameters?: string[];
    context?: Record<string, any>;
    minConfidence?: number;
}
/**
 * Storage interface for automation implementations
 */
export interface AutomationStorage {
    save(automation: StoredAutomation): Promise<void>;
    findMatching(criteria: AutomationSearchCriteria): Promise<StoredAutomation[]>;
    getById(id: string): Promise<StoredAutomation | null>;
    updateUsage(id: string): Promise<void>;
    deleteById(id: string): Promise<void>;
    exportAll(): Promise<StoredAutomation[]>;
    importAutomations(automations: StoredAutomation[]): Promise<void>;
    clear(): Promise<void>;
}
/**
 * IndexedDB implementation of automation storage
 */
export declare class IndexedDBAutomationStorage implements AutomationStorage {
    private dbName;
    private version;
    private storeName;
    private db?;
    constructor();
    /**
     * Initialize IndexedDB
     */
    private initializeDB;
    /**
     * Ensure database is ready
     */
    private ensureDB;
    /**
     * Save an automation implementation
     */
    save(automation: StoredAutomation): Promise<void>;
    /**
     * Find automations matching criteria
     */
    findMatching(criteria: AutomationSearchCriteria): Promise<StoredAutomation[]>;
    /**
     * Get automation by ID
     */
    getById(id: string): Promise<StoredAutomation | null>;
    /**
     * Update usage statistics for an automation
     */
    updateUsage(id: string): Promise<void>;
    /**
     * Delete automation by ID
     */
    deleteById(id: string): Promise<void>;
    /**
     * Export all automations for backup/sharing
     */
    exportAll(): Promise<StoredAutomation[]>;
    /**
     * Import automations from backup/sharing
     */
    importAutomations(automations: StoredAutomation[]): Promise<void>;
    /**
     * Clear all stored automations
     */
    clear(): Promise<void>;
    /**
     * Check if automation matches context patterns
     */
    private matchesContext;
}
/**
 * Factory function to create automation storage
 */
export declare function createAutomationStorage(): AutomationStorage;
//# sourceMappingURL=automation-storage.d.ts.map