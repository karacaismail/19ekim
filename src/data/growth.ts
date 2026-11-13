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
    { metric: 'Meta reklam bütçesi', target: `Haftada ${tl(p.metaWeekly)}, ayda yaklaşık ${tl(monthlyMeta)}`, when: t('20 Ekim 2026 tarihinden başlayarak her hafta') },
    { metric: 'Başvuru', target: `Haftada en çok yaklaşık ${int(p.applicationsWeekly)} başvuru`, when: t('16 Kasım 2026 tarihinden başlayarak her hafta') },
    { metric: 'Aktif temsilci', target: 'Önce yaklaşık 3, sonra yaklaşık 5', when: t('Önce 30 Aralık 2026, sonra 30 Ocak 2027') },
    { metric: 'Aktif temsilci başına maliyet', target: monthlyReps ? `Yaklaşık ${tl(monthlyMeta / monthlyReps)}` : '—', when: 'Her ay ölçülür' },
    { metric: `Ağın getirdiği aktif satıcı (ayda ${p.subscriptionEur} € ödeyen müşteri)`, target: `Yaklaşık ${int(mlm.aktif.reduce((a, b) => a + b, 0))}`, when: t('30 Ocak 2027') },
    { metric: 'Temsilci kazancı', target: `Satış başına ${tl(p.commission)}. Temsilciye maaş ödenmez. Temsilci hizmet faturası keser.`, when: 'İlk satıştan' },
    { metric: 'Sponsor payı', target: `Temsilciyi ağa getiren kişi sponsordur. Sponsor, bu temsilcinin her satışından ${tl(p.sponsorShare)} alır. Temsilcinin getirdiği kişilerden pay almaz.`, when: 'Satış prim kriterleri tamamlanınca' },
    { metric: 'Uyum kuralı ihlali', target: '0', when: 'Her ay kontrol edilir' },
  ];

  const compliance = [
    `Kazanç yalnız gerçek satıştan doğar. Temsilci her satıştan ${tl(p.commission)} alır. Bir temsilciyi ağa getiren kişiye sponsor denir. Sponsor, getirdiği temsilcinin her satışından ${tl(p.sponsorShare)} alır. Sponsor, bu temsilcinin getirdiği kişilerden pay almaz. Giriş ücreti, zorunlu alım, kayıt primi veya kişi getirme primi yoktur. Kimse yalnız kişi getirdiği için para almaz. Piramit satış, 6502 sayılı Tüketicinin Korunması Hakkında Kanun’la yasaktır.`,
    'Temsilci çalışan değildir. Temsilci kendi şirketini kurar ve hizmet faturası keser. Temsilciye mesai, çalışma yeri ya da talimat vermeyin. Verirseniz ilişki gizli işçilik (muvazaa) sayılabilir.',
    t('İsmail Karaca, kazanç planını ve sözleşmeyi 14 Kasım 2026 tarihine kadar onaylatır. Onayı hukuk danışmanı ve mali müşavir verir.'),
    'Meta reklamında ürünü ve temsilcinin yapacağı işi açıkça anlatın. Reklamda gelir sözü vermeyin. “MLM fırsatı” ifadesini kullanmayın.',
  ];

  return { levels, recruitmentFunnel, growthKpis, compliance, monthlyRepsText: num(monthlyReps) };
}
