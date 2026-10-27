import 'dayjs/locale/tr';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Accordion, NumberInput, TextInput } from '@mantine/core';
import { DateInput, DatesProvider } from '@mantine/dates';
import { AppFrame } from '../components/AppFrame';
import { useModel, useParams } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { DataTable, Section } from '../components/ui';
import { DEFAULT_PARAMS, PARAM_GROUPS, type ParamDef, type ParamKey, type Params } from '../data/params';
import { longDate } from '../lib/dates';
import { int, num, pct, times, tl, tlExact } from '../lib/format';
import { useMotionMs } from '../lib/motion';

/**
 * Parametreler (ux.md §3 “parametre grupları aynı anda çok fazla düzenleme alanı sunuyor”, §9, M13 ParameterGroup, M23
 * ReviewAndReset, UX-14/15; kullanıcı kararı 2026-10-27, paket P6.3). Sıra (§5.4): amaç ve kapsam (başlık) → kayıt
 * durumu ve değişiklik özeti (sonuç) → sıfırlama (eylem) → arama ve görev grupları (girdi) → türetilen değerler (veri).
 * Gruplar `PARAM_GROUPS`’tan (veri değişmez) açılır gruplardır: hepsi kapalı gelir, değiştirilmiş alanı olan gruplar
 * açılışta açılır; arama etiket, yardım, birim ve grup adında arar, eşleşen gruplar açılır, eşleşmeyenler gizlenir.
 * “Kaydedildi” yalnız gerçekten yapılan tarayıcı kaydını adlandırır; depolama kapalıysa “kaydedilemedi” ve oturum içi
 * geçerlilik yazılır. Sıfırlama iki adımlıdır, kapsamı onaydan önce yazar ve geri alınabilir.
 */

const format = (def: ParamDef, value: Params[keyof Params]) => {
  if (def.kind === 'date') return longDate(value as string);
  const n = value as number;
  if (def.kind === 'money') return Number.isInteger(n) ? tl(n) : tlExact(n);
  if (def.kind === 'multiplier') return times(n);
  if (def.kind === 'percent') return `%${num(n)}`;
  return `${num(n)}${def.unit ? ` ${def.unit}` : ''}`;
};

const kucult = (s: string) => s.toLocaleLowerCase('tr-TR');
const alanKimligi = (key: ParamKey) => `param-${key}`;
const ALAN_SAYISI = PARAM_GROUPS.reduce((t, g) => t + g.fields.length, 0);

function Field({ def }: { def: ParamDef }) {
  const { params, setParam } = useParams();
  const value = params[def.key];
  const fallback = DEFAULT_PARAMS[def.key];
  const changed = value !== fallback;
  const description = `${changed ? 'Değiştirildi · ' : ''}Varsayılan: ${format(def, fallback)}${def.help ? ` · ${def.help}` : ''}`;
  const common = {
    id: alanKimligi(def.key),
    className: 'param-field',
    classNames: { label: 'param-label', input: 'param-input', description: 'param-help' },
    label: def.label,
    description,
    size: 'md' as const,
    'data-changed': changed ? '' : undefined,
  };

  if (def.kind === 'date') {
    return (
      <DateInput
        {...common}
        value={value as string}
        valueFormat="D MMMM YYYY"
        onChange={(next) => {
          if (typeof next === 'string' && next) setParam(def.key, next as never);
        }}
      />
    );
  }

  const decimals = def.kind === 'money' ? 2 : def.kind === 'multiplier' || def.kind === 'rate' || def.kind === 'number' ? 2 : 0;
  return (
    <NumberInput
      {...common}
      value={value as number}
      hideControls
      allowNegative={false}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={decimals}
      min={def.min}
      max={def.max}
      step={def.step}
      clampBehavior="strict"
      suffix={def.unit ? ` ${def.unit}` : undefined}
      onChange={(next) => {
        if (typeof next === 'number' && Number.isFinite(next)) setParam(def.key, next as never);
      }}
    />
  );
}

/**
 * Varsayılana dönüş (UX-14): ilk basış onay ister ve kapsamı yazar (kaç alan, yalnız bu tarayıcı, neler değişmez), 4 sn
 * içinde ikinci basış uygular; ardından “Geri al” önceki değerleri geri getirir (bir sonraki değişikliğe kadar).
 */
function Sifirla() {
  const { params, reset, restore, changed } = useParams();
  const [confirming, setConfirming] = useState(false);
  const [onceki, setOnceki] = useState<Params | null>(null);
  useEffect(() => {
    if (!confirming) return undefined;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);
  useEffect(() => {
    if (changed) setOnceki(null);
  }, [changed]);
  return (
    <div className="param-sifirla">
      <button
        type="button"
        className="param-reset"
        disabled={!changed}
        onClick={() => {
          if (confirming) {
            setOnceki(params);
            reset();
            setConfirming(false);
          } else setConfirming(true);
        }}
      >
        {confirming ? 'Emin misiniz? Tekrar basın' : 'Varsayılanlara dön'}
      </button>
      {onceki ? (
        <button
          type="button"
          className="param-reset param-geri"
          onClick={() => {
            restore(onceki);
            setOnceki(null);
          }}
        >
          Geri al
        </button>
      ) : null}
      {confirming ? (
        <p className="param-reset-kapsam" role="status">
          Kapsam: {changed} alan yalnız bu tarayıcıdaki varsayılana döner; gelir planı senaryo seçenekleri, notlar ve tema değişmez. Uyguladıktan sonra “Geri al” ile önceki değerlere
          dönebilirsiniz.
        </p>
      ) : null}
    </div>
  );
}

/** Kayıt durumu (UX-15): nereye, ne zaman; “kaydedildi” yalnız gerçekten yapılan tarayıcı kaydı için. */
function SaveStatus() {
  const { changed, saved } = useParams();
  const saat = saved ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(saved) : null;
  const fark = `${changed} değer varsayılandan farklı`;
  const metin =
    saved === false
      ? `${changed ? `${fark}. ` : ''}Bu tarayıcıda kaydedilemedi (depolama kapalı): değişiklikler yalnız bu sekme açıkken geçerli.`
      : !changed
        ? 'Tüm değerler varsayılan.'
        : saat
          ? `${fark}; bu tarayıcıda kaydedildi ${saat} (yerel depolama). Başka tarayıcı ve yayındaki site varsayılanları gösterir.`
          : `${fark}; bu tarayıcıda kayıtlı (önceki oturumdan, yerel depolama). Başka tarayıcı ve yayındaki site varsayılanları gösterir.`;
  return (
    <p className="param-status" role="status">
      {metin}
    </p>
  );
}

/** Değişiklik özeti (M23): alan, grubu, varsayılan → yeni; alana git; tek alanı geri al. */
function Degisiklikler({ hedefle }: { hedefle: (key: ParamKey) => void }) {
  const { params, setParam, changed } = useParams();
  if (!changed) return null;
  const satirlar = PARAM_GROUPS.flatMap((g) => g.fields.filter((d) => params[d.key] !== DEFAULT_PARAMS[d.key]).map((d) => ({ g, d })));
  return (
    <section className="param-degisiklikler" aria-labelledby="degisiklikler-baslik">
      <h2 className="param-degisiklik-baslik" id="degisiklikler-baslik">
        Değişiklikler ({changed})
      </h2>
      <ul>
        {satirlar.map(({ g, d }) => (
          <li key={d.key}>
            <span className="param-degisiklik-ad">
              {d.label} <span className="param-degisiklik-grup">· {g.title}</span>
            </span>
            <span className="param-degisiklik-deger">
              {format(d, DEFAULT_PARAMS[d.key])} → <strong>{format(d, params[d.key])}</strong>
            </span>
            <span className="param-degisiklik-eylem">
              <button type="button" className="param-link-dugme" onClick={() => hedefle(d.key)}>
                Alana git<span className="visually-hidden">: {d.label}</span>
              </button>
              <button type="button" className="param-link-dugme" onClick={() => setParam(d.key, DEFAULT_PARAMS[d.key] as never)}>
                Bu alanı geri al<span className="visually-hidden">: {d.label}</span>
              </button>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Derived() {
  const m = useModel();
  const p = m.params;
  const rows = [
    { label: 'Saha kotası (prim eşiği)', value: `${tl(m.quota)} satış / ay` },
    { label: 'Saha satış maaşı → işveren maliyeti', value: `${tl(m.salaries.saha)} → ${tl(m.salaries.saha * p.costFactor)}` },
    { label: 'Ekip lideri maaşı → işveren maliyeti', value: `${tl(m.salaries.lead)} → ${tl(m.salaries.lead * p.costFactor)}` },
    { label: 'Masa başı (CRM) maaşı → işveren maliyeti', value: `${tl(m.salaries.masa)} → ${tl(m.salaries.masa * p.costFactor)}` },
    { label: 'Segika (CRM) maaşı → işveren maliyeti', value: `${tl(m.salaries.segika)} → ${tl(m.salaries.segika * p.costFactor)}` },
    { label: 'Dijital pazarlama maaşı → işveren maliyeti', value: `${tl(m.salaries.dijital)} → ${tl(m.salaries.dijital * p.costFactor)}` },
    { label: 'Asistan maaşı → işveren maliyeti', value: `${tl(m.salaries.asistan)} → ${tl(m.salaries.asistan * p.costFactor)}` },
    { label: 'Organizatör maaşı → işveren maliyeti', value: `${tl(m.salaries.organizator)} → ${tl(m.salaries.organizator * p.costFactor)}` },
    { label: '90 günlük personel maliyeti (işveren)', value: tl(m.staffCost90) },
    { label: 'Bir satışta en çok prim', value: tl(m.maxPayout) },
    { label: 'Abonelik (aylık / yıllık peşin)', value: `${tl(m.SUBSCRIPTION_TRY)} / ${tl(m.ANNUAL_TRY)}` },
    { label: 'Hedef için gereken satıcı-ay', value: int(Math.ceil(m.CIRO_TARGET / m.SUBSCRIPTION_TRY)) },
    { label: 'Gereken aylık elde tutma', value: m.retentionThreshold === null ? 'Abonelik tek başına yetmez' : `≥ ${pct(m.retentionThreshold)}` },
    { label: 'Meta reklam bütçesi (aylık)', value: tl((p.metaWeekly * 52) / 12) },
    { label: '60. ve 90. gün kontrolleri', value: `${longDate(m.dates.day60)} · ${longDate(m.dates.day90)}` },
    { label: 'Dönem 2 mesai düzeni', value: `${longDate(m.dates.period2Start)} itibarıyla` },
  ];
  return (
    <DataTable
      id="turetilen"
      title="Türetilen değerler"
      note="Parametrelerden hesaplanır; tüm sayfalar bu değerleri kullanır."
      columns={[
        { key: 'label', header: 'Değer', minWidth: '16rem', rowHeader: true, render: (r: (typeof rows)[number]) => r.label },
        { key: 'value', header: 'Sonuç', minWidth: '12rem', render: (r) => r.value },
      ]}
      rows={rows}
    />
  );
}

/** Görev grupları (M13): açılır gruplar, arama ve açık grup durumu. */
function Gruplar({ acik, setAcik, sorgu, setSorgu }: { acik: string[]; setAcik: (v: string[]) => void; sorgu: string; setSorgu: (v: string) => void }) {
  const { params } = useParams();
  const sure = useMotionMs('--motion-duration-base');
  const q = kucult(sorgu.trim());
  const eslesme = useMemo(
    () =>
      PARAM_GROUPS.map((g) => ({
        g,
        fields: q ? g.fields.filter((d) => kucult(`${d.label} ${d.help ?? ''} ${d.unit ?? ''} ${g.title}`).includes(q)) : g.fields,
      })),
    [q],
  );
  const toplam = eslesme.reduce((t, x) => t + x.fields.length, 0);
  const grupSayisi = eslesme.filter((x) => x.fields.length).length;
  const acikEtkin = q ? eslesme.filter((x) => x.fields.length).map((x) => x.g.id) : acik;
  return (
    <>
      <div className="param-ara" role="search">
        <TextInput
          type="search"
          label="Parametre ara"
          placeholder="ör. maaş, başlangıç, reklam"
          value={sorgu}
          onChange={(e) => setSorgu(e.currentTarget.value)}
          size="md"
          classNames={{ root: 'param-ara-alan', label: 'param-label', input: 'param-ara-girdi' }}
        />
        {sorgu ? (
          <button type="button" className="param-link-dugme" onClick={() => setSorgu('')}>
            Aramayı temizle
          </button>
        ) : null}
        <p className="param-ara-sonuc" aria-live="polite">
          {q ? `${toplam} alan, ${grupSayisi} grupta eşleşiyor.` : `${ALAN_SAYISI} alan, ${PARAM_GROUPS.length} grupta. Bir grubu açın ya da arayın.`}
        </p>
      </div>
      <Accordion
        multiple
        value={acikEtkin}
        onChange={(v) => {
          if (!q) setAcik(v);
        }}
        order={2}
        transitionDuration={sure}
        classNames={{ root: 'pgruplar', item: 'pgrup', itemTitle: 'pgrup-h', control: 'pgrup-baslik', label: 'pgrup-etiket', chevron: 'pgrup-ok', panel: 'pgrup-panel', content: 'pgrup-icerik' }}
      >
        {eslesme.map(({ g, fields }) => {
          const degisen = g.fields.filter((d) => params[d.key] !== DEFAULT_PARAMS[d.key]).length;
          return (
            <Accordion.Item key={g.id} value={g.id} id={g.id} hidden={q !== '' && fields.length === 0}>
              <Accordion.Control>
                <span className="pgrup-ad">{g.title}</span>
                <span className="pgrup-ozet">
                  {fields.length} alan{degisen ? ` · ${degisen} değişiklik` : ''}
                </span>
              </Accordion.Control>
              {/* Collapse zamanlama eğrisi hareket tokenından (Panel bunu Collapse’a aktarır; tipinde yok). */}
              <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
                <p className="pgrup-aciklama">{g.desc}</p>
                <fieldset className="pgrup-alanlar">
                  <legend className="visually-hidden">{g.title}</legend>
                  <div className="param-grid">
                    {fields.map((def) => (
                      <Field key={def.key} def={def} />
                    ))}
                  </div>
                </fieldset>
              </Accordion.Panel>
            </Accordion.Item>
          );
        })}
      </Accordion>
    </>
  );
}

function ParamsContent() {
  const { params, changed } = useParams();
  const [acik, setAcik] = useState<string[]>([]);
  const [sorgu, setSorgu] = useState('');
  const hedef = useRef<ParamKey | null>(null);
  const basladi = useRef(false);
  // Açılışta (kayıtlı parametreler okununca) değiştirilmiş alanı olan gruplar açılır; sonrası kullanıcının seçimi.
  useEffect(() => {
    if (basladi.current || !document.documentElement.hasAttribute('data-hydrated')) return;
    basladi.current = true;
    if (changed) setAcik(PARAM_GROUPS.filter((g) => g.fields.some((d) => params[d.key] !== DEFAULT_PARAMS[d.key])).map((g) => g.id));
  });
  // “Alana git”: grup açılır, alan görünür alana gelir ve odaklanır. Panel açılış geçişi sırasında alan henüz
  // görünür olmayabilir: görünür olana kadar (en çok ~1 sn) kare kare denenir.
  useEffect(() => {
    const key = hedef.current;
    if (!key) return undefined;
    hedef.current = null;
    let kare = 0;
    let istek = 0;
    const dene = () => {
      const el = document.getElementById(alanKimligi(key));
      if (el && el.getClientRects().length) {
        el.scrollIntoView({ block: 'center' });
        el.focus({ preventScroll: true });
        if (document.activeElement === el) return;
      }
      if (kare++ < 60) istek = requestAnimationFrame(dene);
    };
    istek = requestAnimationFrame(dene);
    return () => cancelAnimationFrame(istek);
  });
  const hedefle = (key: ParamKey) => {
    const grup = PARAM_GROUPS.find((g) => g.fields.some((d) => d.key === key));
    hedef.current = key;
    setSorgu('');
    setAcik(grup && !acik.includes(grup.id) ? [...acik, grup.id] : [...acik]);
  };
  return (
    <DatesProvider settings={{ locale: 'tr', firstDayOfWeek: 1 }}>
      <PageHeader
        title="Parametreler"
        purpose="Karar verilen tarih, kişi sayısı, ücret, prim, kota, bütçe ve hedefler; burada değiştirilen değer tüm sayfalara anında yansır."
        meta={[
          { label: 'Kayıt', value: 'Yalnız bu tarayıcı (yerel depolama)' },
          { label: 'Yayın', value: 'Herkese varsayılan değerler' },
        ]}
      >
        <div className="param-toolbar">
          <SaveStatus />
          <Sifirla />
        </div>
      </PageHeader>
      <Degisiklikler hedefle={hedefle} />
      <Gruplar acik={acik} setAcik={setAcik} sorgu={sorgu} setSorgu={setSorgu} />
      <Section id="turetilen" title="Türetilen değerler">
        <Derived />
      </Section>
    </DatesProvider>
  );
}

export function ParamsPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <ParamsContent />
    </AppFrame>
  );
}
