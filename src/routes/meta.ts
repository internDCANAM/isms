import type {Router} from 'express';
import {domainConfig} from '../api/common.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';

export function healthRouter(): Router {
  return createRouter({
    middleware: [],
    routes: [
      {
        method: HttpMethod.GET,
        path: '/',
        status: HttpStatus.OK,
        handler: () => Promise.resolve({status: 'ok'}),
      }
    ]
  });
}

export function configRouter(): Router {
  const config = domainConfig();
  return createRouter({
    middleware: [],
    routes: [
      {
        method:  HttpMethod.GET,
        path:    '/',
        status:  HttpStatus.OK,
        handler: () => Promise.resolve(config),
      }
    ]
  });
}
