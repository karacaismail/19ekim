/**
 * Grafikler: yalnız [data-chart] içeren sayfalarda ve görünür olduklarında ECharts’ı yükler.
 * Renk, yazı ve hareket değerleri tasarım tokenlarından okunur; tema değişince yeniden çizilir.
 * Metin boyutu --text-sm tokenından (kullanıcının kök yazı boyutunu izler, en az 14 CSS px); hareket simetrik
 * easeInOut Cubic (ECharts: cubicInOut); hareket azaltma tercihinde animasyon kapanır. Çubuk ve kutular radiussuzdur.
 * Seçenekler kapsayıcı genişliğine göre kurulur (açıklama satırları, eksen etiket genişliği).
 */
import type { ChartSpec, ChartTreeNode, OpexTone } from '../lib/chartSpec';

type EChartsModule = typeof import('../lib/echarts-setup');
type Instance = ReturnType<EChartsModule['echarts']['init']>;
type Opt = Record<string, unknown>;

/** Geçerli grafik yazı boyutu (px); her çizimde tokendan yeniden okunur. */
let FONT_SIZE = 14;
const DAY = 86_400_000;
const charts = new Map<HTMLElement, { chart: Instance; spec: ChartSpec; width: number; observer: ResizeObserver; shape: string }>();

/** Seçeneğin yapısı (seri sayısı ve türleri, eksen sayıları): aynıysa yerinde güncellenir, değiştiyse baştan çizilir. */
function shapeOf(option: Opt) {
  const count = (v: unknown) => (Array.isArray(v) ? v.length : v ? 1 : 0);
  const series = Array.isArray(option.series) ? (option.series as Opt[]).map((s) => String(s.type)).join(',') : '';
  return `${series}|${count(option.xAxis)}|${count(option.yAxis)}|${count(option.radar)}`;
}
let loader: Promise<EChartsModule> | null = null;

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const number = new Intl.NumberFormat('tr-TR');
const lira = (value: number) =>
  value >= 1_000_000
    ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value / 1_000_000)} milyon ₺`
    : `${number.format(Math.round(value))} ₺`;
const millions = (v: number) => (v === 0 ? '0' : `${v / 1_000_000} M`);
const ms = (iso: string) => new Date(`${iso}T00:00:00`).getTime();
const shortDate = (t: number) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(new Date(t));

/** --text-sm (rem) → px; kök yazı boyutu büyütülürse grafik metni de büyür. Alt sınır 14 CSS px. */
function fontPx() {
  const raw = token('--text-sm');
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const value = /rem$/.test(raw) ? parseFloat(raw) * root : parseFloat(raw);
  return Math.max(14, Number.isFinite(value) ? value : 14);
}

/** Yatay açıklamanın kaç satıra sarılacağını genişlikten tahmin eder; ızgara açıklamanın altında başlar. */
function legendTop(names: string[], width: number) {
  const available = width - 32;
  let rows = 1;
  let x = 0;
  for (const name of names) {
    const item = name.length * FONT_SIZE * 0.56 + 25 + 16;
    if (x > 0 && x + item > available) {
      rows += 1;
      x = 0;
    }
    x += item;
  }
  return rows * (FONT_SIZE + 18) + 24;
}

/** CSS süresini ms'ye çevirir: tarayıcı tokenı "240ms" veya ".24s" olarak döndürebilir. */
const toMs = (raw: string) => {
  const value = parseFloat(raw);
  if (!Number.isFinite(value)) return NaN;
  return /ms$/.test(raw) ? value : /s$/.test(raw) ? value * 1000 : value;
};

/** --motion-duration-base (ms); hareket azaltmada token 0ms olur. Token okunamazsa 240 ms. */
const duration = () => {
  const value = toMs(token('--motion-duration-base'));
  return Number.isFinite(value) ? value : 240;
};

/** Seri, işaret çizgisi ve göstergeler için ortak hareket: simetrik cubicInOut, token süresi. */
function motion(): Opt {
  const d = reducedMotion() ? 0 : duration();
  if (!d) return { animation: false, animationDuration: d, animationDurationUpdate: d };
  return {
    animation: true,
    animationDuration: d,
    animationEasing: 'cubicInOut',
    animationDurationUpdate: d,
    animationEasingUpdate: 'cubicInOut',
    animationDelay: 0,
    animationDelayUpdate: 0,
  };
}

function base(): Opt {
  const muted = token('--text-secondary');
  const d = reducedMotion() ? 0 : duration();
  const reduced = !d;
  return {
    ...motion(),
    // Ekran okuyucu metni kapsayıcının Türkçe özetidir (role="img"); ECharts'ın otomatik İngilizce metni kapalı.
    aria: { enabled: false },
    stateAnimation: { duration: d, easing: 'cubicInOut' },
    textStyle: { fontFamily: token('--font-sans'), fontSize: FONT_SIZE, color: muted },
    tooltip: {
      backgroundColor: token('--surface-raised'),
      borderColor: token('--rule'),
      textStyle: { color: token('--text-primary'), fontSize: FONT_SIZE, fontFamily: token('--font-sans') },
      transitionDuration: d / 1000,
      hideDelay: 0,
      // İpucu grafik kutusunda kalır ve uzun metni sarar (dar ekranda dışarı taşmaz).
      confine: true,
      // Genişlik grafik kutusunu aşmaz (yüzde: kapsayıcı .chart-host); kutu taşanı kırptığı için ipucu tam görünür kalır.
      extraCssText: `transition-timing-function: ${token('--motion-ease-standard')}; box-shadow: none; white-space: normal; max-width: min(22rem, 100%);`,
      axisPointer: {
        // Vurgu bandı (gölge) çubukların arkasında: ECharts varsayılanı (z 50) opak bantla çubuğu örtüyordu.
        z: 0,
        animation: !reduced,
        animationDurationUpdate: d,
        animationEasingUpdate: 'cubicInOut',
        lineStyle: { color: token('--rule-strong') },
        shadowStyle: { color: token('--surface-sunken') },
      },
    },
    legend: {
      top: 0,
      left: 0,
      textStyle: { color: muted, fontSize: FONT_SIZE },
      itemGap: 16,
      inactiveColor: token('--rule-strong'),
      animationDurationUpdate: d,
      pageTextStyle: { color: muted, fontSize: FONT_SIZE },
      pageIconColor: token('--text-primary'),
      pageIconInactiveColor: token('--rule-strong'),
    },
  };
}

function axis(): Opt {
  const muted = token('--text-secondary');
  return {
    // Satır yüksekliği: sarılan eksen etiketinin satırları her motorda birbirine binmez.
    axisLabel: { color: muted, fontSize: FONT_SIZE, lineHeight: FONT_SIZE + 6 },
    nameTextStyle: { color: muted, fontSize: FONT_SIZE },
    axisLine: { lineStyle: { color: token('--rule-strong') } },
    splitLine: { lineStyle: { color: token('--rule') } },
    axisTick: { show: false },
  };
}

const tone = (role: string) => ({ fill: token(`--role-${role}-bg`), line: token(`--role-${role}`), text: token(`--role-${role}-fg`) });

/* ---------- OPEX (Giderler) ---------- */

/** Ton → doğrulanmış kategorik palet tokenı (açık/koyu ayrı adımlar; tokens.css). */
const VIZ: Record<OpexTone, string> = {
  tech: '--viz-1',
  people: '--viz-2',
  office: '--viz-3',
  net: '--viz-1',
  tax: '--viz-2',
  sgk: '--viz-3',
  employer: '--viz-4',
  y2026: '--viz-1',
  y2027: '--viz-2',
  total: '--viz-total',
  credit: '--viz-credit',
};
const viz = (t: OpexTone) => token(VIZ[t]);
/** Sheets’ten gelen ad ve kategori HTML ipucuna kaçışlanarak yazılır (metin, işaretleme değil). */
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
const compact = new Intl.NumberFormat('tr-TR', { notation: 'compact', maximumFractionDigits: 1 });
const shortLira = (v: number) => (v === 0 ? '0' : `${compact.format(v)} ₺`);
const ratio = (r: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(r * 100)}`;
/** Bu genişliğin altındaki kapsayıcıda değer etiketleri gizlenir (değer ekseni, ipucu ve tablo taşır); auto yığın yataylaşır. */
const OPEX_NARROW = 568;
/** Çubuk ucundaki etiket için sağ pay: en uzun etiketin yaklaşık genişliği (SVG dışına taşmasın). */
const labelRoom = (labels: string[]) => Math.ceil(Math.max(0, ...labels.map((l) => l.length)) * FONT_SIZE * 0.6) + 16;
let olcer: CanvasRenderingContext2D | null = null;
/** Metnin piksel genişliği (grafik yazı tipiyle; yazı tipi çizimden önce yüklenir). Ölçülemezse null. */
function metinGenisligi(text: string, font: string) {
  olcer ??= document.createElement('canvas').getContext('2d');
  if (!olcer) return null;
  olcer.font = font;
  return olcer.measureText(text).width;
}

/**
 * Kategori ekseni etiketi. Bütün adlar üst sınıra sığıyorsa genişlik verilmez: sütunu ECharts kendi ölçümüyle en uzun ad
 * kadar ayırır (kısa ad — ay — çubuklara yer bırakır, motorlar arası ölçüm farkı satır kırdırmaz). Sığmayan uzun ad varsa
 * sütun üst sınırdadır ve ad sözcük arasından sarılır.
 */
const categoryLabel = (width: number, share = 0.4, names: string[] = []): Opt => {
  // Dar yazı tipi tanımlıysa (Giderler: Roboto Condensed) onunla.
  const condensed = token('--font-condensed');
  const family = condensed || token('--font-sans');
  // Telefonda (≤ 420 px grafik) üst sınır en az %42: uzun ad en çok üç satıra sarılır (satır yüksekliği üç satırlık).
  const cap = Math.min(220, Math.floor(width * (width < 420 ? Math.max(share, 0.42) : share)));
  const widths = names.map((n) => metinGenisligi(n, `${FONT_SIZE}px ${family}`));
  const sigar = widths.length > 0 && widths.every((w) => w !== null && w + FONT_SIZE <= cap);
  return {
    ...(axis().axisLabel as Opt),
    ...(condensed ? { fontFamily: condensed } : {}),
    color: token('--text-primary'),
    ...(sigar ? {} : { width: cap, overflow: 'break' }),
  };
};
const valueAxis = (narrow: boolean): Opt => ({
  type: 'value',
  ...axis(),
  splitNumber: narrow ? 3 : 5,
  axisLabel: { ...(axis().axisLabel as Opt), formatter: shortLira, hideOverlap: true },
});

function targetLine(target: number, position = 'insideStartTop'): Opt {
  const strong = token('--accent-strong');
  return {
    symbol: 'none',
    silent: true,
    data: [{ yAxis: target }],
    lineStyle: { color: strong, type: 'dashed', width: 2 },
    label: { formatter: `Hedef ${lira(target)}`, color: strong, fontSize: FONT_SIZE, position },
  };
}

/** Ağaç düğümünü ECharts verisine çevirir: radiussuz kutu, rol tonu, iki satırlı etiket. */
function treeData(node: ChartTreeNode): Opt {
  const t = tone(node.role);
  return {
    name: node.name,
    value: node.href ?? '',
    sub: node.sub ?? '',
    itemStyle: { color: t.fill, borderColor: t.line, borderWidth: 2 },
    label: { color: t.text },
    children: node.children?.map(treeData),
  };
}

/** Kutu içi etiket: kelime sınırından satıra bölünür (kelime ortasından bölünmez). */
function wrap(text: string, max: number): string[] {
  const lines: string[] = [];
  for (const word of text.split(' ')) {
    const last = lines.length - 1;
    if (last >= 0 && `${lines[last]} ${word}`.length <= max) lines[last] = `${lines[last]} ${word}`;
    else lines.push(word);
  }
  return lines;
}

function treeSeries(root: ChartTreeNode, orient: 'TB' | 'LR', size: [number, number]): Opt {
  const tb = orient === 'TB';
  // Satır başına karakter, yazı boyutuna göre (kullanıcı kök boyutu büyütürse satırlar kısalır).
  const max = Math.floor((size[0] - 16) / (FONT_SIZE * 0.57));
  const line = { fontSize: FONT_SIZE, lineHeight: FONT_SIZE + 4, width: size[0] - 16, align: 'center' };
  return {
    type: 'tree',
    data: [treeData(root)],
    orient,
    layout: 'orthogonal',
    // Kardeş ekseninde ECharts uçlara yarım aralık bırakır; derinlik ekseninde kutunun yarısı kadar pay gerekir.
    top: tb ? size[1] / 2 + 8 : 8,
    bottom: tb ? size[1] / 2 + 8 : 8,
    left: tb ? 8 : size[0] / 2 + 8,
    right: tb ? 8 : size[0] / 2 + 8,
    symbol: 'rect',
    symbolSize: size,
    edgeShape: 'polyline',
    edgeForkPosition: '50%',
    initialTreeDepth: -1,
    expandAndCollapse: false,
    roam: false,
    lineStyle: { color: token('--rule-strong'), width: 2, curveness: 0 },
    label: {
      position: 'inside',
      formatter: (p: { name: string; data: { sub: string } }) =>
        [...wrap(p.name, max).map((l) => `{n|${l}}`), ...(p.data.sub ? wrap(p.data.sub, max).map((l) => `{s|${l}}`) : [])].join('\n'),
      rich: {
        n: { ...line, fontWeight: 600 },
        s: { ...line, fontWeight: 400, color: token('--text-secondary') },
      },
    },
    leaves: { label: { position: 'inside' } },
    emphasis: { focus: 'none' },
  };
}

function build(spec: ChartSpec, width: number): Opt {
  FONT_SIZE = fontPx();
  const text = token('--text-primary');
  const accent = token('--accent');
  const grid = { left: 4, right: 16, bottom: 4, top: 72, containLabel: true };

  switch (spec.kind) {
    case 'org':
      return { ...base(), tooltip: { ...(base().tooltip as Opt), show: false }, series: [treeSeries(spec.root, 'TB', [150, 96])] };

    case 'gov':
      return { ...base(), tooltip: { ...(base().tooltip as Opt), show: false }, series: [treeSeries(spec.root, 'LR', [240, 64])] };

    case 'gantt': {
      const start = ms(spec.start);
      return {
        ...base(),
        // Sağ pay: eksen sonundaki işaret çizgisinin etiketi (ör. 90. gün) taşmasın.
        grid: { left: 4, right: 40, top: 40, bottom: 4, containLabel: true },
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'item',
          formatter: (p: { seriesIndex: number; data: { name: string; text: string; range: string } }) =>
            p.seriesIndex === 1 ? `${p.data.name}<br/>${p.data.range}<br/>${p.data.text}` : '',
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: (ms(spec.end) - start) / DAY,
          ...axis(),
          axisLabel: { ...(axis().axisLabel as Opt), showMaxLabel: false, formatter: (v: number) => shortDate(start + v * DAY) },
        },
        yAxis: {
          type: 'category',
          inverse: true,
          data: spec.rows.map((r) => r.name),
          ...axis(),
          splitLine: { show: false },
          axisLabel: { ...(axis().axisLabel as Opt), color: text, width: 190, overflow: 'break' },
        },
        series: [
          {
            type: 'bar',
            stack: 'g',
            silent: true,
            tooltip: { show: false },
            itemStyle: { color: 'transparent' },
            data: spec.rows.map((r) => (ms(r.from) - start) / DAY),
          },
          {
            type: 'bar',
            stack: 'g',
            barMaxWidth: 26,
            label: {
              show: true,
              position: 'insideLeft',
              fontSize: FONT_SIZE,
              fontWeight: 600,
              formatter: (p: { data: { range: string } }) => p.data.range,
            },
            data: spec.rows.map((r) => {
              const t = tone(r.role);
              const span = (ms(spec.end) - start) / DAY;
              const days = (ms(r.to) - ms(r.from)) / DAY + 1;
              // Kısa çubukta tarih etiketi çubuğun sağına taşınır (sığmayan metin kesilmez); eksenin sonuna yakın biten
              // kısa çubukta (ör. 13. hafta) etiket sola alınır, SVG dışına taşmaz.
              const short = days / span < 0.16;
              const late = (ms(r.to) - start) / DAY > span * 0.8;
              return {
                value: days,
                name: r.name,
                text: r.text,
                range: `${shortDate(ms(r.from))} – ${shortDate(ms(r.to))}`,
                itemStyle: { color: t.fill, borderColor: t.line, borderWidth: r.milestone ? 3 : 2, borderRadius: 0 },
                label: short ? { position: late ? 'left' : 'right', color: text } : { color: t.text },
              };
            }),
            markLine: {
              symbol: 'none',
              silent: true,
              lineStyle: { color: token('--rule-strong'), type: 'dashed', width: 1 },
              label: { fontSize: FONT_SIZE, color: token('--text-secondary'), position: 'start' },
              data: spec.marks.map((m) => ({ xAxis: (ms(m.date) - start) / DAY, label: { formatter: m.label } })),
            },
          },
        ],
      };
    }

    case 'ramp': {
      const t = tone(spec.role);
      const two = spec.series.length > 1;
      return {
        ...base(),
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis' },
        grid: { ...grid, top: legendTop(spec.series.map((s) => s.name), width) },
        legend: { ...(base().legend as Opt), data: spec.series.map((s) => s.name) },
        xAxis: { type: 'category', data: spec.months, ...axis(), splitLine: { show: false } },
        yAxis: two
          ? [
              { type: 'value', ...axis(), minInterval: 1 },
              { type: 'value', ...axis(), minInterval: 1, splitLine: { show: false } },
            ]
          : { type: 'value', ...axis(), minInterval: 1 },
        series: spec.series.map((s, i) => ({
          name: s.name,
          type: i === 0 ? 'bar' : 'line',
          yAxisIndex: two ? i : 0,
          data: s.values,
          barMaxWidth: 56,
          symbolSize: 8,
          itemStyle: { color: i === 0 ? t.line : text, borderRadius: 0 },
          lineStyle: { color: text, width: 2 },
          // İki seride çubuk değeri çubuğun tabanında, çizgi değeri noktanın üstünde: etiketler çakışmaz.
          label:
            two && i === 0
              ? { show: true, position: 'insideBottom', fontSize: FONT_SIZE, fontWeight: 600, color: token('--surface-raised') }
              : { show: true, position: 'top', fontSize: FONT_SIZE, color: text },
        })),
      };
    }

    case 'pay': {
      const t = tone(spec.role);
      const hours = (v: number) => `${Math.floor(v / 60) ? `${Math.floor(v / 60)} sa` : ''}${v % 60 ? ` ${v % 60} dk` : ''}`.trim();
      return {
        ...base(),
        grid: { left: 4, right: 88, top: 8, bottom: 8, containLabel: true },
        tooltip: { ...(base().tooltip as Opt), trigger: 'item', formatter: (p: { name: string; value: number }) => `${p.name}: ${hours(p.value)}` },
        legend: { show: false },
        xAxis: { type: 'value', show: false },
        yAxis: {
          type: 'category',
          inverse: true,
          data: spec.items.map((i) => i.name),
          ...axis(),
          axisLine: { show: false },
          axisLabel: { ...(axis().axisLabel as Opt), color: text, width: Math.min(240, width * 0.42), overflow: 'break' },
        },
        series: [
          {
            type: 'bar',
            data: spec.items.map((i) => i.value),
            barMaxWidth: 24,
            itemStyle: { color: t.line, borderRadius: 0 },
            label: { show: true, position: 'right', fontSize: FONT_SIZE, color: text, formatter: (p: { value: number }) => hours(p.value) },
          },
        ],
      };
    }

    case 'kopru':
      return {
        ...base(),
        grid: { ...grid, top: legendTop(['İlk ödemeler (100 aktif satıcı)', 'Yenilemeler'], width) },
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', valueFormatter: (v: number) => lira(v) },
        legend: { ...(base().legend as Opt), data: ['İlk ödemeler (100 aktif satıcı)', 'Yenilemeler'] },
        xAxis: { type: 'category', data: spec.scenarios, ...axis(), splitLine: { show: false } },
        yAxis: {
          type: 'value',
          max: Math.max(spec.target * 1.2, ...spec.first.map((f, i) => f + spec.renew[i])),
          ...axis(),
          axisLabel: { ...(axis().axisLabel as Opt), formatter: millions },
        },
        series: [
          { name: 'İlk ödemeler (100 aktif satıcı)', type: 'bar', stack: 's', data: spec.first, barMaxWidth: 64, itemStyle: { color: accent, borderRadius: 0 } },
          { name: 'Yenilemeler', type: 'bar', stack: 's', data: spec.renew, barMaxWidth: 64, itemStyle: { color: token('--role-saha-uzmani'), borderRadius: 0 }, markLine: targetLine(spec.target) },
        ],
      };

    case 'gelir-ay': {
      let running = 0;
      const cumulative = spec.first.map((f, i) => (running += f + spec.renew[i]));
      return {
        ...base(),
        grid: { ...grid, top: legendTop(['İlk ödemeler', 'Yenilemeler', 'Kümülatif ciro'], width) },
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', valueFormatter: (v: number) => lira(v) },
        legend: { ...(base().legend as Opt), data: ['İlk ödemeler', 'Yenilemeler', 'Kümülatif ciro'] },
        xAxis: { type: 'category', data: spec.months, ...axis(), splitLine: { show: false } },
        yAxis: { type: 'value', ...axis(), axisLabel: { ...(axis().axisLabel as Opt), formatter: millions } },
        series: [
          { name: 'İlk ödemeler', type: 'bar', stack: 'a', data: spec.first, barMaxWidth: 64, itemStyle: { color: accent, borderRadius: 0 } },
          { name: 'Yenilemeler', type: 'bar', stack: 'a', data: spec.renew, barMaxWidth: 64, itemStyle: { color: token('--role-saha-uzmani'), borderRadius: 0 } },
          { name: 'Kümülatif ciro', type: 'line', data: cumulative, symbolSize: 8, lineStyle: { color: text, width: 2 }, itemStyle: { color: text }, markLine: targetLine(spec.target) },
        ],
      };
    }

    case 'kaynak-ay':
      return {
        ...base(),
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis' },
        // Açıklama birden çok satıra sarılır (sayfalı açıklama yok); ızgara onun altında başlar.
        legend: { ...(base().legend as Opt), right: 0 },
        grid: { ...grid, top: legendTop(spec.series.map((x) => x.name), width) },
        xAxis: { type: 'category', data: spec.months, ...axis(), splitLine: { show: false } },
        yAxis: { type: 'value', ...axis(), minInterval: 1 },
        series: spec.series.map((s) => ({
          name: s.name,
          type: 'bar',
          stack: 'k',
          data: s.values,
          barMaxWidth: 64,
          itemStyle: { color: token(`--role-${s.role}`), borderRadius: 0 },
        })),
      };

    case 'checkpoint':
      return {
        ...base(),
        grid: { ...grid, top: legendTop(['Kümülatif aktif satıcı', 'Kümülatif ciro'], width) },
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis' },
        legend: { ...(base().legend as Opt), data: ['Kümülatif aktif satıcı', 'Kümülatif ciro'] },
        xAxis: { type: 'category', data: spec.days, ...axis(), splitLine: { show: false } },
        yAxis: [
          { type: 'value', ...axis(), minInterval: 1 },
          { type: 'value', ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), formatter: millions } },
        ],
        series: [
          { name: 'Kümülatif aktif satıcı', type: 'bar', data: spec.aktif, barMaxWidth: 56, itemStyle: { color: accent, borderRadius: 0 }, label: { show: true, position: 'top', fontSize: FONT_SIZE, color: text } },
          {
            name: 'Kümülatif ciro',
            type: 'line',
            yAxisIndex: 1,
            data: spec.ciro,
            symbolSize: 8,
            lineStyle: { color: text, width: 2 },
            itemStyle: { color: text },
            tooltip: { valueFormatter: (v: number) => lira(v) },
            markLine: targetLine(spec.target, 'insideEndTop'),
          },
        ],
      };

    case 'deadlines': {
      const start = ms(spec.start);
      return {
        ...base(),
        grid: { left: 4, right: 40, top: 16, bottom: 4, containLabel: true },
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'item',
          formatter: (p: { data: { name: string; value: number[] } }) => `${p.data.name}<br/>${shortDate(start + p.data.value[0] * DAY)}`,
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: (ms(spec.end) - start) / DAY,
          ...axis(),
          axisLabel: { ...(axis().axisLabel as Opt), showMaxLabel: false, formatter: (v: number) => shortDate(start + v * DAY) },
        },
        yAxis: {
          type: 'category',
          inverse: true,
          data: spec.items.map((i) => i.name),
          ...axis(),
          splitLine: { show: true, lineStyle: { color: token('--rule') } },
          axisLabel: { ...(axis().axisLabel as Opt), color: text, width: 220, overflow: 'break' },
        },
        series: [
          {
            type: 'scatter',
            symbol: 'rect',
            symbolSize: 16,
            data: spec.items.map((item, i) => {
              const t = tone(item.role);
              return {
                name: item.name,
                value: [(ms(item.date) - start) / DAY, i],
                itemStyle: { color: t.line },
                label: { show: true, position: 'right', fontSize: FONT_SIZE, color: t.text, formatter: shortDate(ms(item.date)) },
              };
            }),
          },
        ],
      };
    }

    case 'piramit':
      return {
        ...base(),
        tooltip: { ...(base().tooltip as Opt), trigger: 'item' },
        legend: { show: false },
        series: [{ type: 'funnel', sort: 'ascending', left: '4%', right: '4%', top: 8, bottom: 8, minSize: '22%', maxSize: '100%', gap: 4, data: [] }],
      };

    case 'chain': {
      // Zincir: her adım bir öncekinin tek çocuğu; ağaç yerleşimi adımları dikey hizalar.
      const root = [...spec.steps].reverse().reduce<ChartTreeNode | undefined>(
        (child, step) => ({ name: step.name, sub: step.sub, role: step.role, children: child ? [child] : undefined }),
        undefined,
      ) as ChartTreeNode;
      return { ...base(), tooltip: { ...(base().tooltip as Opt), show: false }, series: [treeSeries(root, 'TB', [232, 64])] };
    }

    case 'mix':
      return {
        ...base(),
        grid: { left: 4, right: 88, top: 8, bottom: 8, containLabel: true },
        tooltip: { ...(base().tooltip as Opt), trigger: 'item', formatter: (p: { name: string; value: number }) => `${p.name}: ${p.value} ${spec.unit}` },
        legend: { show: false },
        xAxis: { type: 'value', show: false },
        yAxis: {
          type: 'category',
          inverse: true,
          data: spec.items.map((i) => i.name),
          ...axis(),
          axisLine: { show: false },
          axisLabel: { ...(axis().axisLabel as Opt), color: text, width: Math.min(220, width * 0.42), overflow: 'break' },
        },
        series: [
          {
            type: 'bar',
            barMaxWidth: 28,
            label: { show: true, position: 'right', fontSize: FONT_SIZE, color: text, formatter: (p: { value: number }) => `${p.value} ${spec.unit}` },
            data: spec.items.map((item) => ({ value: item.value, itemStyle: { color: token(`--role-${item.role}`), borderRadius: 0 } })),
          },
        ],
      };

    case 'bcg-num': {
      // Klasik BCG: göreli pay log ölçekte, yüksek pay solda; dikeyde pazar büyümesi (%). Balon alanı ciroyla orantılı.
      const fills: Record<string, string> = {
        yildiz: token('--role-ekip-lideri-bg'),
        soru: token('--role-pazarlamaci-bg'),
        inek: token('--role-saha-uzmani-bg'),
        kopek: token('--role-yazilim-bg'),
      };
      const tones: Record<string, string> = {
        yildiz: token('--role-ekip-lideri'),
        soru: token('--role-pazarlamaci'),
        inek: token('--role-saha-uzmani'),
        kopek: token('--role-yazilim'),
      };
      const muted = token('--text-secondary');
      const name = (key: string) => spec.quadrants.find((q) => q.key === key)?.name ?? key;
      const xMin = 0.05;
      const xMax = 10;
      // Eksen 10’un katlarına hizalı: büyüme eşiği (%10) bir çizgiye denk gelir.
      const yMin = Math.min(-10, Math.floor((Math.min(...spec.items.map((i) => i.growth)) - 4) / 10) * 10);
      const yMax = Math.max(30, Math.ceil((Math.max(...spec.items.map((i) => i.growth)) + 8) / 10) * 10);
      const maxRevenue = Math.max(...spec.items.map((i) => i.revenue));
      const bounds: Record<string, [number, number, number, number]> = {
        yildiz: [spec.shareSplit, xMax, spec.growthSplit, yMax],
        soru: [xMin, spec.shareSplit, spec.growthSplit, yMax],
        inek: [spec.shareSplit, xMax, yMin, spec.growthSplit],
        kopek: [xMin, spec.shareSplit, yMin, spec.growthSplit],
      };
      const axisName = { color: text, fontSize: FONT_SIZE, fontWeight: 600 };
      return {
        ...base(),
        // Eksen adları için sabit pay: ECharts containLabel eksen adını hesaba katmaz.
        grid: { left: FONT_SIZE * 6, right: FONT_SIZE * 2, top: FONT_SIZE, bottom: FONT_SIZE * 4.5, containLabel: false },
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'item',
          formatter: (p: { data?: { name?: string; value?: number[]; revenue?: number; quadrant?: string } }) =>
            p.data?.value
              ? `${p.data.name}<br/>Pazar büyümesi %${number.format(p.data.value[1])} · Göreli pay ${number.format(p.data.value[0])}×<br/>Ciro ${number.format(p.data.revenue ?? 0)} milyon ₺ · ${name(p.data.quadrant ?? '')}`
              : '',
        },
        xAxis: {
          type: 'log',
          logBase: 10,
          min: xMin,
          max: xMax,
          inverse: true,
          name: 'Göreli pazar payı  (← yüksek · düşük →)',
          nameLocation: 'middle',
          nameGap: FONT_SIZE * 2.4,
          nameTextStyle: axisName,
          ...axis(),
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { ...(axis().axisLabel as Opt), showMinLabel: false, formatter: (v: number) => `${number.format(v)}×` },
        },
        yAxis: {
          type: 'value',
          min: yMin,
          max: yMax,
          interval: 10,
          name: 'Pazar büyümesi',
          nameLocation: 'middle',
          nameGap: FONT_SIZE * 3.6,
          nameRotate: 90,
          nameTextStyle: axisName,
          ...axis(),
          axisLine: { show: false },
          splitLine: { show: false },
          axisLabel: { ...(axis().axisLabel as Opt), formatter: (v: number) => (v < 0 ? `−%${-v}` : `%${v}`) },
        },
        series: [
          {
            type: 'scatter',
            data: spec.items.map((item) => ({
              name: item.name,
              quadrant: item.quadrant,
              revenue: item.revenue,
              value: [item.share, item.growth],
              symbolSize: 16 + 40 * Math.sqrt(item.revenue / maxRevenue),
              itemStyle: { color: tones[item.quadrant], borderColor: token('--surface-raised'), borderWidth: 2 },
              label: {
                show: true,
                // Sağ kenara yakın balonun (düşük pay) etiketi solda: dar ekranda grafik dışına taşmaz.
                position: (Math.log10(xMax) - Math.log10(item.share)) / (Math.log10(xMax) - Math.log10(xMin)) > 0.72 ? 'left' : 'right',
                distance: 8,
                fontSize: FONT_SIZE,
                color: text,
                formatter: `{n|${item.name}}\n{v|${number.format(item.revenue)} milyon ₺}`,
                rich: { n: { fontSize: FONT_SIZE, fontWeight: 600, color: text, lineHeight: FONT_SIZE + 4 }, v: { fontSize: FONT_SIZE, color: muted, lineHeight: FONT_SIZE + 4 } },
              },
            })),
            markArea: {
              silent: true,
              data: Object.entries(bounds).map(([key, [x0, x1, y0, y1]]) => [
                {
                  name: name(key),
                  xAxis: x1,
                  yAxis: y1,
                  itemStyle: { color: fills[key] },
                  label: {
                    show: true,
                    position: key === 'yildiz' || key === 'inek' ? 'insideTopLeft' : 'insideTopRight',
                    distance: FONT_SIZE / 2,
                    fontSize: FONT_SIZE,
                    fontWeight: 600,
                    color: token(`--role-${key === 'yildiz' ? 'ekip-lideri' : key === 'soru' ? 'pazarlamaci' : key === 'inek' ? 'saha-uzmani' : 'yazilim'}-fg`),
                  },
                },
                { xAxis: x0, yAxis: y0 },
              ]),
            },
            // Eşikler: göreli pay 1× ve pazar büyümesi %10 (ince kesikli çizgi, etiketsiz).
            markLine: {
              silent: true,
              symbol: 'none',
              label: { show: false },
              lineStyle: { color: token('--rule-strong'), type: 'dashed', width: 1 },
              data: [{ xAxis: spec.shareSplit }, { yAxis: spec.growthSplit }],
            },
          },
        ],
      };
    }

    case 'cumulative': {
      const names = spec.series.map((x) => x.name);
      return {
        ...base(),
        grid: { ...grid, top: legendTop(names, width) },
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', valueFormatter: (v: number) => `${number.format(v)} ${spec.unit}` },
        legend: { ...(base().legend as Opt), data: names },
        xAxis: { type: 'category', data: spec.labels, boundaryGap: false, ...axis(), splitLine: { show: false } },
        yAxis: { type: 'value', max: Math.ceil(Math.max(spec.cap * 1.15, ...spec.series.flatMap((x) => x.values)) / 50) * 50, ...axis() },
        series: spec.series.map((x, i) => ({
          name: x.name,
          type: 'line',
          data: x.values,
          symbol: 'none',
          lineStyle: { color: token(`--role-${x.role}`), width: 2, type: x.dashed ? 'dashed' : 'solid' },
          itemStyle: { color: token(`--role-${x.role}`) },
          markLine:
            i === 0
              ? {
                  symbol: 'none',
                  silent: true,
                  data: [{ yAxis: spec.cap }],
                  lineStyle: { color: token('--accent-strong'), type: 'dashed', width: 2 },
                  label: { formatter: spec.capLabel, color: token('--accent-strong'), fontSize: FONT_SIZE, position: 'insideStartTop' },
                }
              : undefined,
        })),
      };
    }

    case 'hedef-adim': {
      // Geçit hedefleri: yatay gruplanmış çubuk (dar ekranda adım adları sarılmaz); değer çubuğun ucunda, açıklama üstte.
      const names = spec.series.map((s) => s.name);
      const labels = spec.series.flatMap((s) => s.values.map((v) => number.format(v)));
      return {
        ...base(),
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', axisPointer: { ...((base().tooltip as Opt).axisPointer as Opt), type: 'shadow' } },
        legend: { ...(base().legend as Opt), data: names },
        grid: { left: 4, right: labelRoom(labels), top: legendTop(names, width), bottom: 4, containLabel: true },
        xAxis: { type: 'value', ...axis(), minInterval: 1, splitNumber: width < OPEX_NARROW ? 3 : 5, axisLabel: { ...(axis().axisLabel as Opt), hideOverlap: true } },
        yAxis: { type: 'category', inverse: true, data: spec.steps, ...axis(), axisLine: { show: false }, axisLabel: { ...categoryLabel(width, 0.4, spec.steps), interval: 0 } },
        series: spec.series.map((s) => ({
          name: s.name,
          type: 'bar',
          data: s.values,
          barMaxWidth: 16,
          barGap: '30%',
          itemStyle: { color: token(`--role-${s.role}`), borderRadius: 0 },
          label: { show: true, position: 'right', fontSize: FONT_SIZE, color: text, formatter: (p: { value: number }) => number.format(p.value) },
        })),
      };
    }

    case 'kumulatif-tl': {
      // Senaryo çizgileri (₺); isteğe bağlı yatay kesikli çizgi (hedef ya da sıfır). Dar ekranda ay etiketleri seyrelir.
      const names = spec.series.map((x) => x.name);
      const all = spec.series.flatMap((x) => x.values);
      const maxV = Math.max((spec.target ?? 0) * 1.15, ...all, 1);
      const minV = Math.min(0, ...all);
      const strong = token('--accent-strong');
      return {
        ...base(),
        grid: { ...grid, top: legendTop(names, width) },
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', valueFormatter: (v: number) => lira(v) },
        legend: { ...(base().legend as Opt), data: names },
        xAxis: { type: 'category', data: spec.labels, boundaryGap: false, ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), hideOverlap: true } },
        yAxis: { type: 'value', max: Math.ceil(maxV / 1_000_000) * 1_000_000, min: Math.floor(minV / 1_000_000) * 1_000_000, ...axis(), axisLabel: { ...(axis().axisLabel as Opt), formatter: millions } },
        series: spec.series.map((x, i) => ({
          name: x.name,
          type: 'line',
          data: x.values,
          symbol: 'none',
          lineStyle: { color: token(`--role-${x.role}`), width: 2, type: x.dashed ? 'dashed' : 'solid' },
          itemStyle: { color: token(`--role-${x.role}`) },
          markLine:
            i === 0 && spec.target !== undefined
              ? { symbol: 'none', silent: true, data: [{ yAxis: spec.target }], lineStyle: { color: strong, type: 'dashed', width: 2 }, label: { formatter: spec.targetLabel ?? `Hedef ${lira(spec.target)}`, color: strong, fontSize: FONT_SIZE, position: 'insideEndTop' } }
              : undefined,
        })),
      };
    }

    case 'seri-cizgi': {
      // Adet çizgileri (senaryo üst üste): kesişen ve ayrışan eğriler; tam sayı ekseni.
      const names = spec.series.map((x) => x.name);
      return {
        ...base(),
        grid: { ...grid, top: legendTop(names, width) },
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', valueFormatter: (v: number) => `${number.format(Math.round(v * 10) / 10)} ${spec.unit}` },
        legend: { ...(base().legend as Opt), data: names },
        xAxis: { type: 'category', data: spec.labels, boundaryGap: false, ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), hideOverlap: true } },
        yAxis: { type: 'value', minInterval: 1, ...axis() },
        series: spec.series.map((x) => ({
          name: x.name,
          type: 'line',
          data: x.values,
          symbolSize: 6,
          lineStyle: { color: token(`--role-${x.role}`), width: 2, type: x.dashed ? 'dashed' : 'solid' },
          itemStyle: { color: token(`--role-${x.role}`) },
        })),
      };
    }

    case 'grup-ay': {
      // ₺ gruplanmış çubuk: senaryolar yan yana; dar ekranda yatay (kategori satırları).
      const narrow = width < OPEX_NARROW;
      const names = spec.series.map((x) => x.name);
      const category: Opt = narrow
        ? { type: 'category', inverse: true, data: spec.months, ...axis(), axisLine: { show: false }, axisLabel: { ...categoryLabel(width, 0.3, spec.months), interval: 0 } }
        : { type: 'category', data: spec.months, ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), interval: 0, hideOverlap: true } };
      return {
        ...base(),
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', axisPointer: { ...((base().tooltip as Opt).axisPointer as Opt), type: 'shadow' }, valueFormatter: (v: number) => lira(v) },
        legend: { ...(base().legend as Opt), data: names },
        grid: { left: 4, right: 16, bottom: 4, top: legendTop(names, width), containLabel: true },
        xAxis: narrow ? valueAxis(narrow) : category,
        yAxis: narrow ? category : valueAxis(narrow),
        series: spec.series.map((x) => ({ name: x.name, type: 'bar', data: x.values, barMaxWidth: 14, barGap: '20%', itemStyle: { color: token(`--role-${x.role}`), borderRadius: 0 } })),
      };
    }

    case 'basabas': {
      // Aylık başabaş: gelir ve gider çizgileri kesişir; kesişim ayında dikey kesikli çizgi ve etiketli işaret.
      // Etiket işaretin üstünde (tepeye yakınsa altında), kenara yakınsa içe hizalı: SVG dışına taşmaz, lejantla çakışmaz.
      const names = ['Aylık gelir', 'Aylık gider'];
      const strong = token('--accent-strong');
      const n = spec.labels.length;
      const t = spec.nokta === null ? null : Math.min(n - 1, Math.max(0, Math.round(spec.nokta)));
      const maxY = Math.max(...spec.gelir, ...spec.gider, 1);
      const labelPos = t !== null && Math.max(spec.gelir[t], spec.gider[t]) > maxY * 0.75 ? 'bottom' : 'top';
      const align = t === null ? 'center' : t > n * 0.75 ? 'right' : t < n * 0.25 ? 'left' : 'center';
      return {
        ...base(),
        grid: { ...grid, right: 24, top: legendTop(names, width) },
        tooltip: { ...(base().tooltip as Opt), trigger: 'axis', valueFormatter: (v: number) => lira(v) },
        legend: { ...(base().legend as Opt), data: names },
        xAxis: { type: 'category', data: spec.labels, boundaryGap: false, ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), hideOverlap: true } },
        yAxis: { type: 'value', ...axis(), axisLabel: { ...(axis().axisLabel as Opt), formatter: millions } },
        series: [
          {
            name: names[0],
            type: 'line',
            data: spec.gelir,
            symbolSize: 6,
            lineStyle: { color: token('--viz-3'), width: 2 },
            itemStyle: { color: token('--viz-3') },
            markLine: t === null ? undefined : { symbol: 'none', silent: true, data: [{ xAxis: spec.labels[t] }], lineStyle: { color: strong, type: 'dashed', width: 2 }, label: { show: false } },
            markPoint:
              t === null
                ? undefined
                : {
                    symbol: 'circle',
                    symbolSize: 14,
                    itemStyle: { color: strong, borderColor: token('--surface-raised'), borderWidth: 2 },
                    label: { show: true, position: labelPos, distance: 10, align, formatter: spec.noktaLabel, color: strong, fontSize: FONT_SIZE, fontWeight: 600 },
                    data: [{ coord: [spec.labels[t], spec.gelir[t]] }],
                  },
          },
          { name: names[1], type: 'line', data: spec.gider, symbolSize: 6, lineStyle: { color: token('--viz-2'), width: 2 }, itemStyle: { color: token('--viz-2') } },
        ],
      };
    }

    case 'basabas-adet': {
      // Klasik başabaş noktası: yatay eksen ödeyen satıcı adedi; gelir doğrusu ile sabit + değişken gider doğrusu kesişir.
      const names = ['Aylık gelir', 'Aylık toplam gider'];
      const strong = token('--accent-strong');
      const last = spec.n.length - 1;
      const nMax = spec.n[last] || 1;
      const slope = spec.gelir[last] / nMax;
      const maxY = Math.max(...spec.gelir, ...spec.gider, 1);
      const yAt = spec.nokta === null ? 0 : spec.nokta * slope;
      const labelPos = yAt > maxY * 0.75 ? 'bottom' : 'top';
      const align = spec.nokta === null ? 'center' : spec.nokta > nMax * 0.75 ? 'right' : spec.nokta < nMax * 0.25 ? 'left' : 'center';
      return {
        ...base(),
        grid: { ...grid, right: 24, top: legendTop(names, width) },
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'axis',
          formatter: (ps: { axisValue: number; seriesName: string; value: number[] }[]) =>
            `${number.format(ps[0].axisValue)} ${spec.unit}<br/>${ps.map((x) => `${x.seriesName}: ${lira(x.value[1])}`).join('<br/>')}`,
        },
        legend: { ...(base().legend as Opt), data: names },
        xAxis: { type: 'value', max: nMax, ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), hideOverlap: true } },
        yAxis: { type: 'value', ...axis(), axisLabel: { ...(axis().axisLabel as Opt), formatter: millions } },
        series: [
          {
            name: names[0],
            type: 'line',
            data: spec.n.map((k, i) => [k, spec.gelir[i]]),
            symbol: 'none',
            lineStyle: { color: token('--viz-3'), width: 2 },
            itemStyle: { color: token('--viz-3') },
            markLine: spec.nokta === null ? undefined : { symbol: 'none', silent: true, data: [{ xAxis: spec.nokta }], lineStyle: { color: strong, type: 'dashed', width: 2 }, label: { show: false } },
            markPoint:
              spec.nokta === null
                ? undefined
                : {
                    symbol: 'circle',
                    symbolSize: 14,
                    itemStyle: { color: strong, borderColor: token('--surface-raised'), borderWidth: 2 },
                    label: { show: true, position: labelPos, distance: 10, align, formatter: spec.noktaLabel, color: strong, fontSize: FONT_SIZE, fontWeight: 600 },
                    data: [{ coord: [spec.nokta, yAt] }],
                  },
          },
          { name: names[1], type: 'line', data: spec.n.map((k, i) => [k, spec.gider[i]]), symbol: 'none', lineStyle: { color: token('--viz-2'), width: 2 }, itemStyle: { color: token('--viz-2') } },
        ],
      };
    }

    case 'nakit-ay': {
      // Nakit akışı: giriş ve çıkış yan yana çubuk, dönem sonu nakit çizgi (geniş) ya da işaret (dar, yatay). Negatif nakit
      // değer ekseninde görünür; tutarlar ipucunda, tablo sayfada.
      const narrow = width < OPEX_NARROW;
      const surface = token('--surface-raised');
      const names = ['Nakit girişi', 'Nakit çıkışı', 'Dönem sonu nakit'];
      const category: Opt = narrow
        ? { type: 'category', inverse: true, data: spec.months, ...axis(), axisLine: { show: false }, axisLabel: { ...categoryLabel(width, 0.3, spec.months), interval: 0 } }
        : { type: 'category', data: spec.months, ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), interval: 0, hideOverlap: true } };
      const value: Opt = valueAxis(narrow);
      const series: Opt[] = [
        { name: names[0], type: 'bar', data: spec.inflow, barMaxWidth: 16, barGap: '20%', itemStyle: { color: token('--viz-3'), borderRadius: 0 } },
        { name: names[1], type: 'bar', data: spec.outflow, barMaxWidth: 16, itemStyle: { color: token('--viz-2'), borderRadius: 0 } },
        narrow
          ? { name: names[2], type: 'scatter', data: spec.balance.map((v, i) => [v, spec.months[i]]), symbol: 'diamond', symbolSize: 12, itemStyle: { color: text, borderColor: surface, borderWidth: 2 }, z: 5 }
          : { name: names[2], type: 'line', data: spec.balance, symbolSize: 8, lineStyle: { color: text, width: 2 }, itemStyle: { color: text, borderColor: surface, borderWidth: 2 }, z: 5 },
      ];
      return {
        ...base(),
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'axis',
          axisPointer: { ...((base().tooltip as Opt).axisPointer as Opt), type: 'shadow' },
          valueFormatter: (v: number | number[]) => lira(Array.isArray(v) ? v[0] : v),
        },
        legend: { ...(base().legend as Opt), data: names },
        grid: { left: 4, right: 16, bottom: 4, top: legendTop(names, width), containLabel: true },
        xAxis: narrow ? value : category,
        yAxis: narrow ? category : value,
        series,
      };
    }

    case 'opex-bar': {
      const narrow = width < OPEX_NARROW;
      const label = (v: number) => (spec.share ? `${lira(v)} · ${ratio(v / spec.share)}` : lira(v));
      const labels = spec.items.map((i) => label(i.value));
      return {
        ...base(),
        legend: { show: false },
        // Dikey pay --chart-row-pad ile aynı (kutu 2×4 px + ızgara 2×4 px); satır yüksekliği etikete kalır.
        grid: { left: 4, right: narrow ? 24 : labelRoom(labels), top: 4, bottom: 4, containLabel: true },
        tooltip: { ...(base().tooltip as Opt), trigger: 'item', formatter: (p: { name: string; value: number }) => `${esc(p.name)}<br/>${label(p.value)}` },
        xAxis: { ...valueAxis(narrow), show: narrow },
        // Her kategori adı görünür (ECharts sığmayanı kendiliğinden gizlerdi).
        yAxis: { type: 'category', inverse: true, data: spec.items.map((i) => i.name), ...axis(), axisLine: { show: false }, axisLabel: { ...categoryLabel(width, 0.4, spec.items.map((i) => i.name)), interval: 0 } },
        series: [
          {
            type: 'bar',
            barMaxWidth: 24,
            data: spec.items.map((i) => ({ value: i.value, itemStyle: { color: viz(i.tone), borderRadius: 0 } })),
            label: { show: !narrow, position: 'right', fontSize: FONT_SIZE, color: text, formatter: (p: { value: number }) => label(p.value) },
          },
        ],
      };
    }

    case 'opex-stack':
    case 'opex-stack-h': {
      const horizontal = spec.kind === 'opex-stack-h' || width < OPEX_NARROW;
      const narrow = width < OPEX_NARROW;
      const surface = token('--surface-raised');
      const names = [...spec.series.map((s) => s.name), ...(spec.line ? [spec.line.name] : [])];
      const category: Opt = horizontal
        ? { type: 'category', inverse: true, data: spec.categories, ...axis(), axisLine: { show: false }, axisLabel: categoryLabel(width, 0.34, spec.categories) }
        : // Dikey: her ay yazılır (ECharts kendiliğinden atlardı); sığmayan dar genişlikte yalnız çakışan etiket gizlenir.
          { type: 'category', data: spec.categories, ...axis(), splitLine: { show: false }, axisLabel: { ...(axis().axisLabel as Opt), interval: 0, hideOverlap: true } };
      const series: Opt[] = spec.series.map((s) => ({
        name: s.name,
        type: 'bar',
        stack: 'toplam',
        data: s.values,
        barMaxWidth: 24,
        // 2 px yüzey aralığı: yığın dilimleri çizgi değil boşlukla ayrılır.
        itemStyle: { color: viz(s.tone), borderRadius: 0, borderColor: surface, borderWidth: 1 },
      }));
      if (spec.line) {
        series.push(
          horizontal
            ? {
                name: spec.line.name,
                type: 'scatter',
                data: spec.line.values.map((v, i) => [v, spec.categories[i]]),
                symbol: 'diamond',
                symbolSize: 12,
                itemStyle: { color: text, borderColor: surface, borderWidth: 2 },
                z: 5,
              }
            : {
                name: spec.line.name,
                type: 'line',
                data: spec.line.values,
                symbolSize: 8,
                lineStyle: { color: text, width: 2, type: 'dashed' },
                itemStyle: { color: text, borderColor: surface, borderWidth: 2 },
                z: 5,
              },
        );
      }
      return {
        ...base(),
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'axis',
          axisPointer: { ...((base().tooltip as Opt).axisPointer as Opt), type: 'shadow' },
          valueFormatter: (v: number | number[]) => lira(Array.isArray(v) ? v[0] : v),
        },
        legend: { ...(base().legend as Opt), data: names },
        grid: { left: 4, right: 16, bottom: 4, top: legendTop(names, width), containLabel: true },
        xAxis: horizontal ? valueAxis(narrow) : category,
        yAxis: horizontal ? category : valueAxis(narrow),
        series,
      };
    }

    case 'opex-group': {
      const narrow = width < OPEX_NARROW;
      const names = spec.series.map((s) => s.name);
      return {
        ...base(),
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'axis',
          axisPointer: { ...((base().tooltip as Opt).axisPointer as Opt), type: 'shadow' },
          valueFormatter: (v: number) => lira(v),
        },
        legend: { ...(base().legend as Opt), data: names },
        grid: { left: 4, right: 16, top: legendTop(names, width), bottom: 4, containLabel: true },
        xAxis: valueAxis(narrow),
        yAxis: { type: 'category', inverse: true, data: spec.categories, ...axis(), axisLine: { show: false }, axisLabel: categoryLabel(width, 0.36, spec.categories) },
        series: spec.series.map((s) => ({
          name: s.name,
          type: 'bar',
          data: s.values,
          barMaxWidth: 14,
          barGap: '25%',
          itemStyle: { color: viz(s.tone), borderRadius: 0 },
        })),
      };
    }

    case 'opex-bilesim': {
      // Kullanıcı kararı 2026-10-21: köprü yerine tek yığılmış çubuk; parçalar soldan sağa, ölçek toplamda biter.
      const narrow = width < OPEX_NARROW;
      const surface = token('--surface-raised');
      const toplam = spec.total.value;
      const adlar = bilesimAdlari(spec, width);
      return {
        ...base(),
        legend: {
          ...(base().legend as Opt),
          data: adlar,
          ...(narrow
            ? {
                orient: 'vertical',
                itemGap: 12,
                textStyle: { ...((base().legend as Opt).textStyle as Opt), width: bilesimMetinGenisligi(width), overflow: 'break', lineHeight: FONT_SIZE + 6 },
              }
            : {}),
        },
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'item',
          formatter: (p: { seriesIndex: number }) => {
            const x = spec.parts[p.seriesIndex];
            return x ? `${esc(x.name)}<br/>${lira(x.value)} · ${ratio(toplam ? x.value / toplam : 0)}` : '';
          },
        },
        grid: { left: 4, right: 4, top: bilesimUst(adlar, width), bottom: 4, containLabel: false },
        xAxis: { ...valueAxis(narrow), show: false, max: toplam || undefined },
        yAxis: { type: 'category', data: [spec.total.name], show: false },
        series: spec.parts.map((x, i) => ({
          name: adlar[i],
          type: 'bar',
          stack: 'bilesim',
          data: [Math.max(0, x.value)],
          barMaxWidth: 48,
          // Dilimler 1 px yüzey aralığıyla ayrılır (çizgi değil boşluk).
          itemStyle: { color: viz(x.tone), borderRadius: 0, borderColor: surface, borderWidth: 1 },
        })),
      };
    }

    case 'huni': {
      const t = tone(spec.role);
      const label = (p: { name: string; value: number }) => `${p.name}: ${number.format(p.value)}`;
      return {
        ...base(),
        tooltip: { ...(base().tooltip as Opt), trigger: 'item', formatter: label },
        legend: { show: false },
        series: [
          {
            type: 'funnel',
            sort: 'descending',
            left: '4%',
            right: '4%',
            top: 8,
            bottom: 8,
            minSize: '28%',
            gap: 4,
            label: { show: true, position: 'inside', fontSize: FONT_SIZE, fontWeight: 600, color: t.text, formatter: label },
            itemStyle: { color: t.fill, borderColor: t.line, borderWidth: 2 },
            data: spec.items,
          },
        ],
      };
    }
  }
}

/** ECharts seri varsayılanları (çizgi doğrusal, pasta 1000 ms, işaret çizgisi doğrusal) token hareketiyle ezilir. */
function applyMotion(options: Opt) {
  const m = motion();
  for (const series of options.series as Opt[]) {
    Object.assign(series, m);
    if (series.markLine) Object.assign(series.markLine as Opt, m);
    if (series.markArea) Object.assign(series.markArea as Opt, m);
    if (series.markPoint) Object.assign(series.markPoint as Opt, m);
  }
  return options;
}

/** Piramit: şekil için kademe sırası; etiket ve ipucu gerçek kişi sayısı. */
function finalize(spec: ChartSpec, options: Opt) {
  applyMotion(options);
  // Sıra kimliği: veri değişince aynı seri eşleşir ve yeni değere geçer (grafik yeniden kurulmaz).
  (options.series as Opt[] | undefined)?.forEach((s, i) => {
    if (s.id === undefined) s.id = `s${i}`;
  });
  if (spec.kind !== 'piramit') return options;
  const series = (options.series as Opt[])[0];
  series.data = spec.items.map((item, i) => {
    const t = tone(item.role);
    return {
      name: item.name,
      value: i + 1,
      count: item.count,
      itemStyle: { color: t.fill, borderColor: t.line, borderWidth: 2 },
      label: { color: t.text, formatter: `${item.name} · ${item.count}` },
    };
  });
  series.label = { show: true, position: 'inside', fontSize: FONT_SIZE, fontWeight: 600 };
  (options.tooltip as Opt).formatter = (p: { data: { name: string; count: number } }) => `${p.data.name}: ${p.data.count} kişi`;
  return options;
}

const widthOf = (el: HTMLElement) => el.clientWidth;

function render(el: HTMLElement, mod: EChartsModule, spec: ChartSpec) {
  const chart = mod.echarts.init(el, undefined, { renderer: 'svg' });
  const option = compose(el, spec, widthOf(el));
  chart.setOption(option);
  if (spec.kind === 'org' || spec.kind === 'gov') {
    // Düğüm bağlantıları rol sayfasına gider; aynı bağlantılar ana gezinmede de vardır.
    chart.on('click', (p) => {
      const target = (p.data as { value?: string } | null)?.value;
      if (target) window.location.href = target;
    });
  }
  // Dar ekranda organizasyon şeması tepeyi (ortayı) göstererek açılır; kaydırma animasyonsuz.
  const scroller = el.closest<HTMLElement>('.chart-scroll');
  if (scroller && spec.kind === 'org') scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  const observer = new ResizeObserver(() => {
    chart.resize();
    // Genişlik belirgin değişince açıklama satırları ve etiket genişlikleri yeniden hesaplanır.
    const entry = charts.get(el);
    // Dar/geniş eşiği geçilince de (yön ve satır payı değişir) yeniden kurulur; yavaş yeniden boyutlandırmada kalmaz.
    if (entry && (Math.abs(widthOf(el) - entry.width) > 48 || widthOf(el) < OPEX_NARROW !== entry.width < OPEX_NARROW)) {
      entry.width = widthOf(el);
      chart.setOption(compose(el, entry.spec, entry.width, true), { notMerge: true });
    }
  });
  observer.observe(el);
  charts.set(el, { chart, spec, width: widthOf(el), observer, shape: shapeOf(option) });
}

/**
 * Bileşim açıklamasının yüksekliği. Dar grafikte açıklama alt alta (her parça bir satır) ve uzun satır sözcük arasından
 * sarılır (telefonda grafik genişliğini aşmasın); geniş grafikte yan yana.
 */
const bilesimMetinGenisligi = (width: number) => Math.max(120, width - 48);
function bilesimUst(adlar: string[], width: number) {
  if (width >= OPEX_NARROW) return legendTop(adlar, width);
  const satir = adlar.reduce((t, a) => t + a.split('\n').reduce((u, l) => u + Math.ceil((l.length * FONT_SIZE * 0.56) / bilesimMetinGenisligi(width)), 0), 0);
  return satir * (FONT_SIZE + 6) + adlar.length * 12 + 16;
}

/** Bileşim grafiği açıklaması: parça adı, tutarı ve toplamdaki payı (küçük parça çubukta okunmaz; değeri burada). */
function bilesimAdlari(spec: Extract<ChartSpec, { kind: 'opex-bilesim' }>, width: number) {
  const toplam = spec.total.value;
  const pay = (v: number) => ratio(toplam ? v / toplam : 0);
  // Dar grafikte iki satır: ad, altında tutar ve pay (sayı satır sonunda bölünmez).
  return spec.parts.map((x) => (width < OPEX_NARROW ? `${x.name}\n${shortLira(x.value)} · ${pay(x.value)}` : `${x.name} · ${lira(x.value)} (${pay(x.value)})`));
}

/**
 * Satırlı grafik (`data-rows`): kutu satır başına etiket yüksekliğinden kısa olmaz. Açıklama (legend) satırları ve alttaki
 * değer ekseni genişliğe göre değişir; payları burada hesaplanıp `--chart-row-pad` olarak kutuya yazılır.
 */
function legendPad(spec: ChartSpec, width: number): number | null {
  // Bileşim: açıklama + tek çubuk (48 px) payı; değer ekseni yok.
  if (spec.kind === 'opex-bilesim') return 8 + bilesimUst(bilesimAdlari(spec, width), width) + 4 + 48;
  const yatay = spec.kind === 'opex-stack-h' || spec.kind === 'opex-group' || (spec.kind === 'opex-stack' && width < OPEX_NARROW);
  if (!yatay) return null;
  const names = [...spec.series.map((s) => s.name), ...('line' in spec && spec.line ? [spec.line.name] : [])];
  // kutu iç boşluğu 2×4 + açıklama + ızgara alt payı + değer ekseni etiketi (satır + boşluk)
  return 8 + legendTop(names, width) + 4 + FONT_SIZE + 6 + 12;
}

/**
 * Seçenek + satır payı. Pay yazı boyutuyla hesaplanır (önce güncellenir). Boyut gözlemcisinin içinden çağrılınca pay bir
 * sonraki karede yazılır: gözlenen kutu kendi bildirimi sırasında boyut değiştirmez (ResizeObserver döngü hatası olmaz).
 */
function compose(el: HTMLElement, spec: ChartSpec, width: number, ertele = false) {
  FONT_SIZE = fontPx();
  const canvas = el.closest<HTMLElement>('.chart-canvas[data-rows]');
  const pad = canvas ? legendPad(spec, width) : null;
  const uygula = () => {
    if (canvas && pad !== null) canvas.style.setProperty('--chart-row-pad', `${pad}px`);
    else canvas?.style.removeProperty('--chart-row-pad');
  };
  if (ertele) requestAnimationFrame(uygula);
  else uygula();
  return finalize(spec, build(spec, width));
}

function redrawAll() {
  for (const [el, entry] of charts) {
    entry.width = widthOf(el);
    entry.chart.setOption(compose(el, entry.spec, entry.width), { notMerge: true });
  }
}

let globalObservers = false;
/** Tema ve hareket azaltma tercihi değişince tüm grafikler tokenlarla yeniden çizilir. */
function watchPreferences() {
  if (globalObservers) return;
  globalObservers = true;
  new MutationObserver(redrawAll).observe(document.documentElement, { attributes: true, attributeFilter: ['data-mantine-color-scheme'] });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', redrawAll);
}

/**
 * İlk çağrıda grafiği kurar. Sonrakilerde (veri değişti) aynı türde grafik birleştirilerek güncellenir: seriler sıra
 * kimliğiyle eşleşir, yalnız değişen çubuk/dilim yeni değerine geçer; tür değiştiyse baştan çizilir.
 */
export async function drawChart(el: HTMLElement, spec: ChartSpec) {
  loader ??= import('../lib/echarts-setup');
  let mod: EChartsModule;
  try {
    mod = await loader;
  } catch (error) {
    loader = null;
    throw error;
  }
  // Etiket ölçüleri sayfanın yazı tipiyle hesaplansın: yazı tipi yüklenmeden ilk çizim yapılmaz. Dar yazı (Giderler)
  // yalnız grafikte kullanıldığı için kendiliğinden inmez; Türkçe harfleriyle birlikte açıkça yüklenir.
  const condensed = token('--font-condensed');
  await Promise.all([document.fonts?.ready, condensed ? document.fonts?.load(`${FONT_SIZE}px ${condensed}`, 'AaĞğİıŞşÜüÖöÇç').catch(() => undefined) : undefined]);
  // Beklerken kutu kaldırıldıysa (yıl sekmesi değişti) grafik kurulmaz: kopuk öğede örnek ve gözlemci kalmasın.
  if (!el.isConnected) return;
  const entry = charts.get(el);
  if (entry) {
    entry.width = widthOf(el);
    const option = compose(el, spec, entry.width);
    const shape = shapeOf(option);
    if (entry.spec.kind === spec.kind && entry.shape === shape) entry.chart.setOption(option, { replaceMerge: ['series'] });
    else entry.chart.setOption(option, { notMerge: true });
    entry.spec = spec;
    entry.shape = shape;
    return;
  }
  render(el, mod, spec);
  watchPreferences();
}

export function disposeChart(el: HTMLElement) {
  const entry = charts.get(el);
  if (!entry) return;
  entry.observer.disconnect();
  entry.chart.dispose();
  charts.delete(el);
}
