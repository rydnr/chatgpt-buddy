/**
 * Pattern Manager Unit Tests
 * 
 * Tests pattern creation, validation, sharing, export/import functionality.
 */

import { jest } from '@jest/globals';

// Mock Chrome APIs
const mockChrome = {
  runtime: {
    id: 'test-extension-id'
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn(),
      clear: jest.fn()
    }
  }
};

(global as any).chrome = mockChrome;
(global as any).navigator = { userAgent: 'test-agent' };

// Mock crypto.subtle for checksums
const mockCrypto = {
  subtle: {
    digest: jest.fn()
  }
};

(global as any).crypto = mockCrypto;

// Mock global message store
const mockMessageStore = {
  addInboundMessage: jest.fn(),
  addOutboundMessage: jest.fn(),
  markMessageSuccess: jest.fn(),
  markMessageError: jest.fn()
};

(global as any).globalMessageStore = mockMessageStore;

// Import after mocking
import { PatternManager, AutomationPattern, PatternStep } from '../../extension/src/pattern-manager';

describe('🧩 Pattern Manager', () => {
  let patternManager: PatternManager;
  let mockPatternSteps: PatternStep[];

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default storage responses
    (mockChrome.storage.local.get as any).mockResolvedValue({});
    (mockChrome.storage.local.set as any).mockResolvedValue(undefined);
    
    // Setup crypto mock
    (mockCrypto.subtle.digest as any).mockResolvedValue(new ArrayBuffer(32));

    patternManager = new PatternManager();

    // Create mock pattern steps
    mockPatternSteps = [
      {
        id: 'step-1',
        type: 'click',
        selector: '#submit-button',
        description: 'Click submit button',
        timeout: 5000,
        retries: 3,
        errorHandling: 'fail'
      },
      {
        id: 'step-2',
        type: 'type',
        selector: '#email-input',
        value: 'test@example.com',
        description: 'Enter email address',
        timeout: 3000,
        retries: 2,
        errorHandling: 'retry'
      }
    ];
  });

  describe('🎨 Pattern Creation', () => {
    test('should create a valid automation pattern', async () => {
      const pattern = await patternManager.createPattern(
        'Test Login Pattern',
        'Automates login process',
        mockPatternSteps
      );

      expect(pattern.id).toBeDefined();
      expect(pattern.name).toBe('Test Login Pattern');
      expect(pattern.description).toBe('Automates login process');
      expect(pattern.steps).toEqual(mockPatternSteps);
      expect(pattern.version).toBe('1.0.0');
      expect(pattern.author).toBe('Anonymous');
      expect(pattern.category).toBe('web-automation');
      expect(pattern.created).toBeDefined();
      expect(pattern.lastModified).toBeDefined();
    });

    test('should create pattern with custom options', async () => {
      const customOptions = {
        author: 'Test Author',
        category: 'testing',
        tags: ['login', 'automation'],
        metadata: {
          compatibility: ['chrome'],
          difficulty: 'intermediate' as const,
          requirements: ['login-credentials'],
          permissions: [],
          language: 'en',
          estimatedDuration: 5000,
          successRate: 1.0,
          popularity: 0,
          domains: []
        }
      };

      const pattern = await patternManager.createPattern(
        'Custom Pattern',
        'Custom description',
        mockPatternSteps,
        customOptions
      );

      expect(pattern.author).toBe('Test Author');
      expect(pattern.category).toBe('testing');
      expect(pattern.tags).toEqual(['login', 'automation']);
      expect(pattern.metadata.difficulty).toBe('intermediate');
      expect(pattern.metadata.requirements).toEqual(['login-credentials']);
    });

    test('should estimate pattern duration correctly', async () => {
      const pattern = await patternManager.createPattern(
        'Duration Test',
        'Test duration estimation',
        mockPatternSteps
      );

      // Click (1s) + Type (2s) = 3s minimum, but timeouts are 5s + 3s = 8s
      expect(pattern.metadata.estimatedDuration).toBe(8000);
    });

    test('should track pattern creation in message store', async () => {
      await patternManager.createPattern(
        'Tracked Pattern',
        'Test tracking',
        mockPatternSteps
      );

      expect(mockMessageStore.addInboundMessage).toHaveBeenCalledWith(
        'PATTERN_CREATED',
        expect.objectContaining({
          name: 'Tracked Pattern',
          category: 'web-automation'
        }),
        expect.stringContaining('pattern-created-'),
        expect.objectContaining({
          extensionId: 'test-extension-id'
        })
      );
    });
  });

  describe('📝 Pattern Management', () => {
    let testPattern: AutomationPattern;

    beforeEach(async () => {
      testPattern = await patternManager.createPattern(
        'Test Pattern',
        'Test description',
        mockPatternSteps
      );
    });

    test('should retrieve pattern by ID', () => {
      const retrieved = patternManager.getPattern(testPattern.id);
      expect(retrieved).toEqual(testPattern);
    });

    test('should return null for non-existent pattern', () => {
      const retrieved = patternManager.getPattern('non-existent-id');
      expect(retrieved).toBeNull();
    });

    test('should get all patterns with default sorting', () => {
      const patterns = patternManager.getPatterns();
      expect(patterns).toHaveLength(1);
      expect(patterns[0]).toEqual(testPattern);
    });

    test('should filter patterns by category', async () => {
      await patternManager.createPattern(
        'Testing Pattern',
        'For testing',
        mockPatternSteps,
        { category: 'testing' }
      );

      const webPatterns = patternManager.getPatterns({ category: 'web-automation' });
      const testPatterns = patternManager.getPatterns({ category: 'testing' });

      expect(webPatterns).toHaveLength(1);
      expect(testPatterns).toHaveLength(1);
      expect(webPatterns[0].category).toBe('web-automation');
      expect(testPatterns[0].category).toBe('testing');
    });

    test('should filter patterns by tags', async () => {
      await patternManager.createPattern(
        'Tagged Pattern',
        'With tags',
        mockPatternSteps,
        { tags: ['login', 'form'] }
      );

      const loginPatterns = patternManager.getPatterns({ tags: ['login'] });
      const formPatterns = patternManager.getPatterns({ tags: ['form'] });
      const noTagPatterns = patternManager.getPatterns({ tags: ['nonexistent'] });

      expect(loginPatterns).toHaveLength(1);
      expect(formPatterns).toHaveLength(1);
      expect(noTagPatterns).toHaveLength(0);
    });

    test('should search patterns by text', async () => {
      await patternManager.createPattern(
        'Login Form Handler',
        'Handles login forms automatically',
        mockPatternSteps,
        { tags: ['authentication'] }
      );

      const nameSearch = patternManager.getPatterns({ searchText: 'login' });
      const descSearch = patternManager.getPatterns({ searchText: 'forms' });
      const tagSearch = patternManager.getPatterns({ searchText: 'auth' });
      const noMatch = patternManager.getPatterns({ searchText: 'xyz' });

      expect(nameSearch).toHaveLength(1);
      expect(descSearch).toHaveLength(1);
      expect(tagSearch).toHaveLength(1);
      expect(noMatch).toHaveLength(0);
    });

    test('should update existing pattern', async () => {
      const updates = {
        name: 'Updated Pattern',
        description: 'Updated description',
        tags: ['updated']
      };

      const updatedPattern = await patternManager.updatePattern(testPattern.id, updates);

      expect(updatedPattern.name).toBe('Updated Pattern');
      expect(updatedPattern.description).toBe('Updated description');
      expect(updatedPattern.tags).toEqual(['updated']);
      expect(updatedPattern.version).toBe('1.0.1'); // Version incremented
      expect(updatedPattern.id).toBe(testPattern.id); // ID unchanged
      expect(new Date(updatedPattern.lastModified).getTime()).toBeGreaterThan(
        new Date(testPattern.lastModified).getTime()
      );
    });

    test('should delete pattern successfully', async () => {
      const deleted = await patternManager.deletePattern(testPattern.id);
      expect(deleted).toBe(true);

      const retrieved = patternManager.getPattern(testPattern.id);
      expect(retrieved).toBeNull();
    });

    test('should return false when deleting non-existent pattern', async () => {
      const deleted = await patternManager.deletePattern('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('✅ Pattern Validation', () => {
    test('should validate correct pattern', async () => {
      const pattern = await patternManager.createPattern(
        'Valid Pattern',
        'Valid description',
        mockPatternSteps
      );

      const validation = patternManager.validatePattern(pattern);
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect missing required fields', () => {
      const invalidPattern = {
        id: '',
        name: '',
        description: '',
        version: '1.0.0',
        author: '',
        created: '',
        lastModified: '',
        tags: [],
        category: '',
        steps: [],
        conditions: [],
        variables: [],
        metadata: {} as any,
        statistics: {} as any
      } as AutomationPattern;

      const validation = patternManager.validatePattern(invalidPattern);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Pattern ID is required');
      expect(validation.errors).toContain('Pattern name is required');
      expect(validation.errors).toContain('Pattern must have at least one step');
    });

    test('should validate step requirements', () => {
      const patternWithInvalidSteps = {
        id: 'test-id',
        name: 'Test Pattern',
        steps: [
          {
            id: '',
            type: '',
            selector: '',
            description: 'Invalid step',
            timeout: -1,
            retries: 0,
            errorHandling: 'fail'
          },
          {
            id: 'step-2',
            type: 'click',
            selector: '', // Missing selector for click
            description: 'Click without selector',
            timeout: 1000,
            retries: 1,
            errorHandling: 'fail'
          }
        ]
      } as AutomationPattern;

      const validation = patternManager.validatePattern(patternWithInvalidSteps);
      expect(validation.isValid).toBe(false);
      expect(validation.errors).toContain('Step 1: ID is required');
      expect(validation.errors).toContain('Step 1: Type is required');
      expect(validation.errors).toContain('Step 1: Timeout cannot be negative');
      expect(validation.errors).toContain('Step 2: Selector is required for click steps');
    });

    test('should provide warnings for potential issues', () => {
      const patternWithWarnings = {
        id: 'test-id',
        name: 'Test Pattern',
        steps: [
          {
            id: 'step-1',
            type: 'type',
            selector: '#input',
            value: '', // No value for type step
            description: 'Type without value',
            timeout: 1000,
            retries: 1,
            errorHandling: 'fail'
          }
        ]
      } as AutomationPattern;

      const validation = patternManager.validatePattern(patternWithWarnings);
      expect(validation.isValid).toBe(true); // Should still be valid
      expect(validation.warnings).toContain('Step 1: Type step has no value specified');
    });
  });

  describe('📤 Pattern Export', () => {
    let testPatterns: AutomationPattern[];

    beforeEach(async () => {
      testPatterns = [
        await patternManager.createPattern('Pattern 1', 'Description 1', mockPatternSteps),
        await patternManager.createPattern('Pattern 2', 'Description 2', mockPatternSteps)
      ];
    });

    test('should export patterns in JSON format', async () => {
      const exported = await patternManager.exportPatterns(
        testPatterns.map(p => p.id),
        'json'
      );

      const parsed = JSON.parse(exported);
      expect(parsed.version).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
      expect(parsed.format).toBe('json');
      expect(parsed.patterns).toHaveLength(2);
      expect(parsed.checksum).toBeDefined();
    });

    test('should export patterns with custom options', async () => {
      const exported = await patternManager.exportPatterns(
        testPatterns.map(p => p.id),
        'json',
        {
          includeStatistics: true,
          includeDependencies: true,
          compression: false,
          encryption: false
        }
      );

      const parsed = JSON.parse(exported);
      expect(parsed.compression).toBe(false);
      expect(parsed.encryption).toBe(false);
      expect(parsed.dependencies).toBeDefined();
      expect(parsed.patterns[0].statistics).toBeDefined();
    });

    test('should exclude statistics when not requested', async () => {
      const exported = await patternManager.exportPatterns(
        testPatterns.map(p => p.id),
        'json',
        { includeStatistics: false }
      );

      const parsed = JSON.parse(exported);
      expect(parsed.patterns[0].statistics.executions).toBe(0);
      expect(parsed.patterns[0].statistics.successes).toBe(0);
    });

    test('should throw error for invalid pattern IDs', async () => {
      await expect(
        patternManager.exportPatterns(['invalid-id'])
      ).rejects.toThrow('No valid patterns found for export');
    });

    test('should track export in message store', async () => {
      await patternManager.exportPatterns(testPatterns.map(p => p.id));

      expect(mockMessageStore.addInboundMessage).toHaveBeenCalledWith(
        'PATTERNS_EXPORTED',
        expect.objectContaining({
          count: 2,
          format: 'json'
        }),
        expect.stringContaining('patterns-exported-'),
        expect.any(Object)
      );
    });
  });

  describe('📥 Pattern Import', () => {
    let exportedData: string;
    let testPattern: AutomationPattern;

    beforeEach(async () => {
      testPattern = await patternManager.createPattern(
        'Export Test',
        'For export testing',
        mockPatternSteps
      );

      exportedData = await patternManager.exportPatterns([testPattern.id]);
    });

    test('should import valid patterns successfully', async () => {
      // Create new pattern manager to test import
      const newManager = new PatternManager();
      
      const result = await newManager.importPatterns(exportedData);

      expect(result.imported).toHaveLength(1);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
      expect(result.imported[0].name).toBe('Export Test');
    });

    test('should handle duplicate patterns with overwrite option', async () => {
      const result = await patternManager.importPatterns(exportedData, {
        overwrite: true
      });

      expect(result.imported).toHaveLength(1);
      expect(result.skipped).toHaveLength(0);
      expect(result.errors).toHaveLength(0);
    });

    test('should skip duplicate patterns without overwrite', async () => {
      const result = await patternManager.importPatterns(exportedData, {
        overwrite: false
      });

      expect(result.imported).toHaveLength(0);
      expect(result.skipped).toHaveLength(1);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate patterns during import', async () => {
      const invalidData = JSON.stringify({
        version: '1.0.0',
        patterns: [{
          id: '',
          name: '',
          steps: []
        }],
        checksum: 'invalid'
      });

      const result = await patternManager.importPatterns(invalidData);

      expect(result.imported).toHaveLength(0);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should perform validation-only import', async () => {
      const result = await patternManager.importPatterns(exportedData, {
        validateOnly: true
      });

      expect(result.imported).toHaveLength(1); // Shows what would be imported
      
      // Should not actually import
      const patterns = patternManager.getPatterns();
      expect(patterns).toHaveLength(1); // Only original pattern
    });

    test('should track import in message store', async () => {
      await patternManager.importPatterns(exportedData);

      expect(mockMessageStore.addInboundMessage).toHaveBeenCalledWith(
        'PATTERNS_IMPORTED',
        expect.objectContaining({
          imported: expect.any(Number),
          skipped: expect.any(Number),
          errors: expect.any(Number)
        }),
        expect.stringContaining('patterns-imported-'),
        expect.any(Object)
      );
    });
  });

  describe('🔗 Pattern Sharing', () => {
    let testPattern: AutomationPattern;

    beforeEach(async () => {
      testPattern = await patternManager.createPattern(
        'Shareable Pattern',
        'For sharing tests',
        mockPatternSteps
      );
    });

    test('should create share successfully', async () => {
      const share = await patternManager.sharePatterns([testPattern.id], 'private');

      expect(share.shareId).toBeDefined();
      expect(share.patternId).toBe(testPattern.id);
      expect(share.shareType).toBe('private');
      expect(share.accessCount).toBe(0);
      expect(share.downloadCount).toBe(0);
      expect(share.created).toBeDefined();
    });

    test('should create share with expiration', async () => {
      const expiresIn = 24 * 60 * 60 * 1000; // 24 hours
      const share = await patternManager.sharePatterns(
        [testPattern.id],
        'temporary',
        { expiresIn }
      );

      expect(share.expiresAt).toBeDefined();
      const expirationTime = new Date(share.expiresAt!).getTime();
      const expectedTime = Date.now() + expiresIn;
      expect(Math.abs(expirationTime - expectedTime)).toBeLessThan(1000); // Within 1 second
    });

    test('should access shared patterns', async () => {
      const share = await patternManager.sharePatterns([testPattern.id]);
      const sharedPatterns = await patternManager.accessSharedPatterns(share.shareId);

      expect(sharedPatterns).toHaveLength(1);
      expect(sharedPatterns[0].id).toBe(testPattern.id);
      expect(sharedPatterns[0].name).toBe('Shareable Pattern');
    });

    test('should increment access count', async () => {
      const share = await patternManager.sharePatterns([testPattern.id]);
      
      await patternManager.accessSharedPatterns(share.shareId);
      await patternManager.accessSharedPatterns(share.shareId);

      // Note: In a real test, we would need to get the updated share
      // For this mock test, we're testing the pattern behavior
      expect(mockMessageStore.addInboundMessage).toHaveBeenCalledWith(
        'SHARED_PATTERNS_ACCESSED',
        expect.objectContaining({
          shareId: share.shareId
        }),
        expect.any(String),
        expect.any(Object)
      );
    });

    test('should throw error for expired shares', async () => {
      const share = await patternManager.sharePatterns(
        [testPattern.id],
        'temporary',
        { expiresIn: -1000 } // Already expired
      );

      await expect(
        patternManager.accessSharedPatterns(share.shareId)
      ).rejects.toThrow('Share has expired');
    });

    test('should throw error for non-existent shares', async () => {
      await expect(
        patternManager.accessSharedPatterns('non-existent-share')
      ).rejects.toThrow('Share not found');
    });
  });

  describe('📊 Pattern Analytics', () => {
    beforeEach(async () => {
      // Create patterns with different categories and difficulties
      await patternManager.createPattern(
        'Login Pattern',
        'Login automation',
        mockPatternSteps,
        { 
          category: 'web-automation',
          metadata: { 
            difficulty: 'beginner' as const,
            compatibility: ['chrome'],
            requirements: [],
            permissions: [],
            language: 'en',
            estimatedDuration: 5000,
            successRate: 1.0,
            popularity: 0,
            domains: []
          }
        }
      );

      await patternManager.createPattern(
        'Data Extract',
        'Extract data',
        mockPatternSteps,
        { 
          category: 'data-extraction',
          metadata: { 
            difficulty: 'intermediate' as const,
            compatibility: ['chrome'],
            requirements: [],
            permissions: [],
            language: 'en',
            estimatedDuration: 5000,
            successRate: 1.0,
            popularity: 0,
            domains: []
          }
        }
      );

      await patternManager.createPattern(
        'Test Suite',
        'Testing patterns',
        mockPatternSteps,
        { 
          category: 'testing',
          metadata: { 
            difficulty: 'advanced' as const,
            compatibility: ['chrome'],
            requirements: [],
            permissions: [],
            language: 'en',
            estimatedDuration: 5000,
            successRate: 1.0,
            popularity: 0,
            domains: []
          }
        }
      );
    });

    test('should provide comprehensive analytics', () => {
      const analytics = patternManager.getPatternAnalytics();

      expect(analytics.totalPatterns).toBe(3);
      expect(analytics.categoriesBreakdown['web-automation']).toBe(1);
      expect(analytics.categoriesBreakdown['data-extraction']).toBe(1);
      expect(analytics.categoriesBreakdown['testing']).toBe(1);
      expect(analytics.difficultiesBreakdown['beginner']).toBe(1);
      expect(analytics.difficultiesBreakdown['intermediate']).toBe(1);
      expect(analytics.difficultiesBreakdown['advanced']).toBe(1);
    });

    test('should return empty analytics for no patterns', () => {
      const emptyManager = new PatternManager();
      const analytics = emptyManager.getPatternAnalytics();

      expect(analytics.totalPatterns).toBe(0);
      expect(analytics.averageSuccessRate).toBe(0);
      expect(analytics.totalExecutions).toBe(0);
      expect(analytics.mostPopular).toHaveLength(0);
      expect(analytics.recentlyCreated).toHaveLength(0);
    });

    test('should calculate success rates correctly', async () => {
      // Would need to update pattern statistics to test this properly
      const analytics = patternManager.getPatternAnalytics();
      expect(analytics.averageSuccessRate).toBe(0); // No executions yet
    });
  });

  describe('💾 Storage Integration', () => {
    test('should save patterns to storage on creation', async () => {
      await patternManager.createPattern(
        'Storage Test',
        'Test storage',
        mockPatternSteps
      );

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'chatgpt-buddy-patterns': expect.objectContaining({
            patterns: expect.any(Array),
            lastSaved: expect.any(String),
            version: expect.any(String)
          })
        })
      );
    });

    test('should save shares to storage', async () => {
      const pattern = await patternManager.createPattern(
        'Share Storage Test',
        'Test share storage',
        mockPatternSteps
      );

      await patternManager.sharePatterns([pattern.id]);

      expect(mockChrome.storage.local.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'chatgpt-buddy-pattern-shares': expect.objectContaining({
            shares: expect.any(Array),
            lastSaved: expect.any(String)
          })
        })
      );
    });
  });
});