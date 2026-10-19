import 'dayjs/locale/tr';
import { Timeline } from '@mantine/core';
import { Month } from '@mantine/dates';
import { AppFrame } from '../components/AppFrame';
import {
  Chart,
  DataTable,
  formatDate,
  Hero,
  Note,
  RoleChip,
  Section,
  Stats,
  StatusChip,
  Target,
  TextLink,
} from '../components/ui';
import { boardMapping, type BoardRow } from '../data/archive';
import { compliance, growthKpis, levels, recruitmentFunnel } from '../data/growth';
import {
  ANNUAL_TRY,
  calendarEvents,
  checkpoints,
  CIRO_TARGET,
  type GovNode,
  governanceTree,
  hiringOrder,
  managerPlan,
  MONTHS,
  NEW_ACTIVE,
  type OpenDecision,
  openDecisions,
  payments,
  RETENTION_SCENARIOS,
  SUBSCRIPTION_EUR,
  SUBSCRIPTION_TRY,
  targetPlan,
  targets,
} from '../data/program';
import { ROLE_LABELS, roles } from '../data/roles';
import type { RoleKey } from '../data/types';
import type { ChartTreeNode, GanttRow } from '../lib/chartSpec';

const lira = (value: number) => `${new Intl.NumberFormat('tr-TR').format(Math.round(value))} ₺`;
const pct = (value: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(value * 100)}`;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(`${iso}T00:00:00`));

/* ---------- İstihdam takvimi: takvim + zaman çizelgesi ---------- */

const CALENDAR_MONTHS = ['2026-10-01', '2026-11-01', '2026-12-01', '2027-01-01'];
const monthTitle = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));

export function HiringPage({ pathname }: { pathname: string }) {
  const byDate = new Map(calendarEvents.map((e) => [e.date, e]));
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="Ortak" title="İstihdam takvimi" lead="Kim, hangi sırayla, hangi tarihte başlıyor." />

      <Section id="sira" index={1} title="İşe alım sırası">
        <Timeline className="hire-timeline" bulletSize={44} lineWidth={2} classNames={{ item: 'hire-item', itemBullet: 'hire-bullet', itemTitle: 'hire-title', itemBody: 'hire-body' }}>
          {hiringOrder.map((h) => (
            <Timeline.Item
              key={h.no}
              bullet={
                <span className="hire-no" data-role={h.role}>
                  {h.no}
                </span>
              }
              title={h.title}
            >
              <p className="hire-date">
                {h.date}
                <StatusChip status={h.status} />
              </p>
              <p className="hire-note">
                {h.count !== '—' ? `${h.count} kişi · ` : ''}
                {h.note}
              </p>
            </Timeline.Item>
          ))}
        </Timeline>
      </Section>

      <Section id="takvim" index={2} title="Takvim" desc="Renkli günler tarihli olaylardır; ayrıntı ayın altında.">
        <div className="cal-grid">
          {CALENDAR_MONTHS.map((month) => {
            const events = calendarEvents.filter((e) => e.date.slice(0, 7) === month.slice(0, 7));
            return (
              <section className="cal" key={month} aria-labelledby={`ay-${month}`}>
                <h3 className="cal-title" id={`ay-${month}`}>
                  {monthTitle(month)}
                </h3>
                <Month
                  month={month}
                  locale="tr"
                  firstDayOfWeek={1}
                  hideOutsideDates
                  static
                  fullWidth
                  weekendDays={[0]}
                  classNames={{ day: 'cal-day', weekday: 'cal-weekday', month: 'cal-month' }}
                  getDayProps={(date) => {
                    // Ay dışı (gizli) günler işaretlenmez; olay yalnız kendi ayında görünür.
                    const event = date.slice(0, 7) === month.slice(0, 7) ? byDate.get(date) : undefined;
                    return event ? { 'data-event': '', 'data-role': event.role, title: event.title } : {};
                  }}
                />
                {events.length ? (
                  <ol className="cal-events">
                    {events.map((e) => (
                      <li key={e.date} data-role={e.role}>
                        <span className="cal-event-date">{shortDate(e.date)}</span>
                        <span className="cal-event-title">{e.title}</span>
                        <span className="cal-event-detail">{e.detail}</span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="cal-empty">20 Ekim’den önce olay yok.</p>
                )}
              </section>
            );
          })}
        </div>
      </Section>
    </AppFrame>
  );
}

/* ---------- 90 gün hedefleri ---------- */

const SCENARIO_LABEL = (r: number) => `Elde tutma ${pct(r)}`;

export function GoalsPage({ pathname }: { pathname: string }) {
  const firstTotal = sum(NEW_ACTIVE);
  const scenarios = RETENTION_SCENARIOS.map((r) => {
    const p = payments(r);
    return { r, months: p.total, ciro: p.total * SUBSCRIPTION_TRY, renew: (p.total - firstTotal) * SUBSCRIPTION_TRY };
  });
  const worst = scenarios[0];
  const gap = CIRO_TARGET - worst.ciro;
  const gapMonths = Math.ceil(CIRO_TARGET / SUBSCRIPTION_TRY - firstTotal);
  const plan = payments(0.7);
  const options = [
    { option: 'Yıllık peşin (10 ay ücreti, 2 ay bedava)', unit: lira(ANNUAL_TRY), count: Math.ceil(gap / (ANNUAL_TRY - SUBSCRIPTION_TRY)), note: 'Aylık yerine peşin ödeyen aktif satıcı' },
    { option: 'Pazarlama çözümü 30K', unit: '30.000 ₺', count: Math.ceil(gap / 30_000), note: 'Paket içeriği 31 Ekim’de netleşir' },
    { option: 'Pazarlama çözümü 90K', unit: '90.000 ₺', count: Math.ceil(gap / 90_000), note: 'Paket içeriği 31 Ekim’de netleşir' },
    { option: 'Pazarlama çözümü 500K', unit: '500.000 ₺', count: Math.ceil(gap / 500_000), note: 'Kurumsal satış' },
    { option: 'Üye satıcıyı aktife çevirmek', unit: `${SUBSCRIPTION_EUR} € / ay`, count: gapMonths, note: `500 üyenin ${pct(gapMonths / 500)} oranı` },
  ];

  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="Ortak" title="90 gün hedefleri" lead="1 Kasım 2026 – 30 Ocak 2027. Aktif satıcı ayda 399 € öder; bazıları ilk aydan sonra bırakabilir.">
        <Stats items={targets} />
      </Hero>

      <Section
        id="kopru"
        index={1}
        title="Ciro köprüsü"
        desc={`100 aktif satıcının ilk ödemeleri ${lira(firstTotal * SUBSCRIPTION_TRY)}. Hedef için 90 günde ${Math.ceil(CIRO_TARGET / SUBSCRIPTION_TRY)} satıcı-ay ödeme gerekir; aylık elde tutma ≥ %66 olmalı.`}
      >
        <Chart
          id="kopru"
          title="Aylık elde tutma oranına göre 90 günlük ciro"
          summary={scenarios.map((s) => `${SCENARIO_LABEL(s.r)}: ${lira(s.ciro)}`).join('; ')}
          spec={{
            kind: 'kopru',
            scenarios: scenarios.map((s) => pct(s.r)),
            first: scenarios.map(() => firstTotal * SUBSCRIPTION_TRY),
            renew: scenarios.map((s) => s.renew),
            target: CIRO_TARGET,
          }}
        />
        <DataTable
          id="senaryo"
          title="Senaryolar"
          columns={[
            { key: 'r', header: 'Aylık elde tutma', nowrap: true, rowHeader: true, render: (s: (typeof scenarios)[number]) => pct(s.r) },
            { key: 'm', header: 'Satıcı-ay', nowrap: true, render: (s) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(s.months) },
            { key: 'c', header: 'Ciro', nowrap: true, render: (s) => lira(s.ciro) },
            { key: 'g', header: 'Hedefe göre', nowrap: true, render: (s) => (s.ciro >= CIRO_TARGET ? `+${lira(s.ciro - CIRO_TARGET)}` : `−${lira(CIRO_TARGET - s.ciro)}`) },
          ]}
          rows={scenarios}
        />
      </Section>

      <Section
        id="acik"
        index={2}
        title="Açığı kapatma"
        desc={`En kötü durumda (kimse yenilemez) açık ${lira(gap)} = ${gapMonths} satıcı-ay. Seçeneklerden biri yeter.`}
      >
        <DataTable
          id="acik"
          title="Açığı tek başına kapatan adet"
          columns={[
            { key: 'o', header: 'Seçenek', minWidth: '16rem', rowHeader: true, render: (o: (typeof options)[number]) => o.option },
            { key: 'u', header: 'Birim', nowrap: true, render: (o) => o.unit },
            { key: 'c', header: 'Gereken adet', nowrap: true, render: (o) => o.count },
            { key: 'n', header: 'Not', minWidth: '14rem', render: (o) => o.note },
          ]}
          rows={options}
        />
      </Section>

      <Section id="aylik" index={3} title="Aylık ciro" desc="Plan senaryosu: aylık elde tutma %70.">
        <Chart
          id="gelir-ay"
          title="İlk ödemeler, yenilemeler ve kümülatif ciro"
          summary={`${MONTHS.map((m, i) => `${m}: ${lira(plan.monthly[i] * SUBSCRIPTION_TRY)}`).join('; ')}. Toplam ${lira(plan.total * SUBSCRIPTION_TRY)}.`}
          spec={{
            kind: 'gelir-ay',
            months: MONTHS,
            first: NEW_ACTIVE.map((n) => n * SUBSCRIPTION_TRY),
            renew: plan.renewals.map((n) => n * SUBSCRIPTION_TRY),
            target: CIRO_TARGET,
          }}
        />
      </Section>

      <Section id="kaynak" index={4} title="Kaynaklara göre" desc="Yeni aktif satıcı ve kayıt; kapasite açığı kararı 30 Aralık.">
        <Chart
          id="kaynak-ay"
          title="Yeni aktif satıcı: kaynak × ay"
          summary={targetPlan.map((t) => `${t.source}: ${t.aktif.join(', ')}`).join('; ')}
          spec={{ kind: 'kaynak-ay', months: MONTHS, unit: 'Aktif satıcı', series: targetPlan.map((t) => ({ name: t.short, role: t.role, values: t.aktif })) }}
        />
        <DataTable
          id="kaynak"
          title="Kaynak × ay (kayıt / yeni aktif)"
          columns={[
            { key: 's', header: 'Kaynak', minWidth: '15rem', rowHeader: true, render: (t: (typeof targetPlan)[number]) => t.source },
            ...MONTHS.map((m, i) => ({ key: m, header: m, nowrap: true, render: (t: (typeof targetPlan)[number]) => `${t.kayit[i]} / ${t.aktif[i]}` })),
            { key: 't', header: 'Toplam', nowrap: true, render: (t) => `${sum(t.kayit)} / ${sum(t.aktif)}` },
          ]}
          rows={[...targetPlan, { source: 'Toplam', short: 'Toplam', role: 'yonetici' as RoleKey, kayit: [0, 1, 2].map((i) => sum(targetPlan.map((t) => t.kayit[i]))), aktif: NEW_ACTIVE }]}
          rowTone={(t) => (t.gap ? 'gap' : t.source === 'Toplam' ? 'total' : undefined)}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- Eylem planı: Gantt + tablo ---------- */

interface ActionRow {
  who: RoleKey;
  label: string;
  from: string;
  to: string;
  action: string;
  target: string;
  milestone?: boolean;
}

const actionRows: ActionRow[] = [
  ...managerPlan.map((p, i) => ({ who: 'yonetici' as RoleKey, label: `İsmail Karaca · ${i + 1}`, ...p })),
  ...roles.flatMap((role) => role.plan.map((p, i) => ({ who: role.slug, label: `${role.shortTitle} · ${i + 1}`, ...p }))),
];

export function PlanPage({ pathname }: { pathname: string }) {
  const start = actionRows.reduce((min, r) => (r.from < min ? r.from : min), actionRows[0].from);
  const end = actionRows.reduce((max, r) => (r.to > max ? r.to : max), actionRows[0].to);
  const rows: GanttRow[] = actionRows.map((r) => ({ name: r.label, from: r.from, to: r.to, role: r.who, text: `${r.action} · Hedef: ${r.target}`, milestone: r.milestone }));
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="Ortak" title="Eylem planı" lead={`istoc.com genel planı: ${formatDate(start)} – ${formatDate(end)}. Her satır tarihli bir eylem ve ölçülebilir hedef.`} />

      <Section id="gantt" index={1} title="Gantt şeması" desc="Kesikli çizgiler: 60. gün (30 Aralık) ve 90. gün (30 Ocak) kontrolleri.">
        <Chart
          id="gantt"
          title="Kişi × zaman"
          summary={`${actionRows.length} eylem, ${formatDate(start)} ile ${formatDate(end)} arasında. Kontroller 30 Aralık ve 30 Ocak.`}
          spec={{
            kind: 'gantt',
            start,
            end,
            rows,
            marks: [
              { date: '2026-11-01', label: 'Başlangıç' },
              { date: '2026-12-30', label: '60. gün' },
              { date: '2027-01-30', label: '90. gün' },
            ],
          }}
          size="xxl"
          wide
        />
      </Section>

      <Section id="tablo" index={2} title="Eylemler">
        <DataTable<ActionRow>
          id="eylem"
          title="Eylem, tarih ve hedef"
          columns={[
            { key: 'who', header: 'Kim', nowrap: true, rowHeader: true, render: (r) => <RoleChip role={r.who} /> },
            { key: 'when', header: 'Tarih', nowrap: true, render: (r) => `${shortDate(r.from)} – ${shortDate(r.to)}` },
            { key: 'action', header: 'Eylem', minWidth: '20rem', render: (r) => r.action },
            { key: 'target', header: 'Hedef', minWidth: '14rem', render: (r) => <Target row={r} /> },
          ]}
          rows={actionRows}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- Karar yetkisi ve kontrol noktaları ---------- */

const govChart = (node: GovNode): ChartTreeNode => ({ name: node.name, role: node.role ?? 'yonetici', children: node.children?.map(govChart) });

export function AuthorityPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="Ortak" title="Karar yetkisi ve kontrol noktaları" lead="Kim neye karar verir; hangi tarihte hangi eşik ölçülür." />

      <Section id="yetki" index={1} title="Karar yetkisi">
        <Chart
          id="yetki"
          title="Yatırımcı → İsmail Karaca → kararlar"
          summary="Yatırımcı ürün, bütçe ve kayıp tavanına karar verir. İsmail Karaca maliyet, kanıt ve kapasiteyi yönetir. Harcama yetki sınırı içinde İsmail Karaca, sınırı aşarsa yatırımcı karar verir. Kanal yalnız A (iç satış ve saha, seçili) veya B (dijital müşteri edinme). Kontroller 30 Aralık ve 30 Ocak: sürdür, iyileştir veya durdur."
          spec={{ kind: 'gov', root: govChart(governanceTree) }}
          size="xxl"
          wide
        />
      </Section>

      <Section id="kontrol" index={2} title="Kontrol noktaları" desc="Ciro değerleri aylık %70 elde tutma senaryosuyla.">
        <Chart
          id="kontrol"
          title="Kümülatif aktif satıcı ve ciro"
          summary={checkpoints.map((c) => `${c.day} (${formatDate(c.date)}): ${c.aktif} aktif satıcı, ${lira(c.ciro)}`).join('; ')}
          spec={{ kind: 'checkpoint', days: checkpoints.map((c) => c.day), aktif: checkpoints.map((c) => c.aktif), ciro: checkpoints.map((c) => c.ciro), target: CIRO_TARGET }}
        />
        <DataTable
          id="kontrol"
          title="Eşik ve karar"
          columns={[
            { key: 'd', header: 'Kontrol', nowrap: true, rowHeader: true, render: (c: (typeof checkpoints)[number]) => `${c.day} · ${shortDate(c.date)}` },
            { key: 'a', header: 'Aktif satıcı', nowrap: true, render: (c) => `≥ ${c.aktif}` },
            { key: 'k', header: 'Kayıt', nowrap: true, render: (c) => `≥ ${c.kayit}` },
            { key: 'c', header: 'Kümülatif ciro', nowrap: true, render: (c) => `≥ ${lira(c.ciro)}` },
            { key: 'r', header: 'Karar', minWidth: '16rem', render: (c) => c.rule },
          ]}
          rows={checkpoints}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- Karar bekleyenler ---------- */

export function PendingPage({ pathname }: { pathname: string }) {
  const sorted = [...openDecisions].sort((a, b) => a.deadline.localeCompare(b.deadline));
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="Ortak" title="Karar bekleyenler" lead={`${openDecisions.length} karar; her birinin sahibi ve son tarihi var.`} />

      <Section id="takvim" index={1} title="Son tarihler">
        <Chart
          id="son-tarih"
          title="Karar × son tarih"
          summary={sorted.map((d) => `${d.topic}: ${shortDate(d.deadline)}, ${ROLE_LABELS[d.owner]}`).join('; ')}
          spec={{ kind: 'deadlines', start: '2026-10-19', end: '2027-02-05', items: sorted.map((d) => ({ name: d.topic, date: d.deadline, role: d.owner })) }}
          size="xl"
          wide
        />
      </Section>

      <Section id="liste" index={2} title="Kararlar">
        <DataTable<OpenDecision>
          id="karar"
          title="Konu, öneri, karar veren"
          columns={[
            { key: 'deadline', header: 'Son tarih', nowrap: true, rowHeader: true, render: (d) => shortDate(d.deadline) },
            { key: 'topic', header: 'Konu', minWidth: '14rem', render: (d) => d.topic },
            { key: 'proposal', header: 'Öneri', minWidth: '18rem', render: (d) => d.proposal },
            {
              key: 'owner',
              header: 'Karar veren',
              nowrap: true,
              render: (d) => (
                <>
                  <RoleChip role={d.owner} />
                  {d.preparer ? <span className="cell-sub">Hazırlayan: {ROLE_LABELS[d.preparer]}</span> : null}
                </>
              ),
            },
          ]}
          rows={sorted}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- Çok katmanlı pazarlama ağı ---------- */

const LEVEL_ROLES: RoleKey[] = ['yonetici', 'ekip-lideri', 'saha-uzmani', 'pazarlamaci'];

export function GrowthPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ağaç 3 · Saha satış"
        title="Çok katmanlı pazarlama ağı (MLM)"
        lead="Doğrudan satış modeli: bağımsız satış temsilcileri Meta reklamlarıyla bulunur; kazanç yalnız gerçek satıştan doğar."
      />

      <Section id="kademe" index={1} title="Kademeler" desc="30 Ocak 2027 hedefi.">
        <Chart
          id="piramit"
          title="Kademe piramidi"
          summary={levels.map((l) => `${l.level} ${l.name}: ${l.count} kişi`).join('; ')}
          spec={{ kind: 'piramit', items: levels.map((l, i) => ({ name: l.name, count: l.count, role: LEVEL_ROLES[i] })) }}
        />
        <DataTable
          id="kademe"
          title="Kademe ve kişi sayısı"
          columns={[
            { key: 'l', header: 'Seviye', nowrap: true, rowHeader: true, render: (l: (typeof levels)[number]) => l.level },
            { key: 'n', header: 'Kademe', minWidth: '14rem', render: (l) => l.name },
            { key: 'c', header: 'Kişi', nowrap: true, render: (l) => l.count },
          ]}
          rows={levels}
        />
      </Section>

      <Section id="huni" index={2} title="Haftalık işe alım hunisi" desc="Meta reklamı 5.000 ₺ / hafta (~20.000 ₺ / ay) → ayda en fazla ~2 aktif temsilci.">
        <Chart
          id="huni"
          title="Başvurudan aktif temsilciye (haftalık)"
          summary={recruitmentFunnel.map((f) => `${f.stage}: ${new Intl.NumberFormat('tr-TR').format(f.value)}`).join('; ')}
          spec={{ kind: 'huni', role: 'ekip-lideri', items: recruitmentFunnel.map((f) => ({ name: f.stage, value: f.value })) }}
          size="lg"
        />
      </Section>

      <Section id="hedef" index={3} title="Ağ hedefleri">
        <DataTable
          id="ag-hedef"
          title="Ölçüt, hedef, zaman"
          columns={[
            { key: 'm', header: 'Ölçüt', minWidth: '14rem', rowHeader: true, render: (k: (typeof growthKpis)[number]) => k.metric },
            { key: 't', header: 'Hedef', minWidth: '12rem', render: (k) => k.target },
            { key: 'w', header: 'Ne zaman', minWidth: '10rem', render: (k) => k.when },
          ]}
          rows={growthKpis}
        />
        <Note title="Uyum kuralları">
          <ul className="bullets">
            {compliance.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </Note>
      </Section>
    </AppFrame>
  );
}

/* ---------- Arşiv: tahtadan karara ---------- */

export function ArchivePage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="Arşiv" title="Tahtadan karara" lead="19 Ekim tahta notlarının plandaki karşılığı. Toplantı için gerekli değil; kayıt amaçlı." />
      <DataTable<BoardRow>
        id="tahta"
        title="Tahta notu → karar → sayfa"
        columns={[
          { key: 'board', header: 'Tahtadaki not', minWidth: '16rem', rowHeader: true, render: (r) => r.board },
          { key: 'decision', header: 'Plandaki karar', minWidth: '18rem', render: (r) => r.decision },
          { key: 'where', header: 'Sayfa', nowrap: true, render: (r) => <TextLink to={r.where.path}>{r.where.label}</TextLink> },
        ]}
        rows={boardMapping}
      />
    </AppFrame>
  );
}

export function NotFoundPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="404" title="Sayfa bulunamadı" lead="Aradığınız sayfa taşınmış veya kaldırılmış olabilir." />
      <p>
        <TextLink to="/" standalone>
          Organizasyon şemasına dön
        </TextLink>
      </p>
    </AppFrame>
  );
}
