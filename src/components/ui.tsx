import type { CSSProperties, ReactNode } from 'react';
import { Anchor, Badge, Table, Text, Title } from '@mantine/core';
import {
  IconBuildingBank,
  IconCode,
  IconCompass,
  IconFlag,
  IconMapPin,
  IconMovie,
  IconNotebook,
  IconPhoneCall,
  IconPresentation,
} from '@tabler/icons-react';
import { ROLE_LABELS } from '../data/roles';
import type { FlowStep, KpiRow, PlanRow, Role, RoleKey, ScheduleRow, Status, WeeklyRow } from '../data/types';
import type { ChartSpec } from '../lib/chartSpec';
import { href } from '../lib/paths';

const STATUS_LABELS: Record<Status, string> = {
  karar: 'Karar',
  oneri: 'Öneri',
  bekliyor: 'Karar bekliyor',
};

const ROLE_ICONS: Record<RoleKey, typeof IconPhoneCall> = {
  pazarlamaci: IconPhoneCall,
  'saha-uzmani': IconMapPin,
  organizator: IconPresentation,
  'dijital-pazarlama': IconMovie,
  asistan: IconNotebook,
  'ekip-lideri': IconFlag,
  yonetici: IconCompass,
  yazilim: IconCode,
  yatirimci: IconBuildingBank,
};

export function RoleChip({ role, label }: { role: RoleKey; label?: string }) {
  return (
    <Badge unstyled component="span" className="chip" data-role={role}>
      {label ?? ROLE_LABELS[role]}
    </Badge>
  );
}

export function StatusChip({ status }: { status: Status }) {
  return (
    <Badge unstyled component="span" className="chip" data-status={status}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

export function Avatar({ role, large = false }: { role: RoleKey; large?: boolean }) {
  const Icon = ROLE_ICONS[role];
  return (
    <span className={large ? 'avatar avatar-lg' : 'avatar'} data-role={role} aria-hidden="true">
      <Icon size={large ? 28 : 22} stroke={1.75} />
    </span>
  );
}

export function TextLink({ to, children, standalone = false }: { to: string; children: ReactNode; standalone?: boolean }) {
  return (
    <Anchor href={href(to)} className="text-link" underline="always" data-standalone={standalone ? '' : undefined}>
      {children}
    </Anchor>
  );
}

export function Hero({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow: string;
  title: string;
  lead: string;
  children?: ReactNode;
}) {
  return (
    <header className="hero">
      <p className="eyebrow">{eyebrow}</p>
      <Title order={1} className="display">
        {title}
      </Title>
      <Text component="p" className="lead">
        {lead}
      </Text>
      {children}
    </header>
  );
}

export function FactsRow({ items }: { items: { label: string; value: ReactNode }[] }) {
  return (
    <dl className="facts-row">
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Section({
  id,
  index,
  title,
  desc,
  children,
}: {
  id: string;
  index: number | string;
  title: string;
  desc?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-baslik`}>
      <div className="section-head">
        <span className="section-index" aria-hidden="true">
          {typeof index === 'number' ? String(index).padStart(2, '0') : index}
        </span>
        <Title order={2} className="section-title" id={`${id}-baslik`}>
          {title}
        </Title>
        {desc ? (
          <Text component="p" className="section-desc">
            {desc}
          </Text>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export function Subsection({ id, title, children }: { id: string; title: string; children?: ReactNode }) {
  return (
    <section className="subsection" id={id} aria-labelledby={`${id}-baslik`}>
      <Title order={3} className="subsection-title" id={`${id}-baslik`}>
        {title}
      </Title>
      {children}
    </section>
  );
}

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="Bu sayfada">
      <ul className="toc">
        <li className="toc-label" aria-hidden="true">
          Bu sayfada:
        </li>
        {items.map((item) => (
          <li key={item.id}>
            <a className="toc-link" href={`#${item.id}`}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function RoleSwitch({ roles, current }: { roles: Role[]; current: RoleKey }) {
  return (
    <nav aria-label="Roller">
      <ul className="role-switch">
        {roles.map((role) => (
          <li key={role.slug}>
            <a
              className="role-switch-link"
              data-role={role.slug}
              href={href(`/roller/${role.slug}/`)}
              aria-current={role.slug === current ? 'page' : undefined}
            >
              {role.shortTitle}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/* ---------- Tablolar ---------- */

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Okunabilir en küçük sütun genişliği; ekran daralınca sütun değil tablo kayar. */
  minWidth?: string;
  nowrap?: boolean;
  rowHeader?: boolean;
  sticky?: boolean;
  role?: RoleKey;
  render: (row: T) => ReactNode;
}

export function DataTable<T>({
  id,
  title,
  note,
  columns,
  rows,
  rowTone,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  columns: Column<T>[];
  rows: T[];
  rowTone?: (row: T) => string | undefined;
}) {
  const titleId = `${id}-tablo`;
  const cellClass = (col: Column<T>) =>
    [col.nowrap ? 'cell-nowrap' : '', col.sticky ? 'cell-sticky' : ''].filter(Boolean).join(' ') || undefined;
  return (
    <div className="table-block">
      <h3 className="block-title" id={titleId}>
        {title}
      </h3>
      {note ? <p className="table-note">{note}</p> : null}
      <span className="table-hint" aria-hidden="true">
        Tabloyu yatay kaydırabilirsiniz.
      </span>
      <div className="table-frame">
      <div className="table-scroll" role="region" aria-labelledby={titleId} tabIndex={0}>
        <Table className="data-table" withRowBorders withTableBorder={false} verticalSpacing="sm" horizontalSpacing="md">
          <Table.Thead>
            <Table.Tr>
              {columns.map((col) => (
                <Table.Th
                  key={col.key}
                  scope="col"
                  className={cellClass(col)}
                  data-role={col.role}
                  style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                >
                  {col.header}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {rows.map((row, index) => (
              <Table.Tr key={index} data-tone={rowTone?.(row)}>
                {columns.map((col) =>
                  col.rowHeader ? (
                    <Table.Th key={col.key} scope="row" className={cellClass(col)}>
                      {col.render(row)}
                    </Table.Th>
                  ) : (
                    <Table.Td key={col.key} className={cellClass(col)} data-role={col.role} data-edge={col.role ? 'start' : undefined}>
                      {col.render(row)}
                    </Table.Td>
                  ),
                )}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </div>
      </div>
    </div>
  );
}

export function CellList({ items }: { items: string[] }) {
  return (
    <ul className="cell-list">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/* ---------- Bir gün: süreyle orantılı zaman blokları ---------- */

function toMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number);
  return h * 60 + m;
}

function splitRange(range: string): [string, string] {
  const [start, end] = range.split('–');
  return [start.trim(), end.trim()];
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m} dk`;
  return m === 0 ? `${h} sa` : `${h} sa ${m} dk`;
}

const MEETING = /stand-up|senkron|toplantı|brifing|daily|kapanış/i;

function slotKind(row: ScheduleRow): 'break' | 'key' | 'meeting' | 'work' {
  if (row.tone === 'break') return 'break';
  if (row.tone === 'milestone') return 'key';
  if (MEETING.test(row.block)) return 'meeting';
  return 'work';
}

export function DayTimeline({ role, rows, label }: { role: RoleKey; rows: ScheduleRow[]; label: string }) {
  return (
    <ol className="day" data-role={role} aria-label={label}>
      {rows.map((row) => {
        const [start, end] = splitRange(row.time);
        const minutes = toMinutes(end) - toMinutes(start);
        const style = { '--mins': minutes } as CSSProperties;
        const kind = slotKind(row);
        const isBreak = kind === 'break';
        return (
          <li key={row.time} className="slot" data-kind={kind} style={style}>
            <div className="slot-time">
              <span className="slot-start">{start}</span>
              <span className="slot-end">
                <span className="visually-hidden">bitiş </span>
                {end}
              </span>
            </div>
            <div className="slot-body" data-edge={isBreak ? undefined : 'start'}>
              <p className="slot-title">
                {row.block}
                <span className="slot-dur">{formatDuration(minutes)}</span>
              </p>
              <p className="slot-work">{row.work}</p>
              {row.output && row.output !== '—' ? (
                <p className="slot-output">
                  <span className="visually-hidden">Çıktı: </span>→ {row.output}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function DayLegend({ role }: { role: RoleKey }) {
  return (
    <ul className="day-legend" data-role={role} aria-label="Blok türleri">
      <li>
        <span className="legend-swatch" data-edge="start" aria-hidden="true" />
        Rolün kendi işi
      </li>
      <li>
        <span className="legend-swatch" data-kind="meeting" data-edge="start" aria-hidden="true" />
        Toplantı ve senkron
      </li>
      <li>
        <span className="legend-swatch" data-kind="key" data-edge="start" aria-hidden="true" />
        Günün sabit etkinliği
      </li>
      <li>
        <span className="legend-swatch" data-kind="break" aria-hidden="true" />
        Ara dinlenme
      </li>
    </ul>
  );
}

/* ---------- Hafta ---------- */

export function WeekGrid({ role, rows }: { role: RoleKey; rows: WeeklyRow[] }) {
  return (
    <ol className="week" data-role={role}>
      {rows.map((row) => (
        <li key={row.day} className="week-day" data-edge="top">
          <p className="week-name">{row.day}</p>
          <p className="week-focus">{row.focus}</p>
          <p className="week-work">{row.work}</p>
          <p className="week-output">
            <span className="visually-hidden">Çıktı: </span>→ {row.output}
          </p>
        </li>
      ))}
    </ol>
  );
}

/* ---------- KPI ---------- */

export function KpiGrid({ rows }: { rows: KpiRow[] }) {
  return (
    <ul className="kpis">
      {rows.map((row) => {
        const hasDaily = row.daily !== '—';
        return (
          <li key={row.metric} className="kpi">
            <p className="kpi-label">{row.metric}</p>
            <p className="kpi-value">
              {hasDaily ? row.daily : row.weekly}
              <span className="kpi-unit">{hasDaily ? '/ gün' : '/ hafta'}</span>
            </p>
            {hasDaily && row.weekly !== '—' ? <p className="kpi-weekly">Haftalık: {row.weekly}</p> : null}
            <p className="kpi-ramp">{row.ramp}</p>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Zaman çizelgesi ---------- */

export function PlanTimeline({ role, rows }: { role: RoleKey; rows: PlanRow[] }) {
  return (
    <ol className="timeline" data-role={role}>
      {rows.map((row) => (
        <li key={row.week} className="tl-item" data-tone={row.tone}>
          <div className="tl-when">
            <span className="tl-week">{row.week}</span>
            <span className="tl-dates">{row.dates}</span>
          </div>
          <div className="tl-body">
            <p className="tl-title">
              {row.focus}
              {row.tone === 'milestone' ? <span className="milestone-label">Kilometre taşı</span> : null}
            </p>
            <ul className="tl-actions">
              {row.actions.map((action) => (
                <li key={action}>{action}</li>
              ))}
            </ul>
            <span className="tl-target">Hedef: {row.target}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function EventTimeline({
  items,
}: {
  items: { when: string; title: string; detail: string; status?: Status; milestone?: boolean }[];
}) {
  return (
    <ol className="timeline">
      {items.map((item) => (
        <li key={`${item.when}-${item.title}`} className="tl-item" data-tone={item.milestone ? 'milestone' : undefined}>
          <div className="tl-when">
            <span className="tl-dates">{item.when}</span>
          </div>
          <div className="tl-body">
            <p className="tl-title">
              {item.title}
              {item.milestone ? <span className="milestone-label">Kilometre taşı</span> : null}
            </p>
            <p className="tl-detail">{item.detail}</p>
            {item.status && item.status !== 'karar' ? (
              <div className="chip-row">
                <StatusChip status={item.status} />
              </div>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- İş akışı ---------- */

export function Flow({ steps, label }: { steps: FlowStep[]; label: string }) {
  return (
    <ol className="flow" aria-label={label}>
      {steps.map((step, index) => (
        <li key={step.title} className="flow-step" data-kind={step.kind ?? 'step'}>
          <span className="flow-marker" data-role={step.owners[0]} aria-hidden="true">
            {index + 1}
          </span>
          <div>
            <p className="flow-title">
              <span className="visually-hidden">{`Adım ${index + 1}${step.kind === 'decision' ? ', karar' : ''}: `}</span>
              {step.title}
            </p>
            <div className="flow-owners">
              <span className="visually-hidden">Sorumlu: </span>
              {step.owners.map((owner) => (
                <RoleChip key={owner} role={owner} />
              ))}
            </div>
            <p className="flow-detail">{step.detail}</p>
            {step.output || step.sla ? (
              <dl className="flow-meta">
                {step.output ? (
                  <div>
                    <dt>Çıktı</dt>
                    <dd>{step.output}</dd>
                  </div>
                ) : null}
                {step.sla ? (
                  <div>
                    <dt>Süre</dt>
                    <dd>{step.sla}</dd>
                  </div>
                ) : null}
              </dl>
            ) : null}
            {step.branches ? (
              <ul className="flow-branches">
                {step.branches.map((branch) => (
                  <li key={branch.when} className="flow-branch">
                    <strong>{branch.when}</strong>
                    {branch.then}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        </li>
      ))}
    </ol>
  );
}

/* ---------- Diğer ---------- */

export function Stats({ items }: { items: { label: string; value: string; note?: string }[] }) {
  return (
    <dl className="stats">
      {items.map((item) => (
        <div className="stat" key={item.label} data-edge="top">
          <dt>{item.label}</dt>
          <dd>
            <span className="stat-value">{item.value}</span>
            {item.note ? <span className="stat-note">{item.note}</span> : null}
          </dd>
        </div>
      ))}
    </dl>
  );
}

export function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function Note({ title, children }: { title: string; children: ReactNode }) {
  return (
    <aside className="note" aria-label={title}>
      <p className="note-title">{title}</p>
      {children}
    </aside>
  );
}

export function RoleCard({ role }: { role: Role }) {
  return (
    <a className="role-card" data-role={role.slug} href={href(`/roller/${role.slug}/`)}>
      <span className="role-card-head">
        <Avatar role={role.slug} />
        <span>
          <span className="role-card-title">{role.title}</span>
          <span className="role-card-meta">
            {role.step} · {role.start}
          </span>
        </span>
      </span>
      <span className="role-card-desc">{role.summary}</span>
      <span className="role-card-more">Bir günü ve 90 günü →</span>
    </a>
  );
}

/* ---------- Grafik ----------
 * Veri sayfaya gömülür; ECharts yalnız görünürken istemcide yüklenir (src/scripts/charts.ts).
 * JavaScript yoksa açıklama ve aynı verinin tablosu okunabilir kalır.
 */
export function Chart({
  spec,
  title,
  note,
  summary,
  tall = false,
}: {
  spec: ChartSpec;
  title: string;
  note?: string;
  summary: string;
  tall?: boolean;
}) {
  return (
    <figure className="chart">
      <figcaption>
        <span className="chart-title">{title}</span>
        {note ? <span className="chart-note">{note}</span> : null}
      </figcaption>
      <div
        className="chart-canvas"
        data-chart={JSON.stringify(spec)}
        data-size={tall ? 'tall' : undefined}
        role="img"
        aria-label={summary}
      >
        <p className="chart-fallback">Grafik yükleniyor. Aynı veriler aşağıdaki tabloda.</p>
      </div>
    </figure>
  );
}
