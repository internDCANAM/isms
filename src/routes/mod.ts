import {faker} from '@faker-js/faker/locale/sv';
import type {Router} from 'express';
import {armKind, modArmBodySchema, modUserBodySchema} from '../api/mod.js';
import type {ModArm, ModInfo, ModUser} from '../api/mod.js';
import {demoPersonalNumber, demoPersonalNumberTable} from '../bankid/demo.js';
import type {DemoClient} from '../bankid/demo.js';
import {badRequest, notFound} from '../http/errors.js';
import {requireIp} from '../http/request.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import type {UserRepository} from '../store/repository.js';

function inTable(personalNumber: string): boolean {
  return demoPersonalNumberTable.includes(personalNumber);
}

export function modRouter(users: UserRepository, demo: DemoClient): Router {
  return createRouter({
    middleware: [],
    routes: [
      {
        method: HttpMethod.GET,
        path: '/',
        status: HttpStatus.OK,
        handler: () => Promise.resolve({
          modular: true,
          personalNumbers: demoPersonalNumberTable,
        } satisfies ModInfo),
      },
      {
        method: HttpMethod.POST,
        path: '/users',
        status: HttpStatus.CREATED,
        handler: async (req) => {
          const body = modUserBodySchema.parse(req.body ?? {});
          const personalNumber = body.personalNumber ?? demoPersonalNumber();
          if (!inTable(personalNumber)) throw badRequest(req, 'personal number not in demo table');
          const user = await users.upsertByPersonalNumber({
            personalNumber,
            name: body.name ?? faker.person.fullName(),
          });
          return {id: user.id, name: user.name, personalNumber} satisfies ModUser;
        }
      },
      {
        method: HttpMethod.POST,
        path: '/arm',
        status: HttpStatus.OK,
        handler: async (req) => {
          const body = modArmBodySchema.parse(req.body ?? {});
          if (body.kind === armKind.fail) {
            demo.arm(requireIp(req), {kind: armKind.fail});
            return {kind: armKind.fail} satisfies ModArm;
          }
          const personalNumber = body.personalNumber;
          const user = await users.findByPersonalNumber(personalNumber);
          if (!user) throw notFound(req, 'no user for this personal number');
          demo.arm(requireIp(req), {kind: armKind.complete, personalNumber, name: user.name});
          return {kind: armKind.complete, personalNumber} satisfies ModArm;
        }
      }
    ]
  });
}
