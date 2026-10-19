import { getRole } from './roles';
import type { RoleKey } from './types';

/**
 * Organizasyon şeması (ECharts ağacı): tepede İsmail Karaca; altında kurmay ve rol bazlı dört ağaç.
 * Düğümler rol sayfalarına bağlanır; sunum sırası (SEQUENCE) önceki/sonraki gezinmesini belirler.
 */

export interface OrgNode {
  name: string;
  sub: string;
  role: RoleKey;
  href?: string;
  children?: OrgNode[];
}

const node = (slug: RoleKey, name: string, extra: Partial<OrgNode> = {}): OrgNode => {
  const role = getRole(slug);
  return { name, sub: `${role.count.split(' (')[0]} · ${role.start.split(' (')[0]}`, role: slug, href: `/roller/${slug}/`, ...extra };
};

export const ORG: OrgNode = {
  name: 'İsmail Karaca',
  sub: 'Strateji ve operasyon',
  role: 'yonetici',
  children: [
    node('asistan', 'Asistan', { sub: '1 kişi · 1 Kasım (onay bekliyor)' }),
    { name: 'Yazılım ekibi', sub: '4 kişi · Scrum', role: 'yazilim' },
    node('dijital-pazarlama', 'Ağaç 1 · Dijital pazarlama'),
    node('pazarlamaci', 'Ağaç 2 · Masa başı (CRM)'),
    {
      name: 'Ağaç 3 · Saha satış',
      sub: 'Kayıt · abonelik · ağ',
      role: 'saha-uzmani',
      href: '/roller/saha-uzmani/',
      children: [
        node('saha-uzmani', 'Saha ekibi', { sub: '3 kişi · 2’si 1 Kasım, 1’i 1 Aralık' }),
        node('ekip-lideri', 'Ekip lideri', {
          children: [{ name: 'Bağımsız temsilciler', sub: 'Ayda ~2 · Ocak sonu ~5', role: 'ekip-lideri', href: '/buyume-modeli/' }],
        }),
      ],
    },
    node('organizator', 'Ağaç 4 · Organizatör'),
  ],
};

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
  { path: '/roller/asistan/', label: 'Kurmay · Asistan', crumb: ['Kurmay · Asistan'] },
  { path: '/istihdam/', label: 'İstihdam takvimi', crumb: ['İstihdam takvimi'] },
  { path: '/hedefler/', label: '90 gün hedefleri', crumb: ['90 gün hedefleri'] },
  { path: '/eylem-plani/', label: 'Eylem planı', crumb: ['Eylem planı'] },
  { path: '/karar-yetkisi/', label: 'Karar yetkisi ve kontrol noktaları', crumb: ['Karar yetkisi ve kontrol noktaları'] },
  { path: '/karar-bekleyenler/', label: 'Karar bekleyenler', crumb: ['Karar bekleyenler'] },
];

export const TREE_NAV: { label: string; path: string; role?: RoleKey; no?: number; also?: string[] }[] = [
  { label: 'Organizasyon', path: '/' },
  { label: 'Dijital pazarlama', path: '/roller/dijital-pazarlama/', role: 'dijital-pazarlama', no: 1 },
  { label: 'Masa başı', path: '/roller/pazarlamaci/', role: 'pazarlamaci', no: 2 },
  { label: 'Saha satış', path: '/roller/saha-uzmani/', role: 'saha-uzmani', no: 3, also: ['/roller/ekip-lideri/', '/buyume-modeli/'] },
  { label: 'Organizatör', path: '/roller/organizator/', role: 'organizator', no: 4 },
  { label: 'Asistan', path: '/roller/asistan/', role: 'asistan' },
];

export const COMMON_NAV = [
  { label: 'İstihdam takvimi', path: '/istihdam/' },
  { label: '90 gün hedefleri', path: '/hedefler/' },
  { label: 'Eylem planı', path: '/eylem-plani/' },
  { label: 'MLM ağı', path: '/buyume-modeli/' },
  { label: 'Karar yetkisi', path: '/karar-yetkisi/' },
  { label: 'Karar bekleyenler', path: '/karar-bekleyenler/' },
];
