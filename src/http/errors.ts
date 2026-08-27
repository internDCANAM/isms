import type {ErrorRequestHandler, NextFunction, Request, RequestHandler, Response} from 'express';
import {flattenError, ZodError} from 'zod';
import {ErrorCode, type ApiErrorBody} from '../api/common.js';
import {logger} from '../lib/logger.js';

export interface HttpError extends Error {
  readonly statusCode: number;
  readonly code: ErrorCode;
  readonly details?: unknown;
}

function httpError(
  statusCode: number,
  code: ErrorCode,
  message: string,
  details?: unknown
): HttpError {
  return Object.assign(new Error(message), {statusCode, code, details});
}

export const badRequest = (req: Request, message?: string, details?: unknown) =>
  httpError(400, ErrorCode.VALIDATION_ERROR, message ?? req.t.http.badRequest, details);

export const unauthorized = (req: Request, message?: string) =>
  httpError(401, ErrorCode.UNAUTHORIZED, message ?? req.t.http.unauthorized);

export const forbidden = (req: Request, message?: string) =>
  httpError(403, ErrorCode.FORBIDDEN, message ?? req.t.http.forbidden);

export const notFound = (req: Request, message?: string) =>
  httpError(404, ErrorCode.NOT_FOUND, message ?? req.t.http.notFound);

function isHttpError(err: unknown): err is HttpError {
  return err instanceof Error && 'statusCode' in err && 'code' in err;
}

function clientErrorStatus(err: unknown): number | null {
  if (!(err instanceof Error) || !('statusCode' in err)) return null;
  const status = (err as { statusCode: unknown }).statusCode;
  return typeof status === 'number' && status >= 400 && status < 500 ? status : null;
}

/**
 * Wraps an async handler so a rejection reaches the error middleware instead of
 * becoming an unhandled promise rejection.
 *
 * Generic over the request type, so handlers behind the auth middleware are
 * declared `asyncHandler<AuthenticatedRequest>` and resolve "is this request
 * authenticated" once.
 */
export const asyncHandler = <TReq extends Request = Request>(
  fn: (req: TReq, res: Response, next: NextFunction) => Promise<unknown>
): RequestHandler => (req, res, next) => {
  Promise.resolve(fn(req as TReq, res, next)).catch(next);
};

function toBody(error: HttpError): ApiErrorBody {
  return {
    error: error.message,
    code: error.code,
    statusCode: error.statusCode,
    ...(error.details !== undefined ? {details: error.details} : {}),
  };
}

export function notFoundHandler(req: Request, res: Response): void {
  const error = notFound(req);
  res.status(error.statusCode).json(toBody(error));
}

export function errorHandler(invalidCsrfTokenError: Error): ErrorRequestHandler {
  return (err: unknown, req: Request, res: Response, _next: NextFunction): void => {
    let error: unknown = err;
    if (err instanceof ZodError) {
      error = badRequest(req, req.t.input.validationFailed, flattenError(err).fieldErrors);
    } else if (err === invalidCsrfTokenError) {
      error = forbidden(req);
    } else if (!isHttpError(err)) {
      const status = clientErrorStatus(err);
      if (status !== null) {
        error = httpError(status, ErrorCode.VALIDATION_ERROR, req.t.http.badRequest);
      }
    }
    if (isHttpError(error)) { res.status(error.statusCode).json(toBody(error)); return; }

    logger.error('', {
      path: req.path,
      method: req.method,
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack : undefined,
    });

    res.status(500).json({
      error: req.t.http.internalError,
      code: ErrorCode.INTERNAL_ERROR,
      statusCode: 500,
    } satisfies ApiErrorBody);
  };
}
