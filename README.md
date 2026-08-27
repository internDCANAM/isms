# ISMS

information security management system.

## Setup

Node and Docker.

```
cp .env.example .env
npm ci
npm run env:secrets
npm run db:up
npm run prisma:push
```

```
npm run dev:client      # the pages on vite's port, on their own
npm run dev             # api and client together on PORT
npm run lint            # eslint, zero warnings allowed
npm run typecheck       # tsc --noEmit
npm run build           # the client, into dist/client
```

## Domain

Vocabulary comes from ISO/IEC 27001:2022 and ISO/IEC 27005.

- **Risk** - scored twice, `INHERENT` and `RESIDUAL`, on a 5×5 likelihood and
  impact matrix. Score and level derive from the two numbers rather than being
  stored, so a level can never drift from what it was banded from.
- **Treatment** - `MODIFY`, `RETAIN`, `AVOID`, `SHARE`, with planned and actual
  dates.
- **Theme** - `ORGANIZATIONAL`, `PEOPLE`, `PHYSICAL`, `TECHNOLOGICAL`, the four
  Annex A control themes. One taxonomy classifies risks, controls, and assets.
- **Nonconformity** and **CorrectiveAction** - clause 10.2.
- **Control** - an Annex A control with its `Applicability` and justification,
  which together are the Statement of Applicability.
- **Document** - clause 7.5 documented information: version, owner, approval
  date, next review date.
