import type {Router} from 'express';
import {commentInputSchema, commentSchema} from '../api/trail.js';
import {requireRecord} from '../http/request.js';
import {actorOf} from '../http/auth.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import type {AuditTable, CommentParent} from '../domain.js';
import type {AuthenticatedRequest} from '../http/auth.js';
import type {ReadRepository} from '../store/repository.js';
import type {CommentsService} from '../services/comments.js';

export interface CommentsRoute {
  records: ReadRepository<{ id: string }>;
  comments: CommentsService;
  parent: CommentParent;
  table: AuditTable;
}

export function commentsRouter({records, comments, parent, table}: CommentsRoute): Router {
  return createRouter<AuthenticatedRequest>({
    middleware: [],
    routes: [
      {
        method: HttpMethod.GET,
        path: '/',
        status: HttpStatus.OK,
        handler: async (req) => {
          const record = await requireRecord(req, records);
          const thread = await comments.listFor(parent, record.id);
          return {data: commentSchema.array().parse(thread)};
        }
      },
      {
        method: HttpMethod.POST,
        path: '/',
        status: HttpStatus.CREATED,
        handler: async (req) => {
          const record = await requireRecord(req, records);
          const {body} = commentInputSchema.parse(req.body);
          const comment = await comments.create(
            {authorId: req.user.userId, body, parent, parentId: record.id},
            table,
            actorOf(req)
          );
          return commentSchema.parse(comment);
        }
      }
    ]
  });
}
