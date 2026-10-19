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
  | { kind: 'mix'; unit: string; items: { name: string; value: number; role: RoleKey }[] };
