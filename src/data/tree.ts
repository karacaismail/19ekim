import { shortDate } from '../lib/dates';
import type { Params } from './params';
import type { Role, RoleKey } from './types';

/**
 * Organizasyon şeması (ECharts ağacı): tepede İsmail Karaca; altında kurmay, rol bazlı dört ağaç ve Segika.
 * Düğümler rol sayfalarına bağlanır; sunum sırası (SEQUENCE) önceki/sonraki gezinmesini belirler.
 */

export interface OrgNode {
  name: string;
  sub: string;
  role: RoleKey;
  href?: string;
  children?: OrgNode[];
}

/** Kişi sayısı ve başlangıç tarihleri parametrelerden gelir. */
export function makeOrg(p: Params, _roles: Role[]): OrgNode {
  const node = (slug: RoleKey, name: string, count: number, date: string, extra: Partial<OrgNode> = {}): OrgNode => ({
    name,
    sub: `${count} kişi · ${shortDate(date)}`,
    role: slug,
    href: `/roller/${slug}/`,
    ...extra,
  });
  return {
    name: 'İsmail Karaca',
    sub: 'Strateji ve operasyon',
    role: 'yonetici',
    children: [
      node('asistan', 'Asistan', p.asistanCount, p.startDate, { sub: `${p.asistanCount} kişi · ${shortDate(p.startDate)} (onay bekliyor)` }),
      { name: 'Yazılım ekibi', sub: `${p.softwareCount} kişi · Scrum`, role: 'yazilim' },
      node('dijital-pazarlama', 'Ağaç 1 · Dijital pazarlama', p.dijitalCount, p.startDate),
      node('pazarlamaci', 'Ağaç 2 · Masa başı (CRM)', p.masaCount, p.startDate),
      {
        name: 'Ağaç 3 · Saha satış',
        sub: 'Kayıt · abonelik · ağ',
        role: 'saha-uzmani',
        href: '/roller/saha-uzmani/',
        children: [
          node('saha-uzmani', 'Saha ekibi', p.sahaCount + p.sahaDecCount, p.startDate, {
            sub: `${p.sahaCount + p.sahaDecCount} kişi · ${p.sahaCount} + ${p.sahaDecCount} (${shortDate(p.decStartDate)})`,
          }),
          node('ekip-lideri', 'Ekip lideri', 1, p.decStartDate, {
            children: [{ name: 'Bağımsız temsilciler', sub: 'Ayda ~2 · 90. günde ~5', role: 'ekip-lideri', href: '/buyume-modeli/' }],
          }),
        ],
      },
      node('organizator', 'Ağaç 4 · Organizatör', p.organizatorCount, p.decStartDate),
      node('segika', 'Segika · Masa başı (CRM)', p.segikaCount, p.startDate),
    ],
  };
}

export interface Stop {
  path: string;
  label: string;
  crumb: string[];
}

/** Doğrusal sunum sırası. */
export const SEQUENCE: Stop[] = [
  { path: '/', label: 'Organizasyon şeması', crumb: [] },
  { path: '/roller/dijital-pazarlama/', label: 'Ağaç 1 · Dijital pazarlama', crumb: ['Ağaç 1 · Dijital pazarlama'] },
  { path: '/roller/pazarlamaci/', label: 'Ağaç 2 · Masa başı pazarlama', crumb: ['Ağaç 2 · Masa başı pazarlama'] },
  { path: '/roller/saha-uzmani/', label: 'Ağaç 3 · Saha ekibi', crumb: ['Ağaç 3 · Saha satış'] },
  { path: '/roller/ekip-lideri/', label: 'Ağaç 3 · Ekip lideri', crumb: ['Ağaç 3 · Saha satış', 'Ekip lideri'] },
  { path: '/buyume-modeli/', label: 'Ağaç 3 · Çok katmanlı pazarlama ağı', crumb: ['Ağaç 3 · Saha satış', 'Çok katmanlı pazarlama ağı'] },
  { path: '/roller/organizator/', label: 'Ağaç 4 · Organizatör', crumb: ['Ağaç 4 · Organizatör'] },
  { path: '/roller/segika/', label: 'Segika · Masa başı (CRM)', crumb: ['Segika · Masa başı (CRM)'] },
  { path: '/roller/asistan/', label: 'Kurmay · Asistan', crumb: ['Kurmay · Asistan'] },
  { path: '/istihdam/', label: 'İstihdam takvimi', crumb: ['İstihdam takvimi'] },
  { path: '/hedefler/', label: '90 gün hedefleri', crumb: ['90 gün hedefleri'] },
  { path: '/eylem-plani/', label: 'Eylem planı', crumb: ['Eylem planı'] },
  { path: '/karar-yetkisi/', label: 'Karar yetkisi ve kontrol noktaları', crumb: ['Karar yetkisi ve kontrol noktaları'] },
  { path: '/karar-bekleyenler/', label: 'Karar bekleyenler', crumb: ['Karar bekleyenler'] },
  { path: '/parametreler/', label: 'Parametreler', crumb: ['Parametreler'] },
  { path: '/giderler/', label: 'Giderler (OPEX)', crumb: ['Giderler (OPEX)'] },
  { path: '/notlar/', label: 'Notlar', crumb: ['Notlar'] },
];

export const TREE_NAV: { label: string; path: string; role?: RoleKey; no?: number; also?: string[] }[] = [
  { label: 'Organizasyon', path: '/' },
  { label: 'Dijital pazarlama', path: '/roller/dijital-pazarlama/', role: 'dijital-pazarlama', no: 1 },
  { label: 'Masa başı', path: '/roller/pazarlamaci/', role: 'pazarlamaci', no: 2 },
  { label: 'Saha satış', path: '/roller/saha-uzmani/', role: 'saha-uzmani', no: 3, also: ['/roller/ekip-lideri/', '/buyume-modeli/'] },
  { label: 'Organizatör', path: '/roller/organizator/', role: 'organizator', no: 4 },
  { label: 'Segika', path: '/roller/segika/', role: 'segika' },
  { label: 'Asistan', path: '/roller/asistan/', role: 'asistan' },
];

/** “İstihdam” menüsünün sonunda (organizasyon ve rollerden sonra): işe alım sırası. */
export const HIRING_NAV = { label: 'İstihdam takvimi', path: '/istihdam/' };

export const COMMON_NAV = [
  { label: '90 gün hedefleri', path: '/hedefler/' },
  { label: 'Eylem planı', path: '/eylem-plani/' },
  { label: 'MLM ağı', path: '/buyume-modeli/' },
  { label: 'Karar yetkisi', path: '/karar-yetkisi/' },
  { label: 'Karar bekleyenler', path: '/karar-bekleyenler/' },
  { label: 'Parametreler', path: '/parametreler/' },
  { label: 'Giderler (OPEX)', path: '/giderler/' },
  { label: 'Notlar', path: '/notlar/' },
];
