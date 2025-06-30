// IndexedDB Storage Manager for Web-Buddy
// Provides persistent storage for learned automation patterns and user interactions

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

class WebBuddyStorage {
  private db: IDBDatabase | null = null;
  private readonly DB_NAME = 'WebBuddyDB';
  private readonly DB_VERSION = 1;

  constructor() {
    this.init();
  }

  async init(): Promise<void> {
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
        const db = (event.target as IDBOpenDBRequest).result;
        
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
  async saveAutomationPattern(pattern: Omit<AutomationPattern, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const fullPattern: AutomationPattern = {
      ...pattern,
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['automationPatterns'], 'readwrite');
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

  async getAutomationPatterns(filters?: {
    domain?: string;
    action?: string;
    url?: string;
    successOnly?: boolean;
    limit?: number;
  }): Promise<AutomationPattern[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['automationPatterns'], 'readonly');
      const store = transaction.objectStore('automationPatterns');
      
      let request: IDBRequest;
      
      if (filters?.domain) {
        const index = store.index('domain');
        request = index.getAll(filters.domain);
      } else if (filters?.action) {
        const index = store.index('action');
        request = index.getAll(filters.action);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let patterns = request.result as AutomationPattern[];

        // Apply additional filters
        if (filters) {
          if (filters.url) {
            patterns = patterns.filter(p => p.url.includes(filters.url!));
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

  async updateAutomationPattern(id: string, updates: Partial<AutomationPattern>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise(async (resolve, reject) => {
      const transaction = this.db!.transaction(['automationPatterns'], 'readwrite');
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
  async saveUserInteraction(interaction: Omit<UserInteraction, 'id' | 'timestamp'>): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const fullInteraction: UserInteraction = {
      ...interaction,
      id: `interaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userInteractions'], 'readwrite');
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

  async getUserInteractions(filters?: {
    sessionId?: string;
    domain?: string;
    eventType?: string;
    limit?: number;
  }): Promise<UserInteraction[]> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['userInteractions'], 'readonly');
      const store = transaction.objectStore('userInteractions');
      
      let request: IDBRequest;
      
      if (filters?.sessionId) {
        const index = store.index('sessionId');
        request = index.getAll(filters.sessionId);
      } else if (filters?.domain) {
        const index = store.index('domain');
        request = index.getAll(filters.domain);
      } else {
        request = store.getAll();
      }

      request.onsuccess = () => {
        let interactions = request.result as UserInteraction[];

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
  async saveWebsiteConfig(config: WebsiteConfig): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const configWithTimestamp = {
      ...config,
      lastAccessed: Date.now()
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['websiteConfigs'], 'readwrite');
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

  async getWebsiteConfig(domain: string): Promise<WebsiteConfig | null> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['websiteConfigs'], 'readonly');
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
  async clearOldData(olderThanDays: number = 30): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');

    const cutoffTime = Date.now() - (olderThanDays * 24 * 60 * 60 * 1000);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['automationPatterns', 'userInteractions'], 'readwrite');
      
      // Clear old automation patterns
      const patternsStore = transaction.objectStore('automationPatterns');
      const patternsIndex = patternsStore.index('timestamp');
      const patternsRange = IDBKeyRange.upperBound(cutoffTime);
      
      patternsIndex.openCursor(patternsRange).onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
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
        const cursor = (event.target as IDBRequest).result;
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

  async getStorageStats(): Promise<{
    automationPatterns: number;
    userInteractions: number;
    websiteConfigs: number;
  }> {
    if (!this.db) throw new Error('Database not initialized');

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction(['automationPatterns', 'userInteractions', 'websiteConfigs'], 'readonly');
      
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
export type { AutomationPattern, UserInteraction, WebsiteConfig };