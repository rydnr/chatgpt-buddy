/**
 * Pattern Health & Validation System
 *
 * Provides comprehensive pattern validation, health monitoring, quality assurance,
 * and automated testing for automation patterns.
 */
import { AutomationPattern } from './pattern-manager';
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
export type HealthCategory = 'syntax' | 'semantics' | 'performance' | 'reliability' | 'maintainability' | 'security' | 'compatibility' | 'best-practices';
export interface HealthScore {
    overall: number;
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
    likelihood: number;
    impact: number;
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
    stepCoverage: number;
    conditionCoverage: number;
    errorPathCoverage: number;
    overallCoverage: number;
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
export declare class PatternHealthMonitor {
    private validationRules;
    private healthReports;
    private testSuites;
    private readonly STORAGE_KEY;
    private readonly TEST_SUITES_KEY;
    constructor();
    /**
     * Perform comprehensive health check on a pattern
     */
    performHealthCheck(patternId: string): Promise<PatternHealthReport>;
    /**
     * Create automated test suite for a pattern
     */
    createPatternTestSuite(patternId: string, testCases: PatternTestCase[]): Promise<PatternTestSuite>;
    /**
     * Execute pattern test suite
     */
    executeTestSuite(testSuiteId: string): Promise<TestSuiteResults>;
    /**
     * Auto-fix pattern issues where possible
     */
    autoFixPattern(patternId: string): Promise<{
        fixed: boolean;
        changes: string[];
    }>;
    /**
     * Get health report for a pattern
     */
    getPatternHealthReport(patternId: string): PatternHealthReport | null;
    /**
     * Get all health reports
     */
    getAllHealthReports(): PatternHealthReport[];
    /**
     * Get test suite for a pattern
     */
    getPatternTestSuite(patternId: string): PatternTestSuite | null;
    /**
     * Initialize validation rules
     */
    private initializeValidationRules;
    /**
     * Add validation rule
     */
    private addValidationRule;
    /**
     * Run validation rule against pattern
     */
    private runValidationRule;
    /**
     * Calculate health score from health checks
     */
    private calculateHealthScore;
    /**
     * Calculate performance metrics for pattern
     */
    private calculatePerformanceMetrics;
    /**
     * Calculate complexity score
     */
    private calculateComplexityScore;
    /**
     * Calculate selector reliability score
     */
    private calculateSelectorReliability;
    /**
     * Calculate error proneness score
     */
    private calculateErrorProneness;
    /**
     * Calculate resource usage score
     */
    private calculateResourceUsage;
    /**
     * Calculate parallelizability score
     */
    private calculateParallelizability;
    /**
     * Calculate reliability score
     */
    private calculateReliabilityScore;
    /**
     * Calculate maintainability score
     */
    private calculateMaintainabilityScore;
    /**
     * Generate health recommendations
     */
    private generateRecommendations;
    /**
     * Assess pattern risks
     */
    private assessRisks;
    /**
     * Execute individual test case
     */
    private executeTestCase;
    /**
     * Check test precondition
     */
    private checkTestPrecondition;
    /**
     * Check expected outcome
     */
    private checkExpectedOutcome;
    /**
     * Calculate test coverage
     */
    private calculateTestCoverage;
    /**
     * Generate unique report ID
     */
    private generateReportId;
    /**
     * Generate unique test suite ID
     */
    private generateTestSuiteId;
    /**
     * Load health reports from storage
     */
    private loadHealthReports;
    /**
     * Save health reports to storage
     */
    private saveHealthReports;
    /**
     * Load test suites from storage
     */
    private loadTestSuites;
    /**
     * Save test suites to storage
     */
    private saveTestSuites;
}
export declare const globalPatternHealthMonitor: PatternHealthMonitor;
//# sourceMappingURL=pattern-health-monitor.d.ts.map