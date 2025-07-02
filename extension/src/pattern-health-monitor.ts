/**
 * Pattern Health & Validation System
 * 
 * Provides comprehensive pattern validation, health monitoring, quality assurance,
 * and automated testing for automation patterns.
 */

import { globalPatternManager, AutomationPattern, PatternStep, PatternCondition } from './pattern-manager';
import { globalAdvancedTrainingManager } from './advanced-training';
import { globalMessageStore } from './message-store';
import { globalPerformanceOptimizer } from './performance-optimizer';

export interface PatternHealthReport {
  id: string;
  patternId: string;
  patternName: string;
  generatedAt: string;
  overallHealth: HealthScore;
  healthChecks: HealthCheck[];
  performanceMetrics: PatternPerformanceMetrics;
  reliabilityScore: number;
  maintainabilityScore: number;
  recommendations: HealthRecommendation[];
  riskAssessment: RiskAssessment;
}

export interface HealthCheck {
  id: string;
  name: string;
  category: HealthCategory;
  status: 'passed' | 'warning' | 'failed' | 'skipped';
  message: string;
  details?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  autoFixable: boolean;
  suggestedFix?: string;
}

export type HealthCategory = 
  | 'syntax'
  | 'semantics'
  | 'performance'
  | 'reliability'
  | 'maintainability'
  | 'security'
  | 'compatibility'
  | 'best-practices';

export interface HealthScore {
  overall: number; // 0-100
  syntax: number;
  semantics: number;
  performance: number;
  reliability: number;
  maintainability: number;
  security: number;
  compatibility: number;
  'best-practices': number;
}

export interface PatternPerformanceMetrics {
  estimatedExecutionTime: number;
  complexityScore: number;
  selectorReliability: number;
  errorProneness: number;
  resourceUsage: number;
  parallelizability: number;
}

export interface HealthRecommendation {
  type: 'optimization' | 'fix' | 'enhancement' | 'warning';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  effort: 'low' | 'medium' | 'high';
  suggestedAction: string;
  codeExample?: string;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  risks: Risk[];
  mitigationStrategies: string[];
}

export interface Risk {
  type: 'performance' | 'reliability' | 'security' | 'compatibility' | 'maintenance';
  level: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  likelihood: number; // 0-1
  impact: number; // 0-1
  mitigation: string;
}

export interface ValidationRule {
  id: string;
  name: string;
  category: HealthCategory;
  severity: 'low' | 'medium' | 'high' | 'critical';
  validator: (pattern: AutomationPattern) => ValidationResult;
  autoFix?: (pattern: AutomationPattern) => AutomationPattern;
}

export interface ValidationResult {
  passed: boolean;
  message: string;
  details?: string;
  suggestedFix?: string;
}

export interface PatternTestSuite {
  id: string;
  patternId: string;
  name: string;
  description: string;
  testCases: PatternTestCase[];
  coverage: TestCoverage;
  results?: TestSuiteResults;
}

export interface PatternTestCase {
  id: string;
  name: string;
  description: string;
  type: 'unit' | 'integration' | 'performance' | 'stress' | 'compatibility';
  preconditions: TestPrecondition[];
  expectedOutcome: ExpectedOutcome;
  timeout: number;
  retries: number;
}

export interface TestPrecondition {
  type: 'url' | 'element' | 'data' | 'state';
  condition: string;
  value: any;
}

export interface ExpectedOutcome {
  type: 'success' | 'element-found' | 'data-extracted' | 'navigation' | 'error';
  criteria: any;
  tolerance?: number;
}

export interface TestCoverage {
  stepCoverage: number; // 0-1
  conditionCoverage: number; // 0-1
  errorPathCoverage: number; // 0-1
  overallCoverage: number; // 0-1
}

export interface TestSuiteResults {
  executedAt: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  executionTime: number;
  results: TestCaseResult[];
}

export interface TestCaseResult {
  testCaseId: string;
  status: 'passed' | 'failed' | 'skipped' | 'timeout';
  executionTime: number;
  error?: string;
  actualOutcome?: any;
  logs: string[];
}

export class PatternHealthMonitor {
  private validationRules: Map<string, ValidationRule> = new Map();
  private healthReports: Map<string, PatternHealthReport> = new Map();
  private testSuites: Map<string, PatternTestSuite> = new Map();
  private readonly STORAGE_KEY = 'pattern-health-reports';
  private readonly TEST_SUITES_KEY = 'pattern-test-suites';

  constructor() {
    this.initializeValidationRules();
    this.loadHealthReports();
    this.loadTestSuites();
  }

  /**
   * Perform comprehensive health check on a pattern
   */
  async performHealthCheck(patternId: string): Promise<PatternHealthReport> {
    const pattern = globalPatternManager.getPattern(patternId);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    const healthChecks: HealthCheck[] = [];
    const performanceMetrics = this.calculatePerformanceMetrics(pattern);
    
    // Run all validation rules
    for (const rule of this.validationRules.values()) {
      const result = await this.runValidationRule(rule, pattern);
      healthChecks.push(result);
    }

    // Calculate health scores
    const healthScore = this.calculateHealthScore(healthChecks);
    const reliabilityScore = this.calculateReliabilityScore(pattern, healthChecks);
    const maintainabilityScore = this.calculateMaintainabilityScore(pattern, healthChecks);

    // Generate recommendations
    const recommendations = this.generateRecommendations(pattern, healthChecks, performanceMetrics);
    
    // Assess risks
    const riskAssessment = this.assessRisks(pattern, healthChecks, performanceMetrics);

    const report: PatternHealthReport = {
      id: this.generateReportId(),
      patternId,
      patternName: pattern.name,
      generatedAt: new Date().toISOString(),
      overallHealth: healthScore,
      healthChecks,
      performanceMetrics,
      reliabilityScore,
      maintainabilityScore,
      recommendations,
      riskAssessment
    };

    this.healthReports.set(report.id, report);
    await this.saveHealthReports();

    // Track health check
    globalMessageStore.addInboundMessage(
      'PATTERN_HEALTH_CHECK_COMPLETED',
      { 
        patternId, 
        reportId: report.id, 
        overallScore: healthScore.overall,
        riskLevel: riskAssessment.overallRisk
      },
      `health-check-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    console.log(`🏥 Health check completed for pattern: ${pattern.name} (Score: ${healthScore.overall})`);
    return report;
  }

  /**
   * Create automated test suite for a pattern
   */
  async createPatternTestSuite(
    patternId: string,
    testCases: PatternTestCase[]
  ): Promise<PatternTestSuite> {
    const pattern = globalPatternManager.getPattern(patternId);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    const testSuite: PatternTestSuite = {
      id: this.generateTestSuiteId(),
      patternId,
      name: `${pattern.name} Test Suite`,
      description: `Automated test suite for ${pattern.name}`,
      testCases,
      coverage: this.calculateTestCoverage(pattern, testCases)
    };

    this.testSuites.set(testSuite.id, testSuite);
    await this.saveTestSuites();

    console.log(`🧪 Created test suite for pattern: ${pattern.name} (${testCases.length} tests)`);
    return testSuite;
  }

  /**
   * Execute pattern test suite
   */
  async executeTestSuite(testSuiteId: string): Promise<TestSuiteResults> {
    const testSuite = this.testSuites.get(testSuiteId);
    if (!testSuite) {
      throw new Error(`Test suite not found: ${testSuiteId}`);
    }

    const startTime = Date.now();
    const results: TestCaseResult[] = [];
    let passed = 0;
    let failed = 0;
    let skipped = 0;

    console.log(`🧪 Executing test suite: ${testSuite.name}`);

    for (const testCase of testSuite.testCases) {
      try {
        const result = await this.executeTestCase(testCase, testSuite.patternId);
        results.push(result);

        switch (result.status) {
          case 'passed':
            passed++;
            break;
          case 'failed':
            failed++;
            break;
          case 'skipped':
            skipped++;
            break;
        }
      } catch (error) {
        results.push({
          testCaseId: testCase.id,
          status: 'failed',
          executionTime: 0,
          error: String(error),
          logs: [`Test execution failed: ${error}`]
        });
        failed++;
      }
    }

    const testResults: TestSuiteResults = {
      executedAt: new Date().toISOString(),
      totalTests: testSuite.testCases.length,
      passed,
      failed,
      skipped,
      executionTime: Date.now() - startTime,
      results
    };

    // Update test suite with results
    testSuite.results = testResults;
    this.testSuites.set(testSuiteId, testSuite);
    await this.saveTestSuites();

    // Track test execution
    globalMessageStore.addInboundMessage(
      'PATTERN_TEST_SUITE_EXECUTED',
      { 
        testSuiteId, 
        patternId: testSuite.patternId,
        totalTests: testResults.totalTests,
        passed: testResults.passed,
        failed: testResults.failed,
        executionTime: testResults.executionTime
      },
      `test-suite-${Date.now()}`,
      { extensionId: chrome.runtime.id, userAgent: navigator.userAgent }
    );

    console.log(`🧪 Test suite completed: ${passed}/${testResults.totalTests} passed`);
    return testResults;
  }

  /**
   * Auto-fix pattern issues where possible
   */
  async autoFixPattern(patternId: string): Promise<{ fixed: boolean; changes: string[] }> {
    const pattern = globalPatternManager.getPattern(patternId);
    if (!pattern) {
      throw new Error(`Pattern not found: ${patternId}`);
    }

    let fixedPattern = { ...pattern };
    const changes: string[] = [];

    // Apply auto-fixes from validation rules
    for (const rule of this.validationRules.values()) {
      if (rule.autoFix) {
        const result = rule.validator(fixedPattern);
        if (!result.passed) {
          try {
            const beforePattern = JSON.stringify(fixedPattern);
            fixedPattern = rule.autoFix(fixedPattern);
            const afterPattern = JSON.stringify(fixedPattern);
            
            if (beforePattern !== afterPattern) {
              changes.push(`Applied auto-fix for rule: ${rule.name}`);
            }
          } catch (error) {
            console.warn(`Auto-fix failed for rule ${rule.name}:`, error);
          }
        }
      }
    }

    if (changes.length > 0) {
      await globalPatternManager.updatePattern(patternId, fixedPattern);
      
      console.log(`🔧 Auto-fixed pattern: ${pattern.name} (${changes.length} changes)`);
      return { fixed: true, changes };
    }

    return { fixed: false, changes: [] };
  }

  /**
   * Get health report for a pattern
   */
  getPatternHealthReport(patternId: string): PatternHealthReport | null {
    for (const report of this.healthReports.values()) {
      if (report.patternId === patternId) {
        return report;
      }
    }
    return null;
  }

  /**
   * Get all health reports
   */
  getAllHealthReports(): PatternHealthReport[] {
    return Array.from(this.healthReports.values())
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime());
  }

  /**
   * Get test suite for a pattern
   */
  getPatternTestSuite(patternId: string): PatternTestSuite | null {
    for (const testSuite of this.testSuites.values()) {
      if (testSuite.patternId === patternId) {
        return testSuite;
      }
    }
    return null;
  }

  /**
   * Initialize validation rules
   */
  private initializeValidationRules(): void {
    // Syntax validation rules
    this.addValidationRule({
      id: 'required-fields',
      name: 'Required Fields Check',
      category: 'syntax',
      severity: 'critical',
      validator: (pattern) => {
        const missing: string[] = [];
        if (!pattern.id) missing.push('id');
        if (!pattern.name) missing.push('name');
        if (!pattern.steps || pattern.steps.length === 0) missing.push('steps');
        
        return {
          passed: missing.length === 0,
          message: missing.length === 0 ? 'All required fields present' : `Missing required fields: ${missing.join(', ')}`,
          suggestedFix: missing.length > 0 ? 'Add missing required fields to the pattern' : undefined
        };
      }
    });

    this.addValidationRule({
      id: 'selector-quality',
      name: 'Selector Quality Check',
      category: 'reliability',
      severity: 'high',
      validator: (pattern) => {
        const weakSelectors: string[] = [];
        const strongIndicators = ['data-testid', 'id', 'aria-label', 'role'];
        const weakIndicators = ['class', 'nth-child', 'absolute-position'];
        
        for (const step of pattern.steps) {
          if (step.selector) {
            const hasStrong = strongIndicators.some(indicator => step.selector.includes(indicator));
            const hasWeak = weakIndicators.some(indicator => step.selector.includes(indicator));
            
            if (hasWeak && !hasStrong) {
              weakSelectors.push(`Step ${step.id}: ${step.selector}`);
            }
          }
        }
        
        return {
          passed: weakSelectors.length === 0,
          message: weakSelectors.length === 0 ? 'All selectors are robust' : `Found ${weakSelectors.length} potentially fragile selectors`,
          details: weakSelectors.length > 0 ? weakSelectors.join('\n') : undefined,
          suggestedFix: 'Use data-testid, id, or semantic attributes for more reliable selectors'
        };
      }
    });

    this.addValidationRule({
      id: 'timeout-validation',
      name: 'Timeout Configuration Check',
      category: 'performance',
      severity: 'medium',
      validator: (pattern) => {
        const issues: string[] = [];
        
        for (const step of pattern.steps) {
          if (step.timeout < 1000) {
            issues.push(`Step ${step.id}: timeout too low (${step.timeout}ms)`);
          } else if (step.timeout > 30000) {
            issues.push(`Step ${step.id}: timeout too high (${step.timeout}ms)`);
          }
        }
        
        return {
          passed: issues.length === 0,
          message: issues.length === 0 ? 'All timeouts are reasonable' : `Found ${issues.length} timeout issues`,
          details: issues.join('\n'),
          suggestedFix: 'Use timeouts between 1-30 seconds based on expected operation duration'
        };
      },
      autoFix: (pattern) => {
        const fixed = { ...pattern };
        fixed.steps = pattern.steps.map(step => ({
          ...step,
          timeout: Math.max(1000, Math.min(30000, step.timeout))
        }));
        return fixed;
      }
    });

    this.addValidationRule({
      id: 'error-handling',
      name: 'Error Handling Strategy Check',
      category: 'reliability',
      severity: 'medium',
      validator: (pattern) => {
        const missingErrorHandling = pattern.steps.filter(step => !step.errorHandling);
        
        return {
          passed: missingErrorHandling.length === 0,
          message: missingErrorHandling.length === 0 ? 'All steps have error handling' : `${missingErrorHandling.length} steps missing error handling`,
          suggestedFix: 'Add error handling strategy (fail/continue/retry) to all steps'
        };
      },
      autoFix: (pattern) => {
        const fixed = { ...pattern };
        fixed.steps = pattern.steps.map(step => ({
          ...step,
          errorHandling: step.errorHandling || 'retry'
        }));
        return fixed;
      }
    });

    this.addValidationRule({
      id: 'step-descriptions',
      name: 'Step Documentation Check',
      category: 'maintainability',
      severity: 'low',
      validator: (pattern) => {
        const undocumented = pattern.steps.filter(step => !step.description || step.description.trim().length < 5);
        
        return {
          passed: undocumented.length === 0,
          message: undocumented.length === 0 ? 'All steps are documented' : `${undocumented.length} steps lack proper documentation`,
          suggestedFix: 'Add descriptive documentation to all steps'
        };
      }
    });

    this.addValidationRule({
      id: 'security-sensitive-data',
      name: 'Sensitive Data Check',
      category: 'security',
      severity: 'critical',
      validator: (pattern) => {
        const sensitivePatterns = /password|secret|token|key|credential/i;
        const issues: string[] = [];
        
        for (const step of pattern.steps) {
          if (step.value && sensitivePatterns.test(step.value)) {
            issues.push(`Step ${step.id}: contains potentially sensitive data`);
          }
        }
        
        return {
          passed: issues.length === 0,
          message: issues.length === 0 ? 'No sensitive data detected' : `Found ${issues.length} potential security issues`,
          details: issues.join('\n'),
          suggestedFix: 'Use variables or secure storage for sensitive data instead of hardcoding'
        };
      }
    });

    console.log(`🔍 Initialized ${this.validationRules.size} validation rules`);
  }

  /**
   * Add validation rule
   */
  private addValidationRule(rule: ValidationRule): void {
    this.validationRules.set(rule.id, rule);
  }

  /**
   * Run validation rule against pattern
   */
  private async runValidationRule(rule: ValidationRule, pattern: AutomationPattern): Promise<HealthCheck> {
    try {
      const result = await globalPerformanceOptimizer.timeExecution(
        () => rule.validator(pattern),
        'messageProcessingTime'
      );

      return {
        id: `${rule.id}-${Date.now()}`,
        name: rule.name,
        category: rule.category,
        status: result.passed ? 'passed' : 'failed',
        message: result.message,
        details: result.details,
        severity: rule.severity,
        autoFixable: !!rule.autoFix,
        suggestedFix: result.suggestedFix
      };
    } catch (error) {
      return {
        id: `${rule.id}-${Date.now()}`,
        name: rule.name,
        category: rule.category,
        status: 'failed',
        message: `Validation rule failed: ${error}`,
        severity: 'medium',
        autoFixable: false
      };
    }
  }

  /**
   * Calculate health score from health checks
   */
  private calculateHealthScore(healthChecks: HealthCheck[]): HealthScore {
    const scoreByCategory: Record<HealthCategory, number> = {
      syntax: 0,
      semantics: 0,
      performance: 0,
      reliability: 0,
      maintainability: 0,
      security: 0,
      compatibility: 0,
      'best-practices': 0
    };

    const countByCategory: Record<HealthCategory, number> = {
      syntax: 0,
      semantics: 0,
      performance: 0,
      reliability: 0,
      maintainability: 0,
      security: 0,
      compatibility: 0,
      'best-practices': 0
    };

    // Calculate scores per category
    for (const check of healthChecks) {
      countByCategory[check.category]++;
      
      let score = 0;
      switch (check.status) {
        case 'passed':
          score = 100;
          break;
        case 'warning':
          score = 70;
          break;
        case 'failed':
          score = check.severity === 'critical' ? 0 : check.severity === 'high' ? 20 : 50;
          break;
        case 'skipped':
          score = 50;
          break;
      }
      
      scoreByCategory[check.category] += score;
    }

    // Average scores
    const averageScores: HealthScore = {
      syntax: countByCategory.syntax > 0 ? scoreByCategory.syntax / countByCategory.syntax : 100,
      semantics: countByCategory.semantics > 0 ? scoreByCategory.semantics / countByCategory.semantics : 100,
      performance: countByCategory.performance > 0 ? scoreByCategory.performance / countByCategory.performance : 100,
      reliability: countByCategory.reliability > 0 ? scoreByCategory.reliability / countByCategory.reliability : 100,
      maintainability: countByCategory.maintainability > 0 ? scoreByCategory.maintainability / countByCategory.maintainability : 100,
      security: countByCategory.security > 0 ? scoreByCategory.security / countByCategory.security : 100,
      compatibility: countByCategory.compatibility > 0 ? scoreByCategory.compatibility / countByCategory.compatibility : 100,
      'best-practices': countByCategory['best-practices'] > 0 ? scoreByCategory['best-practices'] / countByCategory['best-practices'] : 100,
      overall: 0
    };

    // Calculate weighted overall score
    averageScores.overall = (
      averageScores.syntax * 0.2 +
      averageScores.reliability * 0.2 +
      averageScores.performance * 0.15 +
      averageScores.security * 0.15 +
      averageScores.maintainability * 0.1 +
      averageScores.semantics * 0.1 +
      averageScores.compatibility * 0.05 +
      averageScores['best-practices'] * 0.05
    );

    return averageScores;
  }

  /**
   * Calculate performance metrics for pattern
   */
  private calculatePerformanceMetrics(pattern: AutomationPattern): PatternPerformanceMetrics {
    const estimatedExecutionTime = pattern.steps.reduce((total, step) => {
      return total + Math.max(step.timeout || 5000, 1000);
    }, 0);

    const complexityScore = this.calculateComplexityScore(pattern);
    const selectorReliability = this.calculateSelectorReliability(pattern);
    const errorProneness = this.calculateErrorProneness(pattern);
    const resourceUsage = this.calculateResourceUsage(pattern);
    const parallelizability = this.calculateParallelizability(pattern);

    return {
      estimatedExecutionTime,
      complexityScore,
      selectorReliability,
      errorProneness,
      resourceUsage,
      parallelizability
    };
  }

  /**
   * Calculate complexity score
   */
  private calculateComplexityScore(pattern: AutomationPattern): number {
    let complexity = pattern.steps.length;
    
    // Add complexity for conditions
    complexity += pattern.conditions.length * 2;
    
    // Add complexity for variables
    complexity += pattern.variables.length;
    
    // Add complexity for loops and complex steps
    pattern.steps.forEach(step => {
      if (step.type === 'loop') complexity += 3;
      if (step.type === 'condition') complexity += 2;
      if (step.retries > 1) complexity += 1;
    });

    return Math.min(100, complexity * 2); // Cap at 100
  }

  /**
   * Calculate selector reliability score
   */
  private calculateSelectorReliability(pattern: AutomationPattern): number {
    const strongSelectors = ['data-testid', 'id', 'aria-label', 'role'];
    const weakSelectors = ['class', 'nth-child', 'contains'];
    
    let score = 100;
    let selectorCount = 0;

    pattern.steps.forEach(step => {
      if (step.selector) {
        selectorCount++;
        const hasStrong = strongSelectors.some(s => step.selector.includes(s));
        const hasWeak = weakSelectors.some(s => step.selector.includes(s));
        
        if (hasWeak && !hasStrong) {
          score -= 15;
        } else if (!hasStrong) {
          score -= 5;
        }
      }
    });

    return Math.max(0, score);
  }

  /**
   * Calculate error proneness score
   */
  private calculateErrorProneness(pattern: AutomationPattern): number {
    let errorProneness = 0;
    
    pattern.steps.forEach(step => {
      // Check for error-prone patterns
      if (!step.errorHandling) errorProneness += 10;
      if (step.timeout < 2000) errorProneness += 5;
      if (step.retries === 0) errorProneness += 5;
      if (step.selector && step.selector.includes('nth-child')) errorProneness += 10;
    });

    return Math.min(100, errorProneness);
  }

  /**
   * Calculate resource usage score
   */
  private calculateResourceUsage(pattern: AutomationPattern): number {
    let usage = pattern.steps.length * 2; // Base usage per step
    
    pattern.steps.forEach(step => {
      if (step.type === 'wait') usage += 5;
      if (step.type === 'navigate') usage += 10;
      if (step.timeout > 10000) usage += 3;
    });

    return Math.min(100, usage);
  }

  /**
   * Calculate parallelizability score
   */
  private calculateParallelizability(pattern: AutomationPattern): number {
    let parallelizable = 100;
    
    // Sequential dependencies reduce parallelizability
    for (let i = 1; i < pattern.steps.length; i++) {
      const currentStep = pattern.steps[i];
      const prevStep = pattern.steps[i - 1];
      
      // Steps that depend on previous steps reduce parallelizability
      if (currentStep.type === 'type' || currentStep.type === 'click') {
        parallelizable -= 10;
      }
    }

    return Math.max(0, parallelizable);
  }

  /**
   * Calculate reliability score
   */
  private calculateReliabilityScore(pattern: AutomationPattern, healthChecks: HealthCheck[]): number {
    const reliabilityChecks = healthChecks.filter(c => c.category === 'reliability');
    const passedChecks = reliabilityChecks.filter(c => c.status === 'passed').length;
    
    return reliabilityChecks.length > 0 ? (passedChecks / reliabilityChecks.length) * 100 : 100;
  }

  /**
   * Calculate maintainability score
   */
  private calculateMaintainabilityScore(pattern: AutomationPattern, healthChecks: HealthCheck[]): number {
    const maintainabilityChecks = healthChecks.filter(c => c.category === 'maintainability');
    const passedChecks = maintainabilityChecks.filter(c => c.status === 'passed').length;
    
    let score = maintainabilityChecks.length > 0 ? (passedChecks / maintainabilityChecks.length) * 100 : 100;
    
    // Factor in documentation quality
    const documentedSteps = pattern.steps.filter(s => s.description && s.description.length > 10).length;
    const documentationScore = (documentedSteps / pattern.steps.length) * 100;
    
    return (score + documentationScore) / 2;
  }

  /**
   * Generate health recommendations
   */
  private generateRecommendations(
    pattern: AutomationPattern, 
    healthChecks: HealthCheck[], 
    metrics: PatternPerformanceMetrics
  ): HealthRecommendation[] {
    const recommendations: HealthRecommendation[] = [];

    // Performance recommendations
    if (metrics.estimatedExecutionTime > 60000) {
      recommendations.push({
        type: 'optimization',
        priority: 'medium',
        title: 'Reduce Execution Time',
        description: 'Pattern execution time is high',
        impact: 'Improved user experience and faster automation',
        effort: 'medium',
        suggestedAction: 'Optimize timeouts and reduce unnecessary wait steps',
        codeExample: 'Consider reducing timeout values and using more efficient selectors'
      });
    }

    // Reliability recommendations
    if (metrics.selectorReliability < 70) {
      recommendations.push({
        type: 'fix',
        priority: 'high',
        title: 'Improve Selector Reliability',
        description: 'Selectors may be fragile and prone to breaking',
        impact: 'Increased pattern reliability and reduced maintenance',
        effort: 'medium',
        suggestedAction: 'Use data-testid, id, or semantic attributes instead of CSS classes',
        codeExample: 'Replace ".button-class" with "[data-testid=\'submit-button\']"'
      });
    }

    // Security recommendations
    const securityIssues = healthChecks.filter(c => c.category === 'security' && c.status === 'failed');
    if (securityIssues.length > 0) {
      recommendations.push({
        type: 'fix',
        priority: 'critical',
        title: 'Address Security Issues',
        description: 'Pattern contains potential security vulnerabilities',
        impact: 'Prevented data leakage and improved security',
        effort: 'low',
        suggestedAction: 'Use variables or secure storage for sensitive data'
      });
    }

    // Add recommendations based on failed health checks
    const criticalFailures = healthChecks.filter(c => c.severity === 'critical' && c.status === 'failed');
    criticalFailures.forEach(failure => {
      if (!recommendations.some(r => r.title.includes(failure.name))) {
        recommendations.push({
          type: 'fix',
          priority: 'critical',
          title: `Fix ${failure.name}`,
          description: failure.message,
          impact: 'Pattern functionality and reliability',
          effort: failure.autoFixable ? 'low' : 'medium',
          suggestedAction: failure.suggestedFix || 'Manual review required'
        });
      }
    });

    return recommendations.slice(0, 10); // Limit to top 10 recommendations
  }

  /**
   * Assess pattern risks
   */
  private assessRisks(
    pattern: AutomationPattern, 
    healthChecks: HealthCheck[], 
    metrics: PatternPerformanceMetrics
  ): RiskAssessment {
    const risks: Risk[] = [];

    // Performance risks
    if (metrics.estimatedExecutionTime > 120000) {
      risks.push({
        type: 'performance',
        level: 'high',
        description: 'Pattern execution time exceeds 2 minutes',
        likelihood: 0.9,
        impact: 0.7,
        mitigation: 'Optimize timeouts and reduce wait times'
      });
    }

    // Reliability risks
    if (metrics.selectorReliability < 50) {
      risks.push({
        type: 'reliability',
        level: 'critical',
        description: 'Selectors are highly fragile and likely to break',
        likelihood: 0.8,
        impact: 0.9,
        mitigation: 'Rewrite selectors using stable attributes'
      });
    }

    // Security risks
    const securityFailures = healthChecks.filter(c => c.category === 'security' && c.status === 'failed');
    if (securityFailures.length > 0) {
      risks.push({
        type: 'security',
        level: 'critical',
        description: 'Pattern contains sensitive data or security vulnerabilities',
        likelihood: 1.0,
        impact: 0.9,
        mitigation: 'Remove sensitive data and use secure storage mechanisms'
      });
    }

    // Maintenance risks
    if (metrics.complexityScore > 80) {
      risks.push({
        type: 'maintenance',
        level: 'medium',
        description: 'Pattern is highly complex and difficult to maintain',
        likelihood: 0.6,
        impact: 0.5,
        mitigation: 'Simplify pattern logic and improve documentation'
      });
    }

    // Calculate overall risk level
    const avgRiskLevel = risks.length > 0 ? 
      risks.reduce((sum, risk) => {
        const levelScore = { low: 1, medium: 2, high: 3, critical: 4 }[risk.level];
        return sum + levelScore;
      }, 0) / risks.length : 1;

    const overallRisk: 'low' | 'medium' | 'high' | 'critical' = 
      avgRiskLevel >= 3.5 ? 'critical' :
      avgRiskLevel >= 2.5 ? 'high' :
      avgRiskLevel >= 1.5 ? 'medium' : 'low';

    return {
      overallRisk,
      risks,
      mitigationStrategies: risks.map(r => r.mitigation)
    };
  }

  /**
   * Execute individual test case
   */
  private async executeTestCase(testCase: PatternTestCase, patternId: string): Promise<TestCaseResult> {
    const startTime = Date.now();
    const logs: string[] = [];
    
    try {
      logs.push(`Starting test case: ${testCase.name}`);
      
      // Check preconditions
      for (const precondition of testCase.preconditions) {
        const conditionMet = await this.checkTestPrecondition(precondition);
        if (!conditionMet) {
          return {
            testCaseId: testCase.id,
            status: 'skipped',
            executionTime: Date.now() - startTime,
            error: `Precondition not met: ${precondition.condition}`,
            logs
          };
        }
      }

      // Simulate pattern execution (in real implementation, this would execute the actual pattern)
      logs.push('Simulating pattern execution...');
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Check expected outcome
      const outcomeMatched = await this.checkExpectedOutcome(testCase.expectedOutcome);
      
      if (outcomeMatched) {
        logs.push('Test passed successfully');
        return {
          testCaseId: testCase.id,
          status: 'passed',
          executionTime: Date.now() - startTime,
          logs
        };
      } else {
        logs.push('Expected outcome not met');
        return {
          testCaseId: testCase.id,
          status: 'failed',
          executionTime: Date.now() - startTime,
          error: 'Expected outcome not met',
          logs
        };
      }
    } catch (error) {
      return {
        testCaseId: testCase.id,
        status: 'failed',
        executionTime: Date.now() - startTime,
        error: String(error),
        logs
      };
    }
  }

  /**
   * Check test precondition
   */
  private async checkTestPrecondition(precondition: TestPrecondition): Promise<boolean> {
    // Simplified implementation - in real version, this would check actual browser state
    switch (precondition.type) {
      case 'url':
        return true; // Assume URL matches
      case 'element':
        return true; // Assume element exists
      case 'data':
        return true; // Assume data is available
      case 'state':
        return true; // Assume state is correct
      default:
        return false;
    }
  }

  /**
   * Check expected outcome
   */
  private async checkExpectedOutcome(outcome: ExpectedOutcome): Promise<boolean> {
    // Simplified implementation - in real version, this would check actual results
    switch (outcome.type) {
      case 'success':
        return true;
      case 'element-found':
        return true;
      case 'data-extracted':
        return true;
      case 'navigation':
        return true;
      case 'error':
        return false; // We expect success in tests
      default:
        return false;
    }
  }

  /**
   * Calculate test coverage
   */
  private calculateTestCoverage(pattern: AutomationPattern, testCases: PatternTestCase[]): TestCoverage {
    const totalSteps = pattern.steps.length;
    const totalConditions = pattern.conditions.length;
    const totalErrorPaths = pattern.steps.filter(s => s.errorHandling !== 'fail').length;

    // Simplified coverage calculation
    const stepCoverage = Math.min(1, testCases.length / Math.max(1, totalSteps));
    const conditionCoverage = Math.min(1, testCases.length / Math.max(1, totalConditions));
    const errorPathCoverage = Math.min(1, testCases.filter(tc => tc.type === 'stress').length / Math.max(1, totalErrorPaths));

    return {
      stepCoverage,
      conditionCoverage,
      errorPathCoverage,
      overallCoverage: (stepCoverage + conditionCoverage + errorPathCoverage) / 3
    };
  }

  /**
   * Generate unique report ID
   */
  private generateReportId(): string {
    return `health-report-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate unique test suite ID
   */
  private generateTestSuiteId(): string {
    return `test-suite-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Load health reports from storage
   */
  private async loadHealthReports(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.STORAGE_KEY);
      const stored = result[this.STORAGE_KEY];
      
      if (stored && stored.reports) {
        stored.reports.forEach((report: PatternHealthReport) => {
          this.healthReports.set(report.id, report);
        });
        console.log(`🏥 Loaded ${this.healthReports.size} health reports from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load health reports:', error);
    }
  }

  /**
   * Save health reports to storage
   */
  private async saveHealthReports(): Promise<void> {
    try {
      const reports = Array.from(this.healthReports.values());
      await chrome.storage.local.set({
        [this.STORAGE_KEY]: {
          reports,
          lastSaved: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Failed to save health reports:', error);
    }
  }

  /**
   * Load test suites from storage
   */
  private async loadTestSuites(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(this.TEST_SUITES_KEY);
      const stored = result[this.TEST_SUITES_KEY];
      
      if (stored && stored.testSuites) {
        stored.testSuites.forEach((testSuite: PatternTestSuite) => {
          this.testSuites.set(testSuite.id, testSuite);
        });
        console.log(`🧪 Loaded ${this.testSuites.size} test suites from storage`);
      }
    } catch (error) {
      console.error('❌ Failed to load test suites:', error);
    }
  }

  /**
   * Save test suites to storage
   */
  private async saveTestSuites(): Promise<void> {
    try {
      const testSuites = Array.from(this.testSuites.values());
      await chrome.storage.local.set({
        [this.TEST_SUITES_KEY]: {
          testSuites,
          lastSaved: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Failed to save test suites:', error);
    }
  }
}

// Global pattern health monitor instance
export const globalPatternHealthMonitor = new PatternHealthMonitor();