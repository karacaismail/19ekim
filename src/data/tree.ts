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
  // Gelir planı (kullanıcı kararı 2026-10-27): kadro kapasitesinden hedef zinciri, senaryolar ve kümülatif gelir.
  { path: '/gelir-plani/', label: 'Gelir planı', crumb: ['Gelir planı'] },
  { path: '/eylem-plani/', label: 'Eylem planı', crumb: ['Eylem planı'] },
  // İş ortaklığı programı (kullanıcı kararı 2026-10-27): Segika ve iStoc, iki ana sekme; adres /partnership/.
  { path: '/partnership/', label: 'İş ortaklığı programı', crumb: ['İş ortaklığı programı'] },
  { path: '/karar-yetkisi/', label: 'Karar yetkisi ve kontrol noktaları', crumb: ['Karar yetkisi ve kontrol noktaları'] },
  { path: '/karar-bekleyenler/', label: 'Karar bekleyenler', crumb: ['Karar bekleyenler'] },
  { path: '/parametreler/', label: 'Parametreler', crumb: ['Parametreler'] },
  // Son kırıntı sayfa başlığıdır (AppFrame titleInCrumbs; kullanıcı kararı 2026-10-21).
  { path: '/giderler/', label: 'Giderler (OPEX)', crumb: ['Finans', 'OpEx', 'Operasyonel Giderler'] },
  { path: '/nakit-akisi/', label: 'Nakit akış tablosu', crumb: ['Finans', 'Nakit akış tablosu'] },
  { path: '/notlar/', label: 'Notlar', crumb: ['Notlar'] },
];

/**
 * “İstihdam” menüsü (kullanıcı kararı 2026-10-21): öğeler 1–7 sıralı numaralı; roller işe alınacak pozisyon adıyla.
 */
export const TREE_NAV: { label: string; path: string; role?: RoleKey; no?: number; also?: string[] }[] = [
  { label: 'Organizasyon şeması', path: '/', no: 1 },
  { label: 'Dijital pazarlama uzmanı', path: '/roller/dijital-pazarlama/', role: 'dijital-pazarlama', no: 2 },
  { label: 'İstoç Pazarlama CRM uzmanı', path: '/roller/pazarlamaci/', role: 'pazarlamaci', no: 3 },
  { label: 'Saha satış uzmanı', path: '/roller/saha-uzmani/', role: 'saha-uzmani', no: 4, also: ['/roller/ekip-lideri/'] },
  { label: 'Organizatör', path: '/roller/organizator/', role: 'organizator', no: 5 },
  { label: 'Segika CRM', path: '/roller/segika/', role: 'segika', no: 6 },
  { label: 'Asistan', path: '/roller/asistan/', role: 'asistan', no: 7 },
];

/** “İstihdam” menüsünün sonunda (organizasyon ve rollerden sonra): işe alım sırası. */
export const HIRING_NAV = { label: 'İstihdam takvimi', path: '/istihdam/' };

/** “Pazarlama” açılır menüsü (kullanıcı kararı 2026-10-20). */
export const MARKETING_NAV = [
  { label: '90 gün hedefleri', path: '/hedefler/' },
  { label: 'Gelir planı', path: '/gelir-plani/' },
  { label: 'Eylem planı', path: '/eylem-plani/' },
  { label: 'MLM ağı', path: '/buyume-modeli/' },
  { label: 'İş ortaklığı', path: '/partnership/' },
  { label: 'Karar yetkisi', path: '/karar-yetkisi/' },
  { label: 'Karar bekleyenler', path: '/karar-bekleyenler/' },
  { label: 'Parametreler', path: '/parametreler/' },
];

/** “Giderler” açılır menüsü (kullanıcı kararı 2026-10-27): OPEX ve nakit akış tablosu. */
export const FINANCE_NAV = [
  { label: 'Giderler (OPEX)', path: '/giderler/' },
  { label: 'Nakit akış tablosu', path: '/nakit-akisi/' },
];

export const COMMON_NAV = [{ label: 'Notlar', path: '/notlar/' }];
