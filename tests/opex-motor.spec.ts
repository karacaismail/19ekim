import { expect, test } from '@playwright/test';
import { donemOf, kisiDonem, type Kisi, type Kume3, type OpexModel, type Satir } from '../src/data/opex';

type Plan = { aylar: (Kume3 & { ad: string; kisa: string })[]; toplam: Kume3 };
import { buildInput, buildModel, exampleTohum, motor, NOW } from './opex-fixture';

/**
 * Apps Script OPEX motoru (Node, tarayıcısız). Bordro: 2026 ücretli tarifesi, asgari ücret istisnası, SGK tavanı,
 * 2 puan genel indirim (imalat dışı) ve asgari ücret desteği. Kurgusal örnek tohumla.
 */
const m = buildModel();
const person = (model: OpexModel, ad: string) => {
  const k = model.kisiler.find((x) => x.ad === ad);
  if (!k) throw new Error(`kişi yok: ${ad}`);
  return k;
};
const close = (a: number, b: number, eps = 0.011) => expect(Math.abs(a - b), `${a} ≈ ${b}`).toBeLessThanOrEqual(eps);
const PARAM = Object.fromEntries(motor.PARAMETRE_TANIMLARI.map((t) => [t.anahtar, t.deger])) as Record<string, number>;

/** Tek kişilik bordrolu girdi (Net esası). */
const solo = (net: number, esas = 'Net') => buildModel({ personel: [['Deneme', 'Bordrolu', esas, net, 'Evet', '', 'Otomatik', true, '']], giderler: [] });

test.describe('OPEX motoru: netten brüte bordro', () => {
  test('asgari ücret: 33.030 ₺ brüt → her ay 28.075,50 ₺ net; GV ve damga istisnası tam', () => {
    const k = person(m, 'Örnek Destek');
    for (const s of k.y2026.aylar) {
      expect(s.brut).toBe(33030);
      expect(s.net).toBe(28075.5);
      expect(s.gv).toBe(0);
      expect(s.dv).toBe(0);
    }
    expect(m.asgari.y2026).toEqual({ brut: 33030, net: 28075.5, tavan: 297270 });
  });

  test('aynı net her ay tutturulur (±0,01 ₺); kümülatif matrah artar, Aralık brütü Ocak’tan yüksek', () => {
    // Brüt her ay artmak zorunda değil: asgari ücret GV istisnası, asgarinin kendi matrahı 190.000 ₺’yi geçince
    // (Temmuz–Ağustos) büyür ve o ay brüt düşebilir. Bu, yasal hesabın sonucudur.
    for (const net of [36000, 47500, 230000]) {
      for (const year of ['y2026', 'y2027'] as const) {
        const k = solo(net).kisiler[0];
        const target = year === 'y2027' ? k.tutar2027 : net;
        const rows = k[year].aylar;
        rows.forEach((s, i) => {
          close(s.net, target);
          if (i) expect(s.kumulatifMatrah, `${net} ${year} ${i + 1}. ay`).toBeGreaterThan(rows[i - 1].kumulatifMatrah);
        });
        expect(rows[11].brut, `${net} ${year}`).toBeGreaterThan(rows[0].brut);
      }
    }
  });

  test('asgari ücret istisnası Ağustos’ta büyüyünce aynı net için brüt düşer (36.000 ₺ net, 2026)', () => {
    const rows = solo(36000).kisiler[0].y2026.aylar;
    expect(rows[7].gvIstisna).toBeGreaterThan(rows[6].gvIstisna);
    expect(rows[7].brut).toBeLessThan(rows[6].brut);
  });

  test('bilinen değer: 47.500 ₺ net, Ocak 2026 → 60.200,55 ₺ brüt (%15 dilim, asgari istisnası)', () => {
    // net = 0,85B − 0,15·0,85B − 0,00759B + 4.211,33 + 250,70 → B = (47.500 − 4.462,03) / 0,71491 = 60.200,54
    close(solo(47500).kisiler[0].y2026.aylar[0].brut, 60200.54, 0.02);
  });

  test('SGK tavanı: yüksek ücrette prime esas kazanç 297.270 ₺ ile sınırlı', () => {
    const s = solo(230000).kisiler[0].y2026.aylar[9];
    expect(s.brut).toBeGreaterThan(297270);
    expect(s.pek).toBe(297270);
    expect(s.sgkIsci).toBe(41617.8);
    expect(s.issizlikIsci).toBe(2972.7);
    expect(s.sgkIsveren).toBe(64656.23);
  });

  test('işveren maliyeti: brüt + %21,75 SGK + %2 işsizlik − 2 puan − asgari ücret desteği', () => {
    const s = person(m, 'Örnek Destek').y2026.aylar[0];
    expect(s.sgkIsveren).toBe(7184.03);
    expect(s.issizlikIsveren).toBe(660.6);
    expect(s.tesvik).toBe(660.6 + 1269.9);
    expect(s.maliyet).toBe(38944.13);
    // 2027: asgari ücret desteği açıklanmadı (0); yalnız genel indirim.
    const s27 = person(m, 'Örnek Destek').y2027.aylar[0];
    close(s27.tesvik, 42849.82 * 0.02);
  });

  test('koşullu teşvik (Ar-Ge 5746): genel indirimden sonra kalan işveren SGK payının yarısı', () => {
    const s = person(m, 'Örnek Ar-Ge').y2026.aylar[0];
    expect(s.brut).toBe(60000);
    expect(s.sgkIsveren).toBe(13050);
    expect(s.tesvik).toBe(1200 + 5925);
    expect(s.maliyet).toBe(60000 + 13050 + 1200 - 7125);
    expect(m.tesvikler.find((t) => t.kod === 'ARGE-5746')?.uygulananlar).toEqual(['Örnek Ar-Ge']);
  });

  test('freelancer: KDV dahil fatura OPEX’e nakit olarak; KDV hariç seçeneği', () => {
    const s = person(m, 'Örnek Serbest A').y2026.aylar[0];
    expect(s).toMatchObject({ fatura: 60000, kdvHaric: 50000, kdv: 10000, maliyet: 60000, brut: 0 });
    const haric = buildModel({ params: { opex_kdv: 'KDV hariç' } });
    expect(person(haric, 'Örnek Serbest A').y2026.aylar[0].maliyet).toBe(50000);
  });
});

test.describe('OPEX motoru: 2027 ve parametreler', () => {
  test('zam yıllık TÜFE (%29,73); “Hayır” olan kişiye uygulanmaz; asgari ücret 2027 asgarisini izler', () => {
    expect(m.zam).toEqual({ esas: 'Yıllık TÜFE', oran: 0.2973, ekPuan: 0 });
    expect(person(m, 'Örnek Serbest A').tutar2027).toBe(77838);
    expect(person(m, 'Örnek Uzman').tutar2027).toBe(61621.75);
    expect(person(m, 'Örnek Yönetici').tutar2027).toBe(120000);
    expect(person(m, 'Örnek Destek').tutar2027).toBe(36422.35);
    for (const s of person(m, 'Örnek Uzman').y2027.aylar) close(s.net, 61621.75);
  });

  test('kira 12 aylık ortalama TÜFE, fatura yıllık TÜFE, döviz kalemi kur varsayımıyla artar', () => {
    const g = (kalem: string) => m.giderler.find((x) => x.kalem === kalem)!;
    expect(g('Ofis kirası').tl2027).toBe(Math.round(60000 * 1.3149 * 100) / 100);
    expect(g('İnternet').tl2027).toBe(Math.round(500 * 1.2973 * 100) / 100);
    expect(g('Sunucu A').tl).toBe(Math.round(50 * PARAM.kur_eur * 100) / 100);
    expect(g('Sunucu A').tl2027).toBe(g('Sunucu A').tl);
    const kur = buildModel({ params: { kur_artis_2027: 0.1 } });
    expect(kur.giderler.find((x) => x.kalem === 'Sunucu A')!.tl2027).toBe(Math.round(g('Sunucu A').tl * 1.1 * 100) / 100);
  });

  test('“Dahil” kapalı kişi ve kalem hesaba girmez; tutarı olmayan kalem işaretlenir', () => {
    expect(m.kisiler.map((k) => k.ad)).not.toContain('Dahil olmayan kişi');
    expect(m.giderler.map((g) => g.kalem)).not.toContain('Kapatılan abonelik');
    expect(m.giderler.find((g) => g.kalem === 'Elektrik')).toMatchObject({ eksik: true, tl: 0 });
    expect(m.ozet.odeme.adetOdenen).toBe(3);
  });

  test('kümeler ve aylık seriler tutarlı: toplam = teknoloji + insan + ofis; yıl = 12 ay', () => {
    const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    for (const a of m.aylik) close(a.y2026.toplam, a.y2026.teknoloji + a.y2026.insan + a.y2026.ofis, 0.02);
    close(m.ozet.yil2026.toplam, sum(m.aylik.map((a) => a.y2026.toplam)), 0.1);
    close(m.ozet.buAy.insan, sum(m.kisiler.map((k) => k.y2026.aylar[NOW.getMonth()].maliyet)), 0.05);
    close(m.ozet.buAy.toplam, sum(m.kategoriler.map((k) => k.buAy)), 0.05);
    expect(m.donem).toMatchObject({ yil: 2026, ay: 10, etiket: 'Ekim 2026' });
  });

  test('canlı kur okunamazsa yedek kur; yüzdesiz oran yüzde sayılır; eksik parametre varsayılan', () => {
    const bad = buildModel({ params: { kur_usd: '#N/A', tufe_yillik: 29.73 } });
    expect(bad.kur.USD).toEqual({ deger: PARAM.kur_usd_yedek, kaynak: 'yedek' });
    expect(bad.zam.oran).toBe(0.2973);
    expect(bad.uyarilar.join(' ')).toMatch(/USD\/TRY canlı kuru okunamadı/);
    expect(bad.uyarilar.join(' ')).toMatch(/yüzde olarak alındı/);
    const input = buildInput();
    input.parametreler = input.parametreler!.slice(0, 3);
    const empty = motor.hesapla(input, { simdi: NOW });
    expect(empty.zam.oran).toBe(0.2973);
    expect(empty.uyarilar.filter((u) => /sayfada yok/.test(u))).toHaveLength(motor.PARAMETRE_TANIMLARI.length);
  });

  test('başlık satırı 1. veya 3. satırda okunur; başlık yoksa uyarı', () => {
    const top = motor.hesapla(buildInput({ title: false }), { simdi: NOW });
    expect(top.ozet.buAy.toplam).toBe(m.ozet.buAy.toplam);
    const input = buildInput();
    input.personel = exampleTohum.personel;
    const noHeader = motor.hesapla(input, { simdi: NOW });
    expect(noHeader.kisiler).toHaveLength(0);
    expect(noHeader.uyarilar.join(' ')).toMatch(/personel sayfasında başlık satırı bulunamadı/);
  });
});

test.describe('OPEX motoru: 12 aylık plan', () => {
  test('Ekim 2026’dan başlar: Eki–Ara 2026, Oca–Eyl 2027; her ay kendi yılının aylık hesabı', () => {
    const plan = (m as OpexModel & { plan: Plan }).plan;
    expect(plan.aylar.map((a) => a.ad)).toEqual([
      'Ekim 2026', 'Kasım 2026', 'Aralık 2026', 'Ocak 2027', 'Şubat 2027', 'Mart 2027',
      'Nisan 2027', 'Mayıs 2027', 'Haziran 2027', 'Temmuz 2027', 'Ağustos 2027', 'Eylül 2027',
    ]);
    expect(plan.aylar[0].toplam).toBe(m.aylik[9].y2026.toplam);
    expect(plan.aylar[3].insan).toBe(m.aylik[0].y2027.insan);
    expect(plan.aylar[11].kisa).toBe('Eyl 27');
    close(plan.toplam.toplam, plan.aylar.reduce((t, a) => t + a.toplam, 0), 0.05);
  });

  test('yıl sekmeleri: 2026 dönemi rapor ayından Aralık’a (3 ay), 2027 dönemi 12 ay; motor planıyla aynı aylar', () => {
    const plan = (m as OpexModel & { plan: Plan }).plan;
    const d26 = donemOf(m, 2026);
    const d27 = donemOf(m, 2027);
    expect(d26.etiket).toBe('Ekim – Aralık 2026');
    expect(d26.seri.map((a) => a.ad)).toEqual(['Ekim 2026', 'Kasım 2026', 'Aralık 2026']);
    expect(d27.etiket).toBe('Ocak – Aralık 2027');
    expect(d27.aySayisi).toBe(12);
    expect(d26.seri.map((a) => a.toplam)).toEqual(plan.aylar.slice(0, 3).map((a) => a.toplam));
    expect(d27.seri.slice(0, 9).map((a) => a.toplam)).toEqual(plan.aylar.slice(3).map((a) => a.toplam));
    close(d27.toplam.toplam, m.ozet.yil2027.toplam, 0.05);
    // Kişi dönemi: 2026’da yalnız Ekim–Aralık ayları; kümülatif matrah Ocak’tan gelir.
    const uzman = person(m, 'Örnek Uzman');
    const k26 = kisiDonem(uzman, d26);
    expect(k26.aylar).toHaveLength(3);
    close(k26.toplam.maliyet, uzman.y2026.aylar.slice(9).reduce((t, s) => t + s.maliyet, 0), 0.02);
    expect(k26.toplam.kumulatifMatrah).toBe(uzman.y2026.aylar[11].kumulatifMatrah);
    // Rapor yılı 2027 ise 2026 sekmesi tüm yıl.
    expect(donemOf(buildModel({ params: { rapor_yili: 2027, rapor_ayi: 3 } }), 2026).aySayisi).toBe(12);
  });

  test('Kasım 2027’de başlarsa 2027 sonrası hesaplanmaz (2 ay)', () => {
    const late = buildModel({ params: { rapor_yili: 2027, rapor_ayi: 11 } }) as OpexModel & { plan: Plan };
    expect(late.plan.aylar.map((a) => a.ad)).toEqual(['Kasım 2027', 'Aralık 2027']);
    expect(motor.rapor(late, 'plan').at(-1)?.[0]).toBe('2 ay toplamı');
  });
});

test.describe('OPEX motoru: Sheets raporları', () => {
  const REPORTS = ['kpi', 'ozet', 'kategori', 'aylik', 'kisi', 'bilesen', 'teknoloji', 'kopru', 'plan', 'bordro-2026', 'bordro-2027', 'uyari'];

  test('her rapor dikdörtgen tablo (her satır başlık kadar sütun)', () => {
    for (const ad of REPORTS) {
      const rows = motor.rapor(m, ad);
      expect(rows.length, ad).toBeGreaterThan(1);
      for (const row of rows) expect(row.length, ad).toBe(rows[0].length);
    }
    expect(motor.rapor(m, 'kpi')[2]).toEqual(['Bu ay toplam OPEX', m.ozet.buAy.toplam]);
  });

  test('hizalı sütunlar girdi satırıyla aynı satırda (Personel K, Giderler M)', () => {
    const input = buildInput();
    const p = motor.rapor(m, 'personel-sutun', input);
    expect(p).toHaveLength(input.personel!.length);
    expect(p[2][1]).toBe('Ekim maliyet');
    const row = input.personel!.findIndex((r) => r[0] === 'Örnek Uzman');
    expect(p[row][1]).toBe(person(m, 'Örnek Uzman').y2026.aylar[9].maliyet);
    const excluded = input.personel!.findIndex((r) => r[0] === 'Dahil olmayan kişi');
    expect(p[excluded]).toEqual(['', '', '', '', '']);
    const g = motor.rapor(m, 'gider-sutun', input);
    const sunucu = input.giderler!.findIndex((r) => r[0] === 'Sunucu A');
    expect(g[sunucu][0]).toBe(m.giderler.find((x) => x.kalem === 'Sunucu A')!.tl);
    const closed = input.giderler!.findIndex((r) => r[0] === 'Kapatılan abonelik');
    expect(g[closed]).toEqual(['', '']);
  });

  test('aynı ad iki satırda: uyarı verilir; hizalı sütun her satıra kendi kişisini yazar', () => {
    const rows = [
      ['Aynı Ad', 'Bordrolu', 'Net', 40000, 'Evet', '', 'Otomatik', true, ''],
      ['Aynı Ad', 'Bordrolu', 'Net', 70000, 'Evet', '', 'Otomatik', true, ''],
    ];
    const input = buildInput({ personel: rows, giderler: [] });
    const dup = motor.hesapla(input, { simdi: NOW });
    expect(dup.uyarilar.join(' ')).toMatch(/birden çok satırda \(4 ve 5\)/);
    expect(dup.kisiler.map((k) => k.satir)).toEqual([4, 5]);
    const cols = motor.rapor(dup, 'personel-sutun', input);
    expect(cols[3][1]).toBe(dup.kisiler[0].y2026.aylar[9].maliyet);
    expect(cols[4][1]).toBe(dup.kisiler[1].y2026.aylar[9].maliyet);
    expect(cols[3][1]).not.toBe(cols[4][1]);
  });

  test('bordro raporu: kişi başına 12 ay + yıl toplamı', () => {
    const rows = motor.rapor(m, 'bordro-2026');
    const staff = m.kisiler.filter((k: Kisi) => k.tur === 'Bordrolu');
    expect(rows.length).toBe(1 + staff.length * 13);
    const total = rows.find((r) => r[0] === 'Örnek Uzman' && r[1] === 'Yıl toplamı')!;
    expect(total[14]).toBe((person(m, 'Örnek Uzman').y2026.toplam as Satir).maliyet);
  });
});

/**
 * Sheets aylık ızgarası (kullanıcı kararı 2026-10-20): her ay bir onay kutusu (o ay etkin mi) ve bir tutar sütunu
 * (boş = varsayılan). Ör. bir kişinin Ekim maaşı ile Kasım–Aralık maaşı ayrı; freelancer Ocak–Şubat 2027’de ayrı fatura.
 */
test.describe('OPEX motoru: aylık ızgara (ay ay etkin / tutar)', () => {
  const r2 = (v: number) => Math.round(v * 100) / 100;
  const GIDERLER = [
    ['Kira', '', 'Ofis ve işletme', 'Kira', 'TRY', 1000, 'Kira', false, true, '', ''],
    ['Araç', '', 'Teknoloji', 'Yapay Zekâ', 'USD', 100, 'Kur', false, true, '', ''],
  ];
  const NET = (ad: string, net: number | string, esas = 'Net') => [ad, 'Bordrolu', esas, net, 'Evet', '', 'Otomatik', true, ''];
  const SERBEST = ['Serbest', 'Freelancer', 'Fatura (KDV dahil)', 72000, 'Evet', '', 'Hayır', true, ''];

  test('gider: işaretsiz ay 0; yazılı tutar o ayın tutarı (satırın para birimi × kur); diğer aylar varsayılan', () => {
    const mm = buildModel({ personel: [], giderler: GIDERLER, giderAylari: [{ aktif: { 'Kas 2026': false } }, { tutar: { 'Ara 2026': 50, 'Oca 2027': 200 } }] });
    const [kira, arac] = mm.giderler;
    const usd = mm.kur.USD.deger;
    expect(kira.aylikTl.y2026.slice(9)).toEqual([1000, 0, 1000]);
    expect(kira.aktif.y2026[10]).toBe(false);
    expect(kira.aylikTl.y2026[0], 'ızgarada olmayan ay (Ocak 2026) varsayılan').toBe(1000);
    expect(arac.aylikTl.y2026[11]).toBe(r2(50 * usd));
    expect(arac.ozel.y2026[11]).toBe(true);
    expect(arac.ozel.y2026[10]).toBe(false);
    close(arac.aylikTl.y2027[0], 200 * usd * (1 + mm.artis2027.kur));
    expect(arac.aylikTl.y2027[1], 'boş ay: zamlı 2027 varsayılanı').toBe(arac.tl2027);
    // Aylık seri, 12 aylık plan ve dönem toplamı ay ay tutarlardan
    expect(mm.aylik[10].y2026.ofis).toBe(0);
    expect(mm.aylik[11].y2026.teknoloji).toBe(r2(50 * usd));
    expect((mm as OpexModel & { plan: Plan }).plan.aylar.map((a) => a.ofis).slice(0, 3)).toEqual([1000, 0, 1000]);
    const d26 = donemOf(mm, 2026);
    close(d26.toplam.toplam, 1000 + 0 + 1000 + arac.tl + arac.tl + r2(50 * usd));
  });

  test('bu ay işaretsiz: bu ay OPEX’i, ödeme özeti ve Giderler’deki hizalı sütun o kalemi saymaz', () => {
    const input = buildInput({ personel: [], giderler: GIDERLER, giderAylari: [{ aktif: { 'Eki 2026': false } }, {}] });
    const mm = motor.hesapla(input, { simdi: NOW });
    expect(mm.ozet.buAy.ofis).toBe(0);
    expect(mm.ozet.odeme.adetBekleyen).toBe(1);
    expect(mm.ozet.odeme.bekleyen).toBe(mm.giderler[1].tl);
    const cols = motor.rapor(mm, 'gider-sutun', input);
    expect(cols[2]).toEqual(['Ekim ₺', '2027 ort. ₺']);
    expect(cols[3][0]).toBe(0);
    expect(cols[4][0]).toBe(mm.giderler[1].tl);
    expect(motor.rapor(mm, 'teknoloji').slice(1).map((r) => r[0])).toEqual(['Araç']);
  });

  test('personel: Ekim ile Kasım–Aralık maaşı ayrı (net tutturulur); freelancer Ocak–Şubat 2027 ayrı fatura, Mart yok', () => {
    const mm = buildModel({
      personel: [NET('Kişi A', 50000), SERBEST],
      giderler: [],
      personelAylari: [{ tutar: { 'Kas 2026': 60000, 'Ara 2026': 60000 } }, { tutar: { 'Oca 2027': 90000, 'Şub 2027': 95000 }, aktif: { 'Mar 2027': false } }],
    });
    const [a, s] = mm.kisiler;
    close(a.y2026.aylar[9].net, 50000);
    close(a.y2026.aylar[10].net, 60000);
    close(a.y2026.aylar[11].net, 60000);
    expect(a.ozel.y2026.slice(9)).toEqual([false, true, true]);
    close(a.y2027.aylar[0].net, a.tutar2027);
    expect(s.y2026.aylar[9].fatura).toBe(72000);
    expect(s.y2027.aylar.slice(0, 4).map((x) => x.fatura)).toEqual([90000, 95000, 0, s.tutar2027]);
    expect(s.y2027.aylar[2].maliyet).toBe(0);
    expect(s.aktif.y2027[2]).toBe(false);
    expect(mm.aylik[2].y2027.insan, 'Mart 2027: yalnız bordrolu').toBe(a.y2027.aylar[2].maliyet);
  });

  test('bordro: işaretsiz ayda brüt ve maliyet 0, kümülatif matrah birikmez; asgari ücretliye yazılan tutar net sayılır', () => {
    const mm = buildModel({ personel: [NET('Kişi A', 50000), NET('Asgari', '', 'Asgari ücret')], giderler: [], personelAylari: [{ aktif: { 'Kas 2026': false } }, { tutar: { 'Kas 2026': 40000 } }] });
    const rows = mm.kisiler[0].y2026.aylar;
    expect(rows[10].brut).toBe(0);
    expect(rows[10].maliyet).toBe(0);
    expect(rows[10].kumulatifMatrah).toBe(rows[9].kumulatifMatrah);
    close(rows[11].net, 50000);
    const asgari = mm.kisiler[1].y2026.aylar;
    expect(asgari[9].brut).toBe(mm.asgari.y2026.brut);
    close(asgari[10].net, 40000);
    expect(asgari[11].brut).toBe(mm.asgari.y2026.brut);
  });

  test('Sheets formülünün yazdığı varsayılan tutar özel sayılmaz; farklı tutar özeldir; 0 yazılan ay ödeme yok', () => {
    const usd = buildModel({ personel: [], giderler: GIDERLER }).kur.USD.deger;
    const kira27 = Math.round(1000 * (1 + PARAM.kira_artis_2027) * 100) / 100;
    const mm = buildModel({
      personel: [NET('Kişi A', 50000), SERBEST],
      giderler: GIDERLER,
      // Formül sonucu: 2026 = Tutar, 2027 kira = Tutar × (1 + kira artışı), Kur esaslı döviz = aynı döviz tutarı
      giderAylari: [{ tutar: { 'Eki 2026': 1000, 'Oca 2027': kira27 } }, { tutar: { 'Eki 2026': 100, 'Oca 2027': 100, 'Şub 2027': 120 } }],
      personelAylari: [{ tutar: { 'Eki 2026': 50000, 'Kas 2026': 0 } }, { tutar: { 'Oca 2027': Math.round(72000 * (1 + PARAM.zam_orani) * 100) / 100 } }],
    });
    const [kira, arac] = mm.giderler;
    expect([kira.ozel.y2026[9], kira.ozel.y2027[0], arac.ozel.y2026[9], arac.ozel.y2027[0]]).toEqual([false, false, false, false]);
    expect(kira.aylikTl.y2027[0]).toBe(kira.tl2027);
    expect(arac.ozel.y2027[1]).toBe(true);
    expect(arac.aylikTl.y2027[1]).toBe(Math.round(120 * usd * (1 + mm.artis2027.kur) * 100) / 100);
    const [a, s] = mm.kisiler;
    expect(a.ozel.y2026[9]).toBe(false);
    expect(a.ozel.y2026[10]).toBe(true);
    expect(a.y2026.aylar[10].maliyet, '0 yazılan ay').toBe(0);
    expect(a.y2026.aylar[10].kumulatifMatrah).toBe(a.y2026.aylar[9].kumulatifMatrah);
    expect(s.ozel.y2027[0]).toBe(false);
    expect(s.y2027.aylar[0].fatura).toBe(s.tutar2027);
  });

  test('brüt esaslı kişide ay tutarı brüttür; 2027 asgari ücretlide yazılan tutar net, varsayılan o yılın asgarisi', () => {
    const mm = buildModel({
      personel: [NET('Brütlü', 60000, 'Brüt'), NET('Asgari', '', 'Asgari ücret')],
      giderler: [],
      personelAylari: [{ tutar: { 'Ara 2026': 65000 } }, { tutar: { 'Şub 2027': 41000, 'Oca 2027': buildModel().asgari.y2027.net } }],
    });
    const [b, asg] = mm.kisiler;
    expect(b.y2026.aylar[10].brut).toBe(60000);
    expect(b.y2026.aylar[11].brut).toBe(65000);
    expect(asg.y2027.aylar[0].brut, 'asgari net yazılırsa tam asgari brüt').toBe(mm.asgari.y2027.brut);
    expect(asg.ozel.y2027[0]).toBe(false);
    close(asg.y2027.aylar[1].net, 41000);
    expect(asg.ozel.y2027[1]).toBe(true);
  });

  test('Sheets başlığı tarihe çevirmişse (Mar 2027) o ayın onay kutusu yine okunur; büyük-küçük harf fark etmez', async () => {
    const { izgara, IZGARA_BASLIKLARI } = await import('./opex-fixture');
    const basliklar = IZGARA_BASLIKLARI.map((h) => (h === 'Mar 2027' ? new Date(2027, 2, 1) : h === 'Nis 2027' ? 'nis 2027' : h));
    const input = buildInput({ personel: [], giderler: GIDERLER });
    input.giderAylari = izgara([{ aktif: { 'Mar 2027': false, 'Nis 2027': false } }, {}], basliklar);
    const mm = motor.hesapla(input, { simdi: NOW });
    expect(mm.giderler[0].aylikTl.y2027.slice(1, 5)).toEqual([mm.giderler[0].tl2027, 0, 0, mm.giderler[0].tl2027]);
  });

  test('ızgara yoksa her ay etkin ve varsayılan tutar (eski Sheets kurulumu)', () => {
    for (const g of m.giderler) {
      expect(g.aylikTl.y2026).toEqual(Array(12).fill(g.tl));
      expect(g.aylikTl.y2027).toEqual(Array(12).fill(g.tl2027));
      expect([...g.aktif.y2026, ...g.aktif.y2027].every(Boolean)).toBe(true);
    }
    for (const k of m.kisiler) expect([...k.ozel.y2026, ...k.ozel.y2027].some(Boolean)).toBe(false);
  });
});
