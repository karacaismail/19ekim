import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Accordion, Anchor, Badge, Table, Text, Title } from '@mantine/core';
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
import { useMotionMs } from '../lib/motion';
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

/**
 * Bölüm başlığı (ux.md §3/§5.4, P6.1): tek ana başlık + açıklama; üst çizgi hairline, numara ikincil renkte ve yalnız
 * sıralama anlamlıysa (sunum/anlatım sırası: roller, hedefler, gelir planı, BCG, applet…). Araç sayfalarında
 * (Parametreler grupları, nakit akışı) `index` verilmez.
 */
export function Section({
  id,
  index,
  title,
  desc,
  tools,
  children,
}: {
  id: string;
  /** Sıra numarası; yalnız bölümlerin sırası anlamlıysa verilir. */
  index?: number | string;
  title: string;
  desc?: ReactNode;
  /** Bölüm başındaki araç satırı (senaryo seçici, görünüm): başlık bloğunun hemen altında. */
  tools?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="section" id={id} aria-labelledby={`${id}-baslik`}>
      <div className="section-head" data-index={index === undefined ? undefined : ''}>
        {index === undefined ? null : (
          <span className="section-index" aria-hidden="true">
            {typeof index === 'number' ? String(index).padStart(2, '0') : index}
          </span>
        )}
        <Title order={2} className="section-title" id={`${id}-baslik`}>
          {title}
        </Title>
        {desc ? (
          <Text component="p" className="section-desc">
            {desc}
          </Text>
        ) : null}
      </div>
      {tools}
      {children}
    </section>
  );
}

/* ---------- Tablolar ----------
 * Uyarlanır veri görünümü (kullanıcı kararı 2026-10-27, docs/ux.md §8: M08 AdaptiveDataView + M09 RecordAccordion).
 * Aynı sütun/satır modeli iki kabukta sunulur; iki kabuk aynı anda mount edilmez. Taban dar ekrandır: kapsayıcı 48em’den
 * darsa ve sütunların okunabilir toplam genişliği sığmıyorsa (ya da tablo ölçülünce taşıyorsa) KAYIT LİSTESİ çizilir —
 * her kayıt başlığı h4 içinde düğme (aria-expanded, aria-controls → role="region" panel): kayıt adı + tek özet alan;
 * açılan panelde bütün diğer alanlar dl/dt/dd ile etiketli; birden çok kayıt açık kalabilir, açık kayıtlar kimlikle
 * (rowKey) saklanır. Geniş alanda semantik tablo (yalnız ≥ 48em’de gerekirse kendi kutusunda kayar). Kayıt ekseni:
 * 'satir' (satır = kayıt; varsayılan) ya da 'sutun' (ay sütunları: sütun = kayıt, satırlar alan; özet son satır — §8.5
 * PeriodExplorer). Yatay kaydırma ipucu kaldırıldı (dar ekranda kayan tablo yok).
 */

export interface Column<T> {
  key: string;
  header: ReactNode;
  /** Kayıt görünümünde alan adı (başlık JSX ise düz metin karşılığı); yoksa başlık kullanılır. */
  label?: ReactNode;
  /** Okunabilir en küçük sütun genişliği (rem/px); kabuk seçiminde sütunların toplamı kapsayıcıyla karşılaştırılır. */
  minWidth?: string;
  nowrap?: boolean;
  rowHeader?: boolean;
  /** Yatay kaydırmada solda sabit kalır (≥ 48em; dar ekranda tablo yerine kayıt listesi vardır). */
  sticky?: boolean;
  /** Kayıt görünümünde başlıkta gösterilen tek özet alan; yoksa ilk veri sütunu. */
  summary?: boolean;
  render: (row: T) => ReactNode;
}

const cellClass = (col: { nowrap?: boolean; sticky?: boolean }) =>
  [col.nowrap ? 'cell-nowrap' : '', col.sticky ? 'cell-sticky' : ''].filter(Boolean).join(' ') || undefined;

/** Kabuk seçimi sınırı (em): bunun altında kayıt listesi tabandır. CSS’teki tablet kırılımıyla aynı. */
const KAYIT_EM = 48;
/** Belirtilmemiş sütun için okunabilir en küçük genişlik (rem). */
const SUTUN_MIN_REM = 7;

function rootPx() {
  if (typeof document === 'undefined') return 16;
  return parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
}

function sutunMinPx(minWidth: string | undefined, root: number) {
  const m = minWidth?.match(/^([\d.]+)(rem|em|px)$/);
  if (!m) return SUTUN_MIN_REM * root;
  return m[2] === 'px' ? Number(m[1]) : Number(m[1]) * root;
}

export type KayitEkseni = 'satir' | 'sutun';

interface Kayit {
  key: string;
  title: ReactNode;
  tone?: string;
  summary?: { label: ReactNode; value: ReactNode };
  fields: { key: string; label: ReactNode; value: ReactNode }[];
}

export function DataTable<T>({
  id,
  title,
  note,
  tools,
  columns,
  rows,
  rowTone,
  rowKey,
  kayit = 'satir',
}: {
  id: string;
  title: string;
  note?: ReactNode;
  /** Tablo başındaki araç satırı (senaryo seçici, görünüm). */
  tools?: ReactNode;
  columns: Column<T>[];
  rows: T[];
  rowTone?: (row: T) => string | undefined;
  /** Satırın kalıcı anahtarı (veri güncellenince satır kayarsa hücreler yanlış satıra eşlenmesin; açık kayıt kimliği); yoksa sıra. */
  rowKey?: (row: T, index: number) => string;
  /** Kayıt görünümünün ekseni: satır = kayıt (varsayılan) ya da sütun = kayıt (ay sütunlu tablolar). */
  kayit?: KayitEkseni;
}) {
  const titleId = `${id}-tablo`;
  const sarmal = useRef<HTMLDivElement>(null);
  const kaydiran = useRef<HTMLDivElement>(null);
  const [genislik, setGenislik] = useState<number | null>(null);
  const [tasma, setTasma] = useState<number | null>(null);
  const [acik, setAcik] = useState<string[]>([]);
  const sure = useMotionMs('--motion-duration-base');

  // Kapsayıcı genişliği (boyamadan önce ölçülür; yeniden boyutlanınca izlenir).
  useLayoutEffect(() => {
    const el = sarmal.current;
    if (!el) return undefined;
    const olc = () => setGenislik(el.clientWidth);
    olc();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(olc);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, []);

  const root = rootPx();
  const minToplam = columns.reduce((toplam, col) => toplam + sutunMinPx(col.minWidth, root), 0);
  const dar = genislik !== null && genislik < KAYIT_EM * root;
  const mod: 'tablo' | 'kayit' = dar && (genislik < minToplam || (tasma !== null && genislik < tasma)) ? 'kayit' : 'tablo';

  // Güvenlik ağı: tablo kabuğu dar alanda yine de taşıyorsa gerekli genişlik ezberlenir ve kayıt listesine geçilir.
  useLayoutEffect(() => {
    if (mod !== 'tablo' || !dar) return;
    const el = kaydiran.current;
    if (el && el.scrollWidth > el.clientWidth + 1) setTasma(el.scrollWidth);
  });

  const keyOf = (row: T, index: number) => (rowKey ? rowKey(row, index) : String(index));
  const baslikSutunu = columns.find((c) => c.rowHeader) ?? columns[0];
  const veriSutunlari = columns.filter((c) => c !== baslikSutunu);
  const etiket = (c: Column<T>) => c.label ?? c.header;

  let kayitlar: Kayit[] = [];
  if (mod === 'kayit') {
    if (kayit === 'sutun') {
      // Sütun = kayıt (ay); satırlar alan; özet son satır (dönem sonu / toplam).
      const ozetSatir = rows.length ? rows[rows.length - 1] : undefined;
      const alanSatirlari = rows.slice(0, -1);
      kayitlar = veriSutunlari.map((c) => ({
        key: c.key,
        title: etiket(c),
        summary: ozetSatir ? { label: baslikSutunu.render(ozetSatir), value: c.render(ozetSatir) } : undefined,
        fields: alanSatirlari.map((r, i) => ({ key: keyOf(r, i), label: baslikSutunu.render(r), value: c.render(r) })),
      }));
    } else {
      const ozetSutunu = veriSutunlari.find((c) => c.summary) ?? veriSutunlari[0];
      const alanSutunlari = veriSutunlari.filter((c) => c !== ozetSutunu);
      kayitlar = rows.map((r, i) => ({
        key: keyOf(r, i),
        title: baslikSutunu.render(r),
        tone: rowTone?.(r),
        summary: ozetSutunu ? { label: etiket(ozetSutunu), value: ozetSutunu.render(r) } : undefined,
        fields: alanSutunlari.map((c) => ({ key: c.key, label: etiket(c), value: c.render(r) })),
      }));
    }
  }

  return (
    <div className="table-block" ref={sarmal} data-kabuk={mod}>
      <h3 className="block-title" id={titleId}>
        {title}
      </h3>
      {note ? <p className="table-note">{note}</p> : null}
      {tools}
      {mod === 'kayit' && kayitlar.every((k) => k.fields.length === 0) ? (
        /* Tek veri sütunu (ad → değer): açılır panel gereksiz; düz tanım listesi (başlık sütunu etiket olarak). */
        <dl className="kayitlar-duz" aria-labelledby={titleId}>
          {kayitlar.map((k) => (
            <div key={k.key} className="kayit-duz" data-tone={k.tone}>
              <dt className="kayit-ad">{k.title}</dt>
              <dd className="kayit-ozet">
                {k.summary ? (
                  <>
                    <span className="kayit-ozet-etiket">{k.summary.label}</span>
                    <span className="kayit-ozet-deger">{k.summary.value}</span>
                  </>
                ) : null}
              </dd>
            </div>
          ))}
        </dl>
      ) : mod === 'kayit' ? (
        <div className="kayitlar-sarmal" role="group" aria-labelledby={titleId}>
          <Accordion
            multiple
            value={acik}
            onChange={setAcik}
            order={4}
            transitionDuration={sure}
            classNames={{
              root: 'kayitlar',
              item: 'kayit',
              itemTitle: 'kayit-h',
              control: 'kayit-baslik',
              label: 'kayit-etiket',
              chevron: 'kayit-ok',
              panel: 'kayit-panel',
              content: 'kayit-icerik',
            }}
          >
            {kayitlar.map((k) => (
              <Accordion.Item key={k.key} value={k.key} data-tone={k.tone}>
                <Accordion.Control>
                  <span className="kayit-ad">{k.title}</span>
                  {k.summary ? (
                    <span className="kayit-ozet">
                      <span className="kayit-ozet-etiket">{k.summary.label}</span>
                      <span className="kayit-ozet-deger">{k.summary.value}</span>
                    </span>
                  ) : null}
                </Accordion.Control>
                {/* Collapse zamanlama eğrisi hareket tokenından (Panel bunu Collapse’a aktarır; tipinde yok). */}
                <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
                  <dl className="kayit-alanlar">
                    {k.fields.map((f) => (
                      <div key={f.key}>
                        <dt>{f.label}</dt>
                        <dd>{f.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Accordion.Panel>
              </Accordion.Item>
            ))}
          </Accordion>
        </div>
      ) : (
        <div className="table-frame">
          <div className="table-scroll" role="region" aria-labelledby={titleId} tabIndex={0} ref={kaydiran}>
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
                  <Table.Tr key={keyOf(row, index)} data-tone={rowTone?.(row)}>
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
      )}
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
      {tools}
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

/* ---------- Seçim grupları (senaryo, grafik modu, başabaş filtreleri) ----------
 * Segmentli anahtar (kullanıcı kararı 2026-10-27): seçenekler tek zemin (iz) üzerinde; seçili olanın altında kayan
 * topuz (ölçülen konum ve genişlik; hareket tokenlarıyla). Düğmeler aria-pressed; sunucu çiziminde topuz ölçülmeden
 * seçili düğme aynı görünümü CSS’le alır. Rol tonlu seçenekte topuz o tonda.
 */

export interface ChoiceOption<T extends string> {
  id: T;
  name: string;
  role?: RoleKey;
}

interface Thumb {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function Choice<T extends string>({ label, value, options, note, onChange }: { label: string; value: T; options: ChoiceOption<T>[]; /** Görünür açıklama (ipucu yerine; dokunmada hover yoktur) */ note?: string; onChange: (id: T) => void }) {
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const selected = options.find((o) => o.id === value);
  useLayoutEffect(() => {
    const el = track.current;
    if (!el) return undefined;
    const measure = () => {
      const btn = el.querySelector<HTMLElement>('[aria-pressed="true"]');
      const next = btn ? { x: btn.offsetLeft, y: btn.offsetTop, w: btn.offsetWidth, h: btn.offsetHeight } : null;
      setThumb((old) => (old && next && old.x === next.x && old.y === next.y && old.w === next.w && old.h === next.h ? old : next));
    };
    measure();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [value, options.length]);
  return (
    <div className="secim" role="group" aria-label={label}>
      <span className="secim-etiket">{label}</span>
      <div className="secim-iz" ref={track} data-olculdu={thumb ? '' : undefined}>
        {thumb ? (
          <span className="secim-top" aria-hidden="true" data-role={selected?.role} style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)`, width: thumb.w, height: thumb.h }} />
        ) : null}
        {options.map((o) => (
          <button key={o.id} type="button" className="secim-dugme" data-role={o.role} aria-pressed={o.id === value} onClick={() => onChange(o.id)}>
            {o.name}
          </button>
        ))}
      </div>
      {note ? <p className="secim-not">{note}</p> : null}
    </div>
  );
}
