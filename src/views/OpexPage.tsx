import { createContext, useContext, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type SubmitEvent } from 'react';
import { createPortal } from 'react-dom';
import { Checkbox, NumberInput, Popover, Table, TextInput, type NumberInputProps } from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconArrowsSort, IconChevronDown, IconExternalLink, IconFilter, IconFilterFilled, IconRefresh, IconSettings } from '@tabler/icons-react';
import { AppFrame, HEADER_TOOLS_ID, PAGE_TOOLS_ID } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Chart, DataTable, FactsRow, KayitListesi, Note, Section, useKabuk, type Column, type Kayit } from '../components/ui';
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
  planOfModel,
  giderDonem,
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
  type Plan,
  type PlanAy,
  type Kume3,
  type OpexModel,
  type Satir,
  type Tesvik,
  type Yil,
  type YilKey,
} from '../data/opex';
import type { OpexTone } from '../lib/chartSpec';
import { tl, tlExact } from '../lib/format';

/* ---------- Biçimler ---------- */

const pct2 = (r: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(r * 100)}`;
const signed = (r: number) => `${r > 0 ? '+' : r < 0 ? '−' : ''}${pct2(Math.abs(r))}`;
/** Değişim oranı; önceki değer 0 ise (ör. tüm kalemleri işaretsiz ay) “—”. */
const change = (now: number, before: number) => (before ? signed(now / before - 1) : 'Uygulanmıyor');
const money = (value: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const rate = (value: number) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)} ₺`;
const clock = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso)) : 'Veri yok';
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
 * Canlı durum (kullanıcı kararı 2026-10-21: üst bantta, tema düğmesinin solunda): tek satır; durum noktası, kısa
 * metin ve simge düğmeler (erişilebilir adlarıyla). Ayrıntı (erişim, son denetim) ipucunda.
 */
function LiveStrip({ live, settingsOpen, onRefresh, onSettings }: { live: Extract<Live, { status: 'ready' }>; settingsOpen: boolean; onRefresh: () => void; onSettings: () => void }) {
  // Yalnız istemcide (veri gelince) çizilir: hedef ilk çizimde bulunur, şerit gövdede bir an görünmez.
  const [host] = useState<HTMLElement | null>(() => document.getElementById(HEADER_TOOLS_ID));
  const guncelleme = live.push ? 'anlık' : `${OPEX_POLL_MS / 1000} sn’de bir`;
  const detay = `Erişim: ${live.data.model.erisim === 'Herkese açık' ? 'herkese açık' : 'anahtarla'} · Son denetim ${clock(live.checked)} · Sheets’te son değişiklik ${clock(live.data.degisti)} · Güncelleme ${guncelleme}`;
  const strip = (
    <div className="opex-live" data-state={live.stale ? 'stale' : 'live'}>
      <p className="opex-live-status" title={detay}>
        <span className="opex-live-dot" aria-hidden="true" />
        <span className="opex-live-label">{live.stale ? 'Bağlantı sorunu' : 'Sheets'}</span>
        <span className="opex-live-meta">
          {clock(live.data.degisti)} · {guncelleme}
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

/**
 * Döviz kurları (kullanıcı kararı 2026-10-21): kırıntı satırının sağında, sayfa başlığı hizasında. Yalnız istemcide
 * (veri gelince) çizilir; hedef yoksa yerinde görünür.
 */
function Kurlar({ m }: { m: OpexModel }) {
  const [host] = useState<HTMLElement | null>(() => document.getElementById(PAGE_TOOLS_ID));
  const liste = (
    <dl className="opex-kur" aria-label="Döviz kurları">
      {(['USD', 'EUR'] as const).map((k) => (
        <div key={k}>
          <dt>{k}/TRY</dt>
          <dd>
            {rate(m.kur[k].deger)} <span className="opex-kur-kaynak">({m.kur[k].kaynak})</span>
          </dd>
        </div>
      ))}
    </dl>
  );
  return host ? createPortal(liste, host) : liste;
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

/** Kısa ay adı ve yıl (“Eki ’26”): iki yılın aynı adlı ayları karışmaz. */
const ayKisa = (a: PlanAy) => `${a.kisa} ’${String(a.yil).slice(2)}`;

/** Aylık plan: yıl ayrımı yok (kullanıcı kararı 2026-10-20); 2026 döneminin ayları ve 2027’nin 12 ayı art arda. */
function Plan({ p }: { p: Plan }) {
  const enYuksek = p.aylar.reduce((a, b) => (b.toplam > a.toplam ? b : a));
  const sinir = p.aylar.findIndex((a, i) => i > 0 && a.yil !== p.aylar[i - 1].yil);
  // Ay ay grup toplamları ve önceki aya göre değişim kalemler tablosunun alt satırlarında (kullanıcı kararı 2026-10-21).
  return (
    <>
      <FactsRow
        items={[
          { label: `Toplam (${p.aySayisi} ay)`, value: tl(p.toplam.toplam) },
          { label: 'Aylık ortalama', value: tl(p.ortalama.toplam) },
          { label: 'En yüksek ay', value: `${enYuksek.ad} · ${tl(enYuksek.toplam)}` },
          ...(sinir > 0 ? [{ label: `${p.aylar[sinir - 1].ad} → ${p.aylar[sinir].ad}`, value: change(p.aylar[sinir].toplam, p.aylar[sinir - 1].toplam) }] : []),
        ]}
      />
      <Chart
        id="plan"
        title="Aylık plan"
        note={`${p.etiket}, gruplara göre aylık gider`}
        // Kullanıcı kararı 2026-10-20: masaüstünde dikey ve alçak; telefonda (dar grafik) yatay, satır sayısına göre.
        size="sm"
        rows={p.aySayisi}
        shortLabels
        summary={p.aylar.map((a) => `${a.ad} ${tl(a.toplam)}`).join('; ')}
        spec={{
          kind: 'opex-stack',
          categories: p.aylar.map(ayKisa),
          series: [
            { name: 'Teknoloji', tone: 'tech', values: p.aylar.map((a) => a.teknoloji) },
            { name: 'Ofis ve işletme', tone: 'office', values: p.aylar.map((a) => a.ofis) },
            { name: 'Personel', tone: 'people', values: p.aylar.map((a) => a.insan) },
          ],
        }}
      />
    </>
  );
}

/**
 * Kalemler veri tablosu (kullanıcı kararı 2026-10-21): kalemler, ay ay tutarlar ve personel ayrıntıları tek tabloda;
 * başlıktan sıralama, sütun bazlı arama (metin veya “>50000”, “<=1.000” gibi sayı koşulu) ve somut filtreler.
 * Toplam satırları (grup ara toplamları, toplam, önceki aya göre) filtrelenmiş satırlardan hesaplanır.
 */
type DurumKod = 'var' | 'off' | 'paid' | 'due' | 'missing' | 'bordro' | 'fatura';
type TurKod = 'Gider' | 'Bordrolu' | 'Freelancer';

interface Kalem {
  key: string;
  tur: TurKod;
  g: Gider | null;
  k: Kisi | null;
  ad: string;
  etiket: string;
  kume: KumeKod;
  kategori: string;
  para: Gider['para'];
  /** Aylık tutar ₺ karşılığı (sıralama ve arama). */
  tutarTl: number;
  durum: { kod: DurumKod; ad: string } | null;
  /** Plan aylarının ₺ tutarı; null = o ay gider yok (Sheets’te işaretsiz). */
  aylar: (number | null)[];
  ozel: boolean[];
  yillar: number[];
  donem: number;
  artis: string;
  /** 2027 artışı veya zam oranı sıfırdan büyük (hızlı filtre “Artışlı”). */
  artar: boolean;
  /** Plan dönemi bordro ayrıntısı (bordrolu); freelancer için fatura KDV’si. */
  brut: number | null;
  kesinti: number | null;
  isveren: number | null;
  tesvik: number | null;
  kdv: number | null;
}

type KalemFiltre = 'tumu' | KumeKod;

/**
 * Hızlı filtreler (kullanıcı kararı 2026-10-21): araç satırında, mümkün olduğunca kısa adlı; durum süzgeçleri anahtar,
 * özellik süzgeçleri onay kutusu. Açıklama ipucunda.
 */
type HizliKod = 'doviz' | 'tesvik' | 'bekleyen' | 'bos' | 'ozel' | 'artar';
const HIZLI: { kod: HizliKod; ad: string; tip: 'anahtar' | 'kutu'; aciklama: string }[] = [
  { kod: 'doviz', ad: 'Dövizli', tip: 'anahtar', aciklama: 'USD veya EUR ile ödenen kalemler' },
  { kod: 'tesvik', ad: 'Teşvikli', tip: 'anahtar', aciklama: 'İşveren teşviki düşülen personel' },
  { kod: 'bekleyen', ad: 'Bekleyen', tip: 'anahtar', aciklama: 'Bu ay ödemesi bekleyen kalemler' },
  { kod: 'bos', ad: 'Boş ay', tip: 'kutu', aciklama: 'En az bir ayı boş (gider yok) olanlar' },
  { kod: 'ozel', ad: 'Özel tutar', tip: 'kutu', aciklama: 'En az bir aya ayrı tutar yazılmış olanlar' },
  { kod: 'artar', ad: 'Artışlı', tip: 'kutu', aciklama: '2027 artışı veya zammı olanlar' },
];
const HIZLI_KOSUL: Record<HizliKod, (r: Kalem) => boolean> = {
  doviz: (r) => r.para !== 'TRY',
  tesvik: (r) => (r.tesvik ?? 0) > 0,
  bekleyen: (r) => r.durum?.kod === 'due',
  bos: (r) => r.aylar.some((v) => v === null),
  ozel: (r) => r.ozel.some(Boolean),
  artar: (r) => r.artar,
};

/** Hızlı filtre anahtarı (role="switch"): iz ve top tokenlarla; yazı görünür, klavye odağı yazının alt çizgisi. */
function Anahtar({ ad, acik, title, onChange }: { ad: string; acik: boolean; title: string; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={acik} className="opex-anahtar" title={title} onClick={() => onChange(!acik)}>
      <span className="opex-anahtar-iz" aria-hidden="true">
        <span className="opex-anahtar-top" />
      </span>
      {ad}
    </button>
  );
}
type SutunGrubu = 'ay' | 'yil' | 'personel';
interface Sutun {
  id: string;
  /** Görünen başlık (aria-sort ve arama kutusu adı için düz metin `ad`). */
  baslik: ReactNode;
  ad: string;
  grup?: SutunGrubu;
  sayi?: boolean;
  sabit?: boolean;
  minWidth?: string;
  deger: (r: Kalem) => number | string | null;
  metin: (r: Kalem) => string;
  /** Liste filtresinin değeri (verilmezse metin); sayı sütunları aralık filtresi alır. */
  liste?: (r: Kalem) => string;
  hucre: (r: Kalem) => ReactNode;
}
/** Sütun filtresi: liste (işaretli değerler gösterilir) veya aralık (en az / en çok; boş “—” isteğe bağlı). */
type KolonFiltre = { tur: 'liste'; secili: string[] } | { tur: 'aralik'; min: number | ''; max: number | ''; bos: boolean };
/** Sayı kutusunun ham değeri (Mantine yazım sırasında “50.” gibi metin verir) → sayı veya boş. */
const hamSayi = (v: number | string): number | '' => (typeof v === 'number' ? v : v.trim() === '' || !Number.isFinite(sayiOku(v)) ? '' : sayiOku(v));
/** Tutar kutusu: binlik nokta, ondalık yalnız virgül, eksi yok; ham metin kutuda kalır (yazarken silinmez). */
const SAYI_KUTUSU: Pick<NumberInputProps, 'thousandSeparator' | 'decimalSeparator' | 'allowedDecimalSeparators' | 'allowNegative' | 'hideControls'> = {
  thousandSeparator: '.',
  decimalSeparator: ',',
  allowedDecimalSeparators: [','],
  allowNegative: false,
  hideControls: true,
};
const kolonUyar = (f: KolonFiltre, liste: string, deger: number | string | null) => {
  if (f.tur === 'liste') return f.secili.includes(liste);
  if (typeof deger !== 'number') return f.bos || (f.min === '' && f.max === '');
  return (f.min === '' || deger >= f.min) && (f.max === '' || deger <= f.max);
};

/**
 * Başlıktaki sütun filtresi (kullanıcı kararı 2026-10-21): huni düğmesi açılır panel açar (Escape kapatır, odak
 * düğmeye döner). Liste: değerler sayılarıyla, içinde arama, Tümü / Hiçbiri. Aralık: en az, en çok, boş olanlar.
 */
function KolonFiltresi({ ad, tur, secenekler, deger, onChange }: { ad: string; tur: 'liste' | 'aralik'; secenekler: [string, number][]; deger: KolonFiltre | undefined; onChange: (f: KolonFiltre | undefined) => void }) {
  const [ara, setAra] = useState('');
  const [hamMin, setHamMin] = useState<number | string>(deger?.tur === 'aralik' ? deger.min : '');
  const [hamMax, setHamMax] = useState<number | string>(deger?.tur === 'aralik' ? deger.max : '');
  // Filtre dışarıdan kalkınca (Filtreleri temizle, sütun gizleme) kutular da boşalır: kutu ile filtre ayrışmaz.
  useEffect(() => {
    if (!deger) {
      setHamMin('');
      setHamMax('');
    }
  }, [deger]);
  const tumu = secenekler.map(([v]) => v);
  const liste = deger?.tur === 'liste' ? deger : null;
  const aralik = deger?.tur === 'aralik' ? deger : { tur: 'aralik' as const, min: '' as const, max: '' as const, bos: false };
  const aralikDegis = (f: { min: number | ''; max: number | ''; bos: boolean }) => onChange(f.min === '' && f.max === '' && !f.bos ? undefined : { tur: 'aralik', ...f });
  const isaretle = (v: string, acik: boolean) => {
    const secili = liste ? liste.secili : tumu;
    const yeni = acik ? [...secili, v] : secili.filter((x) => x !== v);
    onChange(yeni.length === tumu.length ? undefined : { tur: 'liste', secili: yeni });
  };
  const sayi = (label: string, ham: number | string, setHam: (v: number | string) => void, set: (v: number | '') => void) => (
    <NumberInput
      label={label}
      value={ham}
      onChange={(v) => {
        setHam(v);
        set(hamSayi(v));
      }}
      {...SAYI_KUTUSU}
      classNames={{ root: 'opex-filter', label: 'opex-field-label', input: 'opex-input' }}
    />
  );
  return (
    <Popover position="bottom-start" trapFocus returnFocus middlewares={{ flip: true, shift: true, size: { padding: 8 } }} classNames={{ dropdown: 'navmenu opex-kolon-panel' }}>
      <Popover.Target>
        <button type="button" className="opex-icon-btn opex-filter-btn" aria-label={`${ad} sütununu filtrele`} data-active={deger ? '' : undefined}>
          {deger ? <IconFilterFilled size={16} aria-hidden="true" /> : <IconFilter size={16} stroke={2} aria-hidden="true" />}
        </button>
      </Popover.Target>
      {/* Panelin adı tetikleyiciden gelir (Mantine aria-labelledby): “… sütununu filtrele”. */}
      <Popover.Dropdown>
        {tur === 'liste' ? (
          <>
            {secenekler.length > 8 ? (
              <TextInput label="Seçeneklerde ara" value={ara} onChange={(e) => setAra(e.currentTarget.value)} classNames={{ root: 'opex-filter', label: 'opex-field-label', input: 'opex-input' }} />
            ) : null}
            <div className="opex-kolon-dugmeler">
              <button type="button" className="opex-btn" onClick={() => onChange(undefined)}>
                Tümü
              </button>
              <button type="button" className="opex-btn" onClick={() => onChange({ tur: 'liste', secili: [] })}>
                Hiçbiri
              </button>
            </div>
            <div className="opex-kolon-liste" role="group" aria-label={`${ad} değerleri`}>
              {secenekler
                .filter(([v]) => katla(v).includes(katla(ara.trim())))
                .map(([v, n]) => (
                  <Checkbox
                    key={v}
                    label={`${v || '(boş)'} · ${n}`}
                    checked={!liste || liste.secili.includes(v)}
                    onChange={(e) => isaretle(v, e.currentTarget.checked)}
                    classNames={{ root: 'opex-check', body: 'opex-check-body', input: 'opex-check-input', label: 'opex-check-label' }}
                  />
                ))}
            </div>
          </>
        ) : (
          <>
            {sayi('En az (₺)', hamMin, setHamMin, (v) => aralikDegis({ ...aralik, min: v }))}
            {sayi('En çok (₺)', hamMax, setHamMax, (v) => aralikDegis({ ...aralik, max: v }))}
            <Checkbox label="Boş (—) olanlar da" checked={aralik.bos} onChange={(e) => aralikDegis({ ...aralik, bos: e.currentTarget.checked })} classNames={{ root: 'opex-check', body: 'opex-check-body', input: 'opex-check-input', label: 'opex-check-label' }} />
            <button
              type="button"
              className="opex-btn"
              onClick={() => {
                setHamMin('');
                setHamMax('');
                onChange(undefined);
              }}
            >
              Temizle
            </button>
          </>
        )}
      </Popover.Dropdown>
    </Popover>
  );
}

/**
 * Tablo filtresi seçimi (kullanıcı kararı 2026-10-21): yalnız onay kutuları, kutuda hap/etiket yok. Kapalıyken kısa özet
 * (“Hepsi”, tek seçimde değerin kendisi, birden çokta “3 seçili”); açılınca onay kutulu liste ve “Temizle”.
 */
function SecimKutusu({ label, data, value, onChange }: { label: string; data: string[]; value: string[]; onChange: (v: string[]) => void }) {
  const id = useId();
  const ozet = value.length === 0 ? 'Hepsi' : value.length === 1 ? value[0] : `${value.length} seçili`;
  return (
    <div className="opex-filter">
      <span className="opex-field-label" id={`${id}-etiket`}>
        {label}
      </span>
      <Popover position="bottom-start" trapFocus returnFocus middlewares={{ flip: true, shift: true, size: { padding: 8 } }} classNames={{ dropdown: 'navmenu opex-kolon-panel' }}>
        <Popover.Target>
          <button type="button" className="opex-input opex-select" aria-label={`${label}: ${ozet}`} data-active={value.length ? '' : undefined}>
            <span className="opex-select-ozet">{ozet}</span>
            <IconChevronDown className="opex-select-ok" size={16} stroke={2} aria-hidden="true" />
          </button>
        </Popover.Target>
        <Popover.Dropdown>
          <div className="opex-kolon-liste" role="group" aria-labelledby={`${id}-etiket`}>
            {data.map((v) => (
              <Checkbox
                key={v}
                label={v}
                checked={value.includes(v)}
                onChange={(e) => {
                  const acik = e.currentTarget.checked;
                  onChange(acik ? [...value, v] : value.filter((x) => x !== v));
                }}
                classNames={{ root: 'opex-check', body: 'opex-check-body', input: 'opex-check-input', label: 'opex-check-label' }}
              />
            ))}
          </div>
          {value.length ? (
            <button type="button" className="opex-btn" onClick={() => onChange([])}>
              Temizle
            </button>
          ) : null}
        </Popover.Dropdown>
      </Popover>
    </div>
  );
}

type AltSatir = { tur: 'grup'; kume: KumeKod; ad: string; aylar: number[]; yillar: number[]; donem: number } | { tur: 'toplam'; ad: string; aylar: number[]; yillar: number[]; donem: number } | { tur: 'degisim'; ad: string; oranlar: string[] };

const ESAS_NOTU: Record<string, string> = { Net: 'net ücret', Brüt: 'brüt ücret', 'Asgari ücret': 'asgari ücret (net)', 'Fatura (KDV dahil)': 'fatura, KDV dahil' };
const ARTIS: Record<Gider['artis'], string> = { Kur: 'kur', Kira: 'kira', Genel: 'genel', Yok: 'artışsız' };
const r2 = (v: number) => Math.round(v * 100) / 100;
const SUTUN_GRUPLARI: { id: SutunGrubu; ad: string }[] = [
  { id: 'ay', ad: 'Ay sütunları (15)' },
  { id: 'yil', ad: 'Yıl toplamları ve 2027 artışı' },
  { id: 'personel', ad: 'Personel ayrıntıları' },
];

/** Aramada büyük/küçük harf ve ı/i farkı yok (“Instagram” → “insta”, “İnternet” → “internet”). */
const katla = (s: string) => s.toLocaleLowerCase('tr-TR').replace(/ı/g, 'i');
/** “1.000,50” → 1000.5 (Türkçe sayı yazımı). */
const sayiOku = (s: string) => Number(s.replace(/\s|₺|\$|€/g, '').replace(/\./g, '').replace(',', '.'));
/** Sütun araması: “>50000”, “<= 1.000”, “=0” sayı koşulu; değilse büyük/küçük harf duyarsız metin içinde arama. */
function aramaUyar(q: string, deger: number | string | null, metin: string) {
  const s = q.trim();
  if (!s) return true;
  const kosul = s.match(/^(>=|<=|>|<|=)\s*([\d.,]+)$/);
  if (kosul && typeof deger === 'number') {
    const n = sayiOku(kosul[2]);
    if (!Number.isFinite(n)) return true;
    return kosul[1] === '>' ? deger > n : kosul[1] === '<' ? deger < n : kosul[1] === '>=' ? deger >= n : kosul[1] === '<=' ? deger <= n : Math.round(deger) === Math.round(n);
  }
  return katla(metin).includes(katla(s));
}

function KalemTablosu({ m, p }: { m: OpexModel; p: Plan }) {
  const [grupSec, setGrupSec] = useState<KalemFiltre>('tumu');
  const [sirala, setSirala] = useState<{ id: string; yon: 'asc' | 'desc' } | null>(null);
  const [arama, setArama] = useState<Record<string, string>>({});
  // Tablo filtreleri (üstteki panel) ve sütun filtreleri (başlıktaki huni) ayrı; ikisi birlikte uygulanır.
  const [kolon, setKolon] = useState<Record<string, KolonFiltre>>({});
  const [kategoriSec, setKategoriSec] = useState<string[]>([]);
  const [durumSec, setDurumSec] = useState<string[]>([]);
  const [artisSec, setArtisSec] = useState<string[]>([]);
  const [enAzHam, setEnAz] = useState<number | string>('');
  const [enCokHam, setEnCok] = useState<number | string>('');
  const enAz = hamSayi(enAzHam);
  const enCok = hamSayi(enCokHam);
  const [turSec, setTurSec] = useState<string[]>([]);
  const [paraSec, setParaSec] = useState<string[]>([]);
  // Hızlı filtreler (kullanıcı kararı 2026-10-21): araç satırında kısa adlı anahtarlar ve onay kutuları.
  const [hizli, setHizli] = useState<HizliKod[]>([]);
  const [gizli, setGizli] = useState<SutunGrubu[]>([]);
  // Kabuk (ux.md §8.3, P4): süzgeç, sıra, arama, sütun ve açık kayıt durumu kabuğun dışında; 48em altında kayıt listesi.
  const sarmal = useRef<HTMLDivElement>(null);
  const kaydiran = useRef<HTMLDivElement>(null);
  const [acik, setAcik] = useState<string[]>([]);

  // “Bu ay”: rapor ayı (Sheets’teki onay kutusu ve ödeme durumu).
  const buAy = m.donem.ay - 1;
  const buAyKey: YilKey = m.donem.yil === 2027 ? 'y2027' : 'y2026';
  const buAyVar = (m.donem.yil === 2026 || m.donem.yil === 2027) && p.aylar.some((a) => a.key === buAyKey && a.index === buAy);
  const odemeTakibi = m.ozet.odeme.takip !== false;

  const all = useMemo<Kalem[]>(() => {
    const giderler = m.giderler.map((g): Kalem => {
      const ds = p.donemler.map((d) => giderDonem(g, d));
      const yillar = ds.map((x) => x.toplam);
      const tutarlar = ds.flatMap((d) => d.aylar);
      const durum: Kalem['durum'] = !buAyVar
        ? null
        : !g.aktif[buAyKey][buAy]
          ? { kod: 'off', ad: 'Bu ay yok' }
          : g.eksik && !g.ozel[buAyKey][buAy]
            ? { kod: 'missing', ad: 'Tutar girilmedi' }
            : odemeTakibi
              ? g.odendi
                ? { kod: 'paid', ad: 'Ödendi' }
                : { kod: 'due', ad: 'Bekliyor' }
              : { kod: 'var', ad: 'Bu ay var' };
      return {
        key: `g:${g.kaynak ?? ''}:${g.satir}:${g.kalem}`,
        tur: 'Gider',
        g,
        k: null,
        ad: g.kalem,
        etiket: g.hesap,
        kume: g.kume,
        kategori: g.kategori,
        para: g.para,
        tutarTl: g.eksik ? 0 : g.tl,
        durum,
        aylar: p.aylar.map((a, x) => (g.aktif[a.key][a.index] ? tutarlar[x] : null)),
        ozel: p.aylar.map((a) => g.ozel[a.key][a.index]),
        yillar,
        donem: r2(yillar.reduce((t, v) => t + v, 0)),
        artis: `${ARTIS[g.artis]} ${g.artisOrani ? signed(g.artisOrani) : '%0'}`,
        artar: g.artisOrani > 0,
        brut: null,
        kesinti: null,
        isveren: null,
        tesvik: null,
        kdv: null,
      };
    });
    const kisiler = m.kisiler.map((k): Kalem => {
      const ds = p.donemler.map((d) => ({ d, kd: kisiDonem(k, d) }));
      const yillar = ds.map(({ kd }) => kd.toplam.maliyet);
      const aylar = ds.flatMap(({ d, kd }) => d.aylar.map((i, j) => (k.aktif[d.key][i] ? kd.aylar[j].maliyet : null)));
      const top = (f: (s: Satir) => number) => r2(ds.reduce((t, { kd }) => t + f(kd.toplam), 0));
      const bordrolu = k.tur === 'Bordrolu';
      const durum: Kalem['durum'] = !buAyVar ? null : !k.aktif[buAyKey][buAy] ? { kod: 'off', ad: 'Bu ay yok' } : bordrolu ? { kod: 'bordro', ad: 'Bordro' } : { kod: 'fatura', ad: 'Fatura' };
      return {
        key: `k:${k.satir}`,
        tur: bordrolu ? 'Bordrolu' : 'Freelancer',
        g: null,
        k,
        ad: k.ad,
        etiket: bordrolu ? 'bordrolu' : 'freelancer',
        kume: 'insan',
        kategori: bordrolu ? 'Bordrolu personel' : 'Freelancer (fatura)',
        para: 'TRY',
        tutarTl: k.tutar,
        durum,
        aylar,
        ozel: p.aylar.map((a) => k.ozel[a.key][a.index]),
        yillar,
        donem: r2(yillar.reduce((t, v) => t + v, 0)),
        artis: k.zamOrani ? `zam ${signed(k.zamOrani)}` : 'zam yok',
        artar: k.zamOrani > 0,
        brut: bordrolu ? top((s) => s.brut) : null,
        kesinti: bordrolu ? top((s) => s.gv + s.dv + s.sgkIsci + s.issizlikIsci) : null,
        isveren: bordrolu ? top((s) => s.sgkIsveren + s.issizlikIsveren - s.tesvik) : null,
        tesvik: bordrolu ? top((s) => s.tesvik) : null,
        kdv: bordrolu ? null : top((s) => s.kdv),
      };
    });
    return [...giderler, ...kisiler];
  }, [m, p, buAy, buAyKey, buAyVar, odemeTakibi]);

  // Kategori hapı rengi: kategorinin ilk görünüş sırasıyla 8 pastel çiftten biri (süzgeç değişse de aynı kalır).
  const katRenk = useMemo(() => {
    const map = new Map<string, number>();
    for (const r of all) if (!map.has(r.kategori)) map.set(r.kategori, (map.size % 8) + 1);
    return map;
  }, [all]);

  const para = (v: number | null, sub?: string) =>
    v === null ? (
      <Num>—</Num>
    ) : (
      <Num>
        {tlExact(v)}
        {sub ? <span className="cell-sub">{sub}</span> : null}
      </Num>
    );
  const faturaUrl = (r: Kalem) => (r.g && /^https:\/\//.test(r.g.fatura) ? r.g.fatura : null);
  /** Kalem adı: küme noktası, ad, hesap etiketi; tabloda fatura bağlantısı satır içinde, kayıt başlığında yok (düğme içinde bağlantı olmaz, ux.md §8.2). */
  const kalemAdi = (r: Kalem, baglanti: boolean) => (
    <span className="opex-item">
      <Dot tone={KUME_TONE[r.kume]} />
      <span>
        {r.ad}
        {r.etiket ? <span className="opex-tag">{r.etiket}</span> : null}
        {baglanti && faturaUrl(r) ? (
          <>
            {' '}
            <a className="text-link" href={faturaUrl(r)!} target="_blank" rel="noopener noreferrer">
              fatura
            </a>
          </>
        ) : null}
      </span>
    </span>
  );
  const sutunlar: Sutun[] = [
    {
      id: 'kalem',
      baslik: 'Kalem',
      ad: 'Kalem',
      sabit: true,
      minWidth: '15rem',
      deger: (r) => r.ad,
      metin: (r) => `${r.ad} ${r.etiket}`,
      liste: (r) => r.ad,
      hucre: (r) => kalemAdi(r, true),
    },
    {
      id: 'kategori',
      baslik: 'Kategori',
      ad: 'Kategori',
      minWidth: '10rem',
      deger: (r) => r.kategori,
      metin: (r) => r.kategori,
      hucre: (r) => (
        <span className="opex-pill" data-cat={katRenk.get(r.kategori)}>
          {r.kategori}
        </span>
      ),
    },
    {
      id: 'tutar',
      baslik: <Num>Tutar</Num>,
      ad: 'Tutar',
      sayi: true,
      deger: (r) => (r.g?.eksik ? null : r.tutarTl),
      metin: (r) => (r.g ? (r.g.eksik ? '—' : money(r.g.tutar, r.g.para)) : money(r.k!.tutar, 'TRY')),
      hucre: (r) =>
        r.g ? (
          <Num>{r.g.eksik ? '—' : money(r.g.tutar, r.g.para)}</Num>
        ) : (
          <Num>
            {money(r.k!.tutar, 'TRY')}
            <span className="cell-sub">{ESAS_NOTU[r.k!.esas] ?? r.k!.esas}</span>
          </Num>
        ),
    },
    ...(buAyVar
      ? [
          {
            id: 'durum',
            baslik: 'Bu ay',
            ad: 'Bu ay',
            deger: (r: Kalem) => r.durum?.ad ?? '',
            metin: (r: Kalem) => r.durum?.ad ?? '',
            liste: (r: Kalem) => r.durum?.ad ?? '',
            hucre: (r: Kalem) =>
              r.durum ? (
                <span className="opex-state" data-state={r.durum.kod}>
                  {r.durum.ad}
                </span>
              ) : (
                ''
              ),
          },
        ]
      : []),
    // Ay sütunları: Sheets aylık ızgarasındaki onay kutusu (— = o ay gider yok) ve o aya yazılmış özel tutar.
    ...p.aylar.map(
      (a, x): Sutun => ({
        id: `ay-${a.key}-${a.index}`,
        baslik: (
          <Num>
            <span aria-hidden="true">{ayKisa(a)}</span>
            <span className="visually-hidden">{a.ad}</span>
          </Num>
        ),
        ad: a.ad,
        grup: 'ay',
        sayi: true,
        deger: (r) => r.aylar[x],
        metin: (r) => (r.aylar[x] === null ? '—' : tl(r.aylar[x] as number)),
        hucre: (r) =>
          r.aylar[x] === null ? (
            <Num>
              <span className="opex-month-off">
                <span aria-hidden="true">—</span>
                <span className="visually-hidden">yok</span>
              </span>
            </Num>
          ) : (
            <Num>
              {tl(r.aylar[x] as number)}
              {r.ozel[x] ? <span className="cell-sub">özel</span> : null}
            </Num>
          ),
      }),
    ),
    ...p.donemler.map(
      (d, y): Sutun => ({ id: `yil-${d.yil}`, baslik: <Num>{`${d.yil} ₺`}</Num>, ad: `${d.yil} ₺`, grup: 'yil', sayi: true, deger: (r) => r.yillar[y], metin: (r) => tlExact(r.yillar[y]), hucre: (r) => para(r.yillar[y]) }),
    ),
    { id: 'donem', baslik: <Num>Toplam ₺</Num>, ad: 'Toplam ₺', sayi: true, deger: (r) => r.donem, metin: (r) => tlExact(r.donem), hucre: (r) => para(r.donem) },
    ...(p.donemler.some((d) => d.yil === 2027)
      ? [{ id: 'artis', baslik: '2027 artışı', ad: '2027 artışı', grup: 'yil' as const, deger: (r: Kalem) => r.artis, metin: (r: Kalem) => r.artis, hucre: (r: Kalem) => r.artis }]
      : []),
    { id: 'brut', baslik: <Num>Brüt</Num>, ad: 'Brüt', grup: 'personel', sayi: true, deger: (r) => r.brut, metin: (r) => (r.brut === null ? '—' : tlExact(r.brut)), hucre: (r) => para(r.brut) },
    { id: 'kesinti', baslik: <Num>Kesintiler (işçi)</Num>, ad: 'Kesintiler (işçi)', grup: 'personel', sayi: true, deger: (r) => r.kesinti, metin: (r) => (r.kesinti === null ? '—' : tlExact(r.kesinti)), hucre: (r) => para(r.kesinti) },
    { id: 'isveren', baslik: <Num>İşveren payı</Num>, ad: 'İşveren payı', grup: 'personel', sayi: true, deger: (r) => r.isveren, metin: (r) => (r.isveren === null ? '—' : tlExact(r.isveren)), hucre: (r) => para(r.isveren) },
    { id: 'tesvik', baslik: <Num>Teşvik</Num>, ad: 'Teşvik', grup: 'personel', sayi: true, deger: (r) => r.tesvik, metin: (r) => (r.tesvik === null ? '—' : tlExact(r.tesvik)), hucre: (r) => para(r.tesvik, r.k?.tesvik?.ad) },
    { id: 'kdv', baslik: <Num>Fatura KDV’si</Num>, ad: 'Fatura KDV’si', grup: 'personel', sayi: true, deger: (r) => r.kdv, metin: (r) => (r.kdv === null ? '—' : tlExact(r.kdv)), hucre: (r) => para(r.kdv) },
  ];
  const gorunen = sutunlar.filter((s) => !s.grup || !gizli.includes(s.grup));
  const sutunHarita = new Map(sutunlar.map((s) => [s.id, s]));
  const mod = useKabuk(sarmal, kaydiran, gorunen.map((s) => s.minWidth));

  const kumeSay = (k: KumeKod) => all.filter((r) => r.kume === k).length;
  const secenek = (xs: string[]) => [...new Set(xs)].sort((a, b) => a.localeCompare(b, 'tr'));
  const ARTIS_SECENEK = secenek(all.map((r) => r.artis.replace(/ [+−]?%[\d,]+$/, '')));
  /** Liste filtresi seçenekleri: tüm satırlardaki değerler ve sayıları (süzgeçten bağımsız). */
  const secenekler = (s: Sutun): [string, number][] => {
    const map = new Map<string, number>();
    for (const r of all) {
      const v = (s.liste ?? s.metin)(r);
      map.set(v, (map.get(v) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0], 'tr'));
  };

  // 37 civarı satır: süzme ve sıralama her çizimde (sütun işlevleriyle aynı çizimden; bayat kapanış yok).
  const suzulmus = (() => {
    const out = all.filter((r) => {
      if (grupSec !== 'tumu' && r.kume !== grupSec) return false;
      if (kategoriSec.length && !kategoriSec.includes(r.kategori)) return false;
      if (durumSec.length && !durumSec.includes(r.durum?.ad ?? '')) return false;
      if (turSec.length && !turSec.includes(r.tur)) return false;
      if (paraSec.length && !paraSec.includes(r.para)) return false;
      if (artisSec.length && !artisSec.some((a) => r.artis.startsWith(a))) return false;
      if (enAz !== '' && r.donem < enAz) return false;
      if (enCok !== '' && r.donem > enCok) return false;
      for (const [id, f] of Object.entries(kolon)) {
        const s = sutunHarita.get(id);
        if (s && !kolonUyar(f, (s.liste ?? s.metin)(r), s.deger(r))) return false;
      }
      for (const h of hizli) if (!HIZLI_KOSUL[h](r)) return false;
      for (const [id, q] of Object.entries(arama)) {
        const s = sutunHarita.get(id);
        if (s && !aramaUyar(q, s.deger(r), s.metin(r))) return false;
      }
      return true;
    });
    const s = sirala ? sutunHarita.get(sirala.id) : null;
    if (!s || !sirala) return out;
    const yon = sirala.yon === 'asc' ? 1 : -1;
    return [...out].sort((a, b) => {
      const [x, y] = [s.deger(a), s.deger(b)];
      // Boş (—) değerler yön ne olursa olsun sonda.
      if (x === null || x === '') return y === null || y === '' ? 0 : 1;
      if (y === null || y === '') return -1;
      return (typeof x === 'number' && typeof y === 'number' ? x - y : String(x).localeCompare(String(y), 'tr')) * yon;
    });
  })();

  const topla = (xs: Kalem[]) => ({
    aylar: p.aylar.map((_, x) => xs.reduce((t, r) => t + (r.aylar[x] ?? 0), 0)),
    yillar: p.donemler.map((_, y) => xs.reduce((t, r) => t + r.yillar[y], 0)),
    donem: xs.reduce((t, r) => t + r.donem, 0),
  });
  const toplam: AltSatir = { tur: 'toplam', ad: `Toplam · ${suzulmus.length} kalem`, ...topla(suzulmus) };
  const kumeler = GRUPLAR.filter((t) => suzulmus.some((r) => r.kume === t.kume));
  // Grup ara toplamları birden çok grup listelenirken (tek grupta toplamla aynı olurdu).
  const altlar: AltSatir[] = [
    ...(kumeler.length > 1 ? kumeler.map((t): AltSatir => ({ tur: 'grup', kume: t.kume, ad: KUME_AD[t.kume], ...topla(suzulmus.filter((r) => r.kume === t.kume)) })) : []),
    toplam,
    ...(gizli.includes('ay') ? [] : [{ tur: 'degisim' as const, ad: 'Önceki aya göre', oranlar: toplam.aylar.map((v, x) => (x ? change(v, toplam.aylar[x - 1]) : '—')) }]),
  ];
  const altHucre = (a: AltSatir, s: Sutun): ReactNode => {
    if (s.id === 'kalem')
      return a.tur === 'grup' ? (
        <span className="opex-item">
          <Dot tone={KUME_TONE[a.kume]} />
          <span>{a.ad}</span>
        </span>
      ) : (
        a.ad
      );
    const ay = p.aylar.findIndex((x) => `ay-${x.key}-${x.index}` === s.id);
    if (a.tur === 'degisim') return ay >= 0 ? <Num>{a.oranlar[ay]}</Num> : '';
    if (ay >= 0) return <Num>{tl(a.aylar[ay])}</Num>;
    const yil = p.donemler.findIndex((d) => `yil-${d.yil}` === s.id);
    if (yil >= 0) return para(a.yillar[yil]);
    if (s.id === 'donem') return para(a.donem);
    return '';
  };
  const genel = topla(all);

  /*
   * Kayıt kabuğu (ux.md §8.2 “320 px kayıt örneği: gider kalemi”, P4): aynı sütun/satır modeli (süzülmüş, sıralı, görünen
   * sütunlar) kayıt listesine çevrilir. Başlık: kalem adı + seçili ay — rapor ayı (“Bu ay”) ızgaradaysa ve ay alanları
   * gizli değilse o ayın tutarı, yoksa dönem toplamı. Panel: Kategori, Tür, Tutar (kaynak para birimi), Bu ay, 2027
   * artışı, Toplam ₺, yıl toplamları, 15 ay, uygulanabilen personel alanları, fatura bağlantısı. Alt satırlar özet
   * kayıtları olarak listenin sonunda. Kayıt kimliği kalıcı anahtardan (id güvenli), sıra indeksi değil.
   */
  const kimlik = (anahtar: string) => anahtar.replace(/[^A-Za-z0-9-]/g, (c) => `_${c.codePointAt(0)!.toString(16)}`);
  const kalemSutun = sutunHarita.get('kalem')!;
  const ozetSutun = sutunHarita.get(buAyVar && !gizli.includes('ay') ? `ay-${buAyKey}-${buAy}` : 'donem')!;
  const alanSutunlari = [
    ...['kategori', 'tutar', 'durum', 'artis', 'donem'].map((id) => sutunHarita.get(id)),
    ...sutunlar.filter((s) => s.grup === 'yil' && s.id !== 'artis'),
    ...sutunlar.filter((s) => s.grup === 'ay'),
    ...sutunlar.filter((s) => s.grup === 'personel'),
  ].filter((s): s is Sutun => !!s && gorunen.includes(s));
  const kayitlar: Kayit[] =
    mod === 'kayit'
      ? suzulmus.map((r) => ({
          key: kimlik(r.key),
          title: kalemAdi(r, false),
          summary: { label: ozetSutun.ad, value: ozetSutun.hucre(r) },
          fields: [
            ...alanSutunlari.flatMap((s) => {
              // Uygulanamayan personel alanı (—) sunulmaz; ay “—” (o ay gider yok) bilgidir, kalır.
              if (s.grup === 'personel' && s.deger(r) === null) return [];
              const alan = { key: s.id, label: s.ad, value: s.hucre(r) };
              return s.id === 'kategori' ? [alan, { key: 'tur', label: 'Tür', value: r.tur }] : [alan];
            }),
            ...(faturaUrl(r)
              ? [
                  {
                    key: 'fatura',
                    label: 'Fatura',
                    value: (
                      <a className="text-link" data-standalone="" href={faturaUrl(r)!} target="_blank" rel="noopener noreferrer">
                        Faturayı aç
                      </a>
                    ),
                  },
                ]
              : []),
          ],
        }))
      : [];
  const ozetKayitlar: Kayit[] =
    mod === 'kayit'
      ? altlar.map((a) => {
          const ozet = altHucre(a, ozetSutun);
          return {
            key: a.tur === 'grup' ? `alt-grup-${a.kume}` : `alt-${a.tur}`,
            title: altHucre(a, kalemSutun),
            tone: a.tur === 'toplam' ? 'total' : 'ozet',
            summary: ozet === '' ? undefined : { label: ozetSutun.ad, value: ozet },
            fields: alanSutunlari.map((s) => ({ key: s.id, label: s.ad, value: altHucre(a, s) })).filter((f) => f.value !== ''),
          };
        })
      : [];

  const temizle = () => {
    setGrupSec('tumu');
    setSirala(null);
    setArama({});
    setKolon({});
    setKategoriSec([]);
    setDurumSec([]);
    setTurSec([]);
    setParaSec([]);
    setArtisSec([]);
    setEnAz('');
    setEnCok('');
    setHizli([]);
  };
  const filtreVar =
    grupSec !== 'tumu' || sirala !== null || Object.values(arama).some((q) => q.trim()) ||
    Object.keys(kolon).length > 0 ||
    kategoriSec.length + durumSec.length + turSec.length + paraSec.length + artisSec.length > 0 ||
    enAz !== '' ||
    enCok !== '' ||
    hizli.length > 0;
  const siraDegistir = (id: string) => setSirala((s) => (!s || s.id !== id ? { id, yon: 'asc' } : s.yon === 'asc' ? { id, yon: 'desc' } : null));
  const coklu = (label: string, data: string[], value: string[], onChange: (v: string[]) => void) => <SecimKutusu label={label} data={data} value={value} onChange={onChange} />;
  const tabloAdi = `Kalemler · ${p.etiket}`;
  return (
    <>
      {/* Döviz kurları kırıntı satırında (Kurlar); burada yalnız bu ayın ödeme durumu. */}
      {buAyVar && odemeTakibi ? (
        <FactsRow
          items={[
            { label: 'Bu ay ödenen (teknoloji, ofis)', value: `${tl(m.ozet.odeme.odenen)} · ${m.ozet.odeme.adetOdenen} kalem` },
            { label: 'Bu ay bekleyen (teknoloji, ofis)', value: `${tl(m.ozet.odeme.bekleyen)} · ${m.ozet.odeme.adetBekleyen} kalem` },
          ]}
        />
      ) : null}
      <div className="table-block opex-veri" ref={sarmal} data-kabuk={mod}>
        {/* Kullanıcı kararı 2026-10-21: tablonun üstünde başlık ve açıklama yok (kalıcı); yalnız ayırıcı. Tablonun
            adı ekran okuyucuya bölgede (aria-label). */}
        <hr className="opex-ayrac" />
        {/*
          Filtre tepsisi (kullanıcı kararı 2026-10-21): tablonun eklentisi gibi, hemen üstüne bitişik ve ayrı tonda
          (tablonun içinde değil). Üst satırda grup, hızlı filtreler ve sütunlar.
        */}
        <div className="opex-tepsi">
          <div className="opex-veri-arac">
            <Toggles
              label="Grup süzgeci"
              value={grupSec}
              onChange={setGrupSec}
              options={[
                { value: 'tumu', label: `Hepsi (${all.length})` },
                { value: 'ofis', label: `Ofis (${kumeSay('ofis')})` },
                { value: 'teknoloji', label: `Teknoloji (${kumeSay('teknoloji')})` },
                { value: 'insan', label: `Personel (${kumeSay('insan')})` },
              ]}
            />
            <div className="opex-hizli" role="group" aria-label="Hızlı filtreler">
              {HIZLI.filter((h) => h.kod !== 'bekleyen' || (buAyVar && odemeTakibi)).map((h) => {
                const acik = hizli.includes(h.kod);
                const degis = (v: boolean) => setHizli((xs) => (v ? [...xs, h.kod] : xs.filter((x) => x !== h.kod)));
                return h.tip === 'anahtar' ? (
                  <Anahtar key={h.kod} ad={h.ad} acik={acik} title={h.aciklama} onChange={degis} />
                ) : (
                  <Checkbox
                    key={h.kod}
                    label={h.ad}
                    title={h.aciklama}
                    checked={acik}
                    onChange={(e) => degis(e.currentTarget.checked)}
                    classNames={{ root: 'opex-check', body: 'opex-check-body', input: 'opex-check-input', label: 'opex-check-label' }}
                  />
                );
              })}
            </div>
            {/* Sütun grupları: gerçek onay kutuları (durum ekran okuyucuya duyurulur); Escape kapatır, odak düğmeye döner. */}
            <Popover position="bottom-end" trapFocus returnFocus middlewares={{ flip: true, shift: true, size: { padding: 8 } }} classNames={{ dropdown: 'navmenu opex-sutun-panel' }}>
              <Popover.Target>
                <button type="button" className="opex-btn opex-sutunlar">
                  Sütunlar
                </button>
              </Popover.Target>
              <Popover.Dropdown>
                {SUTUN_GRUPLARI.map((g) => (
                  <Checkbox
                    key={g.id}
                    label={g.ad}
                    checked={!gizli.includes(g.id)}
                    onChange={(e) => {
                      const acik = e.currentTarget.checked;
                      setGizli((xs) => (acik ? xs.filter((x) => x !== g.id) : [...xs, g.id]));
                      if (!acik) {
                        // Gizlenen sütunun filtresi görünmeden çalışmaya devam etmesin: filtre, arama ve sıralama kalkar.
                        const ids = new Set(sutunlar.filter((x) => x.grup === g.id).map((x) => x.id));
                        const ayikla = <T,>(o: Record<string, T>) => Object.fromEntries(Object.entries(o).filter(([id]) => !ids.has(id)));
                        setKolon(ayikla);
                        setArama(ayikla);
                        setSirala((x) => (x && ids.has(x.id) ? null : x));
                      }
                    }}
                    classNames={{ root: 'opex-check', body: 'opex-check-body', input: 'opex-check-input', label: 'opex-check-label' }}
                  />
                ))}
              </Popover.Dropdown>
            </Popover>
          </div>
          {/* Tablo filtreleri (kullanıcı kararı 2026-10-21): sütun filtrelerinden ayrı, tüm tabloya uygulanır. */}
          <h4 className="opex-filtreler-baslik" id="tablo-filtreleri">
            Tablo filtreleri
          </h4>
          <div className="opex-filtreler" role="group" aria-labelledby="tablo-filtreleri">
            {coklu('Kategori', [...katRenk.keys()], kategoriSec, setKategoriSec)}
            {buAyVar ? coklu('Bu ay', secenek(all.map((r) => r.durum?.ad ?? '').filter(Boolean)), durumSec, setDurumSec) : null}
            {coklu('Tür', ['Gider', 'Bordrolu', 'Freelancer'], turSec, setTurSec)}
            {coklu('Para birimi', secenek(all.map((r) => r.para)), paraSec, setParaSec)}
            {coklu('2027 artışı', ARTIS_SECENEK, artisSec, setArtisSec)}
            <NumberInput
              label="Toplam ₺ en az"
              value={enAzHam}
              onChange={setEnAz}
              {...SAYI_KUTUSU}
              classNames={{ root: 'opex-filter', label: 'opex-field-label', input: 'opex-input' }}
            />
            <NumberInput
              label="Toplam ₺ en çok"
              value={enCokHam}
              onChange={setEnCok}
              {...SAYI_KUTUSU}
              classNames={{ root: 'opex-filter', label: 'opex-field-label', input: 'opex-input' }}
            />
          </div>
          <div className="opex-veri-durum">
            <p className="opex-veri-sayi" role="status" aria-live="polite">
              {suzulmus.length} / {all.length} kalem
            </p>
            {filtreVar ? (
              <button type="button" className="opex-btn" onClick={temizle}>
                Filtreleri temizle
              </button>
            ) : null}
            {/* Kapsam (UX-12): süzgeç kalemleri azaltınca süzülmüş ve genel dönem toplamı birlikte, iki kabukta da. */}
            {suzulmus.length !== all.length ? (
              <p className="opex-veri-kapsam">
                Süzülmüş toplam {tl(toplam.donem)} ({suzulmus.length} kalem) · Genel toplam {tl(genel.donem)} ({all.length} kalem)
              </p>
            ) : null}
            {/* Kısa sembol efsanesi (gorsel_algi.md F17): yoğun tabloda “—” korunur, anlamı görünür ve yereldir. */}
            <p className="opex-sembol-efsanesi">
              — : o ay bu kalemde gider yok (0 ₺); personel sütunlarında (brüt, kesintiler, işveren payı, teşvik, KDV) bordrosuz kalem için uygulanmıyor demektir.
            </p>
          </div>
        </div>
        {mod === 'kayit' ? (
          <>
            {/* Kayıt kabuğu: kalem araması Kalem sütunu aramasıyla aynı durum; kalemler, sonra alt satırlar özet kayıtları. */}
            <div className="opex-kayit-arac">
              <input
                type="search"
                className="opex-col-search"
                aria-label="Kalem ara"
                placeholder="Kalem ara"
                value={arama.kalem ?? ''}
                onChange={(e) => {
                  const v = e.currentTarget.value;
                  setArama((a) => ({ ...a, kalem: v }));
                }}
              />
            </div>
            {suzulmus.length ? (
              <KayitListesi className="opex-kayitlar" label={tabloAdi} kayitlar={kayitlar} acik={acik} onChange={setAcik} />
            ) : (
              <p className="opex-kayit-bos">Bu filtrelerle kalem yok.</p>
            )}
            <KayitListesi className="opex-kayitlar-ozet kayitlar-ozet" label={`Toplamlar · ${p.etiket}`} kayitlar={ozetKayitlar} acik={acik} onChange={setAcik} />
          </>
        ) : (
          <div className="table-frame">
            <div
              className="table-scroll"
              role="region"
              aria-label={tabloAdi}
              tabIndex={0}
              ref={kaydiran}
              // Yatay kaydırılınca sabit sütunun kenar gölgesi (yeniden çizim yok: öznitelik ve sütun genişliği değişkeni).
              onScroll={(e) => {
                const el = e.currentTarget;
                el.toggleAttribute('data-kaydi', el.scrollLeft > 0);
                const sabit = el.querySelector<HTMLElement>('thead th.cell-sticky');
                if (sabit) el.parentElement?.style.setProperty('--sabit-genislik', `${sabit.getBoundingClientRect().width}px`);
              }}
            >
              <Table className="data-table opex-veri-table" withRowBorders withTableBorder={false} verticalSpacing="sm" horizontalSpacing="md">
                <Table.Thead>
                  <Table.Tr>
                    {gorunen.map((s) => {
                      const yon = sirala?.id === s.id ? sirala.yon : null;
                      return (
                        <Table.Th
                          key={s.id}
                          scope="col"
                          className={[s.sabit ? 'cell-sticky' : '', 'cell-nowrap'].filter(Boolean).join(' ')}
                          style={s.minWidth ? { minWidth: s.minWidth } : undefined}
                          aria-sort={yon === 'asc' ? 'ascending' : yon === 'desc' ? 'descending' : undefined}
                          data-num={s.sayi ? '' : undefined}
                        >
                          <span className="opex-th">
                            <button type="button" className="opex-sort" onClick={() => siraDegistir(s.id)}>
                              {s.baslik}
                              {yon === 'asc' ? <IconArrowUp className="opex-sort-icon" size={16} aria-hidden="true" /> : yon === 'desc' ? <IconArrowDown className="opex-sort-icon" size={16} aria-hidden="true" /> : <IconArrowsSort className="opex-sort-icon" data-idle="" size={16} aria-hidden="true" />}
                            </button>
                            <KolonFiltresi
                              ad={s.ad}
                              tur={s.sayi ? 'aralik' : 'liste'}
                              secenekler={s.sayi ? [] : secenekler(s)}
                              deger={kolon[s.id]}
                              onChange={(f) =>
                                setKolon((k) => {
                                  const { [s.id]: _eski, ...kalan } = k;
                                  return f ? { ...kalan, [s.id]: f } : kalan;
                                })
                              }
                            />
                          </span>
                        </Table.Th>
                      );
                    })}
                  </Table.Tr>
                  <Table.Tr className="opex-search-row">
                    {gorunen.map((s) => (
                      <Table.Td key={s.id} className={s.sabit ? 'cell-sticky' : undefined}>
                        <input
                          type="search"
                          className="opex-col-search"
                          aria-label={`${s.ad} sütununda ara`}
                          placeholder={s.id === 'tutar' ? '₺: >, <, =' : s.sayi ? '>, <, =' : 'Ara'}
                          value={arama[s.id] ?? ''}
                          onChange={(e) => {
                            const v = e.currentTarget.value;
                            setArama((a) => ({ ...a, [s.id]: v }));
                          }}
                        />
                      </Table.Td>
                    ))}
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {suzulmus.length ? (
                    suzulmus.map((r) => (
                      <Table.Tr key={r.key}>
                        {gorunen.map((s) =>
                          s.id === 'kalem' ? (
                            <Table.Th key={s.id} scope="row" className="cell-sticky">
                              {s.hucre(r)}
                            </Table.Th>
                          ) : (
                            <Table.Td key={s.id} className="cell-nowrap">
                              {s.hucre(r)}
                            </Table.Td>
                          ),
                        )}
                      </Table.Tr>
                    ))
                  ) : (
                    <Table.Tr>
                      <Table.Td colSpan={gorunen.length} className="opex-veri-bos">
                        Bu filtrelerle kalem yok.
                      </Table.Td>
                    </Table.Tr>
                  )}
                </Table.Tbody>
                <Table.Tfoot>
                  {altlar.map((a) => (
                    <Table.Tr key={a.tur === 'grup' ? `grup:${a.kume}` : a.tur} data-tone={a.tur === 'toplam' ? 'total' : undefined}>
                      {gorunen.map((s) =>
                        s.id === 'kalem' ? (
                          <Table.Th key={s.id} scope="row" className="cell-sticky">
                            {altHucre(a, s)}
                          </Table.Th>
                        ) : (
                          <Table.Td key={s.id} className="cell-nowrap">
                            {altHucre(a, s)}
                          </Table.Td>
                        ),
                      )}
                    </Table.Tr>
                  ))}
                </Table.Tfoot>
              </Table>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function TechVendors({ m, p }: { m: OpexModel; p: Plan }) {
  const map = new Map<string, number>();
  for (const g of m.giderler.filter((x) => x.kume === 'teknoloji')) map.set(g.kalem, (map.get(g.kalem) ?? 0) + p.donemler.reduce((t, d) => t + giderDonem(g, d).toplam, 0));
  const tech = [...map.entries()].sort((a, b) => b[1] - a[1]);
  return (
    <Chart
      id="teknoloji"
      title="Teknoloji sağlayıcıları"
      note={`${p.etiket} toplamı ₺, hesaplar toplanmış`}
      size="md"
      rows={tech.length}
      summary={tech.map(([n, v]) => `${n} ${tl(v)}`).join('; ')}
      spec={{ kind: 'opex-bar', items: tech.map(([name, value]) => ({ name, value, tone: 'tech' as const })) }}
    />
  );
}

function People({ m, d }: { m: OpexModel; d: Donem }) {
  const per = m.kisiler.map((k) => ({ k, s: kisiDonem(k, d).toplam }));
  const sum = (f: keyof Satir, xs = per) => xs.reduce((t, x) => t + x.s[f], 0);
  const total = { ...per[0]?.s } as Satir;
  for (const f of Object.keys(total) as (keyof Satir)[]) total[f] = sum(f);
  const staff = per.filter((x) => x.k.tur === 'Bordrolu');
  const free = per.filter((x) => x.k.tur === 'Freelancer');
  const b = { ...total } as Satir;
  for (const f of Object.keys(b) as (keyof Satir)[]) b[f] = sum(f, staff);
  // İşveren maliyetinin parçaları (kullanıcı kararı 2026-10-21: tek yığılmış çubuk): net + vergiler + işçi SGK = brüt; + işveren payı (teşvik sonrası).
  const bilesim: { name: string; value: number; tone: OpexTone }[] = [
    { name: 'Net ücret', value: b.net, tone: 'net' },
    { name: 'Gelir vergisi', value: b.gv, tone: 'tax' },
    { name: 'Damga vergisi', value: b.dv, tone: 'tax' },
    { name: 'SGK ve işsizlik (işçi)', value: b.sgkIsci + b.issizlikIsci, tone: 'sgk' },
    { name: 'İşveren payı (teşvik sonrası)', value: b.sgkIsveren + b.issizlikIsveren - b.tesvik, tone: 'employer' },
  ];
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
      {/* Kişi tablosu kalemler tablosunda (kullanıcı kararı 2026-10-21): personel ayrıntıları orada sütun olarak. */}
      {/* Tam genişlik: uzun adlar ve değer etiketleri sığar (yan yana yarım genişlikte etiketler gizleniyordu). */}
      <Chart
        id={`bordro-bilesen-${d.yil}`}
        title="Bordro bileşenleri"
        note={`${d.etiket} toplamı, kişi başına`}
        size="lg"
        rows={staff.length}
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
        id={`bordro-bilesim-${d.yil}`}
        title="Netten işveren maliyetine"
        note={`${d.etiket}, bordrolu toplam · işveren maliyeti ${tl(b.maliyet)} (brüt ${tl(b.brut)})${b.tesvik ? ` · teşvik −${tl(b.tesvik)} düşüldü` : ''}`}
        size="sm"
        rows={1}
        shortLabels
        summary={`İşveren maliyeti ${tl(b.maliyet)}: net ücret ${tl(b.net)}, gelir vergisi ${tl(b.gv)}, damga vergisi ${tl(b.dv)}, işçi SGK ve işsizlik ${tl(b.sgkIsci + b.issizlikIsci)} (brüt ${tl(b.brut)}), işveren payı ${tl(b.sgkIsveren + b.issizlikIsveren - b.tesvik)} (teşvik ${tl(b.tesvik)} düşüldü).`}
        spec={{ kind: 'opex-bilesim', total: { name: 'İşveren maliyeti', value: b.maliyet }, parts: bilesim }}
      />
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
        rows={d.aySayisi}
        shortLabels
        summary={`${person.ad}, ${d.etiket}: brüt ${d.seri[0].ad} ${tl(first.brut)}, ${d.seri[d.seri.length - 1].ad} ${tl(last.brut)}; işveren maliyeti ${tl(pd.toplam.maliyet)}.`}
        spec={{
          kind: 'opex-stack-h',
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
    { key: 'dg', header: <Num>Değişim</Num>, nowrap: true, render: (r) => <Num>{once.ortalama[r.k] ? signed(d.ortalama[r.k] / once.ortalama[r.k] - 1) : 'Uygulanmıyor'}</Num> },
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
          Kaynak arama bağlantısı
        </a>{' '}
        (arama sonucu; doğrulanmış kaynak değildir, tarih ve sürümü kullanıcı denetler).
      </p>
      <Chart
        id="kisi-2027"
        title="Kişi maliyeti: 2026 ve 2027"
        note={`Aylık ortalama: 2026 (${once.etiket.replace(' 2026', '')}) ve 2027`}
        size="xl"
        rows={m.kisiler.length}
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

/** Seçili yılın bölümleri; numara plan ve kalemlerden sonra sürer. */
function YearPanel({ m, d, start }: { m: OpexModel; d: Donem; start: number }) {
  let n = start - 1;
  const no = () => (n += 1);
  return (
    <>
      <Section id={`ozet-${d.yil}`} index={no()} title={`${d.yil} özeti`}>
        <Overview m={m} d={d} />
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

/**
 * Sayfa sırası (kullanıcı kararı 2026-10-20): yıl ayrımı olmayan plan ve kalemler üstte; yıl seçici onların altında,
 * yıla bağlı bölümlerin başında. Parametreler bölümü yok: değerler Sheets → Parametreler’de.
 */
function Content({ data, yil, donemler, onYil }: { data: OpexData; yil: Yil; donemler: Donem[]; onYil: (y: Yil) => void }) {
  const m = data.model;
  const d = donemler.find((x) => x.yil === yil) ?? donemler[0];
  // Plan rapor ayıyla kaymaz: ızgaranın 15 ayı (Kasım’da veya 2027’de de Ekim 2026’dan başlar).
  const p = useMemo(() => planOfModel(m), [m]);
  return (
    <OzetContext.Provider value={data.ozet}>
      <Kurlar m={m} />
      {m.uyarilar.length ? (
        <Note title={`Sheets uyarıları (${m.uyarilar.length})`}>
          <ul className="opex-warnings">
            {m.uyarilar.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </Note>
      ) : null}
      <Section id="plan-bolum" index={1} title={`Aylık plan · ${p.etiket}`} desc="Her ayın teknoloji, ofis ve işletme ve personel gideri ayrı hesaplanır.">
        <Plan p={p} />
      </Section>
      <Section id="kalemler-bolum" index={2} title="Kalemler" desc="Üç grup: ofis (kira ve aidat, internet, telefon, elektrik, ofis ihtiyaçları), teknoloji (yazılım, yapay zekâ, sunucu, API, AWS vb.), personel (bordro ve freelancer).">
        <KalemTablosu m={m} p={p} />
        {/* Tablo ile grafik arasında ayırıcı (kullanıcı kararı 2026-10-21). */}
        <hr className="opex-ayrac opex-ayrac-arada" />
        <TechVendors m={m} p={p} />
      </Section>
      {/*
        Yıl kümesi (kullanıcı kararı 2026-10-21): yıl sekmeleri ve yıla göre değişen bölümler tek küme; seçili sekme
        panele bitişik ve aynı zeminde, seçili olmayan sekme açıkça seçilebilir görünür.
      */}
      <div className="opex-yil-kume">
        <div className="opex-year-bar">
          <YearTabs value={d.yil} onChange={onYil} donemler={donemler} />
          <p className="opex-year-bar-text">Aşağıdaki bölümler seçili yılı gösterir.</p>
        </div>
        <div id="yil-paneli" role="tabpanel" aria-labelledby={`yil-${d.yil}`} className="opex-year-panel">
          <YearPanel key={d.yil} m={m} d={d} start={3} />
        </div>
      </div>
      <p className="opex-source">
        Hesaplandı: {stamp(m.hesaplandi)} · Motor sürümü {m.surum} · Özet {data.ozet}
      </p>
    </OzetContext.Provider>
  );
}

function Body() {
  const { conn, live, announce, connect, disconnect, refreshNow } = useOpexLive();
  const [settings, setSettings] = useState(false);
  const [storageNote, setStorageNote] = useState('');
  // Yıl seçimi plan ve kalemlerin altında: veri gelince rapor yılı; seçim veri yenilenince korunur.
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
      {/* Sayfa başlığı kırıntıda: 19 Ekim › Finans › OpEx › Operasyonel Giderler; ilk ekran yoğunluğu için amaç satırı yok
          (kullanıcı kararı 2026-10-21). Araç yeri (kurlar) bu satırda. */}
      <PageHeader title="Operasyonel Giderler" />
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
          <Content data={live.data} yil={seciliYil} donemler={donemler ?? []} onYil={setYil} />
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
