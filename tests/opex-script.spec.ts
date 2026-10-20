import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import { expect, test } from '@playwright/test';
import { buildInput, exampleTohum, izgara, IZGARA_BASLIKLARI } from './opex-fixture';

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
      getLastRow: () => table.length,
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
    expect(formul).toBe('=OPEX("kpi",Parametreler!A1:F,Personel!A1:I,Giderler!A1:K,\'Teşvikler\'!A1:I,Giderler!P1:AS,Personel!Q1:AT)');
    expect([...(ctx.izgaraBasliklari_ as () => string[])()]).toEqual(IZGARA_BASLIKLARI);
    expect((ctx.personelVarsayilani_ as (r: number, y: number) => string)(5, 2027)).toBe(
      '=IF($C5="Asgari ücret",ROUND(p_asgari_brut_2027*(1-p_sgk_isci-p_issizlik_isci),2),IF($E5="Hayır",$D5,ROUND($D5*(1+p_zam_orani),2)))',
    );
    expect((ctx.giderVarsayilani_ as (r: number, y: number) => string)(4, 2026)).toBe('=$F4');
    expect((ctx.giderVarsayilani_ as (r: number, y: number) => string)(4, 2027)).toMatch(/^=LET\(p,.*ROUND\(\$F4\*\(1\+IFS\(a="Kira",p_kira_artis_2027,a="Genel",p_genel_artis_2027,a="Kur",IF\(p="TRY",p_kur_artis_2027,0\)/);
  });

  test('doGet yalnız sağlık bilgisi verir; anahtar üretimi 64 onaltılık hane', () => {
    const { ctx } = loadScript(SHEETS);
    const health = JSON.parse((ctx.doGet as () => { body: string })().body) as Record<string, unknown>;
    expect(health).toMatchObject({ ok: true, hizmet: 'istoc-opex', sema: 1 });
    expect(JSON.stringify(health)).not.toMatch(/Örnek|kisiler|model/);
    expect((ctx.anahtarUret_ as () => string)()).toMatch(/^opex_[0-9a-f]{64}$/);
  });
});
