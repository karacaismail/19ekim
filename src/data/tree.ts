import { addDays, longDate } from '../lib/dates';
import { GRUP_ADI, icerikKaydi, type IcerikGrubu } from './icerik';
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
    sub: `${count} kişi, başlangıç ${longDate(date)}`,
    role: slug,
    href: `/roller/${slug}/`,
    ...extra,
  });
  return {
    name: 'İsmail Karaca',
    sub: 'Strateji ve operasyon',
    role: 'yonetici',
    children: [
      node('asistan', 'Asistan', p.asistanCount, p.startDate, { sub: `${p.asistanCount} kişi, başlangıç ${longDate(p.startDate)} (onay bekliyor)` }),
      { name: 'Yazılım ekibi', sub: `${p.softwareCount} kişi, Scrum yöntemiyle çalışır`, role: 'yazilim' },
      node('dijital-pazarlama', 'Dijital pazarlama uzmanı', p.dijitalCount, p.startDate),
      node('pazarlamaci', 'İstoç Pazarlama CRM uzmanı', p.masaCount, p.startDate),
      {
        name: 'Saha satış uzmanı',
        sub: 'Kayıt, abonelik ve ağ',
        role: 'saha-uzmani',
        href: '/roller/saha-uzmani/',
        children: [
          node('saha-uzmani', 'Saha ekibi', p.sahaCount + p.sahaDecCount, p.startDate, {
            sub: p.sahaDecCount ? `${p.sahaCount + p.sahaDecCount} kişi (${p.sahaDecCount} kişi ${longDate(p.decStartDate)} günü katılır)` : `${p.sahaCount} kişi`,
          }),
          node('ekip-lideri', 'Ekip lideri', 1, p.decStartDate, {
            children: [{ name: 'Bağımsız temsilciler', sub: `Ayda yaklaşık 2 kişi, ${longDate(addDays(p.startDate, 90))} günü yaklaşık 5 kişi`, role: 'ekip-lideri', href: '/buyume-modeli/' }],
          }),
        ],
      },
      node('organizator', 'Organizatör', p.organizatorCount, p.decStartDate),
      node('segika', 'Segika CRM', p.segikaCount, p.startDate),
    ],
  };
}

export interface Stop {
  path: string;
  /** Sıra (önceki / sonraki) kısa adı. */
  label: string;
  /**
   * Sayfa başlığının (h1) tam adı, kısa addan farklıysa (gorsel_algi.md F19 sözlüğü, 2026-10-28): sıra adı, başlık ve
   * belge bağlantısı aynı yere işaret eder; `tests/gorsel-algi.spec.ts` V18 her durak için doğrular. Kırıntı burada
   * değildir (docs/contents.md F15, CA-1 2026-10-28): ana ebeveyn yolunu içerik kaydı verir (`src/data/icerik.ts →
   * kirinti()`); sunum sırası yalnız sıradır, kırıntının ve menünün otoritesi değildir.
   */
  tam?: string;
}

/** Doğrusal sunum sırası (önceki / sonraki). Menü `NAV_GROUPS`, kırıntı içerik kaydı: üçü ayrı tanımlanır (F15). */
export const SEQUENCE: Stop[] = [
  { path: '/', label: 'Organizasyon şeması' },
  { path: '/roller/dijital-pazarlama/', label: 'Dijital pazarlama uzmanı' },
  { path: '/roller/pazarlamaci/', label: 'İstoç Pazarlama CRM uzmanı' },
  { path: '/roller/saha-uzmani/', label: 'Saha satış uzmanı' },
  { path: '/roller/ekip-lideri/', label: 'Satış-pazarlama ekip lideri' },
  { path: '/buyume-modeli/', label: 'MLM (çok katmanlı pazarlama)' },
  { path: '/roller/organizator/', label: 'Organizatör' },
  { path: '/roller/segika/', label: 'Segika CRM' },
  { path: '/roller/asistan/', label: 'Asistan' },
  { path: '/istihdam/', label: 'İstihdam takvimi' },
  { path: '/hedefler/', label: '90 gün hedefleri' },
  // Gelir planı (kullanıcı kararı 2026-10-27): kadro kapasitesinden hedef zinciri, senaryolar ve kümülatif gelir.
  { path: '/gelir-plani/', label: 'Gelir planı' },
  { path: '/eylem-plani/', label: 'Eylem planı' },
  { path: '/karar/', label: 'Kararlar' },
  { path: '/parametreler/', label: 'Parametreler' },
  // OPEX kırıntısı “Finans › OPEX (işletme giderleri)” (kullanıcı kararı 13 Kasım 2026) içerik kaydındadır (`kirintiYolu`).
  { path: '/giderler/', label: 'OPEX (işletme giderleri)' },
  { path: '/nakit-akisi/', label: 'Nakit akışı' },
  { path: '/notlar/', label: 'Notlar' },
];

/**
 * “İstihdam” menüsü (kullanıcı kararı 2026-10-21): öğeler 1–7 sıralı numaralı; roller işe alınacak pozisyon adıyla.
 */
export const TREE_NAV: NavLink[] = [
  { label: 'Organizasyon şeması', path: '/', no: 1 },
  { label: 'Dijital pazarlama uzmanı', path: '/roller/dijital-pazarlama/', role: 'dijital-pazarlama', no: 2 },
  { label: 'İstoç Pazarlama CRM uzmanı', path: '/roller/pazarlamaci/', role: 'pazarlamaci', no: 3 },
  { label: 'Saha satış uzmanı', path: '/roller/saha-uzmani/', role: 'saha-uzmani', no: 4, also: ['/roller/ekip-lideri/'] },
  { label: 'Organizatör', path: '/roller/organizator/', role: 'organizator', no: 5 },
  { label: 'Segika CRM', path: '/roller/segika/', role: 'segika', no: 6 },
  { label: 'Asistan', path: '/roller/asistan/', role: 'asistan', no: 7 },
];

/** “İstihdam” menüsünün alt bölümü: takvim ve ücret/performans modelleri. */
export const HIRING_NAV = { label: 'İstihdam takvimi', path: '/istihdam/' };
export const KADRO_NAV = { label: 'Kadro kapasitesi', path: '/kadro-kapasitesi/' };
export const APPLET_NAV = { label: 'Hesap araçları', path: '/applet/', tam: 'Ücret ve performans hesap araçları' };

/** Menü öğesi; etiket ve yol içerik envanterinden (docs/contents.md F15: menü, kırıntı ve sunum sırası ayrı). */
export interface NavLink {
  label: string;
  path: string;
  role?: RoleKey;
  no?: number;
  also?: string[];
  /** Yeni öğe işareti; içerik kaydının `yeni` alanından gelir. */
  yeni?: true;
}
const menu = (id: string): NavLink => {
  const k = icerikKaydi(id);
  return { label: k.menu ?? k.baslik, path: k.path, ...(k.yeni ? { yeni: k.yeni } : {}) };
};

/**
 * Üst gezinme grupları (kullanıcı kararı 2026-10-28, docs/contents.md §5.2): göreve göre beş grup. İstihdam (organizasyon,
 * yedi rol, takvim, Applet — 2026-10-20/21 kararları korunur), Pazarlama (Temsilci ağı, İş ortaklığı, Affilate), Finans
 * (Gelir planı, Giderler, Nakit akışı), Yönetim (Hedefler, Eylem planı, Kararlar, Karar yetkisi), Yardımcı (Varsayımlar ve
 * ayarlar, Notlar, Arşiv). Önceki “Pazarlama” (2026-10-20) ve “Giderler” (2026-10-27) menü kapsamları bu kararla
 * değişti; adresler aynı. Yeni ana adresler (Strateji, Müşteri yolculuğu, Pazarlama operasyonu, Ücret ve çalışma modeli,
 * Ölçüm, Genel bakış, Kaynaklar) içerik taşınınca ilgili gruba girer.
 */
export const MARKETING_NAV: NavLink[] = [
  menu('buyume-modeli'),
  menu('satis-ortakligi'),
  menu('deger-onerisi'),
  // Hizmetler ve küresel pazaryerleri (kullanıcı kararı 2026-11-12): değer önerisi → hizmetler → gelir modelleri → küresel örnekler.
  menu('services'),
  menu('gelir-modelleri'),
  menu('kuresel-pazaryerleri'),
  menu('oyunlastirma'),
  menu('onboarding'),
  menu('politikalar'),
];
export const FINANCE_NAV: NavLink[] = [menu('gelir-plani'), menu('giderler'), menu('nakit-akisi'), menu('butce-2027'), menu('gelir-ongorusu-2027')];
export const MANAGEMENT_NAV: NavLink[] = [menu('hedefler'), menu('eylem-plani'), menu('karar')];
export const HELPER_NAV: NavLink[] = [menu('parametreler'), menu('notlar'), menu('arsiv')];

export interface NavGroup {
  id: IcerikGrubu;
  /** Grup adı: menü düğmesi, çekmece başlığı ve kırıntının ilk parçası aynı sözcük (`GRUP_ADI`). */
  label: string;
  items: NavLink[];
  dividerBefore?: string;
}
export const NAV_GROUPS: NavGroup[] = [
  { id: 'istihdam', label: GRUP_ADI.istihdam, items: [...TREE_NAV, HIRING_NAV, KADRO_NAV, APPLET_NAV], dividerBefore: HIRING_NAV.path },
  { id: 'pazarlama', label: GRUP_ADI.pazarlama, items: MARKETING_NAV },
  { id: 'finans', label: GRUP_ADI.finans, items: FINANCE_NAV },
  { id: 'yonetim', label: GRUP_ADI.yonetim, items: MANAGEMENT_NAV },
  { id: 'yardimci', label: GRUP_ADI.yardimci, items: HELPER_NAV },
];
