import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type SubmitEvent } from 'react';
import { createPortal } from 'react-dom';
import { Checkbox, TextInput } from '@mantine/core';
import { IconExternalLink, IconRefresh, IconSettings } from '@tabler/icons-react';
import { AppFrame, PAGE_TOOLS_ID } from '../components/AppFrame';
import { Chart, DataTable, FactsRow, Hero, Note, Section, type Column } from '../components/ui';
import {
  OPEX_ENDPOINT,
  OPEX_MIN_GAP_MS,
  OPEX_MIN_WAIT_MS,
  OPEX_POLL_MS,
  OPEX_TIMEOUT_MS,
  OPEX_WAIT_TIMEOUT_MS,
  clearConnection,
  defaultConnection,
  isEndpoint,
  donemOf,
  giderDonem,
  kisiAylari,
  kisiDonem,
  loadConnection,
  requestOpex,
  saveConnection,
  type Gider,
  type Kisi,
  type KumeKod,
  type OpexConnection,
  type OpexData,
  type Donem,
  type DonemAy,
  type KalemDonem,
  type Kume3,
  type OpexModel,
  type Parametre,
  type Satir,
  type Tesvik,
  type Yil,
} from '../data/opex';
import type { OpexTone } from '../lib/chartSpec';
import { tl, tlExact } from '../lib/format';

/* ---------- Biçimler ---------- */

const pct2 = (r: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(r * 100)}`;
const signed = (r: number) => `${r > 0 ? '+' : r < 0 ? '−' : ''}${pct2(Math.abs(r))}`;
/** Değişim oranı; önceki değer 0 ise (ör. tüm kalemleri işaretsiz ay) “—”. */
const change = (now: number, before: number) => (before ? signed(now / before - 1) : '—');
const money = (value: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const rate = (value: number) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)} ₺`;
const clock = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso)) : '—';
const stamp = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const KUME_TONE: Record<KumeKod, OpexTone> = { teknoloji: 'tech', insan: 'people', ofis: 'office' };
const KUME_AD: Record<KumeKod, string> = { teknoloji: 'Teknoloji', insan: 'Personel', ofis: 'Ofis ve işletme' };

/**
 * Sheets’ten yeni veri gelince değişen değer kısa süre vurgulanır (data-changed; geçiş tokenlarla, hareket azaltmada
 * anında). Yalnız veri özeti değiştiğinde: süzgeç ya da yıl sekmesi değişince vurgu yok, ilk çizimde yok.
 */
const OzetContext = createContext('');
const CHANGED_HOLD_MS = 1600;
function useChanged(value: string) {
  const ozet = useContext(OzetContext);
  const prev = useRef({ value, ozet });
  const timer = useRef(0);
  const [changed, setChanged] = useState(false);
  useEffect(() => () => window.clearTimeout(timer.current), []);
  useEffect(() => {
    const p = prev.current;
    prev.current = { value, ozet };
    if (p.value === value || p.ozet === ozet) return;
    setChanged(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setChanged(false), CHANGED_HOLD_MS);
  }, [value, ozet]);
  return changed ? '' : undefined;
}

/** Sağa hizalı, eşit genişlikli rakam (tablo sayıları); değişince vurgulanır. */
const Num = ({ children }: { children: ReactNode }) => {
  const changed = useChanged(typeof children === 'string' || typeof children === 'number' ? String(children) : '');
  return (
    <span className="opex-num" data-changed={changed}>
      {children}
    </span>
  );
};

/** Değişince vurgulanan değer paragrafı (dönem toplamı, grup kutuları). */
function Value({ className, children }: { className: string; children: string }) {
  return (
    <p className={className} data-changed={useChanged(children)}>
      {children}
    </p>
  );
}
const Dot = ({ tone }: { tone: OpexTone }) => <span className="opex-dot" data-tone={tone} aria-hidden="true" />;

/* ---------- Canlı bağlantı ---------- */

const OPEX_WAKE_MS = 5_000;

type Live =
  | { status: 'init' }
  | { status: 'setup'; error?: string }
  | { status: 'loading' }
  | { status: 'failed'; error: string }
  | { status: 'ready'; data: OpexData; checked: string; stale?: string; push?: boolean };

/**
 * Sayfa görünürken Apps Script’e bekleyen istek gönderir: sunucu Sheets değişene ya da ≈20 sn dolana kadar yanıtı
 * bekletir, yanıt gelince hemen yeniden sorulur (değişiklik birkaç saniyede gelir). Sunucu beklemiyorsa (eski kod) ya da
 * hata olursa OPEX_POLL_MS aralığıyla sorar. Özet değişmediyse yalnız denetim zamanı güncellenir; değiştiyse yeni model
 * aynı bileşenlere verilir (sayfa yeniden kurulmaz, yalnız değişen değerler değişir). Sekme gizliyken sormaz; görünür
 * olunca ve ağ geri gelince hemen sorar. Zamanlanmış iş değildir: sayfa kapanınca durur.
 */
function useOpexLive() {
  const [conn, setConn] = useState<OpexConnection | null>(null);
  const [live, setLive] = useState<Live>({ status: 'init' });
  const [refresh, setRefresh] = useState(0);
  const [announce, setAnnounce] = useState('');
  const digest = useRef('');
  const last = useRef<OpexData | null>(null);
  /** “Şimdi yenile”: bir sonraki istek beklemeden sorar. */
  const noWait = useRef(false);

  useEffect(() => {
    const stored = loadConnection() ?? defaultConnection();
    if (stored) {
      setConn(stored);
      setLive({ status: 'loading' });
    } else setLive({ status: 'setup' });
  }, []);

  useEffect(() => {
    if (!conn) return undefined;
    let stopped = false;
    let timer = 0;
    let active: AbortController | null = null;
    const schedule = (ms = OPEX_POLL_MS) => {
      window.clearTimeout(timer);
      if (!stopped) timer = window.setTimeout(() => void tick(), ms);
    };
    let retry = false;
    /** Sunucu yanıtı bekletti (ya da veri geldi): bir sonraki istek hemen (en az OPEX_MIN_GAP_MS arayla). */
    let soon = false;
    /** Sunucu bekleyen isteği destekliyor: varsayılan evet; bekletilmeden gelen “değişmedi” (eski kod) hayır yapar. */
    let pushing = true;
    let lastStart = 0;
    const tick = async () => {
      // Süren istek iptal edilmez: yanıt birkaç saniye sürer, yeni istek onu hiç bitirtmezdi.
      if (stopped || active) return;
      retry = false;
      soon = false;
      if (document.visibilityState === 'hidden') {
        schedule();
        return;
      }
      lastStart = Date.now();
      const own = new AbortController();
      active = own;
      const wait = !!digest.current && !noWait.current;
      noWait.current = false;
      const limit = wait ? OPEX_WAIT_TIMEOUT_MS : OPEX_TIMEOUT_MS;
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        own.abort();
      }, limit);
      try {
        const reply = await requestOpex(conn, digest.current, own.signal, wait);
        if (stopped || active !== own) return;
        if (reply.kind === 'data') {
          const changed = !!last.current && last.current.ozet !== reply.data.ozet;
          digest.current = reply.data.ozet;
          last.current = reply.data;
          // Yeni veri sonrası bekleyen istek hemen açılır; sunucu beklemiyorsa (eski kod) “değişmedi” yanıtı aralığa döner.
          soon = true;
          pushing = pushing || reply.bekledi;
          setLive({ status: 'ready', data: reply.data, checked: reply.data.denetlendi, push: pushing });
          if (changed) {
            const m = reply.data.model;
            setAnnounce(`Veriler güncellendi: ${m.donem.etiket} toplam OPEX ${tl(m.ozet.buAy.toplam)}.`);
          }
        } else if (reply.kind === 'unchanged') {
          const data = last.current;
          if (data) {
            const next = { ...data, degisti: reply.degisti ?? data.degisti, denetlendi: reply.denetlendi };
            last.current = next;
            // Yalnız bekleyen istekte sunucunun beklediği anlaşılır; “Şimdi yenile” (beklemesiz) kipi değiştirmez.
            // Bekledim deyip hemen dönen yanıt beklememiştir: art arda istek olmasın diye aralığa dönülür.
            if (wait) {
              pushing = reply.bekledi;
              soon = reply.bekledi && Date.now() - lastStart >= OPEX_MIN_WAIT_MS;
            } else soon = pushing;
            setLive({ status: 'ready', data: next, checked: reply.denetlendi, push: pushing });
          } else {
            // Elde veri yokken “değişmedi” gelirse (yarış) özet sıfırlanır ve hemen tüm model istenir.
            digest.current = '';
            retry = true;
          }
        } else if (reply.code === 'yetki' || reply.code === 'kurulum') {
          stopped = true;
          digest.current = '';
          last.current = null;
          setLive({ status: 'setup', error: !conn.key && reply.code === 'yetki' ? 'Bu veri ucu erişim anahtarı istiyor; anahtarı girin.' : reply.message });
        } else if (last.current) {
          setLive({ status: 'ready', data: last.current, checked: last.current.denetlendi, stale: reply.message });
        } else setLive({ status: 'failed', error: reply.message });
      } catch {
        if (stopped || active !== own) return;
        const message = timedOut ? `Yanıt ${Math.round(limit / 1000)} sn içinde gelmedi.` : 'İstek kesildi.';
        if (last.current) setLive({ status: 'ready', data: last.current, checked: last.current.denetlendi, stale: message });
        else setLive({ status: 'failed', error: message });
      } finally {
        window.clearTimeout(timeout);
        if (active === own) active = null;
        if (retry && !stopped) {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => void tick(), 0);
        } else if (soon) schedule(Math.max(0, OPEX_MIN_GAP_MS - (Date.now() - lastStart)));
        else schedule();
      }
    };
    /** Sekme görünür olunca veya ağ dönünce hemen sor; görünürlük sık gidip gelse de en çok OPEX_WAKE_MS’de bir. */
    const wake = () => {
      if (document.visibilityState !== 'visible' || stopped || active || Date.now() - lastStart < OPEX_WAKE_MS) return;
      window.clearTimeout(timer);
      void tick();
    };
    document.addEventListener('visibilitychange', wake);
    window.addEventListener('online', wake);
    void tick();
    return () => {
      stopped = true;
      window.clearTimeout(timer);
      active?.abort();
      document.removeEventListener('visibilitychange', wake);
      window.removeEventListener('online', wake);
    };
  }, [conn, refresh]);

  return {
    conn,
    live,
    announce,
    connect: (next: OpexConnection) => {
      const stored = saveConnection(next);
      digest.current = '';
      last.current = null;
      setConn(next);
      setLive({ status: 'loading' });
      return stored;
    },
    disconnect: () => {
      clearConnection();
      digest.current = '';
      last.current = null;
      setConn(null);
      setLive({ status: 'setup' });
    },
    refreshNow: () => {
      noWait.current = true;
      setRefresh((n) => n + 1);
    },
  };
}

/* ---------- Yükleyici ---------- */

/**
 * Belirgin yükleyici: gerçek geçen süre (sahte ilerleme yok), gidip gelen belirsiz çubuk (simetrik eğri, döngü tokenı;
 * hareket azaltmada durur) ve sayfanın iskeleti. Ekran okuyucu yalnız başlığı bir kez duyar; saniye sayacı duyurulmaz.
 */
function Loader() {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => setSeconds(Math.floor((Date.now() - start) / 1000)), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="opex-loader" data-loading="">
      <div className="opex-loader-head">
        <p className="opex-loader-title" role="status">
          Google Sheets’ten veriler alınıyor
        </p>
        <p className="opex-loader-meta" aria-hidden="true">
          {seconds} sn{seconds >= 6 ? ' · Apps Script ilk istekte birkaç saniye sürebilir' : ''}
        </p>
      </div>
      <div className="opex-loader-bar" aria-hidden="true">
        <span />
      </div>
      <div className="opex-skeleton" aria-hidden="true">
        <span className="opex-skel opex-skel-hero" />
        <span className="opex-skel-row">
          <span className="opex-skel opex-skel-tile" />
          <span className="opex-skel opex-skel-tile" />
          <span className="opex-skel opex-skel-tile" />
        </span>
        <span className="opex-skel-row opex-skel-row-wide">
          <span className="opex-skel opex-skel-chart" />
          <span className="opex-skel opex-skel-chart" />
        </span>
      </div>
    </div>
  );
}

/* ---------- Bağlantı formu ---------- */

function ConnectForm({ initial, error, onConnect, onCancel }: { initial: OpexConnection | null; error?: string; onConnect: (c: OpexConnection) => void; onCancel?: () => void }) {
  const [endpoint, setEndpoint] = useState(initial?.endpoint ?? OPEX_ENDPOINT);
  const [key, setKey] = useState(initial?.key ?? '');
  // Varsayılan yalnız bu sekme: github.io kökü kullanıcının diğer Pages projeleriyle paylaşılır.
  const [remember, setRemember] = useState(initial?.remember ?? false);
  const [problem, setProblem] = useState('');
  const errorId = useId();
  const submit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    const url = endpoint.trim();
    if (!isEndpoint(url)) {
      setProblem('Adres script.google.com ile başlayıp “/exec” ile bitmeli: Apps Script → Dağıt → Web uygulaması adresi.');
      return;
    }
    setProblem('');
    onConnect({ endpoint: url, key: key.trim(), remember });
  };
  const message = problem || error;
  return (
    <form className="opex-connect" onSubmit={submit} noValidate aria-describedby={message ? errorId : undefined}>
      <h3 className="block-title">Google Sheets bağlantısı</h3>
      <p className="opex-connect-lead">
        Veriler bu sayfada saklanmaz; Google Sheets’teki Apps Script web uygulamasından okunur. Sheets’te erişim “Anahtarla” ise anahtar
        gerekir; anahtar yalnız bu tarayıcıda tutulur ve adreste taşınmaz.
      </p>
      <TextInput
        className="opex-field"
        classNames={{ label: 'opex-field-label', input: 'opex-input', description: 'opex-field-help' }}
        label="Web uygulaması adresi"
        description="Apps Script → Dağıt → Web uygulaması adresi (…/exec)"
        type="url"
        inputMode="url"
        autoComplete="off"
        spellCheck={false}
        value={endpoint}
        onChange={(e) => setEndpoint(e.currentTarget.value)}
        placeholder="https://script.google.com/macros/s/…/exec"
      />
      <TextInput
        className="opex-field"
        classNames={{ label: 'opex-field-label', input: 'opex-input', description: 'opex-field-help' }}
        label="Erişim anahtarı"
        description="Erişim “Herkese açık” ise boş bırakın; değilse Sheets → OPEX → Web bağlantısı bilgisi"
        type="password"
        autoComplete="off"
        spellCheck={false}
        value={key}
        onChange={(e) => setKey(e.currentTarget.value)}
      />
      <Checkbox
        className="opex-remember"
        classNames={{ input: 'opex-check-input', label: 'opex-check-label', body: 'opex-check-body' }}
        label="Bu cihazda hatırla (önerilmez: aynı github.io adresindeki diğer sayfalar da okuyabilir; kapalıysa yalnız bu sekmede)"
        checked={remember}
        onChange={(e) => setRemember(e.currentTarget.checked)}
      />
      {message ? (
        <p className="opex-error" id={errorId} role="alert">
          {message}
        </p>
      ) : null}
      <div className="opex-actions">
        <button type="submit" className="opex-btn" data-primary="">
          Bağlan
        </button>
        {onCancel ? (
          <button type="button" className="opex-btn" onClick={onCancel}>
            Vazgeç
          </button>
        ) : null}
      </div>
      <ol className="opex-steps">
        <li>Google Sheets’te Uzantılar → Apps Script’e paketi yapıştırın; OPEX menüsünden “Kurulum / onarım” çalıştırın.</li>
        <li>Dağıt → Yeni dağıtım → Web uygulaması: “Ben olarak çalıştır”, erişim “Herkes”.</li>
        <li>OPEX → “Web bağlantısı bilgisi”nden adresi ve anahtarı kopyalayıp buraya girin.</li>
      </ol>
    </form>
  );
}

/* ---------- Canlı durum şeridi ---------- */

/**
 * Canlı durum (kullanıcı kararı 2026-10-20: küçük, başlığın altında): kırıntı satırının sağında tek satır; durum
 * noktası, kısa metin ve simge düğmeler (erişilebilir adlarıyla). Ayrıntı (erişim, son denetim) ipucunda.
 */
function LiveStrip({ live, settingsOpen, onRefresh, onSettings }: { live: Extract<Live, { status: 'ready' }>; settingsOpen: boolean; onRefresh: () => void; onSettings: () => void }) {
  // Yalnız istemcide (veri gelince) çizilir: hedef ilk çizimde bulunur, şerit gövdede bir an görünmez.
  const [host] = useState<HTMLElement | null>(() => document.getElementById(PAGE_TOOLS_ID));
  const detay = `Erişim: ${live.data.model.erisim === 'Herkese açık' ? 'herkese açık' : 'anahtarla'} · Son denetim ${clock(live.checked)} · Sheets’te son değişiklik ${clock(live.data.degisti)}`;
  const strip = (
    <div className="opex-live" data-state={live.stale ? 'stale' : 'live'}>
      <p className="opex-live-status" title={detay}>
        <span className="opex-live-dot" aria-hidden="true" />
        <span className="opex-live-label">{live.stale ? 'Bağlantı sorunu' : 'Canlı'}</span>
        <span className="opex-live-meta">
          Sheets {clock(live.data.degisti)} · {live.push ? 'anlık' : `${OPEX_POLL_MS / 1000} sn’de bir`}
        </span>
        <span className="visually-hidden"> · {detay}</span>
      </p>
      <button type="button" className="opex-icon-btn" aria-label="Şimdi yenile" title="Şimdi yenile" onClick={onRefresh}>
        <IconRefresh size={20} stroke={1.75} aria-hidden="true" />
      </button>
      {live.data.tablo ? (
        <a className="opex-icon-btn" href={live.data.tablo} target="_blank" rel="noopener noreferrer" aria-label="Google Sheets’te aç" title="Google Sheets’te aç">
          <IconExternalLink size={20} stroke={1.75} aria-hidden="true" />
        </a>
      ) : null}
      <button type="button" className="opex-icon-btn" aria-label="Bağlantı" title="Bağlantı" aria-expanded={settingsOpen ? 'true' : 'false'} onClick={onSettings}>
        <IconSettings size={20} stroke={1.75} aria-hidden="true" />
      </button>
    </div>
  );
  return host ? createPortal(strip, host) : strip;
}

/* ---------- Seçim düğmeleri (aria-pressed) ---------- */

function Toggles<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="opex-toggles" role="group" aria-label={label}>
      {options.map((o, i) => (
        <button key={`${i}-${o.value}`} type="button" className="opex-toggle" aria-pressed={o.value === value ? 'true' : 'false'} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

/* ---------- Yıl sekmeleri ---------- */

/** İki büyük sekme (APG Tabs): 2026 (rapor ayından Aralık’a) ve 2027 (12 ay). Oklar, Home/End sekme değiştirir. */
function YearTabs({ value, onChange, donemler }: { value: Yil; onChange: (y: Yil) => void; donemler: Donem[] }) {
  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const i = donemler.findIndex((d) => d.yil === value);
    const next =
      event.key === 'ArrowRight' ? donemler[(i + 1) % donemler.length] : event.key === 'ArrowLeft' ? donemler[(i - 1 + donemler.length) % donemler.length] : event.key === 'Home' ? donemler[0] : event.key === 'End' ? donemler[donemler.length - 1] : null;
    if (!next) return;
    event.preventDefault();
    onChange(next.yil);
    document.getElementById(`yil-${next.yil}`)?.focus();
  };
  return (
    <div className="opex-years" role="tablist" aria-label="Yıl">
      {donemler.map((d) => (
        <button
          key={d.yil}
          id={`yil-${d.yil}`}
          type="button"
          role="tab"
          className="opex-year"
          aria-selected={d.yil === value}
          aria-controls="yil-paneli"
          tabIndex={d.yil === value ? 0 : -1}
          onClick={() => onChange(d.yil)}
          onKeyDown={move}
        >
          <span className="opex-year-head">
            <span className="opex-year-num">{d.yil}</span>
            <svg className="opex-radio" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle className="opex-radio-ring" cx="12" cy="12" r="10" strokeWidth="2" />
              <circle className="opex-radio-dot" cx="12" cy="12" r="6" />
            </svg>
          </span>
          <span className="opex-year-sub">
            {d.etiket.replace(` ${d.yil}`, '')} · <span className="opex-year-total">{tl(d.toplam.toplam)}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

/* ---------- Bölümler (seçili yıl) ---------- */

function ShareBar({ ratio, tone }: { ratio: number; tone: OpexTone }) {
  const width = Math.max(0, Math.min(100, ratio * 100));
  return (
    <svg className="opex-share" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className="opex-share-track" x="0" y="0" width="100" height="6" />
      <rect className="opex-share-fill" data-tone={tone} x="0" y="0" width={width} height="6" />
    </svg>
  );
}

/** Gruplar; tanımları “Kalemler” bölümünün açıklamasında (ilk ekranda kutular kısa kalır). */
const GRUPLAR: { kume: KumeKod; tone: OpexTone }[] = [
  { kume: 'teknoloji', tone: 'tech' },
  { kume: 'ofis', tone: 'office' },
  { kume: 'insan', tone: 'people' },
];

/** Dönemin kategori toplamları: her ayın kendi tutarı (Sheets aylık ızgarası); personel her ayın maliyeti. */
function kategoriler(m: OpexModel, d: Donem) {
  const map = new Map<string, { kume: KumeKod; value: number }>();
  const add = (kume: KumeKod, name: string, v: number) => {
    const cur = map.get(name);
    map.set(name, { kume, value: (cur?.value ?? 0) + v });
  };
  for (const g of m.giderler) add(g.kume, g.kategori, giderDonem(g, d).toplam);
  for (const k of m.kisiler) add('insan', k.tur === 'Freelancer' ? 'Freelancer (fatura)' : 'Bordrolu personel', kisiDonem(k, d).toplam.maliyet);
  return [...map.entries()].map(([name, x]) => ({ name, ...x })).sort((a, b) => b.value - a.value);
}

function Overview({ m, d }: { m: OpexModel; d: Donem }) {
  const total = d.toplam.toplam;
  const onceki = d.yil === 2027 ? donemOf(m, 2026) : null;
  const kats = kategoriler(m, d);
  return (
    <>
      <div className="opex-kpis">
        <div className="opex-hero" data-edge="top">
          <p className="opex-hero-label">{d.etiket} · toplam OPEX</p>
          <Value className="opex-hero-value">{tl(total)}</Value>
          <p className="opex-hero-note">
            Aylık ortalama {tl(d.ortalama.toplam)} · {d.aySayisi} ay
            {d.yil === 2026 && m.donem.yil === 2026 ? ` · ${m.donem.etiket} (bu ay) ${tl(m.ozet.buAy.toplam)}` : ''}
            {onceki ? ` · 2026 (${onceki.etiket.replace(' 2026', '')}) aylık ortalamasına göre ${change(d.ortalama.toplam, onceki.ortalama.toplam)}` : ''}
          </p>
        </div>
        <ul className="opex-tiles">
          {GRUPLAR.map((t) => (
            <li key={t.kume} className="opex-tile">
              <p className="opex-tile-label">
                <Dot tone={t.tone} />
                {KUME_AD[t.kume]}
              </p>
              <Value className="opex-tile-value">{tl(d.toplam[t.kume])}</Value>
              <ShareBar ratio={total ? d.toplam[t.kume] / total : 0} tone={t.tone} />
              <p className="opex-tile-note">
                Payı {pct2(total ? d.toplam[t.kume] / total : 0)} · aylık {tl(d.ortalama[t.kume])}
              </p>
            </li>
          ))}
        </ul>
      </div>
      <div className="opex-grid">
        <Chart
          id={`gruplar-${d.yil}`}
          title="Gruplar"
          note={`${d.etiket} toplamı, ₺ ve pay`}
          size="sm"
          rows={GRUPLAR.length}
          summary={GRUPLAR.map((t) => `${KUME_AD[t.kume]} ${tl(d.toplam[t.kume])}`).join('; ')}
          spec={{ kind: 'opex-bar', share: total, items: GRUPLAR.map((t) => ({ name: KUME_AD[t.kume], value: d.toplam[t.kume], tone: t.tone })).sort((a, b) => b.value - a.value) }}
        />
        <Chart
          id={`kategoriler-${d.yil}`}
          title="Kategoriler"
          note={`${d.etiket} toplamı; renk grubu gösterir`}
          size="lg"
          rows={kats.length}
          summary={kats.map((k) => `${k.name} ${tl(k.value)}`).join('; ')}
          spec={{ kind: 'opex-bar', share: total, items: kats.map((k) => ({ name: k.name, value: k.value, tone: KUME_TONE[k.kume] })) }}
        />
      </div>
    </>
  );
}

type PlanRow = { kind: 'ay'; a: DonemAy; onceki: Kume3 | null } | { kind: 'total'; a: Kume3 & { ad: string } };

function Plan({ m, d }: { m: OpexModel; d: Donem }) {
  const enYuksek = d.seri.reduce((a, b) => (b.toplam > a.toplam ? b : a));
  const gecis = d.yil === 2027 ? change(d.seri[0].toplam, m.aylik[11].y2026.toplam) : null;
  const rows: PlanRow[] = [
    ...d.seri.map((a, i) => ({ kind: 'ay' as const, a, onceki: i ? d.seri[i - 1] : d.yil === 2027 ? m.aylik[11].y2026 : null })),
    { kind: 'total', a: { ...d.toplam, ad: 'Dönem toplamı' } },
  ];
  const tutar = (label: string, f: keyof Kume3): Column<PlanRow> => ({ key: f, header: <Num>{label}</Num>, nowrap: true, render: (r) => <Num>{tl(r.a[f])}</Num> });
  const columns: Column<PlanRow>[] = [
    { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (r) => r.a.ad },
    tutar('Teknoloji', 'teknoloji'),
    tutar('Ofis ve işletme', 'ofis'),
    tutar('Personel', 'insan'),
    tutar('Toplam', 'toplam'),
    { key: 'degisim', header: <Num>Önceki aya göre</Num>, nowrap: true, render: (r) => <Num>{r.kind === 'ay' && r.onceki ? change(r.a.toplam, r.onceki.toplam) : '—'}</Num> },
  ];
  return (
    <>
      <FactsRow
        items={[
          { label: `Dönem toplamı (${d.aySayisi} ay)`, value: tl(d.toplam.toplam) },
          { label: 'Aylık ortalama', value: tl(d.ortalama.toplam) },
          { label: 'En yüksek ay', value: `${enYuksek.ad} · ${tl(enYuksek.toplam)}` },
          ...(gecis !== null ? [{ label: 'Aralık 2026 → Ocak 2027', value: gecis }] : []),
        ]}
      />
      <Chart
        id={`plan-${d.yil}`}
        title={`Aylık plan ${d.yil}`}
        note={`${d.etiket}, gruplara göre aylık gider`}
        size="lg"
        summary={d.seri.map((a) => `${a.ad} ${tl(a.toplam)}`).join('; ')}
        spec={{
          kind: 'opex-stack',
          categories: d.seri.map((a) => a.kisa),
          series: [
            { name: 'Teknoloji', tone: 'tech', values: d.seri.map((a) => a.teknoloji) },
            { name: 'Ofis ve işletme', tone: 'office', values: d.seri.map((a) => a.ofis) },
            { name: 'Personel', tone: 'people', values: d.seri.map((a) => a.insan) },
          ],
        }}
      />
      <DataTable
        id={`plan-${d.yil}`}
        title={`Aylık gider planı · ${d.etiket}`}
        note={
          d.yil === 2027
            ? 'Her ay ayrı hesaplanır: zam, kira ve genel artış uygulanır; bordroda gelir vergisi kümülatif matrahla ay ay değişir.'
            : 'Her ay ayrı hesaplanır: bordroda gelir vergisi Ocak 2026’dan beri biriken kümülatif matrahla ay ay değişir.'
        }
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
      />
    </>
  );
}

type AyBilgi = Pick<KalemDonem, 'aktif' | 'ozel'>;
type KalemRow =
  | { kind: 'gider'; g: Gider; ay: KalemDonem; aylik: number; donem: number }
  | { kind: 'kisi'; k: Kisi; ay: AyBilgi & { aylar: (number | null)[] }; tutar: number; aylik: number; donem: number }
  | { kind: 'total'; label: string; aylar: number[]; aylik: number; donem: number };
/** Kalem satırının kalıcı anahtarı: kaynak sayfa + Sheets satırı (+ ad); kişi Sheets satırıyla. */
const kalemKey = (r: KalemRow) => (r.kind === 'gider' ? `g:${r.g.kaynak ?? ''}:${r.g.satir}:${r.g.kalem}` : r.kind === 'kisi' ? `k:${r.k.satir}` : `t:${r.label}`);
type KalemFiltre = 'tumu' | KumeKod;

const ESAS_NOTU: Record<string, string> = { Net: 'net ücret', Brüt: 'brüt ücret', 'Asgari ücret': 'asgari ücret (net)', 'Fatura (KDV dahil)': 'fatura, KDV dahil' };
const ARTIS: Record<Gider['artis'], string> = { Kur: 'kur', Kira: 'kira', Genel: 'genel', Yok: 'artışsız' };

/** Dönemin kalemleri: üç grup (ofis, teknoloji, personel); “Hepsi” toplamı dönem OPEX’idir. */
function Expenses({ m, d }: { m: OpexModel; d: Donem }) {
  const [filter, setFilter] = useState<KalemFiltre>('tumu');
  const all: KalemRow[] = [
    ...m.giderler.map((g) => {
      const ay = giderDonem(g, d);
      return { kind: 'gider' as const, g, ay, aylik: ay.toplam / d.aySayisi, donem: ay.toplam };
    }),
    ...m.kisiler.map((k) => {
      const kd = kisiDonem(k, d);
      const aylar = d.aylar.map((i, j) => (k.aktif[d.key][i] ? kd.aylar[j].maliyet : null));
      return { kind: 'kisi' as const, k, ay: { ...kisiAylari(k, d), aylar }, tutar: d.yil === 2027 ? k.tutar2027 : k.tutar, aylik: kd.toplam.maliyet / d.aySayisi, donem: kd.toplam.maliyet };
    }),
  ];
  const kumeOf = (r: KalemRow): KumeKod | null => (r.kind === 'gider' ? r.g.kume : r.kind === 'kisi' ? 'insan' : null);
  const items = all.filter((r) => filter === 'tumu' || kumeOf(r) === filter);
  const ayDegeri = (r: KalemRow, j: number) => (r.kind === 'gider' ? r.ay.aylar[j] : r.kind === 'kisi' ? (r.ay.aylar[j] ?? 0) : r.aylar[j]);
  const rows: KalemRow[] = [
    ...items,
    {
      kind: 'total',
      label: `Toplam · ${items.length} kalem`,
      aylar: d.aylar.map((_, j) => items.reduce((t, r) => t + ayDegeri(r, j), 0)),
      aylik: items.reduce((t, r) => t + r.aylik, 0),
      donem: items.reduce((t, r) => t + r.donem, 0),
    },
  ];
  const buAy = m.donem.yil === d.yil ? m.donem.ay - 1 : -1;
  const odemeTakibi = m.ozet.odeme.takip !== false;
  const etkin = (r: KalemRow) => (r.kind === 'gider' ? r.g.aktif[d.key] : r.kind === 'kisi' ? r.k.aktif[d.key] : null);
  const ozelMi = (r: KalemRow, i: number) => (r.kind === 'gider' ? r.g.ozel[d.key][i] : r.kind === 'kisi' ? r.k.ozel[d.key][i] : false);
  const kalemAdi = (r: KalemRow) =>
    r.kind === 'total' ? r.label : r.kind === 'kisi' ? r.k.ad : r.g.hesap ? `${r.g.kalem} · ${r.g.hesap}` : r.g.kalem;
  const columns: Column<KalemRow>[] = [
    {
      key: 'kalem',
      header: 'Kalem',
      rowHeader: true,
      minWidth: '15rem',
      render: (r) =>
        r.kind === 'total' ? (
          r.label
        ) : r.kind === 'kisi' ? (
          <span className="opex-item">
            <Dot tone="people" />
            <span>
              {r.k.ad}
              <span className="opex-tag">{r.k.tur === 'Freelancer' ? 'freelancer' : 'bordrolu'}</span>
            </span>
          </span>
        ) : (
          <span className="opex-item">
            <Dot tone={KUME_TONE[r.g.kume]} />
            <span>
              {r.g.kalem}
              {r.g.hesap ? <span className="opex-tag">{r.g.hesap}</span> : null}
              {/^https:\/\//.test(r.g.fatura) ? (
                <>
                  {' '}
                  <a className="text-link" href={r.g.fatura} target="_blank" rel="noopener noreferrer">
                    fatura
                  </a>
                </>
              ) : null}
            </span>
          </span>
        ),
    },
    {
      key: 'kategori',
      header: 'Kategori',
      minWidth: '9rem',
      render: (r) => (r.kind === 'gider' ? r.g.kategori : r.kind === 'kisi' ? (r.k.tur === 'Freelancer' ? 'Freelancer (fatura)' : 'Bordrolu personel') : ''),
    },
    {
      key: 'tutar',
      header: <Num>Tutar</Num>,
      nowrap: true,
      render: (r) =>
        r.kind === 'gider' ? (
          <Num>{r.g.eksik ? '—' : money(r.g.tutar, r.g.para)}</Num>
        ) : r.kind === 'kisi' ? (
          <Num>
            {money(r.tutar, 'TRY')}
            <span className="cell-sub">{ESAS_NOTU[r.k.esas] ?? r.k.esas}</span>
          </Num>
        ) : (
          ''
        ),
    },
    {
      key: 'aylar',
      header: 'Etkin ay',
      nowrap: true,
      render: (r) =>
        r.kind === 'total' ? (
          ''
        ) : (
          <span className="opex-months" data-state={r.ay.aktif === d.aySayisi ? 'full' : r.ay.aktif ? 'part' : 'none'}>
            {r.ay.aktif}/{d.aySayisi} ay
            {r.ay.ozel ? <span className="cell-sub">{r.ay.ozel} ay özel tutar</span> : null}
          </span>
        ),
    },
    {
      key: 'aylik',
      header: <Num>Aylık ort. ₺</Num>,
      nowrap: true,
      render: (r) => (
        <Num>
          {tlExact(r.aylik)}
          {r.kind === 'kisi' ? <span className="cell-sub">{r.k.tur === 'Freelancer' ? 'fatura' : 'işveren maliyeti'}</span> : null}
        </Num>
      ),
    },
    { key: 'donem', header: <Num>{`${d.aySayisi} ay ₺`}</Num>, nowrap: true, render: (r) => <Num>{tlExact(r.donem)}</Num> },
    d.yil === 2026
      ? {
          key: 'durum',
          header: 'Bu ay',
          nowrap: true,
          render: (r) =>
            r.kind !== 'total' && buAy >= 0 && !etkin(r)?.[buAy] ? (
              <span className="opex-state" data-state="off">Bu ay yok</span>
            ) : r.kind === 'gider' ? (
              r.g.eksik && !r.g.ozel[d.key][buAy] ? (
                <span className="opex-state" data-state="missing">Tutar girilmedi</span>
              ) : odemeTakibi ? (
                <span className="opex-state" data-state={r.g.odendi ? 'paid' : 'due'}>
                  {r.g.odendi ? 'Ödendi' : 'Bekliyor'}
                </span>
              ) : (
                <span className="opex-state">Bu ay var</span>
              )
            ) : r.kind === 'kisi' ? (
              <span className="opex-state">{r.k.tur === 'Freelancer' ? 'Fatura' : 'Bordro'}</span>
            ) : (
              ''
            ),
        }
      : {
          key: 'artis',
          header: '2026’ya göre',
          nowrap: true,
          render: (r) =>
            r.kind === 'gider' ? (
              `${ARTIS[r.g.artis]} ${r.g.artisOrani ? signed(r.g.artisOrani) : '%0'}`
            ) : r.kind === 'kisi' ? (
              r.k.zamOrani ? `zam ${signed(r.k.zamOrani)}` : 'zam yok'
            ) : (
              ''
            ),
        },
  ];
  const count = (k: KumeKod) => all.filter((r) => kumeOf(r) === k).length;
  // Ay ay kalemler: Sheets aylık ızgarasındaki onay kutusu (etkin ay) ve özel tutarlar.
  const ayColumns: Column<KalemRow>[] = [
    { key: 'kalem', header: 'Kalem', rowHeader: true, minWidth: '13rem', render: (r) => kalemAdi(r) },
    ...d.aylar.map(
      (i, j): Column<KalemRow> => ({
        key: `ay-${i}`,
        header: (
          <Num>
            <span aria-hidden="true">{d.seri[j].kisa}</span>
            <span className="visually-hidden">{d.seri[j].ad}</span>
          </Num>
        ),
        nowrap: true,
        render: (r) => {
          if (r.kind !== 'total' && !etkin(r)?.[i]) {
            return (
              <Num>
                <span className="opex-month-off">
                  <span aria-hidden="true">—</span>
                  <span className="visually-hidden">yok</span>
                </span>
              </Num>
            );
          }
          return (
            <Num>
              {tl(ayDegeri(r, j))}
              {ozelMi(r, i) ? <span className="cell-sub">özel</span> : null}
            </Num>
          );
        },
      }),
    ),
    { key: 'donem', header: <Num>Toplam</Num>, nowrap: true, render: (r) => <Num>{tl(r.donem)}</Num> },
  ];
  return (
    <>
      <FactsRow
        items={[
          ...(d.yil === 2026 && odemeTakibi
            ? [
                { label: 'Bu ay ödenen (teknoloji, ofis)', value: `${tl(m.ozet.odeme.odenen)} · ${m.ozet.odeme.adetOdenen} kalem` },
                { label: 'Bu ay bekleyen (teknoloji, ofis)', value: `${tl(m.ozet.odeme.bekleyen)} · ${m.ozet.odeme.adetBekleyen} kalem` },
              ]
            : [
                { label: 'Döviz kalemleri (₺)', value: `${pct2(m.artis2027.kur)} · kur varsayımı` },
                { label: 'Kira / genel artış', value: `${pct2(m.artis2027.kira)} / ${pct2(m.artis2027.genel)}` },
              ]),
          { label: 'USD/TRY', value: `${rate(m.kur.USD.deger)} (${m.kur.USD.kaynak})` },
          { label: 'EUR/TRY', value: `${rate(m.kur.EUR.deger)} (${m.kur.EUR.kaynak})` },
        ]}
      />
      <Toggles
        label="Grup süzgeci"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'tumu', label: `Hepsi (${all.length})` },
          { value: 'ofis', label: `Ofis (${count('ofis')})` },
          { value: 'teknoloji', label: `Teknoloji (${count('teknoloji')})` },
          { value: 'insan', label: `Personel (${count('insan')})` },
        ]}
      />
      <DataTable
        id={`kalemler-${d.yil}`}
        title={`${d.etiket} kalemleri`}
        note="Döviz kalemleri Parametreler’deki kurla ₺’ye çevrilir. Etkin ay ve özel tutarlar Sheets’teki aylık sütunlardan gelir. Personel satırlarında aylık ortalama dönemin işveren maliyetidir (freelancer: fatura); bordro ayrıntısı aşağıda."
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
        rowKey={kalemKey}
      />
      <DataTable
        id={`kalem-aylari-${d.yil}`}
        title={`Ay ay kalemler · ${d.etiket}`}
        note="Her ayın kendi tutarı, ₺. — : Sheets’te o ayın onay kutusu işaretsiz (gider yok). “özel”: o aya varsayılandan farklı tutar yazılmış; diğer aylar varsayılan tutardır (2027’de zamlı/artışlı)."
        columns={ayColumns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
        rowKey={kalemKey}
      />
    </>
  );
}

function TechVendors({ m, d }: { m: OpexModel; d: Donem }) {
  const map = new Map<string, number>();
  for (const g of m.giderler.filter((x) => x.kume === 'teknoloji')) map.set(g.kalem, (map.get(g.kalem) ?? 0) + giderDonem(g, d).toplam / d.aySayisi);
  const tech = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <Chart
      id={`teknoloji-${d.yil}`}
      title="Teknoloji sağlayıcıları"
      note={`${d.etiket} aylık ortalama ₺, hesaplar toplanmış`}
      size="md"
      rows={tech.length}
      summary={tech.map(([n, v]) => `${n} ${tl(v)}`).join('; ')}
      spec={{ kind: 'opex-bar', items: tech.map(([name, value]) => ({ name, value, tone: 'tech' as const })) }}
    />
  );
}

type KisiRow = { kind: 'kisi'; k: Kisi; s: Satir } | { kind: 'total'; s: Satir };
const kisiKey = (r: KisiRow) => (r.kind === 'kisi' ? `k:${r.k.satir}` : 'toplam');

function People({ m, d }: { m: OpexModel; d: Donem }) {
  const per = m.kisiler.map((k) => ({ k, s: kisiDonem(k, d).toplam }));
  const sum = (f: keyof Satir, xs = per) => xs.reduce((t, x) => t + x.s[f], 0);
  const total = { ...per[0]?.s } as Satir;
  for (const f of Object.keys(total) as (keyof Satir)[]) total[f] = sum(f);
  const rows: KisiRow[] = [...per.map((x) => ({ kind: 'kisi' as const, ...x })), { kind: 'total', s: total }];
  const bordrolu = (r: KisiRow) => r.kind === 'total' || r.k.tur === 'Bordrolu';
  const columns: Column<KisiRow>[] = [
    {
      key: 'kisi',
      header: 'Kişi',
      rowHeader: true,
      minWidth: '13rem',
      render: (r) =>
        r.kind === 'total' ? (
          `Toplam · ${m.kisiler.length} kişi`
        ) : (
          <span className="opex-item">
            <Dot tone="people" />
            <span>
              {r.k.ad}
              <span className="cell-sub">
                {r.k.tur}
                {r.k.tesvik ? ` · ${r.k.tesvik.ad}` : ''}
              </span>
            </span>
          </span>
        ),
    },
    { key: 'esas', header: 'Ücret esası', minWidth: '9rem', render: (r) => (r.kind === 'kisi' ? r.k.esas : '') },
    { key: 'tutar', header: <Num>Aylık tutar</Num>, nowrap: true, render: (r) => (r.kind === 'kisi' ? <Num>{tlExact(d.yil === 2027 ? r.k.tutar2027 : r.k.tutar)}</Num> : '') },
    { key: 'brut', header: <Num>{`${d.aySayisi} ay brüt`}</Num>, nowrap: true, render: (r) => <Num>{bordrolu(r) ? tlExact(r.s.brut) : '—'}</Num> },
    { key: 'kesinti', header: <Num>Kesintiler (işçi)</Num>, nowrap: true, render: (r) => <Num>{bordrolu(r) ? tlExact(r.s.gv + r.s.dv + r.s.sgkIsci + r.s.issizlikIsci) : '—'}</Num> },
    {
      key: 'isveren',
      header: <Num>İşveren payı</Num>,
      nowrap: true,
      render: (r) =>
        bordrolu(r) ? (
          <Num>
            {tlExact(r.s.sgkIsveren + r.s.issizlikIsveren - r.s.tesvik)}
            {r.s.tesvik ? <span className="cell-sub">teşvik −{tlExact(r.s.tesvik)}</span> : null}
          </Num>
        ) : (
          <Num>—</Num>
        ),
    },
    {
      key: 'maliyet',
      header: <Num>{`${d.aySayisi} ay maliyet`}</Num>,
      nowrap: true,
      render: (r) => (
        <Num>
          {tlExact(r.s.maliyet)}
          {r.kind === 'kisi' && r.k.tur === 'Freelancer' ? <span className="cell-sub">fatura KDV’si {tlExact(r.s.kdv)}</span> : null}
        </Num>
      ),
    },
    { key: 'ort', header: <Num>Aylık ortalama</Num>, nowrap: true, render: (r) => <Num>{tl(r.s.maliyet / d.aySayisi)}</Num> },
  ];
  const staff = per.filter((x) => x.k.tur === 'Bordrolu');
  const free = per.filter((x) => x.k.tur === 'Freelancer');
  const b = { ...total } as Satir;
  for (const f of Object.keys(b) as (keyof Satir)[]) b[f] = sum(f, staff);
  return (
    <>
      <FactsRow
        items={[
          { label: `Bordrolu işveren maliyeti (${d.aySayisi} ay)`, value: `${tl(b.maliyet)} · ${staff.length} kişi` },
          { label: 'Freelancer faturaları (KDV dahil)', value: `${tl(sum('fatura', free))} · ${free.length} kişi` },
          { label: 'Freelancer KDV hariç / KDV', value: `${tl(sum('kdvHaric', free))} / ${tl(sum('kdv', free))}` },
          { label: 'Teşvik ve destekler', value: tl(b.tesvik) },
        ]}
      />
      <DataTable
        id={`ucretler-${d.yil}`}
        title={`Personel giderleri · ${d.etiket}`}
        note="Bordrolu: aylık kümülatif gelir vergisiyle netten brüte; işveren payı SGK + işsizlik − teşvik. Freelancer: fatura (KDV dahil)."
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
        rowKey={kisiKey}
      />
      <div className="opex-grid">
        <Chart
          id={`bordro-bilesen-${d.yil}`}
          title="Bordro bileşenleri"
          note={`${d.etiket} toplamı, kişi başına`}
          size="lg"
          summary={`Bordrolu ${staff.length} kişi, ${d.etiket}: net ${tl(b.net)}, gelir ve damga vergisi ${tl(b.gv + b.dv)}, SGK ve işsizlik işçi payı ${tl(b.sgkIsci + b.issizlikIsci)}, işveren payı (teşvik sonrası) ${tl(b.sgkIsveren + b.issizlikIsveren - b.tesvik)}.`}
          spec={{
            kind: 'opex-stack-h',
            categories: staff.map((x) => x.k.ad),
            series: [
              { name: 'Net ücret', tone: 'net', values: staff.map((x) => x.s.net) },
              { name: 'Gelir ve damga vergisi', tone: 'tax', values: staff.map((x) => x.s.gv + x.s.dv) },
              { name: 'SGK ve işsizlik (işçi)', tone: 'sgk', values: staff.map((x) => x.s.sgkIsci + x.s.issizlikIsci) },
              { name: 'İşveren payı (teşvik sonrası)', tone: 'employer', values: staff.map((x) => x.s.sgkIsveren + x.s.issizlikIsveren - x.s.tesvik) },
            ],
          }}
        />
        <Chart
          id={`bordro-kopru-${d.yil}`}
          title="Netten işveren maliyetine"
          note={`${d.etiket}, bordrolu toplam`}
          size="lg"
          summary={`Net ücretler ${tl(b.net)}; gelir vergisi ${tl(b.gv)}, damga ${tl(b.dv)} ve işçi SGK ${tl(b.sgkIsci + b.issizlikIsci)} eklenince brüt ${tl(b.brut)}; işveren SGK ${tl(b.sgkIsveren + b.issizlikIsveren)} eklenip teşvik ${tl(b.tesvik)} düşülünce işveren maliyeti ${tl(b.maliyet)}.`}
          spec={{
            kind: 'opex-kopru',
            steps: [
              { name: 'Net ücretler', value: b.net, tone: 'net' },
              { name: 'Gelir vergisi', value: b.gv, tone: 'tax' },
              { name: 'Damga vergisi', value: b.dv, tone: 'tax' },
              { name: 'SGK ve işsizlik (işçi)', value: b.sgkIsci + b.issizlikIsci, tone: 'sgk' },
              { name: 'Brüt ücretler', value: b.brut, tone: 'total', total: true },
              { name: 'SGK ve işsizlik (işveren)', value: b.sgkIsveren + b.issizlikIsveren, tone: 'employer' },
              { name: 'Teşvik ve destekler', value: -b.tesvik, tone: 'credit' },
              { name: 'İşveren maliyeti', value: b.maliyet, tone: 'total', total: true },
            ],
          }}
        />
      </div>
    </>
  );
}

type AyRow = { kind: 'ay'; s: Satir; ad: string } | { kind: 'total'; s: Satir };

function Payroll({ m, d }: { m: OpexModel; d: Donem }) {
  const staff = m.kisiler.filter((k) => k.tur === 'Bordrolu');
  const [who, setWho] = useState(String(staff[0]?.satir ?? ''));
  const person = staff.find((k) => String(k.satir) === who) ?? staff[0];
  if (!person) return <p className="opex-empty">Bordrolu kişi yok.</p>;
  const pd = kisiDonem(person, d);
  const rows: AyRow[] = [...pd.aylar.map((s, i) => ({ kind: 'ay' as const, s, ad: d.seri[i].ad })), { kind: 'total', s: pd.toplam }];
  const c = (label: string, f: (s: Satir) => number): Column<AyRow> => ({ key: label, header: <Num>{label}</Num>, nowrap: true, render: (r) => <Num>{tlExact(f(r.s))}</Num> });
  const columns: Column<AyRow>[] = [
    { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (r) => (r.kind === 'ay' ? r.ad : 'Dönem toplamı') },
    c('Brüt', (s) => s.brut),
    c('SGK + işsizlik (işçi)', (s) => s.sgkIsci + s.issizlikIsci),
    c('GV matrahı', (s) => s.gvMatrahi),
    c('Kümülatif matrah', (s) => s.kumulatifMatrah),
    c('Gelir vergisi', (s) => s.gv),
    c('Asgari ücret GV istisnası', (s) => s.gvIstisna),
    c('Damga vergisi', (s) => s.dv),
    c('Net', (s) => s.net),
    c('İşveren SGK + işsizlik', (s) => s.sgkIsveren + s.issizlikIsveren),
    c('Teşvik', (s) => s.tesvik),
    c('İşveren maliyeti', (s) => s.maliyet),
  ];
  const first = pd.aylar[0];
  const last = pd.aylar[pd.aylar.length - 1];
  const asg = m.asgari[d.key];
  return (
    <>
      <Toggles label="Kişi" value={String(person.satir)} onChange={setWho} options={staff.map((k) => ({ value: String(k.satir), label: k.ad }))} />
      <FactsRow
        items={[
          { label: 'Ücret esası', value: `${person.esas} · ${tlExact(d.yil === 2027 ? person.tutar2027 : person.tutar)}` },
          { label: `${d.seri[0].ad} → ${d.seri[d.seri.length - 1].ad} brüt`, value: `${tl(first.brut)} → ${tl(last.brut)}` },
          { label: `${d.etiket} işveren maliyeti`, value: tl(pd.toplam.maliyet) },
          { label: 'Aylık ortalama maliyet', value: tl(pd.toplam.maliyet / d.aySayisi) },
        ]}
      />
      <Chart
        id={`bordro-aylik-${d.yil}`}
        title={`${person.ad}: aylık bordro`}
        note={`${d.etiket}; kümülatif gelir vergisi dilimi geçtikçe aynı net için brüt artar`}
        size="lg"
        summary={`${person.ad}, ${d.etiket}: brüt ${d.seri[0].ad} ${tl(first.brut)}, ${d.seri[d.seri.length - 1].ad} ${tl(last.brut)}; işveren maliyeti ${tl(pd.toplam.maliyet)}.`}
        spec={{
          kind: 'opex-stack',
          categories: d.seri.map((a) => a.kisa),
          series: [
            { name: 'Net ücret', tone: 'net', values: pd.aylar.map((s) => s.net) },
            { name: 'Gelir ve damga vergisi', tone: 'tax', values: pd.aylar.map((s) => s.gv + s.dv) },
            { name: 'SGK ve işsizlik (işçi)', tone: 'sgk', values: pd.aylar.map((s) => s.sgkIsci + s.issizlikIsci) },
            { name: 'İşveren payı (teşvik sonrası)', tone: 'employer', values: pd.aylar.map((s) => s.sgkIsveren + s.issizlikIsveren - s.tesvik) },
          ],
        }}
      />
      <DataTable
        id={`bordro-ay-${d.yil}`}
        title={`${person.ad} · ${d.etiket} bordro`}
        note={`SGK tavanı ${tl(asg.tavan)}; asgari ücret ${tlExact(asg.brut)} brüt / ${tlExact(asg.net)} net. Asgari ücrete isabet eden gelir ve damga vergisi istisna edilir.${d.yil === 2026 && d.aySayisi < 12 ? ' Kümülatif matrah Ocak 2026’dan hesaplanır.' : ''}`}
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
      />
    </>
  );
}

type KumeRow = { k: KumeKod | 'toplam'; label: string };

/** 2027 varsayımları ve 2026 (dönem) ile karşılaştırma. */
function Assumptions({ m, d }: { m: OpexModel; d: Donem }) {
  const once = donemOf(m, 2026);
  const exempt = m.kisiler.filter((k) => !k.zam && k.esas !== 'Asgari ücret').map((k) => k.ad);
  const e = m.enflasyon;
  const kumeRows: KumeRow[] = [...GRUPLAR.map((g) => ({ k: g.kume, label: KUME_AD[g.kume] })), { k: 'toplam', label: 'Toplam OPEX' }];
  const columns: Column<KumeRow>[] = [
    {
      key: 'kume',
      header: 'Grup',
      rowHeader: true,
      minWidth: '11rem',
      render: (r) =>
        r.k === 'toplam' ? (
          r.label
        ) : (
          <span className="opex-item">
            <Dot tone={KUME_TONE[r.k]} />
            {r.label}
          </span>
        ),
    },
    { key: 'o26', header: <Num>{`2026 aylık ort. (${once.etiket.replace(' 2026', '')})`}</Num>, nowrap: true, render: (r) => <Num>{tl(once.ortalama[r.k])}</Num> },
    { key: 'o27', header: <Num>2027 aylık ort.</Num>, nowrap: true, render: (r) => <Num>{tl(d.ortalama[r.k])}</Num> },
    { key: 'dg', header: <Num>Değişim</Num>, nowrap: true, render: (r) => <Num>{once.ortalama[r.k] ? signed(d.ortalama[r.k] / once.ortalama[r.k] - 1) : '—'}</Num> },
    { key: 'y27', header: <Num>2027 yıllık</Num>, nowrap: true, render: (r) => <Num>{tl(d.toplam[r.k])}</Num> },
  ];
  return (
    <>
      <FactsRow
        items={[
          { label: 'Ücret zammı', value: `${m.zam.esas} · ${pct2(m.zam.oran)}${exempt.length ? ` · hariç: ${exempt.join(', ')}` : ''}` },
          { label: 'Kira artışı', value: pct2(m.artis2027.kira) },
          { label: 'Faturalar ve ofis', value: pct2(m.artis2027.genel) },
          { label: 'Döviz kalemleri (₺)', value: `${pct2(m.artis2027.kur)} · kur varsayımı` },
          { label: 'Asgari ücret 2027', value: `${tl(m.asgari.y2027.brut)} brüt · ${tl(m.asgari.y2027.net)} net` },
        ]}
      />
      <p className="opex-source">
        2026 enflasyonu ({e.donem}): yıllık TÜFE {pct2(e.yillik)}, aylık TÜFE {pct2(e.aylik)}, 12 aylık ortalama TÜFE {pct2(e.ortalama12)}, Yİ-ÜFE
        aylık {pct2(e.yiufeAylik)}.{' '}
        <a className="text-link" href={e.kaynak} target="_blank" rel="noopener noreferrer">
          Kaynak araması
        </a>
      </p>
      <Chart
        id="kisi-2027"
        title="Kişi maliyeti: 2026 ve 2027"
        note={`Aylık ortalama: 2026 (${once.etiket.replace(' 2026', '')}) ve 2027`}
        size="xl"
        summary={m.kisiler.map((k) => `${k.ad}: ${tl(kisiDonem(k, once).toplam.maliyet / once.aySayisi)} → ${tl(kisiDonem(k, d).toplam.maliyet / d.aySayisi)}`).join('; ')}
        spec={{
          kind: 'opex-group',
          categories: m.kisiler.map((k) => k.ad),
          series: [
            { name: `2026 aylık ort.`, tone: 'y2026', values: m.kisiler.map((k) => kisiDonem(k, once).toplam.maliyet / once.aySayisi) },
            { name: '2027 aylık ort.', tone: 'y2027', values: m.kisiler.map((k) => kisiDonem(k, d).toplam.maliyet / d.aySayisi) },
          ],
        }}
      />
      <DataTable id="karsilastirma" title="Gruplar: 2026 ve 2027" columns={columns} rows={kumeRows} rowTone={(r) => (r.k === 'toplam' ? 'total' : undefined)} />
    </>
  );
}

function Incentives({ m, d }: { m: OpexModel; d: Donem }) {
  const value = (t: Tesvik, v: number) => (t.tur === 'Aylık tutar' ? tlExact(v) : t.tur === 'Puan indirimi' ? `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(v * 100)} puan` : pct2(v));
  const columns: Column<Tesvik>[] = [
    {
      key: 'ad',
      header: 'Teşvik / destek',
      rowHeader: true,
      minWidth: '15rem',
      render: (t) => (
        <>
          {t.ad}
          <span className="cell-sub">
            {t.kod} · {t.kapsam}
            {t.etkin ? '' : ' · kapalı'}
          </span>
        </>
      ),
    },
    { key: 'tur', header: 'Tür ve değer', minWidth: '12rem', render: (t) => `${t.tur}: ${value(t, d.yil === 2027 ? t.deger2027 : t.deger2026)}` },
    { key: 'kim', header: 'Uygulanan', minWidth: '12rem', render: (t) => (t.uygulananlar.length ? t.uygulananlar.join(', ') : '—') },
    d.yil === 2026
      ? { key: 'bu', header: <Num>{`Bu ay (${m.donem.ayAdi})`}</Num>, nowrap: true, render: (t) => <Num>{tlExact(t.buAy)}</Num> }
      : { key: 'ort', header: <Num>2027 aylık ort.</Num>, nowrap: true, render: (t) => <Num>{tl(t.yil2027 / 12)}</Num> },
    { key: 'yil', header: <Num>{`${d.yil} yıllık`}</Num>, nowrap: true, render: (t) => <Num>{tl(d.yil === 2027 ? t.yil2027 : t.yil2026)}</Num> },
    { key: 'kosul', header: 'Koşul ve dayanak', minWidth: '22rem', render: (t) => t.kosul },
  ];
  return (
    <DataTable
      id={`tesvikler-${d.yil}`}
      title={`SGK teşvik ve destekleri · ${d.yil}`}
      note="Standart olanlar uygun herkese parametreyle uygulanır; koşullu olanlar yalnız Sheets’te kişiye kodu yazılınca. Mali müşavirle doğrulayın."
      columns={columns}
      rows={m.tesvikler}
    />
  );
}

function Params({ m }: { m: OpexModel }) {
  const show = (p: Parametre): ReactNode => {
    if (typeof p.deger === 'string') {
      return /^https:\/\//.test(p.deger) ? (
        <a className="text-link" data-standalone="" href={p.deger} target="_blank" rel="noopener noreferrer">
          Arama bağlantısı
        </a>
      ) : (
        p.deger
      );
    }
    if (p.tur === 'oran') return pct2(p.deger);
    if (p.tur === 'tutar') return tlExact(p.deger);
    if (p.tur === 'kur') return rate(p.deger);
    // Yıl, ay ve katsayı: binlik ayırıcı yok (2026, 9 ×).
    return `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 4, useGrouping: false }).format(p.deger)}${p.birim && p.birim !== '%' ? ` ${p.birim}` : ''}`;
  };
  const columns: Column<Parametre>[] = [
    { key: 'grup', header: 'Grup', minWidth: '10rem', render: (p) => p.grup },
    { key: 'ad', header: 'Parametre', rowHeader: true, minWidth: '13rem', render: (p) => p.ad },
    { key: 'deger', header: 'Değer', minWidth: '9rem', render: (p) => <strong className="opex-param">{show(p)}</strong> },
    { key: 'aciklama', header: 'Açıklama ve kaynak', minWidth: '22rem', render: (p) => p.aciklama },
  ];
  return <DataTable id="parametreler" title="Parametreler (Google Sheets)" note="Değerler Sheets → Parametreler sayfasında değiştirilir; tüm hesaplar ve bu sayfa güncellenir." columns={columns} rows={m.parametreler} />;
}

function YearPanel({ m, d }: { m: OpexModel; d: Donem }) {
  let n = 0;
  const no = () => (n += 1);
  return (
    <>
      <Section id={`ozet-${d.yil}`} index={no()} title={`${d.yil} özeti`}>
        <Overview m={m} d={d} />
      </Section>
      <Section id={`plan-${d.yil}-bolum`} index={no()} title={`Aylık plan · ${d.etiket}`} desc="Her ayın teknoloji, ofis ve işletme ve personel gideri ayrı hesaplanır.">
        <Plan m={m} d={d} />
      </Section>
      <Section id={`kalemler-${d.yil}-bolum`} index={no()} title="Kalemler" desc="Üç grup: ofis (kira ve aidat, internet, telefon, elektrik, ofis ihtiyaçları), teknoloji (yazılım, yapay zekâ, sunucu, API, AWS vb.), personel (bordro ve freelancer).">
        <Expenses m={m} d={d} />
        <TechVendors m={m} d={d} />
      </Section>
      <Section id={`ucretler-${d.yil}-bolum`} index={no()} title="Personel giderleri" desc="Bordrolu personel netten brüte ve işveren maliyetine; freelancerlar KDV dahil faturayla.">
        <People m={m} d={d} />
      </Section>
      <Section id={`bordro-${d.yil}-bolum`} index={no()} title="Netten brüte: aylık bordro" desc="Gelir vergisi yıl içinde kümülatif matrahla hesaplanır; asgari ücret istisnası ve SGK tavanı uygulanır.">
        <Payroll m={m} d={d} />
      </Section>
      {d.yil === 2027 ? (
        <Section id="varsayimlar-2027" index={no()} title="2027 varsayımları" desc="Ücret zammı enflasyon parametresine bağlıdır; kira, fatura ve döviz kalemleri kendi artış esasıyla.">
          <Assumptions m={m} d={d} />
        </Section>
      ) : null}
      <Section id={`tesvikler-${d.yil}-bolum`} index={no()} title="SGK teşvik ve destekleri">
        <Incentives m={m} d={d} />
      </Section>
    </>
  );
}

function Content({ data, yil, donemler }: { data: OpexData; yil: Yil; donemler: Donem[] }) {
  const m = data.model;
  const d = donemler.find((x) => x.yil === yil) ?? donemler[0];
  return (
    <OzetContext.Provider value={data.ozet}>
      {m.uyarilar.length ? (
        <Note title={`Sheets uyarıları (${m.uyarilar.length})`}>
          <ul className="opex-warnings">
            {m.uyarilar.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </Note>
      ) : null}
      <div id="yil-paneli" role="tabpanel" aria-labelledby={`yil-${yil}`} className="opex-year-panel">
        <YearPanel key={yil} m={m} d={d} />
      </div>
      <Section id="parametreler-bolum" index={yil === 2027 ? 8 : 7} title="Parametreler">
        <Params m={m} />
        <p className="opex-source">
          Hesaplandı: {stamp(m.hesaplandi)} · Motor sürümü {m.surum} · Özet {data.ozet}
        </p>
      </Section>
    </OzetContext.Provider>
  );
}

function Body() {
  const { conn, live, announce, connect, disconnect, refreshNow } = useOpexLive();
  const [settings, setSettings] = useState(false);
  const [storageNote, setStorageNote] = useState('');
  // Yıl seçimi başlıkta (sağda): veri gelince rapor yılı; seçim veri yenilenince korunur.
  const model = live.status === 'ready' ? live.data.model : null;
  const [yil, setYil] = useState<Yil | null>(null);
  const donemler = useMemo(() => (model ? [donemOf(model, 2026), donemOf(model, 2027)] : null), [model]);
  const seciliYil: Yil = yil ?? (model?.donem.yil === 2027 ? 2027 : 2026);
  const form = (error?: string, cancel?: () => void) => (
    <ConnectForm
      initial={conn}
      error={error}
      onCancel={cancel}
      onConnect={(c) => {
        setSettings(false);
        setStorageNote(connect(c) ? '' : 'Tarayıcı depolaması kapalı; bağlantı yalnız bu sayfa açıkken geçerli.');
      }}
    />
  );
  return (
    <>
      <Hero
        eyebrow="Finans · OPEX"
        title="Operasyon giderleri"
        aside={donemler ? <YearTabs value={seciliYil} onChange={setYil} donemler={donemler} /> : undefined}
      />
      <p className="visually-hidden" role="status" aria-live="polite">
        {announce}
      </p>
      <p className="opex-nojs">Bu sayfa verileri Google Sheets’ten JavaScript ile okur; tarayıcınızda JavaScript açık olmalı.</p>
      {live.status === 'init' ? <Loader /> : null}
      {live.status === 'setup' ? form(live.error) : null}
      {live.status === 'loading' ? <Loader /> : null}
      {live.status === 'failed' ? (
        <div className="opex-failed">
          <p className="opex-error" role="alert">
            {live.error}
          </p>
          <div className="opex-actions">
            <button type="button" className="opex-btn" onClick={refreshNow}>
              Yeniden dene
            </button>
            <button
              type="button"
              className="opex-btn"
              onClick={() => {
                setStorageNote('');
                disconnect();
              }}
            >
              Bağlantıyı unut
            </button>
          </div>
          {form(undefined)}
        </div>
      ) : null}
      {live.status === 'ready' ? (
        <>
          <LiveStrip live={live} settingsOpen={settings} onRefresh={refreshNow} onSettings={() => setSettings((v) => !v)} />
          {live.stale ? (
            <p className="opex-live-stale" role="status">
              {live.stale} Son alınan veri gösteriliyor.
            </p>
          ) : null}
          {storageNote ? <p className="opex-live-stale">{storageNote}</p> : null}
          {settings ? (
            <div className="opex-settings">
              {form(undefined, () => setSettings(false))}
              <button
                type="button"
                className="opex-btn"
                onClick={() => {
                  setStorageNote('');
                  setSettings(false);
                  disconnect();
                }}
              >
                Bağlantıyı unut
              </button>
            </div>
          ) : null}
          <Content data={live.data} yil={seciliYil} donemler={donemler ?? []} />
        </>
      ) : null}
    </>
  );
}

export function OpexPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Body />
    </AppFrame>
  );
}
