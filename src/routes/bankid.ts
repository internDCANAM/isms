import type {Request, Response, Router} from 'express';
import {notFound} from '../http/errors.js';
import {pathOrderRef, requireIp} from '../http/request.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import type {RateLimiters} from '../http/rate-limit.js';
import type {BankIdService} from '../services/bankid.js';

/**
 * Three requests the browser makes; the flow itself stays on the server.
 * `start` opens an order, `poll` advances it one step, `cancel` abandons it,
 * which the generator's scope guard turns into a cancel at the relying party.
 */
export function bankIdRouter(
  service: BankIdService,
  limiters: RateLimiters,
  onIdentified: (req: Request, res: Response, userId: string) => Promise<void>
): Router {
  return createRouter({
    middleware: [],
    routes: [
      {
        method: HttpMethod.POST,
        path: '/start',
        status: HttpStatus.CREATED,
        middleware: [limiters.login],
        handler: (req) => service.start({endUserIp: requireIp(req)}),
      },
      {
        method: HttpMethod.GET,
        path: '/:orderRef',
        status: HttpStatus.OK,
        handler: async (req, res) => {
          const result = await service.poll(pathOrderRef(req));
          if (!result) throw notFound(req);
          const userId = result.userId;
          if (userId) await onIdentified(req, res, userId);
          return result.view;
        }
      },
      {
        method: HttpMethod.POST,
        path: '/:orderRef/cancel',
        status: HttpStatus.NO_CONTENT,
        handler: (req) => Promise.resolve(service.cancel(pathOrderRef(req))),
      }
    ]
  });
}
