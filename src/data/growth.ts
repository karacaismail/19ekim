import { daysBetween, shiftText } from '../lib/dates';
import { int, num, tl } from '../lib/format';
import { DEFAULT_PARAMS, type Params } from './params';
import type { Program } from './program';

/**
 * Çok katmanlı pazarlama (Multi-Level Marketing, MLM) ağı — doğrudan satış modeli.
 * Bağımsız satış temsilcileri Meta reklamlarıyla bulunur; kazanç yalnız gerçek satıştan doğar.
 */

const BASE_FUNNEL = [
  { stage: 'Başvuru', value: 50 },
  { stage: 'Ön eleme', value: 25 },
  { stage: 'Bilgilendirme toplantısı', value: 12 },
  { stage: 'İlk eğitime katılan', value: 6 },
  { stage: 'İlk satışını yapan', value: 2 },
  { stage: 'Aktif kalan', value: 0.5 },
];

export function makeGrowth(p: Params, prog: Program) {
  const d = daysBetween(DEFAULT_PARAMS.startDate, p.startDate);
  const t = (text: string) => shiftText(text, d);
  const monthlyMeta = (p.metaWeekly * 52) / 12;
  const monthlyReps = (p.activeRepsWeekly * 52) / 12;
  const mlm = prog.targetPlan.find((r) => r.role === 'ekip-lideri')!;
  const coreTeam = p.sahaCount + p.sahaDecCount + p.masaCount + p.dijitalCount + p.organizatorCount - 1;

  /** Kademe yapısı (piramit grafik): 90. gün hedefi. Çekirdek ekip: lider dışındaki saha, masa başı, dijital, organizatör. */
  const levels = [
    { level: 'Seviye 0', name: 'İsmail Karaca', count: 1 },
    { level: 'Seviye 1', name: 'Ekip lideri', count: 1 },
    { level: 'Seviye 2', name: 'Çekirdek ekip', count: Math.max(0, coreTeam) },
    { level: 'Seviye 3', name: 'Bağımsız satış temsilcileri', count: 5 },
  ];

  /** Meta reklamından aktif temsilciye haftalık huni: ara aşamalar başvuruya orantılı; son aşama parametre. */
  const scale = p.applicationsWeekly / BASE_FUNNEL[0].value;
  const recruitmentFunnel = BASE_FUNNEL.map((f, i) => ({
    stage: f.stage,
    value: i === 0 ? p.applicationsWeekly : i === BASE_FUNNEL.length - 1 ? p.activeRepsWeekly : Math.round(f.value * scale * 10) / 10,
  }));

  const growthKpis = [
    { metric: 'Meta reklam bütçesi', target: `${tl(p.metaWeekly)} / hafta (~${tl(monthlyMeta)} / ay)`, when: t('20 Ekim itibarıyla, sürekli') },
    { metric: 'Başvuru', target: `En fazla ~${int(p.applicationsWeekly)} / hafta`, when: t('16 Kasım itibarıyla') },
    { metric: 'Aktif temsilci', target: '~3 → ~5', when: t('30 Aralık → 30 Ocak') },
    { metric: 'Aktif temsilci başına maliyet', target: monthlyReps ? `~${tl(monthlyMeta / monthlyReps)}` : '—', when: 'Her ay ölçülür' },
    { metric: 'Ağdan aktif satıcı', target: `~${int(mlm.aktif.reduce((a, b) => a + b, 0))}`, when: t('30 Ocak') },
    { metric: 'Temsilci kazancı', target: `Satış başına ${tl(p.commission)}. Maaş yok, temsilci hizmet faturası keser.`, when: 'İlk satıştan' },
    { metric: 'Sponsor payı', target: `Doğrudan getirdiği temsilcinin her satışından ${tl(p.sponsorShare)}. Pay yalnız tek seviyede ödenir.`, when: 'Satış prim kriterleri tamamlanınca' },
    { metric: 'Uyum ihlali', target: '0', when: 'Ayda bir kontrol' },
  ];

  const compliance = [
    `Kazanç yalnız gerçek satıştan doğar. Temsilci satış başına ${tl(p.commission)}, sponsor ise tek seviyede ${tl(p.sponsorShare)} alır. Giriş ücreti, zorunlu alım, kayıt primi veya kişi getirme primi yoktur, çünkü piramit satış 6502 sayılı Kanun’la yasaktır.`,
    'Temsilci çalışan değildir. Kendi şirketini kurar ve hizmet faturası keser. Temsilciye mesai, çalışma yeri veya talimat verilmez. Verilirse ilişki gizli işçilik (muvazaa) sayılabilir.',
    t('Kazanç planı ve sözleşme, 14 Kasım tarihine kadar hukuk danışmanına ve mali müşavire onaylatılır.'),
    'Meta reklamında ürün ve yapılacak iş açıkça anlatılır. Reklamda gelir vaadi ve “MLM fırsatı” ifadesi kullanılmaz.',
  ];

  return { levels, recruitmentFunnel, growthKpis, compliance, monthlyRepsText: num(monthlyReps) };
}
