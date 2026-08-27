import {AuditTable, NonconformityState} from '../domain.js';
import {auditChanges, auditDeletion} from './audit.js';
import type {Actor} from './audit.js';
import type {AuditRepository, NonconformityRepository, ReadRepository} from '../store/repository.js';
import type {HydratedAction, HydratedAudit, HydratedNonconformity, NewAction, NewNonconformity} from '../store/records.js';

export type NewNonconformityInput = Omit<NewNonconformity, 'closedAt' | 'raisedById'>;

export interface NonconformityService extends ReadRepository<HydratedNonconformity> {
  create(input: NewNonconformityInput, actor: Actor
  ): Promise<HydratedNonconformity>;
  update(before: HydratedNonconformity, patch: Partial<NewNonconformityInput>, actor: Actor
  ): Promise<HydratedNonconformity>;
  remove(nonconformity: HydratedNonconformity, actor: Actor
  ): Promise<void>;
  addAction(nonconformity: HydratedNonconformity, input: NewAction, actor: Actor
  ): Promise<HydratedAction>;
  trail(nonconformityId: string): Promise<HydratedAudit[]>;
}

function auditedFields(nonconformity: HydratedNonconformity) {
  return {
    title: nonconformity.title,
    description: nonconformity.description,
    theme: nonconformity.theme,
    state: nonconformity.state,
    closedAt: nonconformity.closedAt,
  };
}

/**
 * Clause 10.2 wants the moment a nonconformity was closed, so the timestamp
 * follows the state rather than being sent by the client.
 */
function closureOf(state: NonconformityState): Date | null {
  return state === NonconformityState.CLOSED ? new Date() : null;
}

export function nonconformityService(
  nonconformities: NonconformityRepository,
  audit: AuditRepository
): NonconformityService {
  return {
    list: (query) => nonconformities.list(query),
    get: (id) => nonconformities.get(id),
    trail: (nonconformityId) => audit.listForRecord(AuditTable.NONCONFORMITIES, nonconformityId),

    async create(input, actor) {
      const nonconformity = await nonconformities.create({
        ...input,
        closedAt: closureOf(input.state),
        raisedById: actor.userId,
      });
      await auditChanges(audit, {
        tableName: AuditTable.NONCONFORMITIES,
        recordId: nonconformity.id,
        actor,
        before: {},
        patch: {title: nonconformity.title, state: nonconformity.state},
      });
      return nonconformity;
    },

    async update(before, patch, actor) {
      const transition = patch.state !== undefined && patch.state !== before.state;
      const nonconformity = await nonconformities.update(before.id, {
        ...patch,
        ...(transition && patch.state !== undefined ? {closedAt: closureOf(patch.state)} : {}),
      });
      await auditChanges(audit, {
        tableName: AuditTable.NONCONFORMITIES,
        recordId: before.id,
        actor,
        before: auditedFields(before),
        patch: {
          title: patch.title,
          description: patch.description,
          theme: patch.theme,
          state: patch.state,
          closedAt: transition ? nonconformity.closedAt : undefined,
        }
      });
      return nonconformity;
    },

    async remove(nonconformity, actor) {
      await nonconformities.remove(nonconformity.id);
      await auditDeletion(audit, {
        tableName: AuditTable.NONCONFORMITIES,
        recordId: nonconformity.id,
        actor,
        before: auditedFields(nonconformity),
      });
    },

    async addAction(nonconformity, input, actor) {
      const action = await nonconformities.addAction(nonconformity.id, input);
      await auditChanges(audit, {
        tableName: AuditTable.NONCONFORMITIES,
        recordId: nonconformity.id,
        actor,
        before: {},
        patch: {actionDescription: action.description, actionDueDate: action.dueDate},
      });
      return action;
    }
  };
}
