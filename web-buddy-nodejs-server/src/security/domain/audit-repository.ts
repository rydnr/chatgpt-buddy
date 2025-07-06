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

import { Repository } from 'typescript-eda-domain';
import { AuditEntry } from './audit-entry';

/**
 * Audit Repository Interface
 * 
 * Defines the contract for storing and retrieving audit log entries
 * with support for compliance-driven queries and retention policies.
 */
export interface AuditRepository extends Repository<AuditEntry> {
  /**
   * Finds audit entries by date range
   */
  findByDateRange(startDate: Date, endDate: Date): Promise<AuditEntry[]>;

  /**
   * Finds audit entries by user ID
   */
  findByUserId(userId: string, limit?: number): Promise<AuditEntry[]>;

  /**
   * Finds audit entries by client ID
   */
  findByClientId(clientId: string, limit?: number): Promise<AuditEntry[]>;

  /**
   * Finds audit entries by correlation ID
   */
  findByCorrelationId(correlationId: string): Promise<AuditEntry[]>;

  /**
   * Finds audit entries by event type
   */
  findByEventType(eventType: string, limit?: number): Promise<AuditEntry[]>;

  /**
   * Finds audit entries with risk score above threshold
   */
  findByRiskScore(minScore: number, limit?: number): Promise<AuditEntry[]>;

  /**
   * Finds audit entries by compliance flag
   */
  findByComplianceFlag(flag: string, limit?: number): Promise<AuditEntry[]>;

  /**
   * Finds audit entries with advanced filtering
   */
  findByFilters(filters: {
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
  }): Promise<{ entries: AuditEntry[]; total: number }>;

  /**
   * Deletes expired audit entries based on retention policy
   */
  deleteExpired(): Promise<number>;

  /**
   * Archives audit entries to cold storage
   */
  archiveOldEntries(beforeDate: Date): Promise<number>;

  /**
   * Gets count of recent entries (last 24 hours)
   */
  getRecentEntryCount(): Promise<number>;

  /**
   * Gets storage status and statistics
   */
  getStorageStatus(): Promise<{
    totalEntries: number;
    storageSize: number;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  }>;

  /**
   * Finds security incidents within time window
   */
  findSecurityIncidents(
    startDate: Date,
    endDate: Date,
    minRiskScore?: number
  ): Promise<AuditEntry[]>;

  /**
   * Finds compliance violations
   */
  findComplianceViolations(
    regulation: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AuditEntry[]>;

  /**
   * Creates index for efficient queries
   */
  createIndexes(): Promise<void>;

  /**
   * Validates data integrity
   */
  validateIntegrity(): Promise<{
    valid: boolean;
    errors: string[];
  }>;
}