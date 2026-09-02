import {faker} from '@faker-js/faker/locale/sv';
import {armKind} from '../api/mod.js';
import {collectStatus, failedHintCode, pendingHintCode} from './protocol.js';
import type {CollectResponse, CompletionData, OrderResponse} from './protocol.js';
import type {BankIdClient} from './client.js';

// https://skatteverket.entryscape.net/rowstore/dataset/b4de7df7-63c0-4e7e-bb59-1f156a591763/html
const dataset = [
  '197701172392', '197701182383', '197701182391', '197701192382',
  '197701192390', '197701202397', '197701202389', '197701212388',
  '197701212396', '197701222387', '197701222395', '197701232386',
  '197701232394', '197701242385', '197701242393', '197701252384',
  '197701252392', '197701262383', '197701262391', '197701272382',
  '197909212388', '197909212396', '197909222387', '197909222395',
  '197909232386', '197909232394', '197909242385', '197909242393',
  '197909252384', '197909252392', '197909262391', '197909262383',
  '197909272390', '197909272382', '197909282381', '197909282399',
  '197909292380', '197909292398', '197909302387', '197909302395',
  '198404152392', '198404162383', '198404162391', '198404172390',
  '198404172382', '198404182399', '198404182381', '198404189287',
  '198404192398', '198404192380', '198404202395', '198404202387',
  '198404212394', '198404212386', '198404222393', '198404222385',
  '198404232384', '198404232392', '198404242383', '198404242391',
  '198804202383', '198804212382', '198804212390', '198804222399',
  '198804222381', '198804232398', '198804232380', '198804242389',
  '198804242397', '198804252396', '198804252388', '198804262387',
  '198804262395', '198804272386', '198804272394', '198804282385',
  '198804282393', '198804292392', '198804292384', '198804302381',
] as const;

export const demoEndUserIp = faker.internet.ipv4();
export const demoOrderTtlMs = 30_000;
export const demoPersonnummerTable: readonly string[] = dataset;

export type DemoArm =
  | { kind: typeof armKind.pending }
  | { kind: typeof armKind.complete; personnummer: string; name: string }
  | { kind: typeof armKind.fail };

export interface DemoClient extends BankIdClient {
  arm(endUserIp: string, arm: DemoArm): void;
}

const pending = (orderRef: string, hintCode: string): CollectResponse =>
  ({orderRef, status: collectStatus.pending, hintCode});

const failed = (orderRef: string, hintCode: string): CollectResponse =>
  ({orderRef, status: collectStatus.failed, hintCode});

interface DemoOrderState {
  started: number;
  script?: CollectResponse[];
  collected: number;
}
export function demoPersonnummer(): string { return faker.helpers.arrayElement(dataset); }

export function demoCollect(order: OrderResponse, completion: CompletionData): CollectResponse[] {
  return [
    pending(order.orderRef, pendingHintCode.outstandingTransaction),
    pending(order.orderRef, pendingHintCode.userSign),
    {
      orderRef: order.orderRef,
      status: collectStatus.complete,
      completionData: completion
    }
  ];
}

export function demoCancelled(order: OrderResponse): CollectResponse[] {
  return [
    pending(order.orderRef, pendingHintCode.outstandingTransaction),
    {
      orderRef: order.orderRef,
      status: collectStatus.failed,
      hintCode: failedHintCode.userCancel
    }
  ];
}

export function demoOrder(): OrderResponse {
  return {
    orderRef:       faker.string.uuid(),
    autoStartToken: faker.string.uuid(),
    qrStartToken:   faker.string.uuid(),
    qrStartSecret:  faker.string.uuid(),
  };
}

export function demoCompletion(user?: { personnummer: string; name: string }): CompletionData {
  const givenName = user?.name.split(/\s+/)[0] ?? faker.person.firstName();
  const surname = user?.name.split(/\s+/).slice(1).join(' ') || faker.person.lastName();
  return {
    user: {
      personnummer: user?.personnummer ?? demoPersonnummer(),
      name: user?.name ?? `${givenName} ${surname}`,
      givenName,
      surname,
    },
    device: {ipAddress: demoEndUserIp,uhi: faker.string.alphanumeric({length: 28})},
    bankIdIssueDate: `${faker.date.past({years: 5}).toISOString().slice(0, 10)}Z`,
    signature: faker.string.alphanumeric({length: 64}),
    ocspResponse: faker.string.alphanumeric({length: 64}),
  };
}

export function demoClient(options: { ttlMs?: number } = {}): DemoClient {
  const orders = new Map<string, DemoOrderState>();
  const arms = new Map<string, DemoArm>();
  const ttlMs = options.ttlMs ?? demoOrderTtlMs;

  const scriptFor = (order: OrderResponse, arm: DemoArm): CollectResponse[] | undefined => {
    switch (arm.kind) {
      case armKind.pending:  return undefined;
      case armKind.complete: return demoCollect(order, demoCompletion(arm));
      case armKind.fail:     return demoCancelled(order);
    }
  };

  return {
    arm: (endUserIp, arm) => { arms.set(endUserIp, arm); },
    auth: ({endUserIp}) => {
      const order = demoOrder();
      const arm = arms.get(endUserIp);
      arms.delete(endUserIp);
      orders.set(order.orderRef, {
        started: Date.now(),
        collected: 0,
        script: arm ? scriptFor(order, arm) : undefined,
      });
      return Promise.resolve(order);
    },
    collect: ({orderRef}) => {
      const state = orders.get(orderRef);
      if (!state) return Promise.resolve(failed(orderRef, failedHintCode.cancelled));
      if (state.script) {
        const response = state.script[Math.min(state.collected, state.script.length - 1)]!;
        state.collected += 1;
        if (response.status !== collectStatus.pending) orders.delete(orderRef);
        return Promise.resolve(response);
      }
      if (Date.now() - state.started >= ttlMs) {
        orders.delete(orderRef);
        return Promise.resolve(failed(orderRef, failedHintCode.expiredTransaction));
      }
      return Promise.resolve(pending(orderRef, pendingHintCode.outstandingTransaction));
    },
    cancel: ({orderRef}) => { orders.delete(orderRef); return Promise.resolve(); }
  };
}
