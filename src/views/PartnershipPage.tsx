import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Timeline } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { Chart, DataTable, Hero, Note, Section, Stats } from '../components/ui';
import {
  GATE_STEPS,
  type Action,
  type Capacity,
  type Cascade,
  type CellOption,
  type Channel,
  type EconRow,
  type EntryPoint,
  type Gate,
  type Hypothesis,
  type Interview,
  type Journey,
  type Metric,
  type PartnerType,
  type Partnership,
  type Program,
  type ProgramId,
  type Quarter,
  type Risk,
  type ScoreRow,
  type Scorecard,
  type Segment,
  type Tier,
} from '../data/partnership';
import { longDate, shortDate } from '../lib/dates';
import { int } from '../lib/format';

/**
 * İş ortaklığı programı (kullanıcı kararı 2026-10-27): iki ana sekme (Segika, iStoc), her sekmede sekiz bölüm sekmesi.
 * Bir anda tek program ve tek bölüm çizilir (sekme gibi; diğerleri çizilmez). Adres `#<program>-<bölüm>` (derin
 * bağlantı, geri/ileri); #’siz adres Segika · Özet. Veri `src/data/partnership.ts` (model üzerinden; tarihler
 * program başlangıcından kayar).
 */

const SECTIONS = [
  { id: 'ozet', label: 'Özet' },
  { id: 'teshis', label: 'Teşhis' },
  { id: 'kime', label: 'Kime' },
  { id: 'program', label: 'Program' },
  { id: 'kanal', label: 'Kanal' },
  { id: 'olcum', label: 'Ölçüm' },
  { id: 'takvim', label: 'Takvim' },
  { id: 'risk', label: 'Risk' },
] as const;
type SectionId = (typeof SECTIONS)[number]['id'];
type Konum = { program: ProgramId; section: SectionId };
const PROGRAM_IDS: ProgramId[] = ['segika', 'istoc'];
const VARSAYILAN: Konum = { program: 'segika', section: 'ozet' };

/** Adresteki #program-bölüm; geçersizse null. */
function hashtenKonum(): Konum | null {
  if (typeof window === 'undefined') return null;
  const h = decodeURIComponent(window.location.hash.slice(1));
  if (!h) return null;
  const [p, s] = h.split('-');
  if (!PROGRAM_IDS.includes(p as ProgramId)) return null;
  const section = SECTIONS.find((x) => x.id === s)?.id ?? 'ozet';
  return { program: p as ProgramId, section };
}

const ayni = (a: Konum, b: Konum) => a.program === b.program && a.section === b.section;

/* ---------- Küçük parçalar ---------- */

function Maddeler({ items }: { items: string[] }) {
  return (
    <ul className="bullets">
      {items.map((x) => (
        <li key={x}>{x}</li>
      ))}
    </ul>
  );
}

function Kartlar({ items }: { items: { title: string; text: string }[] }) {
  return (
    <div className="ortak-kartlar">
      {items.map((k) => (
        <div key={k.title} className="ortak-kart">
          <p className="ortak-kart-baslik">{k.title}</p>
          <p>{k.text}</p>
        </div>
      ))}
    </div>
  );
}

/** Puan kartı: ölçüt ve puan; toplam satırı; eşik ve ret nedeni. */
function PuanKarti({ id, sc }: { id: string; sc: Scorecard }) {
  const total = sc.rows.reduce((a, r) => a + r.points, 0);
  const rows: ScoreRow[] = [...sc.rows, { criterion: 'Toplam', points: total }];
  return (
    <>
      <DataTable<ScoreRow>
        id={id}
        title={sc.title}
        note={`${sc.note} Eşik: ≥ ${sc.threshold} puan.`}
        columns={[
          { key: 'c', header: 'Ölçüt', minWidth: '20rem', rowHeader: true, render: (r) => r.criterion },
          { key: 'p', header: 'Puan', nowrap: true, render: (r) => r.points },
        ]}
        rows={rows}
        rowTone={(r) => (r.criterion === 'Toplam' ? 'total' : undefined)}
      />
      <Note title="Puandan bağımsız ret">
        <p>{sc.veto}</p>
      </Note>
    </>
  );
}

/* ---------- Bölümler ---------- */

function Ozet({ p, no }: { p: Program; no: number }) {
  return (
    <>
      <Section id={`${p.id}-ozet`} index={`${no}.1`} title="Yönetici özeti" desc={p.what}>
        <Kartlar
          items={[
            { title: 'İstek', text: p.summary.ask },
            { title: 'İhtiyaç', text: p.summary.need },
            { title: 'Teşhis', text: p.summary.diagnosis },
            { title: 'Yönlendirici yaklaşım', text: p.summary.approach },
          ]}
        />
        <h3 className="block-title ortak-blok">90 gün başarı ölçütleri</h3>
        <Stats items={p.headline} />
      </Section>
      <Section id={`${p.id}-kaskad`} index={`${no}.2`} title="Kazanma kaskadı" desc="Beş seçim birbirini desteklemeden yeni kanal açılmaz.">
        <DataTable<Cascade>
          id={`${p.id}-kaskad`}
          title="Seçim ve karar"
          columns={[
            { key: 'q', header: 'Seçim', nowrap: true, rowHeader: true, render: (r) => r.question },
            { key: 'a', header: 'Karar', minWidth: '26rem', render: (r) => r.answer },
          ]}
          rows={p.cascade}
        />
      </Section>
      <Section id={`${p.id}-eylem`} index={`${no}.3`} title="Tutarlı eylemler" desc="Teşhisten türeyen, birbirini destekleyen az sayıda eylem; her birinin ölçütü ve haftası var.">
        <DataTable<Action>
          id={`${p.id}-eylem`}
          title="Eylem, ölçüt, hafta"
          columns={[
            { key: 'n', header: 'Eylem', minWidth: '14rem', rowHeader: true, render: (r) => r.name },
            { key: 'w', header: 'Ne yapılır', minWidth: '20rem', render: (r) => r.what },
            { key: 'm', header: 'Ölçüt', minWidth: '14rem', render: (r) => r.measure },
            { key: 'h', header: 'Hafta', nowrap: true, render: (r) => r.weeks },
          ]}
          rows={p.actions}
        />
      </Section>
      <Section id={`${p.id}-kacin`} index={`${no}.4`} title="Kaçınılacak kötü strateji işaretleri">
        <Maddeler items={p.avoid} />
        <Note title="Yapılmayacaklar">
          <Maddeler items={p.dont} />
        </Note>
      </Section>
    </>
  );
}

function Teshis({ p, no }: { p: Program; no: number }) {
  const toplam = p.interviews.reduce((a, i) => a + i.count, 0);
  return (
    <>
      <Section id={`${p.id}-durum`} index={`${no}.1`} title="Doğrulanmış durum" desc="Dış gözlemler (Ekim 2026); şirket verisi değildir.">
        <Maddeler items={p.verified} />
      </Section>
      <Section id={`${p.id}-icveri`} index={`${no}.2`} title="İlk haftada doldurulacak iç veri" desc="Kaynak: fatura, tahsilat, iptal ve CRM kayıtları. Veri yoksa “bilinmiyor” yazılır, uydurulmaz.">
        <Maddeler items={p.internalData} />
      </Section>
      <Section id={`${p.id}-hipotez`} index={`${no}.3`} title="Hipotezler" desc="Her hipotezin sinyali ve karşılığı önceden yazılı; doğrulanmayan hipoteze karşılık uygulanmaz.">
        <DataTable<Hypothesis>
          id={`${p.id}-hipotez`}
          title="Hipotez, doğrulama sinyali, karşılık"
          columns={[
            { key: 'id', header: '#', nowrap: true, rowHeader: true, render: (r) => r.id },
            { key: 'h', header: 'Hipotez', minWidth: '20rem', render: (r) => r.hypothesis },
            { key: 's', header: 'Doğrulama sinyali', minWidth: '14rem', render: (r) => r.signal },
            { key: 'r', header: 'Doğruysa karşılığı', minWidth: '14rem', render: (r) => r.response },
          ]}
          rows={p.hypotheses}
        />
      </Section>
      <Section id={`${p.id}-gorusme`} index={`${no}.4`} title="Görüşme planı" desc={`${toplam} görüşme, ilk üç hafta; istatistiksel temsil iddiası yok, hangi hipotezin sınanacağını seçmek için.`}>
        <DataTable<Interview>
          id={`${p.id}-gorusme`}
          title="Grup, sayı, aranan kanıt"
          columns={[
            { key: 'g', header: 'Grup', minWidth: '12rem', rowHeader: true, render: (r) => r.group },
            { key: 'c', header: 'Görüşme', nowrap: true, render: (r) => r.count },
            { key: 'e', header: 'Aranan kanıt', minWidth: '24rem', render: (r) => r.evidence },
          ]}
          rows={p.interviews}
        />
        <Note title="Görüşme kuralları">
          <Maddeler items={p.interviewRules} />
        </Note>
      </Section>
    </>
  );
}

function Kime({ p, no }: { p: Program; no: number }) {
  let n = 0;
  const idx = () => `${no}.${++n}`;
  return (
    <>
      <Section id={`${p.id}-segment`} index={idx()} title="Müşteri segmentleri" desc={p.segmentNote}>
        <DataTable<Segment>
          id={`${p.id}-segment`}
          title="Segment, neden, öncelik"
          columns={[
            { key: 's', header: 'Segment', minWidth: '16rem', rowHeader: true, render: (r) => r.segment },
            { key: 'w', header: 'Neden', minWidth: '20rem', render: (r) => r.why },
            { key: 'p', header: 'Öncelik', nowrap: true, render: (r) => r.priority },
          ]}
          rows={p.segments}
        />
      </Section>
      {p.cellOptions && p.cellScorecard ? (
        <Section id={`${p.id}-hucre`} index={idx()} title={p.cellOptions.title} desc={p.cellOptions.note}>
          <DataTable<CellOption>
            id={`${p.id}-hucre`}
            title="Aday, alıcının somut işi, kritik risk"
            columns={[
              { key: 'n', header: 'Aday hücre', minWidth: '18rem', rowHeader: true, render: (r) => r.name },
              { key: 'j', header: 'Alıcının somut işi', minWidth: '16rem', render: (r) => r.job },
              { key: 'r', header: 'Araştırılacak kritik risk', minWidth: '16rem', render: (r) => r.risk },
            ]}
            rows={p.cellOptions.rows}
          />
          <PuanKarti id={`${p.id}-hucre-puan`} sc={p.cellScorecard} />
        </Section>
      ) : null}
      <Section id={`${p.id}-ortak-tip`} index={idx()} title="Ortak tipleri" desc={p.firstWave}>
        <DataTable<PartnerType>
          id={`${p.id}-ortak-tip`}
          title="Tip, ne getirir, giriş koşulu, dalga"
          columns={[
            { key: 't', header: 'Ortak tipi', minWidth: '16rem', rowHeader: true, render: (r) => r.type },
            { key: 'b', header: 'Ne getirir', minWidth: '18rem', render: (r) => r.brings },
            { key: 'e', header: 'Giriş koşulu ve ekonomi', minWidth: '18rem', render: (r) => r.entry },
            { key: 'w', header: 'Dalga', nowrap: true, render: (r) => r.wave },
          ]}
          rows={p.partnerTypes}
        />
        <Chart
          id={`${p.id}-ortak-karma`}
          title="İlk dalga ortak karması"
          summary={p.partnerMix.items.map((i) => `${i.name}: ${i.value} ${p.partnerMix.unit}`).join('; ')}
          spec={{ kind: 'mix', unit: p.partnerMix.unit, items: p.partnerMix.items }}
          size="md"
        />
      </Section>
      <Section id={`${p.id}-ortak-puan`} index={idx()} title="Ortak eleme" desc="İmza sayısı hedef değildir; puan kartı uygun ortağı seçer, kalanı eler.">
        <PuanKarti id={`${p.id}-ortak-puan`} sc={p.partnerScorecard} />
      </Section>
    </>
  );
}

function ProgramTasarimi({ p, no }: { p: Program; no: number }) {
  const [h1, h2, h3] = p.tierHeaders;
  return (
    <>
      <Section id={`${p.id}-katman`} index={`${no}.1`} title="Katmanlar ve ortak ekonomisi" desc="Her katmanın koşulu ve karşılığı yazılı; kademe adıyla değil, gerçekten devredilen işle büyür.">
        <DataTable<Tier>
          id={`${p.id}-katman`}
          title="Katman, koşul, karşılık"
          columns={[
            { key: 't', header: h1, minWidth: '13rem', rowHeader: true, render: (r) => r.tier },
            { key: 'c', header: h2, minWidth: '16rem', render: (r) => r.condition },
            { key: 'g', header: h3, minWidth: '20rem', render: (r) => r.gets },
          ]}
          rows={p.tiers}
        />
      </Section>
      <Section id={`${p.id}-yolculuk`} index={`${no}.2`} title="Ortak yolculuğu" desc="Her aşamanın süresi, başarı kriteri ve sahibi; kriter sağlanmadan sonraki aşamaya geçilmez.">
        <DataTable<Journey>
          id={`${p.id}-yolculuk`}
          title="Aşama, süre, başarı kriteri, sahip"
          columns={[
            { key: 's', header: 'Aşama', nowrap: true, rowHeader: true, render: (r) => r.stage },
            { key: 'd', header: 'Süre', nowrap: true, render: (r) => r.duration },
            { key: 'c', header: 'Başarı kriteri', minWidth: '20rem', render: (r) => r.criterion },
            { key: 'o', header: 'Sahip', nowrap: true, render: (r) => r.owner },
          ]}
          rows={p.journey}
        />
      </Section>
      <Section id={`${p.id}-akis`} index={`${no}.3`} title={p.workflow.title}>
        <Chart
          id={`${p.id}-akis`}
          title="Sıralı adımlar"
          summary={p.workflow.summary}
          spec={{ kind: 'chain', steps: p.workflow.steps.map((s) => ({ name: s.name, sub: s.sub, role: p.role })) }}
          size="xxl"
        />
      </Section>
      <Section id={`${p.id}-kural`} index={`${no}.4`} title="Kurallar" desc="Kayıt, çatışma, marka, sorumluluk ve veri.">
        <Maddeler items={p.rules} />
      </Section>
      <Section id={`${p.id}-ekonomi`} index={`${no}.5`} title="Ekonomi" desc="Fiyat, pay ve katkı kuralları. Tutar örneği yalnız hesap yöntemini gösterir; gerçek tarife 14. günde finansla doğrulanır.">
        <DataTable<EconRow>
          id={`${p.id}-ekonomi`}
          title="Kural ve dayanak"
          columns={[
            { key: 'i', header: 'Konu', minWidth: '12rem', rowHeader: true, render: (r) => r.item },
            { key: 'v', header: 'Kural', minWidth: '20rem', render: (r) => r.value },
            { key: 'n', header: 'Dayanak ve sınır', minWidth: '20rem', render: (r) => r.note },
          ]}
          rows={p.economics}
        />
        <Chart
          id={`${p.id}-ornek`}
          title={p.example.title}
          note={p.example.note}
          summary={`${p.example.total.name} ${int(p.example.total.value)} ₺: ${p.example.parts.map((x) => `${x.name} ${int(x.value)} ₺`).join(', ')}.`}
          spec={{ kind: 'opex-bilesim', total: p.example.total, parts: p.example.parts }}
          size="sm"
          rows={1}
          shortLabels
        />
        <DataTable<EconRow>
          id={`${p.id}-ornek`}
          title="Örnek hesap adımları"
          columns={[
            { key: 'i', header: 'Kalem', minWidth: '14rem', rowHeader: true, render: (r) => r.item },
            { key: 'v', header: 'Hesap', minWidth: '16rem', render: (r) => r.value },
            { key: 'n', header: 'Not', minWidth: '18rem', render: (r) => r.note },
          ]}
          rows={p.example.rows}
        />
      </Section>
    </>
  );
}

function Kanal({ p, no }: { p: Program; no: number }) {
  return (
    <>
      <Section id={`${p.id}-kanal`} index={`${no}.1`} title="Kanal seçimi: iç halka üç kanal" desc="İlk 90 günde üç kanal ölçülür; dış halka takvime alınır; ücretli reklam kanıttan sonra. Doğrudan kanal, ortak katkısını kıyaslamak için korunur.">
        <DataTable<Channel>
          id={`${p.id}-kanal`}
          title="Halka, kanal, 90 günlük test, başarı ölçütü"
          columns={[
            { key: 'r', header: 'Halka', nowrap: true, rowHeader: true, render: (r) => r.ring },
            { key: 'c', header: 'Kanal', minWidth: '20rem', render: (r) => r.channel },
            { key: 't', header: '90 günlük test', minWidth: '16rem', render: (r) => r.test },
            { key: 'm', header: 'Başarı ölçütü', minWidth: '12rem', render: (r) => r.metric },
          ]}
          rows={p.channels}
        />
      </Section>
      <Section id={`${p.id}-giris`} index={`${no}.2`} title="Kategori giriş noktaları" desc="Alıcıların çoğu şu an pazarda değildir; iş, ihtiyaç anı geldiğinde akla gelmek ve o anda kolayca satın alınabilir olmaktır.">
        <DataTable<EntryPoint>
          id={`${p.id}-giris`}
          title="Ne zaman akla gelmeliyiz, tetik, hazırlık"
          columns={[
            { key: 'm', header: 'Giriş noktası', minWidth: '12rem', rowHeader: true, render: (r) => r.moment },
            { key: 't', header: 'Tetik', minWidth: '16rem', render: (r) => r.trigger },
            { key: 'p', header: 'Hazırlık', minWidth: '14rem', render: (r) => r.prep },
          ]}
          rows={p.entryPoints}
        />
        <Note title="Ayırt edici varlıklar ve bulunurluk">
          <p>{p.assets}</p>
        </Note>
      </Section>
    </>
  );
}

function Olcum({ p, no, dates }: { p: Program; no: number; dates: Partnership['dates'] }) {
  return (
    <>
      <Section id={`${p.id}-kpi`} index={`${no}.1`} title="Yönetim tablosu" desc="Her gösterge bir kararı değiştirir; tanım, kaynak ve dönem sabittir. Küçük örneklemde oranla birlikte adet gösterilir; olgunlaşmamış gösterge “ölçülemez” yazılır.">
        <DataTable<Metric>
          id={`${p.id}-kpi`}
          title="Gösterge, tanım, kaynak, dönem, karar, hedef"
          columns={[
            { key: 'm', header: 'Gösterge', minWidth: '12rem', rowHeader: true, sticky: true, render: (r) => r.metric },
            { key: 'd', header: 'Tanım', minWidth: '20rem', render: (r) => r.definition },
            { key: 's', header: 'Kaynak', minWidth: '8rem', render: (r) => r.source },
            { key: 'p', header: 'Dönem', nowrap: true, render: (r) => r.period },
            { key: 'c', header: 'Hangi kararı değiştirir', minWidth: '12rem', render: (r) => r.decision },
            { key: 't', header: 'Hedef (90 gün)', minWidth: '12rem', render: (r) => r.target },
          ]}
          rows={p.kpis}
        />
      </Section>
      <Section id={`${p.id}-huni`} index={`${no}.2`} title={p.funnel.title} desc={p.funnel.note}>
        <Chart
          id={`${p.id}-huni`}
          title="Aşama ve adet"
          summary={p.funnel.items.map((f) => `${f.name}: ${int(f.value)}`).join('; ')}
          spec={{ kind: 'huni', role: p.role, items: p.funnel.items }}
          size="lg"
        />
      </Section>
      <Section id={`${p.id}-gecit-hedef`} index={`${no}.3`} title="Geçit hedefleri" desc={`${shortDate(dates.day30)}, ${shortDate(dates.day60)} ve ${shortDate(dates.day90)} itibarıyla kümülatif en az değerler.`}>
        <Chart
          id={`${p.id}-gecit-hedef`}
          title="Gün 30 · 60 · 90"
          summary={p.gateSeries.map((s) => `${s.name}: ${s.values.map((v, i) => `${GATE_STEPS[i]} ${int(v)}`).join(', ')}`).join('; ')}
          spec={{ kind: 'hedef-adim', steps: GATE_STEPS, series: p.gateSeries }}
          size="md"
        />
        <DataTable
          id={`${p.id}-gecit-hedef`}
          title="Hedef × geçit"
          columns={[
            { key: 'n', header: 'Hedef', minWidth: '12rem', rowHeader: true, render: (s: Program['gateSeries'][number]) => s.name },
            ...GATE_STEPS.map((g, i) => ({ key: g, header: g, nowrap: true, render: (s: Program['gateSeries'][number]) => `≥ ${int(s.values[i])}` })),
          ]}
          rows={p.gateSeries}
        />
      </Section>
    </>
  );
}

function Takvim({ p, no, dates }: { p: Program; no: number; dates: Partnership['dates'] }) {
  const marks = [
    { date: dates.t0, label: 'Başlangıç' },
    ...p.gates.map((g) => ({ date: g.date, label: `${g.day}. gün` })),
  ];
  return (
    <>
      <Section id={`${p.id}-asama`} index={`${no}.1`} title="İlk 90 gün: beş aşama" desc={`${longDate(dates.t0)} – ${longDate(dates.end)}; hafta 1 ilk iş günüdür. Her aşamanın çıktısı ve sahibi yazılı.`}>
        <Timeline className="hire-timeline" bulletSize={44} lineWidth={2} radius={0} classNames={{ item: 'hire-item', itemBullet: 'hire-bullet', itemTitle: 'hire-title', itemBody: 'hire-body' }}>
          {p.phases.map((ph) => (
            <Timeline.Item
              key={ph.no}
              bullet={
                <span className="hire-no" data-role={ph.role}>
                  {ph.no}
                </span>
              }
              title={`${ph.title} · ${ph.weeks}`}
            >
              <p className="hire-date">
                {shortDate(ph.from)} – {shortDate(ph.to)}
              </p>
              <ul className="bullets ortak-asama-is">
                {ph.work.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
              <p className="hire-note">
                Çıktı: {ph.output} · Sorumlu: {ph.owner}
              </p>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>
      <Section id={`${p.id}-gantt`} index={`${no}.2`} title="İş paketleri" desc="Kesikli çizgiler geçitlerdir; kalın kenarlı çubuk kilometre taşı.">
        <Chart
          id={`${p.id}-gantt`}
          title="İş paketi × zaman"
          summary={`${p.work.length} iş paketi, ${longDate(dates.t0)} ile ${longDate(dates.end)} arasında; geçitler ${p.gates.map((g) => `${g.day}. gün (${shortDate(g.date)})`).join(', ')}.`}
          spec={{ kind: 'gantt', start: dates.t0, end: dates.end, rows: p.work.map((x) => ({ name: x.name, from: x.from, to: x.to, role: x.role, text: x.text, milestone: x.milestone })), marks }}
          size="xxl"
          wide
        />
      </Section>
      <Section id={`${p.id}-gecit`} index={`${no}.3`} title="Geçitler: devam, düzeltme, durdurma" desc="Geçit tarihinin gelmesi değil, kanıt eşiğinin karşılanması genişletir. Her geçitte yazılı karar.">
        <div className="ortak-gecitler">
          {p.gates.map((g: Gate) => (
            <article key={g.day} className="ortak-gecit" data-edge="top" data-role={p.role} aria-label={`${g.day}. gün: ${g.title}`}>
              <p className="ortak-gecit-gun">
                Gün {g.day} <span className="ortak-gecit-tarih">{longDate(g.date)}</span>
              </p>
              <p className="ortak-gecit-baslik">{g.title}</p>
              <ul className="ortak-gecit-liste">
                {g.required.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <p className="ortak-gecit-degilse">
                <strong>Karşılanmazsa:</strong> {g.ifNot}
              </p>
            </article>
          ))}
        </div>
      </Section>
      <Section id={`${p.id}-ritim`} index={`${no}.4`} title="Haftalık ritim">
        <Maddeler items={p.rhythm} />
      </Section>
      <Section id={`${p.id}-ceyrek`} index={`${no}.5`} title="12 aylık yön" desc="Çeyrek hedefleri gerçek veriyle yazılır; kapsam değişirse yeni plan sürümü açılır, eski hedefler yeniden numaralanmaz.">
        <DataTable<Quarter>
          id={`${p.id}-ceyrek`}
          title="Çeyrek, odak, hedef"
          columns={[
            { key: 'q', header: 'Çeyrek', minWidth: '10rem', rowHeader: true, render: (r) => r.quarter },
            { key: 'f', header: 'Odak', minWidth: '22rem', render: (r) => r.focus },
            { key: 't', header: 'Hedef', minWidth: '14rem', render: (r) => r.target },
          ]}
          rows={p.quarters}
        />
      </Section>
    </>
  );
}

function RiskBolumu({ p, no }: { p: Program; no: number }) {
  const total = p.capacity.reduce((a, c) => a + c.hours, 0);
  const rows: Capacity[] = [...p.capacity, { role: 'Toplam', short: 'Toplam', hours: total, duty: `${p.capacity.length} rol; haftalık` }];
  return (
    <>
      <Section id={`${p.id}-risk`} index={`${no}.1`} title="Riskler ve karşılıklar">
        <DataTable<Risk>
          id={`${p.id}-risk`}
          title="Risk, olasılık, etki, karşılık"
          columns={[
            { key: 'r', header: 'Risk veya varsayım', minWidth: '16rem', rowHeader: true, render: (r) => r.risk },
            { key: 'p', header: 'Olasılık', nowrap: true, render: (r) => r.probability },
            { key: 'i', header: 'Etki', nowrap: true, render: (r) => r.impact },
            { key: 'c', header: 'Karşılık', minWidth: '20rem', render: (r) => r.response },
          ]}
          rows={p.risks}
        />
      </Section>
      <Section id={`${p.id}-pivot`} index={`${no}.2`} title="Pivot ve durdurma kriterleri" desc={`${shortDate(p.gates[3].date)} kararı bu kriterlere göre verilir; daha yüksek satış hedefi kusurları telafi etmez.`}>
        <h3 className="block-title ortak-blok">Pivot</h3>
        <Maddeler items={p.pivots} />
        <h3 className="block-title ortak-blok">Durdurma</h3>
        <Maddeler items={p.stop} />
      </Section>
      <Section id={`${p.id}-kapasite`} index={`${no}.3`} title="Kapasite" desc={p.capacityNote}>
        <Chart
          id={`${p.id}-kapasite`}
          title="Haftalık ayrılan saat"
          summary={p.capacity.map((c) => `${c.role}: ${c.hours} saat`).join('; ') + `; toplam ${total} saat/hafta.`}
          spec={{ kind: 'pay', role: p.role, items: p.capacity.map((c) => ({ name: c.short, value: c.hours * 60 })) }}
          size="lg"
        />
        <DataTable<Capacity>
          id={`${p.id}-kapasite`}
          title="Rol, saat/hafta, sorumluluk"
          columns={[
            { key: 'r', header: 'Rol', minWidth: '14rem', rowHeader: true, render: (r) => r.role },
            { key: 'h', header: 'Saat / hafta', nowrap: true, render: (r) => `${r.hours} sa` },
            { key: 'd', header: 'Teslim sorumluluğu', minWidth: '18rem', render: (r) => r.duty },
          ]}
          rows={rows}
          rowTone={(r) => (r.role === 'Toplam' ? 'total' : undefined)}
        />
      </Section>
    </>
  );
}

/* ---------- Sekmeler ---------- */

function ProgramSekmeleri({ programs, value, onChange }: { programs: Program[]; value: ProgramId; onChange: (id: ProgramId) => void }) {
  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const i = programs.findIndex((p) => p.id === value);
    const n = programs.length;
    const next = event.key === 'ArrowRight' ? programs[(i + 1) % n] : event.key === 'ArrowLeft' ? programs[(i - 1 + n) % n] : event.key === 'Home' ? programs[0] : event.key === 'End' ? programs[n - 1] : null;
    if (!next) return;
    event.preventDefault();
    onChange(next.id);
    document.getElementById(`ortak-sekme-${next.id}`)?.focus();
  };
  return (
    <div className="ortak-sekmeler" role="tablist" aria-label="Program">
      {programs.map((p) => (
        <button
          key={p.id}
          id={`ortak-sekme-${p.id}`}
          type="button"
          role="tab"
          className="ortak-sekme"
          data-role={p.role}
          aria-selected={p.id === value}
          aria-controls="ortak-panel"
          tabIndex={p.id === value ? 0 : -1}
          onClick={() => onChange(p.id)}
          onKeyDown={move}
        >
          <span className="ortak-sekme-bas">
            <span className="ortak-sekme-ad">{p.name}</span>
            <svg className="ortak-radio" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
              <circle className="ortak-radio-ring" cx="12" cy="12" r="10" strokeWidth="2" />
              <circle className="ortak-radio-dot" cx="12" cy="12" r="6" />
            </svg>
          </span>
          <span className="ortak-sekme-alt">{p.title}</span>
        </button>
      ))}
    </div>
  );
}

function BolumSekmeleri({ program, value, onChange }: { program: Program; value: SectionId; onChange: (id: SectionId) => void }) {
  const list = useRef<HTMLDivElement>(null);
  // Dar ekranda yatay şeritte seçili sekme görünür alana gelir (animasyonsuz).
  useEffect(() => {
    const el = list.current;
    const active = el?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!el || !active || el.scrollWidth <= el.clientWidth) return;
    const box = el.getBoundingClientRect();
    const a = active.getBoundingClientRect();
    if (a.left < box.left || a.right > box.right) el.scrollLeft += a.left - box.left - (box.width - a.width) / 2;
  }, [value]);
  const move = (event: KeyboardEvent<HTMLButtonElement>) => {
    const i = SECTIONS.findIndex((s) => s.id === value);
    const n = SECTIONS.length;
    const next = event.key === 'ArrowRight' ? SECTIONS[(i + 1) % n] : event.key === 'ArrowLeft' ? SECTIONS[(i - 1 + n) % n] : event.key === 'Home' ? SECTIONS[0] : event.key === 'End' ? SECTIONS[n - 1] : null;
    if (!next) return;
    event.preventDefault();
    onChange(next.id);
    document.getElementById(`ortak-alt-${next.id}`)?.focus();
  };
  return (
    <div className="ortak-alt" role="tablist" aria-label={`${program.name} bölümleri`} ref={list}>
      {SECTIONS.map((s, i) => (
        <button
          key={s.id}
          id={`ortak-alt-${s.id}`}
          type="button"
          role="tab"
          className="ortak-alt-sekme"
          data-role={program.role}
          aria-selected={s.id === value}
          aria-controls="ortak-bolum"
          tabIndex={s.id === value ? 0 : -1}
          onClick={() => onChange(s.id)}
          onKeyDown={move}
        >
          <span className="ortak-alt-no" aria-hidden="true">
            {i + 1}
          </span>
          {s.label}
        </button>
      ))}
    </div>
  );
}

/** Bölüm sırası: önceki/sonraki bölüm; programın sonunda diğer programın ilk bölümü. */
function Sira({ programs, konum, go }: { programs: Program[]; konum: Konum; go: (k: Konum) => void }) {
  const i = SECTIONS.findIndex((s) => s.id === konum.section);
  const pi = programs.findIndex((p) => p.id === konum.program);
  const son = SECTIONS[SECTIONS.length - 1];
  const prev =
    i > 0
      ? { konum: { program: konum.program, section: SECTIONS[i - 1].id }, label: SECTIONS[i - 1].label }
      : pi > 0
        ? { konum: { program: programs[pi - 1].id, section: son.id }, label: `${programs[pi - 1].name} · ${son.label}` }
        : null;
  const next =
    i < SECTIONS.length - 1
      ? { konum: { program: konum.program, section: SECTIONS[i + 1].id }, label: SECTIONS[i + 1].label }
      : pi < programs.length - 1
        ? { konum: { program: programs[pi + 1].id, section: SECTIONS[0].id }, label: `${programs[pi + 1].name} · ${SECTIONS[0].label}` }
        : null;
  return (
    <nav className="ortak-sira" aria-label="Bölüm sırası">
      {prev ? (
        <button type="button" className="ortak-sira-dugme" onClick={() => go(prev.konum)}>
          <span className="pager-dir">← Önceki</span>
          <span className="pager-label">{prev.label}</span>
        </button>
      ) : (
        <span />
      )}
      {next ? (
        <button type="button" className="ortak-sira-dugme" data-next="" onClick={() => go(next.konum)}>
          <span className="pager-dir">Sonraki →</span>
          <span className="pager-label">{next.label}</span>
        </button>
      ) : null}
    </nav>
  );
}

/* ---------- Sayfa ---------- */

function Icerik() {
  const m = useModel();
  const pt = m.partnership;
  // İçerik girişten sonra (istemcide) çizilir: adresteki konum ilk çizimde okunur, titreme olmaz.
  const [konum, setKonum] = useState<Konum>(() => hashtenKonum() ?? VARSAYILAN);
  const panel = useRef<HTMLDivElement>(null);
  const odakla = useRef(false);
  const ilk = useRef(true);

  useEffect(() => {
    const dinle = () => {
      const k = hashtenKonum() ?? (window.location.hash ? null : VARSAYILAN);
      if (k) {
        odakla.current = false;
        setKonum(k);
      }
    };
    window.addEventListener('hashchange', dinle);
    window.addEventListener('popstate', dinle);
    return () => {
      window.removeEventListener('hashchange', dinle);
      window.removeEventListener('popstate', dinle);
    };
  }, []);

  // Konum değişince: sıradan seçildiyse odak bölüm paneline; panelin başı görünür alanın üstünde kaldıysa oraya kaydırılır.
  useEffect(() => {
    if (ilk.current) {
      ilk.current = false;
      return;
    }
    const el = panel.current;
    if (!el) return;
    if (odakla.current) el.focus({ preventScroll: true });
    if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: 'start' });
  }, [konum]);

  const go = (next: Konum, odak = false) => {
    odakla.current = odak;
    if (ayni(next, konum)) return;
    window.history.pushState(null, '', `#${next.program}-${next.section}`);
    setKonum(next);
  };
  const program = pt.byId[konum.program];
  const no = SECTIONS.findIndex((s) => s.id === konum.section) + 1;
  const bolum = (() => {
    switch (konum.section) {
      case 'ozet':
        return <Ozet p={program} no={no} />;
      case 'teshis':
        return <Teshis p={program} no={no} />;
      case 'kime':
        return <Kime p={program} no={no} />;
      case 'program':
        return <ProgramTasarimi p={program} no={no} />;
      case 'kanal':
        return <Kanal p={program} no={no} />;
      case 'olcum':
        return <Olcum p={program} no={no} dates={pt.dates} />;
      case 'takvim':
        return <Takvim p={program} no={no} dates={pt.dates} />;
      case 'risk':
        return <RiskBolumu p={program} no={no} />;
    }
  })();

  return (
    <>
      <Hero
        eyebrow="Pazarlama"
        title="İş ortaklığı programı"
        lead={`İki marka, iki 90 günlük program: ${longDate(pt.dates.t0)} – ${longDate(pt.dates.end)}. Sayılar başlangıç tasarımıdır; 14. günde gerçek veriyle yeniden yazılır.`}
      />
      <div className="ortak-kume">
        <ProgramSekmeleri programs={pt.programs} value={konum.program} onChange={(id) => go({ program: id, section: konum.section })} />
        <div className="ortak-panel" id="ortak-panel" role="tabpanel" aria-labelledby={`ortak-sekme-${program.id}`}>
          <BolumSekmeleri program={program} value={konum.section} onChange={(id) => go({ program: konum.program, section: id })} />
          <div className="ortak-bolum" id="ortak-bolum" role="tabpanel" aria-labelledby={`ortak-alt-${konum.section}`} ref={panel} tabIndex={-1}>
            <p className="ortak-bolum-ust">
              <span className="ortak-bolum-program" data-role={program.role}>
                {program.name}
              </span>
              {program.title}
            </p>
            {bolum}
            <Sira programs={pt.programs} konum={konum} go={(k) => go(k, true)} />
          </div>
        </div>
      </div>
      <Note title="İki programın ortak disiplini">
        <Maddeler items={pt.shared} />
      </Note>
    </>
  );
}

export function PartnershipPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
