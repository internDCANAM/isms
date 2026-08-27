export const collectStatus = {
  pending:  'pending',
  failed:   'failed',
  complete: 'complete',
} as const;
export type CollectStatus = (typeof collectStatus)[keyof typeof collectStatus];

export interface AuthRequest {
  endUserIp: string;
}

export interface OrderResponse {
  orderRef: string;
  autoStartToken: string;
  qrStartToken: string;
  qrStartSecret: string;
}

export interface CollectRequest { orderRef: string; }
export interface CancelRequest  { orderRef: string; }

export interface CompletionUser {
  personalNumber: string;
  name: string;
  givenName: string;
  surname: string;
}

export interface CompletionDevice {
  ipAddress?: string;
  uhi?: string;
}

export interface CompletionData {
  user: CompletionUser;
  device: CompletionDevice;
  bankIdIssueDate: string;
  signature: string;
  ocspResponse: string;
}

export interface CollectResponse {
  orderRef: string;
  status: CollectStatus;
  hintCode?: string;
  completionData?: CompletionData;
}

export const pendingHintCode = {
  outstandingTransaction: 'outstandingTransaction',
  noClient:               'noClient',
  started:                'started',
  userMrtd:               'userMrtd',
  userCallConfirm:        'userCallConfirm',
  userSign:               'userSign',
  processing:             'processing',
  userStepUp:             'userStepUp',
  userFace:               'userFace',
} as const;
export type PendingHintCode = (typeof pendingHintCode)[keyof typeof pendingHintCode];

export const failedHintCode = {
  expiredTransaction:      'expiredTransaction',
  certificateErr:          'certificateErr',
  userCancel:              'userCancel',
  cancelled:               'cancelled',
  startFailed:             'startFailed',
  userDeclinedCall:        'userDeclinedCall',
  notSupportedByUserApp:   'notSupportedByUserApp',
  mrtdVerificationFailed:  'mrtdVerificationFailed',
  facialRecognitionFailed: 'facialRecognitionFailed',
  nfcNotSupportedByDevice: 'nfcNotSupportedByDevice',
  multipleBankIdsOnDevice: 'multipleBankIdsOnDevice',
  stepUpFailed:            'stepUpFailed',
} as const;
export type FailedHintCode = (typeof failedHintCode)[keyof typeof failedHintCode];

const pendingHints: ReadonlyMap<string, PendingHintCode> = new Map(Object.entries(pendingHintCode));
const failedHints: ReadonlyMap<string, FailedHintCode> = new Map(Object.entries(failedHintCode));

export function pendingHint(raw: string): PendingHintCode | undefined {
  return pendingHints.get(raw);
}

export function failedHint(raw: string): FailedHintCode | undefined {
  return failedHints.get(raw);
}

export function autoStartUrl(autoStartToken: string): string {
  return `https://app.bankid.com/?autostarttoken=${encodeURIComponent(autoStartToken)}`;
}
