import { shortDate } from '../lib/dates';
import { int } from '../lib/format';
import type { Params } from './params';
import type { Program } from './program';
import type { RoleKey } from './types';

/**
 * BCG matrisi (Boston Consulting Group büyüme–pay matrisi): ürünleri iki soruyla dört kutuya ayırır.
 * Pazar büyümesi ve pazar payı henüz ölçülmedi; konumlar yalnız kutuyu gösterir (sayısal değer değildir).
 */

export type QuadrantKey = 'yildiz' | 'soru' | 'inek' | 'kopek';

export interface Quadrant {
  key: QuadrantKey;
  name: string;
  growth: string;
  share: string;
  cash: string;
  action: string;
  next: string;
}

export const QUADRANTS: Quadrant[] = [
  {
    key: 'yildiz',
    name: 'Yıldız',
    growth: 'Hızlı',
    share: 'Yüksek (lideriz)',
    cash: 'Çok kazanır, büyümek için çok harcar',
    action: 'Yatırıma devam et, liderliği koru',
    next: 'Pazar yavaşlayınca Nakit ineği olur',
  },
  {
    key: 'soru',
    name: 'Soru işareti',
    growth: 'Hızlı',
    share: 'Düşük (henüz küçüğüz)',
    cash: 'Çok harcar, az kazanır',
    action: 'Seç: hızla pay kazanabiliyorsan yatırım yap, kazanamıyorsan bırak',
    next: 'Ya Yıldız olur ya Köpek',
  },
  {
    key: 'inek',
    name: 'Nakit ineği',
    growth: 'Yavaş',
    share: 'Yüksek (lideriz)',
    cash: 'Çok kazanır, az harcar',
    action: 'Verimli işlet; kazandığı nakdi Soru işaretlerine aktar',
    next: 'Uzun süre nakit üretir',
  },
  {
    key: 'kopek',
    name: 'Köpek',
    growth: 'Yavaş',
    share: 'Düşük',
    cash: 'Az kazanır, az harcar',
    action: 'Para bağlama; küçük tut veya çık',
    next: 'Kapatılır ya da elden çıkarılır',
  },
];

export const AXES = [
  { axis: 'Dikey eksen', name: 'Pazar büyüme hızı', question: 'Pazarın kendisi yılda ne kadar büyüyor?', rule: 'Genelde yıllık %10 üstü “hızlı” sayılır.' },
  {
    axis: 'Yatay eksen',
    name: 'Göreli pazar payı',
    question: 'Bu pazarda en büyük rakibe göre ne kadar büyüğüz?',
    rule: 'Bizim payımız ÷ en büyük rakibin payı. 1’in üstü: lideriz; 1’in altı: rakip bizden büyük.',
  },
];

export interface PortfolioItem {
  name: string;
  role: RoleKey;
  market: string;
  growth: string;
  share: string;
  quadrant: QuadrantKey;
  strategy: string;
  /** Grafikte kutu içi konum (0–1). Ölçülmüş değer değildir; yalnız kutuyu gösterir. */
  x: number;
  y: number;
  uncertain?: boolean;
  /** Ok: hedeflenen hareket (yön). */
  toward?: { x: number; y: number; label: string };
}

export function makeBcg(p: Params, prog: Program) {
  const [, day60] = prog.checkpoints;
  const items: PortfolioItem[] = [
    {
      name: 'istoc.com satıcı aboneliği',
      role: 'saha-uzmani',
      market: 'İstoç toptancılarının dijital satış kanalı (B2B e-ticaret)',
      growth: 'Hızlı (varsayım; ölçülmedi)',
      share: 'Çok düşük (pazara yeni giriş)',
      quadrant: 'soru',
      strategy: `Seçici yatırım: 90 günde ${int(p.activeTarget)} aktif satıcı. ${shortDate(day60.date)} kontrolünde ≥ ${int(day60.aktif)} aktif yoksa iyileştir veya durdur.`,
      x: 0.16,
      y: 0.78,
      toward: { x: 0.62, y: 0.8, label: 'Hedef: pay kazanıp Yıldız olmak' },
    },
    {
      name: 'Segika SGK teşvik yazılımı',
      role: 'segika',
      market: 'İşverenlere SGK teşvik hesaplama ve başvuru yazılımı',
      growth: 'Ölçülmedi',
      share: 'Düşük (yeni satış hattı)',
      quadrant: 'soru',
      strategy: `Düşük maliyetli test: ${p.segikaCount} masa başı (CRM) kişisi. 90 günde randevu ve satış ölçülür; pazar yavaş çıkarsa Köpek sayılır ve küçük tutulur.`,
      x: 0.2,
      y: 0.58,
      uncertain: true,
      toward: { x: 0.2, y: 0.3, label: 'Pazar yavaşsa: Köpek riski' },
    },
  ];

  const measurements = [
    {
      what: 'istoc.com pazar büyümesi',
      how: 'Ticaret Bakanlığı e-ticaret raporu ve toptan ticaret verileriyle yıllık büyüme',
      owner: 'asistan' as RoleKey,
      date: prog.dates.day30,
    },
    {
      what: 'istoc.com göreli pazar payı',
      how: 'İstoç’taki dijital satış yapan satıcı sayısı: bizde ÷ en büyük rakipte (saha blok haritasıyla)',
      owner: 'saha-uzmani' as RoleKey,
      date: prog.dates.day30,
    },
    {
      what: 'Segika pazar büyümesi',
      how: 'SGK teşvik istatistikleri ve rakip yazılımların müşteri sayısıyla yıllık büyüme',
      owner: 'asistan' as RoleKey,
      date: prog.dates.day30,
    },
  ];

  return { items, measurements };
}
