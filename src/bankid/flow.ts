import {collectStatus, failedHint, failedHintCode, loginPhase, pendingHint} from './protocol.js';
import {qrPayload, qrTime} from './qr.js';
import {scopeGuard} from '../lib/scope-guard.js';
import type {AuthRequest, CompletionData, FailedHintCode, PendingHintCode} from './protocol.js';
import type {BankIdClient} from './client.js';
import type {Clock} from '../lib/clock.js';

export interface LoginCadence {
  qrIntervalMs: number;      // refresh the QR picture this often
  collectIntervalMs: number; // ask BankID if the user has finished this often
  orderRenewMs: number;      // replace the order before BankID's 30s limit
  sessionMs: number;         // how long the whole login attempt may run
  extendAtMs: number;        // remaining time when the UI may offer to extend
};

export const bankIdCadence: LoginCadence = {
  qrIntervalMs:      1_000,
  collectIntervalMs: 2_000,
  orderRenewMs:     25_000,
  sessionMs:       300_000,
  extendAtMs:       30_000,
};

export interface LoginOptions extends LoginCadence {
  client: BankIdClient;
  clock: Clock;
  signal: AbortSignal;
}

const orderTimedOut: ReadonlySet<FailedHintCode> =
  new Set([failedHintCode.expiredTransaction, failedHintCode.startFailed]);

export type LoginState =
  | { phase: typeof loginPhase.start }
  |
  {
    phase: typeof loginPhase.qr;
    payload: string;
    autoStartToken: string;
    hint: PendingHintCode | undefined;
    expiresInMs: number;
    extendable: boolean;
  }
  | { phase: typeof loginPhase.complete; completion: CompletionData }
  | { phase: typeof loginPhase.failed; hint: FailedHintCode | undefined };

/**
 * One BankID login, from the first screen to success, failure, or giving up.
 *
 * Yields start at once, before any BankID call. After the order is open:
 * - QR every qrIntervalMs while the attempt is still running
 * - complete if BankID says the person finished
 * - failed if the session runs out, or BankID reports a real failure
 *
 * A QR state holds the animated code, the token for opening the app on this
 * device, the latest hint, time left on the session, and whether the UI may
 * offer to extend. Phone and desktop share that state. The UI picks picture
 * or button.
 *
 * Status is asked every collectIntervalMs. The order is replaced every
 * orderRenewMs, or sooner if BankID says it timed out. Replacing an order does
 * not yield. Abort does not yield either - the sequence just ends.
 *
 * One BankID order lasts 30 seconds. The session lasts sessionMs by stringing
 * orders together. A new order restarts the QR animation. Extending is a new
 * call to this function.
 *
 * Abort, a break, or return() cancels the open order. Success and real failure
 * do not - BankID is already done. Session timeout still cancels.
 *
 * @param request End-user IP.
 * @param options Client, clock, abort signal, and cadence. bankIdCadence is
 *   BankID's recommended timings, with 25s order refresh as margin inside
 *   their 30s limit.
 * @returns States from start through the last complete or failed yield.
 * @throws Auth, collect, and cancel errors are not caught.
 */
export async function* login(
  request: AuthRequest,
  options: LoginOptions
): AsyncGenerator<LoginState, void, void> {

  const {client, clock, qrIntervalMs, collectIntervalMs} = options;
  const {orderRenewMs, sessionMs, extendAtMs, signal} = options;
  yield {phase: loginPhase.start};
  let hint: PendingHintCode | undefined;
  let order         = await client.auth(request);
  let orderStarted  = clock.now();
  let nextCollect   = orderStarted;
  const sessionEnds = orderStarted +sessionMs;
  await using guard = scopeGuard(() => client.cancel({orderRef: order.orderRef}));

  const renew = async(): Promise<void> => {
    await client.cancel({orderRef: order.orderRef});
    order         = await client.auth(request);
    orderStarted  = clock.now();
    nextCollect   = orderStarted;
    hint          = undefined;
  };

  while (!signal.aborted) {
    const remaining = sessionEnds - clock.now();
    if (remaining <= 0) {
      yield {phase: loginPhase.failed, hint: failedHintCode.startFailed};
      return;
    }

    if (clock.now() >= nextCollect) {
      const response = await client.collect({orderRef: order.orderRef});
      nextCollect = clock.now() + collectIntervalMs;

      if (response.status === collectStatus.complete) {
        guard.release();
        yield {phase: loginPhase.complete, completion: response.completionData!};
        return;
      }

      if (response.status === collectStatus.failed) {
        const failure = failedHint(response.hintCode ?? '');
        if (!failure || !orderTimedOut.has(failure)) {
          guard.release();
          yield {phase: loginPhase.failed, hint: failure};
          return;
        }
        await renew();
        continue;
      }

      hint = pendingHint(response.hintCode ?? '');
    }

    if (clock.now() - orderStarted >= orderRenewMs) {
      await renew();
      continue;
    }

    yield {
      phase: loginPhase.qr,
      payload: await qrPayload(order, qrTime(orderStarted, clock.now())),
      autoStartToken: order.autoStartToken,
      hint,
      expiresInMs: remaining,
      extendable: remaining <= extendAtMs,
    };
    await clock.sleep(qrIntervalMs, signal);
  }
}
