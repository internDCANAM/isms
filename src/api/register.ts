import {z} from 'zod';
import {Applicability, AssetCategory, ControlStatus, DocumentStatus, Theme} from '../domain.js';
import {isoDate, isoDateOrNull} from './common.js';

export const assetSchema = z.object({
  id: z.string(),
  reference: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  category: z.enum(AssetCategory),
  theme: z.enum(Theme),
  ownerId: z.string().nullable(),
  ownerName: z.string().nullable(),
  classification: z.string().nullable(),
  riskCount: z.number().int(),
  createdAt: isoDate,
});
export type Asset = z.infer<typeof assetSchema>;

export const controlSchema = z.object({
  id: z.string(),
  reference: z.string(),
  title: z.string(),
  purpose: z.string(),
  theme: z.enum(Theme),
  applicability: z.enum(Applicability),
  justification: z.string(),
  status: z.enum(ControlStatus),
  ownerId: z.string().nullable(),
  ownerName: z.string().nullable(),
  implementation: z.string().nullable(),
  riskCount: z.number().int(),
  createdAt: isoDate,
});

export const documentSchema = z.object({
  id: z.string(),
  reference: z.string(),
  title: z.string(),
  version: z.string(),
  status: z.enum(DocumentStatus),
  ownerId: z.string().nullable(),
  ownerName: z.string().nullable(),
  approvedAt: isoDateOrNull,
  nextReviewAt: isoDateOrNull,
  mimeType: z.string(),
  sizeBytes: z.number().int(),
  riskId: z.string().nullable(),
  controlId: z.string().nullable(),
  createdAt: isoDate,
});
