import { AppFrame } from '../components/AppFrame';
import {
  Avatar,
  Chart,
  DataTable,
  FactsRow,
  formatDate,
  Target,
  Hero,
  KpiGrid,
  Note,
  RoleChip,
  Section,
  StatusChip,
  TextLink,
} from '../components/ui';
import {
  channels,
  contentPlan,
  digitalPlan,
  integrations,
  pipeline,
  productionRamp,
  STEP_MODE_LABELS,
  STREAM_LABELS,
  type Channel,
  type ContentPillar,
  type DigitalPlanRow,
  type Integration,
  type PipelineStep,
} from '../data/digital';
import { MONTHS } from '../data/program';
import type { PlanRow, Role, ScheduleRow, Task } from '../data/types';

const minutes = (time: string) => {
  const [from, to] = time.split('–').map((t) => {
    const [h, m] = t.split(':').map(Number);
    return h * 60 + m;
  });
  return to - from;
};

/** Hafta içi gün: aynı adlı bloklar toplanır, ara dinlenme çalışma süresine katılmaz. */
function timeShare(rows: ScheduleRow[]) {
  const totals = new Map<string, number>();
  for (const row of rows) {
    if (row.tone === 'break') continue;
    totals.set(row.block, (totals.get(row.block) ?? 0) + minutes(row.time));
  }
  return [...totals].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

const hours = (min: number) => `${Math.floor(min / 60)} sa${min % 60 ? ` ${min % 60} dk` : ''}`;
const range = (row: { from: string; to: string }) => `${formatDate(row.from)} – ${formatDate(row.to)}`;
const shortDate = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(`${iso}T00:00:00`));
const shortRange = (row: { from: string; to: string }) => `${shortDate(row.from)} – ${shortDate(row.to)}`;

function RoleHero({ role }: { role: Role }) {
  return (
    <Hero eyebrow={role.tree} title={role.title} lead={role.mission}>
      <div className="role-hero-meta">
        <Avatar role={role.slug} large />
        <StatusChip status={role.startStatus} />
      </div>
      <FactsRow
        items={[
          { label: 'Kişi', value: role.count },
          { label: 'Başlangıç', value: role.start },
          { label: 'Bağlı olduğu', value: role.reportsTo },
          { label: 'Ücret modeli', value: role.pay },
          { label: 'Aranan', value: role.seeks.join(' · ') },
        ]}
      />
    </Hero>
  );
}

function DaySection({ role, index }: { role: Role; index: number }) {
  const share = timeShare(role.daily);
  const top = share.slice(0, 3);
  return (
    <Section
      id="gun"
      index={index}
      title="Günlük düzen"
      desc={`Hafta içi ${role.hours.weekday}; Cumartesi ${role.hours.saturday}. Haftalık ${role.hours.weeklyNet}.`}
    >
      <Chart
        id="zaman-payi"
        title="Hafta içi zaman payı"
        note={`En büyük üç blok: ${top.map((t) => `${t.name} ${hours(t.value)}`).join(' · ')}`}
        summary={`Hafta içi çalışma süresinin dağılımı: ${share.map((s) => `${s.name} ${hours(s.value)}`).join(', ')}.`}
        spec={{ kind: 'pay', role: role.slug, items: share }}
        size={share.length > 8 ? 'xl' : 'lg'}
      />
      <div className="split">
        <DataTable<ScheduleRow>
          id="hafta-ici"
          title="Hafta içi"
          columns={[
            { key: 'time', header: 'Saat', nowrap: true, rowHeader: true, render: (r) => r.time },
            { key: 'block', header: 'Blok', minWidth: '12rem', render: (r) => r.block },
          ]}
          rows={role.daily}
          rowTone={(r) => r.tone}
        />
        <DataTable<ScheduleRow>
          id="cumartesi"
          title="Cumartesi"
          columns={[
            { key: 'time', header: 'Saat', nowrap: true, rowHeader: true, render: (r) => r.time },
            { key: 'block', header: 'Blok', minWidth: '12rem', render: (r) => r.block },
          ]}
          rows={role.saturday}
          rowTone={(r) => r.tone}
        />
      </div>
      {role.slug === 'ekip-lideri' ? (
        <p className="after-block">
          <TextLink to="/buyume-modeli/" standalone>
            Çok katmanlı pazarlama ağı: kademe ve huni
          </TextLink>
        </p>
      ) : null}
    </Section>
  );
}

/**
 * Dijital pazarlama: veri türüne göre değil iş akışına göre kümelenir.
 * 1 Ölçüm → 2 AI-first paylaşım otomasyonu → 3 Üretim ve paylaşım → 4 İçerik planı → 5 Plan → 6 Gün.
 */
function DigitalSections({ role }: { role: Role }) {
  const weekly = contentPlan.reduce((sum, p) => sum + p.perWeek, 0);
  const last = integrations[integrations.length - 1];
  return (
    <>
      <Section
        id="olcum"
        index={1}
        title="Ölçüm ve entegrasyonlar"
        desc={`Önce ölçüm: her içerik ve reklamın kayda ve aktif satıcıya etkisi görünür. ${integrations.length} entegrasyon, ${shortDate(last.date)}’e kadar.`}
      >
        <Chart
          id="entegrasyon"
          title="Entegrasyon × tamamlanma tarihi"
          summary={integrations.map((i) => `${i.name}: ${shortDate(i.date)}`).join('; ')}
          spec={{ kind: 'deadlines', start: '2026-11-02', end: '2026-11-27', items: integrations.map((i) => ({ name: i.name, date: i.date, role: role.slug })) }}
          size="lg"
          wide
        />
        <DataTable<Integration>
          id="entegrasyon"
          title="Ne ölçer, ne zaman tamam sayılır"
          columns={[
            { key: 'name', header: 'Entegrasyon', minWidth: '13rem', rowHeader: true, render: (r) => r.name },
            { key: 'measures', header: 'Ne ölçer', minWidth: '16rem', render: (r) => r.measures },
            { key: 'done', header: 'Kabul ölçütü', minWidth: '16rem', render: (r) => r.done },
            { key: 'date', header: 'Tarih', nowrap: true, render: (r) => shortDate(r.date) },
          ]}
          rows={integrations}
        />
      </Section>

      <Section
        id="otomasyon"
        index={2}
        title="AI-first paylaşım otomasyonu"
        desc="Uzman içeriği tek tek üretmez; içeriği üreten hattı kurar ve denetler. İnsan iki noktada: senaryo seçimi ve yayın onayı."
      >
        <Chart
          id="hat"
          title="Kaynaktan ölçüme hat"
          summary={pipeline.map((p, i) => `${i + 1}. ${p.step} (${STEP_MODE_LABELS[p.mode]}): ${p.measure}`).join('; ')}
          spec={{
            kind: 'chain',
            steps: pipeline.map((p, i) => ({ name: `${i + 1}. ${p.step}`, sub: STEP_MODE_LABELS[p.mode], role: p.mode === 'otomatik' ? role.slug : 'yonetici' })),
          }}
          size="xl"
        />
        <DataTable<PipelineStep>
          id="hat"
          title="Adım, kim, ölçüt"
          columns={[
            { key: 'step', header: 'Adım', nowrap: true, rowHeader: true, render: (r) => r.step },
            { key: 'what', header: 'Ne olur', minWidth: '18rem', render: (r) => r.what },
            { key: 'mode', header: 'Kim', minWidth: '10rem', render: (r) => STEP_MODE_LABELS[r.mode] },
            { key: 'measure', header: 'Ölçüt', minWidth: '12rem', render: (r) => r.measure },
          ]}
          rows={pipeline}
        />
      </Section>

      <Section id="uretim" index={3} title="Üretim ve paylaşım otomasyonu" desc="Aylık artış hedefleri ve içeriğin paylaşıldığı kanallar.">
        <KpiGrid kpis={role.kpis} role={role.slug} />
        <Chart
          id="uretim-artis"
          title={`${productionRamp.video.metric} ve ${productionRamp.auto.metric.toLowerCase()}`}
          summary={[productionRamp.video, productionRamp.auto]
            .map((s) => `${s.metric}: ${s.values.map((v, i) => `${productionRamp.months[i]} ${v}`).join(', ')}`)
            .join('. ')}
          spec={{
            kind: 'ramp',
            months: productionRamp.months,
            role: role.slug,
            series: [
              { name: productionRamp.video.metric, values: productionRamp.video.values },
              { name: productionRamp.auto.metric, values: productionRamp.auto.values },
            ],
          }}
        />
        <DataTable<Channel>
          id="kanal"
          title="Kanallar"
          note="Tüm kanallar tek paylaşım kuyruğundan otomatik beslenir; liste içerik planı v1 ile 6 Kasım’da onaylanır."
          columns={[
            { key: 'channel', header: 'Kanal', minWidth: '12rem', rowHeader: true, render: (r) => r.channel },
            { key: 'content', header: 'Ne paylaşılır', minWidth: '16rem', render: (r) => r.content },
            { key: 'frequency', header: 'Sıklık', nowrap: true, render: (r) => r.frequency },
          ]}
          rows={channels}
        />
      </Section>

      <Section
        id="icerik-plani"
        index={4}
        title="İçerik planı: ne üreteceğiz"
        desc={`Ocak’ta haftada ${weekly} video (günde 3 × 6 gün), altı sütun. Ham malzeme ekiplerden gelir; uzman derler, hat üretir ve paylaşır.`}
      >
        <Chart
          id="icerik-karmasi"
          title="Haftalık içerik karması (Ocak)"
          summary={contentPlan.map((p) => `${p.pillar}: haftada ${p.perWeek}`).join('; ')}
          spec={{ kind: 'mix', unit: '/ hafta', items: contentPlan.map((p) => ({ name: p.pillar, value: p.perWeek, role: p.source })) }}
          size="lg"
        />
        <DataTable<ContentPillar>
          id="icerik"
          title="Sütun, kaynak, format, ölçüt"
          columns={[
            { key: 'pillar', header: 'Sütun', nowrap: true, rowHeader: true, render: (r) => r.pillar },
            {
              key: 'what',
              header: 'Ne',
              minWidth: '16rem',
              render: (r) => (
                <>
                  {r.what}
                  <span className="cell-sub">Örnek: {r.example}</span>
                </>
              ),
            },
            {
              key: 'source',
              header: 'Kaynak',
              minWidth: '14rem',
              render: (r) => (
                <>
                  <RoleChip role={r.source} />
                  <span className="cell-sub">{r.sourceNote}</span>
                </>
              ),
            },
            { key: 'format', header: 'Format', minWidth: '12rem', render: (r) => r.format },
            { key: 'perWeek', header: 'Haftada', nowrap: true, render: (r) => r.perWeek },
            { key: 'measure', header: 'Ölçüt', minWidth: '11rem', render: (r) => r.measure },
          ]}
          rows={contentPlan}
        />
      </Section>

      <Section id="eylem-plani" index={5} title="90 günlük plan" desc="Dört iş akışı, tarih ve ölçülebilir hedefle.">
        <Chart
          id="dijital-gantt"
          title="İş akışı × zaman"
          summary={digitalPlan.map((p) => `${STREAM_LABELS[p.stream]}, ${shortRange(p)}: ${p.action}; hedef ${p.target}`).join('. ')}
          spec={{
            kind: 'gantt',
            start: '2026-11-02',
            end: '2027-01-30',
            rows: digitalPlan.map((p, i) => ({
              name: `${STREAM_LABELS[p.stream]} · ${digitalPlan.slice(0, i + 1).filter((r) => r.stream === p.stream).length}`,
              from: p.from,
              to: p.to,
              role: role.slug,
              text: `${p.action} · Hedef: ${p.target}`,
              milestone: p.milestone,
            })),
            marks: [
              { date: '2026-12-30', label: '60. gün' },
              { date: '2027-01-30', label: '90. gün' },
            ],
          }}
          size="xl"
          wide
        />
        <DataTable<DigitalPlanRow>
          id="dijital-plan"
          title="Akış, tarih, eylem, hedef"
          columns={[
            { key: 'stream', header: 'Akış', nowrap: true, rowHeader: true, render: (r) => STREAM_LABELS[r.stream] },
            { key: 'when', header: 'Tarih', nowrap: true, render: (r) => shortRange(r) },
            { key: 'action', header: 'Eylem', minWidth: '18rem', render: (r) => r.action },
            { key: 'target', header: 'Hedef', minWidth: '13rem', render: (r) => <Target row={r} /> },
          ]}
          rows={digitalPlan}
        />
        <Note title="Asistan alınmazsa">
          <p>Uzman 1 Ocak 2027’de başlar ve bu sayfadaki tarihler 2 ay kayar. Meta reklamları o güne kadar İsmail Karaca’da kalır.</p>
        </Note>
      </Section>

      <DaySection role={role} index={6} />
    </>
  );
}

function GenericSections({ role }: { role: Role }) {
  const months = role.ramp.months ?? MONTHS;
  const series = [{ name: role.ramp.metric, values: role.ramp.values }];
  if (role.ramp.second) series.push({ name: role.ramp.second.metric, values: role.ramp.second.values });
  return (
    <>
      <Section id="gorevler" index={1} title="Görevler ve ölçüt" desc="Her görev ölçülebilir bir hedefle tanımlı.">
        <DataTable<Task>
          id="gorev"
          title="Görevler"
          columns={[
            { key: 'task', header: 'Görev', minWidth: '16rem', rowHeader: true, render: (r) => r.task },
            { key: 'measure', header: 'Ölçüt', minWidth: '16rem', render: (r) => r.measure },
          ]}
          rows={role.tasks}
        />
      </Section>

      <Section id="kpi" index={2} title="KPI hedefleri" desc="Değer, birim ve ölçüm zamanı.">
        <KpiGrid kpis={role.kpis} role={role.slug} />
        <Chart
          id="kpi-artis"
          title={`${series.map((s) => s.name).join(' ve ')}: aylara göre`}
          summary={series.map((s) => `${s.name}: ${s.values.map((v, i) => `${months[i]} ${v}`).join(', ')}`).join('. ')}
          spec={{ kind: 'ramp', months, role: role.slug, series }}
        />
      </Section>

      <Section id="eylem-plani" index={3} title="Eylem planı" desc="Tarih aralığı, eylem ve ölçülebilir hedef.">
        <Chart
          id="rol-gantt"
          title="Zaman çizelgesi"
          summary={role.plan.map((p) => `${range(p)}: ${p.action}; hedef ${p.target}`).join('. ')}
          spec={{
            kind: 'gantt',
            start: role.plan[0].from,
            end: role.plan[role.plan.length - 1].to,
            rows: role.plan.map((p, i) => ({ name: `${i + 1}. adım`, from: p.from, to: p.to, role: role.slug, text: p.action, milestone: p.milestone })),
            marks: [],
          }}
          size="sm"
          wide
        />
        <DataTable<PlanRow>
          id="plan"
          title="Adımlar"
          columns={[
            { key: 'when', header: 'Tarih', nowrap: true, rowHeader: true, render: (r) => range(r) },
            { key: 'action', header: 'Eylem', minWidth: '18rem', render: (r) => r.action },
            { key: 'target', header: 'Hedef', minWidth: '14rem', render: (r) => <Target row={r} /> },
          ]}
          rows={role.plan}
        />
      </Section>

      <DaySection role={role} index={4} />
    </>
  );
}

export function RolePage({ pathname, role }: { pathname: string; role: Role }) {
  return (
    <AppFrame pathname={pathname}>
      <RoleHero role={role} />
      {role.slug === 'dijital-pazarlama' ? <DigitalSections role={role} /> : <GenericSections role={role} />}
    </AppFrame>
  );
}
