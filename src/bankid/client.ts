import type {AuthRequest, CancelRequest, CollectRequest, CollectResponse, OrderResponse} from './protocol.js';

export interface BankIdClient {
  auth(request: AuthRequest): Promise<OrderResponse>;
  collect(request: CollectRequest): Promise<CollectResponse>;
  cancel(request: CancelRequest): Promise<void>;
}
