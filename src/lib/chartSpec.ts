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
  /** Geçit hedefleri (iş ortaklığı): adım (gün) × seri; yatay gruplanmış çubuk, değer etiketi çubuğun ucunda. */
  | { kind: 'hedef-adim'; steps: string[]; series: { name: string; role: RoleKey; values: number[] }[] }
  /** Kümülatif ₺ senaryoları: ay × seri (çizgi); isteğe bağlı yatay çizgi (hedef, sıfır) ve etiketi (₺ biçimi). */
  | { kind: 'kumulatif-tl'; labels: string[]; target?: number; targetLabel?: string; series: { name: string; role: RoleKey; values: number[]; dashed?: boolean }[] }
  /** Adet çizgileri (senaryo üst üste): ay × seri; tam sayı ekseni. */
  | { kind: 'seri-cizgi'; labels: string[]; unit: string; series: { name: string; role: RoleKey; values: number[]; dashed?: boolean }[] }
  /** ₺ gruplanmış çubuk (senaryo üst üste): geniş ekranda dikey, dar ekranda yatay. */
  | { kind: 'grup-ay'; months: string[]; series: { name: string; role: RoleKey; values: number[] }[] }
  /** Başabaş: aylık gelir ve gider çizgileri; kesişim ayı dikey kesikli çizgi ve işaret. `nokta` ay sırası (kesirli) ya da null. */
  | { kind: 'basabas'; labels: string[]; gelir: number[]; gider: number[]; nokta: number | null; noktaLabel: string }
  /** Başabaş noktası (adet): yatay eksen ödeyen satıcı adedi; gelir ve toplam gider doğruları, kesişim işareti. */
  | { kind: 'basabas-adet'; unit: string; n: number[]; gelir: number[]; gider: number[]; nokta: number | null; noktaLabel: string }
  /** Nakit akışı: ay × giriş/çıkış gruplanmış çubuk ve dönem sonu nakit (geniş: dikey + çizgi; dar: yatay + işaret). */
  | { kind: 'nakit-ay'; months: string[]; inflow: number[]; outflow: number[]; balance: number[] }
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
