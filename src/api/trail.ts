import {z} from 'zod';
import {isoDate} from './common.js';
import {AuditTable, SecurityEventSeverity, SecurityEventType} from '../domain.js';

export const commentSchema = z.object({
  id: z.string(),
  authorId: z.string(),
  authorName: z.string(),
  body: z.string(),
  riskId: z.string().nullable(),
  nonconformityId: z.string().nullable(),
  createdAt: isoDate,
});
export const commentInputSchema = z.object({body: z.string().min(1).max(4000)});

export const auditEntrySchema = z.object({
  id: z.string(),
  tableName: z.enum(AuditTable),
  recordId: z.string(),
  changedBy: z.string(),
  changedByName: z.string().nullable(),
  fieldName: z.string(),
  oldValueHash: z.string().nullable(),
  newValueHash: z.string().nullable(),
  ipAddress: z.string().nullable(),
  userAgent: z.string().nullable(),
  createdAt: isoDate,
});

export const securityEventSchema = z.object({
  id: z.string(),
  eventType: z.enum(SecurityEventType),
  severity: z.enum(SecurityEventSeverity),
  ipAddress: z.string().nullable(),
  path: z.string().nullable(),
  method: z.string().nullable(),
  message: z.string(),
  createdAt: isoDate,
});

