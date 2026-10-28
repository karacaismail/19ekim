import 'dayjs/locale/tr';
import { Timeline } from '@mantine/core';
import { Month } from '@mantine/dates';
import { AppFrame } from '../components/AppFrame';
import {
  Chart,
  DataTable,
  formatDate,
  Note,
  RoleChip,
  Section,
  Stats,
  StatusChip,
  Target,
  TextLink,
} from '../components/ui';
import { PageHeader } from '../components/PageHeader';
import { boardMapping, type BoardRow } from '../data/archive';
import type { CrmStage, GovNode, OpenDecision, PayRule, WorkPeriod } from '../data/program';
import { ROLE_LABELS } from '../data/roles';
import type { RoleKey } from '../data/types';
import { useModel } from '../components/ModelContext';
import { Araclar, SenaryoSecimi } from '../components/Senaryo';
import type { StaffResult } from '../data/staffing';
import { addDays, longDate, monthStart, nextMonth } from '../lib/dates';
import { useScenario } from '../lib/scenario';
import type { ChartTreeNode, GanttRow } from '../lib/chartSpec';

const lira = (value: number) => `${new Intl.NumberFormat('tr-TR').format(Math.round(value))} ₺`;
const pct = (value: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(value * 100)}`;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(`${iso}T00:00:00`));

/* ---------- İstihdam takvimi: takvim + zaman çizelgesi ---------- */

const monthTitle = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));

function HiringContent() {
  const m = useModel();
  const { calendarEvents, hiringOrder } = m;
  const [sid, setSid] = useScenario();
  const st = m.staffing.byId[sid];
  const sc = st.scenario;
  const H = m.staffing.horizon;
  const kisaTarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${iso}T00:00:00`));
  /** Takvim ayları: ilk olaydan son olaya. */
  const CALENDAR_MONTHS: string[] = [];
  for (let month = monthStart(calendarEvents[0].date); month <= calendarEvents[calendarEvents.length - 1].date; month = nextMonth(month)) CALENDAR_MONTHS.push(month);

  const byDate = new Map(calendarEvents.map((e) => [e.date, e]));
  return (
    <>
      <PageHeader title="İstihdam takvimi" purpose="Kim, hangi sırayla, hangi tarihte başlıyor." />

      <Section id="sira" index={1} title="İşe alım sırası">
        <Timeline className="hire-timeline" bulletSize={44} lineWidth={2} radius={0} classNames={{ item: 'hire-item', itemBullet: 'hire-bullet', itemTitle: 'hire-title', itemBody: 'hire-body' }}>
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
                  <p className="cal-empty">Bu ayda tarihli olay yok.</p>
                )}
              </section>
            );
          })}
        </div>
      </Section>

      <Section
        id="katki"
        index={3}
        title="Görev, gider ve gelir katkısı (senaryo)"
        desc={`İstihdam planı gelir planına yedirilmiştir (kullanıcı kararı 2026-10-27): her rolün görevi, işveren maliyeti ve seçili senaryoda ${H} ayda gelire katkısı. Katkı, gelir planı simülasyonunda o kaynak olmasaydı kaybedilecek gelirdir; dolaylı rollerin katkısı modellenmez. Seçim gelir planı ve nakit akış tablosuyla ortaktır.`}
        tools={
          <Araclar role={sc.role}>
            <SenaryoSecimi scenarios={m.revenue.scenarios} value={sid} onChange={setSid} />
          </Araclar>
        }
      >
        <Stats
          items={[
            { label: `Kadro gideri, ${H} ay`, value: lira(st.toplam.gider), note: `${sc.name} · maaşlı roller + reklam bütçesi + temsilci primi` },
            { label: `Gelire katkı, ${H} ay`, value: lira(st.toplam.katki), note: `${sc.name} · kaynakların toplamı` },
            { label: 'Net (katkı − gider)', value: lira(st.toplam.net), note: 'Ofis, yazılım ekibi ve YZ araçları hariç' },
          ]}
        />
        <DataTable
          id="istihdam-katki"
          title={`Rol, görev, gider ve gelire katkı, ${H} ay (${sc.name.toLocaleLowerCase('tr-TR')})`}
          tools={
            <Araclar role={sc.role}>
              <SenaryoSecimi scenarios={m.revenue.scenarios} value={sid} onChange={setSid} />
            </Araclar>
          }
          columns={[
            { key: 'r', header: 'Rol', minWidth: '12rem', rowHeader: true, render: (x: StaffResult) => <RoleChip role={x.role.role} label={x.role.name} /> },
            { key: 'g', header: 'Görev', minWidth: '20rem', render: (x) => x.role.gorev },
            { key: 'y', header: 'Gelire katkı yolu', minWidth: '16rem', render: (x) => x.role.katkiYolu },
            { key: 's', header: 'Başlangıç', nowrap: true, render: (x) => kisaTarih(x.role.startIso) },
            { key: 'm', header: 'Aylık maliyet', nowrap: true, render: (x) => (x.role.katki.kind === 'rep' ? `${lira(m.params.commission)} / satış` : lira(x.role.maliyet)) },
            { key: 'c', header: `${H} ay gider`, nowrap: true, render: (x) => lira(x.gider) },
            { key: 'k', header: 'Gelire katkı', summary: true, nowrap: true, render: (x) => (x.dogrudan ? lira(x.katki) : 'Dolaylı') },
            { key: 'n', header: 'Net', nowrap: true, render: (x) => lira(x.net) },
          ]}
          rows={st.rows}
          rowKey={(x) => x.role.id}
          rowTone={(x) => (x.dogrudan ? undefined : 'total')}
        />
        <p>
          <TextLink to="/gelir-plani/#kadro" standalone>
            Gelir planında kadro, dijital strateji ve başabaş
          </TextLink>
        </p>
      </Section>
    </>
  );
}

/* ---------- 90 gün hedefleri ---------- */

const SCENARIO_LABEL = (r: number) => `Elde tutma ${pct(r)}`;

function GoalsContent() {
  const m = useModel();
  const { ANNUAL_TRY, CIRO_TARGET, MONTHS, NEW_ACTIVE, payments, RETENTION_SCENARIOS, SUBSCRIPTION_EUR, SUBSCRIPTION_TRY, targetPlan, targets, dates, labels } = m;

  const firstTotal = sum(NEW_ACTIVE);
  const scenarios = RETENTION_SCENARIOS.map((r) => {
    const p = payments(r);
    return { r, months: p.total, ciro: p.total * SUBSCRIPTION_TRY, renew: (p.total - firstTotal) * SUBSCRIPTION_TRY };
  });
  const worst = scenarios[0];
  const gap = CIRO_TARGET - worst.ciro;
  const gapMonths = Math.ceil(CIRO_TARGET / SUBSCRIPTION_TRY - firstTotal);
  const plan = payments(m.planRetention);
  const options = [
    { option: 'Yıllık peşin (10 ay ücreti, 2 ay bedava)', unit: lira(ANNUAL_TRY), count: Math.ceil(gap / (ANNUAL_TRY - SUBSCRIPTION_TRY)), note: 'Aylık yerine peşin ödeyen aktif satıcı' },
    { option: 'Üye satıcıyı aktife çevirmek', unit: `${SUBSCRIPTION_EUR} € / ay`, count: gapMonths, note: `500 üyenin ${pct(gapMonths / 500)} oranı` },
  ];

  return (
    <>
      <PageHeader
        title="90 gün hedefleri"
        purpose={`Aktif satıcı ayda ${SUBSCRIPTION_EUR} € öder; bazıları ilk aydan sonra bırakabilir.`}
        meta={[{ label: 'Dönem', value: `${longDate(dates.start)} – ${longDate(dates.day90)}` }]}
      >
        <Stats items={targets} />
      </PageHeader>

      <Section
        id="kopru"
        index={1}
        title="Ciro köprüsü"
        desc={`${firstTotal} aktif satıcının ilk ödemeleri ${lira(firstTotal * SUBSCRIPTION_TRY)}. Hedef için 90 günde ${Math.ceil(CIRO_TARGET / SUBSCRIPTION_TRY)} satıcı-ay ödeme gerekir; ${m.retentionThreshold === null ? 'abonelik tek başına yetmez' : `aylık elde tutma ≥ ${pct(m.retentionThreshold)} olmalı`}.`}
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
            { key: 'c', header: 'Ciro', summary: true, nowrap: true, render: (s) => lira(s.ciro) },
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
            { key: 'c', header: 'Gereken adet', summary: true, nowrap: true, render: (o) => o.count },
            { key: 'n', header: 'Not', minWidth: '14rem', render: (o) => o.note },
          ]}
          rows={options}
        />
      </Section>

      <Section id="aylik" index={3} title="Aylık ciro" desc={`Plan senaryosu: aylık elde tutma ${pct(m.planRetention)}.`}>
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

      <Section id="kaynak" index={4} title="Kaynaklara göre" desc={`Yeni aktif satıcı ve kayıt. Kapasite açığı (45 kayıt, 8 aktif) ${shortDate(dates.dec)} itibarıyla Aralık takviyesiyle (${labels.sahaDecLabel || "yok"}) kapanır.`}>
        <Chart
          id="kaynak-ay"
          title="Yeni aktif satıcı: kaynak × ay"
          summary={targetPlan.map((t) => `${t.source}: ${t.aktif.join(', ')}`).join('; ')}
          spec={{ kind: 'kaynak-ay', months: MONTHS, unit: 'Aktif satıcı', series: targetPlan.map((t) => ({ name: t.short, role: t.role, values: t.aktif })) }}
        />
        <DataTable
          id="kaynak"
          title="Kaynak × ay (kayıt / yeni aktif)"
          kayit="sutun"
          ozetSatir={(t) => t.source === 'Toplam'}
          columns={[
            { key: 's', header: 'Kaynak', minWidth: '15rem', rowHeader: true, render: (t: (typeof targetPlan)[number]) => t.source },
            ...MONTHS.map((m, i) => ({ key: m, header: m, nowrap: true, render: (t: (typeof targetPlan)[number]) => `${t.kayit[i]} / ${t.aktif[i]}` })),
            { key: 't', header: 'Toplam', nowrap: true, render: (t) => `${sum(t.kayit)} / ${sum(t.aktif)}` },
          ]}
          rows={[...targetPlan, { source: 'Toplam', short: 'Toplam', role: 'yonetici' as RoleKey, kayit: [0, 1, 2].map((i) => sum(targetPlan.map((t) => t.kayit[i]))), aktif: NEW_ACTIVE }]}
          rowTone={(t) => (t.source === 'Toplam' ? 'total' : undefined)}
        />
      </Section>
    </>
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


function PlanContent() {
  const m = useModel();
  const { managerPlan, roles, dates } = m;
  const actionRows: ActionRow[] = [
    ...managerPlan.map((p, i) => ({ who: 'yonetici' as RoleKey, label: `İsmail Karaca · ${i + 1}`, ...p })),
    ...roles.flatMap((role) => role.plan.map((p, i) => ({ who: role.slug, label: `${role.shortTitle} · ${i + 1}`, ...p }))),
  ];

  const start = actionRows.reduce((min, r) => (r.from < min ? r.from : min), actionRows[0].from);
  const end = actionRows.reduce((max, r) => (r.to > max ? r.to : max), actionRows[0].to);
  const rows: GanttRow[] = actionRows.map((r) => ({ name: r.label, from: r.from, to: r.to, role: r.who, text: `${r.action} · Hedef: ${r.target}`, milestone: r.milestone }));
  return (
    <>
      <PageHeader title="Eylem planı" purpose="istoc.com genel planı: her satır tarihli bir eylem ve ölçülebilir hedef." meta={[{ label: 'Dönem', value: `${formatDate(start)} – ${formatDate(end)}` }]} />

      <Section id="gantt" index={1} title="Gantt şeması" desc={`Kesikli çizgiler: 60. gün (${shortDate(dates.day60)}) ve 90. gün (${shortDate(dates.day90)}) kontrolleri.`}>
        <Chart
          id="gantt"
          title="Kişi × zaman"
          summary={`${actionRows.length} eylem, ${formatDate(start)} ile ${formatDate(end)} arasında. Kontroller ${shortDate(dates.day60)} ve ${shortDate(dates.day90)}.`}
          spec={{
            kind: 'gantt',
            start,
            end,
            rows,
            marks: [
              { date: dates.start, label: 'Başlangıç' },
              { date: dates.day60, label: '60. gün' },
              { date: dates.day90, label: '90. gün' },
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
            { key: 'when', header: 'Tarih', summary: true, nowrap: true, render: (r) => `${shortDate(r.from)} – ${shortDate(r.to)}` },
            { key: 'action', header: 'Eylem', minWidth: '20rem', render: (r) => r.action },
            { key: 'target', header: 'Hedef', minWidth: '14rem', render: (r) => <Target row={r} /> },
          ]}
          rows={actionRows}
        />
      </Section>
    </>
  );
}

/* ---------- Karar yetkisi ve kontrol noktaları ---------- */

const govChart = (node: GovNode): ChartTreeNode => ({ name: node.name, role: node.role ?? 'yonetici', children: node.children?.map(govChart) });

function AuthorityContent() {
  const m = useModel();
  const { checkpoints, governanceTree, CIRO_TARGET, dates } = m;

  return (
    <>
      <PageHeader title="Karar yetkisi ve kontrol noktaları" purpose="Kim neye karar verir; hangi tarihte hangi eşik ölçülür." />

      <Section id="yetki" index={1} title="Karar yetkisi">
        <Chart
          id="yetki"
          title="Yatırımcı → İsmail Karaca → kararlar"
          summary={`Yatırımcı ürün, bütçe ve kayıp tavanına karar verir. İsmail Karaca maliyet, kanıt ve kapasiteyi yönetir. Harcama yetki sınırı içinde İsmail Karaca, sınırı aşarsa yatırımcı karar verir. Kanal yalnız A (iç satış ve saha, seçili) veya B (dijital müşteri edinme). Kontroller ${shortDate(dates.day60)} ve ${shortDate(dates.day90)}: sürdür, iyileştir veya durdur.`}
          spec={{ kind: 'gov', root: govChart(governanceTree) }}
          size="xxl"
          wide
        />
      </Section>

      <Section id="kontrol" index={2} title="Kontrol noktaları" desc={`Ciro değerleri aylık ${pct(m.planRetention)} elde tutma senaryosuyla.`}>
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
            { key: 'r', header: 'Karar', summary: true, minWidth: '16rem', render: (c) => c.rule },
          ]}
          rows={checkpoints}
        />
      </Section>
    </>
  );
}

/* ---------- Karar bekleyenler ---------- */

const CUMULATIVE_WEEKS = 30;

/** Kişi başı kümülatif fazla çalışma (hafta 1 = programın ilk iş günü). */
function overtimeSeries(startWeek: number, perWeek: number, lastWeek: number) {
  let total = 0;
  return Array.from({ length: CUMULATIVE_WEEKS }, (_, w) => {
    if (w + 1 >= startWeek && w + 1 <= lastWeek) total += perWeek;
    return total;
  });
}

function PendingContent() {
  const m = useModel();
  const { openDecisions, decisions, payRules, crmStages, LEGAL_LIMITS, workPeriods, OVERTIME_CAP, overtimeUsed, overtimeHourly, dates, params } = m;
  const COMMISSION_PER_SALE = params.commission;

  const sorted = [...openDecisions].sort((a, b) => a.deadline.localeCompare(b.deadline));
  const [p1, p2] = workPeriods;
  const weekLabels = Array.from({ length: CUMULATIVE_WEEKS }, (_, w) => shortDate(addDays(dates.firstDay, w * 7)));
  const decWeek = Math.max(1, Math.round((new Date(dates.dec).getTime() - new Date(dates.firstDay).getTime()) / (7 * 86_400_000)) + 1);
  const deadlines = sorted.map((d) => d.deadline);
  const crossWeek = Math.ceil(OVERTIME_CAP / Math.max(1, p1.overtimePerWeek));
  const monthlyOvertime = Math.round((p1.overtimePerWeek * 52) / 12);
  return (
    <>
      <PageHeader title="Karar bekleyenler" purpose={`${openDecisions.length} karar bekliyor; ${decisions.length} karar 19 Ekim 2026’da kesinleşti.`} />

      <Section id="bekleyen" index={1} title="Bekleyen kararlar">
        <Chart
          id="son-tarih"
          title="Karar × son tarih"
          summary={sorted.map((d) => `${d.topic}: ${shortDate(d.deadline)}, ${ROLE_LABELS[d.owner]}`).join('; ')}
          spec={{ kind: 'deadlines', start: addDays(deadlines[0], -7), end: addDays(deadlines[deadlines.length - 1], 14), items: sorted.map((d) => ({ name: d.topic, date: d.deadline, role: d.owner })) }}
          size="md"
          wide
        />
        <DataTable<OpenDecision>
          id="karar"
          title="Konu, öneri, karar veren"
          columns={[
            { key: 'deadline', header: 'Son tarih', nowrap: true, rowHeader: true, render: (d) => shortDate(d.deadline) },
            { key: 'topic', header: 'Konu', minWidth: '14rem', render: (d) => d.topic },
            { key: 'proposal', header: 'Öneri', minWidth: '18rem', render: (d) => d.proposal },
            {
              key: 'owner',
              header: 'Karar veren', summary: true,
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

      <Section id="kesin" index={2} title="Kesinleşen kararlar" desc="19 Ekim 2026; ayrıntılar aşağıdaki bölümlerde.">
        <DataTable
          id="kesin"
          title="Konu ve karar"
          columns={[
            { key: 'topic', header: 'Konu', minWidth: '12rem', rowHeader: true, render: (d: (typeof decisions)[number]) => d.topic },
            { key: 'decision', header: 'Karar', summary: true, minWidth: '24rem', render: (d) => d.decision },
          ]}
          rows={decisions}
        />
      </Section>

      <Section
        id="ucret"
        index={3}
        title="Ücret ve prim"
        desc={`İşveren maliyeti = maaş × ${params.costFactor.toLocaleString('tr-TR')} (SGK, yemek, bilgisayar, vergi ve diğerleri). Prim yalnız kriterleri tamamlanan satıştan doğar. Saha kotası: ay içinde ${lira(m.quota)} satış.`}
      >
        <DataTable<PayRule>
          id="ucret"
          title="Kişi başı, aylık"
          columns={[
            { key: 'who', header: 'Kim', minWidth: '13rem', rowHeader: true, render: (r) => r.who },
            { key: 'status', header: 'Statü', minWidth: '12rem', render: (r) => r.status },
            { key: 'fixed', header: 'Sabit', minWidth: '12rem', render: (r) => r.fixed },
            { key: 'cost', header: 'İşveren maliyeti', summary: true, minWidth: '11rem', render: (r) => r.cost },
            { key: 'commission', header: 'Prim', minWidth: '18rem', render: (r) => r.commission },
          ]}
          rows={payRules}
        />
        <Note title="Hesap">
          <p>
            90 günlük personel maliyeti (işveren): {lira(m.staffCost90)}; bunun {lira(m.sahaCost90)} kadarı saha ekibi ({params.sahaCount} kişi 3 ay, {params.sahaDecCount} kişi {m.decMonths} ay).
          </p>
          <p>
            Bir temsilci satışında toplam pay en çok {lira(m.maxPayout)}: temsilci {lira(params.commission)} + sponsor {lira(params.sponsorShare)} + ekip lideri {lira(params.leadTeamShare)}.
          </p>
        </Note>
      </Section>

      <Section id="crm" index={4} title="CRM aşamaları ve prim kriterleri" desc="Frappe CRM. Prim kriterleri aşamalarla aynıdır: Onboarding, Mağaza açıldı, İlk ürünler ve Ödeme tamamlanınca prim hak edilir.">
        <Chart
          id="crm-asamalari"
          title="Adaydan yenilemeye"
          summary={crmStages.map((c, i) => `${i + 1}. ${c.stage}${c.commission ? ' (prim kriteri)' : ''}`).join('; ')}
          spec={{
            kind: 'chain',
            steps: crmStages.map((c, i) => ({
              name: `${i + 1}. ${c.stage}`,
              sub: c.stage === 'Ödeme' ? `Prim hak edilir: ${lira(COMMISSION_PER_SALE)}` : c.commission ? 'Prim kriteri' : c.owner,
              role: c.commission ? 'saha-uzmani' : 'yonetici',
            })),
          }}
          size="xxl"
        />
        <DataTable<CrmStage>
          id="crm"
          title="Aşama, geçiş kuralı, sorumlu"
          columns={[
            { key: 'stage', header: 'Aşama', nowrap: true, rowHeader: true, render: (r) => r.stage },
            { key: 'rule', header: 'Geçiş kuralı', summary: true, minWidth: '18rem', render: (r) => r.rule },
            { key: 'owner', header: 'Sorumlu', minWidth: '11rem', render: (r) => r.owner },
            { key: 'commission', header: 'Prim kriteri', nowrap: true, render: (r) => (r.commission ? 'Evet' : 'Hayır') },
          ]}
          rows={crmStages}
        />
      </Section>

      <Section
        id="mesai"
        index={5}
        title="Mesai modeli: yasal tavan"
        desc={`4857 sayılı İş Kanunu. Yıllık fazla çalışma tavanı ${OVERTIME_CAP} saat; sayım işe girişten itibaren 12 ay (en temkinli yorum).`}
      >
        <DataTable
          id="yasal"
          title="Yasal sınırlar"
          columns={[
            { key: 'rule', header: 'Kural', minWidth: '13rem', rowHeader: true, render: (r: (typeof LEGAL_LIMITS)[number]) => r.rule },
            { key: 'limit', header: 'Sınır', summary: true, minWidth: '16rem', render: (r) => r.limit },
            { key: 'source', header: 'Dayanak', minWidth: '11rem', render: (r) => r.source },
          ]}
          rows={LEGAL_LIMITS}
        />
        <DataTable<WorkPeriod>
          id="donem"
          title="Dönemler"
          columns={[
            { key: 'name', header: 'Dönem', minWidth: '12rem', rowHeader: true, render: (r) => <>{r.name}<span className="cell-sub">{shortDate(r.from)} – {shortDate(r.to)}</span></> },
            { key: 'week', header: 'Hafta içi ve Cumartesi', minWidth: '18rem', render: (r) => <>{r.weekday}<span className="cell-sub">{r.saturday}</span></> },
            { key: 'weekly', header: 'Haftalık', summary: true, nowrap: true, render: (r) => `${r.weekly} sa (${r.overtimePerWeek} sa fazla)` },
            { key: 'org', header: 'Organizatör', minWidth: '16rem', render: (r) => r.organizer },
          ]}
          rows={workPeriods}
        />
        <Chart
          id="fazla-calisma"
          title="Kişi başı kümülatif fazla çalışma"
          note={`Kesikli çizgi: Dönem 1 düzeni sürseydi tavan ${crossWeek}. haftada (${shortDate(addDays(dates.firstDay, (crossWeek - 1) * 7))}) dolardı.`}
          summary={`Program başında başlayanlar ${overtimeUsed.kasim} saat, organizatör ${overtimeUsed.organizator} saat fazla çalışmayla Dönem 1’i bitirir; tavan ${OVERTIME_CAP} saat. Dönem 1 düzeni sürseydi tavan ${crossWeek}. haftada dolardı.`}
          spec={{
            kind: 'cumulative',
            labels: weekLabels,
            unit: 'sa',
            cap: OVERTIME_CAP,
            capLabel: `Yasal tavan ${OVERTIME_CAP} sa`,
            series: [
              { name: 'Program başında başlayanlar', role: 'saha-uzmani', values: overtimeSeries(1, p1.overtimePerWeek, p1.weeks) },
              { name: `Organizatör (${shortDate(dates.dec)})`, role: 'organizator', values: overtimeSeries(decWeek, p1.organizerOvertimePerWeek, p1.weeks) },
              { name: 'Dönem 1 sürseydi', role: 'yonetici', values: overtimeSeries(1, p1.overtimePerWeek, CUMULATIVE_WEEKS), dashed: true },
            ],
          }}
          size="lg"
        />
        <Note title="Fazla çalışma ücreti">
          <p>
            Saha için saat ücreti {lira(params.sahaSalary / 225)}, fazla çalışma saati {lira(overtimeHourly)} (maaş / 225 saat, %50 zamlı; bordroda brüt esas alınır).
            Dönem 1’de ayda yaklaşık {monthlyOvertime} saat: kişi başı ≈ {lira(monthlyOvertime * overtimeHourly)} / ay. {p2.name} ile bu gider kalkar.
          </p>
        </Note>
      </Section>
    </>
  );
}

/* ---------- Çok katmanlı pazarlama ağı ---------- */

const LEVEL_ROLES: RoleKey[] = ['yonetici', 'ekip-lideri', 'saha-uzmani', 'pazarlamaci'];

function GrowthContent() {
  const m = useModel();
  const { levels, recruitmentFunnel, growthKpis, compliance } = m.growth;
  const { params, dates } = m;

  return (
    <>
      <PageHeader title="Çok katmanlı pazarlama ağı (MLM)" purpose="Doğrudan satış modeli: bağımsız satış temsilcileri Meta reklamlarıyla bulunur; kazanç yalnız gerçek satıştan doğar." />

      <Section id="kademe" index={1} title="Kademeler" desc={`${longDate(dates.day90)} hedefi.`}>
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
            { key: 'c', header: 'Kişi', summary: true, nowrap: true, render: (l) => l.count },
          ]}
          rows={levels}
        />
      </Section>

      <Section id="huni" index={2} title="Haftalık işe alım hunisi" desc={`Meta reklamı ${lira(params.metaWeekly)} / hafta (~${lira((params.metaWeekly * 52) / 12)} / ay) → ayda en fazla ~${m.growth.monthlyRepsText} aktif temsilci.`}>
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
            { key: 't', header: 'Hedef', summary: true, minWidth: '12rem', render: (k) => k.target },
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
    </>
  );
}

/* ---------- Arşiv: tahtadan karara ---------- */

export function ArchivePage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <PageHeader title="Arşiv: tahtadan karara" purpose="19 Ekim tahta notlarının plandaki karşılığı; toplantı için gerekli değil, kayıt amaçlı." meta={[{ label: 'Kaynak', value: '19 Ekim 2026 tahta notları' }]} />
      <DataTable<BoardRow>
        id="tahta"
        title="Tahta notu → karar → sayfa"
        columns={[
          { key: 'board', header: 'Tahtadaki not', minWidth: '16rem', rowHeader: true, render: (r) => r.board },
          { key: 'decision', header: 'Plandaki karar', summary: true, minWidth: '18rem', render: (r) => r.decision },
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
      <PageHeader title="Sayfa bulunamadı" purpose="Aradığınız sayfa taşınmış veya kaldırılmış olabilir." />
      <p>
        <TextLink to="/" standalone>
          Organizasyon şemasına dön
        </TextLink>
      </p>
    </AppFrame>
  );
}

export function HiringPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <HiringContent />
    </AppFrame>
  );
}

export function GoalsPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <GoalsContent />
    </AppFrame>
  );
}

export function PlanPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <PlanContent />
    </AppFrame>
  );
}

export function AuthorityPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <AuthorityContent />
    </AppFrame>
  );
}

export function PendingPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <PendingContent />
    </AppFrame>
  );
}

export function GrowthPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <GrowthContent />
    </AppFrame>
  );
}
