import {randomUUID} from 'node:crypto';
import {bankIdCadence, login, loginPhase} from '../bankid/flow.js';
import {loginView} from '../bankid/view.js';
import {systemClock} from '../lib/clock.js';
import type {AuthRequest} from '../bankid/protocol.js';
import type {BankIdClient} from '../bankid/client.js';
import type {LoginState} from '../bankid/flow.js';
import type {LoginView} from '../bankid/view.js';

export interface BankIdService {
  start(request: AuthRequest): Promise<{ orderRef: string; } & LoginView>;
  poll(orderRef: string): Promise<LoginView | null>;
  cancel(orderRef: string): void;
}

interface Order {
  states: AsyncGenerator<LoginState, void, void>;
  controller: AbortController;
}

export function bankIdService(client: BankIdClient): BankIdService {
  const orders = new Map<string, Order>();

  function close(orderRef: string, order: Order): void {
    orders.delete(orderRef);
    order.controller.abort();
    void order.states.return();
  }

  return {
    start(request) {
      const orderRef = randomUUID();
      const controller = new AbortController();
      orders.set(orderRef, {
        states: login(request, {
          client,
          clock: systemClock,
          signal: controller.signal,
          ...bankIdCadence,
        }),
        controller,
      });
      return Promise.resolve({orderRef, ...loginView({phase: loginPhase.start})});
    },

    async poll(orderRef) {
      const order = orders.get(orderRef);
      if (!order) return null;

      const state = await order.states.next();
      if (state.done) {
        close(orderRef, order);
        return null;
      }

      const view = loginView(state.value);
      if (state.value.phase === loginPhase.complete || state.value.phase === loginPhase.failed) {
        close(orderRef, order);
      }
      return view;
    },

    cancel(orderRef) {
      const order = orders.get(orderRef);
      if (order) close(orderRef, order);
    }
  };
}
