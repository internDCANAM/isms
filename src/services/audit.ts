import {createHash} from 'node:crypto';
import {logger} from '../lib/logger.js';
import type {AuditTable, SecurityEventSeverity, SecurityEventType} from '../domain.js';
import type {AuditRepository} from '../store/repository.js';

/**
 * A one-way SHA-256 fingerprint. The trail records that a field changed and
 * can verify what it changed to. without storing the value itself.
 */
export function hashForAudit(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

type AuditableValue =
  string | number | bigint | boolean | Date | readonly string[] | null | undefined;

export interface Actor {
  userId: string;
  ipAddress: string | null;
  userAgent: string | null;
}

export interface RequestOrigin {
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  path: string;
  method: string;
}

export interface AuditChange {
  tableName: AuditTable;
  recordId: string;
  actor: Actor;
  before: Record<string, AuditableValue>;
  patch: Record<string, AuditableValue>;
}

function stringify(value: AuditableValue): string | null {
  if (value == null) return null;
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.join(',');
  return String(value);
}

/**
 * ISO/IEC 27001 A.8.15. Diffs `patch` against `before` and writes one entry per
 * field whose value actually changed. A field absent from `patch` is treated as
 * "not being updated" rather than "cleared".
 */
export async function auditChanges(
  audit: AuditRepository,
  {tableName, recordId, actor, before, patch}: AuditChange
): Promise<void> {
  const changed = Object.entries(patch).filter(
    ([field, value]) => value !== undefined && stringify(value) !== stringify(before[field])
  );

  await Promise.all(changed.map(([fieldName, newValue]) => {
    const oldValue = stringify(before[fieldName]);
    const next = stringify(newValue);
    return audit.write({
      tableName,
      recordId,
      changedBy: actor.userId,
      fieldName,
      oldValueHash: oldValue === null ? null : hashForAudit(oldValue),
      newValueHash: next === null ? null : hashForAudit(next),
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }));
}

export interface AuditDeletion {
  tableName: AuditTable;
  recordId: string;
  actor: Actor;
  before: Record<string, AuditableValue>;
}

/**
 * ISO/IEC 27001 A.8.15. A removed record leaves one entry per field it held,
 * each recording the transition to absent.
 */
export async function auditDeletion(
  audit: AuditRepository,
  {tableName, recordId, actor, before}: AuditDeletion
): Promise<void> {
  await Promise.all(Object.entries(before).map(([fieldName, value]) => {
    const oldValue = stringify(value);
    return audit.write({
      tableName,
      recordId,
      changedBy: actor.userId,
      fieldName,
      oldValueHash: oldValue === null ? null : hashForAudit(oldValue),
      newValueHash: null,
      ipAddress: actor.ipAddress,
      userAgent: actor.userAgent,
    });
  }));
}

export interface SecurityEventInput {
  origin: RequestOrigin;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  message: string;
}

/**
 * ISO/IEC 27001 A.8.16. Recording a security event must never be what breaks a
 * request, so a failure here is logged and swallowed.
 */
export async function recordSecurityEvent(
  audit: AuditRepository,
  {origin, eventType, severity, message}: SecurityEventInput
): Promise<void> {
  try {
    await audit.recordSecurityEvent({
      eventType,
      severity,
      userId: origin.userId,
      ipAddress: origin.ipAddress,
      userAgent: origin.userAgent,
      path: origin.path,
      method: origin.method,
      message,
    });

    logger.warn('Security event', {eventType, severity, ip: origin.ipAddress, path: origin.path});
  } catch (err) {
    logger.error('Failed to record security event', {
      eventType,
      message: err instanceof Error ? err.message : String(err),
    });
  }
}
