import type { RoleKey } from '../data/types';

/** Ağaç düğümü (organizasyon ve yönetişim şemaları). `href` site köküne göre çözülmüştür. */
export interface ChartTreeNode {
  name: string;
  sub?: string;
  role: RoleKey;
  href?: string;
  children?: ChartTreeNode[];
}

export interface GanttRow {
  name: string;
  from: string;
  to: string;
  role: RoleKey;
  text: string;
  milestone?: boolean;
}

/** Giderler (OPEX) grafik tonları: renk tokens.css --viz-* tokenlarından okunur (doğrulanmış kategorik palet). */
export type OpexTone = 'tech' | 'people' | 'office' | 'net' | 'tax' | 'sgk' | 'employer' | 'y2026' | 'y2027' | 'total' | 'credit';

/** Sayfaya gömülen grafik verisi; ECharts seçenekleri istemcide tasarım tokenlarıyla kurulur. */
export type ChartSpec =
  | { kind: 'org'; root: ChartTreeNode }
  | { kind: 'gov'; root: ChartTreeNode }
  | { kind: 'gantt'; start: string; end: string; rows: GanttRow[]; marks: { date: string; label: string }[] }
  | { kind: 'ramp'; months: string[]; role: RoleKey; series: { name: string; values: number[] }[] }
  | { kind: 'pay'; role: RoleKey; items: { name: string; value: number }[] }
  | { kind: 'kopru'; scenarios: string[]; first: number[]; renew: number[]; target: number }
  | { kind: 'gelir-ay'; months: string[]; first: number[]; renew: number[]; target: number }
  | { kind: 'kaynak-ay'; months: string[]; unit: string; series: { name: string; role: RoleKey; values: number[] }[] }
  | { kind: 'checkpoint'; days: string[]; aktif: number[]; ciro: number[]; target: number }
  | { kind: 'deadlines'; start: string; end: string; items: { name: string; date: string; role: RoleKey }[] }
  | { kind: 'piramit'; items: { name: string; count: number; role: RoleKey }[] }
  | { kind: 'huni'; items: { name: string; value: number }[]; role: RoleKey }
  /** Doğrusal hat: adımlar yukarıdan aşağı zincir olarak çizilir. */
  | { kind: 'chain'; steps: { name: string; sub: string; role: RoleKey }[] }
  /** Adetli halka grafik (ör. haftalık içerik karması). */
  | { kind: 'mix'; unit: string; items: { name: string; value: number; role: RoleKey }[] }
  /** Kümülatif çizgiler ve yatay tavan çizgisi (ör. yıllık fazla çalışma). */
  /** BCG matrisi (sayısal): yatay göreli pay (log), dikey pazar büyümesi (%), balon = ciro. */
  | {
      kind: 'bcg-num';
      quadrants: { key: string; name: string }[];
      growthSplit: number;
      shareSplit: number;
      items: { name: string; growth: number; share: number; revenue: number; quadrant: string }[];
    }
  | { kind: 'cumulative'; labels: string[]; unit: string; cap: number; capLabel: string; series: { name: string; role: RoleKey; values: number[]; dashed?: boolean }[] }
  /** OPEX: tek seri yatay çubuk (₺); `share` verilirse etiket payı da gösterir. */
  | { kind: 'opex-bar'; items: { name: string; value: number; tone: OpexTone }[]; share?: number }
  /** OPEX: yığılmış çubuk (₺); `line` toplam karşılaştırması. opex-stack: geniş kapsayıcıda dikey, dar kapsayıcıda yatay; opex-stack-h: hep yatay. */
  | {
      kind: 'opex-stack' | 'opex-stack-h';
      categories: string[];
      series: { name: string; tone: OpexTone; values: number[] }[];
      line?: { name: string; values: number[] };
    }
  /** OPEX: gruplanmış yatay çubuk (ör. kişi başına 2026 ve 2027). */
  | { kind: 'opex-group'; categories: string[]; series: { name: string; tone: OpexTone; values: number[] }[] }
  /** OPEX: yatay şelale (netten işveren maliyetine köprü); `total` adımı sıfırdan çizilir. */
  /** OPEX: tek yığılmış yatay çubuk — bir toplamın parçaları (ör. işveren maliyeti); tutar ve pay açıklamada. */
  | { kind: 'opex-bilesim'; total: { name: string; value: number }; parts: { name: string; value: number; tone: OpexTone }[] };
