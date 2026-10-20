import { useEffect, useId, useMemo, useRef, useState, type ReactNode, type SubmitEvent } from 'react';
import { Checkbox, TextInput } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import { Chart, DataTable, FactsRow, Hero, Note, Section, type Column } from '../components/ui';
import {
  OPEX_ENDPOINT,
  OPEX_POLL_MS,
  OPEX_TIMEOUT_MS,
  clearConnection,
  defaultConnection,
  isEndpoint,
  loadConnection,
  planOf,
  requestOpex,
  saveConnection,
  type Gider,
  type Kisi,
  type KumeKod,
  type OpexConnection,
  type OpexData,
  type OpexModel,
  type Parametre,
  type PlanAy,
  type Satir,
  type Tesvik,
} from '../data/opex';
import type { OpexTone } from '../lib/chartSpec';
import { tl, tlExact } from '../lib/format';

/* ---------- Biçimler ---------- */

const pct2 = (r: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(r * 100)}`;
const signed = (r: number) => `${r > 0 ? '+' : r < 0 ? '−' : ''}${pct2(Math.abs(r))}`;
const money = (value: number, currency: string) =>
  new Intl.NumberFormat('tr-TR', { style: 'currency', currency, minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
const rate = (value: number) => `${new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 4, maximumFractionDigits: 4 }).format(value)} ₺`;
const clock = (iso: string | null | undefined) =>
  iso ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(new Date(iso)) : '—';
const stamp = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(iso));

const KUME_TONE: Record<KumeKod, OpexTone> = { teknoloji: 'tech', insan: 'people', ofis: 'office' };
const KUME_AD: Record<KumeKod, string> = { teknoloji: 'Teknoloji', insan: 'Personel', ofis: 'Ofis ve işletme' };

/** Sağa hizalı, eşit genişlikli rakam (tablo sayıları). */
const Num = ({ children }: { children: ReactNode }) => <span className="opex-num">{children}</span>;
const Dot = ({ tone }: { tone: OpexTone }) => <span className="opex-dot" data-tone={tone} aria-hidden="true" />;

/* ---------- Canlı bağlantı ---------- */

const OPEX_WAKE_MS = 5_000;

type Live =
  | { status: 'init' }
  | { status: 'setup'; error?: string }
  | { status: 'loading' }
  | { status: 'failed'; error: string }
  | { status: 'ready'; data: OpexData; checked: string; stale?: string };

/**
 * Sayfa görünürken OPEX_POLL_MS aralığıyla Apps Script’e sorar; özet değişmediyse yalnız denetim zamanı güncellenir.
 * Sekme gizliyken sormaz; görünür olunca ve ağ geri gelince hemen sorar. Zamanlanmış iş değildir: sayfa kapanınca durur.
 */
function useOpexLive() {
  const [conn, setConn] = useState<OpexConnection | null>(null);
  const [live, setLive] = useState<Live>({ status: 'init' });
  const [refresh, setRefresh] = useState(0);
  const [announce, setAnnounce] = useState('');
  const digest = useRef('');
  const last = useRef<OpexData | null>(null);

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
    const schedule = () => {
      window.clearTimeout(timer);
      if (!stopped) timer = window.setTimeout(() => void tick(), OPEX_POLL_MS);
    };
    let retry = false;
    let lastStart = 0;
    const tick = async () => {
      // Süren istek iptal edilmez: yanıt birkaç saniye sürer, yeni istek onu hiç bitirtmezdi.
      if (stopped || active) return;
      retry = false;
      if (document.visibilityState === 'hidden') {
        schedule();
        return;
      }
      lastStart = Date.now();
      const own = new AbortController();
      active = own;
      let timedOut = false;
      const timeout = window.setTimeout(() => {
        timedOut = true;
        own.abort();
      }, OPEX_TIMEOUT_MS);
      try {
        const reply = await requestOpex(conn, digest.current, own.signal);
        if (stopped || active !== own) return;
        if (reply.kind === 'data') {
          const changed = !!last.current && last.current.ozet !== reply.data.ozet;
          digest.current = reply.data.ozet;
          last.current = reply.data;
          setLive({ status: 'ready', data: reply.data, checked: reply.data.denetlendi });
          if (changed) {
            const m = reply.data.model;
            setAnnounce(`Veriler güncellendi: ${m.donem.etiket} toplam OPEX ${tl(m.ozet.buAy.toplam)}.`);
          }
        } else if (reply.kind === 'unchanged') {
          const data = last.current;
          if (data) {
            const next = { ...data, degisti: reply.degisti ?? data.degisti, denetlendi: reply.denetlendi };
            last.current = next;
            setLive({ status: 'ready', data: next, checked: reply.denetlendi });
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
        const message = timedOut ? 'Yanıt 30 sn içinde gelmedi.' : 'İstek kesildi.';
        if (last.current) setLive({ status: 'ready', data: last.current, checked: last.current.denetlendi, stale: message });
        else setLive({ status: 'failed', error: message });
      } finally {
        window.clearTimeout(timeout);
        if (active === own) active = null;
        if (retry && !stopped) {
          window.clearTimeout(timer);
          timer = window.setTimeout(() => void tick(), 0);
        } else schedule();
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
    refreshNow: () => setRefresh((n) => n + 1),
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

/* ---------- Canlı durum çubuğu ---------- */

function LiveBar({ live, storageNote, onRefresh, onSettings }: { live: Extract<Live, { status: 'ready' }>; storageNote: string; onRefresh: () => void; onSettings: () => void }) {
  const state = live.stale ? 'stale' : 'live';
  return (
    <div className="opex-live" data-state={state}>
      <p className="opex-live-status">
        <span className="opex-live-dot" aria-hidden="true" />
        <span className="opex-live-label">{live.stale ? 'Bağlantı sorunu' : 'Canlı'}</span>
        <span className="opex-live-meta">
          Erişim: {live.data.model.erisim === 'Herkese açık' ? 'herkese açık' : 'anahtarla'} · Son denetim {clock(live.checked)} · Sheets’te son değişiklik{' '}
          {clock(live.data.degisti)} · {OPEX_POLL_MS / 1000} sn’de bir denetlenir
        </span>
      </p>
      {live.stale ? <p className="opex-live-stale">{live.stale} Son alınan veri gösteriliyor.</p> : null}
      {storageNote ? <p className="opex-live-stale">{storageNote}</p> : null}
      <div className="opex-actions">
        <button type="button" className="opex-btn" onClick={onRefresh}>
          Şimdi yenile
        </button>
        {live.data.tablo ? (
          <a className="opex-btn" href={live.data.tablo} target="_blank" rel="noopener noreferrer">
            Google Sheets’te aç
          </a>
        ) : null}
        <button type="button" className="opex-btn" onClick={onSettings}>
          Bağlantı
        </button>
      </div>
    </div>
  );
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

/* ---------- Bölümler ---------- */

function ShareBar({ ratio, tone }: { ratio: number; tone: OpexTone }) {
  const width = Math.max(0, Math.min(100, ratio * 100));
  return (
    <svg className="opex-share" viewBox="0 0 100 6" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect className="opex-share-track" x="0" y="0" width="100" height="6" />
      <rect className="opex-share-fill" data-tone={tone} x="0" y="0" width={width} height="6" />
    </svg>
  );
}

function Overview({ m }: { m: OpexModel }) {
  const o = m.ozet;
  const total = o.buAy.toplam;
  const tiles: { tone: OpexTone; kume: KumeKod; note: string }[] = [
    { tone: 'tech', kume: 'teknoloji', note: 'Yapay zekâ, sunucu ve bulut, lisans' },
    { tone: 'people', kume: 'insan', note: 'Bordro işveren maliyeti ve freelancer faturaları' },
    { tone: 'office', kume: 'ofis', note: 'Kira, faturalar, ofis ihtiyaçları' },
  ];
  return (
    <div className="opex-kpis">
      <div className="opex-hero" data-edge="top">
        <p className="opex-hero-label">{m.donem.etiket} · toplam OPEX</p>
        <p className="opex-hero-value">{tl(total)}</p>
        <p className="opex-hero-note">
          2026 yıllık {tl(o.yil2026.toplam)} · 2027 aylık ortalama {tl(o.aylikOrt2027.toplam)} ({signed(o.degisim)})
        </p>
      </div>
      <ul className="opex-tiles">
        {tiles.map((t) => (
          <li key={t.kume} className="opex-tile">
            <p className="opex-tile-label">
              <Dot tone={t.tone} />
              {KUME_AD[t.kume]}
            </p>
            <p className="opex-tile-value">{tl(o.buAy[t.kume])}</p>
            <ShareBar ratio={total ? o.buAy[t.kume] / total : 0} tone={t.tone} />
            <p className="opex-tile-note">
              Payı {pct2(total ? o.buAy[t.kume] / total : 0)} · {t.note}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}

type KalemRow =
  | { kind: 'gider'; g: Gider }
  | { kind: 'kisi'; k: Kisi; tl: number; tl2027: number }
  | { kind: 'total'; label: string; tl: number; tl2027: number };
type KalemFiltre = 'tumu' | KumeKod;

const ESAS_NOTU: Record<string, string> = { Net: 'net ücret', Brüt: 'brüt ücret', 'Asgari ücret': 'asgari ücret (net)', 'Fatura (KDV dahil)': 'fatura, KDV dahil' };

/** Bu ayın kalemleri: üç grup (teknoloji, ofis ve işletme, personel); “Tümü” toplamı toplam OPEX’tir. */
function Expenses({ m }: { m: OpexModel }) {
  const [filter, setFilter] = useState<KalemFiltre>('tumu');
  const y = m.donem.yil === 2027 ? 'y2027' : 'y2026';
  const i = m.donem.ay - 1;
  const all: KalemRow[] = [
    ...m.giderler.map((g) => ({ kind: 'gider' as const, g })),
    ...m.kisiler.map((k) => ({ kind: 'kisi' as const, k, tl: k[y].aylar[i].maliyet, tl2027: k.y2027.toplam.maliyet / 12 })),
  ];
  const kumeOf = (r: KalemRow): KumeKod | null => (r.kind === 'gider' ? r.g.kume : r.kind === 'kisi' ? 'insan' : null);
  const items = all.filter((r) => filter === 'tumu' || kumeOf(r) === filter);
  const tlOf = (r: KalemRow) => (r.kind === 'gider' ? r.g.tl : r.tl);
  const tl27Of = (r: KalemRow) => (r.kind === 'gider' ? r.g.tl2027 : r.tl2027);
  const rows: KalemRow[] = [
    ...items,
    { kind: 'total', label: `Toplam · ${items.length} kalem`, tl: items.reduce((t, r) => t + tlOf(r), 0), tl2027: items.reduce((t, r) => t + tl27Of(r), 0) },
  ];
  const ARTIS: Record<Gider['artis'], string> = { Kur: 'kur', Kira: 'kira', Genel: 'genel', Yok: 'artışsız' };
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
            {money(r.k.tutar, 'TRY')}
            <span className="cell-sub">{ESAS_NOTU[r.k.esas] ?? r.k.esas}</span>
          </Num>
        ) : (
          ''
        ),
    },
    {
      key: 'tl',
      header: <Num>₺ karşılığı</Num>,
      nowrap: true,
      render: (r) => (
        <Num>
          {tlExact(tlOf(r))}
          {r.kind === 'kisi' ? <span className="cell-sub">{r.k.tur === 'Freelancer' ? 'fatura' : 'işveren maliyeti'}</span> : null}
        </Num>
      ),
    },
    {
      key: 'tl2027',
      header: <Num>2027 ₺</Num>,
      nowrap: true,
      render: (r) =>
        r.kind === 'gider' ? (
          <Num>
            {tlExact(r.g.tl2027)}
            <span className="cell-sub">{r.g.artisOrani ? `${ARTIS[r.g.artis]} ${signed(r.g.artisOrani)}` : `${ARTIS[r.g.artis]} %0`}</span>
          </Num>
        ) : r.kind === 'kisi' ? (
          <Num>
            {tlExact(r.tl2027)}
            <span className="cell-sub">{r.k.zamOrani ? `aylık ort. · zam ${signed(r.k.zamOrani)}` : 'aylık ort. · zam yok'}</span>
          </Num>
        ) : (
          <Num>{tlExact(r.tl2027)}</Num>
        ),
    },
    {
      key: 'durum',
      header: 'Bu ay',
      nowrap: true,
      render: (r) =>
        r.kind === 'gider' ? (
          <span className="opex-state" data-state={r.g.eksik ? 'missing' : r.g.odendi ? 'paid' : 'due'}>
            {r.g.eksik ? 'Tutar girilmedi' : r.g.odendi ? 'Ödendi' : 'Bekliyor'}
          </span>
        ) : r.kind === 'kisi' ? (
          <span className="opex-state">{r.k.tur === 'Freelancer' ? 'Fatura' : 'Bordro'}</span>
        ) : (
          ''
        ),
    },
  ];
  const count = (k: KumeKod) => all.filter((r) => kumeOf(r) === k).length;
  return (
    <>
      <FactsRow
        items={[
          { label: 'Bu ay ödenen (teknoloji, ofis)', value: `${tl(m.ozet.odeme.odenen)} · ${m.ozet.odeme.adetOdenen} kalem` },
          { label: 'Bu ay bekleyen (teknoloji, ofis)', value: `${tl(m.ozet.odeme.bekleyen)} · ${m.ozet.odeme.adetBekleyen} kalem` },
          { label: 'USD/TRY', value: `${rate(m.kur.USD.deger)} (${m.kur.USD.kaynak})` },
          { label: 'EUR/TRY', value: `${rate(m.kur.EUR.deger)} (${m.kur.EUR.kaynak})` },
        ]}
      />
      <Toggles
        label="Grup süzgeci"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'tumu', label: `Tümü (${all.length})` },
          { value: 'teknoloji', label: `Teknoloji (${count('teknoloji')})` },
          { value: 'ofis', label: `Ofis ve işletme (${count('ofis')})` },
          { value: 'insan', label: `Personel (${count('insan')})` },
        ]}
      />
      <DataTable
        id="kalemler"
        title={`${m.donem.etiket} kalemleri`}
        note="Döviz kalemleri Parametreler’deki kurla ₺’ye çevrilir. Personel satırlarında ₺ karşılığı bu ayın işveren maliyetidir (freelancer: fatura); bordro ayrıntısı aşağıda."
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
      />
    </>
  );
}

type PlanRow = { kind: 'ay'; a: PlanAy; onceki: PlanAy | null } | { kind: 'total'; a: PlanAy };

/** 12 aylık plan: rapor ayından itibaren her ayın gideri ayrı (bordro ayları kümülatif vergiyle farklıdır). */
function Plan({ m }: { m: OpexModel }) {
  const plan = planOf(m);
  if (!plan.aylar.length) return <p className="opex-empty">Plan için ay yok.</p>;
  const ilk = plan.aylar[0];
  const son = plan.aylar[plan.aylar.length - 1];
  const enYuksek = plan.aylar.reduce((a, b) => (b.toplam > a.toplam ? b : a));
  const yilBasi = plan.aylar.findIndex((a) => a.yil === 2027 && a.ay === 1);
  const gecis = yilBasi > 0 ? plan.aylar[yilBasi].toplam / plan.aylar[yilBasi - 1].toplam - 1 : null;
  const rows: PlanRow[] = [
    ...plan.aylar.map((a, i) => ({ kind: 'ay' as const, a, onceki: i ? plan.aylar[i - 1] : null })),
    { kind: 'total', a: { ...plan.toplam, yil: 0, ay: 0, ad: `${plan.aylar.length} ay toplamı`, kisa: '' } },
  ];
  const tutar = (label: string, f: 'teknoloji' | 'ofis' | 'insan' | 'toplam'): Column<PlanRow> => ({
    key: f,
    header: <Num>{label}</Num>,
    nowrap: true,
    render: (r) => <Num>{tl(r.a[f])}</Num>,
  });
  const columns: Column<PlanRow>[] = [
    { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (r) => r.a.ad },
    tutar('Teknoloji', 'teknoloji'),
    tutar('Ofis ve işletme', 'ofis'),
    tutar('Personel', 'insan'),
    tutar('Toplam', 'toplam'),
    {
      key: 'degisim',
      header: <Num>Önceki aya göre</Num>,
      nowrap: true,
      render: (r) => <Num>{r.kind === 'ay' && r.onceki ? signed(r.a.toplam / r.onceki.toplam - 1) : '—'}</Num>,
    },
  ];
  return (
    <>
      <FactsRow
        items={[
          { label: `${plan.aylar.length} ay toplamı (${ilk.ad} – ${son.ad})`, value: tl(plan.toplam.toplam) },
          { label: 'Aylık ortalama', value: tl(plan.toplam.toplam / plan.aylar.length) },
          { label: 'En yüksek ay', value: `${enYuksek.ad} · ${tl(enYuksek.toplam)}` },
          ...(gecis !== null ? [{ label: 'Aralık 2026 → Ocak 2027', value: signed(gecis) }] : []),
        ]}
      />
      <Chart
        id="plan-12"
        title="12 aylık plan"
        note={`${ilk.ad} – ${son.ad}, gruplara göre aylık gider`}
        size="lg"
        summary={plan.aylar.map((a) => `${a.ad} ${tl(a.toplam)}`).join('; ')}
        spec={{
          kind: 'opex-stack',
          categories: plan.aylar.map((a) => a.kisa),
          series: [
            { name: 'Teknoloji', tone: 'tech', values: plan.aylar.map((a) => a.teknoloji) },
            { name: 'Ofis ve işletme', tone: 'office', values: plan.aylar.map((a) => a.ofis) },
            { name: 'Personel', tone: 'people', values: plan.aylar.map((a) => a.insan) },
          ],
        }}
      />
      <DataTable
        id="plan"
        title={`Aylık gider planı · ${ilk.ad} – ${son.ad}`}
        note="Her ay ayrı hesaplanır: bordroda gelir vergisi kümülatif matrahla ay ay değişir; 2027 aylarında zam, kira ve genel artış uygulanır."
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
      />
    </>
  );
}

type KisiRow = { kind: 'kisi'; k: Kisi; s: Satir } | { kind: 'total'; s: Satir; yil: number };

function People({ m }: { m: OpexModel }) {
  const y = m.donem.yil === 2027 ? 'y2027' : 'y2026';
  const i = m.donem.ay - 1;
  const sum = (rows: Satir[], f: keyof Satir) => rows.reduce((t, r) => t + r[f], 0);
  const current = m.kisiler.map((k) => k[y].aylar[i]);
  const total = { ...current[0], brut: sum(current, 'brut'), maliyet: sum(current, 'maliyet'), net: sum(current, 'net'), gv: sum(current, 'gv'), dv: sum(current, 'dv'), sgkIsci: sum(current, 'sgkIsci'), issizlikIsci: sum(current, 'issizlikIsci'), sgkIsveren: sum(current, 'sgkIsveren'), issizlikIsveren: sum(current, 'issizlikIsveren'), tesvik: sum(current, 'tesvik') } as Satir;
  const rows: KisiRow[] = [...m.kisiler.map((k) => ({ kind: 'kisi' as const, k, s: k[y].aylar[i] })), { kind: 'total', s: total, yil: m.kisiler.reduce((t, k) => t + k.y2026.toplam.maliyet, 0) }];
  const bordrolu = (r: KisiRow) => r.kind === 'kisi' && r.k.tur === 'Bordrolu';
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
    { key: 'tutar', header: <Num>Aylık tutar</Num>, nowrap: true, render: (r) => (r.kind === 'kisi' ? <Num>{tlExact(r.k.tutar)}</Num> : '') },
    { key: 'brut', header: <Num>Bu ay brüt</Num>, nowrap: true, render: (r) => <Num>{bordrolu(r) || r.kind === 'total' ? tlExact(r.s.brut) : '—'}</Num> },
    {
      key: 'kesinti',
      header: <Num>Kesintiler (işçi)</Num>,
      nowrap: true,
      render: (r) => <Num>{bordrolu(r) || r.kind === 'total' ? tlExact(r.s.gv + r.s.dv + r.s.sgkIsci + r.s.issizlikIsci) : '—'}</Num>,
    },
    {
      key: 'isveren',
      header: <Num>İşveren payı</Num>,
      nowrap: true,
      render: (r) =>
        bordrolu(r) || r.kind === 'total' ? (
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
      header: <Num>Bu ay maliyet</Num>,
      nowrap: true,
      render: (r) => (
        <Num>
          {tlExact(r.s.maliyet)}
          {r.kind === 'kisi' && r.k.tur === 'Freelancer' ? <span className="cell-sub">fatura KDV’si {tlExact(r.s.kdv)}</span> : null}
        </Num>
      ),
    },
    { key: 'yil', header: <Num>2026 yıllık</Num>, nowrap: true, render: (r) => <Num>{tl(r.kind === 'kisi' ? r.k.y2026.toplam.maliyet : r.yil)}</Num> },
  ];
  const free = m.kisiler.filter((k) => k.tur === 'Freelancer');
  const freeMonth = free.map((k) => k[y].aylar[i]);
  const b = m.bordroKopru;
  const staff = m.kisiler.filter((k) => k.tur === 'Bordrolu');
  return (
    <>
      <FactsRow
        items={[
          { label: 'Bordrolu işveren maliyeti', value: `${tl(b.maliyet)} · ${staff.length} kişi` },
          { label: 'Freelancer faturaları (KDV dahil)', value: `${tl(sum(freeMonth, 'fatura'))} · ${free.length} kişi` },
          { label: 'Freelancer KDV hariç / KDV', value: `${tl(sum(freeMonth, 'kdvHaric'))} / ${tl(sum(freeMonth, 'kdv'))}` },
          { label: 'Teşvik ve destekler', value: tl(b.tesvik) },
        ]}
      />
      <DataTable
        id="ucretler"
        title={`Personel giderleri · ${m.donem.etiket}`}
        note="Bordrolu: aylık kümülatif gelir vergisiyle netten brüte; işveren payı SGK + işsizlik − teşvik. Freelancer: fatura (KDV dahil)."
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
      />
      <div className="opex-grid">
        <Chart
          id="bordro-bilesen"
          title="Bordro bileşenleri"
          note={`${m.donem.etiket}, kişi başına; brüt = net + vergiler + SGK (işçi)`}
          size="lg"
          summary={`Bordrolu ${staff.length} kişinin ${m.donem.etiket} bileşenleri: net ${tl(b.net)}, gelir ve damga vergisi ${tl(b.gv + b.dv)}, SGK ve işsizlik işçi payı ${tl(b.sgkIsci + b.issizlikIsci)}, işveren payı (teşvik sonrası) ${tl(b.sgkIsveren + b.issizlikIsveren - b.tesvik)}.`}
          spec={{
            kind: 'opex-stack-h',
            categories: staff.map((k) => k.ad),
            series: [
              { name: 'Net ücret', tone: 'net', values: staff.map((k) => k[y].aylar[i].net) },
              { name: 'Gelir ve damga vergisi', tone: 'tax', values: staff.map((k) => k[y].aylar[i].gv + k[y].aylar[i].dv) },
              { name: 'SGK ve işsizlik (işçi)', tone: 'sgk', values: staff.map((k) => k[y].aylar[i].sgkIsci + k[y].aylar[i].issizlikIsci) },
              { name: 'İşveren payı (teşvik sonrası)', tone: 'employer', values: staff.map((k) => k[y].aylar[i].sgkIsveren + k[y].aylar[i].issizlikIsveren - k[y].aylar[i].tesvik) },
            ],
          }}
        />
        <Chart
          id="bordro-kopru"
          title="Netten işveren maliyetine"
          note={`${m.donem.etiket}, bordrolu toplam`}
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

function Payroll({ m }: { m: OpexModel }) {
  const staff = m.kisiler.filter((k) => k.tur === 'Bordrolu');
  const [who, setWho] = useState(String(staff[0]?.satir ?? ''));
  const [year, setYear] = useState<'y2026' | 'y2027'>('y2026');
  const person = staff.find((k) => String(k.satir) === who) ?? staff[0];
  if (!person) return <p className="opex-empty">Bordrolu kişi yok.</p>;
  const yil = person[year];
  const months = m.aylik.map((a) => a.kisa);
  const rows: AyRow[] = [...yil.aylar.map((s, i) => ({ kind: 'ay' as const, s, ad: m.aylik[i].ad })), { kind: 'total', s: yil.toplam }];
  const c = (label: string, f: (s: Satir) => number, opts: Partial<Column<AyRow>> = {}): Column<AyRow> => ({
    key: label,
    header: <Num>{label}</Num>,
    nowrap: true,
    render: (r) => <Num>{tlExact(f(r.s))}</Num>,
    ...opts,
  });
  const columns: Column<AyRow>[] = [
    { key: 'ay', header: 'Ay', rowHeader: true, nowrap: true, render: (r) => (r.kind === 'ay' ? r.ad : 'Yıl toplamı') },
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
  const first = yil.aylar[0];
  const lastMonth = yil.aylar[11];
  const label = year === 'y2027' ? '2027' : '2026';
  return (
    <>
      <div className="opex-controls">
        <Toggles label="Kişi" value={String(person.satir)} onChange={setWho} options={staff.map((k) => ({ value: String(k.satir), label: k.ad }))} />
        <Toggles
          label="Yıl"
          value={year}
          onChange={setYear}
          options={[
            { value: 'y2026', label: '2026' },
            { value: 'y2027', label: '2027 (zamlı)' },
          ]}
        />
      </div>
      <FactsRow
        items={[
          { label: 'Ücret esası', value: `${person.esas} · ${tlExact(year === 'y2027' ? person.tutar2027 : person.tutar)}` },
          { label: 'Ocak → Aralık brüt', value: `${tl(first.brut)} → ${tl(lastMonth.brut)}` },
          { label: `${label} yıllık işveren maliyeti`, value: tl(yil.toplam.maliyet) },
          { label: 'Aylık ortalama maliyet', value: tl(yil.toplam.maliyet / 12) },
        ]}
      />
      <Chart
        id="bordro-aylik"
        title={`${person.ad}: aylık bordro ${label}`}
        note="Kümülatif gelir vergisi dilimi geçtikçe aynı net için brüt artar"
        size="lg"
        summary={`${person.ad}, ${label}: brüt Ocak ${tl(first.brut)}, Aralık ${tl(lastMonth.brut)}; yıllık işveren maliyeti ${tl(yil.toplam.maliyet)}.`}
        spec={{
          kind: 'opex-stack',
          categories: months,
          series: [
            { name: 'Net ücret', tone: 'net', values: yil.aylar.map((s) => s.net) },
            { name: 'Gelir ve damga vergisi', tone: 'tax', values: yil.aylar.map((s) => s.gv + s.dv) },
            { name: 'SGK ve işsizlik (işçi)', tone: 'sgk', values: yil.aylar.map((s) => s.sgkIsci + s.issizlikIsci) },
            { name: 'İşveren payı (teşvik sonrası)', tone: 'employer', values: yil.aylar.map((s) => s.sgkIsveren + s.issizlikIsveren - s.tesvik) },
          ],
        }}
      />
      <DataTable
        id="bordro-ay"
        title={`${person.ad} · ${label} aylık bordro`}
        note={`SGK tavanı ${tl(m.asgari[year].tavan)}; asgari ücret ${tlExact(m.asgari[year].brut)} brüt / ${tlExact(m.asgari[year].net)} net. Asgari ücrete isabet eden gelir ve damga vergisi istisna edilir.`}
        columns={columns}
        rows={rows}
        rowTone={(r) => (r.kind === 'total' ? 'total' : undefined)}
      />
    </>
  );
}

type KumeRow = { k: KumeKod | 'toplam'; label: string };

function Projection({ m }: { m: OpexModel }) {
  const o = m.ozet;
  const y = m.donem.yil === 2027 ? 'y2027' : 'y2026';
  const i = m.donem.ay - 1;
  const kumeRows: KumeRow[] = [
    { k: 'teknoloji', label: 'Teknoloji' },
    { k: 'insan', label: 'Personel' },
    { k: 'ofis', label: 'Ofis ve işletme' },
    { k: 'toplam', label: 'Toplam OPEX' },
  ];
  const ch = (k: KumeKod | 'toplam') => (o.aylikOrt2026[k] ? o.aylikOrt2027[k] / o.aylikOrt2026[k] - 1 : 0);
  const columns: Column<KumeRow>[] = [
    {
      key: 'kume',
      header: 'Küme',
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
    { key: 'bu', header: <Num>{m.donem.etiket}</Num>, nowrap: true, render: (r) => <Num>{tl(o.buAy[r.k])}</Num> },
    { key: 'o26', header: <Num>2026 aylık ort.</Num>, nowrap: true, render: (r) => <Num>{tl(o.aylikOrt2026[r.k])}</Num> },
    { key: 'o27', header: <Num>2027 aylık ort.</Num>, nowrap: true, render: (r) => <Num>{tl(o.aylikOrt2027[r.k])}</Num> },
    { key: 'd', header: <Num>Değişim</Num>, nowrap: true, render: (r) => <Num>{signed(ch(r.k))}</Num> },
    { key: 'y27', header: <Num>2027 yıllık</Num>, nowrap: true, render: (r) => <Num>{tl(o.yil2027[r.k])}</Num> },
  ];
  const e = m.enflasyon;
  const exempt = m.kisiler.filter((k) => !k.zam && k.esas !== 'Asgari ücret').map((k) => k.ad);
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
          id="aylik-opex"
          title="Aylık OPEX: 2026 ve 2027"
          note="Çubuk: 2026 kümeleri; işaret: 2027 aylık toplam"
          size="lg"
          summary={`2026 aylık ortalama ${tl(o.aylikOrt2026.toplam)}, 2027 aylık ortalama ${tl(o.aylikOrt2027.toplam)} (${signed(o.degisim)}). 2026 yıllık ${tl(o.yil2026.toplam)}, 2027 yıllık ${tl(o.yil2027.toplam)}.`}
          spec={{
            kind: 'opex-stack',
            categories: m.aylik.map((a) => a.kisa),
            series: [
              { name: 'Teknoloji 2026', tone: 'tech', values: m.aylik.map((a) => a.y2026.teknoloji) },
              { name: 'Personel 2026', tone: 'people', values: m.aylik.map((a) => a.y2026.insan) },
              { name: 'Ofis ve işletme 2026', tone: 'office', values: m.aylik.map((a) => a.y2026.ofis) },
            ],
            line: { name: 'Toplam 2027', values: m.aylik.map((a) => a.y2027.toplam) },
          }}
        />
      <Chart
        id="kisi-2027"
        title="Kişi maliyeti: bu ay ve 2027"
        note={`${m.donem.etiket} ve 2027 aylık ortalaması`}
        size="xl"
        summary={m.kisiler.map((k) => `${k.ad}: ${tl(k[y].aylar[i].maliyet)} → ${tl(k.y2027.toplam.maliyet / 12)}`).join('; ')}
        spec={{
          kind: 'opex-group',
          categories: m.kisiler.map((k) => k.ad),
          series: [
            { name: m.donem.etiket, tone: 'y2026', values: m.kisiler.map((k) => k[y].aylar[i].maliyet) },
            { name: '2027 aylık ortalama', tone: 'y2027', values: m.kisiler.map((k) => k.y2027.toplam.maliyet / 12) },
          ],
        }}
      />
      <DataTable id="projeksiyon" title="Kümeler: 2026 ve 2027" columns={columns} rows={kumeRows} rowTone={(r) => (r.k === 'toplam' ? 'total' : undefined)} />
    </>
  );
}

function Incentives({ m }: { m: OpexModel }) {
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
    { key: 'tur', header: 'Tür ve değer', minWidth: '12rem', render: (t) => `${t.tur}: ${value(t, t.deger2026)}${t.deger2027 !== t.deger2026 ? ` (2027: ${value(t, t.deger2027)})` : ''}` },
    { key: 'kim', header: 'Uygulanan', minWidth: '12rem', render: (t) => (t.uygulananlar.length ? t.uygulananlar.join(', ') : '—') },
    { key: 'bu', header: <Num>Bu ay</Num>, nowrap: true, render: (t) => <Num>{tlExact(t.buAy)}</Num> },
    { key: 'yil', header: <Num>2026 yıllık</Num>, nowrap: true, render: (t) => <Num>{tl(t.yil2026)}</Num> },
    { key: 'kosul', header: 'Koşul ve dayanak', minWidth: '22rem', render: (t) => t.kosul },
  ];
  return (
    <DataTable
      id="tesvikler"
      title="SGK teşvik ve destekleri"
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

function Content({ data }: { data: OpexData }) {
  const m = data.model;
  const total = m.ozet.buAy.toplam;
  const kategoriTone = (k: KumeKod) => KUME_TONE[k];
  const exempt = m.kisiler.filter((k) => !k.zam && k.esas !== 'Asgari ücret').map((k) => k.ad);
  const tech = useMemo(() => {
    const map = new Map<string, number>();
    for (const g of m.giderler.filter((x) => x.kume === 'teknoloji')) map.set(g.kalem, (map.get(g.kalem) ?? 0) + g.tl);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [m]);
  return (
    <>
      {m.uyarilar.length ? (
        <Note title={`Sheets uyarıları (${m.uyarilar.length})`}>
          <ul className="opex-warnings">
            {m.uyarilar.map((u, i) => (
              <li key={i}>{u}</li>
            ))}
          </ul>
        </Note>
      ) : null}
      <Section id="bu-ay" index={1} title={`${m.donem.etiket} özeti`} desc="OPEX üç gruptan oluşur: teknoloji, ofis ve işletme, personel.">
        <Overview m={m} />
        <div className="opex-grid">
          <Chart
            id="kumeler"
            title="Kümeler"
            note={`${m.donem.etiket}, ₺ ve pay`}
            size="sm"
            summary={(['teknoloji', 'insan', 'ofis'] as KumeKod[]).map((k) => `${KUME_AD[k]} ${tl(m.ozet.buAy[k])} (${pct2(total ? m.ozet.buAy[k] / total : 0)})`).join('; ')}
            spec={{ kind: 'opex-bar', share: total, items: (['insan', 'ofis', 'teknoloji'] as KumeKod[]).map((k) => ({ name: KUME_AD[k], value: m.ozet.buAy[k], tone: KUME_TONE[k] })).sort((a, b) => b.value - a.value) }}
          />
          <Chart
            id="kategoriler"
            title="Kategoriler"
            note={`${m.donem.etiket}; renk kümeyi gösterir`}
            size="lg"
            summary={m.kategoriler.map((k) => `${k.kategori} ${tl(k.buAy)}`).join('; ')}
            spec={{ kind: 'opex-bar', share: total, items: m.kategoriler.map((k) => ({ name: k.kategori, value: k.buAy, tone: kategoriTone(k.kume) })) }}
          />
        </div>
      </Section>
      <Section
        id="kalemler"
        index={2}
        title="Bu ayın kalemleri"
        desc="Üç grup: teknoloji (yapay zekâ, sunucu, lisans), ofis ve işletme (kira, faturalar, ofis ihtiyaçları), personel (bordro ve freelancer). Ödeme durumu Sheets’teki “Bu ay ödendi” sütunundan gelir."
      >
        <Expenses m={m} />
        <Chart
          id="teknoloji"
          title="Teknoloji sağlayıcıları"
          note={`${m.donem.etiket}, hesaplar toplanmış`}
          size="md"
          summary={tech.map(([n, v]) => `${n} ${tl(v)}`).join('; ')}
          spec={{ kind: 'opex-bar', items: tech.map(([name, value]) => ({ name, value, tone: 'tech' as const })) }}
        />
      </Section>
      <Section id="plan" index={3} title="12 aylık gider planı" desc="Rapor ayından itibaren on iki ay: her ayın teknoloji, ofis ve işletme ve personel gideri ayrı hesaplanır.">
        <Plan m={m} />
      </Section>
      <Section id="ucretler" index={4} title="Personel giderleri" desc="Bordrolu personel netten brüte ve işveren maliyetine; freelancerlar KDV dahil faturayla.">
        <People m={m} />
      </Section>
      <Section id="bordro" index={5} title="Netten brüte: aylık bordro" desc="Gelir vergisi yıl içinde kümülatif matrahla hesaplanır; asgari ücret istisnası ve SGK tavanı uygulanır.">
        <Payroll m={m} />
      </Section>
      <Section
        id="projeksiyon"
        index={6}
        title="2027 düzenli giderleri"
        desc={`Ücret zammı enflasyon parametresine bağlıdır${exempt.length ? ` ve ${exempt.join(', ')} dışındaki herkese uygulanır` : ' ve herkese uygulanır'}; kira, fatura ve döviz kalemleri kendi artış esasıyla.`}
      >
        <Projection m={m} />
      </Section>
      <Section id="tesvikler" index={7} title="SGK teşvik ve destekleri">
        <Incentives m={m} />
      </Section>
      <Section id="parametreler" index={8} title="Parametreler">
        <Params m={m} />
        <p className="opex-source">
          Hesaplandı: {stamp(m.hesaplandi)} · Motor sürümü {m.surum} · Özet {data.ozet}
        </p>
      </Section>
    </>
  );
}

function Body() {
  const { conn, live, announce, connect, disconnect, refreshNow } = useOpexLive();
  const [settings, setSettings] = useState(false);
  const [storageNote, setStorageNote] = useState('');
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
        lead="Üç grup: teknoloji, ofis ve işletme, personel. Veriler Google Sheets’ten canlı gelir; Sheets değişince bu sayfa kendiliğinden güncellenir."
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
          <LiveBar live={live} storageNote={storageNote} onRefresh={refreshNow} onSettings={() => setSettings((v) => !v)} />
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
          <Content data={live.data} />
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
