# todo

## Layout

```
src/main.ts     env parsing, AppDeps, createApp, vite mount, listen
src/domain.ts   the enums shared by api, store, and ui
src/routes/     one express router per resource
src/api/        zod schemas and response types for those routers
src/services/   risk, nonconformity, and comment logic, each writing audit
src/store/      repository interfaces, prisma implementation, session store
src/http/       auth, csrf, cookies, errors, locale, rate limit, router table
src/bankid/     protocol, order flow, view mapping, demo client
src/lib/        jwt, i18n, logger, clock, hmac, qr, scope guard
src/ui/         react pages, components, css
prisma/         the postgres model
```

## Phase 0 - Base restructure

Done.

- [x] One package, one process
- [x] `prisma/schema.prisma` carries the whole model
- [x] `createApp(deps: AppDeps)` builds the app from injected parts, and
  `main.ts` is the one place a concrete implementation is chosen
- [x] The injected parts are the repositories, the session store, the
  rate-limit store factory, and the BankID client
- [x] Page and component stubs
- [x] BankID core: protocol types, the order flow generator, the view
  mapping, and a demo client

## Phase 1 - Composition and auth

Done.

- [x] `main.ts` parses the env
- [x] Development deployment: `info` logs, `secure: false` cookies, Vite mounted
- [x] `createCsrf()` - double-submit tokens in `http/csrf.ts`
- [x] BankID is the only login: start, poll, cancel under `/auth/bankid`
- [x] `POST /auth/refresh` rotates the refresh cookie off the session store
  alone; `/auth/logout` clears it
- [x] `bankid/flow.ts` - `login()`
- [x] `bankid/view.ts` - `LoginState` to `LoginView`, carrying the RFA text
- [x] `BankIdService` declared as `start`, `poll`, `cancel`
- [x] Projections live in their routers, `toPaginated` in `api/common.ts`
- [x] `entry.tsx` - react-query, `BrowserRouter`, nine routes, `ui/css`
- [x] `lib/i18n.dict.ts` - `sv` and `en`, `auth`, `http`, and `input` keys
- [x] `prismaRepositories(prisma)` in `store/repository.ts` serves the seven
  repositories, hydrating owner names and joined rows from one `include`
- [x] `create` assigns the reference: `R-0001` for risks, `NC-0001` for
  nonconformities, counted off the table
- [x] `sessionStore()` in `store/sessions.ts` holds refresh tokens per user
  with an expiry, so restarting the server signs everyone out
- [x] `rateLimitStore()` in `http/rate-limit.ts` hands each limiter its own
  `MemoryStore` from express-rate-limit
- [x] `bankIdService(client)` keys one `login()` generator per order under a
  uuid; `poll` advances it a step, `cancel` aborts and disposes it
- [x] `main.ts` builds `PrismaClient` over `PrismaPg` from `DATABASE_URL`
- [x] `postinstall` runs `prisma generate`, since `prisma/generated/` is
  ignored and `store/repository.ts` imports its types
- [x] CI runs lint, typecheck, and build

## Phase 2 - Pages and components

`Main.tsx` is the index at `/`, and links every other page. The eight it links
to each render a heading and a placeholder line. `ui/css` is three files:
`index.css` carries the reset and every class, `schemes.css` the three colour
schemes in light and dark, `font.css` the families and sizes. Only `stack`,
`center`, `phase`, and `note` are rendered so far; `button`, `split`, `frame`,
`status`, `spinner`, `row`, `sr-only`, `bankid`, and `qr__code` are written
and waiting for the components that use them. Build `RiskRegisterPage` first,
against the `/risks` the API already serves, and let the rest follow what it
settles.

Drop each link from `Main.tsx` as its page becomes reachable from a real one,
and `Main.tsx` with the last of them.

- [ ] Classes for table, form, modal, and nav, as sections of `index.css`
- [ ] Components: Button, Card, Badge, Table, Field, Modal, EmptyState,
  LoadingState, QueryError, Nav
- [ ] `RiskRegisterPage` + `RiskDetailPage`
- [ ] `NonconformityListPage` + `NonconformityDetailPage`
- [ ] `AssetInventoryPage`, `ControlsPage`, `DocumentsPage` (read-only)
- [ ] `LoginPage`
- [ ] Client-side BankID poller against `/auth/bankid`, rendering the QR from
  `payload`

## Phase 3 - Trim and new files

- [ ] i18n dictionary keys for the new domain, `sv` and `en`
- [ ] Surface the audit trail in the risk detail view
- [ ] `.xlsx` importer, only if the schedule holds

## Phase 4 - Tests

`tests/`

- [ ] Decide what a suite assembles `AppDeps` from
- [ ] Restore the `npm test` step in CI, with whatever services it needs
- [ ] New suites: risks, nonconformities, repository, bankid flow
- [ ] Assertions to cover: helmet headers present, no CORS header, the 404 body
  shape, `errorHandler` returning neither message nor stack, derived risk
  levels, and the hashed audit trail

## Phase 5 - User roles

Every authenticated user reaches every route, `DELETE /risks/:id`,
`DELETE /nonconformities/:id`, and `GET /audit-events` included. Roles land as
one phase, once the team has agreed what they are.

- [ ] Decide the set of roles, and what each one may do
- [ ] `role` on the Prisma `User` model, and a `UserRepository` to read it
- [ ] `role` in the access token payload in `lib/jwt.ts`. `refresh` reads no
      user today, so granting one is where a repository read comes back
- [ ] `authorize(...roles)` in `http/auth.ts`, answering with `forbidden(req)`
- [ ] Mount it on the routes the decision covers

## Left open

- [ ] The live relying-party client behind `BankIdClient`, which `demoClient()`
  in `bankid/demo.ts` stands in for
- [ ] The client login flow: a login page, a poller against `/auth/bankid`, and
  somewhere to keep the access token
- [ ] What a completed order returns to the browser, as a type in `api/auth.ts`
  alongside `RefreshResponse`. It wants a `personal_number` column on `User`
  for `bankIdService` to map a completed order onto a user
- [ ] Reference numbering counts rows, so two concurrent creates can race for
  the same `R-0001`. A sequence or a retry closes it
- [ ] Unknown paths under `/api/v1` answer 401 rather than 404, because
  `authenticate` is mounted ahead of `notFoundHandler`
