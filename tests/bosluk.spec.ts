import { expect, test } from './fixtures/persona';
import { buildModel, reply } from './opex-fixture';
import { sayfayiGez, TUM_SAYFALAR } from './sayfa-gezgini';

/**
 * İç boşluk (clear space) kuralı (kullanıcı kararı 13 Kasım 2026): zemini, gölgesi ya da kenarlığı olan her öğede yazı
 * ve simge kenara yapışmaz. Örnek hata: gri zeminli açılır düğmede yazı sol kenara değiyordu.
 *
 * Ölçüm: öğenin iç kenarı ile içindeki yazı ve simge kutuları arasındaki en kısa uzaklık.
 * - Zemini ya da gölgesi olan öğede dört kenar denetlenir. Yalnız kenarlığı olan öğede yalnız çizgili kenar denetlenir.
 * - Üzerine gelince, açılınca ya da seçilince zemin alan öğe de zeminli sayılır. Bu kurallar stil dosyalarından okunur.
 * - Kendi renginde geniş gölgeyle sayfa kenarına uzanan bant (tam genişlik hilesi) zeminli sayılmaz.
 * - Küçük öğe yatayda en az 8 px, dikeyde en az 3 px boşluk ister. Küçük öğe en çok 48 px yüksekliktedir. Örneğin
 *   düğme, rozet, tek satırlık satır ve her tablo hücresi küçüktür. Token 4 px verir, ölçüm 1 px yuvarlama payı bırakır.
 * - Büyük öğe (kart, panel, not) yatayda en az 12 px, dikeyde en az 8 px boşluk ister.
 * - Satır içi öğe (vurgu, kod) yatayda en az 2 px boşluk ister.
 * - Kendi içinde kayan öğe (tablo kaydırma alanı) ölçülmez, çünkü içerik kenardan taşabilir.
 *
 * - Ekran okuyucudan gizlenen (`aria-hidden`) ama görünen öğe de ölçülür. Örneğin sıra numarası kutusu görünür.
 * - Form alanında (giriş kutusu, seçim kutusu) iç boşluk değeri okunur: yatayda en az 8 px.
 *
 * Test her sayfayı dört genişlikte gezer: 1280, 768, 375 ve 320 px. Kapalı paneller, sekmeler, açılır pencereler, seçim
 * listeleri, üst menüler ve menü çekmecesi açılır (`sayfa-gezgini.ts`). Süslemeler (`::before`, `::after`) ölçülmez.
 */

const ENDPOINT = 'https://script.google.com/macros/s/AKfycbTestDeploymentId_1234567890abcdef/exec';
const KEY = 'opex_test_anahtari_123';
const MODEL = buildModel();

function boslukOlc() {
  type Renk = { r: number; g: number; b: number; a: number };
  const rgba = (c: string): Renk | null => {
    const m = c.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(/[\s,/]+/).filter(Boolean).map(Number);
    return { r: p[0], g: p[1], b: p[2], a: p.length > 3 ? p[3] : 1 };
  };
  const farkli = (a: Renk, b: Renk) => Math.abs(a.r - b.r) + Math.abs(a.g - b.g) + Math.abs(a.b - b.b) > 6;
  const arkaZemin = (el: Element): Renk => {
    for (let e = el.parentElement; e; e = e.parentElement) {
      const c = rgba(getComputedStyle(e).backgroundColor);
      if (c && c.a > 0.05) return c;
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  };
  const gorunur = (el: Element) => {
    const c = getComputedStyle(el);
    return el.getClientRects().length > 0 && c.visibility !== 'hidden' && c.opacity !== '0';
  };
  /** Yazı ile ölçülen öğe arasında kendi içinde kayan bir kutu var mı? */
  const kayanKutuIcinde = (ic: Element, dis: Element) => {
    for (let e: Element | null = ic; e && e !== dis; e = e.parentElement) {
      const c = getComputedStyle(e);
      if (/(auto|scroll)/.test(c.overflowX + c.overflowY) && (e.scrollWidth > e.clientWidth + 1 || e.scrollHeight > e.clientHeight + 1)) return true;
    }
    return false;
  };
  /**
   * Yazı ile ölçülen öğe arasında açılır bir katman var mı? Katman mutlak konumludur ve kendi zemini vardır (ör. yapışık
   * şeridin altında açılan liste). Katmandaki yazı katmana aittir. Katman kendi kutusu olarak ayrıca ölçülür.
   */
  const katmanIcinde = (ic: Element, dis: Element) => {
    const d = dis.getBoundingClientRect();
    for (let e: Element | null = ic; e && e !== dis; e = e.parentElement) {
      const c = getComputedStyle(e);
      if (!((c.position === 'absolute' || c.position === 'fixed') && (rgba(c.backgroundColor)?.a ?? 0) > 0.05)) continue;
      // Yalnız ölçülen öğenin dışına taşan katman sayılır. Kutunun içindeki rozet (ör. köşedeki numara) ölçüme katılır.
      const k = e.getBoundingClientRect();
      if (k.top < d.top - 0.5 || k.bottom > d.bottom + 0.5 || k.left < d.left - 0.5 || k.right > d.right + 0.5) return true;
    }
    return false;
  };
  /** Yazı ile ölçülen öğe arasındaki atalardan taşmayı gizleyenlerin kesişim alanı. Yoksa null. */
  const kirpmaAlani = (ic: Element, dis: Element) => {
    let alan: { left: number; right: number; top: number; bottom: number } | null = null;
    for (let e: Element | null = ic; e && e !== dis; e = e.parentElement) {
      const c = getComputedStyle(e);
      if (c.overflowX === 'visible' && c.overflowY === 'visible' && c.contentVisibility !== 'hidden') continue;
      const r = e.getBoundingClientRect();
      alan = alan
        ? { left: Math.max(alan.left, r.left), right: Math.min(alan.right, r.right), top: Math.max(alan.top, r.top), bottom: Math.min(alan.bottom, r.bottom) }
        : { left: r.left, right: r.right, top: r.top, bottom: r.bottom };
    }
    return alan;
  };
  // Durum zeminleri: üzerine gelme, basma, açık ya da seçili durumda zemin veren kurallar. Bu öğeler zemin alınca da
  // yazı kenara yapışmamalı. Örnek: açılır düğme fareyle üzerine gelince gri olur.
  const durumSecicileri: string[] = [];
  const DURUM_ATTR = 'aria-expanded|aria-selected|aria-current|aria-checked|aria-pressed|data-active|data-expanded|data-selected|data-checked|open';
  const DURUM = new RegExp(`:(hover|active|focus-visible|focus-within|focus|checked|target)\\b|\\[(${DURUM_ATTR})\\b`);
  const kurallar = (liste: CSSRuleList) => {
    for (const k of liste) {
      if (k instanceof CSSStyleRule) {
        const zemin = k.style.backgroundColor || k.style.background;
        if (!zemin || /^(transparent|none|inherit|initial|unset|currentcolor)$/i.test(zemin.trim()) || /rgba\([^)]*,\s*0\)/.test(zemin)) continue;
        for (const parca of k.selectorText.split(',')) {
          if (!DURUM.test(parca) || parca.includes('::')) continue;
          // Klavye odak kuralının ön eki (`html[data-focus-mode='keyboard']`) testte yoktur. Ön ek atılır.
          const taban = parca
            .replace(/html\[data-focus-mode[^\]]*\]\s*/g, '')
            .replace(/:(hover|active|focus-visible|focus-within|focus|checked|target)\b/g, '')
            .replace(new RegExp(`\\[(${DURUM_ATTR})\\b[^\\]]*\\]`, 'g'), '')
            .trim();
          if (taban) durumSecicileri.push(taban);
        }
      } else if ('cssRules' in k) {
        try {
          kurallar((k as CSSGroupingRule).cssRules);
        } catch {
          /* erişilemeyen kural */
        }
      }
    }
  };
  for (const ss of document.styleSheets) {
    try {
      kurallar(ss.cssRules);
    } catch {
      /* başka kaynaktan stil */
    }
  }
  const durumZemini = (el: Element) =>
    durumSecicileri.some((sec) => {
      try {
        return el.matches(sec);
      } catch {
        return false;
      }
    });
  /** Tam genişlik bant hilesi: zemin, kendi renginde geniş bir gölgeyle sayfa kenarına uzar. Görsel kenar yoktur. */
  const tamGenislik = (cs: CSSStyleDeclaration) => {
    const m = cs.boxShadow.match(/(rgba?\([^)]*\))\s+0px\s+0px\s+0px\s+(\d+)px/);
    return !!m && Number(m[2]) >= 100 && m[1].replace(/\s/g, '') === cs.backgroundColor.replace(/\s/g, '');
  };
  const sonuc: string[] = [];
  // Form alanında yazı alanın içindedir, ölçülemez. Bunun yerine iç boşluk değeri okunur: yatayda en az 8 px.
  for (const el of document.querySelectorAll<HTMLElement>('input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="hidden"]), textarea, select')) {
    if (!gorunur(el) || el.closest('.visually-hidden')) continue;
    const cs = getComputedStyle(el);
    if (cs.opacity === '0' || el.getBoundingClientRect().width < 2) continue;
    const sol = parseFloat(cs.paddingLeft) + parseFloat(cs.borderLeftWidth);
    const sag = parseFloat(cs.paddingRight) + parseFloat(cs.borderRightWidth);
    if (sol < 7.5 || sag < 7.5) sonuc.push(`${el.tagName.toLowerCase()}[${el.getAttribute('aria-label') ?? el.getAttribute('name') ?? el.id}] iç boşluk sol ${sol}, sağ ${sag} (en az 8)`);
  }
  const range = document.createRange();
  for (const el of document.querySelectorAll<HTMLElement>('body *')) {
    if (el.closest('svg, .visually-hidden, input, textarea, select')) continue;
    if (/^(SCRIPT|STYLE|TEMPLATE|NOSCRIPT|BR|HR|IMG|CANVAS|IFRAME|OPTION)$/.test(el.tagName)) continue;
    if (!gorunur(el)) continue;
    const cs = getComputedStyle(el);
    const bg = rgba(cs.backgroundColor);
    if (tamGenislik(cs)) continue;
    const zeminVar = (!!bg && bg.a > 0.05 && farkli(bg, arkaZemin(el))) || durumZemini(el);
    const golgeVar = cs.boxShadow !== 'none' && !/inset/.test(cs.boxShadow);
    const kenar = (k: 'Top' | 'Right' | 'Bottom' | 'Left') =>
      parseFloat(cs.getPropertyValue(`border-${k.toLowerCase()}-width`)) > 0 && cs.getPropertyValue(`border-${k.toLowerCase()}-style`) !== 'none' && (rgba(cs.getPropertyValue(`border-${k.toLowerCase()}-color`))?.a ?? 0) > 0.05;
    const yuzey = zeminVar || golgeVar;
    const kenarlar = { Top: kenar('Top'), Right: kenar('Right'), Bottom: kenar('Bottom'), Left: kenar('Left') };
    if (!yuzey && !Object.values(kenarlar).some(Boolean)) continue;
    // Kendi içinde kayan alan ölçülmez.
    if (/(auto|scroll)/.test(cs.overflowX + cs.overflowY) && (el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1)) continue;
    const kutular: DOMRect[] = [];
    const yuruyen = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    for (let n = yuruyen.nextNode(); n; n = yuruyen.nextNode()) {
      if (!n.nodeValue?.trim()) continue;
      const ebeveyn = n.parentElement;
      if (!ebeveyn || !gorunur(ebeveyn) || ebeveyn.closest('.visually-hidden')) continue;
      // Süs işareti (ör. alıntıdaki büyük tırnak) ekran okuyucudan gizli ve mutlak konumludur. Yazı sayılmaz.
      const sus = ebeveyn.closest('[aria-hidden="true"]');
      if (sus && el.contains(sus) && getComputedStyle(sus).position === 'absolute') continue;
      // Kendi içinde kayan kutudaki yazı o kutuya aittir. Kayan kutu kenara kadar içerik gösterebilir (tablo kaydırma).
      if (kayanKutuIcinde(ebeveyn, el) || katmanIcinde(ebeveyn, el)) continue;
      // Kapalı `details` içindeki yazı (özet satırı dışında) görünmez.
      const ayrinti = ebeveyn.closest('details');
      if (ayrinti && !ayrinti.open && !ebeveyn.closest('summary')) continue;
      range.selectNodeContents(n);
      const kirpma = kirpmaAlani(ebeveyn, el);
      for (const r of range.getClientRects()) {
        if (r.width <= 0.5 || r.height <= 0.5) continue;
        // Kapalı panelde ya da kayan kutuda kırpılan yazı görünmez. Görünmeyen yazı ölçülmez.
        if (kirpma && (r.right <= kirpma.left + 0.5 || r.left >= kirpma.right - 0.5 || r.bottom <= kirpma.top + 0.5 || r.top >= kirpma.bottom - 0.5)) continue;
        kutular.push(r);
      }
    }
    // Simgeler de içeriktir. Grafik çizimi (büyük SVG) ölçülmez, iç düzeni grafik kütüphanesi kurar.
    // Simge de yazı gibi süzülür: kayan kutudaki ve kırpılan simge ölçülmez (ör. kayan listedeki onay işaretleri).
    for (const s of el.querySelectorAll('svg')) {
      if (s.parentElement?.closest('svg') || !s.parentElement || kayanKutuIcinde(s.parentElement, el) || katmanIcinde(s.parentElement, el)) continue;
      const r = s.getBoundingClientRect();
      const kirpma = kirpmaAlani(s.parentElement, el);
      if (kirpma && (r.right <= kirpma.left + 0.5 || r.left >= kirpma.right - 0.5 || r.bottom <= kirpma.top + 0.5 || r.top >= kirpma.bottom - 0.5)) continue;
      if (r.width > 0.5 && r.height > 0.5 && r.width <= 40 && r.height <= 40 && gorunur(s)) kutular.push(r);
    }
    if (!kutular.length) continue;
    const b = el.getBoundingClientRect();
    const ic = {
      l: b.left + parseFloat(cs.borderLeftWidth),
      r: b.right - parseFloat(cs.borderRightWidth),
      t: b.top + parseFloat(cs.borderTopWidth),
      b: b.bottom - parseFloat(cs.borderBottomWidth),
    };
    const uzaklik = {
      Left: Math.min(...kutular.map((r) => r.left)) - ic.l,
      Right: ic.r - Math.max(...kutular.map((r) => r.right)),
      Top: Math.min(...kutular.map((r) => r.top)) - ic.t,
      Bottom: ic.b - Math.max(...kutular.map((r) => r.bottom)),
    };
    const satirIci = cs.display === 'inline';
    // Tablo hücresi satır sarsa da küçük öğe sayılır: hücrede 8 px yatay boşluk yeterlidir.
    const kucuk = b.height <= 48 || el.tagName === 'TD' || el.tagName === 'TH';
    const yatay = satirIci ? 2 : kucuk ? 8 : 12;
    const dikey = satirIci ? -99 : kucuk ? 3 : 8;
    const hatalar: string[] = [];
    for (const k of ['Left', 'Right', 'Top', 'Bottom'] as const) {
      if (!yuzey && !kenarlar[k]) continue;
      if (k === 'Top' && el.tagName === 'FIELDSET') continue;
      const sinir = k === 'Left' || k === 'Right' ? yatay : dikey;
      if (uzaklik[k] < sinir - 0.5) hatalar.push(`${k} ${Math.round(uzaklik[k])}<${sinir}`);
    }
    if (!hatalar.length) continue;
    const ad = `${el.tagName.toLowerCase()}${el.className && typeof el.className === 'string' ? `.${el.className.trim().split(/\s+/).slice(0, 2).join('.')}` : ''}`;
    const metin = (el.innerText || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 50);
    sonuc.push(`${ad} “${metin}” ${hatalar.join(', ')}`);
  }
  return sonuc;
}

test.describe('iç boşluk: sitenin bütün sayfaları', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'ölçüm düzen kurallarını denetler, yalnız Chromium’da çalışır');

  test.beforeEach(async ({ page }) => {
    // Hareket azaltılır: panel açılma geçişi ölçümü bozmasın (hareket sözleşmesi reduced-motion istisnasını tanır).
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.addInitScript(([endpoint, key]) => localStorage.setItem('istoc-opex-baglanti', JSON.stringify({ endpoint, key })), [ENDPOINT, KEY]);
    // Giderler isteği örnek modelle karşılanır. Ortak kayıt (persona) isteği test kaydına bırakılır (fixtures/persona).
    await page.route('https://script.google.com/**', (route) =>
      (route.request().postData() ?? '').includes('"service":"persona"')
        ? route.fallback()
        : route.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify(reply(MODEL, 'ozet-1')) }).catch(() => undefined),
    );
  });

  for (const yol of TUM_SAYFALAR) {
    test(`${yol}: zeminli ve kenarlıklı öğelerde yazı kenara yapışmaz`, async ({ page }) => {
      test.setTimeout(300_000);
      const bulgular = new Set<string>();
      await sayfayiGez(
        page,
        yol,
        async () => {
          const genislik = page.viewportSize()?.width ?? 0;
          for (const b of await page.evaluate(boslukOlc)) bulgular.add(`${genislik} px: ${b}`);
        },
        [1280, 768, 375, 320],
      );
      expect([...bulgular], [...bulgular].join('\n')).toEqual([]);
    });
  }
});
