import { expect, test } from './fixtures/persona';

// Kullanıcı kararı 16 Kasım 2026 Pazartesi: satış ortaklığı sayfası yayında kalır ama geçersizdir.
for (const surum of ['v1', 'v2'] as const) for (const genislik of [320, 1280]) {
  test(`satış ortaklığı ${surum} ${genislik} px: en üstte geçersizlik uyarısı, bütün yazı gri ve üstü çizili`, async ({ page }) => {
    await page.setViewportSize({ width: genislik, height: 800 });
    await page.goto(`satis-ortakligi/?surum=${surum}`);
    const uyari = page.getByRole('alert').filter({ hasText: 'BU SAYFA ARTIK GEÇERSİZDİR' });
    await expect(uyari).toBeVisible();
    await expect(page.locator('h1')).toBeVisible();
    // Uyarı, sayfa başlığından ve bütün içerikten önce gelir.
    const sira = await page.evaluate(() => {
      const u = document.querySelector('[data-arsiv-uyari]')!;
      const h1 = document.querySelector('h1')!;
      return { once: Boolean(u.compareDocumentPosition(h1) & Node.DOCUMENT_POSITION_FOLLOWING), ust: u.getBoundingClientRect().top <= h1.getBoundingClientRect().top };
    });
    expect(sira).toEqual({ once: true, ust: true });
    const uyumsuz = await page.evaluate(() => {
      const kok = document.querySelector('[data-arsiv="gecersiz"]');
      if (!kok) return ['arşiv kapsayıcısı yok'];
      const gri = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
      const ornek = document.createElement('span');
      ornek.style.color = gri;
      document.body.append(ornek);
      const griRenk = getComputedStyle(ornek).color;
      ornek.remove();
      const hatalar: string[] = [];
      const yuruyen = document.createTreeWalker(kok, NodeFilter.SHOW_TEXT);
      for (let n = yuruyen.nextNode(); n; n = yuruyen.nextNode()) {
        const el = n.parentElement!;
        if (!n.textContent?.trim() || el.closest('[data-arsiv-uyari]')) continue;
        const r = el.getBoundingClientRect();
        if (!r.width || !r.height || getComputedStyle(el).visibility === 'hidden') continue;
        const s = getComputedStyle(el);
        // Çizgi her öğede ayrıca istenir. Üst öğenin çizgisi düğme ve kutu içine geçmez.
        if (!s.textDecorationLine.includes('line-through')) hatalar.push(`çizgisiz: ${n.textContent.trim().slice(0, 40)}`);
        if (s.color !== griRenk) hatalar.push(`gri değil (${s.color}): ${n.textContent.trim().slice(0, 40)}`);
      }
      return hatalar.slice(0, 10);
    });
    expect(uyumsuz).toEqual([]);
  });
}

test('geçersiz sayfa adresten açılır ve uyarı ekran okuyucuya okunur', async ({ page }) => {
  const yanit = await page.goto('satis-ortakligi/');
  expect(yanit?.status()).toBe(200);
  await expect(page.getByRole('alert')).toHaveText(/BU SAYFA ARTIK GEÇERSİZDİR/);
});
