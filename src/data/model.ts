/**
 * Tek veri kaynağı: tüm sayfaların verisi parametrelerden türetilir. Sunucu varsayılanlarla çizer; tarayıcıda
 * Parametreler sayfasında kaydedilen değerler okunur ve aynı model yeniden kurulur.
 */
import { makeDigital } from './digital';
import { makeGrowth } from './growth';
import { DEFAULT_PARAMS, type Params } from './params';
import { makeCashflow } from './cashflow';
import { makePartnership } from './partnership';
import { makeRevenue } from './revenue';
import { makeProgram } from './program';
import { getRole, makeRoles } from './roles';
import { makeOrg } from './tree';

export function buildModel(p: Params) {
  const program = makeProgram(p);
  const roles = makeRoles(p, program);
  // Gelir planı önce kurulur: nakit akış tablosunun girişleri senaryo serilerinden gelir.
  const revenue = makeRevenue(p, program);
  return {
    params: p,
    ...program,
    roles,
    role: (slug: string) => getRole(roles, slug),
    digital: makeDigital(p),
    growth: makeGrowth(p, program),
    org: makeOrg(p, roles),
    partnership: makePartnership(p, program),
    cashflow: makeCashflow(p, program, revenue),
    revenue,
  };
}

export type Model = ReturnType<typeof buildModel>;

export const DEFAULT_MODEL = buildModel(DEFAULT_PARAMS);
