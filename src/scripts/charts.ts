/**
 * Grafikler: yalnız [data-chart] içeren sayfalarda ve görünür olduklarında ECharts’ı yükler.
 * Renk, yazı ve hareket değerleri tasarım tokenlarından okunur; tema değişince yeniden çizilir.
 * Tüm metinler 14 CSS px; hareket simetrik easeInOut Cubic (ECharts: cubicInOut); hareket
 * azaltma tercihinde animasyon kapanır. Aynı veriler sayfada tablo olarak da vardır.
 */
import type { ChartSpec } from '../lib/chartSpec';

type EChartsModule = typeof import('../lib/echarts-setup');
type Instance = ReturnType<EChartsModule['echarts']['init']>;

const FONT_SIZE = 14;
const charts = new Map<HTMLElement, { chart: Instance; spec: ChartSpec }>();
let loader: Promise<EChartsModule> | null = null;

const token = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const number = new Intl.NumberFormat('tr-TR');
const lira = (value: number) =>
  value >= 1_000_000
    ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(value / 1_000_000)} milyon ₺`
    : `${number.format(value)} ₺`;

function motion() {
  if (reducedMotion()) return { animation: false };
  const ms = parseFloat(token('--motion-duration-base')) || 240;
  return {
    animation: true,
    animationDuration: ms,
    animationEasing: 'cubicInOut',
    animationDurationUpdate: ms,
    animationEasingUpdate: 'cubicInOut',
  };
}

function base() {
  const text = token('--text-primary');
  const muted = token('--text-secondary');
  const fast = reducedMotion() ? 0 : (parseFloat(token('--motion-duration-fast')) || 160) / 1000;
  return {
    ...motion(),
    aria: { enabled: true, decal: { show: false } },
    textStyle: { fontFamily: token('--font-sans'), fontSize: FONT_SIZE, color: muted },
    tooltip: {
      backgroundColor: token('--surface-raised'),
      borderColor: token('--rule'),
      textStyle: { color: text, fontSize: FONT_SIZE, fontFamily: token('--font-sans') },
      transitionDuration: fast,
      extraCssText: `transition-timing-function: ${token('--motion-ease-standard')}; box-shadow: none;`,
    },
    legend: { top: 0, left: 0, textStyle: { color: muted, fontSize: FONT_SIZE }, itemGap: 16 },
  };
}

function axisStyle() {
  const muted = token('--text-secondary');
  const rule = token('--rule');
  return {
    axisLabel: { color: muted, fontSize: FONT_SIZE },
    nameTextStyle: { color: muted, fontSize: FONT_SIZE },
    axisLine: { lineStyle: { color: token('--rule-strong') } },
    splitLine: { lineStyle: { color: rule } },
    axisTick: { show: false },
  };
}

function build(spec: ChartSpec): Record<string, unknown> {
  const text = token('--text-primary');
  const accent = token('--accent');
  const accentStrong = token('--accent-strong');
  const grid = { left: 4, right: 12, bottom: 4, top: 56, containLabel: true };

  switch (spec.kind) {
    case 'gelir-ay': {
      let running = 0;
      const cumulative = spec.first.map((f, i) => (running += f + spec.renew[i]));
      return {
        ...base(),
        grid,
        tooltip: { ...base().tooltip, trigger: 'axis', valueFormatter: (v: number) => lira(Math.round(v)) },
        legend: { ...base().legend, data: ['İlk ödemeler', 'Yenilemeler', 'Kümülatif ciro'] },
        xAxis: { type: 'category', data: spec.months, ...axisStyle(), splitLine: { show: false } },
        yAxis: {
          type: 'value',
          ...axisStyle(),
          axisLabel: { ...axisStyle().axisLabel, formatter: (v: number) => (v === 0 ? '0' : `${v / 1_000_000} M`) },
        },
        series: [
          { name: 'İlk ödemeler', type: 'bar', stack: 'ay', data: spec.first, barMaxWidth: 64, itemStyle: { color: accent, borderRadius: 0 } },
          { name: 'Yenilemeler', type: 'bar', stack: 'ay', data: spec.renew, barMaxWidth: 64, itemStyle: { color: token('--role-saha-uzmani'), borderRadius: 0 } },
          {
            name: 'Kümülatif ciro',
            type: 'line',
            data: cumulative,
            symbolSize: 8,
            lineStyle: { color: text, width: 2 },
            itemStyle: { color: text },
            markLine: {
              symbol: 'none',
              data: [{ yAxis: spec.target }],
              lineStyle: { color: accentStrong, type: 'dashed', width: 2 },
              label: { formatter: `Hedef ${lira(spec.target)}`, color: accentStrong, fontSize: FONT_SIZE, position: 'insideStartTop' },
            },
          },
        ],
      };
    }
    case 'kopru':
      return {
        ...base(),
        grid,
        tooltip: { ...base().tooltip, trigger: 'axis', valueFormatter: (v: number) => lira(Math.round(v)) },
        legend: { ...base().legend, data: ['İlk ödemeler (100 aktif satıcı)', 'Yenilemeler'] },
        xAxis: { type: 'category', data: spec.scenarios, ...axisStyle(), splitLine: { show: false } },
        yAxis: {
          type: 'value',
          max: Math.max(spec.target * 1.2, ...spec.first.map((f, i) => f + spec.renew[i])),
          ...axisStyle(),
          axisLabel: { ...axisStyle().axisLabel, formatter: (v: number) => (v === 0 ? '0' : `${v / 1_000_000} M`) },
        },
        series: [
          { name: 'İlk ödemeler (100 aktif satıcı)', type: 'bar', stack: 'senaryo', data: spec.first, barMaxWidth: 64, itemStyle: { color: accent, borderRadius: 0 } },
          {
            name: 'Yenilemeler',
            type: 'bar',
            stack: 'senaryo',
            data: spec.renew,
            barMaxWidth: 64,
            itemStyle: { color: token('--role-saha-uzmani'), borderRadius: 0 },
            markLine: {
              symbol: 'none',
              data: [{ yAxis: spec.target }],
              lineStyle: { color: accentStrong, type: 'dashed', width: 2 },
              label: { formatter: `Hedef ${lira(spec.target)}`, color: accentStrong, fontSize: FONT_SIZE, position: 'insideStartTop' },
            },
          },
        ],
      };
    case 'kaynak-ay':
      return {
        ...base(),
        grid,
        tooltip: { ...base().tooltip, trigger: 'axis' },
        xAxis: { type: 'category', data: spec.months, ...axisStyle(), splitLine: { show: false } },
        yAxis: { type: 'value', name: spec.unit, ...axisStyle(), minInterval: 1 },
        series: spec.series.map((s) => ({
          name: s.name,
          type: 'bar',
          stack: 'toplam',
          data: s.values,
          barMaxWidth: 64,
          itemStyle: { color: token(`--role-${s.role}`), borderRadius: 0 },
        })),
        legend: { ...base().legend, type: 'scroll' },
      };
    case 'satici-yapisi':
      return {
        ...base(),
        tooltip: { ...base().tooltip, trigger: 'item' },
        legend: { ...base().legend, bottom: 0, top: 'auto' },
        series: [
          {
            type: 'pie',
            radius: ['52%', '78%'],
            center: ['50%', '46%'],
            label: { show: true, formatter: '{c}', fontSize: FONT_SIZE, color: text, fontWeight: 600 },
            labelLine: { lineStyle: { color: token('--rule-strong') } },
            data: spec.items.map((item, i) => ({
              ...item,
              itemStyle: { color: i === 0 ? accent : token('--rule-strong') },
            })),
          },
        ],
      };
    case 'senaryo':
      return {
        ...base(),
        grid: { ...grid, top: 24 },
        tooltip: { ...base().tooltip, trigger: 'axis', valueFormatter: (v: number) => lira(v) },
        xAxis: { type: 'category', data: spec.items.map((i) => i.name), ...axisStyle(), splitLine: { show: false } },
        yAxis: {
          type: 'value',
          ...axisStyle(),
          axisLabel: { ...axisStyle().axisLabel, formatter: (v: number) => (v === 0 ? '0' : `${v / 1_000_000} M`) },
        },
        series: [
          {
            type: 'bar',
            data: spec.items.map((i) => i.value),
            barMaxWidth: 72,
            itemStyle: { color: accent, borderRadius: 0 },
            label: { show: true, position: 'top', formatter: (p: { value: number }) => lira(p.value), fontSize: FONT_SIZE, color: text },
            markLine: {
              symbol: 'none',
              data: [{ yAxis: spec.target }],
              lineStyle: { color: accentStrong, type: 'dashed', width: 2 },
              label: { formatter: 'Hedef', color: accentStrong, fontSize: FONT_SIZE, position: 'insideEndTop' },
            },
          },
        ],
      };
    case 'piramit':
      // Şekil için kademe sırası kullanılır; etiketler gerçek kişi sayısını gösterir (pyramidLabels).
      return {
        ...base(),
        tooltip: { ...base().tooltip, trigger: 'item' },
        legend: { show: false },
        series: [{ type: 'funnel', sort: 'ascending', left: '4%', right: '4%', top: 8, bottom: 8, minSize: '22%', maxSize: '100%', gap: 4, data: [] }],
      };
    case 'huni':
      return {
        ...base(),
        tooltip: { ...base().tooltip, trigger: 'item', formatter: (p: { name: string; value: number }) => `${p.name}: ${number.format(p.value)}` },
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
            label: {
              show: true,
              position: 'inside',
              fontSize: FONT_SIZE,
              fontWeight: 600,
              color: token(`--role-${spec.role}-fg`),
              formatter: (p: { name: string; value: number }) => `${p.name}: ${number.format(p.value)}`,
            },
            itemStyle: { color: token(`--role-${spec.role}-bg`), borderColor: token(`--role-${spec.role}`), borderWidth: 2 },
            data: spec.items,
          },
        ],
      };
    case 'takvim': {
      const day0 = new Date(`${spec.start}T00:00:00`);
      const dateLabel = (day: number) => {
        const d = new Date(day0);
        d.setDate(d.getDate() + Math.round(day));
        return new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short' }).format(d);
      };
      return {
        ...base(),
        grid: { left: 4, right: 24, top: 40, bottom: 4, containLabel: true },
        tooltip: {
          ...base().tooltip,
          trigger: 'item',
          formatter: (p: { seriesIndex: number; data: { name: string; text: string } }) =>
            p.seriesIndex === 1 ? `${p.data.name}: ${p.data.text}` : '',
        },
        xAxis: {
          type: 'value',
          min: 0,
          max: spec.end,
          ...axisStyle(),
          axisLabel: { ...axisStyle().axisLabel, formatter: (v: number) => dateLabel(v) },
        },
        yAxis: {
          type: 'category',
          inverse: true,
          data: spec.rows.map((r) => r.name),
          ...axisStyle(),
          splitLine: { show: false },
          axisLabel: { ...axisStyle().axisLabel, color: text, width: 150, overflow: 'break' },
        },
        series: [
          {
            type: 'bar',
            stack: 'takvim',
            silent: true,
            tooltip: { show: false },
            itemStyle: { color: 'transparent' },
            data: spec.rows.map((r) => r.from),
          },
          {
            type: 'bar',
            stack: 'takvim',
            barMaxWidth: 28,
            label: {
              show: true,
              position: 'insideLeft',
              fontSize: FONT_SIZE,
              fontWeight: 600,
              formatter: (p: { data: { text: string } }) => p.data.text,
            },
            data: spec.rows.map((r) => ({
              value: r.to - r.from,
              name: r.name,
              text: r.text,
              itemStyle: {
                color: token(`--role-${r.role}-bg`),
                borderColor: token(`--role-${r.role}`),
                borderWidth: 2,
                borderType: r.alt ? 'dashed' : 'solid',
                borderRadius: 0,
              },
              label: { color: token(`--role-${r.role}-fg`) },
            })),
            markLine: {
              symbol: 'none',
              silent: true,
              lineStyle: { color: token('--rule-strong'), type: 'dashed', width: 1 },
              label: { fontSize: FONT_SIZE, color: token('--text-secondary'), position: 'start' },
              data: spec.marks.map((m) => ({ xAxis: m.day, label: { formatter: m.label } })),
            },
          },
        ],
      };
    }
  }
}

function pyramidLabels(spec: ChartSpec, options: Record<string, unknown>) {
  if (spec.kind !== 'piramit') return options;
  // Her kademenin etiket metni ve rengi ayrı tanımlanır.
  const series = (options.series as Record<string, unknown>[])[0];
  series.data = spec.items.map((item, i) => ({
    name: item.name,
    value: i + 1,
    count: item.count,
    itemStyle: { color: token(`--role-${item.role}-bg`), borderColor: token(`--role-${item.role}`), borderWidth: 2 },
    label: { color: token(`--role-${item.role}-fg`), formatter: `${item.name} · ${item.count}` },
  }));
  series.label = { show: true, position: 'inside', fontSize: FONT_SIZE, fontWeight: 600 };
  (options.tooltip as Record<string, unknown>).formatter = (p: { data: { name: string; count: number } }) =>
    `${p.data.name}: ${p.data.count} kişi`;
  return options;
}

function render(el: HTMLElement, mod: EChartsModule, spec: ChartSpec) {
  el.querySelector('.chart-fallback')?.remove();
  const chart = mod.echarts.init(el, undefined, { renderer: 'svg' });
  chart.setOption(pyramidLabels(spec, build(spec)));
  charts.set(el, { chart, spec });
  new ResizeObserver(() => chart.resize()).observe(el);
}

function redrawAll() {
  for (const { chart, spec } of charts.values()) chart.setOption(pyramidLabels(spec, build(spec)), { notMerge: true });
}

async function initChart(el: HTMLElement) {
  if (charts.has(el)) return;
  const raw = el.dataset.chart;
  if (!raw) return;
  loader ??= import('../lib/echarts-setup');
  render(el, await loader, JSON.parse(raw) as ChartSpec);
}

const nodes = [...document.querySelectorAll<HTMLElement>('[data-chart]')];
if (nodes.length) {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            observer.unobserve(entry.target);
            void initChart(entry.target as HTMLElement);
          }
        }
      },
      { rootMargin: '200px' },
    );
    nodes.forEach((node) => observer.observe(node));
  } else {
    nodes.forEach((node) => void initChart(node));
  }
  new MutationObserver(redrawAll).observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-mantine-color-scheme'],
  });
  window.matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change', redrawAll);
}
