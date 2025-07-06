/*
 * Copyright (C) 2024-present Semantest, rydnr
 *
 * This file is part of @semantest/nodejs.server.
 *
 * @semantest/nodejs.server is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * @semantest/nodejs.server is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with @semantest/nodejs.server. If not, see <https://www.gnu.org/licenses/>.
 */

import { AuditEntry } from './domain/audit-entry';

/**
 * Compliance Validator
 * 
 * Validates audit entries against various regulatory compliance requirements
 * including SOC 2, GDPR, HIPAA, and custom organizational policies.
 */
export class ComplianceValidator {
  private readonly regulations: Map<string, ComplianceRegulation>;

  constructor() {
    this.regulations = new Map();
    this.initializeRegulations();
  }

  /**
   * Validates an audit entry for compliance issues
   */
  async validateEvent(entry: AuditEntry): Promise<ComplianceIssue[]> {
    const issues: ComplianceIssue[] = [];

    // Check each applicable regulation
    for (const [name, regulation] of this.regulations) {
      if (regulation.applies(entry)) {
        const regulationIssues = await regulation.validate(entry);
        issues.push(...regulationIssues);
      }
    }

    return issues;
  }

  /**
   * Validates GDPR compliance specifically
   */
  async validateGDPR(entry: AuditEntry): Promise<GDPRValidationResult> {
    const gdpr = this.regulations.get('GDPR')!;
    const violations = await gdpr.validate(entry);

    return {
      compliant: violations.length === 0,
      violations: violations.map(v => ({
        article: v.requirement,
        description: v.violation,
        remediation: v.remediation,
        severity: v.severity
      }))
    };
  }

  /**
   * Generates compliance report
   */
  async generateReport(
    entries: AuditEntry[],
    reportType: 'SOC2' | 'GDPR' | 'HIPAA' | 'CUSTOM',
    includeDetails: boolean
  ): Promise<ComplianceReport> {
    const regulation = this.regulations.get(reportType);
    if (!regulation) {
      throw new Error(`Unknown report type: ${reportType}`);
    }

    const violations: ComplianceViolation[] = [];
    const statistics: ComplianceStatistics = {
      totalEvents: entries.length,
      compliantEvents: 0,
      violationsByType: {},
      riskDistribution: {
        low: 0,
        medium: 0,
        high: 0,
        critical: 0
      }
    };

    // Analyze each entry
    for (const entry of entries) {
      const issues = await regulation.validate(entry);
      
      if (issues.length === 0) {
        statistics.compliantEvents++;
      } else {
        for (const issue of issues) {
          violations.push({
            auditEntryId: entry.id,
            timestamp: entry.timestamp,
            regulation: reportType,
            requirement: issue.requirement,
            violation: issue.violation,
            severity: issue.severity,
            remediation: issue.remediation,
            details: includeDetails ? entry.details : undefined
          });

          // Update statistics
          statistics.violationsByType[issue.requirement] = 
            (statistics.violationsByType[issue.requirement] || 0) + 1;
          
          if (issue.severity <= 3) statistics.riskDistribution.low++;
          else if (issue.severity <= 5) statistics.riskDistribution.medium++;
          else if (issue.severity <= 8) statistics.riskDistribution.high++;
          else statistics.riskDistribution.critical++;
        }
      }

      // Analyze risk scores
      if (entry.riskScore <= 25) statistics.riskDistribution.low++;
      else if (entry.riskScore <= 50) statistics.riskDistribution.medium++;
      else if (entry.riskScore <= 75) statistics.riskDistribution.high++;
      else statistics.riskDistribution.critical++;
    }

    return {
      reportId: `compliance-report-${Date.now()}`,
      reportType,
      generatedAt: new Date(),
      periodStart: entries.length > 0 ? entries[0].timestamp : new Date(),
      periodEnd: entries.length > 0 ? entries[entries.length - 1].timestamp : new Date(),
      summary: {
        totalEvents: statistics.totalEvents,
        compliantEvents: statistics.compliantEvents,
        violations: violations.length,
        complianceRate: statistics.totalEvents > 0 
          ? (statistics.compliantEvents / statistics.totalEvents) * 100 
          : 100,
        highestRisk: Math.max(...violations.map(v => v.severity), 0)
      },
      statistics,
      violations: includeDetails ? violations : violations.slice(0, 100),
      recommendations: this.generateRecommendations(violations, reportType),
      executiveSummary: this.generateExecutiveSummary(statistics, violations, reportType)
    };
  }

  /**
   * Initializes compliance regulations
   */
  private initializeRegulations(): void {
    // SOC 2 Compliance
    this.regulations.set('SOC2', {
      name: 'SOC2',
      applies: (entry) => true, // All events
      validate: async (entry) => {
        const issues: ComplianceIssue[] = [];

        // CC6.1 - Logical and Physical Access Controls
        if (entry.eventType === 'SECURITY_VALIDATION' && !entry.success) {
          if (entry.complianceFlags.includes('FAILED_AUTH')) {
            issues.push({
              regulation: 'SOC2',
              requirement: 'CC6.1',
              violation: 'Failed authentication attempt not properly monitored',
              severity: 5,
              remediation: 'Implement automated alerting for repeated failed authentication attempts'
            });
          }
        }

        // CC7.2 - System Monitoring
        if (entry.riskScore > 75 && !entry.details.alertGenerated) {
          issues.push({
            regulation: 'SOC2',
            requirement: 'CC7.2',
            violation: 'High-risk event detected without automated alert',
            severity: 7,
            remediation: 'Configure automated alerts for events with risk score > 75'
          });
        }

        // CC8.1 - Change Management
        if (entry.eventType === 'CONFIGURATION_CHANGE' && !entry.details.changeTicket) {
          issues.push({
            regulation: 'SOC2',
            requirement: 'CC8.1',
            violation: 'Configuration change without change management ticket',
            severity: 6,
            remediation: 'Require change tickets for all configuration modifications'
          });
        }

        return issues;
      }
    });

    // GDPR Compliance
    this.regulations.set('GDPR', {
      name: 'GDPR',
      applies: (entry) => {
        return entry.complianceFlags.includes('DATA_PROCESSING') ||
               entry.details.processesPersonalData ||
               entry.userId !== null;
      },
      validate: async (entry) => {
        const issues: ComplianceIssue[] = [];

        // Article 32 - Security of Processing
        if (entry.eventType === 'DATA_ACCESS' && !entry.encryptedData) {
          issues.push({
            regulation: 'GDPR',
            requirement: 'Article 32',
            violation: 'Personal data accessed without encryption',
            severity: 8,
            remediation: 'Implement encryption for all personal data access'
          });
        }

        // Article 33 - Breach Notification
        if (entry.eventType === 'SECURITY_INCIDENT' && 
            !entry.details.breachNotificationSent &&
            entry.details.personalDataAffected) {
          issues.push({
            regulation: 'GDPR',
            requirement: 'Article 33',
            violation: 'Data breach not reported within 72 hours',
            severity: 9,
            remediation: 'Implement automated breach notification workflow'
          });
        }

        // Article 17 - Right to Erasure
        if (entry.eventType === 'DATA_DELETION_REQUEST' && 
            !entry.success &&
            !entry.details.retentionJustification) {
          issues.push({
            regulation: 'GDPR',
            requirement: 'Article 17',
            violation: 'Data deletion request failed without justification',
            severity: 7,
            remediation: 'Document legal basis for data retention when deletion is refused'
          });
        }

        // Article 25 - Data Protection by Design
        if (entry.eventType === 'WORKFLOW_EXECUTION' && 
            entry.details.processesPersonalData &&
            !entry.details.privacyImpactAssessment) {
          issues.push({
            regulation: 'GDPR',
            requirement: 'Article 25',
            violation: 'Personal data processing without privacy impact assessment',
            severity: 6,
            remediation: 'Conduct privacy impact assessment for data processing workflows'
          });
        }

        return issues;
      }
    });

    // HIPAA Compliance
    this.regulations.set('HIPAA', {
      name: 'HIPAA',
      applies: (entry) => {
        return entry.details.healthcareData || 
               entry.complianceFlags.includes('PHI') ||
               entry.details.domain === 'healthcare';
      },
      validate: async (entry) => {
        const issues: ComplianceIssue[] = [];

        // Access Controls
        if (entry.eventType === 'DATA_ACCESS' && 
            !entry.details.roleBasedAccess) {
          issues.push({
            regulation: 'HIPAA',
            requirement: '164.308(a)(4)',
            violation: 'PHI accessed without role-based access control',
            severity: 8,
            remediation: 'Implement role-based access control for all PHI access'
          });
        }

        // Audit Controls
        if (!entry.signature) {
          issues.push({
            regulation: 'HIPAA',
            requirement: '164.312(b)',
            violation: 'Audit log entry without cryptographic signature',
            severity: 7,
            remediation: 'Implement digital signatures for audit log integrity'
          });
        }

        // Transmission Security
        if (entry.eventType === 'DATA_TRANSMISSION' && 
            !entry.details.encryptionMethod) {
          issues.push({
            regulation: 'HIPAA',
            requirement: '164.312(e)(1)',
            violation: 'PHI transmitted without encryption',
            severity: 9,
            remediation: 'Implement end-to-end encryption for PHI transmission'
          });
        }

        return issues;
      }
    });

    // Custom organizational policies
    this.regulations.set('CUSTOM', {
      name: 'CUSTOM',
      applies: (entry) => true,
      validate: async (entry) => {
        const issues: ComplianceIssue[] = [];

        // Password policy
        if (entry.eventType === 'PASSWORD_CHANGE' && 
            entry.details.passwordStrength < 3) {
          issues.push({
            regulation: 'CUSTOM',
            requirement: 'SEC-POL-001',
            violation: 'Weak password accepted',
            severity: 5,
            remediation: 'Enforce minimum password strength level 3'
          });
        }

        // Session timeout
        if (entry.eventType === 'SESSION_TIMEOUT' && 
            entry.details.sessionDuration > 3600000) { // 1 hour
          issues.push({
            regulation: 'CUSTOM',
            requirement: 'SEC-POL-002',
            violation: 'Session exceeded maximum duration',
            severity: 4,
            remediation: 'Implement automatic session timeout after 1 hour'
          });
        }

        return issues;
      }
    });
  }

  /**
   * Generates recommendations based on violations
   */
  private generateRecommendations(
    violations: ComplianceViolation[],
    reportType: string
  ): string[] {
    const recommendations: Set<string> = new Set();

    // Group violations by requirement
    const violationsByRequirement = new Map<string, number>();
    for (const violation of violations) {
      const count = violationsByRequirement.get(violation.requirement) || 0;
      violationsByRequirement.set(violation.requirement, count + 1);
    }

    // Generate recommendations based on patterns
    for (const [requirement, count] of violationsByRequirement) {
      if (count > 10) {
        recommendations.add(
          `Critical: Systematic ${requirement} violations detected. ` +
          `Immediate remediation required.`
        );
      }
    }

    // Report-specific recommendations
    if (reportType === 'SOC2') {
      recommendations.add(
        'Implement continuous monitoring and automated compliance checks'
      );
      recommendations.add(
        'Establish formal incident response procedures with defined escalation paths'
      );
    } else if (reportType === 'GDPR') {
      recommendations.add(
        'Conduct privacy impact assessments for all data processing activities'
      );
      recommendations.add(
        'Implement automated data subject request handling workflows'
      );
    } else if (reportType === 'HIPAA') {
      recommendations.add(
        'Deploy enterprise-wide encryption for data at rest and in transit'
      );
      recommendations.add(
        'Implement comprehensive access logging with real-time anomaly detection'
      );
    }

    return Array.from(recommendations);
  }

  /**
   * Generates executive summary
   */
  private generateExecutiveSummary(
    statistics: ComplianceStatistics,
    violations: ComplianceViolation[],
    reportType: string
  ): string {
    const complianceRate = statistics.totalEvents > 0
      ? (statistics.compliantEvents / statistics.totalEvents) * 100
      : 100;

    const criticalViolations = violations.filter(v => v.severity > 8).length;
    const highViolations = violations.filter(v => v.severity > 5 && v.severity <= 8).length;

    let summary = `## ${reportType} Compliance Report Executive Summary\n\n`;
    summary += `### Overall Compliance Status\n`;
    summary += `- Compliance Rate: ${complianceRate.toFixed(2)}%\n`;
    summary += `- Total Events Analyzed: ${statistics.totalEvents}\n`;
    summary += `- Compliant Events: ${statistics.compliantEvents}\n`;
    summary += `- Total Violations: ${violations.length}\n\n`;

    summary += `### Risk Overview\n`;
    summary += `- Critical Violations: ${criticalViolations}\n`;
    summary += `- High Severity Violations: ${highViolations}\n`;
    summary += `- Risk Distribution:\n`;
    summary += `  - Low: ${statistics.riskDistribution.low}\n`;
    summary += `  - Medium: ${statistics.riskDistribution.medium}\n`;
    summary += `  - High: ${statistics.riskDistribution.high}\n`;
    summary += `  - Critical: ${statistics.riskDistribution.critical}\n\n`;

    if (criticalViolations > 0) {
      summary += `### ⚠️ IMMEDIATE ACTION REQUIRED\n`;
      summary += `${criticalViolations} critical violations require immediate attention `;
      summary += `to maintain ${reportType} compliance.\n\n`;
    }

    summary += `### Key Recommendations\n`;
    const topViolations = Array.from(
      Object.entries(statistics.violationsByType)
    ).sort((a, b) => b[1] - a[1]).slice(0, 3);

    for (const [requirement, count] of topViolations) {
      summary += `- Address ${requirement} violations (${count} occurrences)\n`;
    }

    return summary;
  }
}

// Type definitions
interface ComplianceRegulation {
  name: string;
  applies: (entry: AuditEntry) => boolean;
  validate: (entry: AuditEntry) => Promise<ComplianceIssue[]>;
}

interface ComplianceIssue {
  regulation: string;
  requirement: string;
  violation: string;
  severity: number; // 1-10
  remediation: string;
}

interface GDPRValidationResult {
  compliant: boolean;
  violations: {
    article: string;
    description: string;
    remediation: string;
    severity: number;
  }[];
}

interface ComplianceViolation {
  auditEntryId: string;
  timestamp: Date;
  regulation: string;
  requirement: string;
  violation: string;
  severity: number;
  remediation: string;
  details?: any;
}

interface ComplianceStatistics {
  totalEvents: number;
  compliantEvents: number;
  violationsByType: Record<string, number>;
  riskDistribution: {
    low: number;
    medium: number;
    high: number;
    critical: number;
  };
}

interface ComplianceReport {
  reportId: string;
  reportType: string;
  generatedAt: Date;
  periodStart: Date;
  periodEnd: Date;
  summary: {
    totalEvents: number;
    compliantEvents: number;
    violations: number;
    complianceRate: number;
    highestRisk: number;
  };
  statistics: ComplianceStatistics;
  violations: ComplianceViolation[];
  recommendations: string[];
  executiveSummary: string;
}