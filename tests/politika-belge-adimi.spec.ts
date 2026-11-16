import { expect, test } from './fixtures/persona';
import { VARSAYILAN_AYAR } from '../src/data/satisOrtakligi';
import { KAZANC_VARSAYILAN, planliAyar } from '../src/data/kazancPlani';
import { kosulListesi } from '../src/data/kosullar';

// Kullanıcı kararı 16 Kasım 2026 Pazartesi: rehberde kullanıcının belirtmediği belge koşulları çıkar.
// Kullanıcı yalnız kazanç planını, herkesin iş ortağı olmasını ve kadrolu uzmanın maaşını ve primini belirtti.
// Çıkan adımlar: yazılı anlaşma, görev tanımı ve prim eki, yazılı ödül koşulu. Satış adımları kalır.
const BELGE_SORULARI = [
  'Çalışma anlaşmanız ne durumda?',
  'Program anlaşmanız ne durumda?',
  'Program anlaşması ne durumda?',
  'Ortaklık anlaşmanız ne durumda?',
  'Görev tanımınız ve prim ekiniz hazır mı?',
  'Elinizde hangi belgeler var?',
];
const roller = ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci'] as const;

for (const proje of ['istoc', 'segika'] as const) for (const rol of roller) {
  test(`${proje} ${rol}: iş akışında belge koşulu adımı yoktur ve akış tutarlıdır`, async () => {
    const { akisOlustur } = await import(`../src/data/politikaAkislari/${proje}/${rol}`);
    const temel = planliAyar({ ...VARSAYILAN_AYAR, marka: proje }, KAZANC_VARSAYILAN);
    for (const k of kosulListesi(temel, rol)) {
      const akis = akisOlustur({ ...temel, kosul: { ...temel.kosul, [rol]: k.id } });
      const ad = `${proje}/${rol}/${k.id}`;
      const kimlikler = new Set(akis.adimlar.map((a: { id: string }) => a.id));
      expect(kimlikler.has(akis.ilk), `${ad}: ilk adım var`).toBe(true);
      for (const adim of akis.adimlar) {
        expect(BELGE_SORULARI, `${ad}: ${adim.soru}`).not.toContain(adim.soru);
        expect(adim.soru, ad).not.toMatch(/koşulu .*yazılı ulaştı/);
        for (const s of adim.secenekler) if (s.tur === 'devam') expect(kimlikler.has(s.sonraki), `${ad}: ${s.metin} sonraki adımı var`).toBe(true);
      }
    }
  });
}

test('rehberin ilk sorusu artık anlaşma sorusu değildir', async ({ page }) => {
  await page.goto('politikalar/?proje=istoc&rol=oncu');
  await expect(page.locator('.pol-etkin-baslik')).toBeVisible();
  await expect(page.locator('.pol-karar legend')).not.toHaveText('Çalışma anlaşmanız ne durumda?');
  await expect(page.getByRole('button', { name: 'Ödeme belgesi belli değil' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Anlaşma henüz taslak' })).toHaveCount(0);
});
