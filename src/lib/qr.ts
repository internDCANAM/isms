import encodeQR from 'qr';

export const qrEcc = {
  low:      'low',
  medium:   'medium',
  quartile: 'quartile',
  high:     'high',
} as const;
export type QrEcc = (typeof qrEcc)[keyof typeof qrEcc];

export interface QrSvg {
  ecc:    QrEcc;
  border: number;
}

export const qrSvgDefaults: QrSvg = {ecc: qrEcc.low, border: 4};
export function qrSvg(payload: string, opts: QrSvg): string { return encodeQR(payload, 'svg', opts); }
