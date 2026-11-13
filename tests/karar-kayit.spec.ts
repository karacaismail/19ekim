import { expect, test, type Page } from './fixtures/persona';
import { AJAN_KARARLARI, SORULAR, type AnketSorusu } from '../src/data/kararAnketi';
import { buildModel } from '../src/data/model';
import { DEFAULT_PARAMS } from '../src/data/params';

/*
 * Karar sayfası: seçimlerin tarayıcıda saklanması, silme, not, bozuk kayıt, mesai hesabı, öneri düğmesi, ajan kararı,
 * ok tuşları ve başlıktaki sayılar. Beklenen değerler kaynak veriden (kararAnketi, buildModel) hesaplanır.
 */

const ANAHTAR = 'karar-secimleri-v1';
const MODEL = buildModel(DEFAULT_PARAMS);

const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
const secenek = (page: Page, q: AnketSorusu, id: string) => page.locator(`[id="ks-${q.id}-${id}"]`);
const listeOgesi = (page: Page, q: AnketSorusu) => page.getByRole('navigation', { name: 'Sorular' }).getByRole('button', { name: new RegExp(`^${kacis(q.baslik)}\\s*,`) });
const ilerleme = (page: Page) => page.locator('#secimler .ks-ilerleme-metin');
const veriOku = async (page: Page) => JSON.parse((await page.locator('#secimler').getByRole('region', { name: 'Karar verisi' }).locator('code').textContent()) ?? '{}');
const kayitOku = (page: Page) => page.evaluate((k) => localStorage.getItem(k), ANAHTAR);

/** Kaydı yalnız ilk açılışta koyar. Sayfa yenilenince kayıt yeniden yazılmaz. */
async function kayitKoy(page: Page, deger: string) {
  await page.addInitScript(
    ([k, v]) => {
      if (sessionStorage.getItem('test-tohum')) return;
      localStorage.setItem(k, v);
      sessionStorage.setItem('test-tohum', '1');
    },
    [ANAHTAR, deger],
  );
}

async function ac(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('karar/');
  await hydrated(page);
  await expect(page.locator('#secimler .ks-soru-panel')).toBeVisible();
}

const ILK = SORULAR[0];
const IKINCI = SORULAR[1];
const AJAN = AJAN_KARARLARI[0];

test.describe('karar seçimleri: kayıt', () => {
  test('seçim ve liste işareti sayfa yenilenince kalır', async ({ page }) => {
    await ac(page);
    const birinci = ILK.secenekler.find((s) => s.id !== ILK.oneri)!;
    const ikinci = IKINCI.secenekler[IKINCI.secenekler.length - 1];
    await secenek(page, ILK, birinci.id).click();
    await listeOgesi(page, IKINCI).click();
    await secenek(page, IKINCI, ikinci.id).click();
    await expect(secenek(page, IKINCI, ikinci.id)).toHaveAttribute('aria-checked', 'true');

    // Tarayıcı kaydı iki seçimi taşır.
    const kayit = JSON.parse((await kayitOku(page)) ?? '{}');
    expect(kayit[ILK.id]?.secim).toBe(birinci.id);
    expect(kayit[IKINCI.id]?.secim).toBe(ikinci.id);

    await page.reload();
    await hydrated(page);
    // Yenileyince ilk soru açılır. Seçim yerinde durur.
    await expect(secenek(page, ILK, birinci.id)).toHaveAttribute('aria-checked', 'true');
    await expect(ilerleme(page)).toContainText(`${SORULAR.length} açık sorudan 2 tanesi`);
    await expect(listeOgesi(page, IKINCI)).toHaveAttribute('data-cevap', '');
    await listeOgesi(page, IKINCI).click();
    await expect(secenek(page, IKINCI, ikinci.id)).toHaveAttribute('aria-checked', 'true');
    const veri = await veriOku(page);
    expect(veri.cevaplanan).toBe(2);
    expect(veri.sorular[0].secilen.id).toBe(birinci.id);
    expect(veri.sorular[1].secilen.id).toBe(ikinci.id);
  });

  test('“Bütün seçimleri ve notları sil” her şeyi siler ve kaydı boşaltır', async ({ page }) => {
    const ajanDiger = AJAN.secenekler.find((s) => s.id !== AJAN.uygulanan)!;
    await kayitKoy(page, JSON.stringify({ [ILK.id]: { secim: ILK.oneri, not: 'İlk not' }, [IKINCI.id]: { secim: IKINCI.secenekler[0].id }, [AJAN.id]: { secim: ajanDiger.id, not: 'Ajan notu' } }));
    await ac(page);
    await expect(ilerleme(page)).toContainText(`${SORULAR.length} açık sorudan 2 tanesi`);
    await expect(ilerleme(page)).toContainText('1 ajan kararı değişti');
    await expect(page.getByRole('textbox', { name: 'Notunuz' })).toHaveValue('İlk not');

    // Düğme onay sormadan siler (bugünkü davranış).
    await page.getByRole('button', { name: 'Bütün seçimleri ve notları sil' }).click();
    await expect(ilerleme(page)).toContainText(`${SORULAR.length} açık sorudan 0 tanesi`);
    await expect(ilerleme(page)).not.toContainText('ajan kararı değişti');
    await expect(page.locator('#secimler [role="radio"][aria-checked="true"]')).toHaveCount(0);
    await expect(page.getByRole('textbox', { name: 'Notunuz' })).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Not ekle' })).toBeVisible();
    expect(JSON.parse((await kayitOku(page)) ?? 'null')).toEqual({});
    const veri = await veriOku(page);
    expect(veri.cevaplanan).toBe(0);
    expect(veri.sorular.every((q: { secilen: unknown; not: unknown }) => q.secilen === null && q.not === null)).toBe(true);
    expect(veri.ajanKararlari.every((k: { onaylandi: boolean; not: unknown }) => k.onaylandi && k.not === null)).toBe(true);

    // Yenileyince de boş kalır.
    await page.reload();
    await hydrated(page);
    await expect(ilerleme(page)).toContainText(`${SORULAR.length} açık sorudan 0 tanesi`);
    await expect(page.locator('#secimler [role="radio"][aria-checked="true"]')).toHaveCount(0);
  });

  test('“Not ekle” ile yazılan not JSON’a girer ve yenileyince kalır', async ({ page }) => {
    await ac(page);
    await expect(page.getByRole('textbox', { name: 'Notunuz' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Not ekle' }).click();
    const alan = page.getByRole('textbox', { name: 'Notunuz' });
    await alan.fill('Tarih sonra netleşsin');
    let veri = await veriOku(page);
    expect(veri.sorular[0].not).toBe('Tarih sonra netleşsin');
    // Not tek başına soruyu cevaplanmış saymaz.
    expect(veri.sorular[0].secilen).toBeNull();
    expect(veri.cevaplanan).toBe(0);
    expect(JSON.parse((await kayitOku(page)) ?? '{}')[ILK.id]).toEqual({ not: 'Tarih sonra netleşsin' });

    // Ajan kararına da not yazılır. Not, onayı bozmaz.
    await listeOgesi(page, AJAN).click();
    await page.getByRole('button', { name: 'Not ekle' }).click();
    await page.getByRole('textbox', { name: 'Notunuz' }).fill('Kota kuralı doğru');
    veri = await veriOku(page);
    expect(veri.ajanKararlari[0].not).toBe('Kota kuralı doğru');
    expect(veri.ajanKararlari[0].onaylandi).toBe(true);

    await page.reload();
    await hydrated(page);
    await expect(page.getByRole('textbox', { name: 'Notunuz' })).toHaveValue('Tarih sonra netleşsin');
    veri = await veriOku(page);
    expect(veri.sorular[0].not).toBe('Tarih sonra netleşsin');
    expect(veri.ajanKararlari[0].not).toBe('Kota kuralı doğru');
  });
});

test.describe('karar seçimleri: bozuk kayıt sayfayı çökertmez', () => {
  for (const deger of ['null', '[]', '{"x":1}', '{bozuk', '"metin"', '5', `{"${ILK.id}":null}`]) {
    test(`kayıt ${deger} iken sayfa çalışır`, async ({ page }) => {
      const hatalar: string[] = [];
      page.on('pageerror', (e) => hatalar.push(e.message));
      await kayitKoy(page, deger);
      await page.setViewportSize({ width: 1280, height: 900 });
      await page.goto('karar/');
      await hydrated(page);
      // Kayıt hidrasyondan sonra okunur. Bekleyen çizimin bitmesi beklenir, sonra hata listesi okunur.
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
      expect(hatalar, 'sayfada yakalanmamış hata olmamalı').toEqual([]);
      const hedef = secenek(page, ILK, ILK.oneri);
      await expect(hedef).toBeVisible();
      await hedef.click();
      await expect(hedef).toHaveAttribute('aria-checked', 'true');
      expect((await veriOku(page)).cevaplanan).toBe(1);
      expect(JSON.parse((await kayitOku(page)) ?? '{}')[ILK.id]?.secim).toBe(ILK.oneri);
      expect(hatalar, 'sayfada yakalanmamış hata olmamalı').toEqual([]);
    });
  }
});

test.describe('karar seçimleri: öneri, ajan kararı ve klavye', () => {
  test('“Cevapsız sorulara öneriyi seç” yalnız boş soruları doldurur, verilen seçimi ve notu korur', async ({ page }) => {
    const farkli = ILK.secenekler.find((s) => s.id !== ILK.oneri)!;
    await kayitKoy(page, JSON.stringify({ [ILK.id]: { secim: farkli.id }, [IKINCI.id]: { not: 'Bunu sonra konuşalım' } }));
    await ac(page);
    await expect(ilerleme(page)).toContainText(`${SORULAR.length} açık sorudan 1 tanesi`);
    await page.getByRole('button', { name: 'Cevapsız sorulara öneriyi seç' }).click();
    await expect(ilerleme(page)).toContainText(`${SORULAR.length} açık sorudan ${SORULAR.length} tanesi`);
    const veri = await veriOku(page);
    expect(veri.cevaplanan).toBe(SORULAR.length);
    const beklenen = SORULAR.map((q, i) => (i === 0 ? farkli.id : q.oneri));
    expect(veri.sorular.map((q: { secilen: { id: string } }) => q.secilen.id)).toEqual(beklenen);
    expect(veri.sorular[1].not).toBe('Bunu sonra konuşalım');
    // Ajan kararları bu düğmeyle değişmez.
    expect(veri.ajanKararlari.every((k: { onaylandi: boolean }) => k.onaylandi)).toBe(true);
    for (const q of SORULAR) await expect(listeOgesi(page, q)).toHaveAttribute('data-cevap', '');
  });

  test('ajan kararı değişince sayaç ve onaylandi alanı değişir; geri alınca eski hâline döner', async ({ page }) => {
    await ac(page);
    await listeOgesi(page, AJAN).click();
    await expect(secenek(page, AJAN, AJAN.uygulanan!)).toHaveAttribute('aria-checked', 'true');
    await expect(ilerleme(page)).not.toContainText('ajan kararı değişti');
    const diger = AJAN.secenekler.find((s) => s.id !== AJAN.uygulanan)!;
    await secenek(page, AJAN, diger.id).click();
    await expect(ilerleme(page)).toContainText('1 ajan kararı değişti');
    let veri = await veriOku(page);
    expect(veri.ajanKararlari[0].onaylandi).toBe(false);
    expect(veri.ajanKararlari[0].secilen.id).toBe(diger.id);
    expect(veri.ajanKararlari[0].uygulanan.id).toBe(AJAN.uygulanan);
    expect(veri.ajanKararlari.slice(1).every((k: { onaylandi: boolean }) => k.onaylandi)).toBe(true);
    // Açık soru sayısı değişmez.
    expect(veri.cevaplanan).toBe(0);

    // İkinci ajan kararı da değişince sayaç 2 olur.
    const ajan2 = AJAN_KARARLARI[1];
    await listeOgesi(page, ajan2).click();
    await secenek(page, ajan2, ajan2.secenekler.find((s) => s.id !== ajan2.uygulanan)!.id).click();
    await expect(ilerleme(page)).toContainText('2 ajan kararı değişti');

    // Uygulanan seçeneğe dönünce karar yeniden onaylı sayılır.
    await secenek(page, ajan2, ajan2.uygulanan!).click();
    await listeOgesi(page, AJAN).click();
    await secenek(page, AJAN, AJAN.uygulanan!).click();
    await expect(ilerleme(page)).not.toContainText('ajan kararı değişti');
    veri = await veriOku(page);
    expect(veri.ajanKararlari.every((k: { onaylandi: boolean }) => k.onaylandi)).toBe(true);
  });

  test('ok tuşları radyo grubunda seçimi taşır ve başa sarar; liste işareti cevabı gösterir', async ({ page }) => {
    await ac(page);
    const ids = ILK.secenekler.map((s) => s.id);
    const n = ids.length;
    // Başta hiçbir seçenek seçili değil. Sekme sırasında yalnız ilk seçenek durur.
    await expect(listeOgesi(page, ILK)).not.toHaveAttribute('data-cevap', '');
    await expect(listeOgesi(page, ILK)).toHaveAccessibleName(/, cevaplanmadı$/);
    await expect(secenek(page, ILK, ids[0])).toHaveAttribute('tabindex', '0');
    for (const id of ids.slice(1)) await expect(secenek(page, ILK, id)).toHaveAttribute('tabindex', '-1');
    // Ajan kararları uygulanan seçenekle cevaplanmış sayılır.
    for (const q of AJAN_KARARLARI) await expect(listeOgesi(page, q)).toHaveAttribute('data-cevap', '');

    await secenek(page, ILK, ids[0]).focus();
    await page.keyboard.press('ArrowDown');
    await expect(secenek(page, ILK, ids[1 % n])).toHaveAttribute('aria-checked', 'true');
    await expect(secenek(page, ILK, ids[1 % n])).toBeFocused();
    await expect(secenek(page, ILK, ids[1 % n])).toHaveAttribute('tabindex', '0');
    await expect(secenek(page, ILK, ids[0])).toHaveAttribute('tabindex', '-1');
    await expect(listeOgesi(page, ILK)).toHaveAttribute('data-cevap', '');
    await expect(listeOgesi(page, ILK)).toHaveAccessibleName(/, cevaplandı$/);

    // Sağ ok da ileri gider. Son seçenekten sonra başa sarar.
    for (let k = 2; k <= n; k++) {
      await page.keyboard.press('ArrowRight');
      await expect(secenek(page, ILK, ids[k % n])).toHaveAttribute('aria-checked', 'true');
      await expect(secenek(page, ILK, ids[k % n])).toBeFocused();
    }
    // Yukarı ok ilk seçenekten sona geçer. Sol ok geri gider.
    await page.keyboard.press('ArrowUp');
    await expect(secenek(page, ILK, ids[n - 1])).toHaveAttribute('aria-checked', 'true');
    await page.keyboard.press('ArrowLeft');
    await expect(secenek(page, ILK, ids[n - 2])).toHaveAttribute('aria-checked', 'true');
    await expect(secenek(page, ILK, ids[n - 2])).toBeFocused();
    await expect(page.locator(`#secimler [role="radio"][aria-checked="true"]`)).toHaveCount(1);
    expect((await veriOku(page)).sorular[0].secilen.id).toBe(ids[n - 2]);
    // Başka tuş seçimi değiştirmez.
    await page.keyboard.press('Home');
    await expect(secenek(page, ILK, ids[n - 2])).toHaveAttribute('aria-checked', 'true');
  });
});

/** Yerel takvim günü (sayfa da yerel günü kullanır). */
const gunFarki = (a: string, b: string) => Math.round((Date.UTC(+a.slice(0, 4), +a.slice(5, 7) - 1, +a.slice(8, 10)) - Date.UTC(+b.slice(0, 4), +b.slice(5, 7) - 1, +b.slice(8, 10))) / 86_400_000);

test.describe('karar sayfası: tarihe bağlı sayılar', () => {
  for (const bugun of ['2026-11-20', '2026-12-05']) {
    test(`${bugun}: başlıktaki sayılar ve gecikme günü kayıtlardan hesaplanır`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(`${bugun}T10:00:00+03:00`));
      // Kural (kararlar.ts belgesi): bekleyen karar son tarih geçince gecikir; verilen karar yürürlük günü gelince yürürlüğe girer.
      const kayitlar = MODEL.kararlar.kayitlar;
      const bekleyen = kayitlar.filter((k) => k.durum === 'bekliyor');
      const gecikmis = bekleyen.filter((k) => k.sonTarih && k.sonTarih < bugun);
      const verilen = kayitlar.filter((k) => k.durum === 'verildi');
      const yururlukte = verilen.filter((k) => k.yururlukTarihi && k.yururlukTarihi <= bugun);
      expect(gecikmis.length).toBeGreaterThan(0);

      await ac(page);
      const durum = page.locator('[data-page-header] .page-meta div', { has: page.locator('dt', { hasText: 'Durum' }) }).locator('dd');
      await expect(durum).toContainText('bekliyor');
      const metin = (await durum.textContent()) ?? '';
      expect(metin.match(/\d+/g)?.map(Number)).toEqual([bekleyen.length, gecikmis.length, verilen.length, yururlukte.length]);
      expect(metin).toMatch(/gecikmiş/);
      expect(metin).toMatch(/yürürlükte/);

      // Gecikme günü: bugünden son tarihi çıkar.
      const hucreler = page.locator('#bekleyen table [data-durum="gecikti"]');
      await expect(hucreler).toHaveCount(gecikmis.length);
      const gunler = (await hucreler.allTextContents()).map((t) => Number(t.match(/(\d+) gün/)?.[1]));
      expect(gunler.sort((a, b) => a - b)).toEqual(gecikmis.map((k) => gunFarki(bugun, k.sonTarih!)).sort((a, b) => a - b));
      await expect(page.locator('#bekleyen table [data-durum="bekliyor"]')).toHaveCount(bekleyen.length - gecikmis.length);
    });
  }
});

test.describe('karar sayfası: mesai hesabı', () => {
  test('tavanın dolduğu hafta, tarihi, aylık fazla mesai ve ücretler modelden gelir', async ({ page }) => {
    const p1 = MODEL.workPeriods[0];
    const tavan = MODEL.OVERTIME_CAP;
    // Dönem 1 düzeni sürseydi: her hafta aynı fazla saat eklenir. Toplam tavana ulaştığı hafta aranır.
    let hafta = 0;
    for (let toplam = 0; toplam < tavan; ) {
      hafta += 1;
      toplam += p1.overtimePerWeek;
    }
    const [y, a, g] = MODEL.dates.firstDay.split('-').map(Number);
    const haftaBasi = new Date(Date.UTC(y, a - 1, g + (hafta - 1) * 7));
    const tarih = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long', timeZone: 'UTC' }).format(haftaBasi);
    // Yılda 52 hafta, 12 ay vardır.
    const aylikSaat = Math.round((p1.overtimePerWeek * 52) / 12);
    // Saat ücreti: maaş 225 saate bölünür. Fazla çalışmada %50 eklenir.
    const saatUcreti = DEFAULT_PARAMS.sahaSalary / 225;
    const fazlaSaatUcreti = saatUcreti * 1.5;
    const tl = (v: number) => new RegExp(`${kacis(new Intl.NumberFormat('tr-TR').format(Math.round(v)))}\\s₺`);

    await ac(page);
    const mesai = page.locator('#mesai');
    const not = mesai.locator('figure', { has: page.locator('#fazla-calisma-grafik') }).locator('.chart-note');
    await expect(not).toContainText(`${hafta}. haftada`);
    await expect(not).toContainText(tarih);
    await expect(mesai.locator('figure', { has: page.locator('#fazla-calisma-grafik') }).locator('[role="img"]')).toHaveAttribute('aria-label', new RegExp(`tavan ${tavan} saattir.*${hafta}\\. haftada`));

    const ucret = mesai.getByRole('complementary', { name: 'Fazla çalışma ücreti' });
    await expect(ucret).toContainText(tl(saatUcreti));
    await expect(ucret).toContainText(tl(fazlaSaatUcreti));
    await expect(ucret).toContainText(tl(DEFAULT_PARAMS.sahaSalary));
    await expect(ucret).toContainText(new RegExp(`\\b${aylikSaat} saat`));
    await expect(ucret).toContainText(tl(aylikSaat * fazlaSaatUcreti));
  });
});
