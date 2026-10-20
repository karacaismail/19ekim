import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { expect, test } from '@playwright/test';

const describe = test.describe;
import { buildInput, exampleTohum, izgara, IZGARA_BASLIKLARI, motor } from './opex-fixture';

const OpexBasliklar = () => motor.BASLIKLAR;

/**
 * Apps Script web uygulaması (apps-script/src/Sheets.js) Node’da, Google hizmetleri taklit edilerek: erişim anahtarı,
 * istek gövdesi doğrulaması, özet (değişmedi) yolu. Veri yalnız kurgusal örnek tohumdan.
 */
const file = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');
const KEY = 'opex_dogru_anahtar_0123456789abcdef';

type Table = unknown[][];
interface Reply {
  ok: boolean;
  hata?: string;
  mesaj?: string;
  sema?: number;
  ozet?: string;
  degismedi?: boolean;
  degisti?: string;
  tablo?: string;
  model?: { kisiler: { ad: string }[] };
}

function loadScript(sheets: Record<string, Table>, key: string | null = KEY) {
  const props = new Map<string, string>(key ? [['OPEX_ERISIM_ANAHTARI', key]] : []);
  const sheet = (name: string) => {
    const table = sheets[name];
    if (!table) return null;
    return {
      getName: () => name,
      getLastRow: () => table.length,
      getLastColumn: () => Math.max(1, ...table.map((r) => r.length)),
      getMaxColumns: () => Math.max(26, ...table.map((r) => r.length)),
      getRange: (r: number, c: number, nr: number, nc: number) => ({
        getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => table[r - 1 + i]?.[c - 1 + j] ?? '')),
      }),
    };
  };
  const ctx: Record<string, unknown> = {
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k: string) => props.get(k) ?? null, setProperty: (k: string, v: string) => void props.set(k, v) }) },
    SpreadsheetApp: { getActiveSpreadsheet: () => ({ getSheetByName: sheet, getUrl: () => 'https://docs.google.com/spreadsheets/d/ornek/edit' }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: (s: string) => ({ body: s, setMimeType() { return this; } }) },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256' },
      Charset: { UTF_8: 'utf8' },
      computeDigest: (_alg: string, s: string) => [...createHash('sha256').update(s, 'utf8').digest()].map((b) => (b > 127 ? b - 256 : b)),
      getUuid: () => crypto.randomUUID(),
    },
  };
  vm.createContext(ctx);
  vm.runInContext(file('../apps-script/src/Motor.js'), ctx);
  vm.runInContext(file('../apps-script/src/Sheets.js'), ctx);
  const post = (contents: string | undefined): Reply => {
    const out = (ctx.doPost as (e: unknown) => { body: string })(contents === undefined ? {} : { postData: { contents } });
    return JSON.parse(out.body) as Reply;
  };
  return { ctx, props, post };
}

const input = buildInput();
const SHEETS: Record<string, Table> = {
  Parametreler: input.parametreler!,
  Personel: input.personel!,
  Giderler: input.giderler!,
  Teşvikler: input.tesvikler!,
};

test.describe('Apps Script veri ucu (doPost / doGet)', () => {
  test('anahtar tanımlı değilse kurulum hatası; veri yok', () => {
    const { post } = loadScript(SHEETS, null);
    const r = post(JSON.stringify({ anahtar: KEY }));
    expect(r).toMatchObject({ ok: false, hata: 'kurulum' });
    expect(r.model).toBeUndefined();
  });

  test('yanlış, metin olmayan veya eksik anahtar ve bozuk gövde temiz JSON hatası döner', () => {
    const { post } = loadScript(SHEETS);
    for (const body of [JSON.stringify({ anahtar: 'yanlis' }), JSON.stringify({ anahtar: 12345 }), JSON.stringify({}), undefined]) {
      const r = post(body);
      expect(r, String(body)).toMatchObject({ ok: false, hata: 'yetki' });
      expect(r.model).toBeUndefined();
    }
    for (const body of ['null', '5', '[]', '"metin"', '{bozuk']) {
      expect(post(body), body).toMatchObject({ ok: false, hata: 'istek' });
    }
    // Uzunluğu aynı ama farklı anahtar da reddedilir.
    expect(post(JSON.stringify({ anahtar: KEY.replace(/.$/, 'x') }))).toMatchObject({ ok: false, hata: 'yetki' });
  });

  test('doğru anahtar: model, tablo adresi ve özet; aynı özetle yalnız “değişmedi”', () => {
    const { post, props } = loadScript(SHEETS);
    const full = post(JSON.stringify({ anahtar: KEY }));
    expect(full).toMatchObject({ ok: true, sema: 1, tablo: 'https://docs.google.com/spreadsheets/d/ornek/edit' });
    expect(full.ozet).toMatch(/^[0-9a-f]{24}$/);
    expect(full.model?.kisiler.map((k) => k.ad)).toContain('Örnek Uzman');
    const same = post(JSON.stringify({ anahtar: KEY, ozet: full.ozet }));
    expect(same).toMatchObject({ ok: true, degismedi: true, ozet: full.ozet });
    expect(same.model).toBeUndefined();
    expect(same.tablo).toBeUndefined();
    expect(JSON.parse(props.get('OPEX_SON_DEGISIM') ?? '{}').ozet).toBe(full.ozet);
  });

  test('Sheets değişince özet değişir ve tüm model döner', () => {
    const sheets = { ...SHEETS };
    const { post } = loadScript(sheets);
    const first = post(JSON.stringify({ anahtar: KEY }));
    sheets.Personel = buildInput({ personel: [...exampleTohum.personel, ['Yeni Kişi', 'Bordrolu', 'Net', 41000, 'Evet', '', 'Otomatik', true, '']] }).personel!;
    const next = post(JSON.stringify({ anahtar: KEY, ozet: first.ozet }));
    expect(next.degismedi).toBeUndefined();
    expect(next.ozet).not.toBe(first.ozet);
    expect(next.model?.kisiler.map((k) => k.ad)).toContain('Yeni Kişi');
  });

  test('aylık ızgara okunur (Giderler P:AS, Personel Q:AT): işaret kalkınca ve ay tutarı değişince özet ve model değişir', () => {
    // Giderler: A:K girdi, M:N hesap, P:AS ızgara. Personel: A:I girdi, K:O hesap, Q:AT ızgara (aynı satırlar).
    const yan = (girdi: Table, once: number, ek: Table) => girdi.map((r, i) => [...Array.from({ length: once }, (_, j) => r[j] ?? ''), ...(ek[i] ?? [])]);
    const nG = exampleTohum.giderler.length;
    const nP = exampleTohum.personel.length;
    const bos = (n: number) => Array.from({ length: n }, () => ({}));
    const sheets = { ...SHEETS, Giderler: yan(SHEETS.Giderler, 15, izgara(bos(nG))), Personel: yan(SHEETS.Personel, 16, izgara(bos(nP))) };
    const { post } = loadScript(sheets);
    type Full = Omit<Reply, 'model'> & { model: { giderler: { kalem: string; aylikTl: { y2026: number[] } }[]; kisiler: { ad: string; y2026: { aylar: { fatura: number }[] } }[] } };
    const first = post(JSON.stringify({ anahtar: KEY })) as unknown as Full;
    expect(first.model.giderler.find((g) => g.kalem === 'Ofis kirası')!.aylikTl.y2026[10]).toBe(60000);
    const kira = exampleTohum.giderler.findIndex((r) => r[0] === 'Ofis kirası');
    const serbest = exampleTohum.personel.findIndex((r) => r[0] === 'Örnek Serbest A');
    sheets.Giderler = yan(SHEETS.Giderler, 15, izgara(bos(nG).map((x, i) => (i === kira ? { aktif: { 'Kas 2026': false } } : x))));
    sheets.Personel = yan(SHEETS.Personel, 16, izgara(bos(nP).map((x, i) => (i === serbest ? { tutar: { 'Kas 2026': 70000 } } : x))));
    const next = post(JSON.stringify({ anahtar: KEY, ozet: first.ozet })) as unknown as Full;
    expect(next.degismedi).toBeUndefined();
    expect(next.ozet).not.toBe(first.ozet);
    expect(next.model.giderler.find((g) => g.kalem === 'Ofis kirası')!.aylikTl.y2026[10]).toBe(0);
    expect(next.model.kisiler.find((k) => k.ad === 'Örnek Serbest A')!.y2026.aylar[10].fatura).toBe(70000);
  });

  test('Kurulum: formül ızgara aralıklarını okur; başlıklar test ızgarasıyla aynı; varsayılan formüller', () => {
    const { ctx } = loadScript(SHEETS);
    vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
    const formul = (ctx.opexFormulu_ as (r: string) => string)('kpi');
    expect(formul).toContain("'Giderler OFİS'!A1:G,'Giderler OFİS'!I1:AL)");
    expect([...(ctx.izgaraBasliklari_ as () => string[])()]).toEqual(IZGARA_BASLIKLARI);
    expect((ctx.personelVarsayilani_ as (r: number, y: number) => string)(5, 2027)).toBe(
      // N(): Tutar boşsa sayı 0 (boş metin “sayı ≥ 0” doğrulamasını bozardı; 17. satırdaki kurulum hatası).
      '=IF($C5="Asgari ücret",ROUND(p_asgari_brut_2027*(1-p_sgk_isci-p_issizlik_isci),2),IF($E5="Hayır",N($D5),ROUND(N($D5)*(1+p_zam_orani),2)))',
    );
    expect((ctx.giderVarsayilani_ as (r: number, y: number) => string)(4, 2026)).toBe('=N($F4)');
    expect((ctx.giderVarsayilani_ as (r: number, y: number) => string)(4, 2027)).toMatch(/^=LET\(p,.*ROUND\(N\(\$F4\)\*\(1\+IFS\(a="Kira",p_kira_artis_2027,a="Genel",p_genel_artis_2027,a="Kur",IF\(p="TRY",p_kur_artis_2027,0\)/);
    expect((ctx.personelVarsayilani_ as (r: number, y: number) => string)(17, 2026)).toBe('=IF($C17="Asgari ücret",ROUND(p_asgari_brut_2026*(1-p_sgk_isci-p_issizlik_isci),2),N($D17))');
  });

  test('yeniden adlandırılmış sayfalar okunur (Düzenli Giderler, Personel Giderleri); eski adlar da çalışır', () => {
    const yeni = { Parametreler: SHEETS.Parametreler, 'Personel Giderleri': SHEETS.Personel, 'Düzenli Giderler': SHEETS.Giderler, Teşvikler: SHEETS.Teşvikler };
    const a = loadScript(yeni).post(JSON.stringify({ anahtar: KEY })) as unknown as { model: { giderler: unknown[]; kisiler: unknown[] } };
    const b = loadScript(SHEETS).post(JSON.stringify({ anahtar: KEY })) as unknown as { model: { giderler: unknown[]; kisiler: unknown[] } };
    expect(a.model.giderler.length).toBe(exampleTohum.giderler.filter((r) => r[8] !== false).length);
    expect(a.model.kisiler.length).toBe(b.model.kisiler.length);
    expect(a.model.kisiler.length).toBeGreaterThan(0);
  });

  test('dört sayfa: Giderler TEKNOLOJİ + Giderler OFİS + Giderler PERSONEL okunur; ayrılmamış Düzenli Giderler de çalışır', () => {
    const b = OpexBasliklar();
    const bas = [b.giderler.kalem, b.giderler.hesap, b.giderler.kume, b.giderler.kategori, b.giderler.para, b.giderler.tutar, b.giderler.artis];
    const sayfa = (rows: unknown[][]) => [['Başlık'], ['Açıklama'], bas, ...rows];
    const tek = sayfa([['Araç', '', 'Teknoloji', 'Yapay Zekâ', 'USD', 100, 'Kur']]);
    const ofis = sayfa([['Kira', '', 'Ofis ve işletme', 'Kira', 'TRY', 1000, 'Kira']]);
    const { Giderler: _g, Personel: _p, ...diger } = SHEETS;
    const ayri = loadScript({ ...diger, 'Giderler TEKNOLOJİ': tek, 'Giderler OFİS': ofis, 'Giderler PERSONEL': SHEETS.Personel }).post(JSON.stringify({ anahtar: KEY })) as unknown as {
      model: { giderler: { kalem: string }[]; kisiler: unknown[] };
    };
    expect(ayri.model.giderler.map((g) => g.kalem)).toEqual(['Araç', 'Kira']);
    expect(ayri.model.kisiler.length).toBeGreaterThan(0);
    const birlesik = sayfa([['Araç', '', 'Teknoloji', 'Yapay Zekâ', 'USD', 100, 'Kur'], ['Kira', '', 'Ofis ve işletme', 'Kira', 'TRY', 1000, 'Kira']]);
    const once = loadScript({ ...diger, 'Düzenli Giderler': birlesik, 'Personel Giderleri': SHEETS.Personel }).post(JSON.stringify({ anahtar: KEY })) as unknown as {
      model: { giderler: { kalem: string }[] };
    };
    expect(once.model.giderler.map((g) => g.kalem), 'ayırmadan önce').toEqual(['Araç', 'Kira']);
  });

  describe('Kurulum: Düzenli Giderler → Giderler TEKNOLOJİ + Giderler OFİS (Küme’ye göre ayırma)', () => {
    // Sahte tablo: satır = [Kalem, Hesap, Küme, Kategori, Para, Tutar, Artış]; işlemler (ad değişimi, kopya, silme) kaydedilir.
    type Satir = unknown[];
    type Sahte = { ad: string; rows: Satir[]; silinen: number[]; gizli: boolean; degerYapistir: boolean };
    const BAS = ['Kalem', 'Hesap', 'Küme', 'Kategori', 'Para birimi', 'Tutar (aylık)', '2027 artış esası'];
    const kur = (baslangic: Record<string, Satir[]>) => {
      const { ctx } = loadScript(SHEETS);
      vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
      const sayfalar: Record<string, Sahte> = {};
      const islemler: string[] = [];
      const yap = (ad: string, rows: Satir[]): Sahte => (sayfalar[ad] = { ad, rows: rows.map((r) => [...r]), silinen: [], gizli: false, degerYapistir: false });
      const sheetOf = (sh: Sahte): unknown => ({
        getName: () => sh.ad,
        setName: (n: string) => { islemler.push(`ad ${sh.ad} → ${n}`); delete sayfalar[sh.ad]; sh.ad = n; sayfalar[n] = sh; return sheetOf(sh); },
        getLastRow: () => 3 + sh.rows.length,
        getRange: (r: number, c: number, nr = 1, nc = 1) => ({
          getDisplayValues: () => [BAS.slice(c - 1, c - 1 + nc)],
          getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => sh.rows[r - 4 + i]?.[c - 1 + j] ?? '')),
          getFormulas: () => Array.from({ length: nr }, () => Array.from({ length: nc }, () => '')),
        }),
        getDataRange: () => ({ copyTo: () => void (sh.degerYapistir = true) }),
        hideSheet: () => void (sh.gizli = true),
        deleteRow: (r: number) => { islemler.push(`sil ${sh.ad} ${r}`); sh.silinen.push(r); sh.rows.splice(r - 4, 1); },
        copyTo: () => { const k = yap(`${sh.ad} kopyası`, sh.rows); islemler.push(`kopya ${sh.ad}`); return sheetOf(k); },
      });
      Object.entries(baslangic).forEach(([ad, rows]) => yap(ad, rows));
      const ss = {
        getSheetByName: (n: string) => (sayfalar[n] ? sheetOf(sayfalar[n]) : null),
        deleteSheet: (sh: { getName: () => string }) => { islemler.push(`sayfa sil ${sh.getName()}`); delete sayfalar[sh.getName()]; },
      };
      const ayir = () => (ctx.giderSayfalariniAyir_ as (ss: unknown) => boolean)(ss);
      const kalemler = (ad: string) => sayfalar[ad]?.rows.map((r) => r[0]);
      return { ayir, sayfalar, islemler, kalemler };
    };
    const T = (ad: string, kume = 'Teknoloji') => [ad, '', kume, 'Yapay Zekâ', 'USD', 100, 'Kur'];
    const O = (ad: string, kume = 'Ofis ve işletme') => [ad, '', kume, 'Kira', 'TRY', 1000, 'Kira'];
    const TOPLAM = ['Toplam (₺)', '', '', '', '', '', ''];

    test('Küme’ye göre ayrılır; değerlerden gizli yedek alınır; ikinci kez dokunmaz', () => {
      const k = kur({ 'Düzenli Giderler': [T('ChatGPT'), T('AWS'), O('Kira'), O('Elektrik'), TOPLAM] });
      expect(k.ayir()).toBe(true);
      expect(k.kalemler('Giderler TEKNOLOJİ')).toEqual(['ChatGPT', 'AWS']);
      expect(k.kalemler('Giderler OFİS')).toEqual(['Kira', 'Elektrik']);
      const yedek = Object.values(k.sayfalar).find((x) => /^Yedek/.test(x.ad))!;
      expect(yedek.rows.length, 'yedek tüm satırları taşır').toBe(5);
      expect([yedek.gizli, yedek.degerYapistir]).toEqual([true, true]);
      expect(k.ayir(), 'ikinci kez').toBe(false);
    });

    test('“Toplam…” adlı ama girdisi dolu satır varsa hiçbir şeye dokunmadan durur', () => {
      const k = kur({ 'Düzenli Giderler': [T('ChatGPT'), ['Toplam bakım sözleşmesi', '', 'Ofis ve işletme', 'Diğer', 'TRY', 500, 'Genel']] });
      expect(() => k.ayir()).toThrow(/Toplam bakım sözleşmesi/);
      expect(k.islemler).toEqual([]);
    });

    test('Küme motorla aynı sınıflanır (İşletme → ofis, boş → teknoloji); Kalem’i boş ama dolu satır tek sayfaya gider', () => {
      const k = kur({ 'Düzenli Giderler': [T('ChatGPT', ''), O('Aidat', 'Genel işletme'), ['', 'not', 'Ofis ve işletme', '', 'TRY', 50, ''], ['', '', '', '', '', '', '']] });
      k.ayir();
      expect(k.kalemler('Giderler TEKNOLOJİ')).toEqual(['ChatGPT', '']);
      expect(k.kalemler('Giderler OFİS')).toEqual(['Aidat', '', '']);
      expect(k.sayfalar['Giderler OFİS'].rows[1][1], 'yarım satır yalnız ofiste').toBe('not');
    });

    test('yarıda kalmış ayırma devam eder: OFİS hazır, kaynak temizlenmemişse yalnız kaynak temizlenip adlandırılır', () => {
      const k = kur({ 'Düzenli Giderler': [T('ChatGPT'), O('Kira')], 'Giderler OFİS': [O('Kira')] });
      expect(k.ayir()).toBe(true);
      expect(k.islemler.filter((x) => x.startsWith('kopya ')), 'yeni kopya yok').toEqual(['kopya Düzenli Giderler']);
      expect(k.kalemler('Giderler OFİS')).toEqual(['Kira']);
      expect(k.kalemler('Giderler TEKNOLOJİ')).toEqual(['ChatGPT']);
    });

    test('elle açılmış boş “Giderler OFİS” silinip ayırma yapılır', () => {
      const k = kur({ 'Düzenli Giderler': [T('ChatGPT'), O('Kira')], 'Giderler OFİS': [] });
      expect(k.ayir()).toBe(true);
      expect(k.islemler).toContain('sayfa sil Giderler OFİS');
      expect(k.kalemler('Giderler OFİS')).toEqual(['Kira']);
      expect(k.kalemler('Giderler TEKNOLOJİ')).toEqual(['ChatGPT']);
    });
  });

  test('yeni yerleşim: Düzenli Giderler A:G + boşluk + I:AL ızgara ve Toplam satırı; Personel Q:AT; tüm sayfa okunur', () => {
    const b = OpexBasliklar();
    const giderBas = [b.giderler.kalem, b.giderler.hesap, b.giderler.kume, b.giderler.kategori, b.giderler.para, b.giderler.tutar, b.giderler.artis];
    const satirlar = [
      ['Kira', '', 'Ofis ve işletme', 'Kira', 'TRY', 1000, 'Kira'],
      ['Araç', '', 'Teknoloji', 'Yapay Zekâ', 'USD', 100, 'Kur'],
    ];
    const grid = izgara([{ aktif: { 'Kas 2026': false } }, {}]);
    const sheet = [['Başlık'], ['Açıklama'], [...giderBas, ''], ...satirlar.map((r) => [...r, ''])].map((r, i) => [...r, ...(grid[i] ?? [])]);
    sheet.push(['Toplam (₺)', '', '', '', '', '', '', '', '', 123]);
    const { Giderler: _eski, ...digerleri } = SHEETS;
    const sheets: Record<string, Table> = { ...digerleri, 'Düzenli Giderler': sheet };
    const r = loadScript(sheets).post(JSON.stringify({ anahtar: KEY })) as unknown as { model: { giderler: { kalem: string; aylikTl: { y2026: number[] } }[]; ozet: { odeme: { takip: boolean } } } };
    expect(r.model.giderler.map((g) => g.kalem)).toEqual(['Kira', 'Araç']);
    expect(r.model.giderler[0].aylikTl.y2026.slice(9)).toEqual([1000, 0, 1000]);
    expect(r.model.ozet.odeme.takip, '“Bu ay ödendi” sütunu yok').toBe(false);
  });

  test('Kurulum adım adım ve kaldığı yerden sürer: süre bütçesi dolunca ilerleme kaydedilir, dil her çalıştırmada tr_TR’ye döner', () => {
    // Apps Script tek çalıştırmayı 6 dakikada keser (kullanıcının tablosunda bir kez oldu); kurulum ~3,5 dakikada durur.
    const { ctx } = loadScript(SHEETS);
    vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
    const g = ctx as Record<string, unknown>;
    let saat = 0;
    const yapilan: string[] = [];
    const diller: string[] = [];
    const ozellik = new Map<string, string>();
    g.opexSimdi_ = () => saat;
    g.PropertiesService = {
      ...(g.PropertiesService as object),
      getDocumentProperties: () => ({ getProperty: (k: string) => ozellik.get(k) ?? null, setProperty: (k: string, v: string) => void ozellik.set(k, v), deleteProperty: (k: string) => void ozellik.delete(k) }),
    };
    const ss = { setSpreadsheetLocale: (l: string) => void diller.push(l), setSpreadsheetTimeZone: () => undefined, getSheetByName: () => ({}), setActiveSheet: () => undefined, toast: () => undefined };
    g.SpreadsheetApp = { ...(g.SpreadsheetApp as object), getActiveSpreadsheet: () => ss, flush: () => undefined };
    g.anahtariSagla_ = () => void yapilan.push('anahtar');
    g.baglantiBilgisi = () => void yapilan.push('bilgi');
    const adimlar = g.OPEX_KURULUM_ADIMLARI as [string, (ss: unknown) => void][];
    adimlar.forEach((a) => (a[1] = () => { yapilan.push(a[0]); saat += 60_000; }));
    const kurulum = g.kurulum as () => void;
    kurulum();
    expect(yapilan, 'ilk çalıştırma: 3,5 dk bütçeyle 4 adım').toEqual(adimlar.slice(0, 4).map((a) => a[0]));
    expect(diller).toEqual(['en_US', 'tr_TR']);
    expect(JSON.parse(ozellik.get('OPEX_KURULUM')!).adim).toBe(4);
    let tur = 1;
    while (ozellik.has('OPEX_KURULUM') && tur < 10) { kurulum(); tur++; }
    expect(yapilan.filter((x) => x !== 'anahtar' && x !== 'bilgi'), 'her adım bir kez, sırayla').toEqual(adimlar.map((a) => a[0]));
    expect(yapilan.slice(-2), 'bitince anahtar ve bağlantı bilgisi').toEqual(['anahtar', 'bilgi']);
    expect(diller.filter((d) => d === 'tr_TR').length, 'her çalıştırma tr_TR ile biter').toBe(tur);
    // Eski (6 saatten eski) yarım kayıt yok sayılır; baştan başlar.
    ozellik.set('OPEX_KURULUM', JSON.stringify({ adim: 5, zaman: saat - 7 * 3600_000 }));
    yapilan.length = 0;
    kurulum();
    expect(yapilan[0]).toBe(adimlar[0][0]);
  });

  test('Kurulum: yeni sayfa adları ve yerleşimle formül; alt toplam ve asgari ücret motordan (özel işlev); döviz biçimi', () => {
    const { ctx } = loadScript(SHEETS);
    vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
    const f = ctx as Record<string, (...a: unknown[]) => string>;
    expect(f.opexFormulu_('kpi')).toBe(
      "=OPEX(\"kpi\",Parametreler!A1:F,'Giderler PERSONEL'!A1:I,'Giderler TEKNOLOJİ'!A1:G,'Teşvikler'!A1:I,'Giderler TEKNOLOJİ'!I1:AL,'Giderler PERSONEL'!Q1:AT,'Giderler OFİS'!A1:G,'Giderler OFİS'!I1:AL)",
    );
    // Alt toplam satırı: motor (özel işlev) hesaplar; aralık formülün bir üst satırında biter (döngüsel başvuru yok).
    // OFFSET: aralık formülün bir üst satırında biter; kendi çıktısına başvurmaz (döngüsel başvuru yok).
    expect(f.toplamFormulu_('ofis')).toBe(
      "=OPEX(\"gider-toplam\",Parametreler!A1:F,\"\",OFFSET('Giderler OFİS'!A1,0,0,ROW()-1,7),\"\",OFFSET('Giderler OFİS'!I1,0,0,ROW()-1,30),\"\")",
    );
    expect(f.toplamFormulu_('teknoloji')).toContain("OFFSET('Giderler TEKNOLOJİ'!I1,0,0,ROW()-1,30)");
    expect(f.toplamFormulu_('personel')).toBe(
      "=OPEX(\"personel-toplam\",Parametreler!A1:F,OFFSET('Giderler PERSONEL'!A1,0,0,ROW()-1,9),\"\",\"\",\"\",OFFSET('Giderler PERSONEL'!Q1,0,0,ROW()-1,30))",
    );
    expect(f.asgariNetFormulu_(2027)).toBe('=OPEX("asgari-net-2027",Parametreler!A1:F)');
    expect([f.paraBicimi_('USD'), f.paraBicimi_('eur'), f.paraBicimi_('TRY'), f.paraBicimi_('')]).toEqual(['[$$]#,##0.00', '[$€]#,##0.00', '#,##0.00 "₺"', '#,##0.00 "₺"']);
  });

  test('Kurulum: gizli eski sütunlar (H:N — Bu ay ödendi, Dahil, Fatura, Not, boşluk, hesap) yalnız beklenen içerikle kaldırılır', () => {
    const { ctx } = loadScript(SHEETS);
    vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
    const kaldir = ctx.eskiGiderSutunlariniKaldir_ as (sh: unknown) => boolean;
    const sahte = (h: string[], m1: string, govde: unknown[][] = []) => {
      const silinen: number[][] = [];
      const yazilan: { r: number; c: number; v: unknown[][] }[] = [];
      const sh = {
        getName: () => 'Düzenli Giderler',
        getMaxColumns: () => 45,
        getLastRow: () => 3 + govde.length,
        getRange: (r: number, c: number, nr = 1, nc = 1) => ({
          getDisplayValues: () => [Array.from({ length: nc }, (_, j) => (r === 3 ? h[c - 1 + j] ?? '' : ''))],
          getFormula: () => (r === 1 && c === 13 ? m1 : ''),
          getValues: () => Array.from({ length: nr }, (_, i) => Array.from({ length: nc }, (_, j) => govde[r - 4 + i]?.[c - 1 + j] ?? '')),
          getFormulas: () => Array.from({ length: nr }, () => Array.from({ length: nc }, () => '')),
          setValues: (v: unknown[][]) => void yazilan.push({ r, c, v }),
        }),
        deleteColumns: (c: number, n: number) => void silinen.push([c, n]),
      };
      return { sh, silinen, yazilan };
    };
    const ESKI = ['Kalem', 'Hesap', 'Küme', 'Kategori', 'Para birimi', 'Tutar (aylık)', '2027 artış esası', 'Bu ay ödendi', 'Dahil', 'Fatura bağlantısı', 'Not', '', 'Ekim ₺', '2027 ort. ₺', '', 'Eki 2026'];
    const eski = sahte(ESKI, '=OPEX("gider-sutun",Parametreler!A1:F)');
    expect(kaldir(eski.sh)).toBe(true);
    expect(eski.silinen).toEqual([[8, 7]]);
    const yeni = sahte([...ESKI.slice(0, 7), '', 'Eki 2026', 'Eki 2026 tutar'], '');
    expect(kaldir(yeni.sh), 'zaten kaldırılmış: dokunmaz').toBe(false);
    expect(yeni.silinen).toEqual([]);
    const yabanci = sahte([...ESKI.slice(0, 11), 'Benim notum', ...ESKI.slice(12)], '=OPEX("gider-sutun")');
    expect(() => kaldir(yabanci.sh)).toThrow(/beklenen eski sütunlar/);
    expect(yabanci.silinen).toEqual([]);
    // Dahil = hayır satırı hariç kalır: silmeden önce o satırın bütün ay kutuları işaretsiz yapılır.
    const satir = (dahil: boolean) => [...Array(7).fill('x'), true, dahil, '', '', '', 100, 100, '', ...Array.from({ length: 30 }, (_, j) => (j % 2 ? 100 : true))];
    const dahilsiz = sahte(ESKI, '=OPEX("gider-sutun")', [satir(true), satir(false)]);
    expect(kaldir(dahilsiz.sh)).toBe(true);
    const yaz = dahilsiz.yazilan.find((y) => y.r === 5 && y.c === 16)!;
    expect(yaz.v[0].filter((_, j) => j % 2 === 0).every((x) => x === false)).toBe(true);
    expect(yaz.v[0].filter((_, j) => j % 2 === 1).every((x) => x === 100), 'tutarlar korunur').toBe(true);
    expect(dahilsiz.yazilan.find((y) => y.r === 4), 'Dahil satırına dokunulmaz').toBeUndefined();
    // Boşluk sütununda (L) içerik varsa durur.
    const lDolu = sahte(ESKI, '=OPEX("gider-sutun")', [[...satir(true).slice(0, 11), 'not', ...satir(true).slice(12)]]);
    expect(() => kaldir(lDolu.sh)).toThrow(/beklenen eski sütunlar/);
    expect(lDolu.silinen).toEqual([]);
  });

  test('Kurulum: onay kutusu dönüşümü — satırda açık işaret varsa boş = işaretsiz, yoksa boş = işaretli', () => {
    const { ctx } = loadScript(SHEETS);
    vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
    const donustur = ctx.onaySatiri_ as (r: unknown[]) => boolean[];
    expect([...donustur(['', '', true, 'evet', false])]).toEqual([false, false, true, true, false]);
    expect([...donustur(['', '', ''])]).toEqual([true, true, true]);
    expect([...donustur(['x', 'hayır', ''])]).toEqual([true, false, false]);
  });

  test('Kurulum: açıklama kullanıcının taşıdığı B2’ye yazılır (A2 boşaltılır); B2 boşsa A2', () => {
    const { ctx } = loadScript(SHEETS);
    vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
    const yaz = ctx.aciklamaYaz_ as (sh: unknown, metin: string) => void;
    const sahte = (b2: string) => {
      const hucre: Record<string, unknown> = { A2: 'eski', B2: b2 };
      const sh = {
        getRange: (a1: string) => ({
          getValue: () => hucre[a1] ?? '',
          setValue(v: unknown) { hucre[a1] = v; return this; },
          clearContent() { hucre[a1] = ''; return this; },
          setFontColor() { return this; },
        }),
      };
      return { sh, hucre };
    };
    const tasinmis = sahte('kullanıcının açıklaması');
    yaz(tasinmis.sh, 'yeni açıklama');
    expect(tasinmis.hucre).toEqual({ A2: '', B2: 'yeni açıklama' });
    const yerinde = sahte('');
    yaz(yerinde.sh, 'yeni açıklama');
    expect(yerinde.hucre).toEqual({ A2: 'yeni açıklama', B2: '' });
  });

  test('onEdit: Düzenli Giderler’de para birimi değişince o satırın tutarları o dövizle biçimlenir', () => {
    const { ctx } = loadScript(SHEETS);
    vm.runInContext(file('../apps-script/src/Kurulum.js'), ctx);
    const bicimler: { r: number; c: number; f: string[][] }[] = [];
    let baslik = 'Bu ay ödendi';
    const sh = {
      getName: () => 'Düzenli Giderler',
      getRange: (r: number, c: number, nr = 1, nc = 1) => ({
        getDisplayValue: () => (r === 3 && c === 9 ? baslik : ''),
        getValues: () => Array.from({ length: nr }, () => Array.from({ length: nc }, () => (c === 5 ? 'EUR' : ''))),
        getNumberFormats: () => Array.from({ length: nr }, () => Array.from({ length: nc }, () => 'General')),
        setNumberFormats: (f: string[][]) => void bicimler.push({ r, c, f }),
      }),
    };
    const duzenle = () => (ctx.onEdit as (e: unknown) => void)({ range: { getSheet: () => sh, getRow: () => 7, getColumn: () => 5, getLastColumn: () => 5, getNumRows: () => 1 } });
    duzenle();
    expect(bicimler, 'eski yerleşimde (I3 ızgara değil) dokunmaz').toEqual([]);
    baslik = 'Eki 2026';
    duzenle();
    expect(bicimler.find((b) => b.c === 6)?.f).toEqual([['[$€]#,##0.00']]);
    const izgara = bicimler.find((b) => b.c === 9)!.f[0];
    expect(izgara.filter((_, j) => j % 2 === 1).every((x) => x === '[$€]#,##0.00')).toBe(true);
    expect(izgara.filter((_, j) => j % 2 === 0).every((x) => x === 'General'), 'onay kutusu sütunları değişmez').toBe(true);
  });

  test('doGet yalnız sağlık bilgisi verir; anahtar üretimi 64 onaltılık hane', () => {
    const { ctx } = loadScript(SHEETS);
    const health = JSON.parse((ctx.doGet as () => { body: string })().body) as Record<string, unknown>;
    expect(health).toMatchObject({ ok: true, hizmet: 'istoc-opex', sema: 1 });
    expect(JSON.stringify(health)).not.toMatch(/Örnek|kisiler|model/);
    expect((ctx.anahtarUret_ as () => string)()).toMatch(/^opex_[0-9a-f]{64}$/);
  });
});
