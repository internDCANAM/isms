import {qrSvg, qrSvgDefaults} from '../lib/qr.js';
import {autoStartUrl, loginPhase} from './protocol.js';
import type {FailedHintCode, PendingHintCode} from './protocol.js';
import type {LoginState} from './flow.js';

export const rfa = {
  rfa1:  'Start your BankID app.',
  rfa3:  'The action was cancelled. Please try again.',
  rfa6:  'The action was cancelled.',
  rfa8:  'The BankID app is not responding. Please check that it is started and that you have internet access. Try again.',
  rfa9:  'Enter your security code in the BankID app and select Identify or Sign.',
  rfa13: 'Trying to start your BankID app.',
  rfa15: 'Searching for BankID. Make sure you have a valid BankID on this device.',
  rfa16: 'Your BankID is blocked or too old. Please use another BankID or get a new one from your bank.',
  rfa17: 'Failed to scan the QR code. Start the BankID app and scan the QR code.',
  rfa21: 'An identification or signing is in progress.',
  rfa22: 'Something went wrong. Please try again.',
  rfa23: 'Take a photo of, and scan, your ID document with the BankID app.',
  noAccount: 'No account matches this BankID.',
} as const;
export type Rfa = (typeof rfa)[keyof typeof rfa];

const pendingMessages: Partial<Record<PendingHintCode, Rfa>> = {
  outstandingTransaction: rfa.rfa1,
  noClient:               rfa.rfa1,
  started:                rfa.rfa15,
  userMrtd:               rfa.rfa23,
  userSign:               rfa.rfa9,
  processing:             rfa.rfa21,
};

const failedMessages: Partial<Record<FailedHintCode, Rfa>> = {
  expiredTransaction: rfa.rfa8,
  certificateErr:     rfa.rfa16,
  userCancel:         rfa.rfa6,
  cancelled:          rfa.rfa3,
  startFailed:        rfa.rfa17,
};

export function pendingMessage(hint: PendingHintCode | undefined): Rfa | undefined {
  return hint && pendingMessages[hint];
}

export function failedMessage(hint: FailedHintCode | undefined): Rfa | undefined {
  return hint && failedMessages[hint];
}

export interface LoginView {
  phase:       LoginState['phase'];
  message:     Rfa     | undefined;
  code:        string  | undefined;
  launch:      string  | undefined;
  name:        string  | undefined;
  expiresInMs: number  | undefined;
  extendable:  boolean;
};

const empty = {
  message:     undefined,
  code:        undefined,
  launch:      undefined,
  name:        undefined,
  expiresInMs: undefined,
  extendable:  false,
};

export function failedView(message: Rfa): LoginView {
  return {...empty, phase: loginPhase.failed, message};
}

export function loginView(state: LoginState): LoginView {
  switch (state.phase) {
    case loginPhase.start:
      return {...empty, phase: state.phase, message: rfa.rfa13};
    case loginPhase.qr:
      return {
        phase:       state.phase,
        message:     pendingMessage(state.hint) ?? rfa.rfa21,
        code:        qrSvg(state.payload, qrSvgDefaults),
        launch:      autoStartUrl(state.autoStartToken),
        name:        undefined,
        expiresInMs: state.expiresInMs,
        extendable:  state.extendable,
      };
    case loginPhase.complete:
      return {...empty, phase: state.phase, name: state.completion.user.name};
    case loginPhase.failed:
      return failedView(failedMessage(state.hint) ?? rfa.rfa22);
  }
}
