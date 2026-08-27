import {AuditTable} from '../domain.js';
import {auditChanges, auditDeletion} from './audit.js';
import type {Actor} from './audit.js';
import type {AuditRepository, ReadRepository, RiskRepository} from '../store/repository.js';
import type {AssessmentRecord, HydratedAudit, HydratedRisk, NewAssessment, NewRisk, NewTreatment, TreatmentRecord} from '../store/records.js';

/**
 * Every mutation writes its entry here so clause A.8.15 holds for the
 * register whatever calls it. Reads pass straight through, which is what lets
 * a route resolve `:id` against the service rather than the repository.
 */
export interface RiskService extends ReadRepository<HydratedRisk> {
  create(input: NewRisk, actor: Actor
  ): Promise<HydratedRisk>;
  update(before: HydratedRisk, patch: Partial<NewRisk>, actor: Actor
  ): Promise<HydratedRisk>;
  remove(risk: HydratedRisk, actor: Actor
  ): Promise<void>;
  upsertAssessment(risk: HydratedRisk, input: NewAssessment, actor: Actor
  ): Promise<AssessmentRecord>;
  addTreatment(risk: HydratedRisk, input: NewTreatment, actor: Actor
  ): Promise<TreatmentRecord>;
  trail(riskId: string
  ): Promise<HydratedAudit[]>;
}

function auditedFields(risk: HydratedRisk) {
  return {
    title: risk.title,
    description: risk.description,
    theme: risk.theme,
    ownerId: risk.ownerId,
    assetIds: risk.assetIds,
    controlIds: risk.controlIds,
  };
}

export function riskService(risks: RiskRepository, audit: AuditRepository): RiskService {
  return {
    list: (query) => risks.list(query),
    get: (id) => risks.get(id),
    trail: (riskId) => audit.listForRecord(AuditTable.RISKS, riskId),

    async create(input, actor) {
      const risk = await risks.create(input);
      await auditChanges(audit, {
        tableName: AuditTable.RISKS,
        recordId: risk.id,
        actor,
        before: {},
        patch: {title: risk.title, theme: risk.theme},
      });
      return risk;
    },

    async update(before, patch, actor) {
      const risk = await risks.update(before.id, patch);
      await auditChanges(audit, {
        tableName: AuditTable.RISKS,
        recordId: before.id,
        actor,
        before: auditedFields(before),
        patch: {
          title: patch.title,
          description: patch.description,
          theme: patch.theme,
          ownerId: patch.ownerId,
          assetIds: patch.assetIds,
          controlIds: patch.controlIds,
        }
      });
      return risk;
    },

    async remove(risk, actor) {
      await risks.remove(risk.id);
      await auditDeletion(audit, {
        tableName: AuditTable.RISKS,
        recordId: risk.id,
        actor,
        before: auditedFields(risk),
      });
    },

    async upsertAssessment(risk, input, actor) {
      const previous = risk.assessments.find((a) => a.phase === input.phase);
      const assessment = await risks.upsertAssessment(risk.id, input);
      const field = input.phase.toLowerCase();
      await auditChanges(audit, {
        tableName: AuditTable.RISKS,
        recordId: risk.id,
        actor,
        before: {
          [`${field}.likelihood`]: previous?.likelihood ?? null,
          [`${field}.impact`]: previous?.impact ?? null,
          [`${field}.economicImpactMinor`]: previous?.economicImpactMinor ?? null,
        },
        patch: {
          [`${field}.likelihood`]: assessment.likelihood,
          [`${field}.impact`]: assessment.impact,
          [`${field}.economicImpactMinor`]: assessment.economicImpactMinor,
        }
      });
      return assessment;
    },

    async addTreatment(risk, input, actor) {
      const treatment = await risks.addTreatment(risk.id, input);
      await auditChanges(audit, {
        tableName: AuditTable.RISKS,
        recordId: risk.id,
        actor,
        before: {},
        patch: {treatmentOption: treatment.option, treatmentAction: treatment.action},
      });
      return treatment;
    }
  };
}
