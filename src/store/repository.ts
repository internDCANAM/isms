import {CommentParent} from '../domain.js';
import type {PrismaClient} from '../../prisma/generated/prisma/client.js';
import type {AuditTable} from '../domain.js';
import type {AssessmentRecord, AuditRecord, HydratedAction, HydratedAsset, HydratedAudit, HydratedComment, HydratedControl, HydratedDocument, HydratedNonconformity, HydratedRisk, NewAssessment, NewComment, NewNonconformity, NewRisk, Page, SecurityEventRecord, TreatmentRecord} from './records.js';
import type {NewAction, NewTreatment, PageQuery} from './records.js';

export interface ReadRepository<T> {
  list(query: PageQuery): Promise<Page<T>>;
  get(id: string): Promise<T | null>;
}

export interface RiskRepository extends ReadRepository<HydratedRisk> {
  create(input: NewRisk): Promise<HydratedRisk>;
  update(id: string, patch: Partial<NewRisk>): Promise<HydratedRisk>;
  remove(id: string): Promise<void>;
  upsertAssessment(riskId: string, input: NewAssessment): Promise<AssessmentRecord>;
  addTreatment(riskId: string, input: NewTreatment): Promise<TreatmentRecord>;
}

export interface NonconformityRepository extends ReadRepository<HydratedNonconformity> {
  create(input: NewNonconformity): Promise<HydratedNonconformity>;
  update(id: string, patch: Partial<NewNonconformity>): Promise<HydratedNonconformity>;
  remove(id: string): Promise<void>;
  addAction(nonconformityId: string, input: NewAction): Promise<HydratedAction>;
}

export interface CommentRepository {
  listFor(parent: CommentParent, parentId: string): Promise<HydratedComment[]>;
  create(input: NewComment): Promise<HydratedComment>;
}

export interface AuditRepository {
  list(query: PageQuery): Promise<Page<HydratedAudit>>;
  listForRecord(tableName: AuditTable, recordId: string): Promise<HydratedAudit[]>;
  write(entry: Omit<AuditRecord, 'id' | 'createdAt'>): Promise<void>;
  recordSecurityEvent(event: Omit<SecurityEventRecord, 'id' | 'createdAt'>): Promise<void>;
  listSecurityEvents(query: PageQuery): Promise<Page<SecurityEventRecord>>;
}

export type AssetRepository = ReadRepository<HydratedAsset>;
export type ControlRepository = ReadRepository<HydratedControl>;
export type DocumentRepository = ReadRepository<HydratedDocument>;

export interface UserRecord {
  id: string;
  name: string;
  personalNumber: string | null;
}

export interface UserRepository {
  findByPersonalNumber(personalNumber: string): Promise<UserRecord | null>;
  upsertByPersonalNumber(input: { personalNumber: string; name: string }): Promise<UserRecord>;
}

export interface Repositories {
  risks: RiskRepository;
  assets: AssetRepository;
  controls: ControlRepository;
  nonconformities: NonconformityRepository;
  documents: DocumentRepository;
  comments: CommentRepository;
  audit: AuditRepository;
  users: UserRepository;
}


function commentParentWhere(parent: CommentParent, parentId: string) {
  switch (parent) {
    case CommentParent.RISK:
      return {riskId: parentId};
    case CommentParent.NONCONFORMITY:
      return {nonconformityId: parentId};
  }
}

function hydrateAudit(
  row: { user: { name: string }; tableName: string } & Omit<AuditRecord, 'tableName'>
): HydratedAudit {
  const {user, tableName, ...entry} = row;
  return {...entry, tableName: tableName as AuditTable, changedByName: user.name};
}

const ownerName = {owner: {select: {name: true}}};

function pageArgs(query: PageQuery) {
  return {skip: (query.page - 1) * query.limit, take: query.limit};
}

async function nextReference(
  prefix: string,
  count: () => Promise<number>
): Promise<string> {
  return `${prefix}-${String((await count()) + 1).padStart(4, '0')}`;
}

export function prismaRepositories(prisma: PrismaClient): Repositories {
  const riskInclude = {
    owner: {select: {name: true}},
    assessments: true,
    treatments: true,
    assets: {select: {id: true}},
    controls: {select: {id: true}},
  };

  type PrismaRisk = Awaited<
    ReturnType<typeof prisma.risk.findFirstOrThrow<{ include: typeof riskInclude }>>
  >;
  const hydrateRisk = (row: PrismaRisk): HydratedRisk => ({
    id: row.id,
    reference: row.reference,
    title: row.title,
    description: row.description,
    theme: row.theme,
    ownerId: row.ownerId,
    assetIds: row.assets.map((a) => a.id),
    controlIds: row.controls.map((c) => c.id),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    ownerName: row.owner?.name ?? null,
    assessments: row.assessments,
    treatments: row.treatments,
  });

  const actionInclude = {assignedTo: {select: {name: true}}};
  const nonconformityInclude = {
    raisedBy: {select: {name: true}},
    actions: {include: actionInclude},
  };

  type PrismaAction = Awaited<
    ReturnType<typeof prisma.correctiveAction.findFirstOrThrow<{ include: typeof actionInclude }>>
  >;
  const hydrateAction = (row: PrismaAction): HydratedAction => ({
    id: row.id,
    nonconformityId: row.nonconformityId,
    description: row.description,
    rootCause: row.rootCause,
    assignedToId: row.assignedToId,
    dueDate: row.dueDate,
    completedAt: row.completedAt,
    createdAt: row.createdAt,
    assignedToName: row.assignedTo?.name ?? null,
  });

  type PrismaNonconformity = Awaited<ReturnType<
    typeof prisma.nonconformity.findFirstOrThrow<{ include: typeof nonconformityInclude }>
  >>;
  const hydrateNonconformity = (row: PrismaNonconformity): HydratedNonconformity => ({
    id: row.id,
    reference: row.reference,
    title: row.title,
    description: row.description,
    theme: row.theme,
    state: row.state,
    raisedById: row.raisedById,
    raisedAt: row.raisedAt,
    closedAt: row.closedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    raisedByName: row.raisedBy?.name ?? null,
    actions: row.actions.map(hydrateAction),
  });

  return {
    risks: {
      async list(query) {
        const [rows, total] = await prisma.$transaction([
          prisma.risk.findMany({...pageArgs(query), include: riskInclude, orderBy: {reference: 'asc'}}),
          prisma.risk.count(),
        ]);
        return {rows: rows.map(hydrateRisk), total};
      },

      async get(id) {
        const row = await prisma.risk.findUnique({where: {id}, include: riskInclude});
        return row && hydrateRisk(row);
      },

      async create(input) {
        const reference = await nextReference('R', () => prisma.risk.count());
        const row = await prisma.risk.create({
          data: {
            reference,
            title: input.title,
            description: input.description,
            theme: input.theme,
            ownerId: input.ownerId,
            assets: {connect: input.assetIds.map((id) => ({id}))},
            controls: {connect: input.controlIds.map((id) => ({id}))},
          },
          include: riskInclude
        });
        return hydrateRisk(row);
      },

      async update(id, patch) {
        const row = await prisma.risk.update({
          where: {id},
          data: {
            title: patch.title,
            description: patch.description,
            theme: patch.theme,
            ownerId: patch.ownerId,
            assets: patch.assetIds && {set: patch.assetIds.map((assetId) => ({id: assetId}))},
            controls: patch.controlIds &&
              {set: patch.controlIds.map((controlId) => ({id: controlId}))},
          },
          include: riskInclude
        });
        return hydrateRisk(row);
      },

      async remove(id) {
        await prisma.risk.delete({where: {id}});
      },

      upsertAssessment(riskId, input) {
        return prisma.riskAssessment.upsert({
          where: {riskId_phase: {riskId, phase: input.phase}},
          create: {riskId, ...input},
          update: {
            likelihood: input.likelihood,
            impact: input.impact,
            economicImpactMinor: input.economicImpactMinor,
            assessedAt: new Date(),
          }
        });
      },
      addTreatment(riskId, input) { return prisma.treatment.create({data: {riskId, ...input}}); }
    },

    nonconformities: {
      async list(query) {
        const [rows, total] = await prisma.$transaction([
          prisma.nonconformity.findMany({
            ...pageArgs(query),
            include: nonconformityInclude,
            orderBy: {reference: 'asc'},
          }),
          prisma.nonconformity.count()
        ]);
        return {rows: rows.map(hydrateNonconformity), total};
      },

      async get(id) {
        const row = await prisma.nonconformity.findUnique({
          where: {id}, include: nonconformityInclude,
        });
        return row && hydrateNonconformity(row);
      },

      async create(input) {
        const reference = await nextReference('NC', () => prisma.nonconformity.count());
        const row = await prisma.nonconformity.create({
          data: {reference, ...input},
          include: nonconformityInclude,
        });
        return hydrateNonconformity(row);
      },

      async update(id, patch) {
        const row = await prisma.nonconformity.update({
          where: {id},
          data: patch,
          include: nonconformityInclude,
        });
        return hydrateNonconformity(row);
      },

      async remove(id) { await prisma.nonconformity.delete({where: {id}}); },

      async addAction(nonconformityId, input) {
        const row = await prisma.correctiveAction.create({
          data: {nonconformityId, ...input},
          include: actionInclude,
        });
        return hydrateAction(row);
      }
    },

    assets: {
      async list(query) {
        const [rows, total] = await prisma.$transaction([
          prisma.asset.findMany({
            ...pageArgs(query),
            include: {...ownerName, _count: {select: {risks: true}}},
            orderBy: {reference: 'asc'},
          }),
          prisma.asset.count()
        ]);
        return {
          rows: rows.map(({owner, _count, ...asset}) => ({
            ...asset,
            ownerName: owner?.name ?? null,
            riskCount: _count.risks,
          })),
          total
        };
      },

      async get(id) {
        const row = await prisma.asset.findUnique({
          where: {id}, include: {...ownerName, _count: {select: {risks: true}}}
        });
        if (!row) return null;
        const {owner, _count, ...asset} = row;
        return {...asset, ownerName: owner?.name ?? null, riskCount: _count.risks};
      }
    },

    controls: {
      async list(query) {
        const [rows, total] = await prisma.$transaction([prisma.control.findMany({
          ...pageArgs(query),
          include: {...ownerName, _count: {select: {risks: true}}},
          orderBy: {reference: 'asc'},
        }),
        prisma.control.count()
        ]);
        return {
          rows: rows.map(({owner, _count, ...control}) => ({
            ...control,
            ownerName: owner?.name ?? null,
            riskCount: _count.risks,
          })),
          total
        };
      },

      async get(id) {
        const row = await prisma.control.findUnique({
          where: {id},
          include: {...ownerName, _count: {select: {risks: true}}},
        });
        if (!row) return null;
        const {owner, _count, ...control} = row;
        return {...control, ownerName: owner?.name ?? null, riskCount: _count.risks};
      }
    },

    documents: {
      async list(query) {
        const [rows, total] = await prisma.$transaction([
          prisma.document.findMany({...pageArgs(query), include: ownerName, orderBy: {reference: 'asc'}}),
          prisma.document.count()
        ]);
        return {
          rows: rows.map(({owner, ...document}) => ({...document, ownerName: owner?.name ?? null})),
          total
        };
      },

      async get(id) {
        const row = await prisma.document.findUnique({where: {id}, include: ownerName});
        if (!row) return null;
        const {owner, ...document} = row;
        return {...document, ownerName: owner?.name ?? null};
      }
    },

    comments: {
      async listFor(parent, parentId) {
        const rows = await prisma.comment.findMany({
          where: commentParentWhere(parent, parentId),
          include: {author: {select: {name: true}}},
          orderBy: {createdAt: 'asc'},
        });
        return rows.map(({author, ...comment}) => ({...comment, authorName: author.name}));
      },

      async create(input) {
        const row = await prisma.comment.create({
          data: {
            authorId: input.authorId,
            body: input.body,
            ...commentParentWhere(input.parent, input.parentId),
          },
          include: {author: {select: {name: true}}}
        });
        const {author, ...comment} = row;
        return {...comment, authorName: author.name};
      }
    },

    audit: {
      async list(query) {
        const [rows, total] = await prisma.$transaction([
          prisma.auditEntry.findMany({
            ...pageArgs(query),
            include: {user: {select: {name: true}}},
            orderBy: {createdAt: 'desc'},
          }),
          prisma.auditEntry.count()
        ]);
        return {rows: rows.map(hydrateAudit), total};
      },

      async listForRecord(tableName, recordId) {
        const rows = await prisma.auditEntry.findMany({
          where: {tableName, recordId},
          include: {user: {select: {name: true}}},
          orderBy: {createdAt: 'desc'},
        });
        return rows.map(hydrateAudit);
      },

      async write(entry) { await prisma.auditEntry.create({data: entry}); },
      async recordSecurityEvent(event) { await prisma.securityEvent.create({data: event}); },

      async listSecurityEvents(query) {
        const [rows, total] = await prisma.$transaction([
          prisma.securityEvent.findMany({...pageArgs(query), orderBy: {createdAt: 'desc'}}),
          prisma.securityEvent.count(),
        ]);
        return {rows, total};
      }
    },

    users: {
      async findByPersonalNumber(personalNumber) {
        return prisma.user.findUnique({
          where: {personalNumber},
          select: {id: true, name: true, personalNumber: true},
        });
      },
      async upsertByPersonalNumber({personalNumber, name}) {
        return prisma.user.upsert({
          where: {personalNumber},
          create: {personalNumber, name},
          update: {name},
          select: {id: true, name: true, personalNumber: true},
        });
      }
    }
  };
}
