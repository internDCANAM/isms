import {z} from 'zod';

export const armKind = {
  pending:  'pending',
  complete: 'complete',
  fail:     'fail',
} as const;
export type ArmKind = (typeof armKind)[keyof typeof armKind];

export const modUserBodySchema = z.object({
  personnummer: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
});

export const modArmBodySchema = z.discriminatedUnion('kind', [
  z.object({kind: z.literal(armKind.complete), personnummer: z.string().min(1)}),
  z.object({kind: z.literal(armKind.fail)}),
]);

export interface ModInfo {
  modular: true;
  personnummer: readonly string[];
}

export interface ModUser {
  id: string;
  name: string;
  personnummer: string;
}

export interface ModArmComplete {
  kind: typeof armKind.complete;
  personnummer: string;
}

export interface ModArmFail {
  kind: typeof armKind.fail;
}

export type ModArm = ModArmComplete | ModArmFail;
