/*
                        Web-Buddy Core - Automation Storage

    Copyright (C) 2025-today  rydnr@acm-sl.org

    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <https://www.gnu.org/licenses/>.
*/

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
  parameters: string[]; // Parameter names that this automation expects
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
    confidence: number; // 0-1, how reliable this automation is
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
export class IndexedDBAutomationStorage implements AutomationStorage {
  private dbName = 'web-buddy-automations';
  private version = 1;
  private storeName = 'automations';
  private db?: IDBDatabase;

  constructor() {
    this.initializeDB();
  }

  /**
   * Initialize IndexedDB
   */
  private async initializeDB(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Create automations store
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'id' });
          
          // Create indexes for efficient searching
          store.createIndex('eventType', 'eventType', { unique: false });
          store.createIndex('action', 'action', { unique: false });
          store.createIndex('website', 'website', { unique: false });
          store.createIndex('actionWebsite', ['action', 'website'], { unique: false });
          store.createIndex('lastUsed', 'metadata.lastUsed', { unique: false });
          store.createIndex('confidence', 'metadata.confidence', { unique: false });
        }
      };
    });
  }

  /**
   * Ensure database is ready
   */
  private async ensureDB(): Promise<IDBDatabase> {
    if (!this.db) {
      await this.initializeDB();
    }
    if (!this.db) {
      throw new Error('Database not available');
    }
    return this.db;
  }

  /**
   * Save an automation implementation
   */
  async save(automation: StoredAutomation): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      const request = store.put(automation);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to save automation'));
    });
  }

  /**
   * Find automations matching criteria
   */
  async findMatching(criteria: AutomationSearchCriteria): Promise<StoredAutomation[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      
      let request: IDBRequest;
      
      // Use indexes for efficient searching
      if (criteria.action && criteria.website) {
        const index = store.index('actionWebsite');
        request = index.getAll([criteria.action, criteria.website]);
      } else if (criteria.action) {
        const index = store.index('action');
        request = index.getAll(criteria.action);
      } else if (criteria.website) {
        const index = store.index('website');
        request = index.getAll(criteria.website);
      } else if (criteria.eventType) {
        const index = store.index('eventType');
        request = index.getAll(criteria.eventType);
      } else {
        request = store.getAll();
      }
      
      request.onsuccess = () => {
        let results = request.result as StoredAutomation[];
        
        // Apply additional filtering
        if (criteria.parameters) {
          results = results.filter(automation => 
            criteria.parameters!.every(param => 
              automation.parameters.includes(param)
            )
          );
        }
        
        if (criteria.minConfidence !== undefined) {
          results = results.filter(automation => 
            automation.metadata.confidence >= criteria.minConfidence!
          );
        }
        
        if (criteria.context) {
          results = results.filter(automation => 
            this.matchesContext(automation, criteria.context!)
          );
        }
        
        // Sort by confidence and usage
        results.sort((a, b) => {
          const confidenceDiff = b.metadata.confidence - a.metadata.confidence;
          if (Math.abs(confidenceDiff) > 0.1) return confidenceDiff;
          return b.metadata.useCount - a.metadata.useCount;
        });
        
        resolve(results);
      };
      
      request.onerror = () => reject(new Error('Failed to search automations'));
    });
  }

  /**
   * Get automation by ID
   */
  async getById(id: string): Promise<StoredAutomation | null> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.get(id);
      
      request.onsuccess = () => {
        resolve(request.result || null);
      };
      
      request.onerror = () => reject(new Error('Failed to get automation'));
    });
  }

  /**
   * Update usage statistics for an automation
   */
  async updateUsage(id: string): Promise<void> {
    const automation = await this.getById(id);
    if (!automation) {
      throw new Error(`Automation ${id} not found`);
    }
    
    automation.metadata.lastUsed = new Date();
    automation.metadata.useCount += 1;
    
    // Increase confidence based on successful usage
    automation.metadata.confidence = Math.min(1.0, automation.metadata.confidence + 0.05);
    
    await this.save(automation);
  }

  /**
   * Delete automation by ID
   */
  async deleteById(id: string): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.delete(id);
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to delete automation'));
    });
  }

  /**
   * Export all automations for backup/sharing
   */
  async exportAll(): Promise<StoredAutomation[]> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readonly');
      const store = transaction.objectStore(this.storeName);
      const request = store.getAll();
      
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(new Error('Failed to export automations'));
    });
  }

  /**
   * Import automations from backup/sharing
   */
  async importAutomations(automations: StoredAutomation[]): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      
      let completed = 0;
      const total = automations.length;
      
      if (total === 0) {
        resolve();
        return;
      }
      
      for (const automation of automations) {
        const request = store.put(automation);
        
        request.onsuccess = () => {
          completed++;
          if (completed === total) {
            resolve();
          }
        };
        
        request.onerror = () => {
          reject(new Error('Failed to import automation'));
        };
      }
    });
  }

  /**
   * Clear all stored automations
   */
  async clear(): Promise<void> {
    const db = await this.ensureDB();
    
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([this.storeName], 'readwrite');
      const store = transaction.objectStore(this.storeName);
      const request = store.clear();
      
      request.onsuccess = () => resolve();
      request.onerror = () => reject(new Error('Failed to clear automations'));
    });
  }

  /**
   * Check if automation matches context patterns
   */
  private matchesContext(automation: StoredAutomation, context: Record<string, any>): boolean {
    if (!automation.matching.contextPatterns) {
      return true; // No context restrictions
    }
    
    for (const [key, pattern] of Object.entries(automation.matching.contextPatterns)) {
      const contextValue = context[key];
      
      if (typeof pattern === 'string' && pattern.includes('*')) {
        // Wildcard pattern matching
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        if (!regex.test(String(contextValue))) {
          return false;
        }
      } else if (contextValue !== pattern) {
        return false;
      }
    }
    
    return true;
  }
}

/**
 * Factory function to create automation storage
 */
export function createAutomationStorage(): AutomationStorage {
  if (typeof indexedDB !== 'undefined') {
    return new IndexedDBAutomationStorage();
  } else {
    // Fallback for non-browser environments
    return new MemoryAutomationStorage();
  }
}

/**
 * In-memory fallback storage for testing/non-browser environments
 */
class MemoryAutomationStorage implements AutomationStorage {
  private automations = new Map<string, StoredAutomation>();

  async save(automation: StoredAutomation): Promise<void> {
    this.automations.set(automation.id, { ...automation });
  }

  async findMatching(criteria: AutomationSearchCriteria): Promise<StoredAutomation[]> {
    const results: StoredAutomation[] = [];
    
    for (const automation of this.automations.values()) {
      if (criteria.eventType && automation.eventType !== criteria.eventType) continue;
      if (criteria.action && automation.action !== criteria.action) continue;
      if (criteria.website && automation.website !== criteria.website) continue;
      if (criteria.minConfidence !== undefined && automation.metadata.confidence < criteria.minConfidence) continue;
      
      if (criteria.parameters) {
        const hasAllParams = criteria.parameters.every(param => 
          automation.parameters.includes(param)
        );
        if (!hasAllParams) continue;
      }
      
      results.push({ ...automation });
    }
    
    return results.sort((a, b) => b.metadata.confidence - a.metadata.confidence);
  }

  async getById(id: string): Promise<StoredAutomation | null> {
    const automation = this.automations.get(id);
    return automation ? { ...automation } : null;
  }

  async updateUsage(id: string): Promise<void> {
    const automation = this.automations.get(id);
    if (automation) {
      automation.metadata.lastUsed = new Date();
      automation.metadata.useCount += 1;
      automation.metadata.confidence = Math.min(1.0, automation.metadata.confidence + 0.05);
    }
  }

  async deleteById(id: string): Promise<void> {
    this.automations.delete(id);
  }

  async exportAll(): Promise<StoredAutomation[]> {
    return Array.from(this.automations.values()).map(a => ({ ...a }));
  }

  async importAutomations(automations: StoredAutomation[]): Promise<void> {
    for (const automation of automations) {
      this.automations.set(automation.id, { ...automation });
    }
  }

  async clear(): Promise<void> {
    this.automations.clear();
  }
}