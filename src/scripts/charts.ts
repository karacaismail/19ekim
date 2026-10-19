/**
 * Grafikler: yalnız [data-chart] içeren sayfalarda ve görünür olduklarında ECharts’ı yükler.
 * Renk, yazı ve hareket değerleri tasarım tokenlarından okunur; tema değişince yeniden çizilir.
 * Metin boyutu --text-sm tokenından (kullanıcının kök yazı boyutunu izler, en az 14 CSS px); hareket simetrik
 * easeInOut Cubic (ECharts: cubicInOut); hareket azaltma tercihinde animasyon kapanır. Çubuk ve kutular radiussuzdur.
 * Seçenekler kapsayıcı genişliğine göre kurulur (açıklama satırları, eksen etiket genişliği).
 */
import type { ChartSpec, ChartTreeNode } from '../lib/chartSpec';

type EChartsModule = typeof import('../lib/echarts-setup');
type Instance = ReturnType<EChartsModule['echarts']['init']>;
type Opt = Record<string, unknown>;

/** Geçerli grafik yazı boyutu (px); her çizimde tokendan yeniden okunur. */
let FONT_SIZE = 14;
const DAY = 86_400_000;
const charts = new Map<HTMLElement, { chart: Instance; spec: ChartSpec; width: number; observer: ResizeObserver }>();
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
      extraCssText: `transition-timing-function: ${token('--motion-ease-standard')}; box-shadow: none; white-space: normal; max-width: min(22rem, 80vw);`,
      axisPointer: {
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
              const days = (ms(r.to) - ms(r.from)) / DAY + 1;
              // Kısa çubukta tarih etiketi çubuğun sağına taşınır (sığmayan metin kesilmez).
              const short = days / ((ms(spec.end) - start) / DAY) < 0.16;
              return {
                value: days,
                name: r.name,
                text: r.text,
                range: `${shortDate(ms(r.from))} – ${shortDate(ms(r.to))}`,
                itemStyle: { color: t.fill, borderColor: t.line, borderWidth: r.milestone ? 3 : 2, borderRadius: 0 },
                label: short ? { position: 'right', color: text } : { color: t.text },
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

    case 'bcg': {
      // Klasik yerleşim: yatayda yüksek pay solda (eksen ters), dikeyde hızlı büyüme üstte.
      // Kutular birbirinden ayırt edilsin: ton aileleri farklı.
      const fills: Record<string, string> = {
        yildiz: token('--role-ekip-lideri-bg'),
        soru: token('--role-pazarlamaci-bg'),
        inek: token('--role-saha-uzmani-bg'),
        kopek: token('--surface-sunken'),
      };
      const bounds: Record<string, [number, number, number, number]> = {
        yildiz: [0.5, 1, 0.5, 1],
        soru: [0, 0.5, 0.5, 1],
        inek: [0.5, 1, 0, 0.5],
        kopek: [0, 0.5, 0, 0.5],
      };
      const name = (key: string) => spec.quadrants.find((q) => q.key === key)?.name ?? key;
      const ends = (low: string, high: string) => (v: number) => (v === 0 ? low : v === 1 ? high : '');
      return {
        ...base(),
        grid: { left: 4, right: 16, top: 8, bottom: 4, containLabel: true },
        tooltip: {
          ...(base().tooltip as Opt),
          trigger: 'item',
          formatter: (p: { data?: { name?: string; quadrant?: string } }) => (p.data?.quadrant ? `${p.data.name}: ${name(p.data.quadrant)}` : ''),
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: 1,
          interval: 0.5,
          inverse: true,
          ...axis(),
          splitLine: { show: false },
          axisLabel: { ...(axis().axisLabel as Opt), formatter: ends('Düşük pay', 'Yüksek pay') },
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 1,
          interval: 0.5,
          ...axis(),
          splitLine: { show: false },
          axisLabel: { ...(axis().axisLabel as Opt), formatter: ends('Yavaş büyüme', 'Hızlı büyüme') },
        },
        series: [
          {
            type: 'scatter',
            symbolSize: 22,
            data: spec.items.map((item) => ({
              name: item.name,
              quadrant: item.quadrant,
              value: [item.x, item.y],
              itemStyle: {
                color: item.uncertain ? token('--surface-raised') : token(`--role-${item.role}`),
                borderColor: token(`--role-${item.role}`),
                borderWidth: 3,
                borderType: item.uncertain ? 'dashed' : 'solid',
              },
              // Aşağı inen okla çakışmasın: oku dikey olan noktanın etiketi sağda.
              label: { show: true, position: item.toward && item.toward.x === item.x ? 'right' : 'bottom', distance: 10, fontSize: FONT_SIZE, fontWeight: 600, color: text, formatter: item.name.split(' ')[0] },
            })),
            markArea: {
              silent: true,
              data: Object.entries(bounds).map(([key, [x0, x1, y0, y1]]) => [
                {
                  name: name(key),
                  xAxis: x0,
                  yAxis: y1,
                  itemStyle: { color: fills[key] },
                  // Eksen ters: ekranda sol kutuların dış köşesi “insideTopLeft”, sağ kutularınki “insideTopRight”.
                  label: { show: true, position: key === 'yildiz' || key === 'inek' ? 'insideTopLeft' : 'insideTopRight', fontSize: FONT_SIZE, fontWeight: 600, color: text },
                },
                { xAxis: x1, yAxis: y0 },
              ]),
            },
            markLine: {
              silent: true,
              symbol: ['none', 'arrow'],
              symbolSize: 14,
              lineStyle: { color: text, type: 'dashed', width: 2 },
              label: { show: false },
              data: spec.items
                .filter((item) => item.toward)
                .map((item) => [{ coord: [item.x, item.y] }, { coord: [item.toward!.x, item.toward!.y] }]),
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
  }
  return options;
}

/** Piramit: şekil için kademe sırası; etiket ve ipucu gerçek kişi sayısı. */
function finalize(spec: ChartSpec, options: Opt) {
  applyMotion(options);
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
  chart.setOption(finalize(spec, build(spec, widthOf(el))));
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
    if (entry && Math.abs(widthOf(el) - entry.width) > 48) {
      entry.width = widthOf(el);
      chart.setOption(finalize(entry.spec, build(entry.spec, entry.width)), { notMerge: true });
    }
  });
  observer.observe(el);
  charts.set(el, { chart, spec, width: widthOf(el), observer });
}

function redrawAll() {
  for (const [el, entry] of charts) {
    entry.width = widthOf(el);
    entry.chart.setOption(finalize(entry.spec, build(entry.spec, entry.width)), { notMerge: true });
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

/** İlk çağrıda grafiği kurar; sonrakilerde aynı grafiği yeni spec ile yeniden çizer. */
export async function drawChart(el: HTMLElement, spec: ChartSpec) {
  loader ??= import('../lib/echarts-setup');
  let mod: EChartsModule;
  try {
    mod = await loader;
  } catch (error) {
    loader = null;
    throw error;
  }
  // Etiket ölçüleri Outfit ile hesaplansın: yazı tipi yüklenmeden ilk çizim yapılmaz.
  await document.fonts?.ready;
  const entry = charts.get(el);
  if (entry) {
    entry.spec = spec;
    entry.width = widthOf(el);
    entry.chart.setOption(finalize(spec, build(spec, entry.width)), { notMerge: true });
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
