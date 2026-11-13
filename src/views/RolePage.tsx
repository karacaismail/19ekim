import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import {
  Avatar,
  Chart,
  DataTable,
  formatDate,
  Target,
  KpiGrid,
  Note,
  RoleChip,
  Section,
  StatusChip,
  TextLink,
} from '../components/ui';
import {
  aiTools,
  channels,
  contentPlan,
  pipeline,
  productionRamp,
  STEP_MODE_LABELS,
  STREAM_LABELS,
  type AiTool,
  type Channel,
  type ContentPillar,
  type DigitalPlanRow,
  type Integration,
  type PipelineStep,
} from '../data/digital';
import { useModel } from '../components/ModelContext';
import { addDays } from '../lib/dates';
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

const hours = (min: number) => [Math.floor(min / 60) ? `${Math.floor(min / 60)} saat` : '', min % 60 ? `${min % 60} dakika` : ''].filter(Boolean).join(' ');
const range = (row: { from: string; to: string }) => `${formatDate(row.from)} – ${formatDate(row.to)}`;
const shortDate = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(`${iso}T00:00:00`));
const shortRange = (row: { from: string; to: string }) => `${formatDate(row.from)} – ${formatDate(row.to)}`;

/**
 * Rol başlığı: tek PageHeader (ux.md M03; kullanıcı kararı 2026-10-20 — yükseklik ≥ %75 az — korunur). Kırıntı
 * öğesinde simge, ad ve durum; amaç satırında görev (veri: `role.mission`); dönem satırında kişi, başlangıç, bağlı,
 * ücret ve aranan nitelikler. Ağacın adı sunum sırası etiketlerinde ve organizasyon şemasında kalır.
 */
/** Görev tanımını ilk cümle ve kalanı diye ayırır. Başlıktaki amaç satırı tek cümledir (ux.md P6.1). */
function gorevParcalari(mission: string): [string, string] {
  const m = mission.match(/^.*?[.!?](?=\s+[A-ZÇĞİÖŞÜ“]|\s*$)/u);
  const ilk = m ? m[0] : mission;
  return [ilk, mission.slice(ilk.length).trim()];
}

function RoleHero({ role }: { role: Role }) {
  return (
    <PageHeader
      title={role.title}
      icon={<Avatar role={role.slug} />}
      badge={<StatusChip status={role.startStatus} />}
      purpose={gorevParcalari(role.mission)[0]}
      meta={[
        { label: 'Kişi', value: role.count },
        { label: 'Başlangıç', value: role.start },
        { label: 'Yönetici', value: role.reportsTo },
        { label: 'Ücret', value: gorevParcalari(role.pay)[0] },
        { label: 'Aranan özellikler', value: role.seeks.join(', ') },
      ]}
    />
  );
}

function DaySection({ role, index }: { role: Role; index: number }) {
  const [p1, p2] = useModel().workPeriods;
  const share = timeShare(role.daily);
  const top = share.slice(0, 3);
  return (
    <Section
      id="gun"
      index={index}
      title="Günlük düzen"
      desc="Çalışma saatleri iki dönemde farklıdır."
    >
      {/* İki dönem ayrı maddededir. Saatler tek paragrafta birleşip metin duvarına dönüşmez. */}
      <ul className="bullets rol-donemler">
        <li>
          <strong>Dönem 1:</strong> {formatDate(p1.from)} tarihinden {formatDate(p1.to)} tarihine kadar sürer. {role.hours.weekday} {role.hours.saturday} {role.hours.weeklyNet}
        </li>
        <li>
          <strong>Dönem 2:</strong> {formatDate(p2.from)} tarihinde başlar. {role.hours.fromFeb}
        </li>
        <li>Fazla çalışmanın yıllık bir üst sınırı vardır. Dönem 2 düzeni bu sınır yüzünden uygulanır.</li>
      </ul>
      <Chart
        id="zaman-payi"
        title="Hafta içi zaman payı"
        note={`Hafta içi günde ${hours(share.reduce((s, x) => s + x.value, 0))} çalışırsınız. ${top.map((t, i) => `“${t.name}” ${['en çok zaman alan iştir', 'ikinci sıradadır', 'üçüncü sıradadır'][i]}. Günde ${hours(t.value)} sürer.`).join(' ')}`}
        summary={`Hafta içi bir iş gününün işlere göre dağılımı: ${share.map((s) => `${s.name} ${hours(s.value)}`).join(', ')}.`}
        spec={{ kind: 'pay', role: role.slug, items: share }}
        size={share.length > 9 ? 'xxl' : share.length > 7 ? 'xl' : 'lg'}
      />
      <div className="split">
        <DataTable<ScheduleRow>
          id="hafta-ici"
          title="Hafta içi"
          columns={[
            // Saat aralığı iki sütundur: “08:00–08:15” yerine “Başlar 08:00”, “Biter 08:15” okunur.
            { key: 'time', header: 'Başlar', nowrap: true, rowHeader: true, render: (r) => r.time.split('–')[0] },
            { key: 'bitis', header: 'Biter', nowrap: true, render: (r) => r.time.split('–')[1] ?? '' },
            { key: 'block', header: 'İş', summary: true, minWidth: '12rem', render: (r) => r.block },
          ]}
          rows={role.daily}
          rowTone={(r) => r.tone}
        />
        <DataTable<ScheduleRow>
          id="cumartesi"
          title="Cumartesi"
          columns={[
            // Saat aralığı iki sütundur: “08:00–08:15” yerine “Başlar 08:00”, “Biter 08:15” okunur.
            { key: 'time', header: 'Başlar', nowrap: true, rowHeader: true, render: (r) => r.time.split('–')[0] },
            { key: 'bitis', header: 'Biter', nowrap: true, render: (r) => r.time.split('–')[1] ?? '' },
            { key: 'block', header: 'İş', summary: true, minWidth: '12rem', render: (r) => r.block },
          ]}
          rows={role.saturday}
          rowTone={(r) => r.tone}
        />
      </div>
      {role.slug === 'ekip-lideri' ? (
        <p className="after-block">
          <TextLink to="/buyume-modeli/" standalone>
            Çok katmanlı pazarlama ağının işleyişini görün
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
  const m = useModel();
  const { integrations, digitalPlan, aiToolBudget: AI_TOOL_BUDGET, planStart, planEnd, marks } = m.digital;
  const integrationDates = integrations.map((i) => i.date).sort();
  const weekly = contentPlan.reduce((sum, p) => sum + p.perWeek, 0);
  const last = integrations[integrations.length - 1];
  return (
    <>
      <Section
        id="olcum"
        index={1}
        title="Ölçüm ve entegrasyonlar"
        desc={`İlk işiniz ölçüm araçlarını kurmaktır. Böylece her içeriğin ve reklamın kaç kayıt getirdiği görünür. Kaç aktif satıcı getirdiği de görünür. ${integrations.length} ölçüm bağlantısını ${shortDate(last.date)} tarihine kadar kurun.`}
      >
        <Chart
          id="entegrasyon"
          title="Ölçüm bağlantılarının bitiş tarihleri"
          summary={integrations.map((i) => `${i.name}: ${shortDate(i.date)}`).join('. ')}
          spec={{ kind: 'deadlines', start: integrationDates[0], end: addDays(integrationDates[integrationDates.length - 1], 4), items: integrations.map((i) => ({ name: i.name, date: i.date, role: role.slug })) }}
          size="lg"
          wide
        />
        <DataTable<Integration>
          id="entegrasyon"
          title="Ne işe yarar, ne zaman tamam sayılır"
          columns={[
            { key: 'name', header: 'Ölçüm bağlantısı', minWidth: '13rem', rowHeader: true, render: (r) => r.name },
            { key: 'measures', header: 'Ne işe yarar', minWidth: '16rem', render: (r) => r.measures },
            { key: 'done', header: 'Kabul ölçütü', minWidth: '16rem', render: (r) => r.done },
            { key: 'date', header: 'Tarih', summary: true, nowrap: true, render: (r) => shortDate(r.date) },
          ]}
          rows={integrations}
        />
      </Section>

      <Section
        id="otomasyon"
        index={2}
        title="AI-first paylaşım otomasyonu"
        desc="Siz içeriği tek tek üretmezsiniz. İçeriği adım adım üreten otomatik sistemi kurar ve denetlersiniz. Yalnız iki adımda işe katılırsınız. Senaryoyu seçer ve yayını onaylarsınız."
      >
        <Chart
          id="hat"
          title="Fikirden ölçüme otomatik sistemin adımları"
          summary={pipeline.map((p, i) => `${i + 1}. ${p.step} (${STEP_MODE_LABELS[p.mode]}): ${p.measure}`).join('. ')}
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
            { key: 'measure', header: 'Ölçüt', summary: true, minWidth: '12rem', render: (r) => r.measure },
          ]}
          rows={pipeline}
        />
        <DataTable<AiTool>
          id="arac"
          title="Araçlar ve aylık bütçe"
          note={`Araçlara ayda en çok ${new Intl.NumberFormat('tr-TR').format(AI_TOOL_BUDGET)} ₺ harcanır. Bu bütçe kararı 19 Ekim’de verildi. Bu tutarı aşmak için İsmail Karaca’nın onayı gerekir. Bütçe 30 Aralık’ta ölçüm panosundaki sonuçlara göre yeniden incelenir.`}
          columns={[
            { key: 'tool', header: 'Araç', nowrap: true, rowHeader: true, render: (r) => r.tool },
            { key: 'use', header: 'Ne için', summary: true, minWidth: '18rem', render: (r) => r.use },
            { key: 'license', header: 'Lisans', minWidth: '12rem', render: (r) => r.license },
          ]}
          rows={aiTools}
        />
      </Section>

      <Section id="uretim" index={3} title="Üretim ve paylaşım otomasyonu" desc="Bu bölümde aylık hedefler ve paylaşım kanalları var.">
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
          note="Bütün kanallardaki paylaşımlar tek bir paylaşım listesinden otomatik yapılır. İsmail Karaca kanal listesini 6 Kasım’da onaylar. Onay, içerik planının 1. sürümüyle birlikte verilir."
          columns={[
            { key: 'channel', header: 'Kanal', minWidth: '12rem', rowHeader: true, render: (r) => r.channel },
            { key: 'content', header: 'Ne paylaşılır', minWidth: '16rem', render: (r) => r.content },
            { key: 'frequency', header: 'Sıklık', summary: true, nowrap: true, render: (r) => r.frequency },
          ]}
          rows={channels}
        />
      </Section>

      <Section
        id="icerik-plani"
        index={4}
        title="İçerik planı: ne üretilecek"
        desc={`Ocak’ta haftada ${weekly} video üretilir. Bu, 6 gün boyunca günde 3 video demektir. Videolar altı içerik türüne dağılır. Ham malzemeyi ekipler verir. Siz malzemeyi toplarsınız. Otomatik sistem videoyu üretir ve paylaşır.`}
      >
        <Chart
          id="icerik-karmasi"
          title="Ocak’ta haftalık video dağılımı"
          summary={contentPlan.map((p) => `${p.pillar}: haftada ${p.perWeek}`).join('. ')}
          spec={{ kind: 'mix', unit: '/ hafta', items: contentPlan.map((p) => ({ name: p.pillar, value: p.perWeek, role: p.source })) }}
          size="lg"
        />
        <DataTable<ContentPillar>
          id="icerik"
          title="İçerik türü, kaynak, biçim ve ölçüt"
          columns={[
            { key: 'pillar', header: 'İçerik türü', nowrap: true, rowHeader: true, render: (r) => r.pillar },
            {
              key: 'what',
              header: 'Ne',
              minWidth: '16rem',
              render: (r) => (
                <>
                  {r.what}{' '}
                  <span className="cell-sub">Örneğin {r.example}</span>
                </>
              ),
            },
            {
              key: 'source',
              header: 'Kaynak',
              minWidth: '14rem',
              render: (r) => (
                <>
                  <RoleChip role={r.source} />{' '}
                  <span className="cell-sub">{r.sourceNote}</span>
                </>
              ),
            },
            { key: 'format', header: 'Biçim', minWidth: '12rem', render: (r) => r.format },
            { key: 'perWeek', header: 'Haftada', summary: true, nowrap: true, render: (r) => r.perWeek },
            { key: 'measure', header: 'Ölçüt', minWidth: '11rem', render: (r) => r.measure },
          ]}
          rows={contentPlan}
        />
      </Section>

      <Section id="eylem-plani" index={5} title="90 günlük plan" desc="Planda dört iş akışı var. Her işin tarihi ve hedefi aşağıdadır.">
        <Chart
          id="dijital-gantt"
          title="İş akışı × zaman"
          summary={digitalPlan.map((p) => `${STREAM_LABELS[p.stream]}, ${shortRange(p)}: ${p.action.replace(/\.$/, '')}. Hedef: ${p.target}.`).join(' ')}
          spec={{
            kind: 'gantt',
            start: planStart,
            end: planEnd,
            rows: digitalPlan.map((p, i) => ({
              name: `${STREAM_LABELS[p.stream]}, ${digitalPlan.slice(0, i + 1).filter((r) => r.stream === p.stream).length}. adım`,
              from: p.from,
              to: p.to,
              role: role.slug,
              text: `${p.action.replace(/\.$/, '')}. Hedef: ${p.target}`,
              milestone: p.milestone,
            })),
            marks,
          }}
          size="xl"
          wide
        />
        <DataTable<DigitalPlanRow>
          id="dijital-plan"
          title="Akış, tarih, eylem, hedef"
          columns={[
            { key: 'stream', header: 'Akış', nowrap: true, rowHeader: true, render: (r) => STREAM_LABELS[r.stream] },
            { key: 'when', header: 'Tarih', summary: true, nowrap: true, render: (r) => shortRange(r) },
            { key: 'action', header: 'Eylem', minWidth: '18rem', render: (r) => r.action },
            { key: 'target', header: 'Hedef', minWidth: '13rem', render: (r) => <Target row={r} /> },
          ]}
          rows={digitalPlan}
        />
        <Note title="Asistan alınmazsa">
          <p>Asistan işe alınmazsa {formatDate(m.params.dijitalAltDate)} tarihinde başlarsınız. Bu durumda sayfadaki tarihler de ileri kayar. Meta reklamlarını {formatDate(m.params.dijitalAltDate)} tarihine kadar İsmail Karaca yönetir.</p>
        </Note>
      </Section>

      <DaySection role={role} index={6} />
    </>
  );
}

function GenericSections({ role }: { role: Role }) {
  const months = role.ramp.months ?? useModel().MONTHS;
  const series = [{ name: role.ramp.metric, values: role.ramp.values }];
  if (role.ramp.second) series.push({ name: role.ramp.second.metric, values: role.ramp.second.values });
  return (
    <>
      <Section id="gorevler" index={1} title="Görevler ve ölçüt" desc="Her görev ölçülebilir bir hedefle tanımlanır.">
        <DataTable<Task>
          id="gorev"
          title="Görevler"
          columns={[
            { key: 'task', header: 'Görev', minWidth: '16rem', rowHeader: true, render: (r) => r.task },
            { key: 'measure', header: 'Ölçüt', summary: true, minWidth: '16rem', render: (r) => r.measure },
          ]}
          rows={role.tasks}
        />
      </Section>

      <Section id="kpi" index={2} title="Performans hedefleri" desc="Her kartta hedef değer ve ölçüm zamanı yazılıdır.">
        <KpiGrid kpis={role.kpis} role={role.slug} />
        <Chart
          id="kpi-artis"
          title={`${series.map((s, i) => (i ? s.name.toLocaleLowerCase('tr-TR') : s.name)).join(' ve ')} hedefi`}
          summary={series.map((s) => `${s.name} hedefi ${s.values.map((v, i) => `${months[i]} ayında ${v}`).join(', ')} olur.`).join(' ')}
          spec={{ kind: 'ramp', months, role: role.slug, series }}
        />
      </Section>

      <Section id="eylem-plani" index={3} title="Eylem planı" desc="Bu tabloda her adımın tarihi, yapılacak iş ve hedefi vardır.">
        <Chart
          id="rol-gantt"
          title="Zaman çizelgesi"
          summary={role.plan.map((p, i) => `${i + 1}. adım ${formatDate(p.from)} tarihinde başlar ve ${formatDate(p.to)} tarihinde biter. ${p.action.replace(/\.?$/, '.')} Hedef: ${p.target.replace(/\.?$/, '.')}`).join(' ')}
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
            { key: 'target', header: 'Hedef', summary: true, minWidth: '14rem', render: (r) => <Target row={r} /> },
          ]}
          rows={role.plan}
        />
      </Section>

      <DaySection role={role} index={4} />
    </>
  );
}

function RoleContent({ slug }: { slug: string }) {
  const role = useModel().role(slug);
  return (
    <>
      <RoleHero role={role} />
      {/* Görev tanımının ve ücretin kalanı başlığın altında tam cümlelerle okunur. Başlık kısa kalır. */}
      {gorevParcalari(role.mission)[1] ? <p className="rol-gorev-ozeti">{gorevParcalari(role.mission)[1]}</p> : null}
      {gorevParcalari(role.pay)[1] ? <p className="rol-gorev-ozeti">{gorevParcalari(role.pay)[1]}</p> : null}
      {role.slug === 'dijital-pazarlama' ? <DigitalSections role={role} /> : <GenericSections role={role} />}
    </>
  );
}

export function RolePage({ pathname, slug }: { pathname: string; slug: string }) {
  return (
    <AppFrame pathname={pathname}>
      <RoleContent slug={slug} />
    </AppFrame>
  );
}
