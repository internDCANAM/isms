import type {Router} from 'express';
import {paginationQuerySchema, toPaginated} from '../api/common.js';
import {auditEntrySchema, securityEventSchema} from '../api/trail.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import type {AuthenticatedRequest} from '../http/auth.js';
import type {AuditRepository} from '../store/repository.js';

export function auditRouter(audit: AuditRepository): Router {
  return createRouter<AuthenticatedRequest>({
    middleware: [],
    routes: [
      {
        method: HttpMethod.GET,
        path: '/',
        status: HttpStatus.OK,
        handler: async (req) => {
          const query = paginationQuerySchema.parse(req.query);
          return toPaginated(await audit.list(query), query, auditEntrySchema);
        }
      },
      {
        method: HttpMethod.GET,
        path: '/security-events',
        status: HttpStatus.OK,
        handler: async (req) => {
          const query = paginationQuerySchema.parse(req.query);
          const page = await audit.listSecurityEvents(query);
          return toPaginated(page, query, securityEventSchema);
        }
      }
    ]
  });
}
