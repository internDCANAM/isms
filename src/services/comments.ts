import {auditChanges} from './audit.js';
import type {Actor} from './audit.js';
import type {AuditTable, CommentParent} from '../domain.js';
import type {AuditRepository, CommentRepository} from '../store/repository.js';
import type {HydratedComment, NewComment} from '../store/records.js';

export interface CommentsService {
  listFor(parent: CommentParent, parentId: string
  ): Promise<HydratedComment[]>;
  create(input: NewComment, table: AuditTable, actor: Actor
  ): Promise<HydratedComment>;
}

export function commentsService(
  comments: CommentRepository,
  audit: AuditRepository
): CommentsService {
  return {
    listFor: (parent, parentId) => comments.listFor(parent, parentId),

    async create(input, table, actor) {
      const comment = await comments.create(input);
      await auditChanges(audit, {
        tableName: table,
        recordId: input.parentId,
        actor,
        before: {},
        patch: {comment: comment.id},
      });
      return comment;
    }
  };
}
