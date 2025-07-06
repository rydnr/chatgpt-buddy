/**
 * Pattern Manager - Advanced Pattern Sharing and Management
 *
 * Provides comprehensive pattern management including export/import,
 * sharing, validation, and collaboration features.
 */
export interface AutomationPattern {
    id: string;
    name: string;
    description: string;
    version: string;
    author: string;
    created: string;
    lastModified: string;
    tags: string[];
    category: string;
    steps: PatternStep[];
    conditions: PatternCondition[];
    variables: PatternVariable[];
    metadata: PatternMetadata;
    statistics: PatternStatistics;
}
export interface PatternStep {
    id: string;
    type: 'click' | 'type' | 'wait' | 'navigate' | 'extract' | 'condition' | 'loop';
    selector: string;
    value?: string;
    options?: Record<string, any>;
    description: string;
    timeout: number;
    retries: number;
    errorHandling: 'fail' | 'continue' | 'retry';
}
export interface PatternCondition {
    id: string;
    type: 'element_exists' | 'element_visible' | 'text_contains' | 'url_matches' | 'custom';
    selector?: string;
    expectedValue?: string;
    operator: 'equals' | 'contains' | 'matches' | 'greater_than' | 'less_than';
    action: 'continue' | 'skip' | 'fail' | 'goto_step';
    targetStep?: string;
}
export interface PatternVariable {
    id: string;
    name: string;
    type: 'string' | 'number' | 'boolean' | 'array' | 'object';
    defaultValue?: any;
    required: boolean;
    description: string;
    validation?: {
        regex?: string;
        min?: number;
        max?: number;
        options?: string[];
    };
}
export interface PatternMetadata {
    compatibility: string[];
    requirements: string[];
    permissions: string[];
    language: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert';
    estimatedDuration: number;
    successRate: number;
    popularity: number;
    domains: string[];
}
export interface PatternStatistics {
    executions: number;
    successes: number;
    failures: number;
    averageExecutionTime: number;
    lastExecuted?: string;
    errorTypes: Record<string, number>;
    performanceMetrics: {
        fastestExecution: number;
        slowestExecution: number;
        memoryUsage: number[];
    };
}
export interface PatternShare {
    patternId: string;
    shareId: string;
    shareType: 'public' | 'private' | 'team' | 'temporary';
    expiresAt?: string;
    permissions: SharePermission[];
    accessCount: number;
    downloadCount: number;
    created: string;
    createdBy: string;
}
export interface SharePermission {
    userId: string;
    role: 'viewer' | 'editor' | 'admin';
    permissions: string[];
}
export interface PatternExport {
    version: string;
    exportedAt: string;
    exportedBy: string;
    format: 'json' | 'yaml' | 'xml';
    compression: boolean;
    encryption: boolean;
    patterns: AutomationPattern[];
    dependencies: string[];
    checksum: string;
}
export declare class PatternManager {
    private patterns;
    private shares;
    private categories;
    private readonly STORAGE_KEY;
    private readonly SHARES_KEY;
    private readonly MAX_PATTERN_SIZE;
    private readonly EXPORT_VERSION;
    constructor();
    /**
     * Create a new automation pattern
     */
    createPattern(name: string, description: string, steps: PatternStep[], options?: Partial<AutomationPattern>): Promise<AutomationPattern>;
    /**
     * Get a pattern by ID
     */
    getPattern(id: string): AutomationPattern | null;
    /**
     * Get all patterns with optional filtering
     */
    getPatterns(filter?: {
        category?: string;
        tags?: string[];
        author?: string;
        difficulty?: string;
        searchText?: string;
    }): AutomationPattern[];
    /**
     * Update an existing pattern
     */
    updatePattern(id: string, updates: Partial<AutomationPattern>): Promise<AutomationPattern>;
    /**
     * Delete a pattern
     */
    deletePattern(id: string): Promise<boolean>;
    /**
     * Export patterns to various formats
     */
    exportPatterns(patternIds: string[], format?: 'json' | 'yaml' | 'xml', options?: {
        compression?: boolean;
        encryption?: boolean;
        includeStatistics?: boolean;
        includeDependencies?: boolean;
    }): Promise<string>;
    /**
     * Import patterns from various formats
     */
    importPatterns(data: string, options?: {
        overwrite?: boolean;
        validateOnly?: boolean;
        mergeDuplicates?: boolean;
    }): Promise<{
        imported: AutomationPattern[];
        skipped: string[];
        errors: string[];
    }>;
    /**
     * Create a shareable link for patterns
     */
    sharePatterns(patternIds: string[], shareType?: 'public' | 'private' | 'team' | 'temporary', options?: {
        expiresIn?: number;
        permissions?: SharePermission[];
        password?: string;
    }): Promise<PatternShare>;
    /**
     * Access shared patterns
     */
    accessSharedPatterns(shareId: string): Promise<AutomationPattern[]>;
    /**
     * Get pattern statistics and analytics
     */
    getPatternAnalytics(): {
        totalPatterns: number;
        categoriesBreakdown: Record<string, number>;
        difficultiesBreakdown: Record<string, number>;
        averageSuccessRate: number;
        totalExecutions: number;
        mostPopular: AutomationPattern[];
        recentlyCreated: AutomationPattern[];
    };
    /**
     * Validate a pattern for correctness and completeness
     */
    validatePattern(pattern: AutomationPattern): {
        isValid: boolean;
        errors: string[];
        warnings: string[];
    };
    /**
     * Generate unique pattern ID
     */
    private generatePatternId;
    /**
     * Generate unique share ID
     */
    private generateShareId;
    /**
     * Estimate pattern execution duration based on steps
     */
    private estimatePatternDuration;
    /**
     * Increment semantic version
     */
    private incrementVersion;
    /**
     * Extract dependencies from patterns
     */
    private extractDependencies;
    /**
     * Generate SHA-256 checksum
     */
    private generateChecksum;
    /**
     * Convert to YAML format (simplified)
     */
    private convertToYaml;
    /**
     * Convert to XML format (simplified)
     */
    private convertToXml;
    /**
     * Parse YAML data (simplified)
     */
    private parseYaml;
    /**
     * Parse XML data (simplified)
     */
    private parseXml;
    /**
     * Data compression (simplified)
     */
    private compressData;
    /**
     * Data decompression (simplified)
     */
    private decompressData;
    /**
     * Data encryption (simplified)
     */
    private encryptData;
    /**
     * Data decryption (simplified)
     */
    private decryptData;
    /**
     * Check if data is encrypted
     */
    private isEncrypted;
    /**
     * Check if data is compressed
     */
    private isCompressed;
    /**
     * Merge two patterns (for duplicate handling)
     */
    private mergePatterns;
    /**
     * Load patterns from storage
     */
    private loadPatterns;
    /**
     * Save patterns to storage
     */
    private savePatterns;
    /**
     * Load shares from storage
     */
    private loadShares;
    /**
     * Save shares to storage
     */
    private saveShares;
    /**
     * Start pattern cleanup (remove expired shares, etc.)
     */
    private startPatternCleanup;
    /**
     * Clean up expired shares
     */
    private cleanupExpiredShares;
}
export declare const globalPatternManager: PatternManager;
//# sourceMappingURL=pattern-manager.d.ts.map