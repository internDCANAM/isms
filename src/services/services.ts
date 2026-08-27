import {riskService, type RiskService} from './risks.js';
import {nonconformityService, type NonconformityService} from './nonconformities.js';
import {commentsService, type CommentsService} from './comments.js';
import type {Repositories} from '../store/repository.js';

export interface Services {
  risks: RiskService;
  nonconformities: NonconformityService;
  comments: CommentsService;
}

export function createServices(data: Repositories): Services {
  return {
    risks: riskService(data.risks, data.audit),
    nonconformities: nonconformityService(data.nonconformities, data.audit),
    comments: commentsService(data.comments, data.audit),
  };
}
