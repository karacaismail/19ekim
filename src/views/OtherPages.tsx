import { useEffect, useState, type ReactNode } from 'react';
import { AppFrame } from '../components/AppFrame';
import {
  Chart,
  DataTable,
  formatDate,
  Note,
  RoleChip,
  Section,
  Stats,
  Target,
  TextLink,
} from '../components/ui';
import { PageHeader } from '../components/PageHeader';
import { GuncelPlan, IstihdamPlanGorunumu } from './IstihdamPlani';
import { KararSecimleri } from '../components/KararSecimleri';
import { boardMapping, type BoardRow } from '../data/archive';
import type { CrmStage, GovNode, PayRule, WorkPeriod } from '../data/program';
import { KARAR_DURUM_ADI, kararDurumu, type KararKaydi } from '../data/kararlar';
import { icerikOf } from '../data/icerik';
import { ROLE_LABELS } from '../data/roles';
import type { RoleKey } from '../data/types';
import { useModel } from '../components/ModelContext';
import { Araclar, SenaryoSecimi } from '../components/Senaryo';
import type { StaffResult } from '../data/staffing';
import { addDays, longDate } from '../lib/dates';
import { useScenario } from '../lib/scenario';
import type { ChartTreeNode, GanttRow } from '../lib/chartSpec';

const lira = (value: number) => `${new Intl.NumberFormat('tr-TR').format(Math.round(value))} ₺`;
const pct = (value: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(value * 100)}`;
const sum = (values: number[]) => values.reduce((a, b) => a + b, 0);
/** Olayın günü: “1 Aralık Salı” (her tarihte gün adı, kullanıcı kararı 13 Kasım 2026). */
const shortDate = (iso: string) =>
  new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' }).format(new Date(`${iso}T00:00:00`));
/** Grafik ekseninin ölçek yazısı: “1 Aralık”. Eksen bir olayın günü değildir, gün adı yazılmaz. */
const eksenTarihi = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' }).format(new Date(`${iso}T00:00:00`));

/* ---------- İstihdam takvimi: plan görünümü (IstihdamPlani.tsx) ve kadro katkısı ---------- */

/** İstihdam takvimi v1. `surum`: sürüm seçicisi, başlığın altında (IstihdamSurumleri.tsx). */
export function HiringContent({ surum }: { surum?: ReactNode }) {
  const m = useModel();
  const [sid, setSid] = useScenario();
  const st = m.staffing.byId[sid];
  const sc = st.scenario;
  const H = m.staffing.horizon;
  const kisaTarih = (iso: string) => new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' }).format(new Date(`${iso}T00:00:00`));
  return (
    <>
      <PageHeader title="İstihdam takvimi" purpose="Kimin hangi tarihte başladığını ve sıradaki adımları gösterir." />
      {surum}

      <IstihdamPlanGorunumu />

      <Section
        id="katki"
        index={2}
        title="Görev, gider ve gelir katkısı (senaryo)"
        desc={`İstihdam planı 27 Ekim 2026 Salı günü alınan kararla gelir planına bağlandı. Tablo her rolün görevini ve işveren maliyetini gösterir. Tablo, seçili senaryoda ${m.revenue.months[0].ad} ile ${m.revenue.months[H - 1].ad} arasındaki ${H} ayda gelire katkıyı da gösterir. Katkıyı şöyle hesaplarız: Gelir planından bu rolü çıkarırız. Kaybolan gelir, rolün katkısıdır. Doğrudan satış yapmayan rollerin katkısı hesaplanmaz. Burada seçilen senaryo, “Gelir planı” ve “Nakit akışı” sayfalarında da geçerli olur.`}
        tools={
          <Araclar role={sc.role}>
            <SenaryoSecimi scenarios={m.revenue.scenarios} value={sid} onChange={setSid} />
          </Araclar>
        }
      >
        <Stats
          items={[
            { label: `Kadro gideri, ${H} ay`, value: lira(st.toplam.gider), note: `Maaşlı roller, reklam bütçesi ve temsilci primi (${sc.name})` },
            { label: `Gelire katkı, ${H} ay`, value: lira(st.toplam.katki), note: `Kaynakların toplamı (${sc.name})` },
            { label: 'Net katkı (katkıdan gider çıkınca kalan)', value: lira(st.toplam.net), note: 'Ofis, yazılım ekibi ve yapay zekâ araçları hariç' },
          ]}
        />
        <DataTable
          id="istihdam-katki"
          title={`Rol, görev, gider ve gelire katkı, ${H} ay (${sc.name.toLocaleLowerCase('tr-TR')})`}
          /* Senaryo seçicisi bölümün başında bir kez durur. Tabloda ikinci kopyası yoktur. */
          columns={[
            { key: 'r', header: 'Rol', minWidth: '12rem', rowHeader: true, render: (x: StaffResult) => <RoleChip role={x.role.role} label={x.role.name} /> },
            { key: 'g', header: 'Görev', minWidth: '20rem', render: (x) => x.role.gorev },
            { key: 'y', header: 'Gelire nasıl katkı verir?', minWidth: '16rem', render: (x) => x.role.katkiYolu },
            { key: 's', header: 'Başlangıç', nowrap: true, render: (x) => kisaTarih(x.role.startIso) },
            { key: 'm', header: 'Aylık maliyet', nowrap: true, render: (x) => (x.role.katki.kind === 'rep' ? `${lira(m.params.commission)} / satış` : lira(x.role.maliyet)) },
            { key: 'c', header: `${H} ay gider`, nowrap: true, render: (x) => lira(x.gider) },
            { key: 'k', header: 'Gelire katkı', summary: true, nowrap: true, render: (x) => (x.dogrudan ? lira(x.katki) : 'Dolaylı') },
            { key: 'n', header: 'Net', nowrap: true, render: (x) => (x.dogrudan ? lira(x.net) : `${lira(x.net)} (yalnız gider)`) },
          ]}
          rows={st.rows}
          rowKey={(x) => x.role.id}
          rowTone={(x) => (x.dogrudan ? undefined : 'total')}
        />
        <p>
          <TextLink to="/gelir-plani/#kadro" standalone>
            Gelir planında kadroyu, dijital pazarlamayı ve başabaş ayını görün
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
    { option: 'Üye satıcıyı aktif satıcıya dönüştürmek', unit: `Ayda ${SUBSCRIPTION_EUR} €`, count: gapMonths, note: `500 üyenin ${pct(gapMonths / 500)} kadarı` },
  ];

  return (
    <>
      <PageHeader
        title="90 gün hedefleri"
        purpose="Aktif satıcı, ilk ödemesini yapmış ve ürünleri yayında olan satıcıdır."
        meta={[{ label: 'Dönem', value: `${longDate(dates.start)} ile ${longDate(dates.day90)} arası` }]}
      >
        <Stats items={targets} />
      </PageHeader>

      <Section
        id="kopru"
        index={1}
        title="Ciro hedefinin hesabı"
        desc={`Hesapta 1 € için ${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(m.params.eurTry)} ₺ kullanıldı. ${firstTotal} aktif satıcının ilk ödemeleri toplam ${lira(firstTotal * SUBSCRIPTION_TRY)} eder. Bir satıcının bir aylık ödemesine “satıcı-ay” denir. Hedefe ulaşmak için 90 günde ${Math.ceil(CIRO_TARGET / SUBSCRIPTION_TRY)} satıcı-ay ödeme gerekir. Aylık elde tutma, bir ay ödeyen satıcılardan ertesi ay yine ödeyenlerin oranıdır. ${m.retentionThreshold === null ? 'Abonelik tek başına bu hedefe yetmez' : `Bunun için aylık elde tutma en az ${pct(m.retentionThreshold)} olmalıdır`}.`}
      >
        <Chart
          id="kopru"
          title="Aylık elde tutma oranına göre 90 günlük ciro"
          summary={scenarios.map((s) => `${SCENARIO_LABEL(s.r)}: ${lira(s.ciro)}`).join('. ')}
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
        desc={`En kötü durumda hiçbir satıcı aboneliğini yenilemez. Bu durumda açık ${lira(gap)}, yani ${gapMonths} satıcı-ay olur. Açığı kapatmak için aşağıdaki seçeneklerden biri yeterlidir.`}
      >
        <DataTable
          id="acik"
          title="Açığı tek başına kapatan adet"
          columns={[
            { key: 'o', header: 'Seçenek', minWidth: '16rem', rowHeader: true, render: (o: (typeof options)[number]) => o.option },
            { key: 'u', header: 'Tutar', nowrap: true, render: (o) => o.unit },
            { key: 'c', header: 'Gereken adet', summary: true, nowrap: true, render: (o) => o.count },
            { key: 'n', header: 'Not', minWidth: '14rem', render: (o) => o.note },
          ]}
          rows={options}
        />
      </Section>

      <Section id="aylik" index={3} title="Aylık ciro" desc={`Plan senaryosu aylık elde tutmayı ${pct(m.planRetention)} varsayar.`}>
        <Chart
          id="gelir-ay"
          title="İlk ödemeler, yenilemeler ve ay ay biriken ciro"
          summary={`${MONTHS.map((m, i) => `${m}: ${lira(plan.monthly[i] * SUBSCRIPTION_TRY)}`).join('. ')}. Toplam ${lira(plan.total * SUBSCRIPTION_TRY)}.`}
          spec={{
            kind: 'gelir-ay',
            months: MONTHS,
            first: NEW_ACTIVE.map((n) => n * SUBSCRIPTION_TRY),
            renew: plan.renewals.map((n) => n * SUBSCRIPTION_TRY),
            target: CIRO_TARGET,
          }}
        />
      </Section>

      <Section id="kaynak" index={4} title="Kaynaklara göre" desc={`Bu bölüm, satış kanallarına göre yeni aktif satıcı ve kayıt sayısını gösterir. Aralık takviyesi olmadan hedefe 45 kayıt ve 8 aktif satıcı eksik kalır. Takviye ${longDate(dates.dec)} günü başlar ve bu eksiği kapatır (${labels.sahaDecLabel || 'takviye yok'}).`}>
        <Chart
          id="kaynak-ay"
          title="Satış kanalına ve aya göre yeni aktif satıcı"
          summary={targetPlan.map((t) => `${t.source}: ${t.aktif.map((v, i) => `${MONTHS[i]} ayında ${v}`).join(', ')}`).join('. ')}
          spec={{ kind: 'kaynak-ay', months: MONTHS, unit: 'Aktif satıcı', series: targetPlan.map((t) => ({ name: t.short, role: t.role, values: t.aktif })) }}
        />
        <DataTable
          id="kaynak"
          title="Satış kanalına ve aya göre kayıt ve yeni aktif satıcı"
          kayit="sutun"
          ozetSatir={(t) => t.source === 'Toplam'}
          columns={[
            { key: 's', header: 'Satış kanalı', minWidth: '15rem', rowHeader: true, render: (t: (typeof targetPlan)[number]) => t.source },
            ...MONTHS.map((m, i) => ({ key: m, header: m, nowrap: true, render: (t: (typeof targetPlan)[number]) => `${t.kayit[i]} kayıt, ${t.aktif[i]} yeni aktif` })),
            { key: 't', header: 'Toplam', nowrap: true, render: (t) => `${sum(t.kayit)} kayıt, ${sum(t.aktif)} yeni aktif` },
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
    ...managerPlan.map((p, i) => ({ who: 'yonetici' as RoleKey, label: `İsmail Karaca, ${i + 1}. eylem`, ...p })),
    ...roles.flatMap((role) => role.plan.map((p, i) => ({ who: role.slug, label: `${role.shortTitle}, ${i + 1}. eylem`, ...p }))),
  ];

  const start = actionRows.reduce((min, r) => (r.from < min ? r.from : min), actionRows[0].from);
  const end = actionRows.reduce((max, r) => (r.to > max ? r.to : max), actionRows[0].to);
  const rows: GanttRow[] = actionRows.map((r) => ({ name: r.label, from: r.from, to: r.to, role: r.who, text: `${r.action}. Hedef: ${r.target}`, milestone: r.milestone }));
  return (
    <>
      <PageHeader title="Eylem planı" purpose="istoc.com genel planını, her satırda tarihli bir eylem ve ölçülebilir bir hedefle gösterir." meta={[{ label: 'Dönem', value: `${formatDate(start)} ile ${formatDate(end)} arası` }]} />

      <GuncelPlan />

      <Section id="gantt" index={2} title="Zaman çizelgesi (Gantt şeması)" desc={`Gün sırası program başlangıcından (${longDate(dates.start)}) sayılır. Kesikli çizgiler iki kontrol gününü gösterir. ${longDate(dates.day60)} günü 60. gündür. ${longDate(dates.day90)} günü 90. gündür.`}>
        <Chart
          id="gantt"
          title="Kişilere göre zaman çizelgesi"
          summary={`Satırlar kişileri, sütunlar zamanı gösterir. Çizelgede ${formatDate(start)} ile ${formatDate(end)} arasında ${actionRows.length} eylem var. Kontrol günleri ${longDate(dates.day60)} ve ${longDate(dates.day90)} günleridir.`}
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

      <Section id="tablo" index={3} title="Eylemler" desc="Tablo her eylemin sahibini, tarihini ve hedefini gösterir.">
        <DataTable<ActionRow>
          id="eylem"
          title="Eylem, tarih ve hedef"
          columns={[
            { key: 'who', header: 'Kim', nowrap: true, rowHeader: true, render: (r) => <RoleChip role={r.who} /> },
            { key: 'when', header: 'Tarih', summary: true, nowrap: true, render: (r) => `${longDate(r.from)} ile ${longDate(r.to)} arası` },
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

function AuthorityContent({ ilkNo }: { ilkNo: number }) {
  const m = useModel();
  const { checkpoints, governanceTree, CIRO_TARGET, dates } = m;

  return (
    <>
      <Section id="yetki" index={ilkNo} title="Karar yetkisi" desc="Kimin neye karar verdiğini gösterir.">
        <Chart
          id="yetki"
          title="Yatırımcıdan İsmail Karaca’ya karar yetkisi"
          summary={`Yatırımcı ürüne ve bütçeye karar verir. En çok ne kadar zarar edilebileceğine de yatırımcı karar verir. İsmail Karaca maliyeti, kanıtı ve ekibin kapasitesini yönetir. Harcama yetki sınırını aşmıyorsa İsmail Karaca karar verir. Harcama bu sınırı aşıyorsa yatırımcı karar verir. Müşteri bulmak için iki kanal var. A kanalı iç satış ve sahadır. B kanalı dijital yoldan müşteri bulmaktır. Yalnız biri kullanılır. Bugün A kanalı seçili. Kontroller ${shortDate(dates.day60)} ve ${shortDate(dates.day90)} günlerinde yapılır. Her kontrolde planı sürdürme, iyileştirme veya durdurma kararı verilir.`}
          spec={{ kind: 'gov', root: govChart(governanceTree) }}
          size="xxl"
          wide
        />
      </Section>

      <Section id="kontrol" index={ilkNo + 1} title="Kontrol noktaları" desc={`Ciro hesaplanırken şu varsayıldı: Satıcıların ${pct(m.planRetention)} kadarı her ay aboneliğini sürdürür.`}>
        <Chart
          id="kontrol"
          title="Başlangıçtan bu yana aktif satıcı ve ciro"
          summary={checkpoints.map((c) => `${c.day} (${formatDate(c.date)}): ${c.aktif} aktif satıcı, ${lira(c.ciro)}`).join('. ')}
          spec={{ kind: 'checkpoint', days: checkpoints.map((c) => c.day), aktif: checkpoints.map((c) => c.aktif), ciro: checkpoints.map((c) => c.ciro), target: CIRO_TARGET }}
        />
        <DataTable
          id="kontrol"
          title="Kontrol günlerindeki eşikler ve kararlar"
          columns={[
            { key: 'd', header: 'Kontrol', nowrap: true, rowHeader: true, render: (c: (typeof checkpoints)[number]) => `${c.day} (${shortDate(c.date)})` },
            { key: 'a', header: 'Aktif satıcı', nowrap: true, render: (c) => `en az ${c.aktif}` },
            { key: 'k', header: 'Kayıt', nowrap: true, render: (c) => `en az ${c.kayit}` },
            { key: 'c', header: 'Başlangıçtan bu yana ciro', nowrap: true, render: (c) => `en az ${lira(c.ciro)}` },
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
  const { payRules, crmStages, LEGAL_LIMITS, workPeriods, OVERTIME_CAP, overtimeUsed, overtimeHourly, dates, params, kararlar } = m;
  const COMMISSION_PER_SALE = params.commission;
  // Bugün (gecikme ve yürürlük için) yalnız istemcide: sunucu ve ilk çizim tarihsiz (“bekliyor”), hidrasyon bozulmaz.
  const [bugun, setBugun] = useState('');
  // Yerel gün kullanılır. UTC kullanılsaydı İstanbul’da gece 00.00 ile 03.00 arası bir önceki gün sayılırdı.
  useEffect(() => {
    const d = new Date();
    setBugun(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }, []);
  const gorunum = (k: KararKaydi) => kararDurumu(k, bugun);
  const gecikmeGun = (k: KararKaydi) => (k.sonTarih && bugun ? Math.round((Date.UTC(+bugun.slice(0, 4), +bugun.slice(5, 7) - 1, +bugun.slice(8, 10)) - Date.UTC(+k.sonTarih.slice(0, 4), +k.sonTarih.slice(5, 7) - 1, +k.sonTarih.slice(8, 10))) / 86_400_000) : 0);
  const bekleyenler = kararlar.kayitlar.filter((k) => k.durum === 'bekliyor').sort((a, b) => (a.sonTarih ?? '9999').localeCompare(b.sonTarih ?? '9999'));
  const verilenler = kararlar.kayitlar.filter((k) => k.durum === 'verildi').sort((a, b) => b.kararTarihi!.localeCompare(a.kararTarihi!));
  const ozet = kararlar.ozet(bugun);
  const sayfaAdi = (yol: string) => {
    const k = icerikOf(yol);
    return k ? (k.menu ?? k.baslik) : yol;
  };
  const sorted = bekleyenler.filter((k) => k.sonTarih);
  const [p1, p2] = workPeriods;
  const weekLabels = Array.from({ length: CUMULATIVE_WEEKS }, (_, w) => eksenTarihi(addDays(dates.firstDay, w * 7)));
  const decWeek = Math.max(1, Math.round((new Date(dates.dec).getTime() - new Date(dates.firstDay).getTime()) / (7 * 86_400_000)) + 1);
  const deadlines = sorted.map((d) => d.sonTarih!);
  // Grafik son tarihten 14 gün sonra biter. Bugün daha ileriyse grafik bugünü de gösterir (gecikme görünür).
  const sonGun = addDays(deadlines[deadlines.length - 1], 14);
  const crossWeek = Math.ceil(OVERTIME_CAP / Math.max(1, p1.overtimePerWeek));
  const monthlyOvertime = Math.round((p1.overtimePerWeek * 52) / 12);
  return (
    <>
      {/* Karar defteri (adım 1a; docs/missings.md MS-13): soru → seçenekler/öneri → etki → karar veren → son tarih → sonuç → yürürlük. */}
      <PageHeader
        title="Kararlar"
        purpose="Bekleyen ve verilen kararları, karar yetkisini ve kontrol noktalarını tek yerde gösterir."
        meta={[{ label: 'Durum', value: `${ozet.bekleyen} karar bekliyor. Bunlardan ${ozet.gecikmis} tanesi gecikmiş. ${ozet.verilen} karar verildi. Bunlardan ${ozet.yururlukte} tanesi yürürlükte.` }]}
      />

      <KararSecimleri />

      <Section id="bekleyen" index={2} title="Bekleyen kararlar" desc="Site, son tarihi geçen kararı “Gecikti” diye işaretler. Bir kayıt ancak karar yazılınca “Verildi” olur.">
        <Chart
          id="son-tarih"
          title="Bekleyen kararların son tarihleri"
          summary={`${sorted.map((d) => `“${d.soru}” kararının son tarihi ${shortDate(d.sonTarih!)}. Kararı veren: ${ROLE_LABELS[d.sahip]}`).join('. ')}.${bugun ? ` Bugün ${shortDate(bugun)}.` : ''}`}
          spec={{ kind: 'deadlines', start: addDays(deadlines[0], -7), end: bugun && bugun > sonGun ? addDays(bugun, 7) : sonGun, today: bugun || undefined, items: sorted.map((d) => ({ name: d.soru, date: d.sonTarih!, role: d.sahip })) }}
          size="md"
          wide
        />
        <DataTable<KararKaydi>
          id="karar"
          title="Bekleyen kararlar ve etkileri"
          columns={[
            {
              key: 'sonTarih',
              header: 'Son tarih',
              nowrap: true,
              // Telefondaki kartta soru başlıktır. Son tarih ve durum başlığın altında özet olarak görünür.
              summary: true,
              render: (d) => (
                <>
                  {d.sonTarih ? shortDate(d.sonTarih) : 'Son tarih yok'}
                  <span className="cell-sub" data-durum={gorunum(d)}>
                    {gorunum(d) === 'gecikti' ? `${KARAR_DURUM_ADI.gecikti}. Son tarihten bu yana ${gecikmeGun(d)} gün geçti.` : KARAR_DURUM_ADI[gorunum(d)]}
                  </span>
                </>
              ),
            },
            { key: 'soru', header: 'Soru', minWidth: '14rem', rowHeader: true, render: (d) => d.soru },
            {
              key: 'oneri',
              header: 'Öneri veya seçenekler',
              minWidth: '18rem',
              render: (d) =>
                d.secenekler ? (
                  <ol className="karar-secenekler">
                    {d.secenekler.map((s) => (
                      <li key={s}>{s}</li>
                    ))}
                  </ol>
                ) : (
                  d.oneri
                ),
            },
            { key: 'etki', header: 'Etki', minWidth: '14rem', render: (d) => d.etki },
            {
              key: 'sahip',
              header: 'Karar veren',
              nowrap: true,
              render: (d) => (
                <>
                  <RoleChip role={d.sahip} />
                  {d.hazirlayan ? <span className="cell-sub">Hazırlayan: {ROLE_LABELS[d.hazirlayan]}</span> : null}
                </>
              ),
            },
          ]}
          rows={bekleyenler}
          rowKey={(d) => d.id}
        />
      </Section>

      <Section id="kesin" index={3} title="Verilen kararlar" desc="Tablo üç günün kararlarını listeler. İlk kararlar 19 Ekim 2026 Pazartesi günü alındı. Sonrakiler 28 Ekim 2026 Çarşamba ve 3 Kasım 2026 Salı günleri alındı. 19 Ekim Pazartesi kararları “Arşiv” sayfasındaki tahta notlarına dayanır. 28 Ekim Çarşamba ve 3 Kasım Salı kararlarını sahip verdi. “Yürürlükte” etiketi yalnız uygulamada karşılığı olan kararlar için kullanılır. Ücret, CRM ve mesai ayrıntıları aşağıdaki bölümlerdedir.">
        <DataTable<KararKaydi>
          id="verilen"
          title="Verilen kararların listesi"
          columns={[
            // Telefondaki kartta konu başlıktır, karar tarihi özettir. Uzun karar metni kart açılınca okunur.
            { key: 'kararTarihi', header: 'Karar tarihi', nowrap: true, summary: true, render: (d) => longDate(d.kararTarihi!) },
            { key: 'soru', header: 'Konu', minWidth: '12rem', rowHeader: true, render: (d) => d.soru },
            {
              key: 'sonuc',
              header: 'Karar',
              minWidth: '24rem',
              render: (d) => (
                <>
                  {d.sonuc}
                  {d.politika ? <span className="cell-sub">{d.politika}</span> : null}
                  {/* Her soru ayrı satırdadır. Sorular tek cümlede birleşmez. */}
                  {d.acik?.length ? (
                    <>
                      <span className="cell-sub">Cevap bekleyen sorular şunlardır:</span>
                      {d.acik.map((q) => (
                        <span key={q} className="cell-sub">
                          {q}
                        </span>
                      ))}
                    </>
                  ) : null}
                </>
              ),
            },
            {
              key: 'durum',
              header: 'Durum',
              nowrap: true,
              render: (d) => (gorunum(d) === 'yururlukte' ? `${KARAR_DURUM_ADI.yururlukte} (${shortDate(d.yururlukTarihi!)})` : d.yururlukTarihi ? `${KARAR_DURUM_ADI.verildi}. ${shortDate(d.yururlukTarihi)} günü yürürlüğe girer.` : `${KARAR_DURUM_ADI.verildi}. Uygulama bekliyor.`),
            },
            {
              key: 'ilgili',
              header: 'İlgili sayfa',
              minWidth: '10rem',
              render: (d) =>
                d.ilgili.length ? (
                  <ul className="karar-ilgili">
                    {d.ilgili.map((yol) => (
                      <li key={yol}>
                        <TextLink to={yol}>{sayfaAdi(yol)}</TextLink>
                      </li>
                    ))}
                  </ul>
                ) : (
                  'Yok'
                ),
            },
          ]}
          rows={verilenler}
          rowKey={(d) => d.id}
        />
      </Section>

      <Section
        id="ucret"
        index={4}
        title="Ücret ve prim"
        desc={`İşveren maliyeti maaşın ${params.costFactor.toLocaleString('tr-TR')} katıdır. Bu tutara SGK, yemek, bilgisayar, vergi ve diğer giderler dahildir. Prim yalnız CRM’deki ${crmStages.filter((c) => c.commission).length} prim koşulu tamamlanan satış için ödenir. Bu koşullar bir sonraki bölümde yazılı. Saha kotası, ay içinde ${lira(m.quota)} tutarında satıştır.`}
      >
        <DataTable<PayRule>
          id="ucret"
          title="Kişi başı aylık ücret ve prim"
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
            90 günlük personel maliyeti işveren için {lira(m.staffCost90)} tutarındadır. Bunun {lira(m.sahaCost90)} tutarı saha ekibinin maliyetidir. Saha ekibinde {params.sahaCount} kişi 3 ay, {params.sahaDecCount} kişi {m.decMonths} ay çalışır.
          </p>
          <p>
            Bir temsilci satışında toplam pay en çok {lira(m.maxPayout)} olur. Temsilci {lira(params.commission)}, sponsor {lira(params.sponsorShare)} ve ekip lideri {lira(params.leadTeamShare)} alır.
          </p>
        </Note>
      </Section>

      <Section id="crm" index={5} title="CRM aşamaları ve prim koşulları" desc="CRM aracı olarak Frappe CRM kullanılır. Prim koşulları CRM aşamalarıyla aynıdır. Şu dört aşama tamamlanınca prim hak edilir: “Onboarding”, “Mağaza açıldı”, “İlk ürünler” ve “Ödeme”. Bu aşamaların sorumlusu saha ekibi ya da temsilcidir.">
        <Chart
          id="crm-asamalari"
          title="Adaydan yenilemeye"
          summary={crmStages.map((c, i) => `${i + 1}. ${c.stage}${c.commission ? ' (prim koşulu)' : ''}`).join('. ')}
          spec={{
            kind: 'chain',
            steps: crmStages.map((c, i) => ({
              name: `${i + 1}. ${c.stage}`,
              sub: c.stage === 'Ödeme' ? `Prim hak edilir: ${lira(COMMISSION_PER_SALE)}` : c.commission ? 'Prim koşulu' : c.owner,
              role: c.commission ? 'saha-uzmani' : 'yonetici',
            })),
          }}
          size="xxl"
        />
        <DataTable<CrmStage>
          id="crm"
          title="CRM aşamaları ve geçiş kuralları"
          columns={[
            { key: 'stage', header: 'Aşama', nowrap: true, rowHeader: true, render: (r) => r.stage },
            { key: 'rule', header: 'Geçiş kuralı', summary: true, minWidth: '18rem', render: (r) => r.rule },
            { key: 'owner', header: 'Sorumlu', minWidth: '11rem', render: (r) => r.owner },
            { key: 'commission', header: 'Prim koşulu mu?', nowrap: true, render: (r) => (r.commission ? 'Evet' : 'Hayır') },
          ]}
          rows={crmStages}
        />
      </Section>

      <Section
        id="mesai"
        index={6}
        title="Mesai modeli: yasal tavan"
        desc={`Bu kurallar 4857 sayılı İş Kanunu’na dayanır. Yıllık fazla çalışma en çok ${OVERTIME_CAP} saat olabilir. ${OVERTIME_CAP} saat, işçinin işe girdiği günden sonraki 12 ay içinde sayılır. Kanunun en güvenli okuması budur.`}
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
          title="Kişi başı birikmiş fazla çalışma"
          note={`Kesikli çizgi, Dönem 1 düzeni sürseydi tavanın ${crossWeek}. haftada (${shortDate(addDays(dates.firstDay, (crossWeek - 1) * 7))}) dolacağını gösterir.`}
          summary={`Program başında başlayanlar ${overtimeUsed.kasim} saat, organizatör ${overtimeUsed.organizator} saat fazla çalışmayla Dönem 1’i bitirir. Yasal tavan ${OVERTIME_CAP} saattir. Dönem 1 düzeni sürseydi tavan ${crossWeek}. haftada dolardı.`}
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
            Saha için saat ücreti {lira(params.sahaSalary / 225)}, fazla çalışmanın saat ücreti {lira(overtimeHourly)} olur. Hesapta {lira(params.sahaSalary)} maaş 225 saate bölünür. Bu saat ücretine %50 eklenir. Bordroda ise brüt maaş kullanılır.
            Dönem 1’de ayda yaklaşık {monthlyOvertime} saat fazla çalışma olur. Bu, kişi başı ayda yaklaşık {lira(monthlyOvertime * overtimeHourly)} eder. {p2.name} ile bu gider ortadan kalkar.
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
      <PageHeader title="MLM (çok katmanlı pazarlama)" purpose="Bu sayfa, yalnız gerçek satıştan kazanan bağımsız temsilcilerle doğrudan satış modelini gösterir." />

      <Section id="kademe" index={1} title="Kademeler" desc={`Bu kademeler ${longDate(dates.day90)} için hedeftir. Çekirdek ekipte saha satış uzmanı, İstoç Pazarlama CRM uzmanı, dijital pazarlama uzmanı ve organizatör var. Ekip lideri bu sayıya girmez.`}>
        <Chart
          id="piramit"
          title="Kademe şeması"
          summary={levels.map((l) => `${l.level} ${l.name}: ${l.count} kişi`).join('. ')}
          spec={{ kind: 'piramit', items: levels.map((l, i) => ({ name: l.name, count: l.count, role: LEVEL_ROLES[i] })) }}
        />
        <DataTable
          id="kademe"
          title="Kademe ve kişi sayısı"
          columns={[
            { key: 'l', header: 'Seviye', nowrap: true, rowHeader: true, render: (l: (typeof levels)[number]) => l.level },
            { key: 'n', header: 'Kim', minWidth: '14rem', render: (l) => l.name },
            { key: 'c', header: 'Kişi sayısı', summary: true, nowrap: true, render: (l) => l.count },
          ]}
          rows={levels}
        />
      </Section>

      <Section id="huni" index={2} title="Haftalık temsilci bulma adımları" desc={`Meta reklamına haftada ${lira(params.metaWeekly)}, yani ayda yaklaşık ${lira((params.metaWeekly * 52) / 12)} harcanır. Bu bütçeyle ayda en çok ${m.growth.monthlyRepsText} aktif temsilci kazanılabilir.`}>
        <Chart
          id="huni"
          title="Başvurudan aktif temsilciye (haftalık)"
          summary={`Haftalık ortalama kişi sayısı. ${recruitmentFunnel.map((f) => `${f.stage}: ${new Intl.NumberFormat('tr-TR').format(f.value)} kişi`).join('. ')}`}
          spec={{ kind: 'huni', role: 'ekip-lideri', items: recruitmentFunnel.map((f) => ({ name: f.stage, value: f.value })) }}
          size="lg"
        />
      </Section>

      <Section id="hedef" index={3} title="Ağ hedefleri" desc="Tablo her ölçüt için hedefi ve hedefin tarihini gösterir.">
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
      <PageHeader title="Arşiv: tahtadan karara" purpose="19 Ekim Pazartesi tahta notlarının plandaki karşılığını toplantı için değil, kayıt için gösterir." meta={[{ label: 'Kaynak', value: '19 Ekim 2026 Pazartesi tahta notları' }]} />
      <Section id="tahta-bolum" title="Tahta notundan karara ve sayfaya" desc="Tablo her tahta notunun plandaki kararını ve kararın yazıldığı sayfayı gösterir.">
        <DataTable<BoardRow>
          id="tahta"
          title="Notlar ve kararlar"
          columns={[
            { key: 'board', header: 'Tahtadaki not', minWidth: '16rem', rowHeader: true, render: (r) => r.board },
            { key: 'decision', header: 'Plandaki karar', summary: true, minWidth: '18rem', render: (r) => r.decision },
            { key: 'where', header: 'Sayfa', nowrap: true, render: (r) => <TextLink to={r.where.path}>{r.where.label}</TextLink> },
          ]}
          rows={boardMapping}
        />
      </Section>
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

/** Kararlar (kullanıcı kararı 2026-11-03): Karar bekleyenler ve Karar yetkisi tek sayfada, adres /karar/. */
export function KararPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <PendingContent />
      <AuthorityContent ilkNo={7} />
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
