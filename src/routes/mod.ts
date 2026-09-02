import {faker} from '@faker-js/faker/locale/sv';
import type {Router} from 'express';
import {armKind, modArmBodySchema, modUserBodySchema} from '../api/mod.js';
import type {ModArm, ModInfo, ModUser} from '../api/mod.js';
import {demoPersonnummer, demoPersonnummerTable} from '../bankid/demo.js';
import type {DemoClient} from '../bankid/demo.js';
import {badRequest, notFound} from '../http/errors.js';
import {requireIp} from '../http/request.js';
import {createRouter, HttpMethod, HttpStatus} from '../http/table.js';
import type {UserRepository} from '../store/repository.js';

function inTable(personnummer: string): boolean {
  return demoPersonnummerTable.includes(personnummer);
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
          personnummer: demoPersonnummerTable,
        } satisfies ModInfo),
      },
      {
        method: HttpMethod.POST,
        path: '/users',
        status: HttpStatus.CREATED,
        handler: async (req) => {
          const body = modUserBodySchema.parse(req.body ?? {});
          const personnummer = body.personnummer ?? demoPersonnummer();
          if (!inTable(personnummer)) throw badRequest(req, 'personnummer not in demo table');
          const user = await users.upsertBypersonnummer({
            personnummer,
            name: body.name ?? faker.person.fullName(),
          });
          return {id: user.id, name: user.name, personnummer} satisfies ModUser;
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
          const personnummer = body.personnummer;
          const user = await users.findBypersonnummer(personnummer);
          if (!user) throw notFound(req, 'no user for this personnummer');
          demo.arm(requireIp(req), {kind: armKind.complete, personnummer, name: user.name});
          return {kind: armKind.complete, personnummer} satisfies ModArm;
        }
      }
    ]
  });
}
