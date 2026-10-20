/**
 * Giderler (OPEX) sayfasının veri sözleşmesi: Google Apps Script web uygulamasının (site/apps-script) yanıtı.
 * Kişi adı, ücret ve tutar repoda yoktur; sayfa veriyi çalışma anında, erişim anahtarıyla Google Sheets’ten okur.
 * Model alanları apps-script/src/Motor.js → hesapla() çıktısıyla aynıdır (sema 1).
 */

export const OPEX_SCHEMA = 1;

/**
 * Yayınlanan web uygulaması adresi (gizli değildir). Sheets → Parametreler → “Sayfa erişimi” Herkese açık ise sayfa
 * bu adresten anahtarsız okur; Anahtarla ise anahtar istenir. Boşsa sayfadaki Bağlantı alanından girilir.
 */
export const OPEX_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxHXSXT5WN8FgodjphXxkBwCBuZoKPMdN_3amyMgljGOyzpO7ShQohmDx6go-gtPidx/exec';

/** Canlı denetim aralığı: sayfa görünürken bu aralıkla Sheets’teki değişikliği sorar (yalnız özet döner). */
export const OPEX_POLL_MS = 15_000;
export const OPEX_TIMEOUT_MS = 30_000;
export const OPEX_STORE_KEY = 'istoc-opex-baglanti';

const ENDPOINT_RE = /^https:\/\/script\.google\.com\/(?:a\/macros\/[^/\s]+|macros)\/s\/[A-Za-z0-9_-]{20,}\/exec$/;
const SHEET_RE = /^https:\/\/docs\.google\.com\/spreadsheets\//;

export const isEndpoint = (value: string) => ENDPOINT_RE.test(value.trim());

export type KumeKod = 'teknoloji' | 'insan' | 'ofis';
export interface Kume3 {
  teknoloji: number;
  insan: number;
  ofis: number;
  toplam: number;
}

export interface Satir {
  ay: number;
  brut: number;
  pek: number;
  sgkIsci: number;
  issizlikIsci: number;
  gvMatrahi: number;
  kumulatifMatrah: number;
  gvHam: number;
  gvIstisna: number;
  gv: number;
  dvHam: number;
  dvIstisna: number;
  dv: number;
  net: number;
  sgkIsveren: number;
  issizlikIsveren: number;
  tesvik: number;
  fatura: number;
  kdvHaric: number;
  kdv: number;
  maliyet: number;
}

export interface KisiYili {
  aylar: Satir[];
  toplam: Satir;
  tesvikler: Record<string, number>;
}

export interface Kisi {
  /** Personel sayfasındaki satır (aynı ad iki satırda olsa da kimlik). */
  satir: number;
  ad: string;
  tur: 'Bordrolu' | 'Freelancer';
  esas: string;
  tutar: number;
  tutar2027: number;
  zam: boolean;
  zamOrani: number;
  tesvik: { kod: string; ad: string } | null;
  asgariDestek: boolean;
  not: string;
  y2026: KisiYili;
  y2027: KisiYili;
}

export interface Gider {
  satir: number;
  kalem: string;
  hesap: string;
  kume: KumeKod;
  kategori: string;
  para: 'TRY' | 'USD' | 'EUR';
  tutar: number;
  tl: number;
  tl2027: number;
  artis: 'Kur' | 'Kira' | 'Genel' | 'Yok';
  artisOrani: number;
  odendi: boolean;
  eksik: boolean;
  fatura: string;
  not: string;
}

export interface Tesvik {
  kod: string;
  ad: string;
  tur: string;
  deger2026: number;
  deger2027: number;
  kapsam: 'Standart' | 'Koşullu';
  birlikte: boolean;
  etkin: boolean;
  kosul: string;
  uygulananlar: string[];
  buAy: number;
  yil2026: number;
  yil2027: number;
}

export interface Parametre {
  grup: string;
  ad: string;
  anahtar: string;
  deger: number | string;
  birim: string;
  tur: 'oran' | 'tutar' | 'kur' | 'sayi' | 'metin' | 'liste';
  aciklama: string;
}

export interface OpexModel {
  sema: number;
  surum: string;
  hesaplandi: string;
  /** Sheets → Parametreler → Sayfa erişimi. */
  erisim: 'Herkese açık' | 'Anahtarla';
  donem: { yil: number; ay: number; ayAdi: string; etiket: string };
  kur: Record<'USD' | 'EUR' | 'TRY', { deger: number; kaynak: string }>;
  enflasyon: { yillik: number; aylik: number; ortalama12: number; yiufeAylik: number; donem: string; kaynak: string };
  zam: { esas: string; oran: number; ekPuan: number };
  artis2027: { kira: number; genel: number; kur: number; dilim: number };
  asgari: Record<'y2026' | 'y2027', { brut: number; net: number; tavan: number }>;
  ozet: {
    buAy: Kume3;
    aylikOrt2026: Kume3;
    aylikOrt2027: Kume3;
    yil2026: Kume3;
    yil2027: Kume3;
    degisim: number;
    odeme: { odenen: number; bekleyen: number; adetOdenen: number; adetBekleyen: number };
  };
  kumeler: { kod: KumeKod; ad: string }[];
  kategoriler: { kume: KumeKod; kategori: string; buAy: number; aylik2027: number }[];
  aylik: { ay: number; ad: string; kisa: string; y2026: Kume3; y2027: Kume3 }[];
  giderler: Gider[];
  kisiler: Kisi[];
  bordroKopru: Satir;
  tesvikler: Tesvik[];
  parametreler: Parametre[];
  uyarilar: string[];
}

export interface PlanAy extends Kume3 {
  yil: number;
  ay: number;
  ad: string;
  kisa: string;
}

/**
 * 12 aylık plan: rapor ayından başlayarak ay ay (2026 ayları 2026 hesabı, 2027 ayları zamlı 2027 hesabı); 2027 sonrası
 * hesaplanmaz. Motor.js → plan ile aynı kural; sayfa eski Apps Script sürümleriyle de çalışsın diye aylık seriden türetilir.
 */
export function planOf(m: Pick<OpexModel, 'aylik' | 'donem'>): { aylar: PlanAy[]; toplam: Kume3 } {
  const aylar: PlanAy[] = [];
  for (let n = 0; n < 12; n++) {
    const sira = m.donem.ay - 1 + n;
    const yil = m.donem.yil + Math.floor(sira / 12);
    if (yil > 2027) break;
    const a = m.aylik[sira % 12];
    const k = yil === 2027 ? a.y2027 : a.y2026;
    aylar.push({ yil, ay: (sira % 12) + 1, ad: `${a.ad} ${yil}`, kisa: `${a.kisa} ${String(yil).slice(2)}`, ...k });
  }
  const sum = (f: keyof Kume3) => Math.round(aylar.reduce((t, x) => t + x[f], 0) * 100) / 100;
  return { aylar, toplam: { teknoloji: sum('teknoloji'), insan: sum('insan'), ofis: sum('ofis'), toplam: sum('toplam') } };
}

export interface OpexData {
  model: OpexModel;
  ozet: string;
  tablo: string | null;
  denetlendi: string;
  degisti: string | null;
}

export type OpexReply =
  | { kind: 'data'; data: OpexData }
  | { kind: 'unchanged'; ozet: string; denetlendi: string; degisti: string | null }
  | { kind: 'error'; code: 'yetki' | 'kurulum' | 'istek' | 'sema' | 'sunucu'; message: string };

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isKume3 = (v: unknown) => isObj(v) && isNum(v.teknoloji) && isNum(v.insan) && isNum(v.ofis) && isNum(v.toplam);
const hasMonths = (y: unknown) => isObj(y) && Array.isArray(y.aylar) && y.aylar.length === 12 && isObj(y.toplam);
const isRate = (v: unknown) => isObj(v) && isNum(v.deger) && v.deger > 0;
const isWage = (v: unknown) => isObj(v) && isNum(v.brut) && isNum(v.net) && isNum(v.tavan);
const str = (v: unknown) => (typeof v === 'string' ? v : '');

/** Yanıtı çalışma anında doğrular; beklenmeyen biçim sayfayı bozmaz, hata olarak döner. */
export function parseReply(json: unknown): OpexReply {
  if (!isObj(json)) return { kind: 'error', code: 'sunucu', message: 'Sunucu yanıtı okunamadı.' };
  if (json.ok !== true) {
    const code = json.hata === 'yetki' || json.hata === 'kurulum' || json.hata === 'istek' ? json.hata : 'sunucu';
    return { kind: 'error', code, message: str(json.mesaj) || 'Sunucu hata döndürdü.' };
  }
  if (json.sema !== OPEX_SCHEMA) {
    return { kind: 'error', code: 'sema', message: `Apps Script sürümü bu sayfayla uyumsuz (şema ${String(json.sema)}). Sheets’teki kodu güncelleyin.` };
  }
  const ozet = str(json.ozet);
  const denetlendi = str(json.denetlendi) || new Date().toISOString();
  const degisti = str(json.degisti) || null;
  if (json.degismedi === true) return { kind: 'unchanged', ozet, denetlendi, degisti };
  const m = json.model;
  const ok =
    isObj(m) &&
    m.sema === OPEX_SCHEMA &&
    isObj(m.ozet) &&
    isKume3(m.ozet.buAy) &&
    isKume3(m.ozet.aylikOrt2026) &&
    isKume3(m.ozet.aylikOrt2027) &&
    isKume3(m.ozet.yil2026) &&
    isKume3(m.ozet.yil2027) &&
    isNum(m.ozet.degisim) &&
    isObj(m.ozet.odeme) &&
    isNum(m.ozet.odeme.odenen) &&
    isNum(m.ozet.odeme.bekleyen) &&
    isObj(m.donem) &&
    isNum(m.donem.ay) &&
    m.donem.ay >= 1 &&
    m.donem.ay <= 12 &&
    (m.donem.yil === 2026 || m.donem.yil === 2027) &&
    Array.isArray(m.aylik) &&
    m.aylik.length === 12 &&
    m.aylik.every((a) => isObj(a) && isKume3(a.y2026) && isKume3(a.y2027)) &&
    Array.isArray(m.giderler) &&
    m.giderler.every((g) => isObj(g) && isNum(g.tl) && isNum(g.tl2027) && typeof g.kalem === 'string') &&
    Array.isArray(m.kisiler) &&
    m.kisiler.every((k) => isObj(k) && isNum(k.satir) && typeof k.ad === 'string' && hasMonths(k.y2026) && hasMonths(k.y2027)) &&
    isObj(m.asgari) &&
    isWage(m.asgari.y2026) &&
    isWage(m.asgari.y2027) &&
    Array.isArray(m.kategoriler) &&
    Array.isArray(m.tesvikler) &&
    Array.isArray(m.parametreler) &&
    Array.isArray(m.uyarilar) &&
    isObj(m.bordroKopru) &&
    isObj(m.kur) &&
    isRate(m.kur.USD) &&
    isRate(m.kur.EUR) &&
    isObj(m.zam) &&
    isNum(m.zam.oran) &&
    isObj(m.enflasyon) &&
    isObj(m.artis2027);
  if (!ok) return { kind: 'error', code: 'sema', message: 'Yanıt beklenen biçimde değil; Apps Script kodunu güncelleyin.' };
  const tablo = str(json.tablo);
  return { kind: 'data', data: { model: m as unknown as OpexModel, ozet, tablo: SHEET_RE.test(tablo) ? tablo : null, denetlendi, degisti } };
}

/* ---------- Bağlantı (yalnız bu tarayıcıda) ---------- */

export interface OpexConnection {
  endpoint: string;
  /** Boş: herkese açık veri ucu (anahtar gönderilmez). */
  key: string;
  remember: boolean;
}

/** Kayıtlı bağlantı yoksa yapılandırılmış veri ucu (anahtarsız). */
export const defaultConnection = (): OpexConnection | null => (isEndpoint(OPEX_ENDPOINT) ? { endpoint: OPEX_ENDPOINT, key: '', remember: false } : null);

function storages(): Storage[] {
  const out: Storage[] = [];
  try {
    out.push(window.localStorage);
  } catch {
    /* depolama kapalı */
  }
  try {
    out.push(window.sessionStorage);
  } catch {
    /* depolama kapalı */
  }
  return out;
}

export function loadConnection(): OpexConnection | null {
  let local: Storage | null = null;
  try {
    local = window.localStorage;
  } catch {
    local = null;
  }
  for (const store of storages()) {
    try {
      const raw = store.getItem(OPEX_STORE_KEY);
      if (!raw) continue;
      const value = JSON.parse(raw) as unknown;
      if (isObj(value) && typeof value.endpoint === 'string' && typeof value.key === 'string' && isEndpoint(value.endpoint)) {
        return { endpoint: value.endpoint, key: value.key, remember: store === local };
      }
    } catch {
      /* bozuk kayıt yok sayılır */
    }
  }
  return null;
}

/** “Hatırla” seçiliyse localStorage, değilse yalnız bu sekme (sessionStorage). Yazılamazsa false. */
export function saveConnection(conn: OpexConnection): boolean {
  clearConnection();
  try {
    const target = conn.remember ? window.localStorage : window.sessionStorage;
    target.setItem(OPEX_STORE_KEY, JSON.stringify({ endpoint: conn.endpoint, key: conn.key }));
    return true;
  } catch {
    return false;
  }
}

export function clearConnection() {
  for (const store of storages()) {
    try {
      store.removeItem(OPEX_STORE_KEY);
    } catch {
      /* yok */
    }
  }
}

/** Web uygulamasına tek istek. Anahtar adreste değil, gövdede (text/plain JSON; ön kontrol isteği yok) gider. */
export async function requestOpex(conn: OpexConnection, lastDigest: string, signal: AbortSignal): Promise<OpexReply> {
  let response: Response;
  try {
    response = await fetch(conn.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ anahtar: conn.key || undefined, ozet: lastDigest || undefined }),
      redirect: 'follow',
      cache: 'no-store',
      credentials: 'omit',
      signal,
    });
  } catch (error) {
    if (signal.aborted) throw error;
    return { kind: 'error', code: 'sunucu', message: 'Google Apps Script’e ulaşılamadı (ağ veya adres).' };
  }
  if (!response.ok) return { kind: 'error', code: 'sunucu', message: `Sunucu ${response.status} döndürdü.` };
  let json: unknown;
  try {
    json = await response.json();
  } catch (error) {
    // Zaman aşımı gövde okunurken de gelebilir: biçim hatası gibi gösterilmez.
    if (signal.aborted) throw error;
    return { kind: 'error', code: 'sunucu', message: 'Yanıt JSON değil. Web uygulaması erişimi “Herkes” olmalı.' };
  }
  return parseReply(json);
}
