/**
 * Tek veri kaynağı: tüm sayfaların verisi parametrelerden türetilir. Sunucu varsayılanlarla çizer; tarayıcıda
 * Parametreler sayfasında kaydedilen değerler okunur ve aynı model yeniden kurulur.
 */
import { makeBcg } from './bcg';
import { makeDigital } from './digital';
import { makeGrowth } from './growth';
import { DEFAULT_PARAMS, type Params } from './params';
import { makeProgram } from './program';
import { getRole, makeRoles } from './roles';
import { makeOrg } from './tree';

export function buildModel(p: Params) {
  const program = makeProgram(p);
  const roles = makeRoles(p, program);
  return {
    params: p,
    ...program,
    roles,
    role: (slug: string) => getRole(roles, slug),
    digital: makeDigital(p),
    growth: makeGrowth(p, program),
    org: makeOrg(p, roles),
    bcg: makeBcg(p, program),
  };
}

export type Model = ReturnType<typeof buildModel>;

export const DEFAULT_MODEL = buildModel(DEFAULT_PARAMS);
