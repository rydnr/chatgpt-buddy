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
import { AuditRepository } from './domain/audit-repository';

/**
 * Security Event Analyzer
 * 
 * Analyzes audit events for security threats, anomalies, and patterns
 * that may indicate malicious activity or security vulnerabilities.
 */
export class SecurityEventAnalyzer {
  private readonly threatPatterns: ThreatPattern[];
  private readonly anomalyDetectors: AnomalyDetector[];

  constructor(private auditRepository: AuditRepository) {
    this.threatPatterns = this.initializeThreatPatterns();
    this.anomalyDetectors = this.initializeAnomalyDetectors();
  }

  /**
   * Analyzes an audit event for security threats
   */
  async analyzeEvent(entry: AuditEntry): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];

    // Check against known threat patterns
    for (const pattern of this.threatPatterns) {
      if (pattern.matches(entry)) {
        const threat = await this.evaluateThreat(entry, pattern);
        if (threat) {
          threats.push(threat);
        }
      }
    }

    // Run anomaly detection
    for (const detector of this.anomalyDetectors) {
      const anomalies = await detector.detect(entry, this.auditRepository);
      threats.push(...anomalies);
    }

    // Correlate with recent events
    const correlatedThreats = await this.correlateWithRecentEvents(entry);
    threats.push(...correlatedThreats);

    return threats;
  }

  /**
   * Evaluates a potential threat
   */
  private async evaluateThreat(
    entry: AuditEntry,
    pattern: ThreatPattern
  ): Promise<SecurityThreat | null> {
    // Get historical context
    const context = await this.getHistoricalContext(entry, pattern);
    
    // Calculate threat score
    const score = pattern.calculateScore(entry, context);
    
    if (score >= pattern.threshold) {
      return {
        id: `threat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        type: pattern.type,
        severity: pattern.severity,
        description: pattern.description,
        detectedAt: new Date(),
        auditEntryId: entry.id,
        score,
        evidence: {
          pattern: pattern.name,
          matches: pattern.getMatches(entry),
          context
        },
        recommendations: pattern.recommendations,
        riskScore: Math.min(100, score * pattern.severity)
      };
    }

    return null;
  }

  /**
   * Gets historical context for threat evaluation
   */
  private async getHistoricalContext(
    entry: AuditEntry,
    pattern: ThreatPattern
  ): Promise<ThreatContext> {
    const timeWindow = new Date(Date.now() - pattern.contextWindow);
    
    // Get related events
    let relatedEvents: AuditEntry[] = [];
    
    if (entry.userId) {
      const userEvents = await this.auditRepository.findByUserId(
        entry.userId,
        100
      );
      relatedEvents.push(...userEvents.filter(e => 
        e.timestamp >= timeWindow && e.id !== entry.id
      ));
    }
    
    if (entry.clientId) {
      const clientEvents = await this.auditRepository.findByClientId(
        entry.clientId,
        100
      );
      relatedEvents.push(...clientEvents.filter(e => 
        e.timestamp >= timeWindow && 
        e.id !== entry.id &&
        !relatedEvents.find(re => re.id === e.id)
      ));
    }

    // Calculate statistics
    const failureCount = relatedEvents.filter(e => !e.success).length;
    const similarEvents = relatedEvents.filter(e => 
      e.eventType === entry.eventType && 
      e.eventSubtype === entry.eventSubtype
    ).length;

    return {
      timeWindow,
      relatedEvents: relatedEvents.length,
      failureCount,
      similarEvents,
      averageRiskScore: relatedEvents.length > 0
        ? relatedEvents.reduce((sum, e) => sum + e.riskScore, 0) / relatedEvents.length
        : 0,
      patterns: this.extractPatterns(relatedEvents)
    };
  }

  /**
   * Correlates with recent events for advanced threat detection
   */
  private async correlateWithRecentEvents(
    entry: AuditEntry
  ): Promise<SecurityThreat[]> {
    const threats: SecurityThreat[] = [];
    const correlationWindow = new Date(Date.now() - 300000); // 5 minutes

    // Check for brute force attacks
    if (entry.eventType === 'SECURITY_VALIDATION' && 
        entry.eventSubtype === 'authentication' &&
        !entry.success) {
      
      const recentFailures = await this.auditRepository.findByFilters({
        startDate: correlationWindow,
        endDate: new Date(),
        eventType: 'SECURITY_VALIDATION',
        outcome: 'FAILURE',
        userId: entry.userId || undefined
      });

      if (recentFailures.total >= 5) {
        threats.push({
          id: `threat-bruteforce-${Date.now()}`,
          type: 'BRUTE_FORCE_ATTACK',
          severity: 8,
          description: 'Multiple failed authentication attempts detected',
          detectedAt: new Date(),
          auditEntryId: entry.id,
          score: 85,
          evidence: {
            failedAttempts: recentFailures.total,
            timeWindow: '5 minutes',
            affectedUser: entry.userId || 'unknown'
          },
          recommendations: [
            'Temporarily lock the user account',
            'Require additional authentication factors',
            'Alert security team immediately'
          ],
          riskScore: 85
        });
      }
    }

    // Check for privilege escalation attempts
    if (entry.eventType === 'SECURITY_VALIDATION' && 
        entry.eventSubtype === 'authorization' &&
        !entry.success &&
        entry.details.requestedPermission) {
      
      const recentEscalations = await this.auditRepository.findByFilters({
        startDate: correlationWindow,
        endDate: new Date(),
        eventType: 'SECURITY_VALIDATION',
        outcome: 'FAILURE',
        userId: entry.userId || undefined
      });

      const escalationAttempts = recentEscalations.entries.filter(e => 
        e.details.requestedPermission && 
        e.details.requestedPermission.includes('admin')
      );

      if (escalationAttempts.length >= 3) {
        threats.push({
          id: `threat-escalation-${Date.now()}`,
          type: 'PRIVILEGE_ESCALATION_ATTEMPT',
          severity: 9,
          description: 'Multiple unauthorized privilege escalation attempts',
          detectedAt: new Date(),
          auditEntryId: entry.id,
          score: 90,
          evidence: {
            attempts: escalationAttempts.length,
            requestedPermissions: escalationAttempts.map(e => 
              e.details.requestedPermission
            )
          },
          recommendations: [
            'Review user permissions immediately',
            'Investigate potential account compromise',
            'Enable additional monitoring for this user'
          ],
          riskScore: 90
        });
      }
    }

    return threats;
  }

  /**
   * Extracts patterns from related events
   */
  private extractPatterns(events: AuditEntry[]): EventPattern[] {
    const patterns: EventPattern[] = [];

    // Time-based patterns
    const hourlyDistribution = new Array(24).fill(0);
    events.forEach(e => {
      const hour = e.timestamp.getHours();
      hourlyDistribution[hour]++;
    });

    // Find unusual activity hours
    const avgActivity = events.length / 24;
    const unusualHours = hourlyDistribution
      .map((count, hour) => ({ hour, count }))
      .filter(h => h.count > avgActivity * 3)
      .map(h => h.hour);

    if (unusualHours.length > 0) {
      patterns.push({
        type: 'UNUSUAL_TIME_PATTERN',
        description: `Unusual activity detected during hours: ${unusualHours.join(', ')}`,
        confidence: 0.8
      });
    }

    // IP address patterns
    const ipAddresses = new Map<string, number>();
    events.forEach(e => {
      const count = ipAddresses.get(e.ipAddress) || 0;
      ipAddresses.set(e.ipAddress, count + 1);
    });

    // Check for distributed sources
    if (ipAddresses.size > 10 && events.length > 20) {
      patterns.push({
        type: 'DISTRIBUTED_SOURCE',
        description: `Activity from ${ipAddresses.size} different IP addresses`,
        confidence: 0.9
      });
    }

    return patterns;
  }

  /**
   * Initializes threat patterns
   */
  private initializeThreatPatterns(): ThreatPattern[] {
    return [
      {
        name: 'SQL_INJECTION_ATTEMPT',
        type: 'SQL_INJECTION',
        severity: 9,
        description: 'Potential SQL injection attempt detected',
        threshold: 70,
        contextWindow: 3600000, // 1 hour
        matches: (entry) => {
          if (entry.eventType !== 'INPUT_VALIDATION_FAILED') return false;
          const input = JSON.stringify(entry.details).toLowerCase();
          return /(\'|\"|\;|\-\-|\bunion\b|\bselect\b|\bdrop\b)/i.test(input);
        },
        calculateScore: (entry, context) => {
          let score = 50;
          if (context.similarEvents > 3) score += 30;
          if (context.failureCount > 5) score += 20;
          return score;
        },
        getMatches: (entry) => {
          const input = JSON.stringify(entry.details);
          const matches = input.match(/(\'|\"|\;|\-\-|\bunion\b|\bselect\b|\bdrop\b)/gi);
          return matches || [];
        },
        recommendations: [
          'Review input validation rules',
          'Enable SQL injection prevention filters',
          'Block source IP if patterns persist'
        ]
      },
      {
        name: 'XSS_ATTEMPT',
        type: 'CROSS_SITE_SCRIPTING',
        severity: 8,
        description: 'Potential XSS attack detected',
        threshold: 60,
        contextWindow: 3600000,
        matches: (entry) => {
          if (entry.eventType !== 'INPUT_VALIDATION_FAILED') return false;
          const input = JSON.stringify(entry.details).toLowerCase();
          return /<script|<iframe|javascript:|onerror=|onclick=/i.test(input);
        },
        calculateScore: (entry, context) => {
          let score = 40;
          if (context.similarEvents > 2) score += 30;
          if (entry.details.targetField === 'userInput') score += 30;
          return score;
        },
        getMatches: (entry) => {
          const input = JSON.stringify(entry.details);
          const matches = input.match(/<script|<iframe|javascript:|onerror=|onclick=/gi);
          return matches || [];
        },
        recommendations: [
          'Enable XSS protection headers',
          'Sanitize all user inputs',
          'Review Content Security Policy'
        ]
      },
      {
        name: 'ABNORMAL_DATA_ACCESS',
        type: 'DATA_EXFILTRATION',
        severity: 9,
        description: 'Abnormal data access pattern detected',
        threshold: 75,
        contextWindow: 7200000, // 2 hours
        matches: (entry) => {
          return entry.eventType === 'DATA_ACCESS' &&
                 entry.details.recordCount > 1000;
        },
        calculateScore: (entry, context) => {
          let score = 30;
          const recordCount = entry.details.recordCount || 0;
          if (recordCount > 5000) score += 40;
          if (recordCount > 10000) score += 30;
          if (context.similarEvents === 0) score += 20; // First time
          return score;
        },
        getMatches: (entry) => {
          return [`${entry.details.recordCount} records accessed`];
        },
        recommendations: [
          'Review data access permissions',
          'Implement rate limiting for data queries',
          'Alert data owner for verification'
        ]
      }
    ];
  }

  /**
   * Initializes anomaly detectors
   */
  private initializeAnomalyDetectors(): AnomalyDetector[] {
    return [
      {
        name: 'GEOGRAPHIC_ANOMALY',
        detect: async (entry, repository) => {
          if (!entry.userId || entry.ipAddress === 'internal') return [];

          // Get user's recent locations
          const recentEvents = await repository.findByUserId(entry.userId, 10);
          const locations = recentEvents
            .filter(e => e.ipAddress !== 'internal')
            .map(e => this.getGeolocation(e.ipAddress));

          // Check for impossible travel
          const currentLocation = this.getGeolocation(entry.ipAddress);
          for (const event of recentEvents) {
            const timeDiff = entry.timestamp.getTime() - event.timestamp.getTime();
            const location = this.getGeolocation(event.ipAddress);
            const distance = this.calculateDistance(currentLocation, location);
            const speed = distance / (timeDiff / 3600000); // km/h

            if (speed > 1000) { // Faster than commercial flight
              return [{
                id: `anomaly-geo-${Date.now()}`,
                type: 'IMPOSSIBLE_TRAVEL',
                severity: 7,
                description: 'User location changed impossibly fast',
                detectedAt: new Date(),
                auditEntryId: entry.id,
                score: 80,
                evidence: {
                  previousLocation: location,
                  currentLocation,
                  timeDifference: `${Math.round(timeDiff / 60000)} minutes`,
                  distance: `${Math.round(distance)} km`,
                  impliedSpeed: `${Math.round(speed)} km/h`
                },
                recommendations: [
                  'Verify user identity',
                  'Check for account sharing',
                  'Enable location-based access controls'
                ],
                riskScore: 80
              }];
            }
          }

          return [];
        }
      },
      {
        name: 'BEHAVIORAL_ANOMALY',
        detect: async (entry, repository) => {
          if (!entry.userId) return [];

          // Analyze user behavior patterns
          const historicalEvents = await repository.findByUserId(entry.userId, 100);
          const hourlyActivity = new Array(24).fill(0);
          historicalEvents.forEach(e => {
            hourlyActivity[e.timestamp.getHours()]++;
          });

          // Check if current activity is anomalous
          const currentHour = entry.timestamp.getHours();
          const expectedActivity = hourlyActivity[currentHour] / historicalEvents.length;
          
          if (expectedActivity < 0.01 && historicalEvents.length > 50) {
            return [{
              id: `anomaly-behavior-${Date.now()}`,
              type: 'UNUSUAL_ACTIVITY_TIME',
              severity: 5,
              description: 'User activity at unusual time',
              detectedAt: new Date(),
              auditEntryId: entry.id,
              score: 60,
              evidence: {
                activityHour: currentHour,
                historicalActivityRate: expectedActivity,
                sampleSize: historicalEvents.length
              },
              recommendations: [
                'Monitor for additional anomalies',
                'Verify user activity is authorized',
                'Consider additional authentication'
              ],
              riskScore: 60
            }];
          }

          return [];
        }
      }
    ];
  }

  /**
   * Mock geolocation lookup (replace with actual service)
   */
  private getGeolocation(ipAddress: string): { lat: number; lon: number } {
    // Mock implementation - replace with actual IP geolocation service
    const hash = ipAddress.split('.').reduce((sum, octet) => sum + parseInt(octet), 0);
    return {
      lat: (hash % 180) - 90,
      lon: (hash % 360) - 180
    };
  }

  /**
   * Calculates distance between two coordinates
   */
  private calculateDistance(
    loc1: { lat: number; lon: number },
    loc2: { lat: number; lon: number }
  ): number {
    const R = 6371; // Earth radius in km
    const dLat = (loc2.lat - loc1.lat) * Math.PI / 180;
    const dLon = (loc2.lon - loc1.lon) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(loc1.lat * Math.PI / 180) * Math.cos(loc2.lat * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Type definitions
interface ThreatPattern {
  name: string;
  type: string;
  severity: number;
  description: string;
  threshold: number;
  contextWindow: number;
  matches: (entry: AuditEntry) => boolean;
  calculateScore: (entry: AuditEntry, context: ThreatContext) => number;
  getMatches: (entry: AuditEntry) => string[];
  recommendations: string[];
}

interface ThreatContext {
  timeWindow: Date;
  relatedEvents: number;
  failureCount: number;
  similarEvents: number;
  averageRiskScore: number;
  patterns: EventPattern[];
}

interface EventPattern {
  type: string;
  description: string;
  confidence: number;
}

interface SecurityThreat {
  id: string;
  type: string;
  severity: number;
  description: string;
  detectedAt: Date;
  auditEntryId: string;
  score: number;
  evidence: any;
  recommendations: string[];
  riskScore: number;
}

interface AnomalyDetector {
  name: string;
  detect: (entry: AuditEntry, repository: AuditRepository) => Promise<SecurityThreat[]>;
}