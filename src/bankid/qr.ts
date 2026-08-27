import {hmacHex, hmacKeyDefaults} from '../lib/hmac.js';
import type {OrderResponse} from './protocol.js';

const qrPrefix = 'bankid';
export type QrSeed = Pick<OrderResponse, 'qrStartToken' | 'qrStartSecret'>;

export function qrTime(orderReceivedAtMs: number,nowMs = Date.now()): number {
  return Math.floor((nowMs - orderReceivedAtMs) / 1000);
}

export async function qrPayload(seed: QrSeed, elapsedSeconds: number): Promise<string> {
  const time = String(Math.floor(elapsedSeconds));
  const qrAuthCode = await hmacHex(seed.qrStartSecret, time, hmacKeyDefaults);
  return [qrPrefix, seed.qrStartToken, time, qrAuthCode].join('.');
}
