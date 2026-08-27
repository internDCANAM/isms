import type {Applicability, AssessmentPhase, AssetCategory, AuditTable, CommentParent, ControlStatus, DocumentStatus, NonconformityState, SecurityEventSeverity, SecurityEventType, Theme, TreatmentOption} from '../domain.js';

/********************************************************************************
 * What the store holds. Route handlers never see these directly — they receive *
 * the hydrated forms below, which carry the joined display fields the DTO      *
 * schemas parse. Keeping the two apart is what lets a Prisma implementation    *
 * return the same hydrated shape from an `include` without changing a caller.  *
 ********************************************************************************/

export interface RiskRecord {
  id: string;
  reference: string;
  title: string;
  description: string;
  theme: Theme;
  ownerId: string | null;
  assetIds: string[];
  controlIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface AssessmentRecord {
  id: string;
  riskId: string;
  phase: AssessmentPhase;
  likelihood: number;
  impact: number;
  economicImpactMinor: bigint | null;
  assessedAt: Date;
}

export interface TreatmentRecord {
  id: string;
  riskId: string;
  option: TreatmentOption;
  action: string;
  plannedDate: Date | null;
  actualDate: Date | null;
  note: string | null;
  createdAt: Date;
}

export interface AssetRecord {
  id: string;
  reference: string;
  name: string;
  description: string | null;
  category: AssetCategory;
  theme: Theme;
  ownerId: string | null;
  classification: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ControlRecord {
  id: string;
  reference: string;
  title: string;
  purpose: string;
  theme: Theme;
  applicability: Applicability;
  justification: string;
  status: ControlStatus;
  ownerId: string | null;
  implementation: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface NonconformityRecord {
  id: string;
  reference: string;
  title: string;
  description: string;
  theme: Theme;
  state: NonconformityState;
  raisedById: string | null;
  raisedAt: Date;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ActionRecord {
  id: string;
  nonconformityId: string;
  description: string;
  rootCause: string | null;
  assignedToId: string | null;
  dueDate: Date | null;
  completedAt: Date | null;
  createdAt: Date;
}

export interface DocumentRecord {
  id: string;
  reference: string;
  title: string;
  version: string;
  status: DocumentStatus;
  ownerId: string | null;
  approvedAt: Date | null;
  nextReviewAt: Date | null;
  storageKey: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string | null;
  riskId: string | null;
  controlId: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentRecord {
  id: string;
  authorId: string;
  body: string;
  riskId: string | null;
  nonconformityId: string | null;
  createdAt: Date;
}

export interface AuditRecord {
  id: string;
  tableName: AuditTable;
  recordId: string;
  changedBy: string;
  fieldName: string;
  oldValueHash: string | null;
  newValueHash: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

export interface SecurityEventRecord {
  id: string;
  eventType: SecurityEventType;
  severity: SecurityEventSeverity;
  userId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  path: string | null;
  method: string | null;
  message: string;
  createdAt: Date;
}

export interface PageQuery {
  page: number;
  limit: number;
}

export interface Page<T> {
  rows: T[];
  total: number;
}

/********************************************************************************
 * joined display fields. resolved by whichever repository serves the read      *
 ********************************************************************************/

export interface HydratedRisk extends RiskRecord {
  ownerName: string | null;
  assessments: AssessmentRecord[];
  treatments: TreatmentRecord[];
}
export interface HydratedNonconformity extends NonconformityRecord {
  raisedByName: string | null;
  actions: HydratedAction[];
}
export interface HydratedDocument extends DocumentRecord {
  ownerName: string | null;
}
export interface HydratedComment extends CommentRecord {
  authorName: string;
}
export interface HydratedAudit extends AuditRecord {
  changedByName: string | null;
}
export interface HydratedAsset extends AssetRecord {
  ownerName: string | null;riskCount: number;
}
export interface HydratedControl extends ControlRecord {
  ownerName: string | null;riskCount: number;
}
export interface HydratedAction extends ActionRecord {
  assignedToName: string | null;
}

/********************************************************************************
 * Write payloads. Ids, references, and timestamps are the store's to assign    *
 ********************************************************************************/

export interface NewRisk {
  title: string;
  description: string;
  theme: Theme;
  ownerId: string | null;
  assetIds: string[];
  controlIds: string[];
}

export interface NewAssessment {
  phase: AssessmentPhase;
  likelihood: number;
  impact: number;
  economicImpactMinor: bigint | null;
}


export interface NewNonconformity {
  title: string;
  description: string;
  theme: Theme;
  state: NonconformityState;
  closedAt: Date | null;
  raisedById: string | null;
}

export interface NewComment {
  authorId: string;
  body: string;
  parent: CommentParent;
  parentId: string;
}

export type NewTreatment = Omit<TreatmentRecord, 'id' | 'riskId' | 'createdAt'>;
export type NewAction = Omit<ActionRecord, 'id' | 'nonconformityId' | 'createdAt'>;
