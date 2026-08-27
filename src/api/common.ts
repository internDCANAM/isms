import {z, type ZodType} from 'zod';
import type {PageQuery} from '../store/records.js';
import {Applicability, AssessmentPhase, AssetCategory, ControlStatus} from '../domain.js';
import {DocumentStatus, Likert, NonconformityState, RiskLevel} from '../domain.js';
import {Theme, TreatmentOption} from '../domain.js';

export const isoDate = z
  .date()
  .transform((d) => d.toISOString());
export const isoDateOrNull = z.
  date().nullable()
  .transform((d) => d?.toISOString() ?? null);
export const minorUnitsOrNull = z
  .bigint()
  .nullable()
  .transform((v) => (v === null ? null : Number(v)));
export const uuidParamsSchema = z.object({id: z.uuid()});

export const ErrorCode = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED:     'UNAUTHORIZED',
  FORBIDDEN:        'FORBIDDEN',
  NOT_FOUND:        'NOT_FOUND',
  RATE_LIMITED:     'RATE_LIMITED',
  INTERNAL_ERROR:   'INTERNAL_ERROR',
} as const;
export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode];

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export interface ApiErrorBody {
  error: string;
  code: ErrorCode;
  statusCode: number;
  details?: unknown;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; totalPages: number; };
}

export function toPaginated<T>(
  page: { rows: unknown[]; total: number; },
  query: PageQuery,
  schema: ZodType<T>
): Paginated<T> {
  return {
    data: schema.array().parse(page.rows),
    pagination: {
      page: query.page,
      limit: query.limit,
      total: page.total,
      totalPages: Math.ceil(page.total / query.limit),
    }
  };
}

export interface DomainConfig {
  themes: Theme[];
  treatmentOptions: TreatmentOption[];
  assessmentPhases: AssessmentPhase[];
  riskLevels: RiskLevel[];
  assetCategories: AssetCategory[];
  applicability: Applicability[];
  controlStatuses: ControlStatus[];
  documentStatuses: DocumentStatus[];
  nonconformityStates: NonconformityState[];
  likert: { min: number; max: number; };
}

export function domainConfig(): DomainConfig {
  return {
    themes:               Object.values(Theme),
    treatmentOptions:     Object.values(TreatmentOption),
    assessmentPhases:     Object.values(AssessmentPhase),
    riskLevels:           Object.values(RiskLevel),
    assetCategories:      Object.values(AssetCategory),
    applicability:        Object.values(Applicability),
    controlStatuses:      Object.values(ControlStatus),
    documentStatuses:     Object.values(DocumentStatus),
    nonconformityStates:  Object.values(NonconformityState),
    likert: {min: Likert.MIN, max: Likert.MAX},
  };
}
