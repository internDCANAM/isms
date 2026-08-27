import type {Router} from 'express';
import {paginationQuerySchema, toPaginated} from '../api/common.js';
import {assessmentInputSchema, riskAssessmentSchema, riskDetailSchema, riskInputSchema, riskPatchSchema, riskSummarySchema, treatmentInputSchema, treatmentSchema} from '../api/risk.js';
import {auditEntrySchema} from '../api/trail.js';
import {requireRecord} from '../http/request.js';
import {actorOf} from '../http/auth.js';
import {commentsRouter} from './comments.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import {AssessmentPhase, AuditTable, CommentParent, riskLevel, riskScore} from '../domain.js';
import type {AuthenticatedRequest} from '../http/auth.js';
import type {AssessmentRecord, HydratedRisk} from '../store/records.js';
import type {CommentsService} from '../services/comments.js';
import type {RiskService} from '../services/risks.js';

function assessmentOf(record: AssessmentRecord) {
  const score = riskScore(record.likelihood, record.impact);
  return {...record, score, level: riskLevel(score)};
}

function levelForPhase(risk: HydratedRisk, phase: AssessmentPhase) {
  const found = risk.assessments.find((a) => a.phase === phase);
  return found ? riskLevel(riskScore(found.likelihood, found.impact)) : null;
}

function riskSummaryOf(risk: HydratedRisk) {
  return {
    id: risk.id,
    reference: risk.reference,
    title: risk.title,
    theme: risk.theme,
    ownerId: risk.ownerId,
    ownerName: risk.ownerName,
    inherentLevel: levelForPhase(risk, AssessmentPhase.INHERENT),
    residualLevel: levelForPhase(risk, AssessmentPhase.RESIDUAL),
    treatmentCount: risk.treatments.length,
    createdAt: risk.createdAt,
  };
}

function riskDetailOf(risk: HydratedRisk) {
  return {
    ...riskSummaryOf(risk),
    description: risk.description,
    updatedAt: risk.updatedAt,
    assessments: risk.assessments.map(assessmentOf),
    treatments: risk.treatments,
    assetIds: risk.assetIds,
    controlIds: risk.controlIds,
  };
}

export function risksRouter(risks: RiskService, comments: CommentsService): Router {
  const router = createRouter<AuthenticatedRequest>({
    middleware: [],
    routes: [
      {
        method: HttpMethod.GET,
        path: '/',
        status: HttpStatus.OK,
        handler: async (req) => {
          const query = paginationQuerySchema.parse(req.query);
          const page = await risks.list(query);
          return toPaginated(
            {rows: page.rows.map(riskSummaryOf), total: page.total}, query, riskSummarySchema
          );
        }
      },
      {
        method: HttpMethod.POST,
        path: '/',
        status: HttpStatus.CREATED,
        handler: async (req) => {
          const input = riskInputSchema.parse(req.body);
          const risk = await risks.create({
            title: input.title,
            description: input.description,
            theme: input.theme,
            ownerId: input.ownerId ?? null,
            assetIds: input.assetIds ?? [],
            controlIds: input.controlIds ?? [],
          }, actorOf(req));
          return riskDetailSchema.parse(riskDetailOf(risk));
        }
      },
      {
        method: HttpMethod.GET,
        path: '/:id',
        status: HttpStatus.OK,
        handler: async (req) => {
          const risk = await requireRecord(req, risks);
          return riskDetailSchema.parse(riskDetailOf(risk));
        }
      },
      {
        method: HttpMethod.PATCH,
        path: '/:id',
        status: HttpStatus.OK,
        handler: async (req) => {
          const before = await requireRecord(req, risks);
          const patch = riskPatchSchema.parse(req.body);
          const risk = await risks.update(before, patch, actorOf(req));
          return riskDetailSchema.parse(riskDetailOf(risk));
        }
      },
      {
        method: HttpMethod.DELETE,
        path: '/:id',
        status: HttpStatus.NO_CONTENT,
        handler: async (req) => {
          const risk = await requireRecord(req, risks);
          await risks.remove(risk, actorOf(req));
        }
      },
      {
        method: HttpMethod.PUT,
        path: '/:id/assessment',
        status: HttpStatus.OK,
        handler: async (req) => {
          const risk = await requireRecord(req, risks);
          const input = assessmentInputSchema.parse(req.body);
          const assessment = await risks.upsertAssessment(risk, {
            phase: input.phase,
            likelihood: input.likelihood,
            impact: input.impact,
            economicImpactMinor:
              input.economicImpactMinor == null ? null : BigInt(input.economicImpactMinor),
          }, actorOf(req));
          return riskAssessmentSchema.parse(assessmentOf(assessment));
        }
      },
      {
        method: HttpMethod.POST,
        path: '/:id/treatments',
        status: HttpStatus.CREATED,
        handler: async (req) => {
          const risk = await requireRecord(req, risks);
          const input = treatmentInputSchema.parse(req.body);
          const treatment = await risks.addTreatment(risk, {
            option: input.option,
            action: input.action,
            plannedDate: input.plannedDate ?? null,
            actualDate: input.actualDate ?? null,
            note: input.note ?? null,
          }, actorOf(req));
          return treatmentSchema.parse(treatment);
        }
      },
      {
        method: HttpMethod.GET,
        path: '/:id/audit',
        status: HttpStatus.OK,
        handler: async (req) => {
          const risk = await requireRecord(req, risks);
          return {data: auditEntrySchema.array().parse(await risks.trail(risk.id))};
        }
      }
    ]
  });

  router.use('/:id/comments', commentsRouter({
    records: risks,
    comments,
    parent: CommentParent.RISK,
    table: AuditTable.RISKS,
  }));

  return router;
}
