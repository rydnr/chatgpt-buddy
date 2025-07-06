interface AutomationPattern {
    id: string;
    url: string;
    domain: string;
    action: string;
    selector: string;
    parameters: Record<string, any>;
    success: boolean;
    timestamp: number;
    contextHash: string;
    userConfirmed: boolean;
}
interface UserInteraction {
    id: string;
    sessionId: string;
    url: string;
    domain: string;
    eventType: string;
    target: string;
    timestamp: number;
    success: boolean;
    context: Record<string, any>;
}
interface WebsiteConfig {
    domain: string;
    preferences: Record<string, any>;
    customSelectors: Record<string, string>;
    lastAccessed: number;
    automationEnabled: boolean;
}
declare class WebBuddyStorage {
    private db;
    private readonly DB_NAME;
    private readonly DB_VERSION;
    constructor();
    init(): Promise<void>;
    saveAutomationPattern(pattern: Omit<AutomationPattern, 'id' | 'timestamp'>): Promise<string>;
    getAutomationPatterns(filters?: {
        domain?: string;
        action?: string;
        url?: string;
        successOnly?: boolean;
        limit?: number;
    }): Promise<AutomationPattern[]>;
    updateAutomationPattern(id: string, updates: Partial<AutomationPattern>): Promise<void>;
    saveUserInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<string>;
    getUserInteractions(filters?: {
        sessionId?: string;
        domain?: string;
        eventType?: string;
        limit?: number;
    }): Promise<UserInteraction[]>;
    saveWebsiteConfig(config: WebsiteConfig): Promise<void>;
    getWebsiteConfig(domain: string): Promise<WebsiteConfig | null>;
    clearOldData(olderThanDays?: number): Promise<void>;
    getStorageStats(): Promise<{
        automationPatterns: number;
        userInteractions: number;
        websiteConfigs: number;
    }>;
}
export declare const webBuddyStorage: WebBuddyStorage;
export type { AutomationPattern, UserInteraction, WebsiteConfig };
//# sourceMappingURL=storage.d.ts.map