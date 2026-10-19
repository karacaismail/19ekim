import type { RoleKey } from '../data/types';

/** Sayfaya gömülen grafik verisi; ECharts seçenekleri istemcide tasarım tokenlarıyla kurulur. */
export type ChartSpec =
  | { kind: 'gelir-ay'; months: string[]; first: number[]; renew: number[]; target: number }
  | { kind: 'kopru'; scenarios: string[]; first: number[]; renew: number[]; target: number }
  | { kind: 'kaynak-ay'; months: string[]; unit: string; series: { name: string; role: RoleKey; values: number[] }[] }
  | { kind: 'satici-yapisi'; items: { name: string; value: number }[] }
  | { kind: 'senaryo'; items: { name: string; value: number }[]; target: number }
  | { kind: 'piramit'; items: { name: string; count: number; role: RoleKey }[] }
  | { kind: 'huni'; items: { name: string; value: number }[]; role: RoleKey }
  | {
      kind: 'takvim';
      start: string;
      end: number;
      rows: { name: string; from: number; to: number; role: RoleKey; text: string; alt?: boolean }[];
      marks: { day: number; label: string }[];
    };
