import {Router, type Request, type RequestHandler, type Response} from 'express';
import {asyncHandler, dropped} from './errors.js';

export const HttpMethod = {
  GET:    'get',
  POST:   'post',
  PUT:    'put',
  PATCH:  'patch',
  DELETE: 'delete',
} as const;
export type HttpMethod = (typeof HttpMethod)[keyof typeof HttpMethod];

export const HttpStatus = {
  OK:         200,
  CREATED:    201,
  NO_CONTENT: 204,
} as const;
export type HttpStatus = (typeof HttpStatus)[keyof typeof HttpStatus];

export interface Route<TReq extends Request> {
  method: HttpMethod;
  path: string;
  status: HttpStatus;
  middleware?: readonly RequestHandler[];
  handler: (req: TReq, res: Response) => Promise<unknown>;
}

export interface RouteTable<TReq extends Request> {
  middleware: readonly RequestHandler[];
  routes: readonly Route<TReq>[];
}

function respond<TReq extends Request>(route: Route<TReq>): RequestHandler {
  return asyncHandler<TReq>(async (req, res) => {
    const body = await route.handler(req, res);
    if (dropped(res)) return;
    if (route.status === HttpStatus.NO_CONTENT) {
      res.status(route.status).end();
      return;
    }
    res.status(route.status).json(body);
  });
}

export function createRouter<TReq extends Request = Request>(table: RouteTable<TReq>): Router {
  const router = Router({mergeParams: true});

  for (const route of table.routes) {
    router[route.method](
      route.path,
      ...table.middleware,
      ...(route.middleware ?? []),
      respond(route)
    );
  }

  return router;
}
