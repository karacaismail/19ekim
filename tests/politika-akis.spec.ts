import { expect, test } from './fixtures/persona';

test('rehber yalnız mevcut işi açar ve koşul yanıtıyla ilerler', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  // 17 Kasım 2026: “Öncü ortak” rolü kalktı. Aynı akışı çözüm ortağı rehberi denetler.
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const etkin = page.locator('[data-akis-etkin]');
  await expect(etkin).toHaveCount(1);
  // 16 Kasım 2026: yazılı anlaşma adımı çıktı. Rehber işletme kaydıyla başlar.
  await expect(etkin).toContainText('İşletmenin kaydı ne oldu?');
  await expect(page.locator('.pol-belge')).toHaveCount(0);
  await etkin.getByRole('button', { name: 'Kayıt için henüz yanıt gelmedi', exact: true }).click();
  await expect(page.locator('[data-akis-sonuc="bekle"]')).toBeVisible();
  await expect(etkin).toContainText('İşletmenin kaydı ne oldu?');
  await etkin.getByRole('button', { name: 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', exact: true }).click();
  await expect(etkin).toContainText('İşletme ne dedi?');
  await expect(etkin.getByRole('heading').first()).toBeFocused();
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  await page.getByRole('button', { name: 'İşletmeyi kaydettirin yanıtını değiştir', exact: true }).click();
  await expect(etkin).toContainText('İşletmenin kaydı ne oldu?');
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(0);
});

test('on farklı rehber aynı sayfa içindeki seçimle açılır', async ({ page }) => {
  await page.goto('politikalar/');
  for (const proje of ['iStoc', 'Segika']) {
    await page.getByRole('tab', { name: proje, exact: true }).click();
    for (const rol of ['Kadrolu uzman', 'Çözüm ortağı', 'Mevcut müşteri', 'Marka elçisi']) {
      await page.getByRole('tab', { name: rol, exact: true }).click();
      await expect(page.locator('[data-akis-etkin]')).toHaveCount(1);
      await expect(page.locator('[data-akis-etkin] button')).not.toHaveCount(0);
    }
  }
});

test('varsayılandan farklı ortak ayarla ilerleme yenilemede korunur', async ({ page, personaServer }) => {
  personaServer.seed('istoc', { kur: 60 });
  const { alanTanimlari } = await import('../src/data/personaFields');
  const fields = Object.fromEntries(alanTanimlari('istoc').map((d) => [d.field, d.value]));
  fields.kur = 60;
  await page.addInitScript((fields) => {
    localStorage.setItem('turksab-persona-ortak-v1-istoc', JSON.stringify({ snapshot: { revision: 'test-revision', fields, updatedAt: '' }, draft: {}, before: {}, flight: null }));
  }, fields);
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const etkin = page.locator('[data-akis-etkin]');
  await etkin.getByRole('button', { name: 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', exact: true }).click();
  await expect(etkin).toContainText('İşletme ne dedi?');
  await page.reload();
  await expect(etkin).toContainText('İşletme ne dedi?');
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
});

test('ayrıntı kaynağı gelmezse etkin iş ve yanıtlar korunur', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/PolitikaAkisAyrinti\.[\w-]+\.js$/, (route) => route.abort());
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const etkin = page.locator('[data-akis-etkin]');
  await etkin.getByRole('button', { name: 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', exact: true }).click();
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('İş adımlarınız korunuyor.');
  await expect(etkin).toContainText('İşletme ne dedi?');
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  expect(errors).toEqual([]);
  await page.unroute(/PolitikaAkisAyrinti\.[\w-]+\.js$/);
  await page.getByRole('button', { name: 'Ayrıntıları yeniden yükle', exact: true }).click();
  await expect(page.locator('.pol-belge')).toBeVisible();
  await expect(etkin).toContainText('İşletme ne dedi?');
});

test('adım ayrıntısı iki yönde pozitif süre ve hareket azaltma tercihi kullanır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const button = page.getByRole('button', { name: 'Görevi ve çalışma koşullarını görün', exact: true });
  const item = button.locator('..');
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'true');
  const transition = item.locator('.mantine-Accordion-panel');
  await expect.poll(() => transition.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))).toBeGreaterThan(0);
  await button.click();
  await expect(button).toHaveAttribute('aria-expanded', 'false');
  await expect.poll(() => transition.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))).toBeGreaterThan(0);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await button.click();
  await expect.poll(() => transition.evaluate((el) => parseFloat(getComputedStyle(el).transitionDuration))).toBe(0);
});

test('zaman çizelgesi sıradaki olası adımları gösterir ve yanıtla günceller', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const sonraki = page.locator('[data-akis-sonraki]');
  await expect(sonraki).toContainText('Sonraki olası adımlar');
  await expect(sonraki.locator('li').first()).toHaveText('Ticari ihtiyacı konuşun');
  await expect(sonraki).toContainText('Yanıtınız bu sırayı değiştirebilir.');
  await page.locator('[data-akis-etkin]').getByRole('button', { name: 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', exact: true }).click();
  await expect(sonraki).not.toContainText('Ticari ihtiyacı konuşun');
  await expect(sonraki.locator('li').first()).toHaveText('Ürün gösterimini yapın');
  await page.locator('[data-akis-etkin]').getByRole('button', { name: 'İşletme ürün satmak ve alıcı bulmak istedi', exact: true }).click();
  // Bekleme yanıtı seçilince ileriki adımlar gösterilmez. Okur önce koşulun değişmesini bekler.
  await page.locator('[data-akis-etkin]').getByRole('button', { name: 'İşletme ürün bilgisinin hazır olmadığını söyledi', exact: true }).click();
  await expect(sonraki).toHaveCount(0);
});

test('on rehberin sonraki adım zinciri döngüsüz ve sonludur', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');
  const { olasiSonrakiler } = await import('../src/data/politikaAkislari/motor');
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  for (const proje of ['istoc', 'segika']) for (const rol of ['kadrolu', 'cozum', 'tavsiye', 'elci']) {
    const modul = await import(`../src/data/politikaAkislari/${proje}/${rol}.ts`);
    const akis = modul.akisOlustur({ ...VARSAYILAN_AYAR, marka: proje });
    for (const adim of akis.adimlar) {
      const zincir = olasiSonrakiler(akis, adim).map((a: { id: string }) => a.id);
      expect(new Set(zincir).size, `${proje}/${rol}/${adim.id}`).toBe(zincir.length);
      expect(zincir, `${proje}/${rol}/${adim.id}`).not.toContain(adim.id);
    }
  }
});

test('sorumlu bilgisi tam cümledir', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const etkin = page.locator('[data-akis-etkin]');
  await expect(etkin.locator('.pol-sorumlu')).toHaveText('Bu adımı ortaklık sorumlusu ile birlikte siz yürütürsünüz. Şirket bu görevi henüz kimseye atamadı.');
  await etkin.getByRole('button', { name: 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', exact: true }).click();
  await expect(etkin.locator('.pol-sorumlu')).toHaveText('Bu adımı siz yürütürsünüz.');
});

test('önce yapılacaklar, sonra soru gelir', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await expect(page.locator('[data-akis-etkin] .pol-karar')).toBeVisible();
  const sira = await page.locator('[data-akis-etkin] .pol-is-aciklamasi, [data-akis-etkin] .pol-karar-alani').evaluateAll((els) => els.map((e) => e.className));
  expect(sira).toEqual([expect.stringContaining('pol-is-aciklamasi'), expect.stringContaining('pol-karar-alani')]);
});

test('sekme kapanınca ilerleme bu cihazda korunur', async ({ context }) => {
  const ilk = await context.newPage();
  await ilk.goto('politikalar/?proje=istoc&rol=cozum');
  await ilk.locator('[data-akis-etkin]').getByRole('button', { name: 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', exact: true }).click();
  await expect(ilk.locator('[data-akis-gecmis]')).toHaveCount(1);
  await ilk.close();
  const ikinci = await context.newPage();
  await ikinci.goto('politikalar/?proje=istoc&rol=cozum');
  await expect(ikinci.locator('[data-akis-gecmis]')).toHaveCount(1);
});

test('akışı değiştirmeyen ortak değer ilerlemeyi sıfırlamaz, akışı değiştiren sıfırlar', async ({ page, personaServer }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await expect(page.locator('[data-sync-state="synced"]')).toBeVisible();
  await page.locator('[data-akis-etkin]').getByRole('button', { name: 'Ortaklık sorumlusu işletmeyi benim adıma yazdı', exact: true }).click();
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  personaServer.seed('istoc', { kur: 61 });
  const kur = () => page.evaluate(() => JSON.parse(localStorage.getItem('turksab-persona-ortak-v1-istoc') ?? '{}')?.snapshot?.fields?.kur);
  await expect.poll(kur, { timeout: 10000 }).toBe(61);
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  await expect(page.getByText('Koşullar değişti. İş sırasını yeniden kontrol edin.')).toHaveCount(0);
  // Katkı seviyesi gösterim adımını ekler veya kaldırır. Bu, akışın yapısını değiştirir.
  personaServer.seed('istoc', { cozumSeviye: 'A' });
  await expect(page.getByText('Koşullar değişti. İş sırasını yeniden kontrol edin.')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(0);
});

test('rehberdeki ayar seçimi herkesi etkilediğini söyler', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await page.getByRole('button', { name: 'Görevi ve çalışma koşullarını görün', exact: true }).click();
  await expect(page.getByText('Aşağıdaki seçimler bu cihazda kalmaz. “Satış ortaklığı programı” sayfasını ve bu rehberi açan herkes yeni değeri görür.')).toBeVisible();
  await expect(page.getByText('Değişiklikler hesaplayıcıya ve bu projenin rehberlerine yansır.')).toHaveCount(0);
});

test('açık konular, gözden kaçabilecek sorunlar ve fırsatlar tek tıkla açılır', async ({ page }) => {
  await page.goto('politikalar/?proje=segika&rol=tavsiye');
  await page.getByRole('button', { name: 'Açık konuları, riskleri ve fırsatları görün', exact: true }).click();
  const bolum = page.locator('[data-akis-bosluk]');
  await expect(bolum.getByRole('heading', { name: 'Yeni satış fırsatları', exact: true })).toBeVisible();
  await expect(bolum.getByRole('heading', { name: 'Başlamadan çözülmesi gereken açık konular', exact: true })).toBeVisible();
  await expect(bolum.getByRole('heading', { name: 'Gözden kaçabilecek sorunlar', exact: true })).toBeVisible();
  await expect(bolum.getByRole('heading', { name: 'Bir sorun çıkarsa ne yapacaksınız?', exact: true })).toBeVisible();
  expect(await bolum.locator('[data-firsat]').count()).toBeGreaterThanOrEqual(3);
});

// Kullanıcı kararı 20 Kasım 2026 Cuma: çözüm ortağı ve marka elçisi belgesinde hesap sürümü bağlantısı yoktur.
// Bağlantılar kadrolu uzman belgesinde kalır.
test('Segika rehberindeki hesap bağlantısı Segika hesabını açar', async ({ page }) => {
  await page.goto('politikalar/?proje=segika&rol=kadrolu');
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Birinci sürümdeki hesabı açın' })).toHaveAttribute('href', /proje=segika/);
  // İkinci sürüm bağlantısı kapalı bir alt bölümdedir. Bağlantının adresi yine denetlenir.
  await expect(page.locator('.pol-belge a[href*="surum=v2"]')).toHaveAttribute('href', /urun=segika/);
});

// Kullanıcı kararı 17 Kasım 2026 Salı: cevap kutularının üstünde kısa açıklama, her kutunun altında sonuç satırı vardır.
// Sonuç satırı akış verisindeki türden üretilir. Devam, bekle, bitir ve tamamla türlerinin her birinin kendi satırı vardır.
for (const proje of ['istoc', 'segika'] as const) for (const rol of ['kadrolu', 'cozum', 'tavsiye', 'elci'] as const) {
  test(`${proje} ${rol}: soru, açıklama ve cevap kutuları sırayla ve ayrı durur`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto(`politikalar/?proje=${proje}&rol=${rol}`);
    const karar = page.locator('[data-akis-etkin] .pol-karar');
    const aciklama = karar.locator('.pol-karar-aciklama');
    await expect(aciklama).toHaveText('Ne olduğunu seçin. Sayfa size sonraki adımı gösterir.');
    // Açıklama ekran okuyucuda da duyulur.
    const id = await aciklama.getAttribute('id');
    await expect(karar).toHaveAttribute('aria-describedby', id!);
    const kutular = karar.locator('.pol-yanit');
    const sira = await page.evaluate(() => {
      const k = document.querySelector('[data-akis-etkin] .pol-karar')!;
      const y = (s: string) => k.querySelector(s)!.getBoundingClientRect();
      return { soru: y('legend').bottom, acik: [y('.pol-karar-aciklama').top, y('.pol-karar-aciklama').bottom], kutu: y('.pol-yanit').top };
    });
    expect(sira.acik[0]).toBeGreaterThan(sira.soru);
    expect(sira.kutu).toBeGreaterThan(sira.acik[1]);
    // Her kutunun altında sonucu söyleyen satır vardır. Satır kutuya bağlıdır.
    const n = await kutular.count();
    expect(n).toBeGreaterThan(1);
    for (let i = 0; i < n; i++) {
      const kutu = kutular.nth(i);
      const satirId = await kutu.getAttribute('aria-describedby');
      const satir = page.locator(`[id="${satirId}"]`);
      await expect(satir).toHaveText(/^(Sonra “.+” adımına geçersiniz\.|Burada durursunuz\. Durum değişince bu soruya dönün\.|Bu iş burada biter\.|Bu iş tamamlanır\.)$/);
      const kb = (await kutu.boundingBox())!;
      const sb = (await satir.boundingBox())!;
      expect(sb.y).toBeGreaterThanOrEqual(kb.y + kb.height);
      expect(parseFloat(await satir.evaluate((el) => getComputedStyle(el).fontSize))).toBeGreaterThanOrEqual(14);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  });
}

test('sonuç satırı cevabın türünü doğru söyler', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  const karar = page.locator('[data-akis-etkin] .pol-karar');
  const satir = async (ad: string) => {
    const id = await karar.getByRole('button', { name: ad, exact: true }).getAttribute('aria-describedby');
    return page.locator(`[id="${id}"]`);
  };
  await expect(await satir('Ortaklık sorumlusu işletmeyi benim adıma yazdı')).toHaveText('Sonra “Ticari ihtiyacı konuşun” adımına geçersiniz.');
  await expect(await satir('Kayıt için henüz yanıt gelmedi')).toHaveText('Burada durursunuz. Durum değişince bu soruya dönün.');
  await expect(await satir('İşletmenin başka ortağa kayıtlı olduğunu öğrendim')).toHaveText('Bu iş burada biter.');
});

// Kullanıcı kararı 17 Kasım 2026 Salı: terim açıklamaları yapılacak işlerden ayrı bir bölümde görünür.
// Açıklama veride ayrı alandır (`terimler`). Numaralı listede yalnız yapılacak işler kalır.
// “Kelime, ... -dır.” biçimindeki tanım cümlesi. “Bu program ... içindir.” gibi bilgi cümlesi tanım sayılmaz.
// Sayı ya da yüzde taşıyan cümle bir kuraldır, kelime açıklaması değildir. Örneğin ödül oranı.
const TANIM = /^(?!Bu )(?!.*[%\d])[^,.?!]{2,40}, [^.?!]+(dır|dir|dur|dür|tır|tir|tur|tür|demektir)\.$/;
test('akış verisinde terim açıklaması yapılacak işler listesinde durmaz', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const { KAZANC_VARSAYILAN, planliAyar } = await import('../src/data/kazancPlani');
  const { kosulListesi } = await import('../src/data/kosullar');
  let terimSayisi = 0;
  for (const proje of ['istoc', 'segika'] as const) for (const rol of ['kadrolu', 'cozum', 'tavsiye', 'elci'] as const) {
    const { akisOlustur } = await import(`../src/data/politikaAkislari/${proje}/${rol}.ts`);
    for (const model of ['oran', 'sabit'] as const) for (const seviye of ['A', 'C'] as const) {
      const temel = planliAyar({ ...VARSAYILAN_AYAR, marka: proje, model, cozumSeviye: seviye, elciSeviye: seviye }, KAZANC_VARSAYILAN);
      for (const k of kosulListesi(temel, rol)) {
        const akis = akisOlustur({ ...temel, kosul: { ...temel.kosul, [rol]: k.id } });
        for (const adim of akis.adimlar) {
          for (const is of adim.yap) expect(is, `${proje}/${rol}/${k.id}/${adim.id}`).not.toMatch(TANIM);
          terimSayisi += adim.terimler?.length ?? 0;
        }
      }
    }
  }
  expect(terimSayisi).toBeGreaterThan(100);
});

for (const proje of ['istoc', 'segika'] as const) test(`${proje}: terimler numaralı listenin üstünde ayrı bölümde görünür`, async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto(`politikalar/?proje=${proje}&rol=kadrolu`);
  const is = page.locator('[data-akis-etkin] .pol-is-aciklamasi');
  const bolum = is.locator('.pol-terimler');
  await expect(bolum.getByRole('heading', { name: 'Bu adımdaki kelimeler', exact: true })).toBeVisible();
  await expect(bolum.locator('li')).not.toHaveCount(0);
  for (const metin of await is.locator('.pol-yap li').allInnerTexts()) expect(metin).not.toMatch(TANIM);
  const yer = await page.evaluate(() => {
    const k = document.querySelector('[data-akis-etkin] .pol-is-aciklamasi')!;
    const b = k.querySelector('.pol-terimler')!;
    const s = getComputedStyle(b);
    return { ustte: b.getBoundingClientRect().bottom <= k.querySelector('.pol-yap')!.getBoundingClientRect().top, kenar: s.borderTopStyle + s.borderLeftStyle, zemin: s.backgroundColor };
  });
  expect(yer.ustte).toBe(true);
  expect(yer.kenar).toBe('nonenone');
  expect(yer.zemin).not.toBe('rgba(0, 0, 0, 0)');
});
