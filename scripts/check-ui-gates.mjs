#!/usr/bin/env node
/**
 * Kaynak kapısı: hareket, odak, yazı boyutu ve tablo kurallarını src/ altında denetler.
 * İhlalde sıfırdan farklı kodla çıkar. Çalışma zamanı kanıtı değildir; tarayıcı testleri
 * (tests/ui.spec.ts) hesaplanmış stilleri ayrıca doğrular.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = new URL('..', import.meta.url).pathname;
const SRC = join(ROOT, 'src');
const TOKENS = join(SRC, 'styles', 'tokens.css');
const APPROVED_EASING = /^cubic-bezier\(\s*\.65,\s*0,\s*\.35,\s*1\s*\)$/;
const MIN_FONT_PX = 14;
/** Sayfaya özgü en küçük metin ve font (kullanıcı kararı 2026-10-20: Giderler sayfası Roboto, en az 15 CSS px). */
const PAGE_RULES = { giderler: { minPx: 15, font: /^'Roboto Variable'/ } };
/** Bu sınıf önekleri yalnız ilgili sayfada kullanılır; yazı boyutu o sayfanın alt sınırına tabidir. */
const PAGE_PREFIX = { giderler: /\.opex-/ };
const pageOf = (selector) => {
  const scoped = selector.match(/\[data-page='([\w-]+)'\]/);
  if (scoped) return scoped[1];
  return Object.keys(PAGE_PREFIX).find((page) => PAGE_PREFIX[page].test(selector)) ?? null;
};
const minPxFor = (selector) => PAGE_RULES[pageOf(selector)]?.minPx ?? MIN_FONT_PX;
/** En ince yazı ağırlığı (kullanıcı kararı 2026-10-19). */
const MIN_FONT_WEIGHT = 300;
/**
 * Köşe sözleşmesi (kullanıcı kararı 2026-10-27, docs/ux.md §6.3): yüzey, kontrol ve kaplama radiusu 0 (`--radius-surface`,
 * `--radius-control`, `--radius-overlay`). Yalnız hap (kısa durum etiketi) `--radius-pill`, anahtar izi/topuzu
 * `--radius-switch`, yazısız nokta işareti (sözde öğe) `50%` kullanır. Başka seçici veya değer istisna kaydı ister
 * (AGENTS.md → köşe istisna kaydı); kayıtsız radius kapıda düşer (UX-26).
 */
const RADIUS_PROP = /^border(-(top|bottom|start|end)-(left|right|start|end))?-radius$/;
const RADIUS_ZERO_TOKENS = ['--radius-surface', '--radius-control', '--radius-overlay'];
const PILL_SELECTOR = /\.(chip|opex-state|opex-pill|yapiskan-ad|bcg-flow-chip|ortak-bolum-program)\b/;
const SWITCH_SELECTOR = /\.(theme-(track|thumb)|((opex|applet|nakit)-)?anahtar-(iz|top))\b/;
const DOT_SELECTOR = /::before$|\.(opex-dot|opex-live-dot)$/;

const errors = [];
const fail = (file, msg) => errors.push(`${relative(ROOT, file)}: ${msg}`);

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? walk(path) : [path];
  });
}

/** Çok küçük bir CSS ayrıştırıcı: kural bloklarını, bağlam (at-rule) yığınıyla döndürür. */
function parseCss(css) {
  const clean = css.replace(/\/\*[\s\S]*?\*\//g, '');
  const rules = [];
  const stack = [];
  let buffer = '';
  for (const char of clean) {
    if (char === '{') {
      stack.push(buffer.trim());
      buffer = '';
    } else if (char === '}') {
      const selector = stack.pop() ?? '';
      if (buffer.trim()) rules.push({ selector, context: [...stack], body: buffer.trim() });
      buffer = '';
    } else {
      buffer += char;
    }
  }
  return rules;
}

function declarations(body) {
  return body
    .split(';')
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const i = d.indexOf(':');
      return { prop: d.slice(0, i).trim(), value: d.slice(i + 1).trim() };
    });
}

function toPx(value) {
  const m = value.match(/^([\d.]+)(px|rem|em)$/);
  if (!m) return null;
  return m[2] === 'px' ? Number(m[1]) : Number(m[1]) * 16;
}

const files = walk(SRC);

for (const file of files.filter((f) => f.endsWith('.css'))) {
  const isTokens = file === TOKENS;
  for (const rule of parseCss(readFileSync(file, 'utf8'))) {
    const inReducedMotion = rule.context.some((c) => c.includes('prefers-reduced-motion'));
    const inForcedColors = rule.context.some((c) => c.includes('forced-colors'));
    const decls = declarations(rule.body);
    const props = new Set(decls.map((d) => d.prop));

    for (const { prop, value } of decls) {
      // Hareket
      if (/^(transition|animation)/.test(prop)) {
        if (/\ball\b/.test(value)) fail(file, `${rule.selector}: "${prop}: ${value}" — transition: all yasak`);
        const literal = value.replace(/var\([^)]*\)/g, '');
        if (/\b(linear|ease|ease-in|ease-out|ease-in-out|step-start|step-end)\b|steps\(|cubic-bezier\(/.test(literal)) {
          fail(file, `${rule.selector}: "${prop}: ${value}" — token dışı easing`);
        }
        if (/(duration|timing-function|delay)$/.test(prop) && !value.startsWith('var(--motion-')) {
          fail(file, `${rule.selector}: "${prop}: ${value}" — hareket tokenı kullanılmalı`);
        }
        if (prop === 'transition' || prop === 'animation') {
          fail(file, `${rule.selector}: "${prop}" kısaltması yerine açık property + token kullan`);
        }
        if (/:hover|\[aria-current|\[data-section/.test(rule.selector)) {
          fail(file, `${rule.selector}: geçiş yalnız etkin durumda tanımlanamaz; temel öğede tanımla`);
        }
      }
      if (prop.startsWith('--motion-duration') && !isTokens) fail(file, `${prop} yalnız tokens.css içinde tanımlanır`);
      if (prop.startsWith('--motion-duration') && isTokens && !inReducedMotion) {
        const ms = Number(value.replace('ms', ''));
        // Tek belgeli istisna: belirsiz süreli yükleme döngüsü (gidip gelen, simetrik eğri) 800–2000 ms.
        const [min, max] = prop === '--motion-duration-loop' ? [800, 2000] : [120, 320];
        if (!(ms >= min && ms <= max)) fail(file, `${prop}: ${value} — süre ${min}–${max} ms aralığında olmalı`);
      }
      // Döngü tokenı yalnız sonsuz, gidip gelen yükleme animasyonunda kullanılır (geçişte değil).
      if (/^transition/.test(prop) && /--motion-duration-loop/.test(value)) fail(file, `${rule.selector}: döngü süresi geçişte kullanılamaz`);
      if (prop === '--motion-ease-standard' && !APPROVED_EASING.test(value)) fail(file, `${prop}: ${value} — onaylı Cubic eğri değil`);

      // Odak
      if (prop === 'outline' || prop === 'outline-style' || prop === 'outline-width') {
        const allowed = value === 'none' || (inForcedColors && value === '2px solid CanvasText');
        if (!allowed) fail(file, `${rule.selector}: "${prop}: ${value}" — çevreleyen odak halkası yasak`);
      }
      if (/:focus/.test(rule.selector) && prop === 'box-shadow' && !/^inset var\(--focus-indicator-width\) 0 0 0 /.test(value)) {
        fail(file, `${rule.selector}: odakta yalnız tek kenar iç çubuk kullanılabilir`);
      }
      if (/:focus/.test(rule.selector) && /^border/.test(prop) && !/radius$/.test(prop)) fail(file, `${rule.selector}: odakta kenarlık değiştirilemez`);

      // Kavisli vurgu kenarı yasağı: renkli kenar çizgisi yalnız kenar sistemiyle (data-edge) ve düz çizilir.
      if (prop === 'box-shadow' && /inset/.test(value) && !/:focus/.test(rule.selector)) {
        fail(file, `${rule.selector}: iç gölge çubuğu yasak; kenar sistemi (data-edge) kullan`);
      }
      // Kenarlık rengi/kalınlığı yalnız nötr tokenlarla (çizgi, ince çizgi, mürekkep); kısaltma ve uzun biçimler dahil.
      if (/^border(-(top|right|bottom|left|inline|block)(-(start|end))?)?(-(color|width))?$/.test(prop)) {
        const tokens = [...value.matchAll(/var\(--([\w-]+)/g)].map((m) => m[1]);
        const colored = tokens.filter((t) => !/^(rule|rule-strong|hairline|text-primary)$/.test(t));
        if (colored.length) {
          fail(file, `${rule.selector}: "${prop}: ${value}" renkli vurgu kenarı yasak; kenar sistemi (data-edge) kullan`);
        }
      }

      // Yazı boyutu (sayfa kapsamlı kurallarda o sayfanın alt sınırı)
      const minPx = minPxFor(rule.selector);
      if (prop === 'font-size') {
        const px = toPx(value);
        if (px !== null && px < minPx) fail(file, `${rule.selector}: font-size ${value} < ${minPx}px`);
      }
      if (isTokens && /^--text-/.test(prop)) {
        const px = toPx(value);
        const clampMin = value.match(/^clamp\(([\d.]+rem)/);
        const min = px ?? (clampMin ? toPx(clampMin[1]) : null);
        if (min !== null && min < minPx) fail(file, `${rule.selector} ${prop}: ${value} < ${minPx}px`);
      }

      // Yazı ağırlığı: 300 altı (100, 200, lighter) yasak; tokenlar dahil.
      if (prop === 'font-weight' || /^--weight-/.test(prop)) {
        const weight = Number(value);
        if (value === 'lighter' || (Number.isFinite(weight) && weight < MIN_FONT_WEIGHT)) {
          fail(file, `${rule.selector}: "${prop}: ${value}" — yazı ağırlığı ${MIN_FONT_WEIGHT} altında`);
        }
      }

      // Tablo
      if ((prop === 'word-break' && value === 'break-all') || (prop === 'overflow-wrap' && value === 'anywhere')) {
        fail(file, `${rule.selector}: "${prop}: ${value}" yasak`);
      }

      // Köşe sözleşmesi (ux.md §6.3): yüzeylerde 0; hap, anahtar ve nokta işareti kayıtlı seçicilerde.
      if (RADIUS_PROP.test(prop)) {
        for (const part of value.split(/\s+/).filter(Boolean)) {
          if (part === '0' || part === 'inherit' || RADIUS_ZERO_TOKENS.some((t) => part === `var(${t})`)) continue;
          if (part === 'var(--radius-pill)' && PILL_SELECTOR.test(rule.selector)) continue;
          if (part === 'var(--radius-switch)' && SWITCH_SELECTOR.test(rule.selector)) continue;
          if (part === '50%' && DOT_SELECTOR.test(rule.selector)) continue;
          fail(file, `${rule.selector}: "${prop}: ${value}" — yüzey radiusu yasak (ux.md §6.3); hap/anahtar/nokta dışı köşe istisna kaydı ister`);
        }
      }
      if (isTokens && /^--radius-/.test(prop)) {
        if (RADIUS_ZERO_TOKENS.includes(prop)) {
          if (value !== '0') fail(file, `${prop}: ${value} — yüzey, kontrol ve kaplama radiusu 0 olmalı (ux.md §6.3)`);
        } else if (prop !== '--radius-pill' && prop !== '--radius-switch') {
          fail(file, `${prop}: tanımsız köşe tokenı; yalnız surface/control/overlay (0), pill ve switch`);
        }
      }
    }

    if (/:focus-within/.test(rule.selector)) fail(file, `${rule.selector}: :focus-within çerçevesi yasak`);
    if (decls.some((d) => d.prop === 'animation-duration' && /--motion-duration-loop/.test(d.value))) {
      const get = (p) => decls.find((d) => d.prop === p)?.value;
      if (get('animation-iteration-count') !== 'infinite' || get('animation-direction') !== 'alternate' || get('animation-timing-function') !== 'var(--motion-ease-standard)') {
        fail(file, `${rule.selector}: döngü animasyonu infinite + alternate + simetrik eğri tokenıyla tanımlanmalı`);
      }
    }
    if (props.has('transition-property') && !(props.has('transition-duration') && props.has('transition-timing-function'))) {
      fail(file, `${rule.selector}: transition-property, süre ve easing tokenıyla birlikte tanımlanmalı`);
    }
  }
}

// Sayfa kapsamı: kök tokenların sayfadaki etkin değeri (sayfa ezmesi ya da genel değer) alt sınırı aşmalı; font ilk sırada.
{
  const tokenRules = parseCss(readFileSync(TOKENS, 'utf8')).filter((r) => r.context.length === 0);
  const globalText = new Map();
  for (const r of tokenRules.filter((r) => r.selector === ':root')) {
    for (const d of declarations(r.body)) if (/^--text-/.test(d.prop)) globalText.set(d.prop, d.value);
  }
  for (const [page, rules] of Object.entries(PAGE_RULES)) {
    const scope = tokenRules.find((r) => r.selector === `:root[data-page='${page}']`);
    if (!scope) {
      fail(TOKENS, `:root[data-page='${page}'] token kapsamı yok (font ve en küçük metin)`);
      continue;
    }
    const own = new Map(declarations(scope.body).map((d) => [d.prop, d.value]));
    const font = own.get('--font-sans') ?? '';
    if (!rules.font.test(font)) fail(TOKENS, `${page}: --font-sans "${font}" sayfa fontuyla başlamalı`);
    for (const [prop, value] of new Map([...globalText, ...own])) {
      const px = toPx(value);
      const clampMin = value.match(/^clamp\(([\d.]+rem)/);
      const min = px ?? (clampMin ? toPx(clampMin[1]) : null);
      if (min !== null && min < rules.minPx) fail(TOKENS, `${page}: ${prop} etkin değeri ${value} < ${rules.minPx}px`);
    }
  }
}

// Kenar sistemi bütünlüğü: her kenar türü, çizginin değdiği iki köşeyi radiussuz yapmalıdır.
const EDGE_CORNERS = {
  start: ['border-start-start-radius', 'border-end-start-radius'],
  top: ['border-start-start-radius', 'border-start-end-radius'],
  // Araç çubuğu (senaryo anahtarı) altındaki içeriğe bağlanır: çizgi altta, alt köşeler düz (kullanıcı kararı 2026-10-27).
  bottom: ['border-end-start-radius', 'border-end-end-radius'],
};
const globalCss = join(SRC, 'styles', 'global.css');
const edgeRules = parseCss(readFileSync(globalCss, 'utf8'));
for (const [edge, corners] of Object.entries(EDGE_CORNERS)) {
  const rule = edgeRules.find((r) => r.selector === `[data-edge='${edge}']`);
  const decls = rule ? declarations(rule.body) : [];
  for (const corner of corners) {
    if (!decls.some((d) => d.prop === corner && d.value === '0')) {
      fail(globalCss, `[data-edge='${edge}'] kuralı ${corner}: 0 içermeli (çizgi düz kalmalı)`);
    }
  }
}

// gorsel_algi.md F07 (kullanıcı kararı 2026-10-28): her DataTable kapalı kaydın özet ölçütünü açıkça verir — Column.summary,
// ozetSatir (sütun ekseni) ya da kayit="matris" (kıyas profili). Özet kolon sırasından türemez (V12).
for (const file of files.filter((f) => /src[\\/]views[\\/].*\.tsx$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const m of text.matchAll(/^( *)<DataTable/gm)) {
    const kapanis = text.indexOf(`\n${m[1]}/>`, m.index);
    const eleman = text.slice(m.index, kapanis < 0 ? m.index + 6000 : kapanis);
    if (!/summary:|ozetSatir|kayit="matris"|ozetYok/.test(eleman)) {
      const satir = text.slice(0, m.index).split('\n').length;
      fail(file, `DataTable (satır ${satir}) kapalı kayıt özetini belirtmiyor: Column.summary, ozetSatir ya da kayit="matris" gerekli (gorsel_algi.md F07)`);
    }
  }
}

for (const file of files.filter((f) => /\.(tsx|ts|astro)$/.test(f))) {
  const text = readFileSync(file, 'utf8');
  for (const match of text.matchAll(/style=\{\{([^}]*)\}\}/g)) {
    if (!/^\s*minWidth: col\.minWidth\s*$/.test(match[1])) fail(file, `satır içi stil yasak: ${match[0]}`);
  }
  const code = text.replace(/\/\/.*$/gm, '');
  for (const m of code.matchAll(/data-edge=(?:"([\w-]+)"|\{([^}]*)\})/g)) {
    const values = m[1] ? [m[1]] : [...m[2].matchAll(/'([\w-]+)'/g)].map((v) => v[1]);
    for (const value of values) {
      if (!(value in EDGE_CORNERS)) fail(file, `bilinmeyen kenar türü data-edge="${value}"`);
    }
  }
  // Mantine `radius` özelliği yalnız 0 olabilir (tema ölçeği zaten tokenlara bağlı; yerel kaçış yok — ux.md §6.3).
  for (const m of code.matchAll(/\bradius=(\{[^}]*\}|"[^"]*")/g)) {
    if (m[1] !== '{0}') fail(file, `radius=${m[1]}: Mantine radius yalnız {0} olabilir (ux.md §6.3)`);
  }
  // JS/TSX ve satır içi HTML (e-posta) içinde de yazı ağırlığı 300 altına inmez.
  for (const m of code.matchAll(/font-?[wW]eight\s*:\s*['"]?(\d{3})\b/g)) {
    if (Number(m[1]) < MIN_FONT_WEIGHT) fail(file, `yazı ağırlığı ${m[1]} < ${MIN_FONT_WEIGHT}`);
  }
  // JS/TSX içinde hareket değerleri yalnız tokenlardan okunur; sabit eğri veya süre yazılamaz.
  if (/cubic-bezier\(|animate\(/.test(code)) fail(file, 'JS/TSX içinde sabit easing veya WAAPI animasyonu yasak; tokenları kullan');
  if (/transition(-duration)?\s*:\s*['"`]?\d/.test(code) || /animationDuration(Update)?\s*:\s*\d/.test(code)) {
    fail(file, 'JS/TSX içinde sabit hareket süresi yasak; --motion-duration-* tokenını oku');
  }
  for (const m of code.matchAll(/animationEasing(Update)?\s*:\s*'([^']+)'/g)) {
    if (m[2] !== 'cubicInOut') fail(file, `ECharts easing "${m[2]}" yerine simetrik cubicInOut kullan`);
  }
}

if (errors.length) {
  console.error(`UI kapısı: ${errors.length} ihlal\n` + errors.map((e) => `  - ${e}`).join('\n'));
  process.exit(1);
}
console.log(`UI kapısı: ${files.length} dosya denetlendi, ihlal yok.`);
