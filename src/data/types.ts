export type RoleKey =
  | 'yonetici'
  | 'asistan'
  | 'ekip-lideri'
  | 'pazarlamaci'
  | 'saha-uzmani'
  | 'organizator'
  | 'dijital-pazarlama'
  | 'yazilim'
  | 'yatirimci';

/** karar: alınmış karar · oneri: bu planın önerisi · bekliyor: karar bekliyor */
export type Status = 'karar' | 'oneri' | 'bekliyor';

export interface ScheduleRow {
  time: string;
  block: string;
  tone?: 'break';
}

/** SMART görev: ne yapılır ve nasıl ölçülür. */
export interface Task {
  task: string;
  measure: string;
}

export interface Kpi {
  metric: string;
  value: string;
  unit: string;
  when: string;
}

/** Tarihli, ölçülebilir eylem: ne yapılır, ne zaman, hangi hedefle. */
export interface PlanRow {
  from: string;
  to: string;
  action: string;
  target: string;
  milestone?: boolean;
}

/** Ana hedefin aylara göre artışı (grafik için). */
export interface Ramp {
  metric: string;
  values: number[];
  months?: string[];
  second?: { metric: string; values: number[] };
}

export interface Role {
  slug: RoleKey;
  tree: string;
  title: string;
  shortTitle: string;
  icon: 'phone' | 'map' | 'presentation' | 'notebook' | 'flag' | 'video';
  count: string;
  start: string;
  startStatus: Status;
  pay: string;
  reportsTo: string;
  seeks: string[];
  mission: string;
  tasks: Task[];
  kpis: Kpi[];
  ramp: Ramp;
  plan: PlanRow[];
  /** Dönem 1 (2 Kasım–30 Ocak) saatleri; `fromFeb`: 1 Şubat’tan Dönem 2 (haftada 45 saat). */
  hours: { weekday: string; saturday: string; weeklyNet: string; fromFeb: string };
  daily: ScheduleRow[];
  saturday: ScheduleRow[];
}
