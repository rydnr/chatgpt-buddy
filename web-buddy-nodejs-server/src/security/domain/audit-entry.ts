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

import { Entity } from 'typescript-eda-domain';

/**
 * Audit Entry Entity
 * 
 * Represents a single audit log entry capturing security-relevant events
 * in the Semantest platform for compliance and security monitoring.
 */
export class AuditEntry extends Entity {
  public readonly timestamp: Date;
  public readonly eventType: string;
  public readonly eventSubtype: string;
  public readonly success: boolean;
  public readonly userId: string | null;
  public readonly clientId: string | null;
  public readonly correlationId: string;
  public readonly ipAddress: string;
  public readonly userAgent: string;
  public readonly resource: string | null;
  public readonly action: string;
  public readonly outcome: string;
  public readonly details: Record<string, any>;
  public readonly riskScore: number;
  public readonly complianceFlags: string[];
  public readonly retentionDate: Date;
  public readonly encryptedData?: string;
  public readonly signature?: string;

  constructor(props: {
    id: string;
    timestamp: Date;
    eventType: string;
    eventSubtype: string;
    success: boolean;
    userId: string | null;
    clientId: string | null;
    correlationId: string;
    ipAddress: string;
    userAgent: string;
    resource: string | null;
    action: string;
    outcome: string;
    details: Record<string, any>;
    riskScore: number;
    complianceFlags: string[];
    retentionDate?: Date;
    encryptedData?: string;
    signature?: string;
  }) {
    super(props.id);
    this.timestamp = props.timestamp;
    this.eventType = props.eventType;
    this.eventSubtype = props.eventSubtype;
    this.success = props.success;
    this.userId = props.userId;
    this.clientId = props.clientId;
    this.correlationId = props.correlationId;
    this.ipAddress = props.ipAddress;
    this.userAgent = props.userAgent;
    this.resource = props.resource;
    this.action = props.action;
    this.outcome = props.outcome;
    this.details = props.details;
    this.riskScore = props.riskScore;
    this.complianceFlags = props.complianceFlags;
    this.retentionDate = props.retentionDate || this.calculateRetentionDate();
    this.encryptedData = props.encryptedData;
    this.signature = props.signature;
  }

  /**
   * Calculates retention date based on compliance requirements
   */
  private calculateRetentionDate(): Date {
    const retentionDays = this.getRetentionDays();
    const retentionDate = new Date(this.timestamp);
    retentionDate.setDate(retentionDate.getDate() + retentionDays);
    return retentionDate;
  }

  /**
   * Determines retention period based on event type and compliance flags
   */
  private getRetentionDays(): number {
    // Security incidents: 7 years
    if (this.complianceFlags.includes('SECURITY_INCIDENT')) {
      return 2555; // 7 years
    }

    // Failed authentication: 90 days
    if (this.complianceFlags.includes('FAILED_AUTH')) {
      return 90;
    }

    // GDPR data processing: 3 years
    if (this.complianceFlags.includes('DATA_PROCESSING')) {
      return 1095; // 3 years
    }

    // Compliance violations: 5 years
    if (this.eventType === 'COMPLIANCE_VIOLATION') {
      return 1825; // 5 years
    }

    // Default: 1 year
    return 365;
  }

  /**
   * Checks if the audit entry should be retained
   */
  public shouldRetain(): boolean {
    return new Date() < this.retentionDate;
  }

  /**
   * Returns a sanitized version of the audit entry for external consumption
   */
  public toSanitized(): Record<string, any> {
    return {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      eventType: this.eventType,
      eventSubtype: this.eventSubtype,
      success: this.success,
      action: this.action,
      outcome: this.outcome,
      riskScore: this.riskScore,
      complianceFlags: this.complianceFlags,
      // Exclude sensitive details
      hasDetails: Object.keys(this.details).length > 0,
      // Mask user/client IDs partially
      userId: this.userId ? `${this.userId.substr(0, 8)}...` : null,
      clientId: this.clientId ? `${this.clientId.substr(0, 8)}...` : null,
      // Partial IP address
      ipAddress: this.maskIpAddress(this.ipAddress)
    };
  }

  /**
   * Masks IP address for privacy
   */
  private maskIpAddress(ip: string): string {
    if (ip === 'internal' || ip === 'unknown') {
      return ip;
    }
    const parts = ip.split('.');
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.xxx.xxx`;
    }
    return 'masked';
  }

  /**
   * Converts to JSON for storage
   */
  public toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      timestamp: this.timestamp.toISOString(),
      eventType: this.eventType,
      eventSubtype: this.eventSubtype,
      success: this.success,
      userId: this.userId,
      clientId: this.clientId,
      correlationId: this.correlationId,
      ipAddress: this.ipAddress,
      userAgent: this.userAgent,
      resource: this.resource,
      action: this.action,
      outcome: this.outcome,
      details: this.details,
      riskScore: this.riskScore,
      complianceFlags: this.complianceFlags,
      retentionDate: this.retentionDate.toISOString(),
      encryptedData: this.encryptedData,
      signature: this.signature,
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    };
  }

  /**
   * Creates an AuditEntry from stored data
   */
  public static fromJSON(data: any): AuditEntry {
    return new AuditEntry({
      id: data.id,
      timestamp: new Date(data.timestamp),
      eventType: data.eventType,
      eventSubtype: data.eventSubtype,
      success: data.success,
      userId: data.userId,
      clientId: data.clientId,
      correlationId: data.correlationId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      resource: data.resource,
      action: data.action,
      outcome: data.outcome,
      details: data.details,
      riskScore: data.riskScore,
      complianceFlags: data.complianceFlags,
      retentionDate: new Date(data.retentionDate),
      encryptedData: data.encryptedData,
      signature: data.signature
    });
  }
}