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
