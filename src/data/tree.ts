import { getRole } from './roles';
import type { Role, RoleKey } from './types';

/**
 * Ağaç yapısı: tepede İsmail Karaca; altında rol bazlı dört ağaç.
 * Her ağaç dallara (rol kartı, bir gün, hafta, hedefler, iş akışı, 90 gün, personel onboarding’i),
 * her dal da alt dallara ayrılır. Sunum sırası (SEQUENCE) önceki/sonraki gezinmesini belirler.
 */

export const APEX = {
  name: 'İsmail Karaca',
  title: 'Strateji ve operasyon yönetimi',
  desc: 'Stratejiyi geliştirir, operasyonu yönetir; harcama yetki sınırı içinde karar verir.',
};

export const STAFF: { title: string; role: RoleKey; desc: string; path?: string }[] = [
  { title: 'Asistan', role: 'asistan', desc: 'Karar dokümanları, araştırma, Scrum desteği', path: '/roller/asistan/' },
  { title: 'Yazılım ekibi', role: 'yazilim', desc: '4 kişi, Scrum; changelog içerik kaynağı' },
];

export interface Branch {
  code: string;
  label: string;
  path: string;
  leaves: string[];
}

export interface Tree {
  no: number;
  role: RoleKey;
  title: string;
  people: string;
  start: string;
  path: string;
  branches: Branch[];
}

function shortKpi(role: Role, index: number) {
  const k = role.kpis[index];
  if (!k) return null;
  return `${k.metric}: ${k.daily !== '—' ? `${k.daily} / gün` : `${k.weekly} / hafta`}`;
}

function longestBlocks(role: Role, count: number) {
  const minutes = (time: string) => {
    const [a, b] = time.split('–').map((t) => t.trim().split(':').map(Number));
    return b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
  };
  return [...role.daily]
    .filter((row) => row.tone !== 'break' && !/stand-up|senkron|toplantı|brifing|daily|kapanış/i.test(row.block))
    .sort((x, y) => minutes(y.time) - minutes(x.time))
    .slice(0, count)
    .sort((x, y) => x.time.localeCompare(y.time))
    .map((row) => `${row.time.split('–')[0]} ${row.block}`);
}

function roleBranches(no: number, role: Role): Branch[] {
  const base = `/roller/${role.slug}/`;
  const months = role.plan.rows.filter((_, i, all) => i === 0 || i === Math.floor(all.length / 2) || i === all.length - 1);
  return [
    { code: `${no}.1`, label: 'Rol kartı', path: `${base}#rol-karti`, leaves: [role.count, role.start.split(' (')[0], role.qualifications.fromSource.slice(0, 2).join(', ')] },
    { code: `${no}.2`, label: 'Bir gün', path: `${base}#bir-gun`, leaves: longestBlocks(role, 3) },
    { code: `${no}.3`, label: 'Hafta', path: `${base}#hafta`, leaves: role.weekly.slice(0, 3).map((d) => `${d.day}: ${d.focus}`) },
    { code: `${no}.4`, label: 'Hedefler', path: `${base}#hedefler`, leaves: [0, 1, 2].map((i) => shortKpi(role, i)).filter((x): x is string => !!x) },
    { code: `${no}.5`, label: 'İş akışı', path: `${base}#is-akisi`, leaves: [role.workflow.title, `${role.workflow.steps.length} adım`] },
    { code: `${no}.6`, label: '90 gün', path: `${base}#plan`, leaves: months.map((r) => `${r.week} ${r.focus}`) },
    { code: `${no}.7`, label: 'Personel onboarding’i', path: `${base}#onboarding`, leaves: role.firstWeek.slice(0, 2) },
  ];
}

function makeTree(no: number, slug: RoleKey, title: string, extra: Branch[] = []): Tree {
  const role = getRole(slug);
  return {
    no,
    role: slug,
    title,
    people: role.count,
    start: role.start.split(' (')[0],
    path: `/roller/${slug}/`,
    branches: [...roleBranches(no, role), ...extra],
  };
}

export const TREES: Tree[] = [
  makeTree(1, 'dijital-pazarlama', 'Dijital pazarlama', [
    { code: '1.8', label: 'İçerik basamakları', path: '/roller/dijital-pazarlama/#basamaklar', leaves: ['Sıfır Noktası → 101 → 201 → 301 → 401 → 501', 'content ← changelog'] },
    { code: '1.9', label: 'Meta işe alım reklamları', path: '/buyume-modeli/#meta', leaves: ['Haftalık 5.000 ₺, sürekli', 'Personel ve temsilci bulma'] },
  ]),
  makeTree(2, 'pazarlamaci', 'Masa başı pazarlama'),
  makeTree(3, 'saha-uzmani', 'Saha satış', [
    { code: '3.8', label: 'Ekip lideri', path: '/roller/ekip-lideri/', leaves: ['1 Aralık; ekip içinden seçilir', 'Ağın sponsoru ve koçu'] },
    { code: '3.9', label: 'Çok katmanlı pazarlama ağı', path: '/buyume-modeli/', leaves: ['Bağımsız satış temsilcileri', 'Ocak sonu 25 aktif temsilci'] },
  ]),
  makeTree(4, 'organizator', 'Organizatör', [
    { code: '4.8', label: 'Satıcı eğitimleri', path: '/egitim-programi/', leaves: ['Her iş günü 17:00–18:00', 'M1 → M5 ve mentor programı'] },
  ]),
];

export interface Stop {
  path: string;
  label: string;
  crumb: string[];
}

/** Doğrusal sunum sırası: ağacın tepesinden dallara, sonra ortak sayfalara. */
export const SEQUENCE: Stop[] = [
  { path: '/', label: 'Genel ağaç', crumb: [] },
  { path: '/roller/dijital-pazarlama/', label: 'Ağaç 1 · Dijital pazarlama', crumb: ['Ağaç 1 · Dijital pazarlama'] },
  { path: '/roller/pazarlamaci/', label: 'Ağaç 2 · Masa başı pazarlama', crumb: ['Ağaç 2 · Masa başı pazarlama'] },
  { path: '/roller/saha-uzmani/', label: 'Ağaç 3 · Saha satış', crumb: ['Ağaç 3 · Saha satış'] },
  { path: '/roller/ekip-lideri/', label: 'Ağaç 3 · Ekip lideri', crumb: ['Ağaç 3 · Saha satış', 'Ekip lideri'] },
  { path: '/buyume-modeli/', label: 'Ağaç 3 · Çok katmanlı pazarlama ağı', crumb: ['Ağaç 3 · Saha satış', 'Çok katmanlı pazarlama ağı'] },
  { path: '/roller/organizator/', label: 'Ağaç 4 · Organizatör', crumb: ['Ağaç 4 · Organizatör'] },
  { path: '/egitim-programi/', label: 'Ağaç 4 · Satıcı eğitimleri', crumb: ['Ağaç 4 · Organizatör', 'Satıcı eğitimleri'] },
  { path: '/roller/asistan/', label: 'Kurmay · Asistan', crumb: ['Kurmay · Asistan'] },
  { path: '/hedefler/', label: 'Ortak · Hedefler', crumb: ['Ortak · Hedefler'] },
  { path: '/eylem-plani/', label: 'Ortak · Eylem planı', crumb: ['Ortak · Eylem planı'] },
  { path: '/is-akislari/', label: 'Ortak · İş akışları', crumb: ['Ortak · İş akışları'] },
  { path: '/istihdam/', label: 'Ortak · İstihdam', crumb: ['Ortak · İstihdam'] },
  { path: '/calisma-duzeni/', label: 'Ortak · Çalışma düzeni', crumb: ['Ortak · Çalışma düzeni'] },
];

export const TREE_NAV: { label: string; path: string; role?: RoleKey; no?: number; also?: string[] }[] = [
  { label: 'Genel ağaç', path: '/' },
  { label: 'Dijital pazarlama', path: '/roller/dijital-pazarlama/', role: 'dijital-pazarlama', no: 1 },
  { label: 'Masa başı pazarlama', path: '/roller/pazarlamaci/', role: 'pazarlamaci', no: 2 },
  { label: 'Saha satış', path: '/roller/saha-uzmani/', role: 'saha-uzmani', no: 3, also: ['/roller/ekip-lideri/', '/buyume-modeli/'] },
  { label: 'Organizatör', path: '/roller/organizator/', role: 'organizator', no: 4, also: ['/egitim-programi/'] },
  { label: 'Asistan', path: '/roller/asistan/', role: 'asistan' },
];

export const COMMON_NAV = [
  { label: 'Hedefler', path: '/hedefler/' },
  { label: 'Eylem planı', path: '/eylem-plani/' },
  { label: 'İş akışları', path: '/is-akislari/' },
  { label: 'İstihdam', path: '/istihdam/' },
  { label: 'MLM ağı', path: '/buyume-modeli/' },
  { label: 'Çalışma düzeni', path: '/calisma-duzeni/' },
];
