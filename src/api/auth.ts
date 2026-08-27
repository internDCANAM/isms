import {z} from 'zod';

export const orderRefParamsSchema = z.object({orderRef: z.uuid()});
export interface RefreshResponse { accessToken: string }
export type {LoginView} from '../bankid/view.js';
