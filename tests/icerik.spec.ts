import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { GRUP_ADI, ICERIK, YAYIMLANAN, altBilgiKapsami, icerikOf, kirinti } from '../src/data/icerik';
import { BASE_ROLES as ROLES } from '../src/data/roles';
import { APPLET_NAV, COMMON_NAV, FINANCE_NAV, HIRING_NAV, MARKETING_NAV, SEQUENCE, TREE_NAV } from '../src/data/tree';

/**
 * İçerik envanteri sözleşmesi (docs/contents.md §4, §6, §13.2 IA-01, IA-02, IA-04, IA-10; kullanıcı kararı 28 Ekim):
 * her yayımlanan sayfanın tek ana kaydı vardır; kayıtlar kaynağa ve birbirine bağlıdır; planlanan sayfa boş kabuk olarak
 * açılmaz; Applet İstihdam'da, BCG yalnız doğrudan erişimde. Veri testi: yalnız Chromium (playwright.config testIgnore).
 */

const PAGES_DIR = join(process.cwd(), 'src', 'pages');
const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** `src/pages` altındaki gerçek yollar (rol şablonu yedi role açılır; 404 `/404/`). */
function sayfaYollari(): string[] {
  const sabit = readdirSync(PAGES_DIR)
    .filter((f) => f.endsWith('.astro'))
    .map((f) => f.replace(/\.astro$/, ''))
    .map((n) => (n === 'index' ? '/' : `/${n}/`));
  const roller = ROLES.map((r) => `/roller/${r.slug}/`);
  return [...sabit, ...roller].sort();
}

test.describe('içerik envanteri', () => {
  test('IA-01: her yayımlanan sayfanın bir kaydı var; her kaydın sayfası var; soru, kapsam, sahip ve tarih dolu', () => {
    const yollar = sayfaYollari();
    const kayitli = YAYIMLANAN.map((k) => k.path).sort();
    expect(kayitli).toEqual(yollar);
    expect(YAYIMLANAN).toHaveLength(26); // 404 dahil 25 sayfa (contents.md §1, 61fd2ff) + Affilate
    for (const k of ICERIK) {
      expect(k.kullaniciSorusu.length, k.id).toBeGreaterThan(10);
      expect(k.kullaniciSorusu.trim().endsWith('?'), k.id).toBe(true);
      expect(k.kapsam.length, k.id).toBeGreaterThan(20);
      expect(k.sahip.length, k.id).toBeGreaterThan(0);
      expect(k.kaynak.length, k.id).toBeGreaterThan(0);
      expect(k.asOf, k.id).toMatch(ISO);
      expect(k.sinif.length, k.id).toBeGreaterThan(0);
      expect(k.marka.length, k.id).toBeGreaterThan(0);
      // Hayali kişi yok: sahip ya belirlenmedi ya da kaynaktaki karar veren / kullanıcı.
      expect(['belirlenmedi', 'İsmail Karaca (karar veren)', 'Kullanıcı (kişisel)'], k.id).toContain(k.sahip);
    }
  });

  test('IA-02: kimlik ve yol tekil; ilişkiler ve ebeveynler kayıtlı kimliklere çözülür', () => {
    const idler = ICERIK.map((k) => k.id);
    expect(new Set(idler).size).toBe(idler.length);
    const yollar = ICERIK.map((k) => k.path);
    expect(new Set(yollar).size).toBe(yollar.length);
    for (const k of ICERIK) {
      for (const i of k.iliskili) expect(idler, `${k.id} → ${i}`).toContain(i);
      if (k.ebeveyn) expect(idler, `${k.id} ebeveyni`).toContain(k.ebeveyn);
      expect(k.iliskili, `${k.id} kendine bağlı`).not.toContain(k.id);
    }
    for (const r of ROLES) expect(icerikOf(`/roller/${r.slug}/`)?.ebeveyn).toBe('organizasyon');
  });

  test('IA-04: planlanan sayfaların dosyası yok (boş kabuk yok); yayımlanan sayfalar sunum sırası ve menülerle tutarlı', () => {
    for (const k of ICERIK.filter((x) => x.planlandi)) {
      expect(k.durum, k.id).toBe('taslak');
      expect(existsSync(join(PAGES_DIR, `${k.path.replace(/\//g, '')}.astro`)), `${k.id} dosyası`).toBe(false);
    }
    // Sunum sırasındaki her durak kayıtlıdır ve başlığı (tam ad ya da kısa ad) kayıtla aynıdır.
    for (const s of SEQUENCE) {
      const k = icerikOf(s.path);
      expect(k, s.path).toBeTruthy();
      expect([s.tam ?? s.label, s.label, s.crumb[s.crumb.length - 1]], s.path).toContain(k!.baslik); // F19 sözlüğü: h1 ∈ {kısa ad, tam ad, kırıntı sonu}
    }
    // Menü öğeleri kayıtlı ve menü etiketi kayıtla aynı (menü yeniden gruplanınca bu etiketler kaynaktır).
    for (const m of [...TREE_NAV, HIRING_NAV, APPLET_NAV, ...MARKETING_NAV, ...FINANCE_NAV, ...COMMON_NAV]) expect(icerikOf(m.path), m.path).toBeTruthy();
  });

  test('IA-10: Applet İstihdam grubunda; BCG, arşiv ve e-posta yalnız doğrudan erişimde (menüsüz); kişisel sayfalar kişisel sınıfta', () => {
    expect(icerikOf('/applet/')?.grup).toBe('istihdam');
    expect(icerikOf('/applet/')?.menu).toBe('Applet');
    for (const p of ['/bcg/', '/arsiv/', '/email/']) {
      expect(icerikOf(p)?.grup, p).toBe('dogrudan');
      expect(icerikOf(p)?.menu, p).toBeUndefined();
      expect([...TREE_NAV, HIRING_NAV, APPLET_NAV, ...MARKETING_NAV, ...FINANCE_NAV, ...COMMON_NAV].some((m) => m.path === p), p).toBe(false);
      expect(SEQUENCE.some((s) => s.path === p), p).toBe(false);
    }
    expect(icerikOf('/email/')?.sinif).toContain('kisisel');
    expect(icerikOf('/notlar/')?.sinif).toContain('kisisel');
  });

  test('F10: kapsam cümlesi öneri, eğitim, örnek ve taslak içeriği kesinleşmiş karar gibi sunmaz; finans sayfaları koşullu tahmin der', () => {
    for (const id of ['partnership', 'bcg', 'applet', 'affilate', 'notlar', 'email']) {
      const k = ICERIK.find((x) => x.id === id)!;
      expect(k.kapsam, id).not.toMatch(/kesinleşen|kesinleşmiş sonuç/i);
      expect(['varsayilmis', 'ornek', 'bilinmiyor'], id).toContain(k.kanit);
    }
    for (const id of ['gelir-plani', 'nakit-akisi', 'buyume-modeli']) expect(ICERIK.find((x) => x.id === id)!.kapsam, id).toMatch(/koşullu tahmin/);
    expect(altBilgiKapsami('/19ekim/partnership/')).toMatch(/öneri/);
    expect(altBilgiKapsami('/bilinmeyen/')).toMatch(/kesinleşmiş sonuç değildir/);
  });

  test('F15: kırıntı ana ebeveynden türer, sunum sırasından bağımsız', () => {
    expect(kirinti('/roller/asistan/')).toEqual(['İstihdam', 'Organizasyon şeması', 'Yönetici asistanı']);
    expect(kirinti('/gelir-plani/')).toEqual(['Finans', 'Gelir planı']);
    expect(kirinti('/affilate/')).toEqual(['Pazarlama', 'Affilate']);
    expect(kirinti('/bcg/')).toEqual(['BCG matrisi eğitimi']);
    expect(Object.keys(GRUP_ADI)).toEqual(['pazarlama', 'istihdam', 'finans', 'yonetim', 'yardimci', 'dogrudan', 'sistem']);
  });
});

test.describe('içerik envanteri — sayfada', () => {
  test('F10 / IA-18: alt bilgi kaydın kapsam cümlesini söyler; öneri, eğitim, örnek ve taslak “kesinleşen” demez', async ({ page }) => {
    for (const id of ['partnership', 'bcg', 'applet', 'affilate', 'notlar', 'eylem-plani', 'giderler']) {
      const k = ICERIK.find((x) => x.id === id)!;
      await page.goto(k.path.slice(1));
      await page.waitForSelector('.app-footer', { state: 'attached' });
      await page.waitForSelector('html[data-hydrated]', { state: 'attached' });
      const alt = await page.locator('.app-footer').innerText();
      expect(alt, id).toContain(k.kapsam.slice(0, 40));
      if (['partnership', 'bcg', 'applet', 'affilate', 'notlar'].includes(id)) expect(alt, id).not.toMatch(/kesinleşen/i);
    }
  });
});
