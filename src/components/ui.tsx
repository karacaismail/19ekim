import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
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
  IconShieldCheck,
} from '@tabler/icons-react';
import { ROLE_LABELS } from '../data/roles';
import type { Kpi, RoleKey, Status } from '../data/types';
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
  segika: IconShieldCheck,
};

export const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));

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

/**
 * Sayfa başlığı: sıkışık (kullanıcı kararı 2026-10-20: yükseklik yarıya). `aside` geniş ekranda başlığın sağında
 * durur (ör. Giderler yıl seçimi); dar ekranda altına iner.
 */
export function Hero({ eyebrow, title, lead, aside, children }: { eyebrow: string; title: string; lead?: string; aside?: ReactNode; children?: ReactNode }) {
  return (
    <header className="hero" data-aside={aside ? '' : undefined}>
      <div className="hero-text">
        <p className="eyebrow">{eyebrow}</p>
        <Title order={1} className="display">
          {title}
        </Title>
        {lead ? (
          <Text component="p" className="lead">
            {lead}
          </Text>
        ) : null}
      </div>
      {aside ? <div className="hero-aside">{aside}</div> : null}
      {children}
    </header>
  );
}

/** Bilgi satırı; `compact`: etiket ve değer yan yana, tek akışta (rol sayfası başlığı). */
export function FactsRow({ items, compact = false }: { items: { label: string; value: ReactNode }[]; compact?: boolean }) {
  return (
    <dl className="facts-row" data-compact={compact ? '' : undefined}>
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
  tools,
  children,
}: {
  id: string;
  index: number | string;
  title: string;
  desc?: ReactNode;
  /** Bölüm başındaki araç satırı (senaryo seçici, görünüm): başlık bloğunun hemen altında. */
  tools?: ReactNode;
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
      {tools ? <div className="secim-sira">{tools}</div> : null}
      {children}
    </section>
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
  /** Yatay kaydırmada solda sabit kalır (≥ 48em; dar ekranda alan kaplamasın diye sabit değil). */
  sticky?: boolean;
  render: (row: T) => ReactNode;
}

const cellClass = (col: { nowrap?: boolean; sticky?: boolean }) =>
  [col.nowrap ? 'cell-nowrap' : '', col.sticky ? 'cell-sticky' : ''].filter(Boolean).join(' ') || undefined;

export function DataTable<T>({
  id,
  title,
  note,
  tools,
  columns,
  rows,
  rowTone,
  rowKey,
}: {
  id: string;
  title: string;
  note?: ReactNode;
  /** Tablo başındaki araç satırı (senaryo seçici, görünüm). */
  tools?: ReactNode;
  columns: Column<T>[];
  rows: T[];
  rowTone?: (row: T) => string | undefined;
  /** Satırın kalıcı anahtarı (veri güncellenince satır kayarsa hücreler yanlış satıra eşlenmesin); yoksa sıra. */
  rowKey?: (row: T, index: number) => string;
}) {
  const titleId = `${id}-tablo`;
  return (
    <div className="table-block">
      <h3 className="block-title" id={titleId}>
        {title}
      </h3>
      {note ? <p className="table-note">{note}</p> : null}
      {tools ? <div className="blok-araclar">{tools}</div> : null}
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
                    style={col.minWidth ? { minWidth: col.minWidth } : undefined}
                  >
                    {col.header}
                  </Table.Th>
                ))}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {rows.map((row, index) => (
                <Table.Tr key={rowKey ? rowKey(row, index) : index} data-tone={rowTone?.(row)}>
                  {columns.map((col) =>
                    col.rowHeader ? (
                      <Table.Th key={col.key} scope="row" className={cellClass(col)}>
                        {col.render(row)}
                      </Table.Th>
                    ) : (
                      <Table.Td key={col.key} className={cellClass(col)}>
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

/** Hedef hücresi: kilometre taşı renkle değil görünür metinle belirtilir. */
export function Target({ row }: { row: { target: string; milestone?: boolean } }) {
  return (
    <>
      {row.target}
      {row.milestone ? <span className="cell-sub">Kilometre taşı</span> : null}
    </>
  );
}

/* ---------- Sayısal hedefler ---------- */

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

export function KpiGrid({ kpis, role }: { kpis: Kpi[]; role: RoleKey }) {
  return (
    <ul className="kpis" data-role={role}>
      {kpis.map((kpi) => (
        <li key={kpi.metric} className="kpi" data-edge="top">
          <p className="kpi-label">{kpi.metric}</p>
          <p className="kpi-value">
            {kpi.value}
            {kpi.unit ? <span className="kpi-unit">{kpi.unit}</span> : null}
          </p>
          <p className="kpi-ramp">{kpi.when}</p>
        </li>
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

/* ---------- Grafik ----------
 * ECharts yalnız grafik görünür olunca yüklenir (src/scripts/charts.ts, ayrı paket). Spec değişince (ör. Parametreler)
 * aynı grafik yeniden çizilir. Çizilene kadar ve çizilemezse Türkçe özet görünür; ekran okuyucu metni de bu özettir.
 * Geniş grafikler (`wide`) dar ekranda kendi kapsayıcısında yatay kayar; sayfa taşmaz.
 */
export type ChartSize = 'sm' | 'md' | 'lg' | 'xl' | 'xxl';

export function Chart({
  id,
  spec,
  title,
  note,
  summary,
  tools,
  size = 'md',
  wide = false,
  rows,
  shortLabels = false,
}: {
  id: string;
  spec: ChartSpec;
  title: string;
  note?: string;
  summary: string;
  /** Grafik başındaki araç satırı (senaryo seçici, görünüm): başlığın altında, çizimin üstünde. */
  tools?: ReactNode;
  size?: ChartSize;
  wide?: boolean;
  /** Kategori satırı sayısı: kutu en az satır başına bir etiket yüksekliği kadar uzar (etiketler üst üste binmez). */
  rows?: number;
  /** Kategori adları kısa (ay adı gibi) ve hiç sarılmaz: dar ekranda iki/üç satırlık satır yüksekliği verilmez. */
  shortLabels?: boolean;
}) {
  const titleId = `${id}-grafik`;
  const host = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  const [state, setState] = useState<'idle' | 'ready' | 'failed'>('idle');
  const json = JSON.stringify(spec);

  useEffect(() => {
    const el = host.current;
    if (!el) return undefined;
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const draw = () => {
      import('../scripts/charts')
        .then((mod) => mod.drawChart(el, JSON.parse(json) as ChartSpec))
        .then(() => !cancelled && setState('ready'))
        .catch(() => !cancelled && setState('failed'));
    };
    if (seen.current || !('IntersectionObserver' in window)) {
      seen.current = true;
      draw();
    } else {
      observer = new IntersectionObserver(
        (entries) => {
          if (entries.some((entry) => entry.isIntersecting)) {
            observer?.disconnect();
            seen.current = true;
            draw();
          }
        },
        { rootMargin: '200px' },
      );
      observer.observe(el);
    }
    return () => {
      cancelled = true;
      observer?.disconnect();
    };
  }, [json]);

  useEffect(() => {
    // Ref söküm anında boşalmış olur; kutu kurulumda yakalanır, söküldüğünde grafik ve gözlemcisi bırakılır.
    const el = host.current;
    return () => {
      if (el) void import('../scripts/charts').then((mod) => mod.disposeChart(el));
    };
  }, []);

  const canvas = (
    <div
      className="chart-canvas"
      data-kind={spec.kind}
      data-size={size}
      data-rows={rows ?? undefined}
      data-short-labels={rows && shortLabels ? '' : undefined}
      style={rows ? ({ '--chart-rows': rows } as CSSProperties) : undefined}
      data-chart-failed={state === 'failed' ? '' : undefined}
      role="img"
      aria-label={summary}
    >
      <div className="chart-host" ref={host} />
      {state === 'ready' ? null : (
        <p className="chart-fallback">
          {state === 'failed' ? 'Grafik yüklenemedi. ' : ''}
          {summary}
        </p>
      )}
    </div>
  );
  return (
    <figure className="chart" aria-labelledby={titleId}>
      <figcaption>
        <span className="chart-title" id={titleId}>
          {title}
        </span>
        {note ? <span className="chart-note">{note}</span> : null}
      </figcaption>
      {tools ? <div className="blok-araclar">{tools}</div> : null}
      {wide ? (
        <span className="table-hint" aria-hidden="true">
          Grafiği yatay kaydırabilirsiniz.
        </span>
      ) : null}
      {wide ? (
        <div className="table-frame">
          <div className="table-scroll chart-scroll" role="region" aria-labelledby={titleId} tabIndex={0}>
            {canvas}
          </div>
        </div>
      ) : (
        canvas
      )}
    </figure>
  );
}

/* ---------- Seçim grupları (senaryo, grafik modu, başabaş filtreleri) ---------- */

export interface ChoiceOption<T extends string> {
  id: T;
  name: string;
  role?: RoleKey;
  title?: string;
}

/** Basılı düğme grubu (aria-pressed): etiket + seçenekler; rol tonu varsa seçili düğme o tonda. */
export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: ChoiceOption<T>[]; onChange: (id: T) => void }) {
  return (
    <div className="secim" role="group" aria-label={label}>
      <span className="secim-etiket">{label}</span>
      {options.map((o) => (
        <button key={o.id} type="button" className="secim-dugme" data-role={o.role} aria-pressed={o.id === value} title={o.title} onClick={() => onChange(o.id)}>
          {o.name}
        </button>
      ))}
    </div>
  );
}
