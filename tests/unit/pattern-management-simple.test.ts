/**
 * Pattern Management - Simplified Unit Tests
 * 
 * Tests pattern management functionality without complex global dependencies.
 * Uses lightweight implementations and clear contracts.
 */

import { jest } from '@jest/globals';

// Simple pattern interfaces for testing
interface SimplePattern {
  id: string;
  name: string;
  description: string;
  steps: SimpleStep[];
  created: string;
  version: string;
}

interface SimpleStep {
  id: string;
  type: 'click' | 'type' | 'wait' | 'navigate';
  selector: string;
  description: string;
  timeout: number;
}

// Lightweight pattern manager for testing
class SimplePatternManager {
  private patterns = new Map<string, SimplePattern>();
  private events: Array<{ type: string; data: any }> = [];

  async createPattern(name: string, description: string, steps: SimpleStep[]): Promise<SimplePattern> {
    const pattern: SimplePattern = {
      id: `pattern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      description,
      steps,
      created: new Date().toISOString(),
      version: '1.0.0'
    };

    this.patterns.set(pattern.id, pattern);
    this.events.push({ type: 'PATTERN_CREATED', data: { id: pattern.id, name } });
    
    return pattern;
  }

  getPattern(id: string): SimplePattern | null {
    return this.patterns.get(id) || null;
  }

  getAllPatterns(): SimplePattern[] {
    return Array.from(this.patterns.values());
  }

  async updatePattern(id: string, updates: Partial<SimplePattern>): Promise<SimplePattern | null> {
    const existing = this.patterns.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...updates, id }; // Keep original ID
    this.patterns.set(id, updated);
    this.events.push({ type: 'PATTERN_UPDATED', data: { id, updates } });
    
    return updated;
  }

  async deletePattern(id: string): Promise<boolean> {
    const deleted = this.patterns.delete(id);
    if (deleted) {
      this.events.push({ type: 'PATTERN_DELETED', data: { id } });
    }
    return deleted;
  }

  validatePattern(pattern: SimplePattern): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!pattern.id) errors.push('ID is required');
    if (!pattern.name) errors.push('Name is required');
    if (!pattern.steps || pattern.steps.length === 0) errors.push('At least one step is required');

    pattern.steps?.forEach((step, index) => {
      if (!step.id) errors.push(`Step ${index + 1}: ID is required`);
      if (!step.type) errors.push(`Step ${index + 1}: Type is required`);
      if (!step.selector) errors.push(`Step ${index + 1}: Selector is required`);
      if (step.timeout < 0) errors.push(`Step ${index + 1}: Timeout cannot be negative`);
    });

    return { isValid: errors.length === 0, errors };
  }

  exportPatterns(patternIds: string[]): string {
    const patterns = patternIds
      .map(id => this.patterns.get(id))
      .filter(p => p !== undefined);

    return JSON.stringify({
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      patterns
    }, null, 2);
  }

  async importPatterns(data: string): Promise<{ imported: number; skipped: number; errors: string[] }> {
    const result = { imported: 0, skipped: 0, errors: [] as string[] };

    try {
      const parsed = JSON.parse(data);
      
      if (!parsed.patterns || !Array.isArray(parsed.patterns)) {
        result.errors.push('Invalid import format: patterns array required');
        return result;
      }

      for (const pattern of parsed.patterns) {
        const validation = this.validatePattern(pattern);
        if (!validation.isValid) {
          result.errors.push(`Invalid pattern ${pattern.name}: ${validation.errors.join(', ')}`);
          continue;
        }

        if (this.patterns.has(pattern.id)) {
          result.skipped++;
        } else {
          this.patterns.set(pattern.id, pattern);
          result.imported++;
        }
      }
    } catch (error) {
      result.errors.push(`Import failed: ${error}`);
    }

    return result;
  }

  getEvents(): Array<{ type: string; data: any }> {
    return [...this.events];
  }

  clearEvents(): void {
    this.events = [];
  }
}

describe('🧩 Pattern Management - Simplified', () => {
  let patternManager: SimplePatternManager;
  let sampleSteps: SimpleStep[];

  beforeEach(() => {
    patternManager = new SimplePatternManager();
    sampleSteps = [
      {
        id: 'step-1',
        type: 'click',
        selector: '#submit-button',
        description: 'Click submit button',
        timeout: 5000
      },
      {
        id: 'step-2',
        type: 'type',
        selector: '#email-input',
        description: 'Enter email address',
        timeout: 3000
      }
    ];
  });

  describe('🎨 Pattern Creation', () => {
    test('should create a valid pattern', async () => {
      const pattern = await patternManager.createPattern(
        'Login Pattern',
        'Automates login process',
        sampleSteps
      );

      expect(pattern.id).toBeDefined();
      expect(pattern.name).toBe('Login Pattern');
      expect(pattern.description).toBe('Automates login process');
      expect(pattern.steps).toEqual(sampleSteps);
      expect(pattern.version).toBe('1.0.0');
      expect(pattern.created).toBeDefined();
    });

    test('should emit creation event', async () => {
      patternManager.clearEvents();
      
      const pattern = await patternManager.createPattern(
        'Test Pattern',
        'Test description',
        sampleSteps
      );

      const events = patternManager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('PATTERN_CREATED');
      expect(events[0].data.id).toBe(pattern.id);
      expect(events[0].data.name).toBe('Test Pattern');
    });

    test('should generate unique IDs', async () => {
      const pattern1 = await patternManager.createPattern('Pattern 1', 'Desc 1', sampleSteps);
      const pattern2 = await patternManager.createPattern('Pattern 2', 'Desc 2', sampleSteps);

      expect(pattern1.id).not.toBe(pattern2.id);
    });
  });

  describe('📖 Pattern Retrieval', () => {
    test('should retrieve pattern by ID', async () => {
      const created = await patternManager.createPattern('Test Pattern', 'Description', sampleSteps);
      const retrieved = patternManager.getPattern(created.id);

      expect(retrieved).toEqual(created);
    });

    test('should return null for non-existent pattern', () => {
      const result = patternManager.getPattern('non-existent-id');
      expect(result).toBeNull();
    });

    test('should get all patterns', async () => {
      const pattern1 = await patternManager.createPattern('Pattern 1', 'Desc 1', sampleSteps);
      const pattern2 = await patternManager.createPattern('Pattern 2', 'Desc 2', sampleSteps);

      const allPatterns = patternManager.getAllPatterns();
      expect(allPatterns).toHaveLength(2);
      
      // Check that both patterns are present (order may vary)
      const patternNames = allPatterns.map(p => p.name);
      expect(patternNames).toContain('Pattern 1');
      expect(patternNames).toContain('Pattern 2');
    });
  });

  describe('✏️ Pattern Updates', () => {
    test('should update existing pattern', async () => {
      const pattern = await patternManager.createPattern('Original', 'Original desc', sampleSteps);
      
      const updated = await patternManager.updatePattern(pattern.id, {
        name: 'Updated Name',
        description: 'Updated description'
      });

      expect(updated).not.toBeNull();
      expect(updated!.name).toBe('Updated Name');
      expect(updated!.description).toBe('Updated description');
      expect(updated!.id).toBe(pattern.id); // ID should remain the same
    });

    test('should emit update event', async () => {
      const pattern = await patternManager.createPattern('Test', 'Test desc', sampleSteps);
      patternManager.clearEvents();

      await patternManager.updatePattern(pattern.id, { name: 'Updated' });

      const events = patternManager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('PATTERN_UPDATED');
      expect(events[0].data.id).toBe(pattern.id);
    });

    test('should return null for non-existent pattern', async () => {
      const result = await patternManager.updatePattern('non-existent', { name: 'Updated' });
      expect(result).toBeNull();
    });
  });

  describe('🗑️ Pattern Deletion', () => {
    test('should delete existing pattern', async () => {
      const pattern = await patternManager.createPattern('To Delete', 'Will be deleted', sampleSteps);
      
      const deleted = await patternManager.deletePattern(pattern.id);
      expect(deleted).toBe(true);

      const retrieved = patternManager.getPattern(pattern.id);
      expect(retrieved).toBeNull();
    });

    test('should emit deletion event', async () => {
      const pattern = await patternManager.createPattern('Test', 'Test desc', sampleSteps);
      patternManager.clearEvents();

      await patternManager.deletePattern(pattern.id);

      const events = patternManager.getEvents();
      expect(events).toHaveLength(1);
      expect(events[0].type).toBe('PATTERN_DELETED');
      expect(events[0].data.id).toBe(pattern.id);
    });

    test('should return false for non-existent pattern', async () => {
      const result = await patternManager.deletePattern('non-existent');
      expect(result).toBe(false);
    });
  });

  describe('✅ Pattern Validation', () => {
    test('should validate complete pattern', async () => {
      const pattern = await patternManager.createPattern('Valid', 'Valid pattern', sampleSteps);
      const validation = patternManager.validatePattern(pattern);

      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidPattern: SimplePattern = {
        id: '',
        name: '',
        description: 'Has description',
        steps: [],
        created: '',
        version: ''
      };

      const validation = patternManager.validatePattern(invalidPattern);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('ID is required');
      expect(validation.errors).toContain('Name is required');
      expect(validation.errors).toContain('At least one step is required');
    });

    test('should validate step requirements', () => {
      const patternWithInvalidSteps: SimplePattern = {
        id: 'test',
        name: 'Test',
        description: 'Test',
        steps: [
          {
            id: '',
            type: 'click',
            selector: '',
            description: 'Invalid step',
            timeout: -1
          }
        ],
        created: '',
        version: ''
      };

      const validation = patternManager.validatePattern(patternWithInvalidSteps);

      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Step 1: ID is required');
      expect(validation.errors).toContain('Step 1: Selector is required');
      expect(validation.errors).toContain('Step 1: Timeout cannot be negative');
    });
  });

  describe('📤 Export/Import', () => {
    test('should export patterns to JSON', async () => {
      const pattern1 = await patternManager.createPattern('Pattern 1', 'Desc 1', sampleSteps);
      const pattern2 = await patternManager.createPattern('Pattern 2', 'Desc 2', sampleSteps);

      const exported = patternManager.exportPatterns([pattern1.id, pattern2.id]);
      const parsed = JSON.parse(exported);

      expect(parsed.version).toBe('1.0.0');
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.patterns).toHaveLength(2);
      
      // Check that both patterns are present (order may vary)
      const patternNames = parsed.patterns.map((p: any) => p.name);
      expect(patternNames).toContain('Pattern 1');
      expect(patternNames).toContain('Pattern 2');
    });

    test('should import valid patterns', async () => {
      const exportData = {
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        patterns: [
          {
            id: 'imported-1',
            name: 'Imported Pattern',
            description: 'Imported description',
            steps: sampleSteps,
            created: new Date().toISOString(),
            version: '1.0.0'
          }
        ]
      };

      const result = await patternManager.importPatterns(JSON.stringify(exportData));

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);

      const imported = patternManager.getPattern('imported-1');
      expect(imported).not.toBeNull();
      expect(imported!.name).toBe('Imported Pattern');
    });

    test('should handle import validation errors', async () => {
      const invalidData = {
        version: '1.0.0',
        patterns: [
          {
            id: '',  // Invalid: missing ID
            name: '',  // Invalid: missing name
            steps: []  // Invalid: no steps
          }
        ]
      };

      const result = await patternManager.importPatterns(JSON.stringify(invalidData));

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid pattern');
    });

    test('should skip duplicate patterns on import', async () => {
      // Create existing pattern
      const existing = await patternManager.createPattern('Existing', 'Exists', sampleSteps);

      const importData = {
        version: '1.0.0',
        patterns: [existing] // Try to import existing pattern
      };

      const result = await patternManager.importPatterns(JSON.stringify(importData));

      expect(result.imported).toBe(0);
      expect(result.skipped).toBe(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should handle malformed import data', async () => {
      const result = await patternManager.importPatterns('invalid json');

      expect(result.imported).toBe(0);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Import failed');
    });
  });

  describe('🔄 Event Tracking', () => {
    test('should track all pattern operations', async () => {
      patternManager.clearEvents();

      // Create
      const pattern = await patternManager.createPattern('Test', 'Test desc', sampleSteps);
      
      // Update
      await patternManager.updatePattern(pattern.id, { name: 'Updated' });
      
      // Delete
      await patternManager.deletePattern(pattern.id);

      const events = patternManager.getEvents();
      expect(events).toHaveLength(3);
      expect(events[0].type).toBe('PATTERN_CREATED');
      expect(events[1].type).toBe('PATTERN_UPDATED');
      expect(events[2].type).toBe('PATTERN_DELETED');
    });

    test('should clear events when requested', async () => {
      await patternManager.createPattern('Test', 'Test desc', sampleSteps);
      expect(patternManager.getEvents()).toHaveLength(1);

      patternManager.clearEvents();
      expect(patternManager.getEvents()).toHaveLength(0);
    });
  });
});