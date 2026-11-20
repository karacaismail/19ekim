import { expect, test, type Page } from './fixtures/persona';

// Kullanıcı kararları 20 Kasım 2026 Cuma: “Çalışma rehberleri” sayfasındaki açık kararlar.
// Kararlar yalnız iStoc içindir. Segika olduğu gibi kalır.
// - Kurulumu satışı kapatan kişi yapar. Yalnız tanıştırılan satışta kurulumu şirket yapar.
// - Tavsiyeyle gelen yeni müşterinin 1 ay ücretsiz kullanımı pazarlama ödülüdür. Fiyat kuralıyla çelişmez.
// - Kadrolu uzman ve mevcut müşteri belgesindeki ikinci hesap sürümü geçersiz diye işaretlenir.
// - K1 kuralı: ilk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır.

const tasmaYok = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);

test('iStoc K1 kuralı her ayı ister, Segika kuralı değişmez', async () => {
  const k = await import('../src/data/kazancPlani');
  expect(k.kotaKurali('istoc')).toContain('İlk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır.');
  expect(k.kotaKurali('istoc')).toContain('Ciro tek bir ay bile K1 kotasının altında kalırsa kişi 13. aydan sonra pay almaz.');
  expect(k.kotaKurali('segika')).toBe('Kişi ilk 12 ayda K1 kotasını tamamlamazsa 13. aydan sonra pay almaz.');
});

// Her akışta ilk adım ve her “devam” seçeneğinin hedefi var olmalıdır. Seviyeler: A tanıştırır, B gösterir, C satışı kapatır.
test('iStoc çözüm ortağı ve elçi akışlarında her adım bağlantısı vardır', async () => {
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const cozum = await import('../src/data/politikaAkislari/istoc/cozum');
  const elci = await import('../src/data/politikaAkislari/istoc/elci');
  for (const seviye of ['A', 'B', 'C'] as const) {
    for (const akis of [
      cozum.akisOlustur({ ...VARSAYILAN_AYAR, marka: 'istoc', cozumSeviye: seviye }),
      elci.akisOlustur({ ...VARSAYILAN_AYAR, marka: 'istoc', elciSeviye: seviye }),
    ]) {
      const idler = new Set(akis.adimlar.map((a) => a.id));
      expect(idler.has(akis.ilk)).toBe(true);
      for (const adim of akis.adimlar) for (const secenek of adim.secenekler) {
        if (secenek.tur === 'devam') expect(idler.has(secenek.sonraki), `${seviye} ${adim.id} → ${secenek.sonraki}`).toBe(true);
      }
    }
  }
});

test('iStoc çözüm ortağı: satışı kapatan kurulumu yapar, tanıştıranın kurulumunu şirket yapar', async () => {
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const { akisOlustur } = await import('../src/data/politikaAkislari/istoc/cozum');
  const kapatan = akisOlustur({ ...VARSAYILAN_AYAR, marka: 'istoc', cozumSeviye: 'C' });
  const kurulum = kapatan.adimlar.find((a) => a.id === 'kurulum')!;
  expect(kurulum.ad).toBe('Kurulumu yapın');
  expect(kurulum.sorumlu).toBe('Siz');
  expect(kurulum.yap.join(' ')).toContain('ilk eğitimi');
  expect(JSON.stringify(kapatan)).not.toContain('Kurulum ekibi işi devralır');
  expect(kapatan.ozet).toContain('kurulumu');
  const tanistiran = akisOlustur({ ...VARSAYILAN_AYAR, marka: 'istoc', cozumSeviye: 'A' });
  expect(tanistiran.adimlar.find((a) => a.id === 'kurulum')!.ad).toBe('Kurulumu şirkete devredin');

  const { politika } = await import('../src/data/politikalar/istoc/cozum');
  const belge = JSON.stringify(politika);
  expect(belge).not.toContain('Kurulumu ve desteği şirket yapar');
  expect(belge).not.toContain('Bu işleri şirket yapar');
  expect(politika.iliski).toContain('Satışı siz kapatırsanız kurulumu');
});

test('iStoc marka elçisi: satışı kapatırsa kurulum adımı vardır', async () => {
  const { VARSAYILAN_AYAR } = await import('../src/data/satisOrtakligi');
  const { akisOlustur } = await import('../src/data/politikaAkislari/istoc/elci');
  const kapatan = akisOlustur({ ...VARSAYILAN_AYAR, marka: 'istoc', elciSeviye: 'C' });
  const teklif = kapatan.adimlar.find((a) => a.id === 'teklif')!;
  expect(teklif.secenekler.find((s) => s.id === 'kabul')).toMatchObject({ tur: 'devam', sonraki: 'kurulum' });
  const kurulum = kapatan.adimlar.find((a) => a.id === 'kurulum')!;
  expect(kurulum.sorumlu).toBe('Siz');
  expect(kurulum.secenekler.find((s) => s.tur === 'devam')).toMatchObject({ sonraki: 'odeme' });
  const tanistiran = akisOlustur({ ...VARSAYILAN_AYAR, marka: 'istoc', elciSeviye: 'A' });
  expect(tanistiran.adimlar.some((a) => a.id === 'kurulum')).toBe(false);
  const { politika } = await import('../src/data/politikalar/istoc/elci');
  expect(politika.iliski).not.toContain('Satışı, kurulumu ve satıcı desteğini şirket yürütür.');
  expect(politika.iliski).toContain('Satışı siz kapatırsanız kurulumu');
  const belge = JSON.stringify(politika);
  expect(belge).not.toContain('elçinin satış yapma');
  expect(belge).not.toContain('"Başvuran satıcının satış görüşmesini şirket yürütür."');
  expect(politika.adimlar.map((a) => a.baslik)).toContain('Kurulumu yapın veya şirkete bırakın');
});

test('Segika rehberlerinde kurulum metni değişmez', async () => {
  const { politika: elci } = await import('../src/data/politikalar/segika/elci');
  expect(elci.iliski).toContain('Satışı, kurulumu ve müşteri desteğini şirket yürütür.');
});

test('iStoc kadrolu ve mevcut müşteri belgesinde ikinci sürüm geçersizdir', async () => {
  const { rehberHesabi } = await import('../src/data/politikalar/hesap');
  for (const rol of ['kadrolu', 'tavsiye'] as const) {
    expect(rehberHesabi(rol, 'istoc').digerSurumGecersiz).toBe(true);
    expect(rehberHesabi(rol, 'istoc').digerSurum).toHaveLength(1);
    expect(rehberHesabi(rol, 'segika').digerSurumGecersiz).toBe(false);
  }
  expect(rehberHesabi('tavsiye', 'istoc').ornekler[0].aciklama).toContain('İkinci sürüm artık geçerli değildir.');
  expect(rehberHesabi('tavsiye', 'segika').ornekler[0].aciklama).toContain('İkinci sürümün koşulu farklıdır. Şirket geçerli koşulu tavsiye öncesinde yazılı bildirmelidir.');

  const { politika: tavsiye } = await import('../src/data/politikalar/istoc/tavsiye');
  const tavsiyeMetni = JSON.stringify(tavsiye);
  expect(tavsiyeMetni).not.toContain('İkinci sürüm seçildiyse');
  expect(tavsiyeMetni).toContain('İkinci hesap sürümü artık geçerli değildir.');
  expect(tavsiye.acikKonular.map((k) => k.baslik)).not.toContain('Hangi kampanya sürümü geçerli?');
  const { politika: kadrolu } = await import('../src/data/politikalar/istoc/kadrolu');
  const kadroluMetni = JSON.stringify(kadrolu);
  expect(kadroluMetni).not.toContain('hangi hesap sürümünün geçerli olduğunu');
  expect(kadroluMetni).not.toContain('saha personeli ve ekip lideri');
});

async function ikinciSurumuAc(page: Page, proje: 'istoc' | 'segika', rol: 'kadrolu' | 'tavsiye') {
  await page.goto(`politikalar/?proje=${proje}&rol=${rol}`);
  await page.getByRole('button', { name: 'Bütün çalışma koşullarını açın', exact: true }).click();
  await page.locator('#ayrintilar').getByRole('button', { name: 'İkinci hesap sürümü seçilirse', exact: true }).click();
  return page.locator('#ayrintilar [data-surum2]');
}

for (const rol of ['kadrolu', 'tavsiye'] as const) {
  test(`iStoc ${rol}: ikinci sürüm bölümü geçersiz yazar, gri ve üstü çizilidir`, async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    const bolum = await ikinciSurumuAc(page, 'istoc', rol);
    const uyari = bolum.locator('[data-gecersiz-uyari]');
    await expect(uyari).toHaveText('Bu hesap artık geçerli değildir.');
    // Uyarı okunur kalır. Uyarının altındaki eski hesap gri ve üstü çizilidir.
    expect(await uyari.evaluate((el) => getComputedStyle(el).textDecorationLine)).toBe('none');
    const eski = bolum.locator('[data-gecersiz] dd').first();
    await expect(eski).toBeVisible();
    const stil = await eski.evaluate((el) => {
      const s = getComputedStyle(el);
      const ikincil = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary').trim();
      const sinama = document.createElement('span');
      sinama.style.color = ikincil;
      document.body.append(sinama);
      const beklenen = getComputedStyle(sinama).color;
      sinama.remove();
      return { cizgi: s.textDecorationLine, renk: s.color, beklenen };
    });
    expect(stil.cizgi).toBe('line-through');
    expect(stil.renk).toBe(stil.beklenen);
    const baglanti = bolum.locator('[data-gecersiz] a');
    await expect(baglanti).toHaveCSS('text-decoration-line', 'underline line-through');
    // Bağlantı uyarıya bağlıdır. Ekran okuyucu bağlantıda da “geçerli değildir” uyarısını okur.
    await expect(baglanti).toHaveAccessibleDescription('Bu hesap artık geçerli değildir.');
    // Klavye odağında yalnız merkezi odak göstergesi görünür. Üstü çizili çizgi kalkar.
    await page.keyboard.press('Tab');
    await expect(page.locator('html')).toHaveAttribute('data-focus-mode', 'keyboard');
    await baglanti.focus();
    const odak = await baglanti.evaluate((el) => {
      const s = getComputedStyle(el);
      const sinama = document.createElement('span');
      sinama.style.color = 'var(--focus-indicator)';
      document.body.append(sinama);
      const beklenen = getComputedStyle(sinama).color;
      sinama.remove();
      return { gorunur: el.matches(':focus-visible'), cizgi: s.textDecorationLine, renk: s.textDecorationColor, beklenen, halka: s.outlineStyle };
    });
    expect(odak.gorunur).toBe(true);
    expect(odak.cizgi).toBe('underline');
    expect(odak.renk).toBe(odak.beklenen);
    expect(odak.halka).toBe('none');
    await expect(page.locator('#kazanc')).toContainText('İkinci sürüm artık geçerli değildir.');
    expect(await tasmaYok(page)).toBe(true);
  });
}

test('Segika kadrolu: ikinci sürüm bölümü değişmez', async ({ page }) => {
  const bolum = await ikinciSurumuAc(page, 'segika', 'kadrolu');
  await expect(bolum).toBeVisible();
  await expect(bolum).toContainText('İkinci sürüm ayrı koşullar kullanır.');
  await expect(bolum.locator('[data-gecersiz-uyari]')).toHaveCount(0);
  await expect(bolum.locator('[data-gecersiz]')).toHaveCount(0);
  await expect(page.locator('#kazanc')).toContainText('Satış hesabının iki sürümü var.');
});

test('kazanç planı K1 kuralını projeye göre yazar', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 720 });
  const plan = page.getByRole('region', { name: 'Kazanç planı' });
  await page.goto('politikalar/?proje=istoc&rol=cozum');
  await expect(plan).toContainText('İlk 12 ayın her birinde aylık ciro en az K1 kotası kadar olmalıdır.');
  await expect(plan).not.toContainText('Kişi ilk 12 ayda K1 kotasını tamamlamazsa');
  await expect(plan).toContainText('Kilitli. Ciro ilk 12 ayın her birinde K1 kotasına ulaşınca açılır.');
  expect(await tasmaYok(page)).toBe(true);
  await page.goto('politikalar/?proje=segika&rol=cozum');
  await expect(plan).toContainText('Kişi ilk 12 ayda K1 kotasını tamamlamazsa 13. aydan sonra pay almaz.');
  await expect(plan).not.toContainText('İlk 12 ayın her birinde');
  await expect(plan).toContainText('Kilitli. K1 kotası tamamlanınca açılır.');
});
