import type {Request} from 'express';
import {uuidParamsSchema} from '../api/common.js';
import {orderRefParamsSchema} from '../api/auth.js';
import {badRequest, notFound} from './errors.js';
import type {ReadRepository} from '../store/repository.js';

function pathId(req: Request): string {
  return uuidParamsSchema.parse(req.params).id;
}

export function pathOrderRef(req: Request): string {
  return orderRefParamsSchema.parse(req.params).orderRef;
}

export function requireIp(req: Request): string {
  if (!req.ip) throw badRequest(req);
  return req.ip;
}

export async function requireRecord<T>(req: Request, repo: ReadRepository<T>): Promise<T> {
  const record = await repo.get(pathId(req));
  if (!record) throw notFound(req);
  return record;
}
