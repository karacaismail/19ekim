import { expect, test, type Page } from './fixtures/persona';
import { DEFAULT_NOTES, INBOX, NOTES_KEY, type NotesState } from '../src/data/notes';

/*
 * Notlar sayfası: yeni liste, düzenleyici tuşları, liste sayaçları, bozuk kayıt ve kapalı depolama. Beklenen sayılar
 * varsayılan notlardan (DEFAULT_NOTES) hesaplanır. Ekle, işaretle, sil ve sıfırla akışı ui.spec.ts içinde sınanır.
 */

const hydrated = (page: Page) => page.waitForSelector('html[data-hydrated]', { state: 'attached' });
const icerik = (page: Page) => page.waitForSelector('.app-footer', { state: 'attached' });
const kacis = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const listeler = (page: Page) => page.getByRole('navigation', { name: 'Listeler' });
const listeDugmesi = (page: Page, ad: string) => listeler(page).getByRole('button', { name: new RegExp(`^${kacis(ad)}\\s*\\d+ açık not$`) });
const sayac = (page: Page, ad: string) => listeDugmesi(page, ad).locator('.note-count');
const satir = (page: Page, metin: string) => page.locator('.note-row', { hasText: metin });
const kayitOku = async (page: Page) => JSON.parse((await page.evaluate((k) => localStorage.getItem(k), NOTES_KEY)) ?? 'null') as NotesState | null;

/** Varsayılan notlarda listenin açık not sayısı. */
const acikSayi = (durum: NotesState, liste?: string) => durum.notes.filter((n) => !n.done && (!liste || n.list === liste)).length;

async function ac(page: Page) {
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('notlar/');
  await icerik(page);
  await hydrated(page);
}

const PARTNER = DEFAULT_NOTES.lists.find((l) => l.id === 'partner')!;
const ORNEK = DEFAULT_NOTES.notes.find((n) => n.list === 'ik' && !n.done)!;

test.describe('notlar: yeni liste', () => {
  test('“Liste ekle” listeyi kurar, seçer ve yenileyince saklar', async ({ page }) => {
    await ac(page);
    const alan = page.getByRole('textbox', { name: 'Yeni liste' });
    const ekle = page.getByRole('button', { name: 'Liste ekle' });
    // Boş ya da yalnız boşluk olan ad liste kurmaz.
    await expect(ekle).toBeDisabled();
    await alan.fill('   ');
    await expect(ekle).toBeDisabled();

    await alan.fill('  Toplantı  ');
    await expect(ekle).toBeEnabled();
    await ekle.click();
    // Ad kırpılır. Yeni liste hemen seçilir ve boştur.
    await expect(listeDugmesi(page, 'Toplantı')).toHaveAttribute('aria-pressed', 'true');
    await expect(listeDugmesi(page, 'Tümü')).toHaveAttribute('aria-pressed', 'false');
    await expect(page.locator('#not-listesi')).toHaveText('Toplantı');
    await expect(sayac(page, 'Toplantı')).toHaveText('0');
    await expect(page.locator('.note-row')).toHaveCount(0);
    await expect(alan).toHaveValue('');

    // Yeni not seçili listeye girer.
    const not = page.getByRole('textbox', { name: 'Yeni not (Toplantı)' });
    await not.fill('Gündemi hazırla');
    await not.press('Enter');
    await expect(satir(page, 'Gündemi hazırla')).toHaveCount(1);
    await expect(sayac(page, 'Toplantı')).toHaveText('1');
    await expect(sayac(page, 'Tümü')).toHaveText(String(acikSayi(DEFAULT_NOTES) + 1));

    let kayit = await kayitOku(page);
    const yeni = kayit?.lists.find((l) => l.name === 'Toplantı');
    expect(yeni).toBeTruthy();
    expect(kayit?.lists.map((l) => l.id).slice(0, DEFAULT_NOTES.lists.length)).toEqual(DEFAULT_NOTES.lists.map((l) => l.id));
    expect(kayit?.notes.find((n) => n.text === 'Gündemi hazırla')?.list).toBe(yeni!.id);

    // Enter ile de liste eklenir.
    await alan.fill('Okuma');
    await alan.press('Enter');
    await expect(listeDugmesi(page, 'Okuma')).toHaveAttribute('aria-pressed', 'true');

    await page.reload();
    await icerik(page);
    await hydrated(page);
    // Yenileyince “Tümü” seçilir. Listeler ve not yerinde durur.
    await expect(listeDugmesi(page, 'Tümü')).toHaveAttribute('aria-pressed', 'true');
    await expect(listeDugmesi(page, 'Toplantı')).toBeVisible();
    await expect(listeDugmesi(page, 'Okuma')).toBeVisible();
    await expect(sayac(page, 'Toplantı')).toHaveText('1');
    await listeDugmesi(page, 'Toplantı').click();
    await expect(page.locator('.note-row')).toHaveCount(1);
    await expect(satir(page, 'Gündemi hazırla')).toHaveCount(1);
    kayit = await kayitOku(page);
    expect(kayit?.lists.map((l) => l.name)).toEqual([...DEFAULT_NOTES.lists.map((l) => l.name), 'Toplantı', 'Okuma']);
  });
});

test.describe('notlar: düzenleyici tuşları', () => {
  test('Esc değişikliği iptal eder, kayıt yazılmaz', async ({ page }) => {
    await ac(page);
    await satir(page, ORNEK.text).getByRole('button', { name: /^Düzenle/ }).click();
    const alan = page.getByLabel('Notu düzenle');
    await expect(alan).toBeFocused();
    await alan.fill('Silinecek taslak');
    await alan.press('Escape');
    await expect(page.locator('li[data-editing]')).toHaveCount(0);
    await expect(satir(page, ORNEK.text)).toHaveCount(1);
    await expect(satir(page, 'Silinecek taslak')).toHaveCount(0);
    expect(await kayitOku(page)).toBeNull();
    // Yeniden açınca taslak değil, kayıtlı metin gelir.
    await satir(page, ORNEK.text).getByRole('button', { name: /^Düzenle/ }).click();
    await expect(page.getByLabel('Notu düzenle')).toHaveValue(ORNEK.text);
  });

  test('Ctrl/⌘+Enter kaydeder; yalnız Enter yeni satır açar', async ({ page }) => {
    await ac(page);
    await satir(page, ORNEK.text).getByRole('button', { name: /^Düzenle/ }).click();
    const alan = page.getByLabel('Notu düzenle');
    await alan.fill('Birinci satır');
    await alan.press('Enter');
    // Enter düzenleyiciyi kapatmaz.
    await expect(page.locator('li[data-editing]')).toHaveCount(1);
    await alan.pressSequentially('İkinci satır');
    await expect(alan).toHaveValue('Birinci satır\nİkinci satır');
    await alan.press('ControlOrMeta+Enter');
    await expect(page.locator('li[data-editing]')).toHaveCount(0);
    await expect(satir(page, 'İkinci satır')).toHaveCount(1);
    await expect(satir(page, ORNEK.text)).toHaveCount(0);
    const kayit = await kayitOku(page);
    expect(kayit?.notes.find((n) => n.id === ORNEK.id)?.text).toBe('Birinci satır\nİkinci satır');
    expect(kayit?.notes).toHaveLength(DEFAULT_NOTES.notes.length);
  });

  test('düzenleme formundaki “Vazgeç” eski metni korur', async ({ page }) => {
    await ac(page);
    await satir(page, ORNEK.text).getByRole('button', { name: /^Düzenle/ }).click();
    const form = page.locator('li[data-editing]');
    await page.getByLabel('Notu düzenle').fill('Vazgeçilecek metin');
    await form.getByRole('button', { name: 'Vazgeç' }).click();
    await expect(form).toHaveCount(0);
    await expect(satir(page, ORNEK.text)).toHaveCount(1);
    await expect(satir(page, 'Vazgeçilecek metin')).toHaveCount(0);
    expect(await kayitOku(page)).toBeNull();
  });

  test('boş düzenleme notun üstüne yazmaz ve notu silmez', async ({ page }) => {
    await ac(page);
    await satir(page, ORNEK.text).getByRole('button', { name: /^Düzenle/ }).click();
    await page.getByLabel('Notu düzenle').fill('   \n  ');
    await page.locator('li[data-editing]').getByRole('button', { name: 'Kaydet' }).click();
    await expect(page.locator('li[data-editing]')).toHaveCount(0);
    await expect(satir(page, ORNEK.text)).toHaveCount(1);
    await expect(page.locator('.note-row')).toHaveCount(DEFAULT_NOTES.notes.length);
    await expect(sayac(page, 'Tümü')).toHaveText(String(acikSayi(DEFAULT_NOTES)));
    const kayit = await kayitOku(page);
    // Kayıt yazılmadıysa varsayılan not geçerlidir. Yazıldıysa metin aynı kalmalıdır.
    if (kayit) expect(kayit.notes.find((n) => n.id === ORNEK.id)?.text).toBe(ORNEK.text);
  });
});

test.describe('notlar: sayaçlar, bozuk kayıt ve kapalı depolama', () => {
  test('her listenin açık not sayısı varsayılan notlardan gelir ve işaretleyince düşer', async ({ page }) => {
    await ac(page);
    await expect(sayac(page, 'Tümü')).toHaveText(String(acikSayi(DEFAULT_NOTES)));
    for (const l of DEFAULT_NOTES.lists) {
      await expect(sayac(page, l.name)).toHaveText(String(acikSayi(DEFAULT_NOTES, l.id)));
      await expect(sayac(page, l.name)).toHaveAttribute('aria-label', `${acikSayi(DEFAULT_NOTES, l.id)} açık not`);
    }
    // Partner listesinden bir not tamamlanır.
    const hedef = DEFAULT_NOTES.notes.find((n) => n.list === PARTNER.id && !n.done)!;
    await page.getByRole('checkbox', { name: hedef.text }).click();
    await expect(sayac(page, PARTNER.name)).toHaveText(String(acikSayi(DEFAULT_NOTES, PARTNER.id) - 1));
    await expect(sayac(page, 'Tümü')).toHaveText(String(acikSayi(DEFAULT_NOTES) - 1));
    // Diğer listeler değişmez.
    for (const l of DEFAULT_NOTES.lists.filter((x) => x.id !== PARTNER.id)) await expect(sayac(page, l.name)).toHaveText(String(acikSayi(DEFAULT_NOTES, l.id)));
    // Gelen kutusuna eklenen not o listenin sayısını artırır.
    const gelen = DEFAULT_NOTES.lists.find((l) => l.id === INBOX)!;
    const not = page.getByRole('textbox', { name: /^Yeni not/ });
    await not.fill('Gelen kutusu notu');
    await not.press('Enter');
    await expect(sayac(page, gelen.name)).toHaveText(String(acikSayi(DEFAULT_NOTES, INBOX) + 1));
    await expect(sayac(page, 'Tümü')).toHaveText(String(acikSayi(DEFAULT_NOTES)));
  });

  for (const deger of ['{bozuk', 'null', '[]', '{}', '"metin"', '{"lists":"x","notes":[]}', '{"lists":[{"id":1,"name":"Sayı"}],"notes":[]}', '{"lists":[],"notes":{}}']) {
    test(`bozuk kayıt ${deger} varsayılan notlara döner`, async ({ page }) => {
      const hatalar: string[] = [];
      page.on('pageerror', (e) => hatalar.push(e.message));
      await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [NOTES_KEY, deger]);
      await ac(page);
      await expect(page.locator('.note-row')).toHaveCount(DEFAULT_NOTES.notes.filter((n) => !n.done).length);
      for (const l of DEFAULT_NOTES.lists) await expect(listeDugmesi(page, l.name)).toBeVisible();
      await expect(listeler(page).getByRole('button')).toHaveCount(DEFAULT_NOTES.lists.length + 2);
      await expect(sayac(page, 'Tümü')).toHaveText(String(acikSayi(DEFAULT_NOTES)));
      expect(hatalar).toEqual([]);
    });
  }

  test('not öğeleri bozuk kayıt sayfayı çökertmez', async ({ page }) => {
    const hatalar: string[] = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    // Listeler doğru biçimde. Not dizisinde boş ve eksik alanlı öğe var.
    const bozuk = { lists: DEFAULT_NOTES.lists, notes: [null, { id: 'x' }, ...DEFAULT_NOTES.notes] };
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [NOTES_KEY, JSON.stringify(bozuk)]);
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto('notlar/');
    await hydrated(page);
    // Kayıt hidrasyondan sonra okunur. Bekleyen çizimin bitmesi beklenir, sonra hata listesi okunur.
    await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0))));
    expect(hatalar, 'sayfada yakalanmamış hata olmamalı').toEqual([]);
    await icerik(page);
    // Sayfa kullanılabilir kalır: varsayılan notlar görünür ve yeni not eklenir.
    await expect(satir(page, ORNEK.text)).toHaveCount(1);
    const not = page.getByRole('textbox', { name: /^Yeni not/ });
    await not.fill('Bozuk kayıttan sonra not');
    await not.press('Enter');
    await expect(satir(page, 'Bozuk kayıttan sonra not')).toHaveCount(1);
    expect(hatalar).toEqual([]);
  });

  // Tek bozuk liste öğesi bütün kaydı varsayılana döndürmemeli. Yoksa ilk düzenleme varsayılanları kayıtlı notların üstüne yazar.
  test('bozuk liste öğesi sağlam listeleri ve notları silmez; listesi olmayan not gelen kutusuna geçer', async ({ page }) => {
    const hatalar: string[] = [];
    page.on('pageerror', (e) => hatalar.push(e.message));
    const kayit = {
      lists: [{ id: INBOX, name: 'Gelen kutusu' }, { id: 'is', name: 'İş listesi' }, null, { id: 5 }],
      notes: [
        { id: 'n1', list: 'is', text: 'Kayıtlı iş notu', done: false, created: '2026-11-13' },
        { id: 'n2', list: 'silinen', text: 'Listesi olmayan not', done: false, created: '2026-11-13' },
      ],
    };
    await page.addInitScript(([k, v]) => localStorage.setItem(k, v), [NOTES_KEY, JSON.stringify(kayit)]);
    await ac(page);
    await expect(listeDugmesi(page, 'İş listesi')).toBeVisible();
    await expect(satir(page, 'Kayıtlı iş notu')).toHaveCount(1);
    // Varsayılan notlar gelmez: kayıt korunur.
    await expect(satir(page, ORNEK.text)).toHaveCount(0);
    await listeDugmesi(page, 'Gelen kutusu').click();
    await expect(satir(page, 'Listesi olmayan not')).toHaveCount(1);
    expect(hatalar).toEqual([]);
  });

  test('depolama kapalıyken değişiklik ekranda kalır ve durum satırı bunu söyler', async ({ page }) => {
    await page.addInitScript((k) => {
      const asil = Storage.prototype.setItem;
      Storage.prototype.setItem = function (anahtar: string, deger: string) {
        if (anahtar === k) throw new DOMException('Depolama kapalı', 'QuotaExceededError');
        return asil.call(this, anahtar, deger);
      };
    }, NOTES_KEY);
    await ac(page);
    const durum = page.locator('.note-footer [role="status"]');
    // Henüz değişiklik yok: kapalı depolama uyarısı görünmez.
    await expect(durum).not.toContainText('kapalı');
    const not = page.getByRole('textbox', { name: /^Yeni not/ });
    await not.fill('Kaydedilemeyen not');
    await not.press('Enter');
    await expect(satir(page, 'Kaydedilemeyen not')).toHaveCount(1);
    await expect(durum).toContainText('kapalı');
    await expect(sayac(page, 'Tümü')).toHaveText(String(acikSayi(DEFAULT_NOTES) + 1));
    expect(await kayitOku(page)).toBeNull();

    // Yenileyince not kaybolur. Durum satırının uyardığı davranış budur.
    await page.reload();
    await icerik(page);
    await hydrated(page);
    await expect(satir(page, 'Kaydedilemeyen not')).toHaveCount(0);
    await expect(page.locator('.note-row')).toHaveCount(DEFAULT_NOTES.notes.filter((n) => !n.done).length);
  });
});
