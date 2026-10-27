import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
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
import type { ChartSpec, ChartTreeNode, GanttRow } from '../lib/chartSpec';
import { monthName } from '../lib/dates';
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
 * PeriodExplorer). Yatay kaydırma ipucu kaldırıldı (dar ekranda kayan tablo yok). Kabuk seçimi (`useKabuk`) ve kayıt
 * listesi (`KayitListesi`) dışa açıktır: Giderler kalemler tablosu (OpexPage → KalemTablosu) kendi süzgeç/sıra
 * durumuyla aynı kalıbı kullanır.
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

/** Kapsayıcı genişliği (px): boyamadan önce ölçülür, yeniden boyutlanınca izlenir; sunucuda ve ilk çizimde null. */
function useKapsayiciGenisligi(ref: RefObject<HTMLElement | null>) {
  const [genislik, setGenislik] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const olc = () => setGenislik(el.clientWidth);
    olc();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(olc);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [ref]);
  return genislik;
}

export type KayitEkseni = 'satir' | 'sutun';

/** Kayıt görünümündeki bir kayıt: başlık (kayıt adı), tek özet alan ve açılan paneldeki etiketli alanlar. */
export interface Kayit {
  /** Kalıcı kimlik (Accordion değeri ve panel id’si; sıra indeksi kimlik olamaz): yalnız harf, rakam, tire, alt çizgi. */
  key: string;
  title: ReactNode;
  tone?: string;
  summary?: { label: ReactNode; value: ReactNode };
  fields: { key: string; label: ReactNode; value: ReactNode }[];
}

/**
 * Kabuk seçimi (M08 AdaptiveDataView): kapsayıcı 48em’den darsa ve sütunların okunabilir toplam genişliği sığmıyorsa —
 * ya da tablo ölçülünce taşıyorsa (güvenlik ağı) — 'kayit', yoksa 'tablo'. Kapsayıcı boyamadan önce ölçülür, yeniden
 * boyutlanınca izlenir. Süzgeç, sıra, arama ve açık kayıt durumu çağıranın elindedir: kabuk değişince kaybolmaz
 * (ux.md §8.3). İki kabuk aynı anda mount edilmez.
 */
export function useKabuk(sarmal: RefObject<HTMLElement | null>, kaydiran: RefObject<HTMLElement | null>, minWidths: (string | undefined)[]): 'tablo' | 'kayit' {
  const [genislik, setGenislik] = useState<number | null>(null);
  const [tasma, setTasma] = useState<number | null>(null);
  useLayoutEffect(() => {
    const el = sarmal.current;
    if (!el) return undefined;
    const olc = () => setGenislik(el.clientWidth);
    olc();
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(olc);
    ro?.observe(el);
    return () => ro?.disconnect();
  }, [sarmal]);
  const root = rootPx();
  const minToplam = minWidths.reduce((toplam, w) => toplam + sutunMinPx(w, root), 0);
  const dar = genislik !== null && genislik < KAYIT_EM * root;
  const mod: 'tablo' | 'kayit' = dar && (genislik < minToplam || (tasma !== null && genislik < tasma)) ? 'kayit' : 'tablo';
  useLayoutEffect(() => {
    if (mod !== 'tablo' || !dar) return;
    const el = kaydiran.current;
    if (el && el.scrollWidth > el.clientWidth + 1) setTasma(el.scrollWidth);
  });
  return mod;
}

/**
 * Kayıt listesi (M09 RecordAccordion): Mantine Accordion, birden çok kayıt açık kalabilir (süre `--motion-duration-base`,
 * eğri `--motion-ease-standard`). Her kayıt başlığı h4 içinde düğme (aria-expanded, aria-controls → role="region" panel):
 * kayıt adı + tek özet alan; açılan panelde alanlar dl/dt/dd ile etiketli. Açık kayıtlar çağıranın durumudur (`acik`:
 * kayıt kimlikleri). Erişilebilir ad: `labelledBy` (başlık id’si) ya da `label`.
 */
export function KayitListesi({
  kayitlar,
  acik,
  onChange,
  className,
  label,
  labelledBy,
}: {
  kayitlar: Kayit[];
  acik: string[];
  onChange: (acik: string[]) => void;
  className?: string;
  label?: string;
  labelledBy?: string;
}) {
  const sure = useMotionMs('--motion-duration-base');
  return (
    <div className={['kayitlar-sarmal', className].filter(Boolean).join(' ')} role="group" aria-label={label} aria-labelledby={labelledBy}>
      <Accordion
        multiple
        value={acik}
        onChange={onChange}
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
  );
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
  const [acik, setAcik] = useState<string[]>([]);
  const mod = useKabuk(sarmal, kaydiran, columns.map((c) => c.minWidth));

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
        <KayitListesi kayitlar={kayitlar} acik={acik} onChange={setAcik} labelledBy={titleId} />
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
 * Geniş grafikler (`wide`; ux.md §8.1, M19/M20/M21 — P5, kullanıcı kararı 2026-10-27): kabuk DataTable kalıbıyla
 * seçilir — kapsayıcı 48em’den darsa ECharts yerine aynı spec’ten eşdeğer liste çizilir (Gantt ve son tarih → tarihli
 * ajanda, organizasyon/karar yetkisi → dikey hiyerarşi, BCG → kutuya göre değerler); iki kabuk aynı anda mount edilmez,
 * ölçülmeden hiçbiri mount edilmez. Geniş kapsayıcıda ECharts; kapsayıcıdan geniş grafik (tablet) yalnız kendi
 * kutusunda kayar (`.chart-scroll`, klavye: ok tuşları). Dar ekranda yatay kaydırma yoktur.
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
  /** Geniş grafik: dar kapsayıcıda eşdeğer liste, geniş kapsayıcıda gerekirse kendi kutusunda kayan ECharts. */
  wide?: boolean;
  /** Kategori satırı sayısı: kutu en az satır başına bir etiket yüksekliği kadar uzar (etiketler üst üste binmez). */
  rows?: number;
  /** Kategori adları kısa (ay adı gibi) ve hiç sarılmaz: dar ekranda iki/üç satırlık satır yüksekliği verilmez. */
  shortLabels?: boolean;
}) {
  const titleId = `${id}-grafik`;
  const figur = useRef<HTMLElement>(null);
  const host = useRef<HTMLDivElement>(null);
  const seen = useRef(false);
  const [state, setState] = useState<'idle' | 'ready' | 'failed'>('idle');
  const json = JSON.stringify(spec);
  const genislik = useKapsayiciGenisligi(figur);
  // Kabuk: geniş olmayan grafik hep ECharts; geniş grafik ölçülünce dar kapsayıcıda eşdeğer, geniş kapsayıcıda ECharts.
  const kabuk: 'grafik' | 'esdeger' | null = !wide ? 'grafik' : genislik === null ? null : genislik < KAYIT_EM * rootPx() ? 'esdeger' : 'grafik';
  const esdeger = kabuk === 'esdeger' ? grafikEsdegeri(spec, titleId) : null;
  // Eşdeğeri olmayan tür dar kapsayıcıda da ECharts’tır (kaydırmasız, kapsayıcı genişliğinde).
  const kutuVar = kabuk === 'grafik' || (kabuk === 'esdeger' && esdeger === null);

  useEffect(() => {
    const el = host.current;
    if (!kutuVar || !el) return undefined;
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
  }, [json, kutuVar]);

  useEffect(() => {
    // Kutu sökülünce (kabuk değişti ya da bileşen kalktı) grafik örneği ve gözlemcisi bırakılır; kutu yeniden kurulunca
    // çizime kadar özet görünür.
    const el = host.current;
    if (!kutuVar || !el) return undefined;
    return () => {
      void import('../scripts/charts').then((mod) => mod.disposeChart(el));
      setState('idle');
    };
  }, [kutuVar]);

  const kutu = kutuVar ? (
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
  ) : null;
  return (
    <figure className="chart" aria-labelledby={titleId} ref={figur} data-kabuk={kabuk ?? undefined}>
      <figcaption>
        <span className="chart-title" id={titleId}>
          {title}
        </span>
        {note ? <span className="chart-note">{note}</span> : null}
      </figcaption>
      {tools}
      {esdeger ??
        (wide && kabuk === 'grafik' ? (
          <div className="table-frame">
            <div className="table-scroll chart-scroll" role="region" aria-labelledby={titleId} tabIndex={0}>
              {kutu}
            </div>
          </div>
        ) : (
          kutu
        ))}
    </figure>
  );
}

/* ---------- Grafiklerin dar ekran eşdeğeri (ux.md §8.1; M20 HierarchyExplorer, M21 TimelineExplorer; UX-29/30) ----------
 * Aynı spec, ikinci hesap yok. Ajanda: görevler başlangıç tarihine göre (aynı günde önce kontrol noktası, sonra spec
 * sırası); ay değişince yıl taşıyan ay başlığı; kontrol noktaları (Gantt’ın kesikli çizgileri) kesikli ayraç olarak araya
 * girer; her maddede tarih aralığı, sorumlu çipi ve kilometre taşı; açıklama açılır panelde (kayıt sözleşmesi: h4 içinde
 * düğme, dl ile etiketli alanlar). Açıklaması olmayan tek tarihli maddeler (son tarih grafikleri) düz listedir.
 * Hiyerarşi: iç içe ul — alt düğümler üst düğümün li’si içinde; rol tonlu kutu, bağlantılı düğüm rol sayfasına gider.
 * Değerler: BCG ürünleri kutularına göre, sayılar grafiğin ipucuyla aynı biçimde.
 */
const kisaTarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(`${iso}T00:00:00`));
const ayBasligi = (iso: string) => `${monthName(iso)} ${iso.slice(0, 4)}`;
const sayi = new Intl.NumberFormat('tr-TR');

function grafikEsdegeri(spec: ChartSpec, titleId: string): ReactNode | null {
  switch (spec.kind) {
    case 'gantt':
      return <Ajanda titleId={titleId} rows={spec.rows} marks={spec.marks} />;
    case 'deadlines':
      return <Ajanda titleId={titleId} rows={spec.items.map((i) => ({ name: i.name, from: i.date, to: i.date, role: i.role, text: '' }))} marks={[]} />;
    case 'org':
    case 'gov':
      return <Hiyerarsi titleId={titleId} root={spec.root} />;
    case 'bcg-num':
      return <Degerler titleId={titleId} spec={spec} />;
    default:
      return null;
  }
}

type AjandaMadde = { tarih: string; sira: number } & ({ tur: 'gorev'; key: string; row: GanttRow } | { tur: 'isaret'; key: string; label: string });

function Ajanda({ titleId, rows, marks }: { titleId: string; rows: GanttRow[]; marks: { date: string; label: string }[] }) {
  const [acik, setAcik] = useState<string[]>([]);
  const sure = useMotionMs('--motion-duration-base');
  // Açıklaması olmayan tek tarihli maddeler: düz liste (açılır panel gereksiz).
  const duz = rows.every((r) => !r.text && r.from === r.to);
  const maddeler: AjandaMadde[] = [
    ...rows.map((row, i) => ({ tur: 'gorev' as const, key: `g${i}`, tarih: row.from, sira: i, row })),
    ...marks.map((m, i) => ({ tur: 'isaret' as const, key: `i${i}`, tarih: m.date, sira: i, label: m.label })),
  ].sort((a, b) => a.tarih.localeCompare(b.tarih) || (a.tur === b.tur ? a.sira - b.sira : a.tur === 'isaret' ? -1 : 1));
  const icerik: ReactNode[] = [];
  let ay = '';
  for (const m of maddeler) {
    if (m.tarih.slice(0, 7) !== ay) {
      ay = m.tarih.slice(0, 7);
      icerik.push(
        <p key={`ay-${ay}`} className="ajanda-ay">
          {ayBasligi(m.tarih)}
        </p>,
      );
    }
    if (m.tur === 'isaret') {
      icerik.push(
        <p key={m.key} className="ajanda-isaret">
          {m.label} · {kisaTarih(m.tarih)}
        </p>,
      );
      continue;
    }
    const r = m.row;
    const ust = (
      <span className="kayit-ozet ajanda-ust">
        <span className="ajanda-tarih">
          <time dateTime={r.from}>{kisaTarih(r.from)}</time>
          {duz ? null : (
            <>
              {' – '}
              <time dateTime={r.to}>{kisaTarih(r.to)}</time>
            </>
          )}
        </span>
        <RoleChip role={r.role} />
        {r.milestone ? <span className="ajanda-kilometre">Kilometre taşı</span> : null}
      </span>
    );
    if (duz) {
      icerik.push(
        <div key={m.key} className="kayit-duz ajanda-madde">
          {ust}
          <span className="kayit-ad">{r.name}</span>
        </div>,
      );
      continue;
    }
    icerik.push(
      <Accordion.Item key={m.key} value={m.key} className="ajanda-madde">
        <Accordion.Control>
          {ust}
          <span className="kayit-ad">{r.name}</span>
        </Accordion.Control>
        {/* Collapse zamanlama eğrisi hareket tokenından (Panel bunu Collapse’a aktarır; tipinde yok). */}
        <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
          <dl className="kayit-alanlar">
            <div>
              <dt>Tarih</dt>
              <dd>
                {formatDate(r.from)} – {formatDate(r.to)}
              </dd>
            </div>
            <div>
              <dt>Sorumlu</dt>
              <dd>{ROLE_LABELS[r.role]}</dd>
            </div>
            <div>
              <dt>Açıklama</dt>
              <dd>{r.text}</dd>
            </div>
          </dl>
        </Accordion.Panel>
      </Accordion.Item>,
    );
  }
  return (
    <div className="kayitlar-sarmal ajanda" role="group" aria-labelledby={titleId} data-tur={duz ? 'tarih' : 'gorev'}>
      {duz ? (
        <div className="kayitlar">{icerik}</div>
      ) : (
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
          {icerik}
        </Accordion>
      )}
    </div>
  );
}

function Hiyerarsi({ titleId, root }: { titleId: string; root: ChartTreeNode }) {
  return (
    <ul className="hiyerarsi" aria-labelledby={titleId}>
      <HiyerarsiDugum node={root} />
    </ul>
  );
}

function HiyerarsiDugum({ node }: { node: ChartTreeNode }) {
  const icerik = (
    <>
      <span className="hiyerarsi-ad">{node.name}</span>
      {node.sub ? <span className="hiyerarsi-alt">{node.sub}</span> : null}
    </>
  );
  return (
    <li className="hiyerarsi-dugum" data-role={node.role}>
      {node.href ? (
        <a className="hiyerarsi-kutu" href={node.href} data-edge="start">
          {icerik}
        </a>
      ) : (
        <span className="hiyerarsi-kutu" data-edge="start">
          {icerik}
        </span>
      )}
      {node.children?.length ? (
        <ul className="hiyerarsi-dallar">
          {node.children.map((c, i) => (
            <HiyerarsiDugum key={`${i}-${c.name}`} node={c} />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function Degerler({ titleId, spec }: { titleId: string; spec: Extract<ChartSpec, { kind: 'bcg-num' }> }) {
  return (
    <ul className="degerler" aria-labelledby={titleId}>
      {spec.quadrants.map((q) => {
        const urunler = spec.items.filter((i) => i.quadrant === q.key);
        return (
          <li key={q.key} className="degerler-kutu">
            <p className="degerler-kutu-ad">{q.name}</p>
            {urunler.length ? (
              <ul className="degerler-liste">
                {urunler.map((i) => (
                  <li key={i.name} className="degerler-madde">
                    <span className="kayit-ad">{i.name}</span>
                    <span className="degerler-sayilar">
                      Pazar büyümesi %{sayi.format(i.growth)} · Göreli pay {sayi.format(i.share)}× · Ciro {sayi.format(i.revenue)} milyon ₺
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="degerler-bos">Bu kutuda ürün yok.</p>
            )}
          </li>
        );
      })}
    </ul>
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
