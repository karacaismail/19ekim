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
  work: string;
  output: string;
  tone?: 'break' | 'milestone';
}

export interface WeeklyRow {
  day: string;
  focus: string;
  work: string;
  output: string;
}

export interface KpiRow {
  metric: string;
  daily: string;
  weekly: string;
  ramp: string;
}

export interface PlanRow {
  week: string;
  dates: string;
  focus: string;
  actions: string[];
  target: string;
  tone?: 'milestone';
}

export interface FlowBranch {
  when: string;
  then: string;
}

export interface FlowStep {
  title: string;
  owners: RoleKey[];
  detail: string;
  output?: string;
  sla?: string;
  kind?: 'step' | 'decision';
  branches?: FlowBranch[];
}

export interface Workflow {
  id: string;
  title: string;
  desc: string;
  steps: FlowStep[];
}

export interface RiskRow {
  risk: string;
  mitigation: string;
}

export interface Role {
  slug: RoleKey;
  title: string;
  shortTitle: string;
  icon: 'phone' | 'map' | 'presentation' | 'notebook' | 'flag' | 'video';
  boardNote: string;
  count: string;
  start: string;
  startStatus: Status;
  step: string;
  employment: string;
  reportsTo: string;
  worksWith: string;
  mission: string;
  summary: string;
  responsibilities: string[];
  qualifications: {
    source: string;
    fromSource: string[];
    required: string[];
    plus: string[];
  };
  tools: string[];
  hours: { weekday: string; saturday: string; weeklyNet: string };
  daily: ScheduleRow[];
  saturday: ScheduleRow[];
  weekly: WeeklyRow[];
  kpis: KpiRow[];
  workflow: Workflow;
  plan: { range: string; rows: PlanRow[] };
  firstWeek: string[];
  risks: RiskRow[];
}
