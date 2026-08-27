import type {Router} from 'express';
import type {ZodType} from 'zod';
import {paginationQuerySchema, toPaginated} from '../api/common.js';
import {assetSchema, controlSchema, documentSchema} from '../api/register.js';
import {requireRecord} from '../http/request.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import type {AuthenticatedRequest} from '../http/auth.js';
import type {ReadRepository} from '../store/repository.js';

function readOnlyRouter<T>(repo: ReadRepository<unknown>, schema: ZodType<T>): Router {
  return createRouter<AuthenticatedRequest>({
    middleware: [],
    routes: [
      {
        method: HttpMethod.GET,
        path: '/',
        status: HttpStatus.OK,
        handler: async (req) => {
          const query = paginationQuerySchema.parse(req.query);
          return toPaginated(await repo.list(query), query, schema);
        }
      },
      {
        method: HttpMethod.GET,
        path: '/:id',
        status: HttpStatus.OK,
        handler: async (req) => schema.parse(await requireRecord(req, repo)),
      }
    ]
  });
}

export const assetsRouter = (assets: ReadRepository<unknown>): Router =>
  readOnlyRouter(assets, assetSchema);
export const controlsRouter = (controls: ReadRepository<unknown>): Router =>
  readOnlyRouter(controls, controlSchema);
export const documentsRouter = (documents: ReadRepository<unknown>): Router =>
  readOnlyRouter(documents, documentSchema);
