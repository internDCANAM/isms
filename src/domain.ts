/********************************************************************************
 * Domain vocabulary                                                            *
 *                                                                              *
 * Taken from ISO/IEC 27001:2022 and ISO/IEC 27005, except where a constant is  *
 * marked as ours. `prisma/schema.prisma` holds the same enums in the same      *
 * order, minus the two at the foot of this file and `RiskLevel`, which is      *
 * derived rather than stored.                                                  *
 ********************************************************************************/

/**
 * ISO/IEC 27001:2022 reorganised Annex A into four control themes. The same
 * four classify risks, controls, and assets, so one taxonomy covers all three.
 */
export const Theme = {
  ORGANIZATIONAL: 'ORGANIZATIONAL', // Annex A 5.x
  PEOPLE:         'PEOPLE',         // Annex A 6.x
  PHYSICAL:       'PHYSICAL',       // Annex A 7.x
  TECHNOLOGICAL:  'TECHNOLOGICAL',  // Annex A 8.x
} as const;
export type Theme = (typeof Theme)[keyof typeof Theme];

/********************************************************************************
 * Risk assessment and treatment, ISO/IEC 27005                                 *
 ********************************************************************************/

/** Each risk is scored twice: as it stands, and assuming treatment lands. */
export const AssessmentPhase = {
  INHERENT: 'INHERENT', // before treatment
  RESIDUAL: 'RESIDUAL', // after the planned treatment
} as const;
export type AssessmentPhase = (typeof AssessmentPhase)[keyof typeof AssessmentPhase];

/** Both axes of the matrix, likelihood and impact, run over this scale. */
export const Likert = {MIN: 1, MAX: 5} as const;

export function riskScore(likelihood: number, impact: number): number {
  return likelihood * impact;
}

/**
 * Banded from the score, never stored, so a level cannot drift from the two
 * numbers it came from. `prisma/schema.prisma` has no matching enum.
 * Shares its member names with `SecurityEventSeverity` and nothing else.
 */
export const RiskLevel = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type RiskLevel = (typeof RiskLevel)[keyof typeof RiskLevel];

/**
 * A 5x5 likelihood/impact matrix produces only fourteen distinct scores:
 * 1 2 3 4 5 6 8 9 10 12 15 16 20 25. The bands are drawn over those.
 */
export function riskLevel(score: number): RiskLevel {
  if (score <= 4) return RiskLevel.LOW;
  if (score <= 9) return RiskLevel.MEDIUM;
  if (score <= 15) return RiskLevel.HIGH;
  return RiskLevel.CRITICAL;
}

/** The four treatment options, each recorded with a planned and actual date. */
export const TreatmentOption = {
  MODIFY: 'MODIFY', // apply controls to lower the risk
  RETAIN: 'RETAIN', // accept it at its current level
  AVOID:  'AVOID',  // stop doing the thing that carries it
  SHARE:  'SHARE',  // transfer it, by insurance or contract
} as const;
export type TreatmentOption = (typeof TreatmentOption)[keyof typeof TreatmentOption];

/********************************************************************************
 * The registers: assets, controls, documents, nonconformities                  *
 ********************************************************************************/

/** ISO/IEC 27005 asset types. */
export const AssetCategory = {
  INFORMATION: 'INFORMATION',
  SOFTWARE:    'SOFTWARE',
  HARDWARE:    'HARDWARE',
  SERVICE:     'SERVICE',
  PEOPLE:      'PEOPLE',
  FACILITY:    'FACILITY',
} as const;
export type AssetCategory = (typeof AssetCategory)[keyof typeof AssetCategory];

/**
 * Clause 6.1.3 d. Every Annex A control carries one of these with a written
 * justification; the two together are the Statement of Applicability.
 */
export const Applicability = {
  APPLICABLE: 'APPLICABLE',
  EXCLUDED:   'EXCLUDED',
} as const;
export type Applicability = (typeof Applicability)[keyof typeof Applicability];

/** How far an applicable control has got. Ours; ISO names no such states. */
export const ControlStatus = {
  NOT_STARTED: 'NOT_STARTED',
  IN_PROGRESS: 'IN_PROGRESS',
  IMPLEMENTED: 'IMPLEMENTED',
  VERIFIED:    'VERIFIED',
} as const;
export type ControlStatus = (typeof ControlStatus)[keyof typeof ControlStatus];

/**
 * Clause 7.5 requires documented information be approved and reviewed. These
 * are the states we track that against; ISO names none of them.
 */
export const DocumentStatus = {
  DRAFT:     'DRAFT',
  IN_REVIEW: 'IN_REVIEW',
  APPROVED:  'APPROVED',
  RETIRED:   'RETIRED',
} as const;
export type DocumentStatus = (typeof DocumentStatus)[keyof typeof DocumentStatus];

/** Clause 10.2. A nonconformity closes once its corrective actions land. */
export const NonconformityState = {
  OPEN:        'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED:      'CLOSED',
} as const;
export type NonconformityState = (typeof NonconformityState)[keyof typeof NonconformityState];

/********************************************************************************
 * Audit trail (A.8.15) and monitoring (A.8.16)                                 *
 ********************************************************************************/

export const SecurityEventSeverity = {
  LOW:      'LOW',
  MEDIUM:   'MEDIUM',
  HIGH:     'HIGH',
  CRITICAL: 'CRITICAL',
} as const;
export type SecurityEventSeverity =
  (typeof SecurityEventSeverity)[keyof typeof SecurityEventSeverity];

/** A.8.16 monitoring. Rate-limit breaches are the only source so far. */
export const SecurityEventType = {
  LOGIN_RATE_LIMIT_EXCEEDED:   'LOGIN_RATE_LIMIT_EXCEEDED',
  REFRESH_RATE_LIMIT_EXCEEDED: 'REFRESH_RATE_LIMIT_EXCEEDED',
  API_RATE_LIMIT_EXCEEDED:     'API_RATE_LIMIT_EXCEEDED',
  GLOBAL_RATE_LIMIT_EXCEEDED:  'GLOBAL_RATE_LIMIT_EXCEEDED',
} as const;
export type SecurityEventType = (typeof SecurityEventType)[keyof typeof SecurityEventType];

/********************************************************************************
 * Ours, with no ISO clause and no Prisma enum behind them                      *
 ********************************************************************************/

/** Which registers keep a hashed trail. The values are the table names. */
export const AuditTable = {
  RISKS:           'risks',
  NONCONFORMITIES: 'nonconformities',
} as const;
export type AuditTable = (typeof AuditTable)[keyof typeof AuditTable];

/** Which of the two a comment hangs off. One table holds both. */
export const CommentParent = {
  RISK:          'risk',
  NONCONFORMITY: 'nonconformity',
} as const;
export type CommentParent = (typeof CommentParent)[keyof typeof CommentParent];
