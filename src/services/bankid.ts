import {randomUUID} from 'node:crypto';
import {bankIdCadence, login} from '../bankid/flow.js';
import {loginPhase} from '../bankid/protocol.js';
import {loginView, rfa} from '../bankid/view.js';
import {systemClock} from '../lib/clock.js';
import type {AuthRequest} from '../bankid/protocol.js';
import type {BankIdClient} from '../bankid/client.js';
import type {LoginState} from '../bankid/flow.js';
import type {LoginView} from '../bankid/view.js';
import type {UserRepository} from '../store/repository.js';

export interface BankIdPoll {
  view: LoginView;
  userId?: string;
}

export interface BankIdService {
  start(request: AuthRequest): Promise<{ orderRef: string; } & LoginView>;
  poll(orderRef: string):      Promise<BankIdPoll|null>;
  cancel(orderRef: string):    void;
}

const unknownUser: LoginView = {
  phase: loginPhase.failed,
  message: rfa.noAccount,
  code: undefined,
  launch: undefined,
  name: undefined,
};

const rpFailed: LoginView = {
  phase: loginPhase.failed,
  message: rfa.rfa22,
  code: undefined,
  launch: undefined,
  name: undefined,
};

interface Order {
  states: AsyncGenerator<LoginState, void, void>;
  controller: AbortController;
  tail: Promise<void>;
}

function run<T>(order: Order, fn: () => Promise<T>): Promise<T> {
  const next = order.tail.then(fn, fn);
  order.tail = next.then(() => undefined, () => undefined);
  return next;
}

export function bankIdService(client: BankIdClient, users: UserRepository): BankIdService {
  const orders = new Map<string, Order>();

  function close(orderRef: string, order: Order): void {
    if (!orders.delete(orderRef)) return;
    order.controller.abort();
    void run(order, async () => {
      await order.states.return();
    });
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
        tail: Promise.resolve(),
      });
      return Promise.resolve({orderRef, ...loginView({phase: loginPhase.start})});
    },

    async poll(orderRef) {
      const order = orders.get(orderRef);
      if (!order) return null;
      return run(order, async () => {
        if (!orders.has(orderRef)) return null;
        let state;
        try {
          state = await order.states.next();
        } catch {
          close(orderRef, order);
          return {view: rpFailed};
        }
        if (state.done) {
          close(orderRef, order);
          return null;
        }
        if (state.value.phase === loginPhase.complete) {
          close(orderRef, order);
          const user = await users.findByPersonalNumber(
            state.value.completion.user.personalNumber
          );
          if (!user) return {view: unknownUser};
          return {view: loginView(state.value), userId: user.id};
        }
        const view = loginView(state.value);
        if (state.value.phase === loginPhase.failed) close(orderRef, order);
        return {view};
      });
    },

    cancel(orderRef) {
      const order = orders.get(orderRef);
      if (order) close(orderRef, order);
    }
  };
}
