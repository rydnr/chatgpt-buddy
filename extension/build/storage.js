// IndexedDB Storage Manager for Web-Buddy
// Provides persistent storage for learned automation patterns and user interactions
class WebBuddyStorage {
    constructor() {
        this.db = null;
        this.DB_NAME = 'WebBuddyDB';
        this.DB_VERSION = 1;
        this.init();
    }
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);
            request.onerror = () => {
                console.error('❌ Failed to open IndexedDB:', request.error);
                reject(request.error);
            };
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB initialized successfully');
                resolve();
            };
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                // Create automation patterns store
                if (!db.objectStoreNames.contains('automationPatterns')) {
                    const patternsStore = db.createObjectStore('automationPatterns', { keyPath: 'id' });
                    patternsStore.createIndex('domain', 'domain', { unique: false });
                    patternsStore.createIndex('action', 'action', { unique: false });
                    patternsStore.createIndex('url', 'url', { unique: false });
                    patternsStore.createIndex('timestamp', 'timestamp', { unique: false });
                    patternsStore.createIndex('success', 'success', { unique: false });
                }
                // Create user interactions store
                if (!db.objectStoreNames.contains('userInteractions')) {
                    const interactionsStore = db.createObjectStore('userInteractions', { keyPath: 'id' });
                    interactionsStore.createIndex('sessionId', 'sessionId', { unique: false });
                    interactionsStore.createIndex('domain', 'domain', { unique: false });
                    interactionsStore.createIndex('eventType', 'eventType', { unique: false });
                    interactionsStore.createIndex('timestamp', 'timestamp', { unique: false });
                }
                // Create website configurations store
                if (!db.objectStoreNames.contains('websiteConfigs')) {
                    const configsStore = db.createObjectStore('websiteConfigs', { keyPath: 'domain' });
                    configsStore.createIndex('lastAccessed', 'lastAccessed', { unique: false });
                    configsStore.createIndex('automationEnabled', 'automationEnabled', { unique: false });
                }
                console.log('🔧 IndexedDB schema updated to version', this.DB_VERSION);
            };
        });
    }
    // Automation Patterns Methods
    async saveAutomationPattern(pattern) {
        if (!this.db)
            throw new Error('Database not initialized');
        const fullPattern = {
            ...pattern,
            id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        };
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['automationPatterns'], 'readwrite');
            const store = transaction.objectStore('automationPatterns');
            const request = store.add(fullPattern);
            request.onsuccess = () => {
                console.log('✅ Automation pattern saved:', fullPattern.id);
                resolve(fullPattern.id);
            };
            request.onerror = () => {
                console.error('❌ Failed to save automation pattern:', request.error);
                reject(request.error);
            };
        });
    }
    async getAutomationPatterns(filters) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['automationPatterns'], 'readonly');
            const store = transaction.objectStore('automationPatterns');
            let request;
            if (filters?.domain) {
                const index = store.index('domain');
                request = index.getAll(filters.domain);
            }
            else if (filters?.action) {
                const index = store.index('action');
                request = index.getAll(filters.action);
            }
            else {
                request = store.getAll();
            }
            request.onsuccess = () => {
                let patterns = request.result;
                // Apply additional filters
                if (filters) {
                    if (filters.url) {
                        patterns = patterns.filter(p => p.url.includes(filters.url));
                    }
                    if (filters.successOnly) {
                        patterns = patterns.filter(p => p.success);
                    }
                    if (filters.limit) {
                        patterns = patterns.slice(0, filters.limit);
                    }
                }
                // Sort by timestamp (newest first)
                patterns.sort((a, b) => b.timestamp - a.timestamp);
                resolve(patterns);
            };
            request.onerror = () => {
                console.error('❌ Failed to get automation patterns:', request.error);
                reject(request.error);
            };
        });
    }
    async updateAutomationPattern(id, updates) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise(async (resolve, reject) => {
            const transaction = this.db.transaction(['automationPatterns'], 'readwrite');
            const store = transaction.objectStore('automationPatterns');
            // Get existing pattern
            const getRequest = store.get(id);
            getRequest.onsuccess = () => {
                const existingPattern = getRequest.result;
                if (!existingPattern) {
                    reject(new Error('Pattern not found'));
                    return;
                }
                // Merge updates
                const updatedPattern = { ...existingPattern, ...updates };
                // Save updated pattern
                const putRequest = store.put(updatedPattern);
                putRequest.onsuccess = () => {
                    console.log('✅ Automation pattern updated:', id);
                    resolve();
                };
                putRequest.onerror = () => {
                    console.error('❌ Failed to update automation pattern:', putRequest.error);
                    reject(putRequest.error);
                };
            };
            getRequest.onerror = () => {
                console.error('❌ Failed to get automation pattern for update:', getRequest.error);
                reject(getRequest.error);
            };
        });
    }
    // User Interactions Methods
    async saveUserInteraction(interaction) {
        if (!this.db)
            throw new Error('Database not initialized');
        const fullInteraction = {
            ...interaction,
            id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now()
        };
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['userInteractions'], 'readwrite');
            const store = transaction.objectStore('userInteractions');
            const request = store.add(fullInteraction);
            request.onsuccess = () => {
                console.log('✅ User interaction saved:', fullInteraction.id);
                resolve(fullInteraction.id);
            };
            request.onerror = () => {
                console.error('❌ Failed to save user interaction:', request.error);
                reject(request.error);
            };
        });
    }
    async getUserInteractions(filters) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['userInteractions'], 'readonly');
            const store = transaction.objectStore('userInteractions');
            let request;
            if (filters?.sessionId) {
                const index = store.index('sessionId');
                request = index.getAll(filters.sessionId);
            }
            else if (filters?.domain) {
                const index = store.index('domain');
                request = index.getAll(filters.domain);
            }
            else {
                request = store.getAll();
            }
            request.onsuccess = () => {
                let interactions = request.result;
                // Apply additional filters
                if (filters) {
                    if (filters.eventType) {
                        interactions = interactions.filter(i => i.eventType === filters.eventType);
                    }
                    if (filters.limit) {
                        interactions = interactions.slice(0, filters.limit);
                    }
                }
                // Sort by timestamp (newest first)
                interactions.sort((a, b) => b.timestamp - a.timestamp);
                resolve(interactions);
            };
            request.onerror = () => {
                console.error('❌ Failed to get user interactions:', request.error);
                reject(request.error);
            };
        });
    }
    // Website Configuration Methods
    async saveWebsiteConfig(config) {
        if (!this.db)
            throw new Error('Database not initialized');
        const configWithTimestamp = {
            ...config,
            lastAccessed: Date.now()
        };
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['websiteConfigs'], 'readwrite');
            const store = transaction.objectStore('websiteConfigs');
            const request = store.put(configWithTimestamp);
            request.onsuccess = () => {
                console.log('✅ Website config saved:', config.domain);
                resolve();
            };
            request.onerror = () => {
                console.error('❌ Failed to save website config:', request.error);
                reject(request.error);
            };
        });
    }
    async getWebsiteConfig(domain) {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['websiteConfigs'], 'readonly');
            const store = transaction.objectStore('websiteConfigs');
            const request = store.get(domain);
            request.onsuccess = () => {
                resolve(request.result || null);
            };
            request.onerror = () => {
                console.error('❌ Failed to get website config:', request.error);
                reject(request.error);
            };
        });
    }
    // Utility Methods
    async clearOldData(olderThanDays = 30) {
        if (!this.db)
            throw new Error('Database not initialized');
        const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['automationPatterns', 'userInteractions'], 'readwrite');
            // Clear old automation patterns
            const patternsStore = transaction.objectStore('automationPatterns');
            const patternsIndex = patternsStore.index('timestamp');
            const patternsRange = IDBKeyRange.upperBound(cutoffTime);
            patternsIndex.openCursor(patternsRange).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
            // Clear old user interactions
            const interactionsStore = transaction.objectStore('userInteractions');
            const interactionsIndex = interactionsStore.index('timestamp');
            const interactionsRange = IDBKeyRange.upperBound(cutoffTime);
            interactionsIndex.openCursor(interactionsRange).onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    cursor.delete();
                    cursor.continue();
                }
            };
            transaction.oncomplete = () => {
                console.log(`✅ Cleared data older than ${olderThanDays} days`);
                resolve();
            };
            transaction.onerror = () => {
                console.error('❌ Failed to clear old data:', transaction.error);
                reject(transaction.error);
            };
        });
    }
    async getStorageStats() {
        if (!this.db)
            throw new Error('Database not initialized');
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['automationPatterns', 'userInteractions', 'websiteConfigs'], 'readonly');
            const stats = {
                automationPatterns: 0,
                userInteractions: 0,
                websiteConfigs: 0
            };
            let completedStores = 0;
            const totalStores = 3;
            const checkCompletion = () => {
                completedStores++;
                if (completedStores === totalStores) {
                    resolve(stats);
                }
            };
            // Count automation patterns
            const patternsRequest = transaction.objectStore('automationPatterns').count();
            patternsRequest.onsuccess = () => {
                stats.automationPatterns = patternsRequest.result;
                checkCompletion();
            };
            // Count user interactions
            const interactionsRequest = transaction.objectStore('userInteractions').count();
            interactionsRequest.onsuccess = () => {
                stats.userInteractions = interactionsRequest.result;
                checkCompletion();
            };
            // Count website configs
            const configsRequest = transaction.objectStore('websiteConfigs').count();
            configsRequest.onsuccess = () => {
                stats.websiteConfigs = configsRequest.result;
                checkCompletion();
            };
            transaction.onerror = () => {
                console.error('❌ Failed to get storage stats:', transaction.error);
                reject(transaction.error);
            };
        });
    }
}
// Export singleton instance
export const webBuddyStorage = new WebBuddyStorage();
