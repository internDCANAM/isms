import {collectStatus, failedHint, loginPhase, pendingHint} from './protocol.js';
import {qrPayload, qrTime} from './qr.js';
import {scopeGuard} from '../lib/scope-guard.js';
import type {AuthRequest, CompletionData, FailedHintCode, PendingHintCode} from './protocol.js';
import type {BankIdClient} from './client.js';
import type {Clock} from '../lib/clock.js';

export interface LoginCadence {
  qrIntervalMs: number;
  collectIntervalMs: number;
}

export interface LoginOptions extends LoginCadence {
  client: BankIdClient;
  clock: Clock;
  signal: AbortSignal;
}

export const bankIdCadence: LoginCadence = {
  qrIntervalMs: 1000,
  collectIntervalMs: 2000,
};

export type LoginState =
  | { phase: typeof loginPhase.start }
  |
  {
    phase: typeof loginPhase.qr;
    payload: string;
    autoStartToken: string;
    hint: PendingHintCode | undefined;
  }
  | { phase: typeof loginPhase.complete; completion: CompletionData }
  | { phase: typeof loginPhase.failed; hint: FailedHintCode | undefined };

/**
 * Drives one BankID authentication order from start to terminal state.
 *
 * Yields `start`, then a fresh `qr` state every `qrIntervalMs`, ending on
 * `complete` or `failed`. `collect` is polled every `collectIntervalMs` while
 * the QR keeps refreshing, so the code stays scannable between polls.
 *
 * Cancellation runs through `options.signal`. Aborting it ends the sleep and
 * the loop at the next check, disposing the scope guard, which cancels the
 * order at the relying party. Abandoning the iterator (a `break`, or a consumer
 * calling `.return()`) disposes the guard the same way. Reaching `complete` or
 * `failed` releases the guard first, so only an abandoned order is cancelled.
 *
 * @param request Formed by the caller, carrying the end user's IP.
 * @param options `client` is the transport seam, `clock` supplies time and
 *   sleeping, `signal` ends the order from outside, and the two intervals set
 *   the cadence. Pass `bankIdCadence` for BankID's documented 1s QR and 2s
 *   collect values.
 * @returns An async generator of `LoginState`. Every state is yielded,
 *   terminal ones included, so `for await` sees the whole sequence.
 * @throws Rejections from `client.auth`, `client.collect`, and `client.cancel`
 *   propagate to the caller.
 */
export async function* login(
  request: AuthRequest,
  options: LoginOptions
): AsyncGenerator<LoginState, void, void> {

  const {client, clock, qrIntervalMs, collectIntervalMs, signal} = options;
  yield {phase: loginPhase.start};
  const order = await client.auth(request);
  const started = clock.now();
  let hint: PendingHintCode | undefined;
  await using guard = scopeGuard(() => client.cancel({orderRef: order.orderRef}));

  for (let nextCollect = started; !signal.aborted; await clock.sleep(qrIntervalMs, signal)) {
    if (clock.now() >= nextCollect) {
      const response = await client.collect({orderRef: order.orderRef});
      nextCollect = clock.now() + collectIntervalMs;

      if (response.status === collectStatus.complete) {
        guard.release();
        yield {phase: loginPhase.complete, completion: response.completionData!};
        return;
      }

      if (response.status === collectStatus.failed) {
        guard.release();
        yield {phase: loginPhase.failed, hint: failedHint(response.hintCode ?? '')};
        return;
      }

      hint = pendingHint(response.hintCode ?? '');
    }

    yield {
      phase: loginPhase.qr,
      payload: await qrPayload(order, qrTime(started, clock.now())),
      autoStartToken: order.autoStartToken,
      hint,
    };
  }
}
