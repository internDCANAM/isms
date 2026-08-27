import type {Router} from 'express';
import {paginationQuerySchema, toPaginated} from '../api/common.js';
import {correctiveActionInputSchema, correctiveActionSchema, nonconformityDetailSchema, nonconformityInputSchema, nonconformityPatchSchema, nonconformitySummarySchema} from '../api/nonconformity.js';
import {requireRecord} from '../http/request.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import {actorOf} from '../http/auth.js';
import {commentsRouter} from './comments.js';
import {AuditTable, CommentParent} from '../domain.js';
import type {AuthenticatedRequest} from '../http/auth.js';
import type {HydratedNonconformity} from '../store/records.js';
import type {CommentsService} from '../services/comments.js';
import type {NonconformityService} from '../services/nonconformities.js';

function nonconformitySummaryOf(nc: HydratedNonconformity) {
  return {
    id: nc.id,
    reference: nc.reference,
    title: nc.title,
    theme: nc.theme,
    state: nc.state,
    raisedById: nc.raisedById,
    raisedByName: nc.raisedByName,
    raisedAt: nc.raisedAt,
    closedAt: nc.closedAt,
    actionCount: nc.actions.length,
  };
}

function nonconformityDetailOf(nc: HydratedNonconformity) {
  return {
    ...nonconformitySummaryOf(nc),
    description: nc.description,
    updatedAt: nc.updatedAt,
    actions: nc.actions,
  };
}

export function nonconformitiesRouter(
  nonconformities: NonconformityService,
  comments: CommentsService
): Router {
  const router = createRouter<AuthenticatedRequest>({
    middleware: [],
    routes: [
      {
        method: HttpMethod.GET,
        path: '/',
        status: HttpStatus.OK,
        handler: async (req) => {
          const query = paginationQuerySchema.parse(req.query);
          const page = await nonconformities.list(query);
          return toPaginated(
            {rows: page.rows.map(nonconformitySummaryOf), total: page.total},
            query,
            nonconformitySummarySchema
          );
        }
      },
      {
        method: HttpMethod.POST,
        path: '/',
        status: HttpStatus.CREATED,
        handler: async (req) => {
          const input = nonconformityInputSchema.parse(req.body);
          const nc = await nonconformities.create(input, actorOf(req));
          return nonconformityDetailSchema.parse(nonconformityDetailOf(nc));
        }
      },
      {
        method: HttpMethod.GET,
        path: '/:id',
        status: HttpStatus.OK,
        handler: async (req) => {
          const nc = await requireRecord(req, nonconformities);
          return nonconformityDetailSchema.parse(nonconformityDetailOf(nc));
        }
      },
      {
        method: HttpMethod.PATCH,
        path: '/:id',
        status: HttpStatus.OK,
        handler: async (req) => {
          const before = await requireRecord(req, nonconformities);
          const patch = nonconformityPatchSchema.parse(req.body);
          const nc = await nonconformities.update(before, patch, actorOf(req));
          return nonconformityDetailSchema.parse(nonconformityDetailOf(nc));
        }
      },
      {
        method: HttpMethod.DELETE,
        path: '/:id',
        status: HttpStatus.NO_CONTENT,
        handler: async (req) => {
          const nc = await requireRecord(req, nonconformities);
          await nonconformities.remove(nc, actorOf(req));
        }
      },
      {
        method: HttpMethod.POST,
        path: '/:id/actions',
        status: HttpStatus.CREATED,
        handler: async (req) => {
          const nc = await requireRecord(req, nonconformities);
          const input = correctiveActionInputSchema.parse(req.body);
          const action = await nonconformities.addAction(nc, {
            description: input.description,
            rootCause: input.rootCause ?? null,
            assignedToId: input.assignedToId ?? null,
            dueDate: input.dueDate ?? null,
            completedAt: input.completedAt ?? null,
          }, actorOf(req));
          return correctiveActionSchema.parse(action);
        }
      }
    ]
  });

  router.use('/:id/comments', commentsRouter({
    records: nonconformities,
    comments,
    parent: CommentParent.NONCONFORMITY,
    table: AuditTable.NONCONFORMITIES,
  }));

  return router;
}
