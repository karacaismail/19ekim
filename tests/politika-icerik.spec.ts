import { expect, test } from '@playwright/test';
import { KOSULLAR } from '../src/data/kosullar';
import { VARSAYILAN_AYAR, type Ayar, type Marka, type RolId } from '../src/data/satisOrtakligi';
import type { IsAkisi } from '../src/data/politikaAkislari/types';
import type { ProjePolitika } from '../src/data/politikalar/types';

// Rehber içeriği için veri denetimleri. Tarayıcıdan bağımsızdır, yalnız Chromium projesinde bir kez çalışır.
test.skip(({ browserName }) => browserName !== 'chromium', 'Veri denetimi bir kez çalışır.');

const PROJELER: Marka[] = ['istoc', 'segika'];
const ROLLER: RolId[] = ['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci'];
const programlar = (proje: Marka, rol: RolId) => KOSULLAR[rol].filter((k) => !k.marka || k.marka.includes(proje));

async function belge(proje: Marka, rol: RolId): Promise<ProjePolitika> {
  return (await import(`../src/data/politikalar/${proje}/${rol}.ts`)).politika;
}
async function akislar(proje: Marka, rol: RolId): Promise<IsAkisi[]> {
  const { akisOlustur } = await import(`../src/data/politikaAkislari/${proje}/${rol}.ts`);
  return programlar(proje, rol).map((p) => {
    const ayar: Ayar = { ...VARSAYILAN_AYAR, marka: proje, kosul: { ...VARSAYILAN_AYAR.kosul, [rol]: p.id } };
    return akisOlustur(ayar) as IsAkisi;
  });
}
function akisMetni(akis: IsAkisi): string {
  return [akis.baslik, akis.ozet, akis.hedef, ...akis.adimlar.flatMap((a) => [a.ad, a.sorumlu, a.soru, a.dikkat ?? '', ...a.yap,
    ...a.secenekler.flatMap((s) => [s.metin, ...('sonuc' in s ? [s.sonuc.baslik, ...s.sonuc.metin] : [])])])].join('\n');
}

test('her rehberde üç ile beş arası ticari fırsat vardır ve fırsatlar fiyat sözü içermez', async () => {
  for (const proje of PROJELER) for (const rol of ROLLER) {
    const p = await belge(proje, rol);
    const firsatlar = p.firsatlar ?? [];
    expect(firsatlar.length, `${proje}/${rol}`).toBeGreaterThanOrEqual(3);
    expect(firsatlar.length, `${proje}/${rol}`).toBeLessThanOrEqual(5);
    for (const f of firsatlar) {
      for (const alan of [f.baslik, f.neden, f.ilkAdim, f.olcu]) expect(alan.trim().length, `${proje}/${rol}: ${f.baslik}`).toBeGreaterThan(0);
      expect(`${f.baslik} ${f.neden} ${f.ilkAdim} ${f.olcu}`, `${proje}/${rol}: ${f.baslik}`).not.toMatch(/indirim|ücretsiz|bedava|pazarlık/i);
    }
  }
});

test('ana program dışındaki her programın kendi hedef kitlesi vardır', async () => {
  for (const proje of PROJELER) for (const rol of ROLLER) {
    const p = await belge(proje, rol);
    for (const program of programlar(proje, rol).filter((k) => k.id !== 'ana')) {
      expect(p.programKitleleri?.[program.id]?.length ?? 0, `${proje}/${rol}/${program.id}`).toBeGreaterThanOrEqual(2);
    }
  }
});

test('rehberler fiyat kuralını bozan dal içermez', async () => {
  const yasak = [/yeni teklifi şirket gönderir/i, /fiyat kararını yalnız o verir/i, /fiyatı ve kapsamı onaylamalı/i,
    /karşılıklı indirim uygulanır/i, /indirim[^.]*ilet/i, /talebi[^.]*satış yöneticisine[^.]*ilet/i, /İsmail Karaca/];
  for (const proje of PROJELER) for (const rol of ROLLER) for (const akis of await akislar(proje, rol)) {
    const metin = akisMetni(akis);
    for (const desen of yasak) expect(metin, `${proje}/${rol}: ${desen}`).not.toMatch(desen);
  }
});

test('rehberler araç dilini okura göstermez', async () => {
  const yasak = [/seçili ayar/i, /kaynakta/i, /\(önerilen\)/];
  for (const proje of PROJELER) for (const rol of ROLLER) for (const akis of await akislar(proje, rol)) {
    const metin = akisMetni(akis);
    for (const desen of yasak) expect(metin, `${proje}/${rol}: ${desen}`).not.toMatch(desen);
  }
});

test('her adımın sorumlusu tam cümleyle söylenir', async () => {
  const { sorumluCumlesi } = await import('../src/data/politikaAkislari/motor');
  expect(sorumluCumlesi('Siz')).toBe('Bu adımı siz yürütürsünüz.');
  expect(sorumluCumlesi('Siz ve satış yöneticisi (önerilen görev)')).toBe('Bu adımı satış yöneticisi ile birlikte siz yürütürsünüz. Şirket bu görevi henüz kimseye atamadı.');
  expect(sorumluCumlesi('Finans sorumlusu (önerilen görev)')).toBe('Bu adımı finans sorumlusu yürütür. Şirket bu görevi henüz kimseye atamadı.');
  for (const proje of PROJELER) for (const rol of ROLLER) for (const akis of await akislar(proje, rol)) for (const adim of akis.adimlar) {
    const cumle = sorumluCumlesi(adim.sorumlu);
    expect(cumle, `${proje}/${rol}/${adim.id}: ${adim.sorumlu}`).toMatch(/^Bu adımı [^()]+ (yürütür|yürütürsünüz)\.( Şirket bu görevi henüz kimseye atamadı\.)?$/);
  }
});
