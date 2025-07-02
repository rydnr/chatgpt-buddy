/**
 * Pattern Manager - Advanced Pattern Sharing and Management
 * 
 * Provides comprehensive pattern management including export/import,
 * sharing, validation, and collaboration features.
 */

import { globalMessageStore } from './message-store';
import { globalPerformanceOptimizer } from './performance-optimizer';

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
  estimatedDuration: number; // in seconds
  successRate: number; // 0-1
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

export class PatternManager {
  private patterns: Map<string, AutomationPattern> = new Map();
  private shares: Map<string, PatternShare> = new Map();
  private categories: Set<string> = new Set(['web-automation', 'data-extraction', 'testing', 'workflow', 'utility']);
  private readonly STORAGE_KEY = 'chatgpt-buddy-patterns';
  private readonly SHARES_KEY = 'chatgpt-buddy-pattern-shares';
  private readonly MAX_PATTERN_SIZE = 1024 * 1024; // 1MB per pattern
  private readonly EXPORT_VERSION = '1.0.0';

  constructor() {
    this.loadPatterns();
    this.loadShares();
    this.startPatternCleanup();
  }

  /**
   * Create a new automation pattern
   */
  async createPattern(
    name: string,
    description: string,
    steps: PatternStep[],
    options: Partial<AutomationPattern> = {}
  ): Promise<AutomationPattern> {
    const pattern: AutomationPattern = {
      id: this.generatePatternId(),
      name,
      description,
      version: '1.0.0',
      author: options.author || 'Anonymous',
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      tags: options.tags || [],
      category: options.category || 'web-automation',
      steps,
      conditions: options.conditions || [],
      variables: options.variables || [],
      metadata: {
        compatibility: ['chrome', 'firefox', 'edge'],
        requirements: [],
        permissions: [],
        language: 'en',
        difficulty: 'beginner',
        estimatedDuration: this.estimatePatternDuration(steps),
        successRate: 1.0,
        popularity: 0,
        domains: [],
        ...options.metadata
      },
      statistics: {
        executions: 0,
        successes: 0,
        failures: 0,
        averageExecutionTime: 0,
        errorTypes: {},
        performanceMetrics: {
          fastestExecution: 0,
          slowestExecution: 0,
          memoryUsage: []
        },
        ...options.statistics
      }
    };

    // Validate pattern
    const validation = this.validatePattern(pattern);
    if (!validation.isValid) {
      throw new Error(`Invalid pattern: ${validation.errors.join(', ')}`);
    }

    this.patterns.set(pattern.id, pattern);
    await this.savePatterns();

    // Track pattern creation
    globalMessageStore.addInboundMessage(
      'PATTERN_CREATED',
      { patternId: pattern.id, name, category: pattern.category },
      `pattern-created-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    console.log(`📝 Created pattern: ${name} (${pattern.id})`);
    return pattern;
  }

  /**
   * Get a pattern by ID
   */
  getPattern(id: string): AutomationPattern | null {
    return this.patterns.get(id) || null;
  }

  /**
   * Get all patterns with optional filtering
   */
  getPatterns(filter?: {
    category?: string;
    tags?: string[];
    author?: string;
    difficulty?: string;
    searchText?: string;
  }): AutomationPattern[] {
    let patterns = Array.from(this.patterns.values());

    if (filter) {
      if (filter.category) {
        patterns = patterns.filter(p => p.category === filter.category);
      }
      
      if (filter.tags && filter.tags.length > 0) {
        patterns = patterns.filter(p => 
          filter.tags!.some(tag => p.tags.includes(tag))
        );
      }
      
      if (filter.author) {
        patterns = patterns.filter(p => p.author === filter.author);
      }
      
      if (filter.difficulty) {
        patterns = patterns.filter(p => p.metadata.difficulty === filter.difficulty);
      }
      
      if (filter.searchText) {
        const searchLower = filter.searchText.toLowerCase();
        patterns = patterns.filter(p => 
          p.name.toLowerCase().includes(searchLower) ||
          p.description.toLowerCase().includes(searchLower) ||
          p.tags.some(tag => tag.toLowerCase().includes(searchLower))
        );
      }
    }

    return patterns.sort((a, b) => 
      new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );
  }

  /**
   * Update an existing pattern
   */
  async updatePattern(id: string, updates: Partial<AutomationPattern>): Promise<AutomationPattern> {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      throw new Error(`Pattern not found: ${id}`);
    }

    const updatedPattern: AutomationPattern = {
      ...pattern,
      ...updates,
      id, // Ensure ID doesn't change
      lastModified: new Date().toISOString(),
      version: this.incrementVersion(pattern.version)
    };

    // Validate updated pattern
    const validation = this.validatePattern(updatedPattern);
    if (!validation.isValid) {
      throw new Error(`Invalid pattern update: ${validation.errors.join(', ')}`);
    }

    this.patterns.set(id, updatedPattern);
    await this.savePatterns();

    // Track pattern update
    globalMessageStore.addInboundMessage(
      'PATTERN_UPDATED',
      { patternId: id, version: updatedPattern.version },
      `pattern-updated-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    console.log(`📝 Updated pattern: ${updatedPattern.name} (${id})`);
    return updatedPattern;
  }

  /**
   * Delete a pattern
   */
  async deletePattern(id: string): Promise<boolean> {
    const pattern = this.patterns.get(id);
    if (!pattern) {
      return false;
    }

    this.patterns.delete(id);
    
    // Remove related shares
    Array.from(this.shares.values())
      .filter(share => share.patternId === id)
      .forEach(share => this.shares.delete(share.shareId));

    await this.savePatterns();
    await this.saveShares();

    // Track pattern deletion
    globalMessageStore.addInboundMessage(
      'PATTERN_DELETED',
      { patternId: id, name: pattern.name },
      `pattern-deleted-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    console.log(`🗑️ Deleted pattern: ${pattern.name} (${id})`);
    return true;
  }

  /**
   * Export patterns to various formats
   */
  async exportPatterns(
    patternIds: string[],
    format: 'json' | 'yaml' | 'xml' = 'json',
    options: {
      compression?: boolean;
      encryption?: boolean;
      includeStatistics?: boolean;
      includeDependencies?: boolean;
    } = {}
  ): Promise<string> {
    const patterns = patternIds
      .map(id => this.patterns.get(id))
      .filter(pattern => pattern !== undefined) as AutomationPattern[];

    if (patterns.length === 0) {
      throw new Error('No valid patterns found for export');
    }

    // Prepare export data
    const exportData: PatternExport = {
      version: this.EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: 'ChatGPT-buddy Extension',
      format,
      compression: options.compression || false,
      encryption: options.encryption || false,
      patterns: options.includeStatistics ? patterns : patterns.map(p => ({
        ...p,
        statistics: {
          executions: 0,
          successes: 0,
          failures: 0,
          averageExecutionTime: 0,
          errorTypes: {},
          performanceMetrics: {
            fastestExecution: 0,
            slowestExecution: 0,
            memoryUsage: []
          }
        }
      })),
      dependencies: options.includeDependencies ? this.extractDependencies(patterns) : [],
      checksum: ''
    };

    // Generate checksum
    exportData.checksum = await this.generateChecksum(JSON.stringify(exportData.patterns));

    // Convert to requested format
    let serialized = '';
    switch (format) {
      case 'json':
        serialized = JSON.stringify(exportData, null, 2);
        break;
      case 'yaml':
        serialized = this.convertToYaml(exportData);
        break;
      case 'xml':
        serialized = this.convertToXml(exportData);
        break;
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }

    // Apply compression if requested
    if (options.compression) {
      serialized = await this.compressData(serialized);
    }

    // Apply encryption if requested
    if (options.encryption) {
      serialized = await this.encryptData(serialized);
    }

    // Track export
    globalMessageStore.addInboundMessage(
      'PATTERNS_EXPORTED',
      { 
        count: patterns.length, 
        format, 
        size: serialized.length,
        compression: options.compression,
        encryption: options.encryption
      },
      `patterns-exported-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    console.log(`📤 Exported ${patterns.length} patterns as ${format.toUpperCase()}`);
    return serialized;
  }

  /**
   * Import patterns from various formats
   */
  async importPatterns(
    data: string,
    options: {
      overwrite?: boolean;
      validateOnly?: boolean;
      mergeDuplicates?: boolean;
    } = {}
  ): Promise<{ imported: AutomationPattern[], skipped: string[], errors: string[] }> {
    const result = {
      imported: [] as AutomationPattern[],
      skipped: [] as string[],
      errors: [] as string[]
    };

    try {
      // Decrypt if needed
      let processedData = data;
      if (this.isEncrypted(data)) {
        processedData = await this.decryptData(data);
      }

      // Decompress if needed
      if (this.isCompressed(processedData)) {
        processedData = await this.decompressData(processedData);
      }

      // Parse data
      let exportData: PatternExport;
      try {
        if (processedData.trim().startsWith('<')) {
          exportData = this.parseXml(processedData);
        } else if (processedData.includes('version:') && !processedData.trim().startsWith('{')) {
          exportData = this.parseYaml(processedData);
        } else {
          exportData = JSON.parse(processedData);
        }
      } catch (parseError) {
        result.errors.push(`Failed to parse import data: ${parseError}`);
        return result;
      }

      // Validate checksum
      if (exportData.checksum) {
        const calculatedChecksum = await this.generateChecksum(JSON.stringify(exportData.patterns));
        if (calculatedChecksum !== exportData.checksum) {
          result.errors.push('Checksum validation failed - data may be corrupted');
          if (!options.validateOnly) {
            return result;
          }
        }
      }

      // Process each pattern
      for (const pattern of exportData.patterns) {
        try {
          // Validate pattern
          const validation = this.validatePattern(pattern);
          if (!validation.isValid) {
            result.errors.push(`Invalid pattern ${pattern.name}: ${validation.errors.join(', ')}`);
            continue;
          }

          // Check for existing pattern
          const existingPattern = this.patterns.get(pattern.id);
          if (existingPattern) {
            if (!options.overwrite && !options.mergeDuplicates) {
              result.skipped.push(`Pattern already exists: ${pattern.name} (${pattern.id})`);
              continue;
            }

            if (options.mergeDuplicates) {
              // Merge patterns
              const mergedPattern = this.mergePatterns(existingPattern, pattern);
              if (!options.validateOnly) {
                this.patterns.set(pattern.id, mergedPattern);
              }
              result.imported.push(mergedPattern);
            } else if (options.overwrite) {
              // Overwrite existing
              if (!options.validateOnly) {
                this.patterns.set(pattern.id, pattern);
              }
              result.imported.push(pattern);
            }
          } else {
            // New pattern
            if (!options.validateOnly) {
              this.patterns.set(pattern.id, pattern);
            }
            result.imported.push(pattern);
          }
        } catch (error) {
          result.errors.push(`Error processing pattern ${pattern.name}: ${error}`);
        }
      }

      // Save patterns if not validation-only
      if (!options.validateOnly && result.imported.length > 0) {
        await this.savePatterns();
      }

      // Track import
      globalMessageStore.addInboundMessage(
        'PATTERNS_IMPORTED',
        { 
          imported: result.imported.length,
          skipped: result.skipped.length,
          errors: result.errors.length,
          validateOnly: options.validateOnly
        },
        `patterns-imported-${Date.now()}`,
        { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
      );

      console.log(`📥 Import completed: ${result.imported.length} imported, ${result.skipped.length} skipped, ${result.errors.length} errors`);

    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
    }

    return result;
  }

  /**
   * Create a shareable link for patterns
   */
  async sharePatterns(
    patternIds: string[],
    shareType: 'public' | 'private' | 'team' | 'temporary' = 'private',
    options: {
      expiresIn?: number; // milliseconds
      permissions?: SharePermission[];
      password?: string;
    } = {}
  ): Promise<PatternShare> {
    if (patternIds.length === 0) {
      throw new Error('No patterns specified for sharing');
    }

    // Validate patterns exist
    const invalidPatterns = patternIds.filter(id => !this.patterns.has(id));
    if (invalidPatterns.length > 0) {
      throw new Error(`Invalid pattern IDs: ${invalidPatterns.join(', ')}`);
    }

    const shareId = this.generateShareId();
    const share: PatternShare = {
      patternId: patternIds[0], // For now, support single pattern sharing
      shareId,
      shareType,
      expiresAt: options.expiresIn ? 
        new Date(Date.now() + options.expiresIn).toISOString() : undefined,
      permissions: options.permissions || [],
      accessCount: 0,
      downloadCount: 0,
      created: new Date().toISOString(),
      createdBy: 'current-user' // TODO: Implement user management
    };

    this.shares.set(shareId, share);
    await this.saveShares();

    // Track sharing
    globalMessageStore.addInboundMessage(
      'PATTERNS_SHARED',
      { shareId, patternCount: patternIds.length, shareType },
      `patterns-shared-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    console.log(`🔗 Created share: ${shareId} for ${patternIds.length} pattern(s)`);
    return share;
  }

  /**
   * Access shared patterns
   */
  async accessSharedPatterns(shareId: string): Promise<AutomationPattern[]> {
    const share = this.shares.get(shareId);
    if (!share) {
      throw new Error(`Share not found: ${shareId}`);
    }

    // Check expiration
    if (share.expiresAt && new Date() > new Date(share.expiresAt)) {
      this.shares.delete(shareId);
      await this.saveShares();
      throw new Error('Share has expired');
    }

    // Update access count
    share.accessCount++;
    this.shares.set(shareId, share);
    await this.saveShares();

    // Get pattern(s)
    const pattern = this.patterns.get(share.patternId);
    if (!pattern) {
      throw new Error('Shared pattern no longer exists');
    }

    // Track access
    globalMessageStore.addInboundMessage(
      'SHARED_PATTERNS_ACCESSED',
      { shareId, patternId: share.patternId },
      `shared-patterns-accessed-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    return [pattern];
  }

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
  } {
    const patterns = Array.from(this.patterns.values());
    
    const analytics = {
      totalPatterns: patterns.length,
      categoriesBreakdown: {} as Record<string, number>,
      difficultiesBreakdown: {} as Record<string, number>,
      averageSuccessRate: 0,
      totalExecutions: 0,
      mostPopular: [] as AutomationPattern[],
      recentlyCreated: [] as AutomationPattern[]
    };

    if (patterns.length === 0) {
      return analytics;
    }

    // Calculate breakdowns
    patterns.forEach(pattern => {
      analytics.categoriesBreakdown[pattern.category] = 
        (analytics.categoriesBreakdown[pattern.category] || 0) + 1;
      
      analytics.difficultiesBreakdown[pattern.metadata.difficulty] = 
        (analytics.difficultiesBreakdown[pattern.metadata.difficulty] || 0) + 1;
      
      analytics.totalExecutions += pattern.statistics.executions;
    });

    // Calculate average success rate
    const successRates = patterns
      .filter(p => p.statistics.executions > 0)
      .map(p => p.statistics.successes / p.statistics.executions);
    
    analytics.averageSuccessRate = successRates.length > 0 ? 
      successRates.reduce((sum, rate) => sum + rate, 0) / successRates.length : 0;

    // Get most popular patterns
    analytics.mostPopular = patterns
      .filter(p => p.statistics.executions > 0)
      .sort((a, b) => b.metadata.popularity - a.metadata.popularity)
      .slice(0, 5);

    // Get recently created patterns
    analytics.recentlyCreated = patterns
      .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime())
      .slice(0, 5);

    return analytics;
  }

  /**
   * Validate a pattern for correctness and completeness
   */
  validatePattern(pattern: AutomationPattern): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Basic validation
    if (!pattern.id || pattern.id.trim() === '') {
      errors.push('Pattern ID is required');
    }

    if (!pattern.name || pattern.name.trim() === '') {
      errors.push('Pattern name is required');
    }

    if (!pattern.steps || pattern.steps.length === 0) {
      errors.push('Pattern must have at least one step');
    }

    // Validate steps
    pattern.steps?.forEach((step, index) => {
      if (!step.id) {
        errors.push(`Step ${index + 1}: ID is required`);
      }

      if (!step.type) {
        errors.push(`Step ${index + 1}: Type is required`);
      }

      if (!step.selector && ['click', 'type', 'extract'].includes(step.type)) {
        errors.push(`Step ${index + 1}: Selector is required for ${step.type} steps`);
      }

      if (step.type === 'type' && !step.value) {
        warnings.push(`Step ${index + 1}: Type step has no value specified`);
      }

      if (step.timeout < 0) {
        errors.push(`Step ${index + 1}: Timeout cannot be negative`);
      }
    });

    // Validate conditions
    pattern.conditions?.forEach((condition, index) => {
      if (!condition.id) {
        errors.push(`Condition ${index + 1}: ID is required`);
      }

      if (!condition.type) {
        errors.push(`Condition ${index + 1}: Type is required`);
      }

      if (condition.action === 'goto_step' && !condition.targetStep) {
        errors.push(`Condition ${index + 1}: Target step is required for goto_step action`);
      }
    });

    // Validate variables
    pattern.variables?.forEach((variable, index) => {
      if (!variable.id) {
        errors.push(`Variable ${index + 1}: ID is required`);
      }

      if (!variable.name) {
        errors.push(`Variable ${index + 1}: Name is required`);
      }

      if (!variable.type) {
        errors.push(`Variable ${index + 1}: Type is required`);
      }
    });

    // Check pattern size
    const patternSize = JSON.stringify(pattern).length;
    if (patternSize > this.MAX_PATTERN_SIZE) {
      errors.push(`Pattern size (${patternSize} bytes) exceeds maximum (${this.MAX_PATTERN_SIZE} bytes)`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Generate unique pattern ID
   */
  private generatePatternId(): string {
    return `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique share ID
   */
  private generateShareId(): string {
    return `share-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Estimate pattern execution duration based on steps
   */
  private estimatePatternDuration(steps: PatternStep[]): number {
    const baseTimes = {
      click: 1000,    // 1 second
      type: 2000,     // 2 seconds
      wait: 3000,     // 3 seconds
      navigate: 5000, // 5 seconds
      extract: 1500,  // 1.5 seconds
      condition: 500, // 0.5 seconds
      loop: 1000      // 1 second base
    };

    return steps.reduce((total, step) => {
      const baseTime = baseTimes[step.type] || 1000;
      const timeout = step.timeout || 0;
      return total + Math.max(baseTime, timeout);
    }, 0);
  }

  /**
   * Increment semantic version
   */
  private incrementVersion(version: string): string {
    const parts = version.split('.').map(Number);
    parts[2] = (parts[2] || 0) + 1;
    return parts.join('.');
  }

  /**
   * Extract dependencies from patterns
   */
  private extractDependencies(patterns: AutomationPattern[]): string[] {
    const dependencies = new Set<string>();
    
    patterns.forEach(pattern => {
      pattern.metadata.requirements.forEach(req => dependencies.add(req));
      pattern.metadata.permissions.forEach(perm => dependencies.add(perm));
    });

    return Array.from(dependencies);
  }

  /**
   * Generate SHA-256 checksum
   */
  private async generateChecksum(data: string): Promise<string> {
    const encoder = new TextEncoder();
    const buffer = encoder.encode(data);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Convert to YAML format (simplified)
   */
  private convertToYaml(data: PatternExport): string {
    // Simplified YAML conversion - in production, use a proper YAML library
    return `version: ${data.version}\nexportedAt: ${data.exportedAt}\npatterns:\n${JSON.stringify(data.patterns, null, 2)}`;
  }

  /**
   * Convert to XML format (simplified)
   */
  private convertToXml(data: PatternExport): string {
    // Simplified XML conversion - in production, use a proper XML library
    return `<?xml version="1.0" encoding="UTF-8"?>\n<export version="${data.version}" exportedAt="${data.exportedAt}">\n<patterns>${JSON.stringify(data.patterns)}</patterns>\n</export>`;
  }

  /**
   * Parse YAML data (simplified)
   */
  private parseYaml(data: string): PatternExport {
    // Simplified YAML parsing - in production, use a proper YAML library
    throw new Error('YAML parsing not implemented');
  }

  /**
   * Parse XML data (simplified)
   */
  private parseXml(data: string): PatternExport {
    // Simplified XML parsing - in production, use a proper XML library
    throw new Error('XML parsing not implemented');
  }

  /**
   * Data compression (simplified)
   */
  private async compressData(data: string): Promise<string> {
    // In production, use proper compression library like pako
    return btoa(data);
  }

  /**
   * Data decompression (simplified)
   */
  private async decompressData(data: string): Promise<string> {
    try {
      return atob(data);
    } catch {
      throw new Error('Failed to decompress data');
    }
  }

  /**
   * Data encryption (simplified)
   */
  private async encryptData(data: string): Promise<string> {
    // In production, use proper encryption
    return btoa(data);
  }

  /**
   * Data decryption (simplified)
   */
  private async decryptData(data: string): Promise<string> {
    try {
      return atob(data);
    } catch {
      throw new Error('Failed to decrypt data');
    }
  }

  /**
   * Check if data is encrypted
   */
  private isEncrypted(data: string): boolean {
    // Simple heuristic - in production, use proper markers
    return data.startsWith('encrypted:');
  }

  /**
   * Check if data is compressed
   */
  private isCompressed(data: string): boolean {
    // Simple heuristic - in production, use proper markers
    return data.startsWith('compressed:');
  }

  /**
   * Merge two patterns (for duplicate handling)
   */
  private mergePatterns(existing: AutomationPattern, incoming: AutomationPattern): AutomationPattern {
    return {
      ...existing,
      ...incoming,
      id: existing.id, // Keep original ID
      created: existing.created, // Keep original creation date
      lastModified: new Date().toISOString(),
      version: this.incrementVersion(existing.version),
      statistics: {
        ...existing.statistics,
        // Don't merge statistics from import
      }
    };
  }

  /**
   * Load patterns from storage
   */
  private async loadPatterns(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const stored = result[this.STORAGE_KEY];
      
      if (stored && stored.patterns) {
        stored.patterns.forEach((pattern: AutomationPattern) => {
          this.patterns.set(pattern.id, pattern);
        });
        console.log(`📚 Loaded ${this.patterns.size} patterns from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load patterns:', error);
    }
  }

  /**
   * Save patterns to storage
   */
  private async savePatterns(): Promise<void> {
    try {
      const patterns = Array.from(this.patterns.values());
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: {
          patterns,
          lastSaved: new Date().toISOString(),
          version: this.EXPORT_VERSION
        }
      });
    } catch (error) {
      console.error('❌ Failed to save patterns:', error);
    }
  }

  /**
   * Load shares from storage
   */
  private async loadShares(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.SHARES_KEY);
      const stored = result[this.SHARES_KEY];
      
      if (stored && stored.shares) {
        stored.shares.forEach((share: PatternShare) => {
          this.shares.set(share.shareId, share);
        });
        console.log(`🔗 Loaded ${this.shares.size} shares from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load shares:', error);
    }
  }

  /**
   * Save shares to storage
   */
  private async saveShares(): Promise<void> {
    try {
      const shares = Array.from(this.shares.values());
      await chrome.storage.local.set({
        [this.SHARES_KEY]: {
          shares,
          lastSaved: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Failed to save shares:', error);
    }
  }

  /**
   * Start pattern cleanup (remove expired shares, etc.)
   */
  private startPatternCleanup(): void {
    setInterval(() => {
      this.cleanupExpiredShares();
    }, 60 * 60 * 1000); // Run every hour
  }

  /**
   * Clean up expired shares
   */
  private async cleanupExpiredShares(): Promise<void> {
    const now = new Date();
    let removedCount = 0;

    for (const [shareId, share] of this.shares.entries()) {
      if (share.expiresAt && now > new Date(share.expiresAt)) {
        this.shares.delete(shareId);
        removedCount++;
      }
    }

    if (removedCount > 0) {
      await this.saveShares();
      console.log(`🧹 Cleaned up ${removedCount} expired shares`);
    }
  }
}

// Global pattern manager instance
export const globalPatternManager = new PatternManager();