import { AppFrame } from '../components/AppFrame';
import {
  Bullets,
  CellList,
  Chart,
  DataTable,
  Flow,
  Hero,
  Note,
  RoleChip,
  Section,
  Stats,
  StatusChip,
  TextLink,
  Toc,
} from '../components/ui';
import {
  compliance,
  earningPrinciples,
  glossary,
  growthKpis,
  growthTimeline,
  levels,
  recruitmentFunnel,
  tiers,
} from '../data/growth';
import { channels, compensation, firstWeek, hiringPlan, hiringTimeline, interviewCases, jobAds, rubric } from '../data/hiring';
import {
  ANNUAL_TRY,
  checkpoints,
  CIRO_TARGET,
  EUR_TRY,
  governanceFlow,
  masterPlan,
  MONTHS,
  NEW_ACTIVE,
  payments,
  RETENTION_SCENARIOS,
  setupChecklist,
  SUBSCRIPTION_EUR,
  SUBSCRIPTION_TRY,
  targetPlan,
  targets,
} from '../data/program';
import { getRole, ROLE_LABELS } from '../data/roles';
import { channelRules, legal, rhythm, shifts } from '../data/rules';
import { modules, partnerTypes, segments, sessionFlow, weeklySchedule } from '../data/training';
import type { RoleKey } from '../data/types';
import {
  changelogFlow,
  crmStages,
  employeeOnboarding,
  escalation,
  gtmFunnel,
  handoffRules,
  onboardingCheck,
  raci,
  raciColumns,
} from '../data/workflows';
import { HiringScheduleList, hiringGantt } from './HiringSchedule';

const lira = (value: number) => `${new Intl.NumberFormat('tr-TR').format(value)} ₺`;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);

/* ---------- Hedefler ---------- */

const PCT = (r: number) => `%${Math.round(r * 100)}`;

export function GoalsPage({ pathname }: { pathname: string }) {
  const sub = SUBSCRIPTION_TRY;
  const need = CIRO_TARGET / sub;
  const firstRevenue = 100 * sub;
  const worstGap = CIRO_TARGET - firstRevenue;
  const threshold = (() => {
    // 12r² + 47r + 100 = gereken ödeme → elde tutma eşiği
    const [a, b] = NEW_ACTIVE;
    const A = a;
    const B = a + b;
    const C = 100 - need;
    return (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  })();
  const scenarios = RETENTION_SCENARIOS.map((r) => {
    const p = payments(r);
    const revenue = p.total * sub;
    const gap = Math.max(0, CIRO_TARGET - revenue);
    return { r, total: p.total, revenue, gap, missing: Math.ceil(gap / sub - 1e-9), renew: (p.total - 100) * sub };
  });
  const base = payments(0.7);
  const fillers = [
    { title: 'Aylık elde tutma', amount: `${PCT(threshold)} ve üstü`, how: 'Aktif satıcıların 2. ve 3. ay yenilemesi; eşiğin üstünde açık kendiliğinden kapanır.', roles: ['saha-uzmani', 'organizator'] as RoleKey[] },
    { title: 'Ek aktif satıcı (tek ödeme)', amount: `${Math.ceil(worstGap / sub)} satıcı`, how: `İlk ödemeyi yapan satıcı sayısı 100 yerine ${100 + Math.ceil(worstGap / sub)} olur.`, roles: ['saha-uzmani', 'pazarlamaci'] as RoleKey[] },
    { title: 'Yıllık peşin ödeme', amount: `${Math.ceil(worstGap / (ANNUAL_TRY - sub))} satıcı`, how: `“Yıllık 2 ay bedava” kuralıyla 3.990 € ≈ ${lira(Math.round(ANNUAL_TRY))}; ilk aya göre her biri ${lira(Math.round(ANNUAL_TRY - sub))} ekler.`, roles: ['saha-uzmani', 'ekip-lideri'] as RoleKey[] },
    { title: 'Pazarlama çözümü paketleri', amount: `${Math.ceil(worstGap / 30_000)} × 30K, ${Math.ceil(worstGap / 90_000)} × 90K veya ${Math.ceil(worstGap / 500_000)} × 500K`, how: 'Aktif ve üye satıcılara ek hizmet; yapay zekâ video içerik hizmeti dahil edilebilir.', roles: ['saha-uzmani', 'dijital-pazarlama'] as RoleKey[] },
    { title: 'Üye satıcıdan aktife geçiş', amount: `500 üyenin ${PCT(Math.ceil(worstGap / sub) / 500)}’i`, how: `${Math.ceil(worstGap / sub)} üye satıcının ilk ödemesi; eğitim, arama ve video içerikle.`, roles: ['organizator', 'pazarlamaci', 'dijital-pazarlama'] as RoleKey[] },
  ];
  const totalKayit = MONTHS.map((_, m) => sum(targetPlan.map((t) => t.kayit[m])));
  const totalAktif = MONTHS.map((_, m) => sum(targetPlan.map((t) => t.aktif[m])));

  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ortak · Hedefler"
        title="90 günde 3 milyon ₺: aktif satıcı ve ciro köprüsü"
        lead={`Aktif satıcı, aylık ${SUBSCRIPTION_EUR} € abonelik ödeyen satıcıdır (planlama panosu kuru: 1 € ≈ ${EUR_TRY.toFixed(2).replace('.', ',')} ₺, yani ayda ${lira(Math.round(sub))}). Bazı satıcılar bir ay ödeyip bırakabilir; bu yüzden aktif satıcı kümesinin büyümesi ile iStoc’un toplam ciro büyümesi ayrı izlenir.`}
      >
        <Toc
          items={[
            { id: 'kopru', label: 'Ciro köprüsü' },
            { id: 'acik', label: 'Açığı kapatma' },
            { id: 'aylik', label: 'Aylık ciro' },
            { id: 'satici-yapisi', label: 'Satıcı yapısı' },
            { id: 'kaynaklar', label: 'Kaynaklar' },
          ]}
        />
      </Hero>
      <Stats items={targets} />

      <Section
        id="kopru"
        index="01"
        title="Ciro köprüsü: toplam − aktif satıcı = açık"
        desc={`100 aktif satıcının ilk ödemeleri ${lira(Math.round(firstRevenue))} eder. 3.000.000 ₺ için ${Math.ceil(need)} satıcı-ay ödeme gerekir; farkı yenilemeler ve diğer gelirler kapatır. Aylık elde tutma ${PCT(threshold)}’nın altındaysa açık kalır.`}
      >
        <Chart
          spec={{
            kind: 'kopru',
            scenarios: scenarios.map((sc) => `Elde tutma ${PCT(sc.r)}`),
            first: scenarios.map(() => Math.round(firstRevenue)),
            renew: scenarios.map((sc) => Math.round(sc.renew)),
            target: CIRO_TARGET,
          }}
          title="Elde tutmaya göre 90 günlük abonelik cirosu"
          note="Turuncu: 100 aktif satıcının ilk ödemesi · yeşil: 2. ve 3. ay yenilemeleri · kesikli: hedef"
          summary={scenarios.map((sc) => `Elde tutma ${PCT(sc.r)}: ${lira(Math.round(sc.revenue))}, açık ${lira(Math.round(sc.gap))}`).join('; ')}
        />
        <DataTable
          id="kopru-tablosu"
          title="Senaryolar"
          note="Yeni aktif satıcı: Kasım 12, Aralık 35, Ocak 53. Her ay önceki ayların elde tutulan satıcıları yeniden öder."
          rows={scenarios}
          rowTone={(r) => (r.gap === 0 ? undefined : 'milestone')}
          columns={[
            { key: 'r', header: 'Aylık elde tutma', nowrap: true, rowHeader: true, render: (r) => PCT(r.r) },
            { key: 'total', header: 'Ödeme (satıcı-ay)', nowrap: true, render: (r) => r.total.toFixed(1).replace('.', ',') },
            { key: 'revenue', header: 'Abonelik cirosu', nowrap: true, render: (r) => lira(Math.round(r.revenue)) },
            { key: 'gap', header: 'Açık', nowrap: true, render: (r) => (r.gap ? lira(Math.round(r.gap)) : 'Yok') },
            { key: 'missing', header: 'Eksik satıcı-ay', nowrap: true, render: (r) => (r.missing ? r.missing : '—') },
          ]}
        />
      </Section>

      <Section
        id="acik"
        index="02"
        title="Açığı kapatma yolları"
        desc={`En kötü durumda (her aktif satıcı yalnız ilk ayı öder) açık ${lira(Math.round(worstGap))}. Aşağıdaki yollardan her biri tek başına bu açığı kapatır; planda birlikte kullanılır.`}
      >
        <ul className="rows">
          {fillers.map((f) => (
            <li key={f.title} className="row">
              <p className="row-title">
                {f.title} <span className="muted">· {f.amount}</span>
              </p>
              <p className="row-text">{f.how}</p>
              <p className="row-meta">
                {f.roles.map((role) => (
                  <RoleChip key={role} role={role} />
                ))}
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="aylik" index="03" title="Aylık ciro (elde tutma %70)" desc="Plan senaryosu: aylık elde tutma %70; hedef küçük bir tamponla aşılır. 60. günde (Aralık sonu) yaklaşık 1,2 milyon ₺.">
        <Chart
          spec={{
            kind: 'gelir-ay',
            months: MONTHS,
            first: NEW_ACTIVE.map((n) => Math.round(n * sub)),
            renew: base.renewals.map((n) => Math.round(n * sub)),
            target: CIRO_TARGET,
          }}
          title="İlk ödemeler, yenilemeler ve kümülatif ciro"
          summary={`Kasım ${lira(Math.round(base.monthly[0] * sub))}, Aralık ${lira(Math.round(base.monthly[1] * sub))}, Ocak ${lira(Math.round(base.monthly[2] * sub))}; toplam ${lira(Math.round(base.total * sub))}.`}
        />
        <DataTable
          id="aylik-tablo"
          title="Grafiğin verisi"
          rows={MONTHS.map((m, i) => ({ m, first: NEW_ACTIVE[i], renew: base.renewals[i], revenue: base.monthly[i] * sub }))}
          columns={[
            { key: 'm', header: 'Ay', nowrap: true, rowHeader: true, render: (r) => r.m },
            { key: 'first', header: 'Yeni aktif satıcı', nowrap: true, render: (r) => r.first },
            { key: 'renew', header: 'Yenileme', nowrap: true, render: (r) => r.renew.toFixed(1).replace('.', ',') },
            { key: 'revenue', header: 'Ciro', nowrap: true, render: (r) => lira(Math.round(r.revenue)) },
          ]}
        />
      </Section>

      <Section id="satici-yapisi" index="04" title="90. günde satıcı yapısı" desc="600 kayıtlı satıcının 100’ü aylık abonelik öder (aktif), 500’ü üyedir (ödeme yapmaz).">
        <Chart
          spec={{ kind: 'satici-yapisi', items: [{ name: 'Aktif satıcı (abonelik)', value: 100 }, { name: 'Üye satıcı (ödemesiz)', value: 500 }] }}
          title="Aktif ve üye satıcı"
          summary="90. gün hedefi: 100 aktif, 500 üye satıcı; toplam 600 kayıt."
        />
      </Section>

      <Section id="kaynaklar" index="05" title="Hedefin kaynaklara dağılımı" desc="Plan değerleridir; haftalık veriyle kalibre edilir. Ağ, Meta reklamlarıyla ayda ~2 aktif temsilci getirdiği için katkısı sınırlıdır; kalan kısım açık olarak gösterilir.">
        <Chart
          spec={{
            kind: 'kaynak-ay',
            months: MONTHS,
            unit: 'Aktif satıcı',
            series: targetPlan.map((t) => ({ name: t.source, role: t.role, values: t.aktif })),
          }}
          title="Aylara ve kaynaklara göre yeni aktif satıcı"
          summary={`Kasım ${totalAktif[0]}, Aralık ${totalAktif[1]}, Ocak ${totalAktif[2]} yeni aktif satıcı; toplam ${sum(totalAktif)}.`}
        />
        <DataTable
          id="kaynak-tablosu"
          title="Kayıt ve yeni aktif satıcı (kaynak × ay)"
          rows={[...targetPlan, { source: 'Toplam', role: 'yonetici' as RoleKey, kayit: totalKayit, aktif: totalAktif }]}
          rowTone={(r) => (r.source === 'Toplam' ? 'milestone' : undefined)}
          columns={[
            { key: 'source', header: 'Kaynak', minWidth: '15rem', rowHeader: true, render: (r) => r.source },
            ...MONTHS.map((m, i) => ({
              key: m,
              header: `${m} (kayıt / aktif)`,
              minWidth: '9rem',
              render: (r: { kayit: number[]; aktif: number[] }) => `${r.kayit[i]} / ${r.aktif[i]}`,
            })),
            { key: 'total', header: '90 gün', nowrap: true, render: (r) => `${sum(r.kayit)} / ${sum(r.aktif)}` },
          ]}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- Eylem planı ---------- */

export function PlanPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ortak · Eylem planı · 19 Ekim 2026 – 30 Ocak 2027"
        title="Hafta hafta 90 gün"
        lead="H0 işe alım haftalarıdır; H1, 2 Kasım’da başlar. Her sütun bir rolün şeridi; kilometre taşı haftaları etiketlidir."
      >
        <Toc
          items={[
            { id: 'serit', label: 'Haftalık şerit' },
            { id: 'kontrol-noktalari', label: 'Kontrol noktaları' },
            { id: 'kurulum', label: 'Kurulum listesi' },
          ]}
        />
      </Hero>

      <Section id="serit" index="01" title="Haftalık şerit" desc="Rol sayfalarındaki 90 günlük planların takvim üzerinde birleşimi.">
        <DataTable
          id="ana-plan"
          title="Rol × hafta"
          rows={masterPlan}
          rowTone={(r) => r.tone}
          columns={[
            {
              key: 'week',
              header: 'Hafta',
              minWidth: '8.5rem',
              rowHeader: true,
              sticky: true,
              render: (r) => (
                <>
                  {r.week}
                  <span className="cell-sub">{r.dates}</span>
                  {r.tone === 'milestone' ? <span className="cell-sub milestone-cell">Kilometre taşı</span> : null}
                </>
              ),
            },
            { key: 'yonetici', header: 'İsmail Karaca', role: 'yonetici', minWidth: '13rem', render: (r) => r.yonetici },
            { key: 'dijital', header: 'Dijital pazarlama', role: 'dijital-pazarlama', minWidth: '12rem', render: (r) => r.dijital },
            { key: 'pazarlamaci', header: 'Masa başı (CRM)', role: 'pazarlamaci', minWidth: '12rem', render: (r) => r.pazarlamaci },
            { key: 'saha', header: 'Saha ekibi', role: 'saha-uzmani', minWidth: '12rem', render: (r) => r.saha },
            { key: 'organizator', header: 'Organizatör', role: 'organizator', minWidth: '12rem', render: (r) => r.organizator },
            { key: 'asistan', header: 'Asistan', role: 'asistan', minWidth: '12rem', render: (r) => r.asistan },
            { key: 'lider', header: 'Ekip lideri ve ağ', role: 'ekip-lideri', minWidth: '12rem', render: (r) => r.lider },
          ]}
        />
      </Section>

      <Section id="kontrol-noktalari" index="02" title="Kontrol noktaları" desc="Önce kayıp, bütçe ve süre sınırına bakılır; sonra sürdür, iyileştir veya durdur kararı verilir.">
        <ol className="steps">
          {checkpoints.map((c) => (
            <li key={c.day} className="step">
              <p className="step-label">{c.day}</p>
              <p className="step-date">{c.date}</p>
              <p className="step-text">
                <strong>Ölçülen:</strong> {c.measure}
              </p>
              <p className="step-text">
                <strong>Karar:</strong> {c.rule}
              </p>
            </li>
          ))}
        </ol>
        <Flow steps={governanceFlow.slice(-1)} label="Kontrol noktası karar kuralı" />
      </Section>

      <Section id="kurulum" index="03" title="Kurulum listesi" desc="Tahtanın SAHA sütunundaki kurulum işleri: mekân, personel, iki ayrı onboarding, dokümantasyon, görevler ve KPI’lar.">
        <ul className="rows">
          {setupChecklist.map((item) => (
            <li key={item.item} className="row">
              <p className="row-title">{item.item}</p>
              <p className="row-text">{item.detail}</p>
              <p className="row-meta">
                <span className="chip" data-status="oneri">
                  {item.due}
                </span>
              </p>
            </li>
          ))}
        </ul>
      </Section>
    </AppFrame>
  );
}

/* ---------- İş akışları ---------- */

export function WorkflowsPage({ pathname }: { pathname: string }) {
  const flows = [gtmFunnel, onboardingCheck, employeeOnboarding, changelogFlow, escalation];
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ortak · İş akışları"
        title="İş nasıl el değiştirir?"
        lead="Talepten aktif satıcıya kadar her adımın sahibi, çıktısı ve süresi. Müşteri onboarding’i ile personel onboarding’i ayrı süreçlerdir."
      >
        <Toc
          items={[
            ...flows.map((f) => ({ id: f.id, label: f.title.split(':')[0] })),
            { id: 'crm', label: 'CRM aşamaları' },
            { id: 'devir', label: 'Devir kuralları' },
            { id: 'raci', label: 'Sorumluluk matrisi' },
          ]}
        />
      </Hero>

      {flows.map((flow, i) => (
        <Section key={flow.id} id={flow.id} index={String(i + 1).padStart(2, '0')} title={flow.title} desc={flow.desc}>
          <Flow steps={flow.steps} label={flow.title} />
        </Section>
      ))}

      <Section id="crm" index="06" title="CRM aşamaları" desc="Her kayıt bu aşamalardan geçer; aşama değişikliği aynı gün işlenir. Kayıp nedeni kodu zorunludur.">
        <DataTable
          id="crm-asamalari"
          title="Aşama, giriş ölçütü ve süre"
          rows={crmStages}
          columns={[
            { key: 'stage', header: 'Aşama', minWidth: '10rem', rowHeader: true, render: (r) => r.stage },
            { key: 'entry', header: 'Giriş ölçütü', minWidth: '16rem', render: (r) => r.entry },
            { key: 'owner', header: 'Sorumlu', minWidth: '11rem', render: (r) => r.owner },
            { key: 'sla', header: 'Süre', minWidth: '11rem', render: (r) => r.sla },
            { key: 'next', header: 'Sonraki', minWidth: '10rem', render: (r) => r.next },
          ]}
        />
      </Section>

      <Section id="devir" index="07" title="Devir kuralları" desc="Bir işin bir rolden diğerine geçtiği noktalar.">
        <DataTable
          id="devir-kurallari"
          title="Kimden, kime, ne zaman"
          rows={handoffRules}
          columns={[
            { key: 'from', header: 'Kimden', minWidth: '10rem', rowHeader: true, render: (r) => r.from },
            { key: 'to', header: 'Kime', minWidth: '10rem', render: (r) => r.to },
            { key: 'what', header: 'Ne', minWidth: '9rem', render: (r) => r.what },
            { key: 'rule', header: 'Kural', minWidth: '18rem', render: (r) => r.rule },
            { key: 'sla', header: 'Süre', minWidth: '10rem', render: (r) => r.sla },
          ]}
        />
      </Section>

      <Section id="raci" index="08" title="Sorumluluk matrisi" desc="S: sorumlu (işi yapan) · O: onaylayan · D: danışılan · B: bilgilendirilen.">
        <DataTable
          id="raci-tablosu"
          title="Süreç × rol"
          rows={raci}
          columns={[
            { key: 'process', header: 'Süreç', minWidth: '14rem', rowHeader: true, sticky: true, render: (r) => r.process },
            ...raciColumns.map((role) => ({
              key: role,
              header: ROLE_LABELS[role],
              minWidth: '7.5rem',
              render: (r: (typeof raci)[number]) => {
                const mark = r.cells[role];
                return mark ? (
                  <span className="raci-mark" data-mark={mark}>
                    {mark}
                  </span>
                ) : (
                  <span className="visually-hidden">yok</span>
                );
              },
            })),
          ]}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- Satıcı eğitimleri ---------- */

export function TrainingPage({ pathname }: { pathname: string }) {
  const organizer = getRole('organizator');
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ağaç 4 · Organizatör · 1 Aralık’tan itibaren"
        title="Her iş günü 17:00–18:00"
        lead="Organizatör İstoç satıcılarını sektör segmentlerine göre ofisteki toplantı salonunda toplar; beş modül ve mentor programıyla satıcıyı kayıttan büyümeye taşır. Haftada iki oturum 15 kişilik davetli organizasyondur."
      >
        <Toc
          items={[
            { id: 'moduller', label: 'Modüller' },
            { id: 'haftalik-takvim', label: 'Haftalık takvim' },
            { id: 'oturum', label: 'Bir oturum' },
            { id: 'segmentler', label: 'Segmentler ve iş birlikleri' },
          ]}
        />
      </Hero>

      <Section id="moduller" index="4.8.1" title="Modüller" desc="Konular iStoc’un herkese açık satıcı sayfasındaki özelliklerden derlendi; ürün değiştikçe asistan desteleri günceller.">
        <ol className="ladder" data-role={organizer.slug}>
          {modules.map((m) => (
            <li key={m.code} className="rung">
              <p className="rung-code">
                <strong>{m.code}</strong>
              </p>
              <p className="rung-name">{m.title}</p>
              <p className="rung-build">{m.goal}</p>
              <ul className="cell-list muted">
                {m.content.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <p className="rung-exit">
                <span className="muted">Ödev: </span>
                {m.homework}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="haftalik-takvim" index="4.8.2" title="Haftalık takvim" desc="Yeni bir satıcı Pazartesi M1 ile başlar ve aynı hafta M4’e kadar ilerleyebilir.">
        <ol className="week" data-role={organizer.slug}>
          {weeklySchedule.map((d) => (
            <li key={d.day} className="week-day" data-edge="top">
              <p className="week-name">{d.day}</p>
              <p className="week-focus">{d.session}</p>
              <p className="week-work">{d.format}</p>
              <p className="week-output">Kapasite: {d.capacity}</p>
            </li>
          ))}
        </ol>
      </Section>

      <Section id="oturum" index="4.8.3" title="Bir oturum" desc="60 dakikalık oturum ve ardından birebir destek.">
        <DataTable
          id="oturum-akisi"
          title="Oturum akışı"
          rows={sessionFlow}
          columns={[
            { key: 'time', header: 'Saat', nowrap: true, rowHeader: true, render: (r) => r.time },
            { key: 'part', header: 'Bölüm', minWidth: '9rem', render: (r) => r.part },
            { key: 'detail', header: 'Ne yapılır', minWidth: '18rem', render: (r) => r.detail },
          ]}
        />
      </Section>

      <Section id="segmentler" index="4.8.4" title="Segmentler ve iş birlikleri" desc="Her oturum tek bir segmente göre kurgulanır. Liste örnektir; organizatör ilk hafta İstoç’un gerçek blok ve sektör haritasıyla doğrular.">
        <Bullets items={segments} />
        <DataTable
          id="is-birlikleri"
          title="Kurumsal iş birliği türleri"
          rows={partnerTypes}
          columns={[
            { key: 'type', header: 'Tür', minWidth: '9rem', rowHeader: true, render: (r) => r.type },
            { key: 'example', header: 'Örnek', minWidth: '14rem', render: (r) => r.example },
            { key: 'offer', header: 'Biz ne sunarız', minWidth: '14rem', render: (r) => r.offer },
            { key: 'ask', header: 'Ne isteriz', minWidth: '13rem', render: (r) => r.ask },
          ]}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- İstihdam ---------- */

export function HiringPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ortak · İstihdam"
        title="İstihdam takvimi"
        lead="1 Kasım’da beş kişi, 1 Aralık’ta organizatör. Ekip lideri içeriden seçilir; bağımsız satış temsilcileri Meta reklamlarıyla sürekli gelir. Asistan alınmazsa dijital pazarlama 1 Ocak’a kayar."
      >
        <Toc
          items={[
            { id: 'takvim', label: 'Takvim' },
            { id: 'kadro', label: 'Kadro' },
            { id: 'surec', label: 'İşe alım süreci' },
            { id: 'mulakat', label: 'Mülakat' },
            { id: 'personel-onboardingi', label: 'Personel onboarding’i' },
            { id: 'ucret', label: 'Ücret yapısı' },
            { id: 'ilanlar', label: 'İlanlar' },
          ]}
        />
      </Hero>

      <Section id="takvim" index="01" title="Takvim" desc="Kararınızdaki sıra ve tarihler. Kesikli çubuk asistansız senaryodur.">
        <Chart
          spec={hiringGantt()}
          tall
          title="İstihdam zaman çizelgesi (19 Ekim 2026 – 30 Ocak 2027)"
          note="Çubuk işe başlangıçtan 90. gün değerlendirmesine kadar uzanır."
          summary="İsmail Karaca şimdi; asistan, masa başı (CRM), saha ekibi (2 kişi) ve dijital pazarlama 1 Kasım; asistan yoksa dijital pazarlama 1 Ocak; organizatör ve ekip lideri 1 Aralık; bağımsız temsilciler 23 Kasım’dan itibaren."
        />
        <HiringScheduleList />
      </Section>

      <Section id="kadro" index="02" title="Kadro">
        <ul className="rows">
          {hiringPlan.map((h) => (
            <li key={h.title} className="row">
              <p className="row-title">
                {h.title} <span className="muted">· {h.count}</span>
              </p>
              <p className="row-text">
                {h.start} · {h.step}. {h.employment}
              </p>
              <p className="row-meta">
                <RoleChip role={h.role} />
                <StatusChip status={h.status} />
              </p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="surec" index="03" title="İşe alım süreci" desc="1 Kasım grubunun sıkı takvimi: 30 Ekim’de sözleşme. Kanal: Meta reklamları, haftalık 5.000 ₺, sürekli; sorumlu İsmail Karaca (dijital pazarlama uzmanı gelene kadar).">
        <ul className="rows">
          {hiringTimeline.map((t) => (
            <li key={t.date + t.step} className="row">
              <p className="row-title">
                {t.date} <span className="muted">· {t.step}</span>
              </p>
              <p className="row-text">{t.detail}</p>
              <p className="row-meta muted">{t.who}</p>
            </li>
          ))}
        </ul>
        <DataTable
          id="kanallar"
          title="İlan kanalları"
          rows={channels}
          columns={[
            { key: 'channel', header: 'Kanal', minWidth: '12rem', rowHeader: true, render: (r) => r.channel },
            { key: 'fit', header: 'Uygun rol', minWidth: '14rem', render: (r) => r.fit },
            { key: 'note', header: 'Not', minWidth: '18rem', render: (r) => r.note },
          ]}
        />
      </Section>

      <Section id="mulakat" index="04" title="Mülakat" desc="Her rol gerçek işe benzeyen bir vakayla seçilir; puanlama aynı tabloyla yapılır.">
        <ul className="role-cards">
          {interviewCases.map((c) => (
            <li key={c.title}>
              <div className="role-card is-static" data-role={c.role}>
                <span className="role-card-title">{c.title}</span>
                <span className="role-card-meta">{c.time}</span>
                <span>{c.task}</span>
                <span className="role-card-desc">
                  <strong>Neye bakılır:</strong> {c.look}
                </span>
              </div>
            </li>
          ))}
        </ul>
        <DataTable
          id="puan-tablosu"
          title="Puan tablosu (1–5)"
          rows={rubric}
          columns={[
            { key: 'criterion', header: 'Ölçüt', minWidth: '11rem', rowHeader: true, render: (r) => r.criterion },
            { key: 'low', header: '1 puan', minWidth: '13rem', render: (r) => r.low },
            { key: 'mid', header: '3 puan', minWidth: '13rem', render: (r) => r.mid },
            { key: 'high', header: '5 puan', minWidth: '15rem', render: (r) => r.high },
          ]}
        />
      </Section>

      <Section
        id="personel-onboardingi"
        index="05"
        title={employeeOnboarding.title}
        desc={employeeOnboarding.desc}
      >
        <Flow steps={employeeOnboarding.steps} label={employeeOnboarding.title} />
        <ol className="week">
          {firstWeek.map((d) => (
            <li key={d.day} className="week-day" data-edge="top">
              <p className="week-name">{d.day}</p>
              <p className="week-work">{d.items}</p>
            </li>
          ))}
        </ol>
        <p className="after-block">
          <TextLink to="/is-akislari/#onboarding-kontrolu" standalone>
            Ayrı süreç: müşteri onboarding’i
          </TextLink>
        </p>
      </Section>

      <Section id="ucret" index="06" title="Ücret yapısı" desc="Ücret tutarları planlama panosundadır; bu herkese açık sitede yalnız yapı gösterilir. Deneme süresi en çok 2 aydır.">
        <DataTable
          id="ucret-yapisi"
          title="Sabit, değişken ve fazla çalışma"
          rows={compensation}
          columns={[
            { key: 'title', header: 'Rol', minWidth: '10rem', rowHeader: true, render: (r) => r.title },
            { key: 'fixed', header: 'Sabit', minWidth: '10rem', render: (r) => r.fixed },
            { key: 'variable', header: 'Değişken', minWidth: '16rem', render: (r) => r.variable },
            { key: 'overtime', header: 'Fazla çalışma', minWidth: '15rem', render: (r) => r.overtime },
          ]}
        />
      </Section>

      <Section id="ilanlar" index="07" title="İlan özetleri">
        <ul className="role-cards">
          {jobAds.map((ad) => (
            <li key={ad.title}>
              <div className="role-card is-static" data-role={ad.role}>
                <span className="role-card-title">{ad.title}</span>
                <CellList items={ad.lines} />
              </div>
            </li>
          ))}
        </ul>
      </Section>
    </AppFrame>
  );
}

/* ---------- Çok katmanlı pazarlama (MLM) ağı ---------- */

export function GrowthPage({ pathname }: { pathname: string }) {
  const leader = getRole('ekip-lideri');
  const levelRoles: RoleKey[] = ['yonetici', 'ekip-lideri', 'pazarlamaci', 'saha-uzmani'];
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ağaç 3 · Saha satış · dal 3.9"
        title="Çok katmanlı pazarlama (MLM) ağı"
        lead="Doğrudan satış modeli: bağımsız satış temsilcileri pazarlama çözümü paketlerini satar, başarılı olanlar sponsor olarak kendi alt hattını kurar. Kazanç yalnız gerçek satıştan doğar. Adaylar Meta reklamlarıyla, haftalık 5.000 ₺ bütçeyle ve sürekli bulunur."
      >
        <Toc
          items={[
            { id: 'kademeler', label: 'Kademe yapısı' },
            { id: 'terimler', label: 'Terimler' },
            { id: 'meta', label: 'Meta ile aday bulma' },
            { id: 'ilkeler', label: 'Kazanç ve uyum' },
            { id: 'yolculuk', label: 'Temsilci yolculuğu' },
            { id: 'takvim', label: 'Takvim ve hedefler' },
          ]}
        />
      </Hero>

      <Section id="kademeler" index="3.9.1" title="Kademe yapısı" desc="90. gün hedef yapısı. Grafik kademe sırasını gösterir; etiketler kişi sayısıdır.">
        <Chart
          spec={{ kind: 'piramit', items: levels.map((l, i) => ({ name: `${l.level}: ${l.name}`, count: l.count, role: levelRoles[i] })) }}
          tall
          title="Ağın kademe yapısı (piramit grafik)"
          summary={levels.map((l) => `${l.level} ${l.name}: ${l.count}`).join('; ')}
        />
        <DataTable
          id="kademe-tablosu"
          title="Kademe, kişi ve kazanç esası"
          rows={tiers}
          columns={[
            { key: 'tier', header: 'Kademe', nowrap: true, rowHeader: true, render: (r) => r.tier },
            { key: 'role', header: 'Rol', minWidth: '12rem', render: (r) => r.role },
            { key: 'who', header: 'Kim', minWidth: '16rem', render: (r) => r.who },
            { key: 'when', header: 'Ne zaman', minWidth: '10rem', render: (r) => r.when },
            { key: 'earning', header: 'Kazanç esası', minWidth: '18rem', render: (r) => r.earning },
          ]}
        />
      </Section>

      <Section id="terimler" index="3.9.2" title="Terimler" desc="Modelin teknik dili ve bu plandaki karşılığı.">
        <DataTable
          id="terim-tablosu"
          title="Çok katmanlı pazarlama terimleri"
          rows={glossary}
          columns={[
            { key: 'term', header: 'Terim', minWidth: '14rem', rowHeader: true, render: (r) => r.term },
            { key: 'meaning', header: 'Anlamı', minWidth: '18rem', render: (r) => r.meaning },
            { key: 'here', header: 'Bu planda', minWidth: '14rem', render: (r) => r.here },
          ]}
        />
      </Section>

      <Section id="meta" index="3.9.3" title="Meta ile aday bulma" desc="Haftalık huni varsayımdır; ilk 2 haftada ölçülerek kalibre edilir. Sorumlu: dijital pazarlama uzmanı gelene kadar İsmail Karaca.">
        <Chart
          spec={{ kind: 'huni', role: 'dijital-pazarlama', items: recruitmentFunnel.map((f) => ({ name: f.stage, value: f.value })) }}
          title="Haftalık aday hunisi (5.000 ₺ / hafta)"
          summary={recruitmentFunnel.map((f) => `${f.stage}: ${f.value}`).join('; ')}
        />
        <DataTable
          id="huni-tablosu"
          title="Huninin verisi"
          rows={recruitmentFunnel}
          columns={[
            { key: 'stage', header: 'Aşama', minWidth: '14rem', rowHeader: true, render: (r) => r.stage },
            { key: 'value', header: 'Haftalık', nowrap: true, render: (r) => r.value },
            { key: 'note', header: 'Not', minWidth: '14rem', render: (r) => r.note },
          ]}
        />
      </Section>

      <Section id="ilkeler" index="3.9.4" title="Kazanç ve uyum ilkeleri">
        <div className="split">
          <div className="panel">
            <h3 className="block-title">Kazanç</h3>
            <Bullets items={earningPrinciples} />
          </div>
          <div className="panel">
            <h3 className="block-title">Uyum</h3>
            <Bullets items={compliance} />
          </div>
        </div>
      </Section>

      <Section id="yolculuk" index="3.9.5" title={leader.workflow.title} desc={leader.workflow.desc}>
        <Flow steps={leader.workflow.steps} label={leader.workflow.title} />
      </Section>

      <Section id="takvim" index="3.9.6" title="Takvim ve hedefler">
        <ul className="rows">
          {growthTimeline.map((g) => (
            <li key={g.period} className="row">
              <p className="row-title">{g.period}</p>
              <p className="row-text">
                {g.step} → {g.output}
              </p>
              <p className="row-meta muted">{g.owner}</p>
            </li>
          ))}
        </ul>
        <DataTable
          id="ag-hedefleri"
          title="Ağ hedefleri"
          rows={growthKpis}
          columns={[
            { key: 'metric', header: 'Ölçüt', minWidth: '13rem', rowHeader: true, render: (r) => r.metric },
            { key: 'target', header: 'Hedef', minWidth: '13rem', render: (r) => r.target },
            { key: 'note', header: 'Not', minWidth: '16rem', render: (r) => r.note },
          ]}
        />
      </Section>
    </AppFrame>
  );
}

/* ---------- Çalışma düzeni ---------- */

export function RulesPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero
        eyebrow="Ortak · Çalışma düzeni"
        title="Yoğun tempo, yasal çerçevede"
        lead="Günde 11 saat ve Cumartesi yarım gün. Plan 4857 sayılı İş Kanunu’nun sınırlarına göre kuruldu; uygulamadan önce İK ve mali müşavirle teyit edilmelidir."
      >
        <Toc
          items={[
            { id: 'mesai', label: 'Mesai' },
            { id: 'yasal', label: 'Yasal çerçeve' },
            { id: 'ritim', label: 'Yönetim ritmi' },
            { id: 'iletisim-kurallari', label: 'İletişim kuralları' },
          ]}
        />
      </Hero>

      <Section id="mesai" index="01" title="Mesai">
        <DataTable
          id="mesai-tablosu"
          title="Saatler ve fazla çalışma"
          rows={shifts}
          columns={[
            { key: 'role', header: 'Rol', minWidth: '16rem', rowHeader: true, render: (r) => r.role },
            { key: 'weekday', header: 'Pazartesi–Cuma', nowrap: true, render: (r) => r.weekday },
            { key: 'saturday', header: 'Cumartesi', nowrap: true, render: (r) => r.saturday },
            { key: 'breaks', header: 'Ara dinlenme', minWidth: '12rem', render: (r) => r.breaks },
            { key: 'weekly', header: 'Haftalık net', nowrap: true, render: (r) => r.weekly },
            { key: 'overtime', header: 'Fazla çalışma / hafta', minWidth: '9rem', render: (r) => r.overtime },
            { key: 'quarter', header: '13 haftada', nowrap: true, render: (r) => r.quarter },
          ]}
        />
        <Note title="90. günden sonra">
          <p>
            Yıllık fazla çalışma sınırı 270 saattir. Bu tempo yaklaşık 16–18 hafta sürdürülebilir; 30 Ocak 2027
            değerlendirmesinde yeni mesai modeli kararı gerekir.
          </p>
        </Note>
      </Section>

      <Section id="yasal" index="02" title="Yasal çerçeve" desc="4857 sayılı İş Kanunu. Bu tablo hukuki görüş değildir.">
        <ul className="rows">
          {legal.map((l) => (
            <li key={l.rule} className="row" data-cols="2">
              <p className="row-title">{l.rule}</p>
              <p className="row-text">{l.impact}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section id="ritim" index="03" title="Yönetim ritmi" desc="Toplantılar ve raporlar; hepsi günlük 11 saatin içindedir.">
        <DataTable
          id="ritim-tablosu"
          title="Toplantı ve rapor takvimi"
          rows={rhythm}
          columns={[
            { key: 'ritual', header: 'Ritim', minWidth: '12rem', rowHeader: true, render: (r) => r.ritual },
            { key: 'when', header: 'Ne zaman', minWidth: '12rem', render: (r) => r.when },
            { key: 'length', header: 'Süre', nowrap: true, render: (r) => r.length },
            { key: 'who', header: 'Kim', minWidth: '16rem', render: (r) => r.who },
            { key: 'output', header: 'Çıktı', minWidth: '12rem', render: (r) => r.output },
          ]}
        />
      </Section>

      <Section
        id="iletisim-kurallari"
        index="04"
        title="İletişim kuralları"
        desc="Tahtada “spam” olarak geçen kanallar, izinli ve ret seçenekli iletişim olarak uygulanır. Hesap kapanması ve şikâyet riskini de bu kurallar önler."
      >
        <ul className="rows">
          {channelRules.map((c) => (
            <li key={c.channel} className="row">
              <p className="row-title">{c.channel}</p>
              <p className="row-text">{c.rule}</p>
              <p className="row-meta muted">{c.why}</p>
            </li>
          ))}
        </ul>
      </Section>
    </AppFrame>
  );
}

/* ---------- 404 ---------- */

export function NotFoundPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Hero eyebrow="404" title="Sayfa bulunamadı" lead="Aradığınız sayfa taşınmış veya hiç var olmamış olabilir.">
        <p className="after-block">
          <TextLink to="/" standalone>
            Genel ağaca dön
          </TextLink>
        </p>
      </Hero>
    </AppFrame>
  );
}
