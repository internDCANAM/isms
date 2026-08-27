import type {Router} from 'express';
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
export function bankIdRouter(service: BankIdService, limiters: RateLimiters): Router {
  return createRouter({
    middleware: [limiters.login],
    routes: [
      {
        method: HttpMethod.POST,
        path: '/start',
        status: HttpStatus.CREATED,
        handler: (req) => service.start({endUserIp: requireIp(req)}),
      },
      {
        method: HttpMethod.GET,
        path: '/:orderRef',
        status: HttpStatus.OK,
        handler: async (req) => {
          const view = await service.poll(pathOrderRef(req));
          if (!view) throw notFound(req);
          return view;
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
