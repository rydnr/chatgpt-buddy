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

import { Application } from 'typescript-eda-application';
import { EventBus } from 'typescript-eda-infrastructure';
import { Listen } from 'typescript-eda-infrastructure';
import { 
  SecurityValidationEvent,
  WorkflowExecutionCompletedEvent,
  ClientConnectedEvent,
  ClientDisconnectedEvent,
  AutomationWorkflowSubmittedEvent
} from '../core/events/cloud-events';
import { AuditRepository } from './domain/audit-repository';
import { AuditEntry } from './domain/audit-entry';
import { ComplianceValidator } from './compliance-validator';
import { SecurityEventAnalyzer } from './security-event-analyzer';

/**
 * Audit Service
 * 
 * Provides comprehensive audit logging and compliance tracking for all
 * security-relevant events in the Semantest platform. Ensures compliance
 * with SOC 2, GDPR, and other regulatory requirements.
 */
export class AuditService extends Application {
  constructor(
    eventBus: EventBus,
    private auditRepository: AuditRepository,
    private complianceValidator: ComplianceValidator,
    private securityAnalyzer: SecurityEventAnalyzer
  ) {
    super(eventBus, new Map([
      ['auditRepository', auditRepository],
      ['complianceValidator', complianceValidator],
      ['securityAnalyzer', securityAnalyzer]
    ]));
  }

  /**
   * Handles security validation events for audit logging
   */
  @Listen('SecurityValidationEvent')
  async handleSecurityValidation(event: SecurityValidationEvent): Promise<void> {
    try {
      // Create audit entry
      const auditEntry = new AuditEntry({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        eventType: 'SECURITY_VALIDATION',
        eventSubtype: event.validationType,
        success: event.success,
        userId: event.userId,
        clientId: event.clientId,
        correlationId: event.correlationId,
        ipAddress: event.details.ipAddress || 'unknown',
        userAgent: event.details.userAgent || 'unknown',
        resource: event.details.resource || null,
        action: event.validationType,
        outcome: event.success ? 'SUCCESS' : 'FAILURE',
        details: {
          validationType: event.validationType,
          securityLevel: event.securityLevel,
          ...event.details
        },
        riskScore: this.calculateRiskScore(event),
        complianceFlags: this.getComplianceFlags(event)
      });

      // Store audit entry
      await this.auditRepository.create(auditEntry);

      // Analyze for security threats
      const threats = await this.securityAnalyzer.analyzeEvent(auditEntry);
      if (threats.length > 0) {
        await this.handleSecurityThreats(threats, auditEntry);
      }

      // Check compliance requirements
      const complianceIssues = await this.complianceValidator.validateEvent(auditEntry);
      if (complianceIssues.length > 0) {
        await this.handleComplianceIssues(complianceIssues, auditEntry);
      }

    } catch (error) {
      console.error('Failed to audit security event:', error);
      // Audit failures should not break the system
    }
  }

  /**
   * Handles workflow execution events for audit logging
   */
  @Listen('WorkflowExecutionCompletedEvent')
  async handleWorkflowExecution(event: WorkflowExecutionCompletedEvent): Promise<void> {
    try {
      const auditEntry = new AuditEntry({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        eventType: 'WORKFLOW_EXECUTION',
        eventSubtype: event.success ? 'COMPLETED' : 'FAILED',
        success: event.success,
        userId: event.workflow.metadata?.userId || null,
        clientId: event.clientId,
        correlationId: event.correlationId,
        ipAddress: 'internal',
        userAgent: 'semantest-platform',
        resource: `workflow:${event.workflowId}`,
        action: 'EXECUTE',
        outcome: event.success ? 'SUCCESS' : 'FAILURE',
        details: {
          workflowId: event.workflowId,
          executionId: event.executionId,
          domain: event.workflow.domain,
          performance: event.performance,
          error: event.error,
          issues: event.issues
        },
        riskScore: 0, // Workflow executions are not risky by default
        complianceFlags: ['DATA_PROCESSING']
      });

      await this.auditRepository.create(auditEntry);

      // Check for data processing compliance (GDPR)
      if (event.workflow.metadata?.processesPersonalData) {
        await this.validateGDPRCompliance(auditEntry);
      }

    } catch (error) {
      console.error('Failed to audit workflow execution:', error);
    }
  }

  /**
   * Handles client connection events
   */
  @Listen('ClientConnectedEvent')
  async handleClientConnected(event: ClientConnectedEvent): Promise<void> {
    try {
      const auditEntry = new AuditEntry({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        eventType: 'CLIENT_CONNECTION',
        eventSubtype: 'CONNECTED',
        success: true,
        userId: null,
        clientId: event.clientId,
        correlationId: event.correlationId,
        ipAddress: event.metadata.ipAddress || 'unknown',
        userAgent: event.metadata.userAgent || 'unknown',
        resource: `client:${event.clientId}`,
        action: 'CONNECT',
        outcome: 'SUCCESS',
        details: {
          clientType: event.clientType,
          version: event.version,
          capabilities: event.capabilities,
          metadata: event.metadata
        },
        riskScore: 0,
        complianceFlags: ['CLIENT_MANAGEMENT']
      });

      await this.auditRepository.create(auditEntry);

    } catch (error) {
      console.error('Failed to audit client connection:', error);
    }
  }

  /**
   * Handles client disconnection events
   */
  @Listen('ClientDisconnectedEvent')
  async handleClientDisconnected(event: ClientDisconnectedEvent): Promise<void> {
    try {
      const auditEntry = new AuditEntry({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        eventType: 'CLIENT_CONNECTION',
        eventSubtype: 'DISCONNECTED',
        success: true,
        userId: null,
        clientId: event.clientId,
        correlationId: event.correlationId,
        ipAddress: 'internal',
        userAgent: 'semantest-platform',
        resource: `client:${event.clientId}`,
        action: 'DISCONNECT',
        outcome: 'SUCCESS',
        details: {
          reason: event.reason,
          lastSeen: event.lastSeen.toISOString()
        },
        riskScore: event.reason === 'error' ? 25 : 0,
        complianceFlags: ['CLIENT_MANAGEMENT']
      });

      await this.auditRepository.create(auditEntry);

    } catch (error) {
      console.error('Failed to audit client disconnection:', error);
    }
  }

  /**
   * Handles workflow submission events
   */
  @Listen('AutomationWorkflowSubmittedEvent')
  async handleWorkflowSubmission(event: AutomationWorkflowSubmittedEvent): Promise<void> {
    try {
      const auditEntry = new AuditEntry({
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        timestamp: new Date(),
        eventType: 'WORKFLOW_SUBMISSION',
        eventSubtype: 'SUBMITTED',
        success: true,
        userId: event.submittedBy.id,
        clientId: null,
        correlationId: event.correlationId,
        ipAddress: 'api-gateway',
        userAgent: 'semantest-api',
        resource: `workflow:${event.workflowId}`,
        action: 'SUBMIT',
        outcome: 'SUCCESS',
        details: {
          workflowId: event.workflowId,
          workflowName: event.workflow.name,
          domain: event.workflow.domain,
          priority: event.priority,
          organizationId: event.submittedBy.organizationId
        },
        riskScore: 0,
        complianceFlags: ['WORKFLOW_MANAGEMENT']
      });

      await this.auditRepository.create(auditEntry);

    } catch (error) {
      console.error('Failed to audit workflow submission:', error);
    }
  }

  /**
   * Retrieves audit logs with filtering
   */
  async getAuditLogs(filters: {
    startDate?: Date;
    endDate?: Date;
    userId?: string;
    clientId?: string;
    eventType?: string;
    outcome?: string;
    minRiskScore?: number;
    complianceFlag?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ entries: AuditEntry[]; total: number }> {
    return await this.auditRepository.findByFilters(filters);
  }

  /**
   * Generates compliance report
   */
  async generateComplianceReport(options: {
    reportType: 'SOC2' | 'GDPR' | 'HIPAA' | 'CUSTOM';
    startDate: Date;
    endDate: Date;
    includeDetails?: boolean;
  }): Promise<any> {
    const entries = await this.auditRepository.findByDateRange(
      options.startDate,
      options.endDate
    );

    const report = await this.complianceValidator.generateReport(
      entries,
      options.reportType,
      options.includeDetails || false
    );

    // Store report for audit trail
    const reportAudit = new AuditEntry({
      id: `audit-report-${Date.now()}`,
      timestamp: new Date(),
      eventType: 'COMPLIANCE_REPORT',
      eventSubtype: options.reportType,
      success: true,
      userId: 'system',
      clientId: null,
      correlationId: `report-${Date.now()}`,
      ipAddress: 'internal',
      userAgent: 'audit-service',
      resource: 'compliance-report',
      action: 'GENERATE',
      outcome: 'SUCCESS',
      details: {
        reportType: options.reportType,
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
        entriesAnalyzed: entries.length
      },
      riskScore: 0,
      complianceFlags: ['AUDIT_REPORT']
    });

    await this.auditRepository.create(reportAudit);

    return report;
  }

  /**
   * Exports audit logs for external analysis
   */
  async exportAuditLogs(options: {
    format: 'JSON' | 'CSV' | 'SIEM';
    startDate: Date;
    endDate: Date;
    encryptionKey?: string;
  }): Promise<Buffer> {
    const entries = await this.auditRepository.findByDateRange(
      options.startDate,
      options.endDate
    );

    let exportData: Buffer;

    switch (options.format) {
      case 'JSON':
        exportData = Buffer.from(JSON.stringify(entries, null, 2));
        break;
      case 'CSV':
        exportData = this.convertToCSV(entries);
        break;
      case 'SIEM':
        exportData = this.convertToSIEMFormat(entries);
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }

    // Encrypt if requested
    if (options.encryptionKey) {
      exportData = await this.encryptData(exportData, options.encryptionKey);
    }

    // Audit the export operation
    await this.auditRepository.create(new AuditEntry({
      id: `audit-export-${Date.now()}`,
      timestamp: new Date(),
      eventType: 'AUDIT_EXPORT',
      eventSubtype: options.format,
      success: true,
      userId: 'system',
      clientId: null,
      correlationId: `export-${Date.now()}`,
      ipAddress: 'internal',
      userAgent: 'audit-service',
      resource: 'audit-logs',
      action: 'EXPORT',
      outcome: 'SUCCESS',
      details: {
        format: options.format,
        startDate: options.startDate.toISOString(),
        endDate: options.endDate.toISOString(),
        entriesExported: entries.length,
        encrypted: !!options.encryptionKey
      },
      riskScore: 0,
      complianceFlags: ['DATA_EXPORT']
    }));

    return exportData;
  }

  /**
   * Calculates risk score for security events
   */
  private calculateRiskScore(event: SecurityValidationEvent): number {
    let score = 0;

    // Failed authentication attempts
    if (event.validationType === 'authentication' && !event.success) {
      score += 50;
    }

    // Failed authorization attempts
    if (event.validationType === 'authorization' && !event.success) {
      score += 30;
    }

    // Rate limit violations
    if (event.validationType === 'rate-limit' && !event.success) {
      score += 40;
    }

    // Input validation failures
    if (event.validationType === 'input-validation' && !event.success) {
      score += 20;
    }

    // Adjust based on security level
    if (event.securityLevel === 'high' && !event.success) {
      score *= 1.5;
    }

    return Math.min(100, Math.round(score));
  }

  /**
   * Determines compliance flags for events
   */
  private getComplianceFlags(event: SecurityValidationEvent): string[] {
    const flags: string[] = [];

    // Authentication events
    if (event.validationType === 'authentication') {
      flags.push('AUTH_TRACKING');
      if (!event.success) {
        flags.push('FAILED_AUTH');
      }
    }

    // Authorization events
    if (event.validationType === 'authorization') {
      flags.push('ACCESS_CONTROL');
      if (!event.success) {
        flags.push('UNAUTHORIZED_ACCESS');
      }
    }

    // Rate limiting
    if (event.validationType === 'rate-limit') {
      flags.push('RATE_LIMITING');
      if (!event.success) {
        flags.push('RATE_LIMIT_EXCEEDED');
      }
    }

    return flags;
  }

  /**
   * Handles detected security threats
   */
  private async handleSecurityThreats(
    threats: any[],
    auditEntry: AuditEntry
  ): Promise<void> {
    // Log threats
    console.warn('Security threats detected:', {
      auditId: auditEntry.id,
      threats: threats.map(t => t.type),
      riskScore: auditEntry.riskScore
    });

    // Create alert audit entries
    for (const threat of threats) {
      await this.auditRepository.create(new AuditEntry({
        id: `audit-threat-${Date.now()}`,
        timestamp: new Date(),
        eventType: 'SECURITY_ALERT',
        eventSubtype: threat.type,
        success: false,
        userId: auditEntry.userId,
        clientId: auditEntry.clientId,
        correlationId: auditEntry.correlationId,
        ipAddress: auditEntry.ipAddress,
        userAgent: auditEntry.userAgent,
        resource: auditEntry.resource,
        action: 'THREAT_DETECTED',
        outcome: 'ALERT',
        details: {
          originalAuditId: auditEntry.id,
          threatType: threat.type,
          severity: threat.severity,
          description: threat.description,
          recommendations: threat.recommendations
        },
        riskScore: threat.riskScore || 75,
        complianceFlags: ['SECURITY_INCIDENT']
      }));
    }
  }

  /**
   * Handles compliance issues
   */
  private async handleComplianceIssues(
    issues: any[],
    auditEntry: AuditEntry
  ): Promise<void> {
    for (const issue of issues) {
      await this.auditRepository.create(new AuditEntry({
        id: `audit-compliance-${Date.now()}`,
        timestamp: new Date(),
        eventType: 'COMPLIANCE_VIOLATION',
        eventSubtype: issue.regulation,
        success: false,
        userId: auditEntry.userId,
        clientId: auditEntry.clientId,
        correlationId: auditEntry.correlationId,
        ipAddress: auditEntry.ipAddress,
        userAgent: auditEntry.userAgent,
        resource: auditEntry.resource,
        action: 'COMPLIANCE_CHECK',
        outcome: 'VIOLATION',
        details: {
          originalAuditId: auditEntry.id,
          regulation: issue.regulation,
          requirement: issue.requirement,
          violation: issue.violation,
          remediation: issue.remediation
        },
        riskScore: issue.severity * 20,
        complianceFlags: [issue.regulation, 'COMPLIANCE_ISSUE']
      }));
    }
  }

  /**
   * Validates GDPR compliance for data processing
   */
  private async validateGDPRCompliance(auditEntry: AuditEntry): Promise<void> {
    const gdprChecks = await this.complianceValidator.validateGDPR(auditEntry);
    
    if (!gdprChecks.compliant) {
      await this.handleComplianceIssues(
        gdprChecks.violations.map(v => ({
          regulation: 'GDPR',
          requirement: v.article,
          violation: v.description,
          remediation: v.remediation,
          severity: v.severity
        })),
        auditEntry
      );
    }
  }

  /**
   * Converts audit entries to CSV format
   */
  private convertToCSV(entries: AuditEntry[]): Buffer {
    const headers = [
      'ID', 'Timestamp', 'Event Type', 'Event Subtype', 'Success',
      'User ID', 'Client ID', 'IP Address', 'Resource', 'Action',
      'Outcome', 'Risk Score', 'Compliance Flags'
    ].join(',');

    const rows = entries.map(entry => [
      entry.id,
      entry.timestamp.toISOString(),
      entry.eventType,
      entry.eventSubtype,
      entry.success,
      entry.userId || '',
      entry.clientId || '',
      entry.ipAddress,
      entry.resource || '',
      entry.action,
      entry.outcome,
      entry.riskScore,
      entry.complianceFlags.join(';')
    ].map(v => `"${v}"`).join(','));

    return Buffer.from([headers, ...rows].join('\n'));
  }

  /**
   * Converts audit entries to SIEM format
   */
  private convertToSIEMFormat(entries: AuditEntry[]): Buffer {
    const siemEvents = entries.map(entry => ({
      '@timestamp': entry.timestamp.toISOString(),
      'event.kind': 'event',
      'event.category': entry.eventType.toLowerCase(),
      'event.type': entry.eventSubtype.toLowerCase(),
      'event.outcome': entry.outcome.toLowerCase(),
      'user.id': entry.userId,
      'client.id': entry.clientId,
      'source.ip': entry.ipAddress,
      'user_agent.original': entry.userAgent,
      'event.risk_score': entry.riskScore,
      'labels': entry.complianceFlags,
      'semantest.correlation_id': entry.correlationId,
      'semantest.details': entry.details
    }));

    return Buffer.from(siemEvents.map(e => JSON.stringify(e)).join('\n'));
  }

  /**
   * Encrypts data (placeholder - implement actual encryption)
   */
  private async encryptData(data: Buffer, key: string): Promise<Buffer> {
    // TODO: Implement actual encryption using crypto module
    console.log('Encrypting data with key length:', key.length);
    return data; // Placeholder
  }

  /**
   * Gets service health status
   */
  async getHealthStatus(): Promise<{
    status: 'healthy' | 'unhealthy';
    details: Record<string, any>;
  }> {
    try {
      const recentEntries = await this.auditRepository.getRecentEntryCount();
      const storageStatus = await this.auditRepository.getStorageStatus();

      return {
        status: 'healthy',
        details: {
          recentEntries,
          storageStatus,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}