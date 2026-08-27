import {z} from 'zod';
import {NonconformityState, Theme} from '../domain.js';
import {isoDate, isoDateOrNull} from './common.js';

export const correctiveActionSchema = z.object({
  id: z.string(),
  nonconformityId: z.string(),
  description: z.string(),
  rootCause: z.string().nullable(),
  assignedToId: z.string().nullable(),
  assignedToName: z.string().nullable(),
  dueDate: isoDateOrNull,
  completedAt: isoDateOrNull,
  createdAt: isoDate,
});

export const nonconformitySummarySchema = z.object({
  id: z.string(),
  reference: z.string(),
  title: z.string(),
  theme: z.enum(Theme),
  state: z.enum(NonconformityState),
  raisedById: z.string().nullable(),
  raisedByName: z.string().nullable(),
  raisedAt: isoDate,
  closedAt: isoDateOrNull,
  actionCount: z.number().int(),
});

export const nonconformityDetailSchema = nonconformitySummarySchema.extend({
  description: z.string(),
  updatedAt: isoDate,
  actions: z.array(correctiveActionSchema),
});

export const nonconformityInputSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  theme: z.enum(Theme),
  state: z.enum(NonconformityState),
});
export const nonconformityPatchSchema = nonconformityInputSchema.partial();

export const correctiveActionInputSchema = z.object({
  description: z.string().min(1).max(2000),
  rootCause: z.string().max(2000).nullable().optional(),
  assignedToId: z.string().nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
  completedAt: z.coerce.date().nullable().optional(),
});

export type NonconformityDetail = z.infer<typeof nonconformityDetailSchema>;
