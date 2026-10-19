import 'dayjs/locale/tr';
import { useEffect, useState } from 'react';
import { NumberInput } from '@mantine/core';
import { DateInput, DatesProvider } from '@mantine/dates';
import { AppFrame } from '../components/AppFrame';
import { useModel, useParams } from '../components/ModelContext';
import { DataTable, Hero, Note, Section } from '../components/ui';
import { DEFAULT_PARAMS, PARAM_GROUPS, type ParamDef, type Params } from '../data/params';
import { longDate } from '../lib/dates';
import { int, num, pct, times, tl, tlExact } from '../lib/format';

const format = (def: ParamDef, value: Params[keyof Params]) => {
  if (def.kind === 'date') return longDate(value as string);
  const n = value as number;
  if (def.kind === 'money') return Number.isInteger(n) ? tl(n) : tlExact(n);
  if (def.kind === 'multiplier') return times(n);
  if (def.kind === 'percent') return `%${num(n)}`;
  return `${num(n)}${def.unit ? ` ${def.unit}` : ''}`;
};

function Field({ def }: { def: ParamDef }) {
  const { params, setParam } = useParams();
  const value = params[def.key];
  const fallback = DEFAULT_PARAMS[def.key];
  const changed = value !== fallback;
  const description = `${changed ? 'Değiştirildi · ' : ''}Varsayılan: ${format(def, fallback)}${def.help ? ` · ${def.help}` : ''}`;
  const common = {
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

/** Varsayılana dönüş iki adımlıdır: ilk basış onay ister, 4 sn içinde ikinci basış uygular. */
function ResetButton() {
  const { reset, changed } = useParams();
  const [confirming, setConfirming] = useState(false);
  useEffect(() => {
    if (!confirming) return undefined;
    const timer = window.setTimeout(() => setConfirming(false), 4000);
    return () => window.clearTimeout(timer);
  }, [confirming]);
  return (
    <button
      type="button"
      className="param-reset"
      disabled={!changed}
      onClick={() => {
        if (confirming) {
          reset();
          setConfirming(false);
        } else setConfirming(true);
      }}
    >
      {confirming ? 'Emin misiniz? Tekrar basın' : 'Varsayılanlara dön'}
    </button>
  );
}

function SaveStatus() {
  const { changed, saved } = useParams();
  const time = saved ? new Intl.DateTimeFormat('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(saved) : null;
  return (
    <p className="param-status" role="status">
      {saved === false
        ? 'Tarayıcı depolaması kapalı: değişiklikler yalnız bu sayfa açıkken geçerli.'
        : `${changed ? `${changed} değer varsayılandan farklı.` : 'Tüm değerler varsayılan.'}${time ? ` Son kayıt ${time}.` : ''}`}
    </p>
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

function ParamsContent() {
  return (
    <DatesProvider settings={{ locale: 'tr', firstDayOfWeek: 1 }}>
      <Hero
        eyebrow="Ortak"
        title="Parametreler"
        lead="Karar verilen tarih, kişi sayısı, ücret, prim, kota, bütçe ve hedefler. Burada değiştirilen değer tüm sayfalara anında yansır ve bu tarayıcıda saklanır."
      >
        <div className="param-toolbar">
          <SaveStatus />
          <ResetButton />
        </div>
      </Hero>
      <Note title="Kapsam">
        <p>
          Değerler yalnız bu tarayıcıda saklanır (yerel depolama). Yayındaki site başkaları için varsayılanları gösterir; varsayılanı
          kalıcı değiştirmek için kaynaktaki parametre dosyası güncellenir.
        </p>
      </Note>
      {PARAM_GROUPS.map((group, i) => (
        <Section key={group.id} id={group.id} index={i + 1} title={group.title} desc={group.desc}>
          <div className="param-grid">
            {group.fields.map((def) => (
              <Field key={def.key} def={def} />
            ))}
          </div>
        </Section>
      ))}
      <Section id="turetilen" index={PARAM_GROUPS.length + 1} title="Türetilen değerler">
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
