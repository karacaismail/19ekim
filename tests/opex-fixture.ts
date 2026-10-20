/**
 * OPEX test yardımcıları: Apps Script motorunu (apps-script/src/Motor.js) Apps Script gibi genel kapsamda çalıştırır
 * ve yalnız kurgusal örnek tohumla (apps-script/ornek/tohum.ornek.js) Sheets girdisi ve web uygulaması yanıtı üretir.
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';
import type { OpexModel } from '../src/data/opex';

type Table = unknown[][];
export interface Girdi {
  parametreler?: Table;
  personel?: Table;
  giderler?: Table;
  tesvikler?: Table;
  giderAylari?: Table;
  personelAylari?: Table;
  /** İkinci gider sayfası (Giderler OFİS); birinci Giderler TEKNOLOJİ. */
  giderler2?: Table;
  giderAylari2?: Table;
}
interface ParamDef {
  grup: string;
  ad: string;
  anahtar: string;
  deger: number | string;
  birim: string;
  aciklama: string;
}
interface TesvikDef {
  kod: string;
  ad: string;
  tur: string;
  deger2026: number;
  deger2027: number;
  kapsam: string;
  birlikte: string;
  etkin: boolean;
  kosul: string;
}
export interface Motor {
  SEMA: number;
  SURUM: string;
  BASLIKLAR: Record<'parametreler' | 'personel' | 'giderler' | 'tesvikler', Record<string, string>>;
  PARAMETRE_TANIMLARI: ParamDef[];
  TESVIK_TANIMLARI: TesvikDef[];
  hesapla(girdi: Girdi, secenek?: { simdi?: Date }): OpexModel;
  rapor(model: OpexModel, ad: string, girdi?: Girdi): unknown[][];
}

const file = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), 'utf8');

/** Motor ve (isteğe bağlı) tohum aynı bağlamda; Apps Script’teki gibi `var` adları genel nesnede. */
export function loadMotor(): { motor: Motor; tohum: { personel: Table; giderler: Table } } {
  const ctx: Record<string, unknown> = {};
  vm.createContext(ctx);
  vm.runInContext(file('../apps-script/src/Motor.js'), ctx);
  vm.runInContext(file('../apps-script/ornek/tohum.ornek.js'), ctx);
  return { motor: ctx.OpexMotor as Motor, tohum: ctx.OPEX_TOHUM as { personel: Table; giderler: Table } };
}

const { motor, tohum } = loadMotor();
export { motor };

/** Sheets yerleşimi: 1. satır başlık metni, 2. satır açıklama, 3. satır sütun başlıkları. */
const sheet = (headers: string[], rows: Table, title = true): Table => (title ? [['Başlık'], ['Açıklama'], headers, ...rows] : [headers, ...rows]);

export function paramRows(change: Record<string, unknown> = {}): Table {
  return motor.PARAMETRE_TANIMLARI.map((t) => [t.grup, t.ad, t.anahtar in change ? change[t.anahtar] : t.deger, t.birim, t.anahtar, t.aciklama]);
}

const KISA = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];
/** Sheets aylık ızgarasının ayları (Kurulum: 15 aylık plan, Ekim 2026 → Aralık 2027). */
export const IZGARA_AYLARI = [...KISA.slice(9).map((a) => `${a} 2026`), ...KISA.map((a) => `${a} 2027`)];
/** Izgara başlıkları: her ay yan yana onay kutusu ve tutar (Kurulum.izgaraBasliklari_ ile aynı). */
export const IZGARA_BASLIKLARI = IZGARA_AYLARI.flatMap((a) => [a, `${a} tutar`]);
export interface IzgaraSatiri {
  /** Ay → işaret (yazılmayan ay işaretli; '' = boş hücre). */
  aktif?: Record<string, boolean | ''>;
  /** Ay → o ayın tutarı (yazılmayan ay boş = varsayılan). */
  tutar?: Record<string, number>;
}

/** Aylık ızgara (Giderler P:AS / Personel Q:AT): 3. satır başlık; n. eleman girdinin n. veri satırıyla aynı satırda. */
export function izgara(satirlar: IzgaraSatiri[], basliklar: unknown[] = IZGARA_BASLIKLARI): Table {
  return [
    [''],
    ['Ay ay: onay kutusu = o ay etkin.'],
    basliklar,
    ...satirlar.map((x) => IZGARA_AYLARI.flatMap((a) => [x.aktif?.[a] ?? true, x.tutar?.[a] ?? ''])),
  ];
}

export function buildInput(
  opts: {
    params?: Record<string, unknown>;
    personel?: Table;
    giderler?: Table;
    giderler2?: Table;
    title?: boolean;
    giderAylari?: IzgaraSatiri[];
    giderAylari2?: IzgaraSatiri[];
    personelAylari?: IzgaraSatiri[];
  } = {},
): Girdi {
  const b = motor.BASLIKLAR;
  const title = opts.title ?? true;
  return {
    parametreler: sheet(Object.values(b.parametreler), paramRows(opts.params), title),
    personel: sheet(Object.values(b.personel), opts.personel ?? tohum.personel, title),
    giderler: sheet(Object.values(b.giderler), opts.giderler ?? tohum.giderler, title),
    tesvikler: sheet(
      Object.values(b.tesvikler),
      motor.TESVIK_TANIMLARI.map((t) => [t.kod, t.ad, t.tur, t.deger2026, t.deger2027, t.kapsam, t.birlikte, t.etkin, t.kosul]),
      title,
    ),
    ...(opts.giderAylari ? { giderAylari: izgara(opts.giderAylari) } : {}),
    ...(opts.giderler2 ? { giderler2: sheet(Object.values(b.giderler), opts.giderler2, title) } : {}),
    ...(opts.giderAylari2 ? { giderAylari2: izgara(opts.giderAylari2) } : {}),
    ...(opts.personelAylari ? { personelAylari: izgara(opts.personelAylari) } : {}),
  };
}

export const NOW = new Date('2026-10-20T09:00:00Z');

export function buildModel(opts: Parameters<typeof buildInput>[0] = {}) {
  return motor.hesapla(buildInput(opts), { simdi: NOW });
}

/** Web uygulamasının (doPost) yanıtı. */
export function reply(model: OpexModel, ozet: string, extra: Record<string, unknown> = {}) {
  return {
    ok: true,
    sema: motor.SEMA,
    ozet,
    denetlendi: NOW.toISOString(),
    degisti: NOW.toISOString(),
    tablo: 'https://docs.google.com/spreadsheets/d/ornek-tablo/edit',
    model,
    ...extra,
  };
}

export const exampleTohum = tohum;
