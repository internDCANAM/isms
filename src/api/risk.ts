import {z} from 'zod';
import {AssessmentPhase, Likert, RiskLevel, Theme, TreatmentOption} from '../domain.js';
import {isoDate, isoDateOrNull, minorUnitsOrNull} from './common.js';

const likert = z.number().int().min(Likert.MIN).max(Likert.MAX);

export const riskAssessmentSchema = z.object({
  id: z.string(),
  riskId: z.string(),
  phase: z.enum(AssessmentPhase),
  likelihood: likert,
  impact: likert,
  score: z.number().int(),
  level: z.enum(RiskLevel),
  economicImpactMinor: minorUnitsOrNull,
  assessedAt: isoDate,
});

export const treatmentSchema = z.object({
  id: z.string(),
  riskId: z.string(),
  option: z.enum(TreatmentOption),
  action: z.string(),
  plannedDate: isoDateOrNull,
  actualDate: isoDateOrNull,
  note: z.string().nullable(),
  createdAt: isoDate,
});

export const riskSummarySchema = z.object({
  id: z.string(),
  reference: z.string(),
  title: z.string(),
  theme: z.enum(Theme),
  ownerId: z.string().nullable(),
  ownerName: z.string().nullable(),
  inherentLevel: z.enum(RiskLevel).nullable(),
  residualLevel: z.enum(RiskLevel).nullable(),
  treatmentCount: z.number().int(),
  createdAt: isoDate,
});

export const riskDetailSchema = riskSummarySchema.extend({
  description: z.string(),
  updatedAt: isoDate,
  assessments: z.array(riskAssessmentSchema),
  treatments: z.array(treatmentSchema),
  assetIds: z.array(z.string()),
  controlIds: z.array(z.string()),
});

export const riskInputSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().min(1).max(5000),
  theme: z.enum(Theme),
  ownerId: z.string().nullable().optional(),
  assetIds: z.array(z.string()).optional(),
  controlIds: z.array(z.string()).optional(),
});
export const riskPatchSchema = riskInputSchema.partial();

export const assessmentInputSchema = z.object({
  phase: z.enum(AssessmentPhase),
  likelihood: likert,
  impact: likert,
  economicImpactMinor: z.number().int().nonnegative().nullable().optional(),
});

export const treatmentInputSchema = z.object({
  option: z.enum(TreatmentOption),
  action: z.string().min(1).max(2000),
  plannedDate: z.coerce.date().nullable().optional(),
  actualDate: z.coerce.date().nullable().optional(),
  note: z.string().max(2000).nullable().optional(),
});

export type RiskDetail = z.infer<typeof riskDetailSchema>;
