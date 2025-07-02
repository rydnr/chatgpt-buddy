// TypeScript-EDA Pattern Storage Adapter
// Infrastructure layer - persists automation patterns using IndexedDB

import { SecondaryAdapter } from 'typescript-eda';
import {
  AutomationPatternData,
  ExecutionContext,
  PatternLearned,
  PatternLearningFailed
} from '../domain/events/training-events';

export interface PatternStoragePort {
  storePattern(pattern: AutomationPatternData): Promise<void>;
  retrievePattern(patternId: string): Promise<AutomationPatternData | null>;
  retrievePatternsByType(messageType: string): Promise<AutomationPatternData[]>;
  retrievePatternsByContext(context: ExecutionContext): Promise<AutomationPatternData[]>;
  updatePatternUsage(patternId: string, usageCount: number, successfulExecutions: number): Promise<void>;
  updatePatternConfidence(patternId: string, confidence: number): Promise<void>;
  deletePattern(patternId: string): Promise<void>;
  clearAllPatterns(): Promise<void>;
  exportPatterns(): Promise<AutomationPatternData[]>;
  importPatterns(patterns: AutomationPatternData[]): Promise<void>;
}

interface StoredPattern extends AutomationPatternData {
  createdAt: Date;
  updatedAt: Date;
  website: string;
}

export class PatternStorageAdapter implements PatternStoragePort, SecondaryAdapter {
  private static readonly DB_NAME = 'ChatGPTBuddyTraining';
  private static readonly DB_VERSION = 1;
  private static readonly STORE_NAME = 'automationPatterns';
  
  private db: IDBDatabase | null = null;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    this.initializationPromise = this.initializeDB();
  }

  // PatternStoragePort implementation

  public async storePattern(pattern: AutomationPatternData): Promise<void> {
    await this.ensureInitialized();
    
    const storedPattern: StoredPattern = {
      ...pattern,
      createdAt: new Date(),
      updatedAt: new Date(),
      website: pattern.context.hostname || 'unknown'
    };

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const request = store.put(storedPattern);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to store pattern: ${request.error?.message}`));
    });
  }

  public async retrievePattern(patternId: string): Promise<AutomationPatternData | null> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readonly');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const request = store.get(patternId);
      
      request.onsuccess = () => {
        const result = request.result as StoredPattern;
        resolve(result ? this.convertToPatternData(result) : null);
      };
      request.onerror = () => reject(new Error(`Failed to retrieve pattern: ${request.error?.message}`));
    });
  }

  public async retrievePatternsByType(messageType: string): Promise<AutomationPatternData[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readonly');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      const index = store.index('messageType');
      
      const request = index.getAll(messageType);
      
      request.onsuccess = () => {
        const patterns = request.result as StoredPattern[];
        resolve(patterns.map(p => this.convertToPatternData(p)));
      };
      request.onerror = () => reject(new Error(`Failed to retrieve patterns by type: ${request.error?.message}`));
    });
  }

  public async retrievePatternsByContext(context: ExecutionContext): Promise<AutomationPatternData[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readonly');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      const index = store.index('website');
      
      const request = index.getAll(context.hostname);
      
      request.onsuccess = () => {
        const patterns = request.result as StoredPattern[];
        // Filter by additional context criteria
        const filteredPatterns = patterns.filter(pattern => 
          this.isContextCompatible(pattern.context, context)
        );
        resolve(filteredPatterns.map(p => this.convertToPatternData(p)));
      };
      request.onerror = () => reject(new Error(`Failed to retrieve patterns by context: ${request.error?.message}`));
    });
  }

  public async updatePatternUsage(patternId: string, usageCount: number, successfulExecutions: number): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const getRequest = store.get(patternId);
      
      getRequest.onsuccess = () => {
        const pattern = getRequest.result as StoredPattern;
        if (!pattern) {
          reject(new Error(`Pattern not found: ${patternId}`));
          return;
        }

        pattern.usageCount = usageCount;
        pattern.successfulExecutions = successfulExecutions;
        pattern.updatedAt = new Date();

        const putRequest = store.put(pattern);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error(`Failed to update pattern usage: ${putRequest.error?.message}`));
      };
      
      getRequest.onerror = () => reject(new Error(`Failed to retrieve pattern for update: ${getRequest.error?.message}`));
    });
  }

  public async updatePatternConfidence(patternId: string, confidence: number): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const getRequest = store.get(patternId);
      
      getRequest.onsuccess = () => {
        const pattern = getRequest.result as StoredPattern;
        if (!pattern) {
          reject(new Error(`Pattern not found: ${patternId}`));
          return;
        }

        pattern.confidence = confidence;
        pattern.updatedAt = new Date();

        const putRequest = store.put(pattern);
        putRequest.onsuccess = () => resolve();
        putRequest.onerror = () => reject(new Error(`Failed to update pattern confidence: ${putRequest.error?.message}`));
      };
      
      getRequest.onerror = () => reject(new Error(`Failed to retrieve pattern for update: ${getRequest.error?.message}`));
    });
  }

  public async deletePattern(patternId: string): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const request = store.delete(patternId);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to delete pattern: ${request.error?.message}`));
    });
  }

  public async clearAllPatterns(): Promise<void> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error(`Failed to clear patterns: ${request.error?.message}`));
    });
  }

  public async exportPatterns(): Promise<AutomationPatternData[]> {
    await this.ensureInitialized();

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readonly');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const patterns = request.result as StoredPattern[];
        resolve(patterns.map(p => this.convertToPatternData(p)));
      };
      request.onerror = () => reject(new Error(`Failed to export patterns: ${request.error?.message}`));
    });
  }

  public async importPatterns(patterns: AutomationPatternData[]): Promise<void> {
    await this.ensureInitialized();

    const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readwrite');
    const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);

    const promises = patterns.map(pattern => {
      const storedPattern: StoredPattern = {
        ...pattern,
        createdAt: new Date(),
        updatedAt: new Date(),
        website: pattern.context.hostname || 'unknown'
      };

      return new Promise<void>((resolve, reject) => {
        const request = store.put(storedPattern);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(new Error(`Failed to import pattern: ${request.error?.message}`));
      });
    });

    await Promise.all(promises);
  }

  // Additional utility methods

  public async getPatternStatistics(): Promise<{
    totalPatterns: number;
    patternsByWebsite: Record<string, number>;
    patternsByType: Record<string, number>;
    averageConfidence: number;
    totalExecutions: number;
    successRate: number;
  }> {
    const patterns = await this.exportPatterns();
    
    const stats = {
      totalPatterns: patterns.length,
      patternsByWebsite: {} as Record<string, number>,
      patternsByType: {} as Record<string, number>,
      averageConfidence: 0,
      totalExecutions: 0,
      successRate: 0
    };

    let totalConfidence = 0;
    let totalSuccessful = 0;

    for (const pattern of patterns) {
      // Group by website
      const website = pattern.context.hostname || 'unknown';
      stats.patternsByWebsite[website] = (stats.patternsByWebsite[website] || 0) + 1;

      // Group by message type
      stats.patternsByType[pattern.messageType] = (stats.patternsByType[pattern.messageType] || 0) + 1;

      // Accumulate statistics
      totalConfidence += pattern.confidence;
      stats.totalExecutions += pattern.usageCount;
      totalSuccessful += pattern.successfulExecutions;
    }

    if (patterns.length > 0) {
      stats.averageConfidence = totalConfidence / patterns.length;
    }

    if (stats.totalExecutions > 0) {
      stats.successRate = totalSuccessful / stats.totalExecutions;
    }

    return stats;
  }

  public async cleanupStalePatterns(maxAgeInDays: number = 30): Promise<number> {
    await this.ensureInitialized();

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeInDays);

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([PatternStorageAdapter.STORE_NAME], 'readwrite');
      const store = transaction.objectStore(PatternStorageAdapter.STORE_NAME);
      
      const request = store.getAll();
      
      request.onsuccess = () => {
        const patterns = request.result as StoredPattern[];
        let deletedCount = 0;
        
        const deletePromises = patterns
          .filter(pattern => {
            const isStale = pattern.context.timestamp < cutoffDate;
            const hasLowSuccess = pattern.usageCount > 3 && (pattern.successfulExecutions / pattern.usageCount) < 0.3;
            return isStale || hasLowSuccess;
          })
          .map(pattern => {
            return new Promise<void>((resolveDelete, rejectDelete) => {
              const deleteRequest = store.delete(pattern.id);
              deleteRequest.onsuccess = () => {
                deletedCount++;
                resolveDelete();
              };
              deleteRequest.onerror = () => rejectDelete(deleteRequest.error);
            });
          });

        Promise.all(deletePromises)
          .then(() => resolve(deletedCount))
          .catch(reject);
      };
      
      request.onerror = () => reject(new Error(`Failed to cleanup stale patterns: ${request.error?.message}`));
    });
  }

  // Private methods

  private async ensureInitialized(): Promise<void> {
    if (this.initializationPromise) {
      await this.initializationPromise;
    }
    if (!this.db) {
      throw new Error('Database initialization failed');
    }
  }

  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(PatternStorageAdapter.DB_NAME, PatternStorageAdapter.DB_VERSION);
      
      request.onerror = () => reject(new Error(`Failed to open database: ${request.error?.message}`));
      
      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };
      
      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create the patterns store
        const store = db.createObjectStore(PatternStorageAdapter.STORE_NAME, { keyPath: 'id' });
        
        // Create indexes for efficient querying
        store.createIndex('messageType', 'messageType', { unique: false });
        store.createIndex('website', 'website', { unique: false });
        store.createIndex('confidence', 'confidence', { unique: false });
        store.createIndex('usageCount', 'usageCount', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        
        // Compound indexes for complex queries
        store.createIndex('websiteMessageType', ['website', 'messageType'], { unique: false });
        store.createIndex('confidenceUsage', ['confidence', 'usageCount'], { unique: false });
      };
    });
  }

  private convertToPatternData(storedPattern: StoredPattern): AutomationPatternData {
    return {
      id: storedPattern.id,
      messageType: storedPattern.messageType,
      payload: storedPattern.payload,
      selector: storedPattern.selector,
      context: storedPattern.context,
      confidence: storedPattern.confidence,
      usageCount: storedPattern.usageCount,
      successfulExecutions: storedPattern.successfulExecutions
    };
  }

  private isContextCompatible(patternContext: ExecutionContext, currentContext: ExecutionContext): boolean {
    // Same hostname is required
    if (patternContext.hostname !== currentContext.hostname) {
      return false;
    }

    // Path similarity check
    const pathSimilarity = this.calculatePathSimilarity(patternContext.pathname, currentContext.pathname);
    if (pathSimilarity < 0.5) {
      return false;
    }

    // Page structure compatibility (if available)
    if (patternContext.pageStructureHash && currentContext.pageStructureHash) {
      return patternContext.pageStructureHash === currentContext.pageStructureHash;
    }

    return true;
  }

  private calculatePathSimilarity(path1: string, path2: string): number {
    if (path1 === path2) return 1.0;
    
    const segments1 = path1.split('/').filter(s => s.length > 0);
    const segments2 = path2.split('/').filter(s => s.length > 0);
    
    if (segments1.length === 0 && segments2.length === 0) return 1.0;
    
    const commonSegments = segments1.filter(seg => segments2.includes(seg));
    const totalSegments = new Set([...segments1, ...segments2]).size;
    
    return commonSegments.length / totalSegments;
  }
}