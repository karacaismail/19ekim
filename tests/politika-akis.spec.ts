import { expect, test } from './fixtures/persona';

test('rehber yalnız mevcut işi açar ve koşul yanıtıyla ilerler', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const etkin = page.locator('[data-akis-etkin]');
  await expect(etkin).toHaveCount(1);
  await expect(etkin).toContainText('Çalışma anlaşmanız ne durumda?');
  await expect(page.locator('.pol-belge')).toHaveCount(0);
  await etkin.getByRole('button', { name: 'Anlaşma henüz taslak', exact: true }).click();
  await expect(page.locator('[data-akis-sonuc="bekle"]')).toContainText('Anlaşma bekleniyor');
  await expect(etkin).toContainText('Çalışma anlaşmanız ne durumda?');
  await etkin.getByRole('button', { name: 'Yazılı anlaşmam var', exact: true }).click();
  await expect(etkin).toContainText('Kayıt sonucu ne oldu?');
  await expect(etkin.getByRole('heading').first()).toBeFocused();
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  await page.getByRole('button', { name: 'Yazılı anlaşma yanıtını değiştir', exact: true }).click();
  await expect(etkin).toContainText('Çalışma anlaşmanız ne durumda?');
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(0);
});

test('on farklı rehber aynı sayfa içindeki seçimle açılır', async ({ page }) => {
  await page.goto('politikalar/');
  for (const proje of ['iStoc', 'Segika']) {
    await page.getByRole('tab', { name: proje, exact: true }).click();
    for (const rol of ['Öncü ortak', 'Kadrolu uzman', 'Çözüm ortağı', 'Mevcut müşteri', 'Marka elçisi']) {
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
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const etkin = page.locator('[data-akis-etkin]');
  await etkin.getByRole('button', { name: 'Yazılı anlaşmam var', exact: true }).click();
  await expect(etkin).toContainText('Kayıt sonucu ne oldu?');
  await page.reload();
  await expect(etkin).toContainText('Kayıt sonucu ne oldu?');
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
});

test('ayrıntı kaynağı gelmezse etkin iş ve yanıtlar korunur', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await page.route(/PolitikaAkisAyrinti\.[\w-]+\.js$/, (route) => route.abort());
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const etkin = page.locator('[data-akis-etkin]');
  await etkin.getByRole('button', { name: 'Yazılı anlaşmam var', exact: true }).click();
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('İş adımlarınız korunuyor.');
  await expect(etkin).toContainText('Kayıt sonucu ne oldu?');
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  expect(errors).toEqual([]);
  await page.unroute(/PolitikaAkisAyrinti\.[\w-]+\.js$/);
  await page.getByRole('button', { name: 'Ayrıntıları yeniden yükle', exact: true }).click();
  await expect(page.locator('.pol-belge')).toBeVisible();
  await expect(etkin).toContainText('Kayıt sonucu ne oldu?');
});

test('adım ayrıntısı iki yönde pozitif süre ve hareket azaltma tercihi kullanır', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
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
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const sonraki = page.locator('[data-akis-sonraki]');
  await expect(sonraki).toContainText('Sonraki olası adımlar');
  await expect(sonraki.locator('li').first()).toHaveText('Dükkânı kaydedin');
  await expect(sonraki).toContainText('Yanıtınız bu sırayı değiştirebilir.');
  await page.locator('[data-akis-etkin]').getByRole('button', { name: 'Yazılı anlaşmam var', exact: true }).click();
  await expect(sonraki).not.toContainText('Dükkânı kaydedin');
  await expect(sonraki.locator('li').first()).toHaveText('İşletmeyle görüşün');
  // Bekleme yanıtı seçilince ileriki adımlar gösterilmez. Okur önce koşulun değişmesini bekler.
  await page.locator('[data-akis-etkin]').getByRole('button', { name: 'Başka ortak bu dükkânı bildirmiş', exact: true }).click();
  await expect(sonraki).toHaveCount(0);
});

test('on rehberin sonraki adım zinciri döngüsüz ve sonludur', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');
  const { olasiSonrakiler } = await import('../src/data/politikaAkislari/motor');
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  for (const proje of ['istoc', 'segika']) for (const rol of ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci']) {
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
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  const etkin = page.locator('[data-akis-etkin]');
  await expect(etkin.locator('.pol-sorumlu')).toHaveText('Bu adımı ortaklık sorumlusu yürütür. Şirket bu görevi henüz kimseye atamadı.');
  await etkin.getByRole('button', { name: 'Yazılı anlaşmam var', exact: true }).click();
  await expect(etkin.locator('.pol-sorumlu')).toHaveText('Bu adımı siz yürütürsünüz.');
});

test('önce yapılacaklar, sonra soru gelir', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(page.locator('[data-akis-etkin] .pol-karar')).toBeVisible();
  const sira = await page.locator('[data-akis-etkin] .pol-is-aciklamasi, [data-akis-etkin] .pol-karar-alani').evaluateAll((els) => els.map((e) => e.className));
  expect(sira).toEqual([expect.stringContaining('pol-is-aciklamasi'), expect.stringContaining('pol-karar-alani')]);
});

test('sekme kapanınca ilerleme bu cihazda korunur', async ({ context }) => {
  const ilk = await context.newPage();
  await ilk.goto('politikalar/?proje=istoc&rol=oncu');
  await ilk.locator('[data-akis-etkin]').getByRole('button', { name: 'Yazılı anlaşmam var', exact: true }).click();
  await expect(ilk.locator('[data-akis-gecmis]')).toHaveCount(1);
  await ilk.close();
  const ikinci = await context.newPage();
  await ikinci.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(ikinci.locator('[data-akis-gecmis]')).toHaveCount(1);
});

test('akışı değiştirmeyen ortak değer ilerlemeyi sıfırlamaz, akışı değiştiren sıfırlar', async ({ page, personaServer }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(page.locator('[data-sync-state="synced"]')).toBeVisible();
  await page.locator('[data-akis-etkin]').getByRole('button', { name: 'Yazılı anlaşmam var', exact: true }).click();
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  personaServer.seed('istoc', { kur: 61 });
  const kur = () => page.evaluate(() => JSON.parse(localStorage.getItem('turksab-persona-ortak-v1-istoc') ?? '{}')?.snapshot?.fields?.kur);
  await expect.poll(kur, { timeout: 10000 }).toBe(61);
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(1);
  await expect(page.getByText('Koşullar değişti. İş sırasını yeniden kontrol edin.')).toHaveCount(0);
  // Katkı seviyesi gösterim adımını ekler veya kaldırır. Bu, akışın yapısını değiştirir.
  personaServer.seed('istoc', { oncuSeviye: 'A' });
  await expect(page.getByText('Koşullar değişti. İş sırasını yeniden kontrol edin.')).toBeVisible({ timeout: 10000 });
  await expect(page.locator('[data-akis-gecmis]')).toHaveCount(0);
});

test('rehberdeki ayar seçimi herkesi etkilediğini söyler', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await page.getByRole('button', { name: 'Görevi ve çalışma koşullarını görün', exact: true }).click();
  await expect(page.getByText('Bu seçim ortak ayarı değiştirir. “Satış ortaklığı programı” sayfasını ve bu rehberi açan herkes yeni değeri görür.')).toBeVisible();
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

test('Segika rehberindeki hesap bağlantısı Segika hesabını açar', async ({ page }) => {
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Birinci sürümdeki hesabı açın' })).toHaveAttribute('href', /proje=segika/);
  // İkinci sürüm bağlantısı kapalı bir alt bölümdedir. Bağlantının adresi yine denetlenir.
  await expect(page.locator('.pol-belge a[href*="surum=v2"]')).toHaveAttribute('href', /proje=segika/);
});
