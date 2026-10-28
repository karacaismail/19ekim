// Affilate hesap motoru testleri (docs/affilate.md §12.1 M01–M44, §12.3; kullanıcı kararı 28 Ekim).
// Tarayıcıdan bağımsız: yalnız Chromium projesinde bir kez çalışır (playwright.config testIgnore).
// Para kuruş, oran baz puan: 100 TL = 10_000 kuruş; %15 = 1500 bp. Beklenen sonuçlar belgedeki bağımsız örneklerdir.
import { expect, test } from '@playwright/test';
import {
  ayEkle,
  baslangicFiyat,
  baslangicOrtaklar,
  dogrula,
  faturaUret,
  hesapla,
  karsilastir,
  paketFiyati,
  paketIndirimiBp,
  aylikEsdeger,
  taksitDagit,
  type Fatura,
  type MusteriGrubu,
  type OrtakId,
  type Senaryo,
  type Sonuc,
  type Tahsilat,
} from '../src/data/affilate';

const TL = (x: number) => Math.round(x * 100);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

function musteri(over: Partial<MusteriGrubu> = {}): MusteriGrubu {
  return { id: 'a', ad: 'Müşteri A', adet: 1, baslangic: '2027-01-01', odeme: 'paket', ortak: 'satis', iptalHizmetAyi: null, destekVarsayilan: 'aktif', ...over };
}

function senaryo(over: Partial<Senaryo> = {}, musteriOver: Partial<MusteriGrubu> = {}): Senaryo {
  return { ufukAy: 13, fiyat: baslangicFiyat(), ortaklar: baslangicOrtaklar(), musteriler: [musteri(musteriOver)], iadeler: [], destek: [], ...over };
}

const hakedis = (r: Sonuc, f?: (h: Sonuc['hareketler'][number]) => boolean) => sum(r.hareketler.filter((h) => h.tur === 'hakedis' && (!f || f(h))).map((h) => h.tutar));
const duzeltme = (r: Sonuc) => sum(r.hareketler.filter((h) => h.tur === 'duzeltme').map((h) => h.tutar));
const ortak = (r: Sonuc, id: OrtakId) => r.ortaklar.find((o) => o.ortak === id)!;
const fatura = (over: Partial<Fatura>): Fatura => ({ id: 'f1', musteri: 'a', tarih: '2027-01-01', hizmetBaslangic: '2027-01-01', hizmetAy: 1, tutar: TL(100), haric: 0, ...over });
const tahsilat = (over: Partial<Tahsilat>): Tahsilat => ({ id: 't1', faturaId: 'f1', tarih: '2027-01-01', tutar: TL(100), ...over });

test.describe('Affilate motoru — ilk fatura ve süreli kapsam', () => {
  test('M01/M02: ilk fatura 100 TL %10 → Ayşe 10 TL; ikinci fatura ek 0', () => {
    const r = hesapla(senaryo({ ufukAy: 12 }, { ortak: 'ayse', odeme: 'aylik' }));
    expect(r.hatalar).toEqual([]);
    expect(hakedis(r, (h) => h.faturaId === 'a-f1')).toBe(TL(10));
    expect(hakedis(r, (h) => h.faturaId !== 'a-f1')).toBe(0);
    expect(ortak(r, 'ayse').netHakedis).toBe(TL(10));
  });

  test('M03: ilk yıllık fatura 1.000 TL %10 → toplam 100 TL (83,33 TL değil)', () => {
    const r = hesapla(senaryo({}, { ortak: 'ayse' }));
    expect(ortak(r, 'ayse').netHakedis).toBe(TL(100));
    expect(ortak(r, 'ayse').netHakedis).not.toBe(TL(83.33));
    // Aylık eşdeğer ayrı bir kavramdır (fiyatın 12’ye bölümü), komisyon değildir.
    expect(aylikEsdeger(baslangicFiyat())).toBe(8333);
  });

  test('M04: satış ortağı aylık 100 TL %15 → uygun ay 15 TL (hizmet ayı sonunda)', () => {
    const r = hesapla(senaryo({ ufukAy: 3 }, { odeme: 'aylik' }));
    const ilk = r.hareketler.filter((h) => h.tur === 'hakedis' && h.faturaId === 'a-f1');
    expect(ilk).toHaveLength(1);
    expect(ilk[0].tutar).toBe(TL(15));
    expect(ilk[0].ay).toBe('2027-02'); // 1 Ocak–1 Şubat hizmet ayı; hareket Şubat raporunda
    expect(ilk[0].hizmetAyi).toBe(0);
  });

  test('M05: satış ortağı yıllık 1.000 TL %15, 12 uygun ay → 150 TL; aylık 12,50 TL', () => {
    const r = hesapla(senaryo());
    const aylik = r.hareketler.filter((h) => h.tur === 'hakedis').map((h) => h.tutar);
    expect(aylik).toHaveLength(12);
    expect(new Set(aylik)).toEqual(new Set([TL(12.5)]));
    expect(ortak(r, 'satis').netHakedis).toBe(TL(150));
  });

  test('M06: çözüm ortağı yıllık 1.000 TL %25 → 250 TL; 8 × 20,83 + 4 × 20,84 kuruş dengeli', () => {
    const r = hesapla(senaryo({}, { ortak: 'cozum' }));
    const aylik = r.hareketler.filter((h) => h.tur === 'hakedis').map((h) => h.tutar);
    expect(sum(aylik)).toBe(TL(250));
    expect(aylik.filter((x) => x === 2083)).toHaveLength(8);
    expect(aylik.filter((x) => x === 2084)).toHaveLength(4);
    expect(aylik.map((x, i) => (x === 2084 ? i + 1 : 0)).filter(Boolean)).toEqual([2, 5, 8, 11]);
  });

  test('M07: ikinci dönem aylık 100 TL → %10 = 10 TL; birinci dönem oranı sürmez', () => {
    const r = hesapla(senaryo({ ufukAy: 15 }, { odeme: 'aylik' }));
    expect(hakedis(r, (h) => h.faturaId === 'a-f12')).toBe(TL(15)); // hizmet ayı 12 (1 tabanlı) hâlâ 1. dönem
    expect(hakedis(r, (h) => h.faturaId === 'a-f13')).toBe(TL(10)); // 13. ay → 2. dönem
  });

  test('M08: üçüncü dönem %0 → yeni hakediş 0; eski ödenecek bakiye silinmez', () => {
    const s = senaryo({ ufukAy: 36 }, { odeme: 'aylik' });
    s.ortaklar.satis.gecikmeAy = 24; // ödemeler gecikir, bakiye birikir
    const r = hesapla(s);
    expect(hakedis(r, (h) => h.ay >= '2029-02')).toBe(0); // 25.–36. hizmet ayları (3. dönem)
    expect(ortak(r, 'satis').netHakedis).toBe(TL(180 + 120));
    expect(ortak(r, 'satis').odenen + ortak(r, 'satis').odenecek).toBe(TL(300));
    expect(ortak(r, 'satis').odenecek).toBeGreaterThan(0);
  });

  test('M09: çözüm ortağı 2. oran %15 → %10; yıllık 1.000 TL → dönem 150 → 100, 36 ay 400 → 350', () => {
    const once = hesapla(senaryo({ ufukAy: 36 }, { ortak: 'cozum' }));
    expect(ortak(once, 'cozum').netHakedis).toBe(TL(400));
    expect(hakedis(once, (h) => h.faturaId === 'a-f2')).toBe(TL(150));
    const s = senaryo({ ufukAy: 36 }, { ortak: 'cozum' });
    s.ortaklar.cozum.donemler[1].oranBp = 1000;
    const sonra = hesapla(s);
    expect(hakedis(sonra, (h) => h.faturaId === 'a-f2')).toBe(TL(100));
    expect(ortak(sonra, 'cozum').netHakedis).toBe(TL(350));
  });

  test('§9.2: satış ve çözüm ortağı 36 ay, aylık model 300 / 480 TL; yıllık 250 / 400 TL', () => {
    expect(ortak(hesapla(senaryo({ ufukAy: 36 }, { odeme: 'aylik' })), 'satis').netHakedis).toBe(TL(300));
    expect(ortak(hesapla(senaryo({ ufukAy: 36 }, { odeme: 'aylik', ortak: 'cozum' })), 'cozum').netHakedis).toBe(TL(480));
    expect(ortak(hesapla(senaryo({ ufukAy: 36 })), 'satis').netHakedis).toBe(TL(250));
    expect(ortak(hesapla(senaryo({ ufukAy: 36 }, { ortak: 'ayse' })), 'ayse').netHakedis).toBe(TL(100));
    expect(ortak(hesapla(senaryo({ ufukAy: 36 }, { ortak: 'ayse', odeme: 'aylik' })), 'ayse').netHakedis).toBe(TL(10));
  });
});

test.describe('Affilate motoru — fiyat, dağıtım ve politika', () => {
  test('M10: 100 TL × 10 aylık ücret → paket 1.000 TL; indirim ≈ %16,67', () => {
    const f = baslangicFiyat();
    expect(paketFiyati(f)).toBe(TL(1000));
    expect(paketIndirimiBp(f)).toBe(1667);
  });

  test('M11: indirim %0 → paket 1.200 TL; süreli %15 iki fatura düzeninde de 180 TL', () => {
    const fiyat = { ...baslangicFiyat(), kaynak: 'indirim' as const, indirimBp: 0 };
    expect(paketFiyati(fiyat)).toBe(TL(1200));
    expect(ortak(hesapla(senaryo({ fiyat })), 'satis').netHakedis).toBe(TL(180));
    expect(ortak(hesapla(senaryo({ fiyat }, { odeme: 'aylik' })), 'satis').netHakedis).toBe(TL(180));
  });

  test('M12: Ayşe ilk fatura %10 yerine 12 ay süreli %10 → aylık model 10 → 120 TL', () => {
    const s = senaryo({ ufukAy: 12 }, { ortak: 'ayse', odeme: 'aylik' });
    expect(ortak(hesapla(s), 'ayse').netHakedis).toBe(TL(10));
    s.ortaklar.ayse.kapsam = 'sureli';
    expect(ortak(hesapla(s), 'ayse').netHakedis).toBe(TL(120));
  });

  test('M13/M14: 100 TL / 12 taksit → 8 × 8,33 + 4 × 8,34 (2., 5., 8., 11.); 10 taksit → 10 × 10 TL', () => {
    const on2 = taksitDagit(TL(100), 12);
    expect(sum(on2)).toBe(TL(100));
    expect(on2.filter((x) => x === 833)).toHaveLength(8);
    expect(on2.map((x, i) => (x === 834 ? i + 1 : 0)).filter(Boolean)).toEqual([2, 5, 8, 11]);
    expect(taksitDagit(TL(100), 10)).toEqual(Array(10).fill(TL(10)));
    expect(taksitDagit(TL(150), 12)).toEqual(Array(12).fill(TL(12.5)));
    expect(sum(taksitDagit(TL(250), 12))).toBe(TL(250));
  });

  test('M15: fatura var, ödeme yok → kazanılan ve ödenebilir 0; tahmin (planlanan) ayrı', () => {
    const r = hesapla(senaryo({ ufukAy: 12, tahsilatlar: [] }));
    const o = ortak(r, 'satis');
    expect(o.netHakedis).toBe(0);
    expect(o.odenecek).toBe(0);
    expect(o.odenen).toBe(0);
    expect(o.planlanan).toBe(TL(150));
    expect(o.kosullu).toBe(TL(150));
    expect(r.musteriler[0].tahsilat).toBe(0);
  });

  test('M16: Ayşe 100 TL ilk fatura; 40 + 60 TL kısmi tahsilat → 4 TL ve ek 6 TL', () => {
    const r = hesapla(
      senaryo(
        { ufukAy: 3, faturalar: [fatura({})], tahsilatlar: [tahsilat({ id: 't1', tutar: TL(40), tarih: '2027-01-05' }), tahsilat({ id: 't2', tutar: TL(60), tarih: '2027-02-10' })] },
        { ortak: 'ayse', odeme: 'aylik' },
      ),
    );
    expect(r.hareketler.filter((h) => h.tur === 'hakedis').map((h) => h.tutar)).toEqual([TL(4), TL(6)]);
    expect(ortak(r, 'ayse').netHakedis).toBe(TL(10));
  });

  test('M17: yıllık 1.000 TL; 400 TL tahsilat; %15; aylık kazanma → bağlı toplam 60 TL; ilk ay 5 TL', () => {
    const r = hesapla(senaryo({ faturalar: [fatura({ hizmetAy: 12, tutar: TL(1000) })], tahsilatlar: [tahsilat({ tutar: TL(400) })] }));
    expect(r.musteriler[0].tahsilataBagli).toBe(TL(60));
    expect(r.hareketler.filter((h) => h.tur === 'hakedis')[0].tutar).toBe(TL(5));
    expect(r.musteriler[0].komisyonBazi).toBe(TL(400));
  });

  test('M18: kalan 600 TL üçüncü hizmet ayı sonunda gelir → o ay ek 27,50 TL; toplam 37,50 TL', () => {
    const r = hesapla(
      senaryo({
        ufukAy: 4,
        faturalar: [fatura({ hizmetAy: 12, tutar: TL(1000) })],
        tahsilatlar: [tahsilat({ tutar: TL(400) }), tahsilat({ id: 't2', tutar: TL(600), tarih: '2027-04-01' })],
      }),
    );
    expect(hakedis(r, (h) => h.ay < '2027-04')).toBe(TL(10));
    expect(hakedis(r, (h) => h.ay === '2027-04')).toBe(TL(27.5));
    expect(ortak(r, 'satis').netHakedis).toBe(TL(37.5));
    // Geçmiş aylara nakit eklenmez: hareketler tahsilat tarihinde doğar.
    expect(r.hareketler.filter((h) => h.tur === 'hakedis' && h.ay < '2027-04').map((h) => h.tutar)).toEqual([TL(5), TL(5)]);
  });

  test('M19/M35: tahsilatta kazan / 12 taksit → hakediş 150 TL; ilk taksit 12,50; kalan 137,50 ufuktan sonra korunur', () => {
    const s = senaryo({ ufukAy: 1 });
    s.ortaklar.satis.politika = 'tahsilatta-taksit';
    const r = hesapla(s);
    const o = ortak(r, 'satis');
    expect(o.netHakedis).toBe(TL(150));
    expect(o.odenen).toBe(TL(12.5));
    expect(o.odenecek).toBe(TL(137.5));
    expect(r.sonrasi[0].odenecek).toBe(TL(137.5));
    // Taksit sayısı toplamı değiştirmez (§12.3).
    s.ortaklar.satis.taksit = 6;
    const r6 = hesapla(s);
    expect(ortak(r6, 'satis').netHakedis).toBe(TL(150));
    expect(ortak(r6, 'satis').odenen).toBe(TL(25));
  });

  test('M20: aynı örnek aylık kazanmada → ilk ay 12,50 TL hakediş; 137,50 TL gelecek koşullara bağlı', () => {
    const r = hesapla(senaryo({ ufukAy: 2 }));
    const o = ortak(r, 'satis');
    expect(o.netHakedis).toBe(TL(12.5));
    expect(o.kosullu).toBe(TL(137.5));
    expect(o.odenecek + o.odenen).toBe(TL(12.5)); // koşullu tutar ödenecek bakiyeye eklenmez
  });
});

test.describe('Affilate motoru — dönem sınırı, destek, iade, iptal', () => {
  test('M21: müşteri 15 Mart’ta başlar → 1 Ocak oran değiştirmez; sonraki 15 Mart ikinci dönem', () => {
    const r = hesapla(senaryo({ ufukAy: 16 }, { odeme: 'aylik', baslangic: '2027-03-15' }));
    expect(hakedis(r, (h) => h.faturaId === 'a-f10')).toBe(TL(15)); // 15 Ara–15 Oca hizmeti, Ocak’ta kazanılır, %15 sürer
    expect(hakedis(r, (h) => h.faturaId === 'a-f12')).toBe(TL(15)); // 15 Şub–15 Mar: hâlâ 1. dönem
    expect(hakedis(r, (h) => h.faturaId === 'a-f13')).toBe(TL(10)); // 15 Mar 2028’den itibaren 2. dönem
  });

  test('M22: birinci dönem hizmeti, tahsilat ikinci dönemde → birinci dönem oranı korunur', () => {
    const r = hesapla(
      senaryo({
        ufukAy: 16,
        faturalar: [fatura({ id: 'f12', tarih: '2027-12-01', hizmetBaslangic: '2027-12-01' })],
        tahsilatlar: [tahsilat({ id: 't12', faturaId: 'f12', tarih: '2028-02-15' })],
      }),
    );
    const h = r.hareketler.filter((x) => x.tur === 'hakedis');
    expect(h).toHaveLength(1);
    expect(h[0].tutar).toBe(TL(15));
    expect(h[0].ay).toBe('2028-02'); // nakit geldiği ay kazanılır, oran hizmet dönemine göre
  });

  test('M23: 1.200 TL paket; 12 ayın 6’sı %15, 6’sı %10 → 150 TL; bütün faturaya tek oran uygulanmaz', () => {
    const s = senaryo({ fiyat: { ...baslangicFiyat(), kaynak: 'indirimsiz' } });
    s.ortaklar.satis.donemler = [{ ay: 6, oranBp: 1500 }, { ay: 6, oranBp: 1000 }, { ay: 12, oranBp: 0 }];
    const r = hesapla(s);
    expect(ortak(r, 'satis').netHakedis).toBe(TL(150));
    expect(ortak(r, 'satis').netHakedis).not.toBe(TL(180));
    expect(ortak(r, 'satis').netHakedis).not.toBe(TL(120));
  });

  test('M24: çözüm ortağı aylık %25; destek sağlanmadı → ilgili ay 0 TL; gerekçe hareket açıklamasında', () => {
    const r = hesapla(senaryo({ ufukAy: 3, destek: [{ musteri: 'a', hizmetAyi: 0, durum: 'saglanmadi' }] }, { ortak: 'cozum', odeme: 'aylik' }));
    expect(hakedis(r, (h) => h.faturaId === 'a-f1')).toBe(0);
    expect(hakedis(r, (h) => h.faturaId === 'a-f2')).toBe(TL(25));
    const not = r.hareketler.find((h) => h.faturaId === 'a-f1' && h.tur === 'bekleyen');
    expect(not?.aciklama).toContain('destek sağlanmadı');
    expect(not?.tutar).toBe(0);
  });

  test('M25: destek belirsiz + beklet → 25 TL koşullu/bekleyen; kazanılmış borç değil', () => {
    const s = senaryo({ ufukAy: 3, destek: [{ musteri: 'a', hizmetAyi: 0, durum: 'belirsiz' }] }, { ortak: 'cozum', odeme: 'aylik' });
    s.ortaklar.cozum.destekIhlali = 'beklet';
    const r = hesapla(s);
    const o = ortak(r, 'cozum');
    expect(o.bekleyen).toBe(TL(25));
    expect(hakedis(r, (h) => h.faturaId === 'a-f1')).toBe(0);
    expect(o.netHakedis).toBe(TL(25)); // yalnız ikinci ay
    expect(o.odenen).toBe(TL(25));
    expect(r.hareketler.find((h) => h.tur === 'bekleyen' && h.tutar === TL(25))?.aciklama).toContain('bekleniyor');
  });

  test('M26: 3 ay 37,50 TL ödenmiş; 200 TL iade → net 30 TL; −7,50 düzeltme; 7,50 geri alınacak', () => {
    const r = hesapla(
      senaryo({
        ufukAy: 4,
        faturalar: [fatura({ hizmetAy: 12, tutar: TL(1000) })],
        tahsilatlar: [tahsilat({ tutar: TL(1000) })],
        iadeler: [{ id: 'i1', faturaId: 'f1', tarih: '2027-04-10', tutar: TL(200) }],
      }),
    );
    const o = ortak(r, 'satis');
    expect(hakedis(r)).toBe(TL(37.5));
    expect(duzeltme(r)).toBe(-TL(7.5));
    expect(o.netHakedis).toBe(TL(30));
    expect(o.odenen).toBe(TL(37.5));
    expect(o.geriAlinacak).toBe(TL(7.5));
    expect(o.odenecek).toBe(0);
    expect(r.hareketler.find((h) => h.tur === 'duzeltme')?.ay).toBe('2027-04');
  });

  test('M27: komisyonu ödenmiş ilk fatura tamamen iade → net 0; ödenen geri alınacak; yeni ilk fatura hakkı yok', () => {
    const r = hesapla(
      senaryo({
        ufukAy: 3,
        faturalar: [fatura({}), fatura({ id: 'f2', tarih: '2027-02-01', hizmetBaslangic: '2027-02-01' }), fatura({ id: 'f3', tarih: '2027-03-01', hizmetBaslangic: '2027-03-01' })],
        tahsilatlar: [tahsilat({}), tahsilat({ id: 't2', faturaId: 'f2', tarih: '2027-02-01' }), tahsilat({ id: 't3', faturaId: 'f3', tarih: '2027-03-01' })],
        iadeler: [{ id: 'i1', faturaId: 'f1', tarih: '2027-02-15', tutar: TL(100) }],
      }, { ortak: 'ayse', odeme: 'aylik' }),
    );
    const o = ortak(r, 'ayse');
    expect(hakedis(r)).toBe(TL(10));
    expect(duzeltme(r)).toBe(-TL(10));
    expect(o.netHakedis).toBe(0);
    expect(o.odenen).toBe(TL(10));
    expect(o.geriAlinacak).toBe(TL(10));
    expect(hakedis(r, (h) => h.faturaId !== 'f1')).toBe(0);
  });

  test('M28: iptal, iade yok, tahsilatta kazanma → gelecek fatura yok; kazanılmış taksitler korunur', () => {
    const s = senaryo({ ufukAy: 24 }, { iptalHizmetAyi: 6 });
    s.ortaklar.satis.politika = 'tahsilatta-taksit';
    const r = hesapla(s);
    expect(r.hareketler.filter((h) => h.tur === 'fatura')).toHaveLength(1); // ikinci yıl faturası kesilmez
    expect(ortak(r, 'satis').netHakedis).toBe(TL(150));
    expect(duzeltme(r)).toBe(0);
    expect(ortak(r, 'satis').odenen).toBe(TL(150));
  });

  test('M29: abonelik üç ay sonunda biter; aylık kazanma; yıllık 1.000/%15 → 37,50 TL korunur; sonrası kazandırmaz', () => {
    const r = hesapla(senaryo({ ufukAy: 14 }, { iptalHizmetAyi: 3 }));
    expect(ortak(r, 'satis').netHakedis).toBe(TL(37.5));
    expect(duzeltme(r)).toBe(0);
    expect(hakedis(r, (h) => h.ay > '2027-04')).toBe(0);
    expect(r.hareketler.filter((h) => h.tur === 'bekleyen' && h.aciklama.includes('iptal'))).toHaveLength(9);
  });

  test('M30: aynı tahsilat / iade kimliği iki kez işlenir → toplam değişmez', () => {
    const r = hesapla(
      senaryo(
        { ufukAy: 3, faturalar: [fatura({})], tahsilatlar: [tahsilat({}), tahsilat({})], iadeler: [{ id: 'i1', faturaId: 'f1', tarih: '2027-02-01', tutar: TL(20) }, { id: 'i1', faturaId: 'f1', tarih: '2027-02-01', tutar: TL(20) }] },
        { ortak: 'ayse', odeme: 'aylik' },
      ),
    );
    expect(r.hatalar).toEqual([]);
    expect(r.musteriler[0].tahsilat).toBe(TL(100));
    expect(r.musteriler[0].iade).toBe(TL(20));
    expect(ortak(r, 'ayse').netHakedis).toBe(TL(8));
  });

  test('M31: %0 → %7,5; ilk fatura 100 TL → 0 → 7,50 TL (sıfır oran geçerli ve düzenlenebilir)', () => {
    const s = senaryo({ ufukAy: 1 }, { ortak: 'ayse', odeme: 'aylik' });
    s.ortaklar.ayse.donemler[0].oranBp = 0;
    expect(hesapla(s).hatalar).toEqual([]);
    expect(ortak(hesapla(s), 'ayse').netHakedis).toBe(0);
    s.ortaklar.ayse.donemler[0].oranBp = 750;
    expect(ortak(hesapla(s), 'ayse').netHakedis).toBe(TL(7.5));
  });
});

test.describe('Affilate motoru — portföy, karşılaştırma ve değişmezler', () => {
  // Yalnız ilk yıl: 12. hizmet ayından sonra yenileme yok (ufuk 13, on ikinci ayın sonu dahil).
  const portfoy = (ufukAy: number): Senaryo =>
    senaryo({
      ufukAy,
      musteriler: [musteri({ id: 'a', ortak: 'ayse', iptalHizmetAyi: 12 }), musteri({ id: 'b', ad: 'Müşteri B', ortak: 'satis', iptalHizmetAyi: 12 }), musteri({ id: 'c', ad: 'Müşteri C', ortak: 'cozum', iptalHizmetAyi: 12 })],
    });

  test('M32 / §9.3: üç yıllık müşteri, üç ortak → ilk yıl 500 TL, komisyon sonrası 2.500 TL; ilk ay 133,33 TL, kalan 366,67 TL', () => {
    const yil = hesapla(portfoy(13));
    expect(yil.segika[0].netHakedis).toBe(TL(500));
    expect(yil.segika[0].komisyonSonrasi).toBe(TL(2500));
    expect(yil.segika[0].komisyonBazi).toBe(TL(3000));
    const ilkAy = hesapla(portfoy(2));
    expect(ilkAy.segika[0].netHakedis).toBe(TL(133.33));
    expect(ilkAy.segika[0].odeme).toBe(TL(133.33));
    expect(ilkAy.segika[0].kosullu).toBe(TL(366.67));
    // Portföy toplamı alt kayıtların toplamına eşittir (§8.2/11).
    expect(sum(yil.musteriler.map((m) => m.netHakedis))).toBe(yil.segika[0].netHakedis);
  });

  test('M33: aynı tek müşteri, üç alternatif ortak → üç ayrı sonuç; %50 toplam üretilmez', () => {
    const s = senaryo();
    const k = karsilastir(s, 'a');
    expect(ortak(k.ayse, 'ayse').netHakedis).toBe(TL(100));
    expect(ortak(k.satis, 'satis').netHakedis).toBe(TL(150));
    expect(ortak(k.cozum, 'cozum').netHakedis).toBe(TL(250));
    expect(hesapla(s).segika[0].netHakedis).toBe(TL(150)); // portföyde yalnız atanmış ortak
  });

  test('M34: 31 Ocak başlangıcı → Şubat sonu ve 31 Mart; kalıcı 28’e kayma yok', () => {
    expect(ayEkle('2027-01-31', 1)).toBe('2027-02-28');
    expect(ayEkle('2027-01-31', 2)).toBe('2027-03-31');
    expect(ayEkle('2028-01-31', 1)).toBe('2028-02-29');
    expect(ayEkle('2027-01-31', 12)).toBe('2028-01-31');
    const f = faturaUret(musteri({ baslangic: '2027-01-31', odeme: 'aylik' }), baslangicFiyat(), '2027-05-01');
    expect(f.map((x) => x.tarih)).toEqual(['2027-01-31', '2027-02-28', '2027-03-31', '2027-04-30']);
  });

  test('M36/M42/M44: 120 TL fatura, 20 TL hariç → baz 100 TL, %15 = 15 TL; 60 TL tahsilatta baz 50 / 7,50; nakit 105 ≠ komisyon sonrası 85', () => {
    const s = senaryo({ ufukAy: 2, faturalar: [fatura({ tutar: TL(120), haric: TL(20) })], tahsilatlar: [tahsilat({ tutar: TL(120) })] });
    s.ortaklar.satis.politika = 'tahsilatta';
    const tam = hesapla(s);
    expect(tam.musteriler[0].komisyonBazi).toBe(TL(100));
    expect(ortak(tam, 'satis').netHakedis).toBe(TL(15));
    expect(tam.segika[0].nakit).toBe(TL(105));
    expect(tam.segika[0].komisyonSonrasi).toBe(TL(85));
    const kismi = hesapla({ ...s, tahsilatlar: [tahsilat({ tutar: TL(60) })] });
    expect(kismi.musteriler[0].komisyonBazi).toBe(TL(50));
    expect(ortak(kismi, 'satis').netHakedis).toBe(TL(7.5));
  });

  test('M37: negatif tutar, %101, boş giriş, sıfır taksit, geçersiz tarih → alan hatası; motor hesap üretmez', () => {
    const bozuk: ((s: Senaryo) => void)[] = [
      (s) => (s.fiyat.aylik = -1),
      (s) => (s.ortaklar.satis.donemler[0].oranBp = 10_100),
      (s) => (s.fiyat.aylik = Number.NaN),
      (s) => (s.ortaklar.satis.taksit = 0),
      (s) => (s.musteriler[0].baslangic = '2027-02-30'),
      (s) => (s.ortaklar.satis.gecikmeAy = -1),
      (s) => (s.ufukAy = 0),
    ];
    for (const boz of bozuk) {
      const s = senaryo();
      boz(s);
      expect(dogrula(s).length).toBeGreaterThan(0);
      const r = hesapla(s);
      expect(r.hatalar.length).toBeGreaterThan(0);
      expect(r.hareketler).toEqual([]);
      expect(r.aylar).toEqual([]);
    }
    expect(dogrula(senaryo())).toEqual([]);
    // Fazla tahsilat bu sürümde hatadır (§6).
    expect(dogrula(senaryo({ faturalar: [fatura({})], tahsilatlar: [tahsilat({ tutar: TL(120) })] })).join(' ')).toContain('aşıyor');
  });

  test('M38: TRY ve EUR müşteri grupları → ayrı toplamlar; doğrudan toplama yok', () => {
    const r = hesapla(senaryo({ musteriler: [musteri({ id: 'a' }), musteri({ id: 'e', ad: 'Müşteri E', paraBirimi: 'EUR' })] }));
    expect(r.segika.map((x) => x.paraBirimi).sort()).toEqual(['EUR', 'TRY']);
    expect(r.segika.find((x) => x.paraBirimi === 'TRY')?.netHakedis).toBe(TL(150));
    expect(r.segika.find((x) => x.paraBirimi === 'EUR')?.netHakedis).toBe(TL(150));
    expect(r.ortaklar.filter((o) => o.ortak === 'satis')).toHaveLength(2);
  });

  test('M39: ilk pozitif fatura ödenmemiş, ikincisi önce ödenmiş → Ayşe için ikinci fatura ilk sayılmaz', () => {
    const faturalar = [fatura({}), fatura({ id: 'f2', tarih: '2027-02-01', hizmetBaslangic: '2027-02-01' })];
    const odenmemis = hesapla(senaryo({ ufukAy: 4, faturalar, tahsilatlar: [tahsilat({ id: 't2', faturaId: 'f2', tarih: '2027-02-05' })] }, { ortak: 'ayse', odeme: 'aylik' }));
    expect(ortak(odenmemis, 'ayse').netHakedis).toBe(0);
    const sonraOdenmis = hesapla(
      senaryo({ ufukAy: 4, faturalar, tahsilatlar: [tahsilat({ id: 't2', faturaId: 'f2', tarih: '2027-02-05' }), tahsilat({ id: 't1', faturaId: 'f1', tarih: '2027-03-20' })] }, { ortak: 'ayse', odeme: 'aylik' }),
    );
    const h = sonraOdenmis.hareketler.filter((x) => x.tur === 'hakedis');
    expect(h).toHaveLength(1);
    expect(h[0].faturaId).toBe('f1');
    expect(h[0].ay).toBe('2027-03');
    expect(h[0].tutar).toBe(TL(10));
  });

  test('M40: %15 → %20 → komisyon 20/15 oranında artar; ay özetleri de aynı kaynaktan güncellenir', () => {
    const s = senaryo();
    const once = hesapla(s);
    s.ortaklar.satis.donemler[0].oranBp = 2000;
    const sonra = hesapla(s);
    expect(ortak(sonra, 'satis').netHakedis).toBe(TL(200));
    expect(ortak(sonra, 'satis').netHakedis * 15).toBe(ortak(once, 'satis').netHakedis * 20);
    expect(sum(sonra.aylar.map((a) => a.hakedis))).toBe(TL(200));
    expect(sonra.musteriler[0].tahsilat).toBe(once.musteriler[0].tahsilat); // oran müşteri tahsilatını değiştirmez
  });

  test('M41: yıllık 1.000 TL %25; ilk ay destek sağlanmadı → ilk ay 0; toplam 229,17; 250’ye tamamlanmaz', () => {
    const r = hesapla(senaryo({ destek: [{ musteri: 'a', hizmetAyi: 0, durum: 'saglanmadi' }] }, { ortak: 'cozum' }));
    expect(hakedis(r, (h) => h.ay === '2027-02')).toBe(0);
    expect(ortak(r, 'cozum').netHakedis).toBe(TL(229.17));
    expect(r.hareketler.filter((h) => h.tur === 'hakedis')).toHaveLength(11);
  });

  test('M43: 0,10 TL fatura %15 → tek ödemede de 0,05 + 0,05 ödemede de 0,02 TL', () => {
    const tek = hesapla(senaryo({ ufukAy: 2, faturalar: [fatura({ tutar: 10 })], tahsilatlar: [tahsilat({ tutar: 10 })] }));
    const parcali = hesapla(senaryo({ ufukAy: 2, faturalar: [fatura({ tutar: 10 })], tahsilatlar: [tahsilat({ tutar: 5 }), tahsilat({ id: 't2', tutar: 5, tarih: '2027-01-10' })] }));
    expect(ortak(tek, 'satis').netHakedis).toBe(2);
    expect(ortak(parcali, 'satis').netHakedis).toBe(2);
  });

  test('§12.3: aynı koşullu iki müşteri tek müşterinin iki katı; sıfır oran tahsilatı sıfırlamaz; olay sırası sonucu değiştirmez; sonuç deterministik', () => {
    const bir = hesapla(senaryo({}, { ortak: 'cozum' }));
    const iki = hesapla(senaryo({}, { ortak: 'cozum', adet: 2 }));
    expect(ortak(iki, 'cozum').netHakedis).toBe(2 * ortak(bir, 'cozum').netHakedis);
    expect(iki.aylar.map((a) => a.hakedis)).toEqual(bir.aylar.map((a) => a.hakedis * 2));
    const sifir = senaryo({ ufukAy: 12 });
    sifir.ortaklar.satis.donemler.forEach((d) => (d.oranBp = 0));
    const r0 = hesapla(sifir);
    expect(ortak(r0, 'satis').netHakedis).toBe(0);
    expect(r0.musteriler[0].tahsilat).toBe(TL(1000));
    const t = [tahsilat({ id: 't2', tutar: TL(600), tarih: '2027-04-01' }), tahsilat({ tutar: TL(400) })];
    const duz = hesapla(senaryo({ ufukAy: 4, faturalar: [fatura({ hizmetAy: 12, tutar: TL(1000) })], tahsilatlar: [...t].reverse() }));
    const ters = hesapla(senaryo({ ufukAy: 4, faturalar: [fatura({ hizmetAy: 12, tutar: TL(1000) })], tahsilatlar: t }));
    expect(ters).toEqual(duz);
    expect(hesapla(senaryo({ ufukAy: 36 }))).toEqual(hesapla(senaryo({ ufukAy: 36 })));
  });

  test('§8.2: ay özetleri hareket defteriyle tutarlı; bakiye = net hakediş − ödenen', () => {
    const r = hesapla(senaryo({ ufukAy: 36 }, { odeme: 'aylik' }));
    expect(sum(r.aylar.map((a) => a.hakedis))).toBe(ortak(r, 'satis').kazanilan);
    expect(sum(r.aylar.map((a) => a.odeme))).toBe(ortak(r, 'satis').odenen);
    expect(r.aylar[r.aylar.length - 1].bakiye).toBe(ortak(r, 'satis').netHakedis - ortak(r, 'satis').odenen);
    expect(sum(r.aylar.map((a) => a.tahsilat))).toBe(r.segika[0].tahsilat);
  });
});
