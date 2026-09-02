import 'dotenv/config';
import {createServer} from 'node:http';
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
import {authenticate} from './http/auth.js';
import {buildRateLimiters, rateLimitStore, type RateLimitStoreFactory} from './http/rate-limit.js';
import {createCsrf} from './http/csrf.js';
import {errorHandler, notFoundHandler} from './http/errors.js';
import {localeMiddleware} from './http/locale.js';
import {authRouter} from './routes/auth.js';
import {bankIdRouter} from './routes/bankid.js';
import {risksRouter} from './routes/risks.js';
import {nonconformitiesRouter} from './routes/nonconformities.js';
import {assetsRouter, controlsRouter, documentsRouter} from './routes/registers.js';
import {configRouter, healthRouter} from './routes/meta.js';
import {auditRouter} from './routes/events.js';
import type {AccessTokenPayload, TokenConfig} from './lib/jwt.js';
import type {BankIdService} from './services/bankid.js';
import type {Translations} from './lib/i18n.js';

const CLIENT_ROOT = path.dirname(fileURLToPath(import.meta.url));

const EnvSchema = z.object({
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
const env = loadEnv();

declare global {
  namespace Express {interface Request { user?: AccessTokenPayload; t: Translations; }}
}

export interface AppDeps {
  data: Repositories;
  services: Services;
  bankid: BankIdService;
  sessions: SessionStore;
  rateLimitStore: RateLimitStoreFactory;
  csrfSecret: string;
  tokens: TokenConfig;
}

export function createApp(deps: AppDeps): Express {
  const app = express();
  const limiters = buildRateLimiters(deps.rateLimitStore, deps.data.audit);
  const csrf = createCsrf(deps.csrfSecret, deps.tokens.refreshTtlSeconds * 1000);

  app.use(helmet({contentSecurityPolicy: false}));
  app.use(cookieParser());
  app.use(localeMiddleware);
  app.use(express.json({limit: '1mb'}));

  const api = express.Router();
  api.use('/health', healthRouter());
  api.use(limiters.global);
  api.use('/auth/bankid', bankIdRouter(deps.bankid, limiters));
  api.use('/auth', authRouter({sessions: deps.sessions, tokens: deps.tokens}, limiters, csrf));
  api.use(csrf.protection);

  const r = express.Router();
  // r.use(authenticate(deps.tokens.accessSecret), limiters.api);
  r.use('/config', configRouter());
  r.use('/risks', risksRouter(deps.services.risks, deps.services.comments));
  r.use('/nonconformities', nonconformitiesRouter(deps.services.nonconformities, deps.services.comments));
  r.use('/assets', assetsRouter(deps.data.assets));
  r.use('/controls', controlsRouter(deps.data.controls));
  r.use('/documents', documentsRouter(deps.data.documents));
  r.use('/audit-events', auditRouter(deps.data.audit));
  api.use(r);

  app.use('/api/v1', api);
  app.use('/api', notFoundHandler);
  app.use(errorHandler(csrf.invalidTokenError));

  return app;
}

const prisma = new PrismaClient({adapter: new PrismaPg({connectionString: env.DATABASE_URL})});
const data = prismaRepositories(prisma);

const deps: AppDeps = {
  data,
  services: createServices(data),
  bankid: bankIdService(demoClient()),
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

async function mountClient(app: Express): Promise<void> {
  const {createServer: createViteServer} = await import('vite');
  const vite = await createViteServer({root: CLIENT_ROOT, appType: 'spa', server: {middlewareMode: true}});
  app.use(vite.middlewares);
}

const app = createApp(deps);
await mountClient(app);
const server = createServer(app);
server.listen(env.PORT, () => { logger.info(`Listening on port ${env.PORT}`); });

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
