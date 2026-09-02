import 'dotenv/config';
import {createServer} from 'node:https';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import express, {type Express} from 'express';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import {z} from 'zod';
import {logger} from './lib/logger.js';
import {PrismaPg} from '@prisma/adapter-pg';
import {PrismaClient} from '../prisma/generated/prisma/client.js';
import {prismaRepositories, type Repositories} from './store/repository.js';
import {createServices, type Services} from './services/services.js';
import {sessionStore, type SessionStore} from './store/sessions.js';
import {bankIdService} from './services/bankid.js';
import {demoClient} from './bankid/demo.js';
import type {DemoClient} from './bankid/demo.js';
import {authenticate} from './http/auth.js';
import {buildRateLimiters, rateLimitStore, type RateLimitStoreFactory} from './http/rate-limit.js';
import {createCsrf} from './http/csrf.js';
import {errorHandler, notFoundHandler} from './http/errors.js';
import {localeMiddleware} from './http/locale.js';
import {authRouter, startSession} from './routes/auth.js';
import {bankIdRouter} from './routes/bankid.js';
import {modRouter} from './routes/mod.js';
import {risksRouter} from './routes/risks.js';
import {nonconformitiesRouter} from './routes/nonconformities.js';
import {assetsRouter, controlsRouter, documentsRouter} from './routes/registers.js';
import {configRouter, healthRouter} from './routes/meta.js';
import {auditRouter} from './routes/events.js';
import type {AccessTokenPayload, TokenConfig} from './lib/jwt.js';
import type {BankIdService} from './services/bankid.js';
import type {Translations} from './lib/i18n.js';

const production  = process.argv.includes('--prod');
const modular     = process.argv.includes('--mod');
const EnvSchema   = z.object({
  PORT:               z.coerce.number().int().positive(),
  DATABASE_URL:       z.url(),
  JWT_ACCESS_SECRET:  z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_TTL:     z.coerce.number().int().positive(),
  JWT_REFRESH_TTL:    z.coerce.number().int().positive(),
  CSRF_SECRET:        z.string().min(32),
});

function loadEnv() {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    process.stderr.write('invalid .env');
    process.exit(1);
  }
  return parsed.data;
}

declare global {
  namespace Express {interface Request { user?: AccessTokenPayload; t: Translations; }}
}

export interface AppDeps {
  data: Repositories;
  services: Services;
  bankid: BankIdService;
  demo: DemoClient;
  sessions: SessionStore;
  rateLimitStore: RateLimitStoreFactory;
  csrfSecret: string;
  tokens: TokenConfig;
}

export function createApp(
  deps: AppDeps,
  flags: { production: boolean; modular?: boolean }
): Express {
  const modular = Boolean(flags.modular) && !flags.production;
  const limiters = buildRateLimiters(deps.rateLimitStore, deps.data.audit);
  const csrf = createCsrf(deps.csrfSecret, deps.tokens.refreshTtlSeconds * 1000);
  const auth = {sessions: deps.sessions, tokens: deps.tokens};

  const app = express();
  app.use(helmet({contentSecurityPolicy: false}));
  app.use(cookieParser());
  app.use(localeMiddleware);
  app.use(express.json({limit: '1mb'}));

  const api = express.Router();
  api.use('/health', healthRouter());
  api.use(limiters.global);
  api.use('/auth/bankid', bankIdRouter(deps.bankid,limiters,(req, res, userId) => startSession(auth, csrf, req, res, userId)));
  api.use('/auth', authRouter(auth, limiters, csrf));
  if (modular) api.use('/mod', modRouter(deps.data.users, deps.demo));

  const r = express.Router();
  r.use(csrf.protection);
  if (flags.production) r.use(authenticate(deps.tokens.accessSecret), limiters.api);
  r.use('/config', configRouter());
  r.use('/risks', risksRouter(deps.services.risks, deps.services.comments));
  r.use('/nonconformities', nonconformitiesRouter(deps.services.nonconformities, deps.services.comments));
  r.use('/assets', assetsRouter(deps.data.assets));
  r.use('/controls', controlsRouter(deps.data.controls));
  r.use('/documents', documentsRouter(deps.data.documents));
  r.use('/audit-events', auditRouter(deps.data.audit));
  api.use(r);
  app.use('/api/v1', api);
  app.use('/api/v1', notFoundHandler);
  app.use(errorHandler(csrf.invalidTokenError));
  return app;
}

function isEntry(): boolean {
  const entry = process.argv[1];
  if (!entry) return false;
  return fileURLToPath(import.meta.url) === path.resolve(entry);
}

async function start(): Promise<void> {
  const env = loadEnv();
  const prisma = new PrismaClient({adapter: new PrismaPg({connectionString: env.DATABASE_URL})});
  const data = prismaRepositories(prisma);
  const demo = demoClient();

  const deps: AppDeps = {
    data,
    services: createServices(data),
    bankid: bankIdService(demo, data.users),
    demo,
    sessions: sessionStore(),
    rateLimitStore: rateLimitStore(),
    csrfSecret: env.CSRF_SECRET,
    tokens: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessTtlSeconds: env.JWT_ACCESS_TTL,
      refreshTtlSeconds: env.JWT_REFRESH_TTL,
    }
  };

  const {createServer: createViteServer, resolveConfig} = await import('vite');
  const config = await resolveConfig({}, 'serve');
  const tls = config.server.https;
  if (!tls?.key || !tls.cert) { throw new Error('vite-plugin-mkcert error'); }

  const app = createApp(deps, {production, modular});
  const server = createServer(tls, app);
  const vite = await createViteServer({
    appType: 'spa',
    server: {middlewareMode: true, ws: {server, protocol: 'wss'}}
  });
  app.use(vite.middlewares);
  server.listen(env.PORT, () => {
    logger.info(`Listening on https://localhost:${env.PORT}`, {production, modular});
  });

  server.on('error', (error: Error) => {
    logger.error(`Cannot bind port ${env.PORT}`, {message: error.message});
    process.exit(1);
  });

  function shutdown(signal: string): void {
    logger.info(`Received ${signal}, shutting down...`);
    server.close(() => { void prisma.$disconnect().then(() => process.exit(0)); });
    setTimeout(() => process.exit(1), 10_000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

if (isEntry()) await start();
