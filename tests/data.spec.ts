import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { EXAMPLE, QUIZ, quadrantOf, relativeShare } from '../src/data/bcg';
import { contentPlan, pipeline, productionRamp } from '../src/data/digital';
import { DEFAULT_NOTES } from '../src/data/notes';
import { computeBreakeven, defaultFilters, inputsOf, sensitivity, SENS_FACTORS, SENS_RETENTIONS } from '../src/data/breakeven';
import { addedSahaCosts, makeStaffing, staffingSheet } from '../src/data/staffing';
import { adCapacity, adSchedule, growthHires, HORIZON, priceSeries } from '../src/data/revenue';
import { buildCashflow, cashSeriesOf, toparlanmaOf } from '../src/data/cashflow';
import { buildModel } from '../src/data/model';
import { DEFAULT_PARAMS, PARAM_GROUPS, type Params } from '../src/data/params';
import type { OrgNode } from '../src/data/tree';
import { addDays, monthStart, shiftText } from '../src/lib/dates';
import { presetOptions, presetsOf } from '../src/lib/scenarioOptions';
import { buildModel as buildOpex } from './opex-fixture';

const m = buildModel(DEFAULT_PARAMS);
const { roles } = m;
const minutes = (range: string) => {
  const [a, b] = range.split('–').map((t) => t.trim().split(':').map(Number));
  return b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
};
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const flat = (node: OrgNode): OrgNode[] => [node, ...(node.children ?? []).flatMap(flat)];
const withParams = (change: Partial<Params>) => buildModel({ ...DEFAULT_PARAMS, ...change });

test.describe('veri tutarlılığı (varsayılan parametreler)', () => {
  test('her rolün hafta içi 11 saat, Cumartesi 5 (organizatör 7) saat net', () => {
    for (const role of roles) {
      const net = (rows: typeof role.daily) => rows.filter((r) => r.tone !== 'break').reduce((s, r) => s + minutes(r.time), 0);
      expect(net(role.daily), role.slug).toBe(11 * 60);
      expect(net(role.saturday), role.slug).toBe((role.slug === 'organizator' ? 7 : 5) * 60);
      for (const rows of [role.daily, role.saturday]) {
        for (let i = 1; i < rows.length; i++) {
          expect(rows[i].time.split('–')[0], `${role.slug} ${rows[i].time}`).toBe(rows[i - 1].time.split('–')[1]);
        }
      }
    }
  });

  test('her rol SMART: 4 ölçülebilir görev, 4 KPI, tarihli 3 adımlık plan', () => {
    for (const role of roles) {
      expect(role.tasks, role.slug).toHaveLength(4);
      expect(role.kpis, role.slug).toHaveLength(4);
      for (const t of role.tasks) expect(t.measure.length, `${role.slug}: ${t.task}`).toBeGreaterThan(0);
      for (const k of role.kpis) expect(k.when.length, `${role.slug}: ${k.metric}`).toBeGreaterThan(0);
      expect(role.plan, role.slug).toHaveLength(3);
      expect(role.ramp.values.length, role.slug).toBe(3);
    }
    for (const row of [...m.managerPlan, ...roles.flatMap((r) => r.plan)]) {
      expect(row.from, row.action).toMatch(ISO);
      expect(row.to, row.action).toMatch(ISO);
      expect(row.from <= row.to, row.action).toBe(true);
      expect(row.target.length, row.action).toBeGreaterThan(0);
    }
  });

  test('hedef dağılımı: 600 kayıt, 100 aktif satıcı; aylık 12 / 35 / 53; saha 420 / 63', () => {
    expect(sum(m.targetPlan.flatMap((t) => t.kayit))).toBe(600);
    expect(sum(m.targetPlan.flatMap((t) => t.aktif))).toBe(100);
    expect(m.NEW_ACTIVE).toEqual([12, 35, 53]);
    const saha = m.targetPlan.find((t) => t.role === 'saha-uzmani')!;
    expect([sum(saha.kayit), sum(saha.aktif)]).toEqual([375 + 45, 55 + 8]);
    expect(m.role('saha-uzmani').ramp.values).toEqual(saha.kayit);
    expect(m.role('saha-uzmani').kpis.slice(0, 2).map((k) => k.value)).toEqual(['420', '63']);
  });

  test('ciro köprüsü: 136 satıcı-ay gerekir; eşik %66; %0’da açık 36 satıcı-ay', () => {
    expect(Math.ceil(m.CIRO_TARGET / m.SUBSCRIPTION_TRY)).toBe(136);
    expect(m.retentionThreshold).toBe(0.66);
    expect(m.payments(0.7).total * m.SUBSCRIPTION_TRY).toBeGreaterThan(m.CIRO_TARGET);
    expect(Math.ceil(m.gap / m.SUBSCRIPTION_TRY)).toBe(36);
  });

  test('kontrol noktaları model ile aynı: 30/60/90. gün, kümülatif aktif 12 / 47 / 100', () => {
    expect(m.checkpoints.map((c) => c.date)).toEqual(['2026-11-30', '2026-12-30', '2027-01-30']);
    expect(m.checkpoints.map((c) => c.aktif)).toEqual([12, 47, 100]);
    expect(m.checkpoints.map((c) => c.kayit)).toEqual([95, 300, 600]);
  });

  test('istihdam sırası kararınızdaki gibi; asistan yoksa dijital 1 Ocak; Segika eklendi', () => {
    expect(m.hiringOrder.map((h) => h.role)).toEqual(['yonetici', 'asistan', 'pazarlamaci', 'saha-uzmani', 'dijital-pazarlama', 'organizator', 'saha-uzmani', 'segika']);
    expect(m.hiringOrder.map((h) => h.date)).toEqual([
      'Şimdi',
      '1 Kasım 2026',
      '1 Kasım 2026',
      '1 Kasım 2026',
      '1 Kasım 2026 (asistan yoksa 1 Ocak 2027)',
      '1 Aralık 2026',
      '1 Aralık 2026',
      '1 Kasım 2026',
    ]);
    expect(m.hiringOrder.map((h) => h.count)).toEqual(['—', '1', '1', '2', '1', '1', '1', '1']);
    for (const e of m.calendarEvents) expect(e.date >= '2026-10-01' && e.date <= '2027-01-31', e.title).toBe(true);
    for (const d of m.openDecisions) expect(d.deadline, d.topic).toMatch(ISO);
  });

  test('kararlar: karar veren İsmail Karaca veya yatırımcı; kesinleşenler bekleyenlerde yok; uydurma paket yok', () => {
    for (const d of m.openDecisions) expect(['yonetici', 'yatirimci'], d.topic).toContain(d.owner);
    const open = m.openDecisions.map((d) => d.topic);
    for (const d of m.decisions) expect(open, d.topic).not.toContain(d.topic);
    for (const topic of ['Ücret, prim ve kota', 'Diğer rollerin maaşları', 'CRM aracı ve aşamaları', 'Kazanç planı (MLM)', 'Ekip lideri primi', '4. aydan itibaren mesai modeli']) {
      expect(m.decisions.some((d) => d.topic === topic), topic).toBe(true);
    }
    expect(open.some((t) => t.includes('RFQ')), 'RFQ yatırımcı kararı').toBe(true);
    expect(JSON.stringify([m.openDecisions, m.decisions])).not.toMatch(/30K|90K|500K/);
  });

  test('ücret: maliyet = maaş × 2; saha kotası kendi maliyeti; net maaşlar (2026-10-27) ve asgari ücret çarpanları', () => {
    expect(m.quota).toBe(100_000);
    expect(m.salaries.saha).toBe(50_000);
    expect(m.salaries.masa).toBe(35_000);
    expect(m.salaries.segika).toBe(35_000);
    expect(m.salaries.organizator).toBe(50_000);
    expect(m.salaries.asistan).toBeCloseTo(28_075.5 * 1.5);
    expect(m.salaries.dijital).toBeCloseTo(28_075.5 * 1.25);
    expect(m.payRules[7].fixed).toContain('50.000 ₺ maaş / ay (net)');
    expect(m.payRules.map((r) => r.role)).toEqual(['saha-uzmani', 'ekip-lideri', 'ekip-lideri', 'pazarlamaci', 'segika', 'dijital-pazarlama', 'asistan', 'organizator']);
    expect(m.maxPayout).toBe(3_250);
  });

  test('mesai modeli yasal tavanda: günde ≤ 11 sa, Dönem 2 haftada 45 sa, yıllık fazla çalışma ≤ 270 sa', () => {
    const [p1, p2] = m.workPeriods;
    expect(p1.weekly - p1.overtimePerWeek).toBe(45);
    expect([p2.weekly, p2.overtimePerWeek]).toEqual([45, 0]);
    expect(p1.weeks).toBe(13);
    expect(p2.from).toBe('2027-02-01');
    expect(m.overtimeUsed).toEqual({ kasim: 195, aralik: 135, organizator: 153 });
    for (const used of Object.values(m.overtimeUsed)) expect(used).toBeLessThanOrEqual(m.OVERTIME_CAP);
    for (const role of roles) {
      for (const row of role.daily) expect(minutes(row.time)).toBeLessThanOrEqual(11 * 60);
      expect(role.hours.fromFeb, role.slug).toContain('45 sa');
    }
  });

  test('organizatör: eğitimden 60 kayıt ve 12 aktif satıcı; haftalık kayıt 5 → 10', () => {
    const org = m.targetPlan.find((t) => t.role === 'organizator')!;
    expect([sum(org.kayit), sum(org.aktif)]).toEqual([60, 12]);
    expect(m.role('organizator').tasks.some((t) => t.measure.includes('~60 kayıt, ~12 aktif'))).toBe(true);
    expect(m.role('organizator').kpis.find((k) => k.metric === 'Eğitimden kayıt')?.value).toBe('5 → 10');
  });

  test('temsilci ve saha sayıları her yerde aynı', () => {
    const { recruitmentFunnel, levels, growthKpis } = m.growth;
    expect(recruitmentFunnel[0].value).toBe(50);
    expect(recruitmentFunnel.at(-1)?.value).toBe(0.5);
    expect(levels.at(-1)?.count).toBe(5);
    expect(m.role('ekip-lideri').kpis.find((k) => k.metric === 'Aktif temsilci')?.value).toBe('~5');
    expect(growthKpis.find((k) => k.metric === 'Aktif temsilci')?.target).toContain('~5');
    expect(flat(m.org).find((n) => n.name === 'Bağımsız temsilciler')?.sub).toContain('~5');
    expect(m.role('saha-uzmani').tasks[0].measure).toBe('Günde 1–2 randevu + 10 çat kapı');
    expect(m.role('pazarlamaci').tasks[1].measure).toContain('Günde 3 randevu');
  });

  test('Segika: masa başı rolünün kopyası (aynı günlük düzen, ücret yaklaşımı ve KPI sayıları)', () => {
    const seg = m.role('segika');
    const masa = m.role('pazarlamaci');
    expect(seg.daily).toEqual(masa.daily);
    expect(seg.saturday).toEqual(masa.saturday);
    expect(seg.kpis.slice(0, 3).map((k) => k.value)).toEqual(masa.kpis.slice(0, 3).map((k) => k.value));
    expect(seg.ramp.values).toEqual(masa.ramp.values);
    expect(flat(m.org).some((n) => n.href === '/roller/segika/')).toBe(true);
  });
});

test.describe('dijital pazarlama: ölçüm → otomasyon → üretim → içerik planı', () => {
  test('ölçüm entegrasyonları tarihli; KPI sayısıyla aynı; üretim başlamadan GTM ve çerez onayı hazır', () => {
    const { integrations, digitalPlan } = m.digital;
    expect(m.role('dijital-pazarlama').kpis.find((k) => k.metric === 'Ölçüm altyapısı')?.value).toBe(`${integrations.length} / ${integrations.length}`);
    for (const i of integrations) expect(i.date, i.name).toMatch(ISO);
    const firstPublish = digitalPlan.filter((p) => p.stream === 'uretim').map((p) => p.from).sort()[0];
    for (const name of ['Google Tag Manager', 'Çerez onayı (KVKK) + Consent Mode']) {
      expect(integrations.find((i) => i.name === name)!.date <= firstPublish, name).toBe(true);
    }
  });

  test('otomasyon hattında insan senaryo seçer ve yayını onaylar; diğer adımlar otomatik', () => {
    expect(pipeline.map((p) => p.mode)).toEqual(['otomatik', 'secim', 'otomatik', 'onay', 'otomatik', 'otomatik']);
    expect(productionRamp.auto.values.at(-1)).toBe(80);
  });

  test('içerik planı Ocak hedefini karşılar: haftada 18 video = günde 3 × 6 gün', () => {
    expect(sum(contentPlan.map((p) => p.perWeek))).toBe(productionRamp.video.values.at(-1)! * 6);
    for (const row of m.digital.digitalPlan) {
      expect(row.from <= row.to, row.action).toBe(true);
      expect(row.from >= '2026-11-02' && row.to <= '2027-01-30', row.action).toBe(true);
    }
  });
});

test.describe('parametreler: değişiklik tüm verilere tutarlı yansır', () => {
  test('her parametrenin tanımı var ve varsayılanla aynı türde', () => {
    const keys = PARAM_GROUPS.flatMap((g) => g.fields.map((f) => f.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect(keys.sort()).toEqual(Object.keys(DEFAULT_PARAMS).sort());
  });

  test('saha maaşı değişince kota, maliyet, prim kuralı ve karar metni birlikte değişir', () => {
    const x = withParams({ sahaSalary: 70_000 });
    expect(x.quota).toBe(140_000);
    expect(x.payRules[0].fixed).toContain('70.000 ₺');
    expect(x.payRules[0].commission).toContain('140.000 ₺');
    expect(x.decisions[0].decision).toContain('140.000 ₺');
    expect(x.role('saha-uzmani').pay).toContain('70.000 ₺');
    expect(x.salaries.lead).toBe(80_000);
  });

  test('asgari ücret değişince çarpanlı maaşlar değişir; net maaşlar sabit kalır', () => {
    const x = withParams({ minWage: 30_000 });
    expect(x.salaries.dijital).toBe(37_500);
    expect(x.role('dijital-pazarlama').pay).toContain('37.500 ₺');
    expect(x.salaries.organizator).toBe(50_000);
    expect(x.role('organizator').pay).toContain('50.000 ₺ maaş (net)');
    expect(x.staffCost90).toBeGreaterThan(m.staffCost90);
  });

  test('program başlangıcı kayınca kontroller, takvim, planlar ve metindeki tarihler birlikte kayar', () => {
    const x = withParams({ startDate: '2026-11-15' });
    expect(x.checkpoints.map((c) => c.date)).toEqual(['2026-12-14', '2027-01-13', '2027-02-13']);
    expect(x.role('pazarlamaci').plan[0].from).toBe(addDays(m.role('pazarlamaci').plan[0].from, 14));
    expect(x.digital.integrations[0].date).toBe(addDays(m.digital.integrations[0].date, 14));
    expect(x.hiringOrder[2].date).toBe('15 Kasım 2026');
    expect(x.managerPlan[1].target).toBe(shiftText(m.managerPlan[1].target, 14));
    // Aralık kohortu kendi parametresine bağlı: program başlangıcı onu kaydırmaz.
    expect(x.role('organizator').plan[0].from).toBe(m.role('organizator').plan[0].from);
  });

  test('hedefler değişince dağılım yeni toplama ölçeklenir ve eşik yeniden hesaplanır', () => {
    const x = withParams({ activeTarget: 120, memberTarget: 480, ciroTarget: 3_500_000 });
    expect(sum(x.targetPlan.flatMap((t) => t.aktif))).toBe(120);
    expect(sum(x.targetPlan.flatMap((t) => t.kayit))).toBe(600);
    expect(x.checkpoints[2].aktif).toBe(120);
    expect(x.targets[2].value).toContain('3.500.000 ₺');
    const impossible = withParams({ ciroTarget: 9_000_000 });
    expect(impossible.retentionThreshold).toBeNull();
  });

  test('kişi sayıları organizasyon şemasına, istihdam sırasına ve maliyete yansır', () => {
    const x = withParams({ sahaDecCount: 2, segikaCount: 2 });
    expect(flat(x.org).find((n) => n.name === 'Saha ekibi')?.sub.startsWith('4 kişi')).toBe(true);
    expect(x.hiringOrder.find((h) => h.role === 'segika')?.count).toBe('2');
    expect(x.labels.sahaDecLabel).toBe('3.–4. saha personeli');
    expect(x.staffCost90).toBeGreaterThan(m.staffCost90);
  });

  test('metin kaydırma: tarih kalıplarını kaydırır, diğer sayıları değiştirmez', () => {
    expect(shiftText('Hukuk teyidi 14 Kasım · lider 27 Kasım', 7)).toBe('Hukuk teyidi 21 Kasım · lider 4 Aralık');
    expect(shiftText('1 Kasım 2026 · 08:00–20:00 · 60 arama', 1)).toBe('2 Kasım 2026 · 08:00–20:00 · 60 arama');
    expect(shiftText('30 Aralık', 3)).toBe('2 Ocak');
  });
});

test.describe('BCG eğitimi', () => {
  test('örnekte göreli pay ve kutu eşiklerle doğru hesaplanır; her kutudan en az bir ürün var', () => {
    const boxes = EXAMPLE.map((p) => quadrantOf(p.growth, relativeShare(p)));
    expect(boxes).toEqual(['yildiz', 'inek', 'soru', 'soru', 'kopek']);
    expect(new Set(boxes).size).toBe(4);
    expect(relativeShare(EXAMPLE[0])).toBe(1.5);
    for (const q of QUIZ) {
      const nums = [...q.why.matchAll(/(\d+(?:,\d+)?) ÷ (\d+)/g)];
      for (const [, a, b] of nums) expect(Number(a.replace(',', '.')) / Number(b) > 0).toBe(true);
    }
  });
});

test.describe('notlar', () => {
  test('varsayılan notlar: partner ağı 5, İK yönetimi 5; her not bilinen bir listede', () => {
    const count = (list: string) => DEFAULT_NOTES.notes.filter((n) => n.list === list).length;
    expect([count('partner'), count('ik')]).toEqual([5, 5]);
    const lists = new Set(DEFAULT_NOTES.lists.map((l) => l.id));
    for (const n of DEFAULT_NOTES.notes) expect(lists.has(n.list), n.text).toBe(true);
    expect(new Set(DEFAULT_NOTES.notes.map((n) => n.id)).size).toBe(DEFAULT_NOTES.notes.length);
  });
});

test.describe('bağlantılar', () => {
  test('dist içindeki her /19ekim/ bağlantısı bir sayfaya ve varsa bir id’ye çözülür', () => {
    const dist = new URL('../dist/', import.meta.url).pathname;
    test.skip(!existsSync(dist), 'önce npm run build');
    const html = (dir: string): string[] =>
      readdirSync(dir).flatMap((n) => {
        const p = join(dir, n);
        return statSync(p).isDirectory() ? html(p) : p.endsWith('.html') ? [p] : [];
      });
    const broken: string[] = [];
    const check = (file: string, url: string) => {
      const [path, hash] = url.replace('/19ekim/', '').split('#');
      const target = path === '' ? join(dist, 'index.html') : path.endsWith('/') ? join(dist, path, 'index.html') : join(dist, path);
      if (!existsSync(target)) return broken.push(`${file}: ${url}`);
      if (hash && target.endsWith('.html') && !readFileSync(target, 'utf8').includes(`id="${hash}"`)) broken.push(`${file}: ${url} (#id yok)`);
    };
    for (const file of html(dist)) {
      const text = readFileSync(file, 'utf8');
      for (const [, url] of text.matchAll(/href="(\/19ekim\/[^"]*)"/g)) check(file, url);
      for (const [, hash] of text.matchAll(/href="#([^"]+)"/g)) {
        if (!text.includes(`id="${hash}"`)) broken.push(`${file}: #${hash}`);
      }
    }
    // Organizasyon şeması düğüm bağlantıları da birer sayfaya çözülmeli.
    for (const node of flat(m.org)) if (node.href) check('org', `/19ekim${node.href}`);
    expect(broken).toEqual([]);
  });
});

/* ---------- İş ortaklığı programı (kullanıcı kararı 2026-10-27) ---------- */

test.describe('iş ortaklığı programı', () => {
  const pt = buildModel(DEFAULT_PARAMS).partnership;

  test('iki program; huni azalan; geçit hedefleri artan; puan kartları 100; kapasite toplamları', () => {
    expect(pt.programs.map((p) => p.id)).toEqual(['segika', 'istoc']);
    for (const p of pt.programs) {
      const f = p.funnel.items.map((i) => i.value);
      for (let i = 1; i < f.length; i++) expect(f[i], `${p.id} huni`).toBeLessThan(f[i - 1]);
      for (const s of p.gateSeries) {
        expect(s.values.length).toBe(3);
        for (let i = 1; i < s.values.length; i++) expect(s.values[i], `${p.id} ${s.name}`).toBeGreaterThanOrEqual(s.values[i - 1]);
      }
      expect(p.gates.map((g) => g.day)).toEqual([14, 30, 60, 90]);
      expect(p.gates.map((g) => g.date)).toEqual([pt.dates.day14, pt.dates.day30, pt.dates.day60, pt.dates.day90]);
      expect(p.kpis.length, `${p.id} gösterge`).toBe(10);
      expect(p.partnerScorecard.rows.reduce((a, r) => a + r.points, 0), `${p.id} ortak puan kartı`).toBe(100);
      if (p.cellScorecard) expect(p.cellScorecard.rows.reduce((a, r) => a + r.points, 0), `${p.id} hücre puan kartı`).toBe(100);
      expect(p.headline.length).toBeGreaterThanOrEqual(6);
      expect(p.phases.map((ph) => ph.no)).toEqual([1, 2, 3, 4, 5]);
    }
    expect(pt.byId.segika.capacity.reduce((a, c) => a + c.hours, 0)).toBe(52);
    expect(pt.byId.istoc.capacity.reduce((a, c) => a + c.hours, 0)).toBe(83);
  });

  test('13 hafta: aşamalar bitişik, iş paketleri takvim içinde, geçitler sırayla', () => {
    expect(addDays(pt.dates.t0, 90)).toBe(pt.dates.end);
    expect(pt.dates.day14 < pt.dates.day30 && pt.dates.day30 < pt.dates.day60 && pt.dates.day60 < pt.dates.day90).toBe(true);
    for (const p of pt.programs) {
      expect(p.phases[0].from).toBe(pt.dates.t0);
      expect(p.phases[p.phases.length - 1].to).toBe(pt.dates.end);
      for (let i = 1; i < p.phases.length; i++) expect(p.phases[i].from, `${p.id} aşama ${i + 1}`).toBe(addDays(p.phases[i - 1].to, 1));
      for (const w of p.work) {
        expect(w.from <= w.to, `${p.id} ${w.name}`).toBe(true);
        expect(w.from >= pt.dates.t0 && w.to <= pt.dates.end, `${p.id} ${w.name} takvim dışı`).toBe(true);
      }
      expect(p.work.filter((w) => w.milestone).length, `${p.id} kilometre taşı`).toBeGreaterThan(0);
    }
  });

  test('program başlangıcı kayınca takvim, geçitler ve metindeki tarihler kayar', () => {
    const shifted = buildModel({ ...DEFAULT_PARAMS, startDate: addDays(DEFAULT_PARAMS.startDate, 14) }).partnership;
    expect(shifted.dates.t0).toBe(addDays(pt.dates.t0, 14));
    expect(shifted.dates.day90).toBe(addDays(pt.dates.day90, 14));
    expect(shifted.byId.istoc.work[0].from).toBe(addDays(pt.byId.istoc.work[0].from, 14));
    expect(shifted.byId.segika.gates[0].date).toBe(addDays(pt.byId.segika.gates[0].date, 14));
    expect(shifted.byId.segika.headline[0].note).not.toBe(pt.byId.segika.headline[0].note);
  });

  test('atıf, kaynakça, bağlantı ve düşünür adı yok', () => {
    const text = JSON.stringify(pt.programs);
    expect(text).not.toMatch(/https?:\/\//);
    expect(text).not.toMatch(/www\./);
    for (const banned of ['Rumelt', 'Drucker', 'Thiel', 'Kotler', 'Osterwalder', 'Dunford', 'Byron', 'Geoffrey', 'Nagle', 'Reichheld', 'Lincoln Murphy', 'Andrew Chen', 'Helmer', 'Fitzpatrick', 'Goldratt', 'Eric Ries', 'Mom Test', 'Bullseye', 'Lafley', 'Binet']) {
      expect(text, banned).not.toContain(banned);
    }
  });
});

/* ---------- Nakit akış tablosu (kullanıcı kararı 2026-10-27) ---------- */

test.describe('nakit akış tablosu', () => {
  const m = buildModel(DEFAULT_PARAMS);
  const opex = buildOpex();

  test('15 ay; girişler gelir planının senaryo serilerinden (Ekim boş); prim senaryonun yeni aktifine göre', () => {
    const plan = m.cashflow;
    expect(plan.aylar.length).toBe(15);
    expect(plan.aylar[0].iso).toBe('2026-10-01');
    expect(plan.aylar[14].iso).toBe('2027-12-01');
    expect(plan.senaryolar.map((s) => s.id)).toEqual(['kotumser', 'medyan', 'iyimser']);
    // Gelir planı ve nakit ızgarası aynı 15 ay (Ekim 2026 – Aralık 2027); ilk satış 6 Kasım: Ekim’de giriş yok.
    expect(m.revenue.months.map((x) => x.iso)).toEqual(plan.aylar.map((x) => x.iso));
    for (const x of m.revenue.series) {
      const s = plan.seri[x.scenario.id];
      expect(s.yeniAktif[0]).toBe(0);
      expect(s.ilkOdeme[0]).toBe(0);
      for (let i = 0; i < 15; i++) {
        expect(s.yeniAktif[i], `${x.scenario.id} ay ${i}`).toBeCloseTo(x.yeniAktif[i], 2);
        expect(s.ilkOdeme[i]).toBeCloseTo(x.ilkOdeme[i], 1);
        expect(s.yenilemeTl[i]).toBeCloseTo(x.yenileme[i], 1);
        expect(s.prim[i]).toBeCloseTo(s.yeniAktif[i] * DEFAULT_PARAMS.commission, 1);
        expect(s.reklam[i]).toBeCloseTo(x.butce[i], 1);
      }
    }
    const top = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    expect(top(plan.seri.kotumser.ilkOdeme)).toBeLessThan(top(plan.seri.medyan.ilkOdeme));
    expect(top(plan.seri.medyan.ilkOdeme)).toBeLessThan(top(plan.seri.iyimser.ilkOdeme));
    expect(plan.abonelikTl).toBeCloseTo(m.SUBSCRIPTION_TRY, 2);
    expect(plan.meta[0]).toBeCloseTo((DEFAULT_PARAMS.metaWeekly * 52) / 12, 1);
    expect(plan.yatirim.every((v) => v === 0)).toBe(true);
  });

  test('Sheets çıkışları kategori bazında ay toplamlarını tutar; nakit zinciri doğru; senaryo yalnız girişleri ve primi değiştirir', () => {
    const cf = buildCashflow(m.cashflow, opex);
    expect(cf.senaryo).toBe('medyan');
    expect(cf.sheets).toBe(true);
    for (const [i, ay] of cf.aylar.entries()) {
      const sheets = cf.cikislar.filter((l) => l.kaynak === 'sheets').reduce((t, l) => t + l.aylar[i], 0);
      expect(sheets, ay.ad).toBeCloseTo(opex.aylik[ay.index][ay.key].toplam, 0);
      expect(cf.cikis[i], ay.ad).toBeCloseTo(sheets + cf.cikislar.filter((l) => l.kaynak === 'plan').reduce((t, l) => t + l.aylar[i], 0), 0);
      expect(cf.net[i]).toBeCloseTo(cf.giris[i] - cf.cikis[i], 1);
      expect(cf.donemSonu[i]).toBeCloseTo(cf.donemBasi[i] + cf.net[i], 1);
      if (i) expect(cf.donemBasi[i]).toBe(cf.donemSonu[i - 1]);
    }
    expect(cf.donemBasi[0]).toBe(DEFAULT_PARAMS.openingCash);
    expect(cf.acik).toBe(Math.max(0, -Math.min(...cf.donemSonu)));
    const k = buildCashflow(m.cashflow, opex, 'kotumser');
    const iy = buildCashflow(m.cashflow, opex, 'iyimser');
    expect(k.toplam.giris).toBeLessThan(cf.toplam.giris);
    expect(cf.toplam.giris).toBeLessThan(iy.toplam.giris);
    const sheetsOf = (x: typeof cf) => x.cikislar.filter((l) => l.kaynak === 'sheets').map((l) => l.toplam);
    expect(sheetsOf(k)).toEqual(sheetsOf(cf));
    expect(k.cikislar.find((l) => l.ad.startsWith('Satış primi'))!.toplam).toBeLessThan(cf.cikislar.find((l) => l.ad.startsWith('Satış primi'))!.toplam);
    expect(k.enDusuk.deger).toBeLessThanOrEqual(cf.enDusuk.deger);
    expect(cf.enDusuk.deger).toBeLessThanOrEqual(iy.enDusuk.deger);
    // Kalıcı toparlanma: negatife düşen nakdin incelenen dönemin kalanında bir daha sıfırın altına inmediği ilk ay (varsa) en düşük aydan sonradır.
    if (cf.enDusuk.deger < 0 && cf.toparlanma.kalici) expect(cf.toparlanma.kalici.iso > cf.enDusuk.ay.iso).toBe(true);
  });

  test('yatırım girişi ve başlangıç nakdi dönem sonu nakdi kaydırır; dönem dışı yatırım tabloya girmez', () => {
    const base = buildCashflow(m.cashflow, opex);
    const x = buildModel({ ...DEFAULT_PARAMS, openingCash: 1_000_000, investmentAmount: 5_000_000, investmentDate: '2026-12-01' });
    const cf = buildCashflow(x.cashflow, opex);
    expect(cf.donemBasi[0]).toBe(1_000_000);
    expect(cf.girisler.find((l) => l.ad === 'Yatırım girişi')?.aylar[2]).toBe(5_000_000);
    expect(cf.donemSonu[14]).toBeCloseTo(base.donemSonu[14] + 6_000_000, 0);
    const y = buildModel({ ...DEFAULT_PARAMS, investmentAmount: 5_000_000, investmentDate: '2028-03-01' });
    expect(y.cashflow.yatirim.every((v) => v === 0)).toBe(true);
    expect(y.cashflow.varsayimlar.some((v) => v.includes('dönemi dışında'))).toBe(true);
    const z = buildCashflow(m.cashflow, null);
    expect(z.sheets).toBe(false);
    expect(z.cikislar.every((l) => l.kaynak === 'plan')).toBe(true);
  });

  /*
   * B2 (docs/birlesik_plan.md §3.3-C, ct-F04, ar-13; kullanıcı kararı 2026-10-28): nakit akışı, gelir planının eklediği saha
   * personelinin (ikinci, ek, büyüme) işveren maliyetini çıkış olarak sayar ve gelir planı seçenekleriyle aynı etkin
   * girdileri kullanır — aynı girdilerle iki sayfanın gideri ve geliri ay ay eşittir.
   */
  test('B2: eklenen saha personelinin işveren maliyeti çıkışlarda — seri.sahaEk = addedSahaCosts; “Eklenen saha personeli” satırı; ikinci saha ayında tek kişi', () => {
    const plan = m.cashflow;
    const months = m.revenue.months;
    const top = (xs: number[]) => xs.reduce((a, b) => a + b, 0);
    for (const sc of m.revenue.scenarios) {
      const beklenen = addedSahaCosts(DEFAULT_PARAMS, m, months, m.revenue.inputsFor(sc));
      const s = plan.seri[sc.id];
      expect(s.sahaEk.length).toBe(15);
      for (let i = 0; i < 15; i++) expect(s.sahaEk[i], `${sc.id} ay ${i}`).toBeCloseTo(beklenen[i], 1);
    }
    expect(top(plan.seri.medyan.sahaEk)).toBeGreaterThan(0);
    // Kötümser büyümez: yalnız ikinci saha; medyan her 6 ayda bir kişi ekler.
    expect(top(plan.seri.kotumser.sahaEk)).toBeLessThan(top(plan.seri.medyan.sahaEk));
    const cf = buildCashflow(plan, opex);
    const satir = cf.cikislar.find((l) => l.ad.startsWith('Eklenen saha personeli'))!;
    expect(satir).toBeTruthy();
    expect(satir.kaynak).toBe('plan');
    expect(satir.toplam).toBeCloseTo(top(plan.seri.medyan.sahaEk), 0);
    const kisi = Math.round(m.salaries.saha * DEFAULT_PARAMS.costFactor * 100) / 100;
    const ikinci = cf.aylar.findIndex((a) => a.iso === monthStart(DEFAULT_PARAMS.secondSahaDate));
    expect(ikinci).toBeGreaterThan(0);
    expect(satir.aylar[ikinci - 1]).toBe(0);
    expect(satir.aylar[ikinci]).toBeCloseTo(kisi, 0);
    // Çıkış toplamı satırı içerir (önceki modelde eksikti): Sheets + plan kalemleri + eklenen kadro.
    expect(cf.toplam.cikis).toBeCloseTo(cf.cikislar.reduce((t, l) => t + l.toplam, 0), 0);
  });

  test('B2: aynı girdilerle gelir planının gideri ve geliri = nakit akışının çıkışı ve girişi (ar-13); “Saha ağırlıklı” seçenekleri taşınır', () => {
    const p = DEFAULT_PARAMS;
    const r = m.revenue;
    const saha = presetsOf(p).find((x) => x.id === 'saha')!;
    const opts = presetOptions(p, saha);
    const be = computeBreakeven(p, m, r, saha.base, opts, opex);
    expect(be.kaynak).toBe('sheets');
    const seri = cashSeriesOf(p, m, r, be.inputs);
    const cf = buildCashflow(m.cashflow, opex, saha.base, { seri, ekSabit: opts.ekSabit, primDahil: opts.primDahil });
    expect(cf.aylar.map((a) => a.iso)).toEqual(be.months.map((x) => x.iso));
    for (let i = 0; i < 15; i++) {
      expect(cf.cikis[i], `çıkış ay ${i}`).toBeCloseTo(be.gider[i], 0);
      expect(cf.giris[i] - m.cashflow.yatirim[i], `giriş ay ${i}`).toBeCloseTo(be.gelir[i], 0);
    }
    // Aralık 2026: ikinci saha + 2 ek saha = üç kişinin işveren maliyeti.
    const kisi = Math.round(m.salaries.saha * p.costFactor * 100) / 100;
    expect(seri.sahaEk[2]).toBeCloseTo(3 * kisi, 0);
    // Seçeneksiz temel seriyle fark var: seçenekler gerçekten taşındı.
    expect(Math.abs(cf.toplam.cikis - buildCashflow(m.cashflow, opex, 'medyan').toplam.cikis)).toBeGreaterThan(1);
  });

  /*
   * B2c (docs/missings.md MS-03, T03; kullanıcı yönergesi 2026-10-28): eski hesap küresel en düşük aydan sonraki ilk `>= 0` ayı
   * “kalıcı toparlanma” diye sunuyordu; `[-100, 50, -30, 50]` için Kasım dönüyordu (sonraki ay yine açık). İki ayrı ölçüt:
   * ilk toparlanma (ilk negatif aydan sonra ilk `>= 0`) ve incelenen dönemin kalanında yeniden negatife düşmeme.
   */
  test('B2c (MS-03 / T03): ilk toparlanma ile dönemde kalıcı toparlanma ayrı ölçüt; karşı örnekler', () => {
    expect(toparlanmaOf([-100, 50, -30, 50])).toEqual({ ilk: 1, kalici: 3 });
    expect(toparlanmaOf([-100, 50, -200, 50])).toEqual({ ilk: 1, kalici: 3 });
    expect(toparlanmaOf([-100, -50, -10])).toEqual({ ilk: null, kalici: null });
    expect(toparlanmaOf([10, 20])).toEqual({ ilk: null, kalici: null }); // hiç negatife düşmüyor
    expect(toparlanmaOf([-5, 0, 0])).toEqual({ ilk: 1, kalici: 1 }); // sıfır “altında” değil
    expect(toparlanmaOf([-5, 5, -1])).toEqual({ ilk: 1, kalici: null }); // son ay açık: kalıcı yok
    expect(toparlanmaOf([5, -5, 5])).toEqual({ ilk: 2, kalici: 2 });
    const cf = buildCashflow(m.cashflow, opex);
    if (cf.enDusuk.deger < 0) {
      if (cf.toparlanma.kalici) expect(cf.donemSonu.slice(cf.aylar.indexOf(cf.toparlanma.kalici)).every((v) => v >= 0)).toBe(true);
      if (cf.toparlanma.ilk && cf.toparlanma.kalici) expect(cf.toparlanma.ilk.iso <= cf.toparlanma.kalici.iso).toBe(true);
    } else expect(cf.toparlanma).toEqual({ ilk: null, kalici: null });
  });

  test('B2: ek sabit gider seçeneği çıkış satırı; prim hariç seçeneğinde prim satırı yok; fiyat seçeneği girişleri değiştirir', () => {
    const p = DEFAULT_PARAMS;
    const r = m.revenue;
    const opts = { ...defaultFilters(p), ekSabit: 100_000, primDahil: false, priceEur: p.subscriptionEur * 2 };
    const seri = cashSeriesOf(p, m, r, inputsOf(p, r, 'medyan', opts));
    const cf = buildCashflow(m.cashflow, opex, 'medyan', { seri, ekSabit: opts.ekSabit, primDahil: opts.primDahil });
    const ek = cf.cikislar.find((l) => l.ad.startsWith('Ek sabit gider'))!;
    expect(ek.kaynak).toBe('plan');
    expect(ek.aylar.every((v) => v === 100_000)).toBe(true);
    expect(cf.cikislar.some((l) => l.ad.startsWith('Satış primi'))).toBe(false);
    const temel = buildCashflow(m.cashflow, opex, 'medyan');
    expect(cf.toplam.giris).toBeGreaterThan(temel.toplam.giris);
    expect(temel.cikislar.some((l) => l.ad.startsWith('Ek sabit gider'))).toBe(false);
    expect(temel.cikislar.some((l) => l.ad.startsWith('Satış primi'))).toBe(true);
  });
});

/* ---------- Gelir planı (kullanıcı kararı 2026-10-27) ---------- */

test.describe('gelir planı', () => {
  const m = buildModel(DEFAULT_PARAMS);
  const r = m.revenue;
  const real = r.byId.medyan;
  const pess = r.byId.kotumser;
  const opt = r.byId.iyimser;
  const ms = (x: typeof real, id: string) => x.milestones.find((k) => k.id === id)!;

  test('senaryolar kötümser · medyan · iyimser (kullanıcı kararı 2026-10-27); her senaryonun hunisi ve yıllık etkisi var', () => {
    expect(r.scenarios.map((s) => s.id)).toEqual(['kotumser', 'medyan', 'iyimser']);
    expect(r.scenarios.map((s) => s.name)).toEqual(['Kötümser', 'Medyan', 'İyimser']);
    expect(r.byId.medyan.scenario.factor).toBe(1);
    expect(r.byId.medyan.scenario.retention).toBeCloseTo(DEFAULT_PARAMS.planRetention / 100, 5);
    expect(r.byId.kotumser.scenario.factor).toBeCloseTo(DEFAULT_PARAMS.pessimisticFactor / 100, 5);
    for (const s of r.scenarios) {
      const f = r.funnels[s.id].map((x) => x.value);
      expect(f).toEqual([...f].sort((a, b) => b - a));
      expect(f[0]).toBe(DEFAULT_PARAMS.memberTarget);
      expect(f[1]).toBe(DEFAULT_PARAMS.activeTarget);
      expect(r.monthlyOnly[s.id].kum12).toBeLessThanOrEqual(r.byId[s.id].kumulatif[11]);
    }
    expect(r.funnels.kotumser[4].value).toBeLessThan(r.funnels.medyan[4].value);
  });

  test('Ekim 2026 – Aralık 2027 (15 ay); ilk satış 6 Kasım; kapasite rampası ve ikinci saha; gelir formülü (kurla büyüyen fiyat); kümülatifler artan', () => {
    expect(r.months.length).toBe(HORIZON);
    expect(HORIZON).toBe(15);
    expect(r.months[0].iso).toBe('2026-10-01');
    expect(r.months[14].iso).toBe('2027-12-01');
    // Satış çarpanı: Ekim 0, Kasım kalan gün oranı (6 Kasım’dan: 25/30), sonra 1.
    expect(r.satis.slice(0, 3)).toEqual([0, 0.83, 1]);
    for (const x of r.series) expect(x.yeniAktif[0]).toBe(0);
    const saha1 = r.sources.find((x) => x.id === 'saha1')!;
    expect(saha1.values.slice(0, 4)).toEqual([0, 4, 6, 8]);
    const saha2 = r.sources.find((x) => x.id === 'saha2')!;
    expect(saha2.values.slice(0, 5)).toEqual([0, 0, 0, 4, 6]);
    const org = r.sources.find((x) => x.id === 'org')!;
    expect(org.values.slice(0, 4)).toEqual([0, 0, 3, 4.5]);
    // Medyan kaynakları: büyüme kuralı (her 6 ayda +1 saha) ayrı kaynak; kötümserde yok.
    expect(r.sources.map((x) => x.id)).toEqual(['saha1', 'saha2', 'sahaBuyume', 'crm', 'org', 'dijital', 'rep']);
    expect(r.sourcesFor(r.scenarios[0]).map((x) => x.id)).toEqual(['saha1', 'saha2', 'crm', 'org', 'dijital', 'rep']);
    // Büyüme kuralı (ikinci saha Ocak 2027 = 3. ay): medyan her 6 ayda → Temmuz 2027; iyimser her 4 ayda → Mayıs ve Eylül 2027.
    expect(growthHires(DEFAULT_PARAMS, r.months, r.inputsFor(r.scenarios[1]))).toEqual([9]);
    expect(growthHires(DEFAULT_PARAMS, r.months, r.inputsFor(r.scenarios[2]))).toEqual([7, 11]);
    // Dijital kanal: reklam Aralık’tan (bütçe ÷ kayıt maliyeti × dönüşüm = 4 / ay; rampa), organik Ocak’tan (2 / ay; rampa);
    // LTV ÷ CAC kuralı tutar: bütçe 3. aydan itibaren her 3 ayda ×1,5 (en çok 4×).
    const dij = r.sources.find((x) => x.id === 'dijital')!;
    expect(adCapacity(DEFAULT_PARAMS, DEFAULT_PARAMS.dijitalAdBudgetMonthly)).toBeCloseTo(4, 5);
    expect(dij.values.slice(0, 5)).toEqual([0, 0, 2, 4, 5.5]);
    const parca = adSchedule(DEFAULT_PARAMS, r.months, r.inputsFor(r.scenarios[1]));
    expect(parca.scales).toBe(true);
    expect(parca.kayit[2]).toBeCloseTo(25, 5);
    expect(parca.butce[1]).toBe(0);
    expect(parca.butce[2]).toBe(DEFAULT_PARAMS.dijitalAdBudgetMonthly);
    expect(parca.butce[5]).toBeCloseTo(DEFAULT_PARAMS.dijitalAdBudgetMonthly * 1.5, 2);
    expect(parca.carpan[14]).toBe(DEFAULT_PARAMS.dijitalScaleMax);
    const sabit = adSchedule(DEFAULT_PARAMS, r.months, r.inputsFor(r.scenarios[1], { dijitalScale: false }));
    expect(sabit.butce.slice(2).every((v) => v === DEFAULT_PARAMS.dijitalAdBudgetMonthly)).toBe(true);
    // Temsilci ağı her ay büyür (Aralık’tan, en çok repCap); fiyat kurla bileşik büyür.
    const rep = r.sources.find((x) => x.id === 'rep')!;
    expect(rep.values.slice(0, 5)).toEqual([0, 0, 0, 2, 4]);
    expect(rep.values[14]).toBe(DEFAULT_PARAMS.repCap);
    const fiyat = priceSeries(DEFAULT_PARAMS, r.months, r.inputsFor(r.scenarios[1]));
    expect(fiyat.abonelik[0]).toBeCloseTo(m.SUBSCRIPTION_TRY, 2);
    expect(fiyat.abonelik[12]).toBeCloseTo(m.SUBSCRIPTION_TRY * (1 + DEFAULT_PARAMS.eurTryGrowth / 100), 0);
    // Hedef zinciri günleri 19 Ekim 2026’dan sayılır: ilk hedef en az 18 gün (ilk satış 6 Kasım) sonra.
    for (const x of r.series) {
      const ilk = x.milestones.find((k) => k.days !== null);
      expect(ilk && ilk.days! >= 18).toBe(true);
    }
    for (const x of r.series) {
      for (let t = 0; t < HORIZON; t++) {
        // Satıcı-aylar iki ondalığa yuvarlanır: formül farkı binde birden küçük.
        const beklenen = x.yillik[t] * x.fiyat.yillik[t] + x.aylikOdeyen[t] * x.fiyat.abonelik[t];
        expect(Math.abs(x.gelir[t] - beklenen), `${x.scenario.id} ay ${t}`).toBeLessThanOrEqual(0.001 * beklenen + 1);
        expect(x.gelir[t]).toBeCloseTo(x.ilkOdeme[t] + x.yenileme[t], 0);
        if (t) {
          expect(x.kumulatif[t]).toBeGreaterThanOrEqual(x.kumulatif[t - 1]);
          expect(x.kumAktif[t]).toBeGreaterThanOrEqual(x.kumAktif[t - 1]);
        }
      }
      expect(x.kayit[5]).toBeCloseTo(x.yeniAktif[5] * r.ratio, 1);
    }
    expect(pess.kumulatif[11]).toBeLessThan(real.kumulatif[11]);
    expect(real.kumulatif[11]).toBeLessThan(opt.kumulatif[11]);
  });

  test('hedef zinciri sıralı; kötümser tarihler medyandan geç; 100 aktif 90 günden sonra', () => {
    const order = real.milestones.map((k) => k.days ?? Infinity);
    expect(order.slice().sort((a, b) => a - b)).toEqual(order);
    expect(ms(real, 'aktif100').days!).toBeGreaterThan(90);
    expect(ms(real, 'gelir3m').date).not.toBeNull();
    for (const k of real.milestones) {
      const p = ms(pess, k.id);
      if (k.days !== null && p.days !== null) expect(p.days, k.id).toBeGreaterThanOrEqual(k.days);
    }
    expect(r.need90).toBe(Math.ceil(DEFAULT_PARAMS.activeTarget / 3));
    expect(r.pricing[0].tl).toBeCloseTo(m.SUBSCRIPTION_TRY, 2);
    expect(r.pricing[1].tl).toBeCloseTo(m.ANNUAL_TRY, 2);
  });

  test('parametre: ikinci saha erken gelince 100 aktif erken; yıllık payı kümülatifi öne çeker', () => {
    const early = buildModel({ ...DEFAULT_PARAMS, secondSahaDate: '2026-12-01' }).revenue;
    expect(ms(early.byId.medyan, 'aktif100').days!).toBeLessThan(ms(real, 'aktif100').days!);
    const yillik = buildModel({ ...DEFAULT_PARAMS, annualShare: 60 }).revenue;
    expect(yillik.byId.medyan.kumulatif[2]).toBeGreaterThan(real.kumulatif[2]);
    const sifir = buildModel({ ...DEFAULT_PARAMS, annualShare: 0 }).revenue.byId.medyan;
    expect(sifir.yillik.every((v) => v === 0)).toBe(true);
    expect(sifir.aylikOdeyen[0]).toBeCloseTo(sifir.yeniAktif[0], 2);
  });
});

/* ---------- Başabaş (kullanıcı kararı 2026-10-27) ---------- */

test.describe('başabaş', () => {
  const m = buildModel(DEFAULT_PARAMS);
  const r = m.revenue;
  const opex = buildOpex();
  const f = defaultFilters(DEFAULT_PARAMS);
  const cost = (s: number) => s * DEFAULT_PARAMS.costFactor;
  const meta = (DEFAULT_PARAMS.metaWeekly * 52) / 12;

  test('plan kadrosu: sabit gider kadro + YZ + Meta ay ay büyür; prim yeni aktif × prim; net ve kümülatif tutarlı; gelir medyanla aynı', () => {
    const be = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan' }, null);
    expect(be.kaynak).toBe('plan');
    expect(be.fallback).toBe(false);
    // Ekim 2026 (hazırlık): yalnız Meta işe alım reklamı; Kasım: 1 saha, 1 CRM, Segika CRM, asistan, dijital, YZ araçları.
    expect(be.sabit[0]).toBeCloseTo(meta, 0);
    expect(be.sabit[1]).toBeCloseTo(cost(m.salaries.saha) + cost(m.salaries.masa) + cost(m.salaries.segika) + cost(m.salaries.asistan) + cost(m.salaries.dijital) + DEFAULT_PARAMS.aiToolsMonthly + meta, 0);
    // Aralık: organizatör, ekip lideri farkı ve satıcı kazanım reklamı; Ocak: ikinci saha personeli (parametre).
    expect(be.sabit[2]).toBeCloseTo(be.sabit[1] + cost(m.salaries.organizator) + cost(DEFAULT_PARAMS.leadUplift) + DEFAULT_PARAMS.dijitalAdBudgetMonthly, 0);
    expect(be.sabit[3]).toBeCloseTo(be.sabit[2] + cost(m.salaries.saha), 0);
    // Ek saha personeli ve reklam bütçesi hem gideri hem geliri değiştirir; ikinci saha gelmezse ikisi de düşer.
    const ek = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan', extraSaha: 2 }, null);
    expect(ek.sabit[3]).toBeCloseTo(be.sabit[3] + 2 * cost(m.salaries.saha), 0);
    expect(ek.toplam.gelir).toBeGreaterThan(be.toplam.gelir);
    expect(ek.sim.kumAktif[HORIZON - 1]).toBeGreaterThan(be.sim.kumAktif[HORIZON - 1]);
    const reklamsiz = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan', dijitalBudgetFactor: 0 }, null);
    expect(reklamsiz.sabit[2]).toBeCloseTo(be.sabit[2] - DEFAULT_PARAMS.dijitalAdBudgetMonthly, 0);
    expect(reklamsiz.toplam.gelir).toBeLessThan(be.toplam.gelir);
    // Büyüme kuralı: medyanda Temmuz 2027’den (9. ay) ek saha personeli (hem gider hem gelir); kapatınca ikisi de düşer.
    expect(be.sabit[9]).toBeCloseTo(be.sabit[8] + cost(m.salaries.saha), 0);
    const buyumesiz = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan', sahaGrowthEvery: 0 }, null);
    expect(buyumesiz.sabit[9]).toBeCloseTo(buyumesiz.sabit[8], 0);
    expect(buyumesiz.toplam.gelir).toBeLessThan(be.toplam.gelir);
    // Kur artışı kapalıysa gelir düşer; eğilim/öngörü alanı dolu.
    const sabitKur = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan', fxGrowth: 0 }, null);
    expect(sabitKur.toplam.gelir).toBeLessThan(be.toplam.gelir);
    expect(['ileri', 'geri', 'sabit']).toContain(be.ongoru.yon);
    expect(be.ongoru.nokta).not.toBeNull();
    const gelmez = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan', secondSahaIso: '2099-01-01' }, null);
    expect(gelmez.sabit[3]).toBeCloseTo(be.sabit[3] - cost(m.salaries.saha), 0);
    expect(gelmez.toplam.gelir).toBeLessThan(be.toplam.gelir);
    for (let t = 0; t < HORIZON; t++) {
      expect(be.prim[t]).toBeCloseTo(be.sim.yeniAktif[t] * DEFAULT_PARAMS.commission, 1);
      expect(be.gider[t]).toBeCloseTo(be.sabit[t] + be.prim[t], 1);
      expect(be.net[t]).toBeCloseTo(be.gelir[t] - be.gider[t], 1);
      if (t) expect(be.kumNet[t]).toBeCloseTo(be.kumNet[t - 1] + be.net[t], 1);
    }
    expect(be.gelir).toEqual(r.byId.medyan.gelir);
    const primsiz = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan', primDahil: false }, null);
    expect(primsiz.prim.every((v) => v === 0)).toBe(true);
    expect(primsiz.adet.degisken).toBe(0);
  });

  test('Sheets kaynağı: sabit gider = Sheets ay toplamı + Meta; 2028 ayları 2027 ortalaması; Sheets yoksa plana düşer', () => {
    const be = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', f, opex);
    expect(be.kaynak).toBe('sheets');
    expect(be.fallback).toBe(false);
    // Sheets’te olmayanlar eklenir: reklam bütçesi Aralık’tan, ikinci saha personelinin işveren maliyeti Ocak’tan.
    const reklam = DEFAULT_PARAMS.dijitalAdBudgetMonthly;
    const saha2 = DEFAULT_PARAMS.sahaSalary * DEFAULT_PARAMS.costFactor;
    expect(be.sabit[0]).toBeCloseTo(opex.aylik.find((x) => x.ay === 10)!.y2026.toplam + meta, 0);
    expect(be.sabit[1]).toBeCloseTo(opex.aylik.find((x) => x.ay === 11)!.y2026.toplam + meta, 0);
    expect(be.sabit[2]).toBeCloseTo(opex.aylik.find((x) => x.ay === 12)!.y2026.toplam + meta + reklam, 0);
    expect(be.sabit[3]).toBeCloseTo(opex.aylik.find((x) => x.ay === 1)!.y2027.toplam + meta + reklam + saha2, 0);
    // Aralık 2027 (t = 14): Sheets Aralık 2027 + Meta + ölçeklenmiş reklam + Sheets’te olmayan saha kişileri (ikinci + büyüme kuralıyla gelen, Temmuz 2027).
    const girdi = inputsOf(DEFAULT_PARAMS, r, 'medyan', f);
    const takvim = adSchedule(DEFAULT_PARAMS, r.months, girdi);
    const sahaEk = addedSahaCosts(DEFAULT_PARAMS, m, r.months, girdi);
    expect(takvim.butce[14]).toBeGreaterThan(reklam);
    expect(sahaEk[14]).toBeCloseTo(saha2 * 2, 0);
    expect(be.sabit[14]).toBeCloseTo(opex.aylik.find((x) => x.ay === 12)!.y2027.toplam + meta + takvim.butce[14] + sahaEk[14], 0);
    const gelmez = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, secondSahaIso: '2099-01-01' }, opex);
    expect(gelmez.sabit[3]).toBeCloseTo(be.sabit[3] - saha2, 0);
    const ek = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, ekSabit: 250_000 }, opex);
    expect(ek.sabit[0]).toBeCloseTo(be.sabit[0] + 250_000, 0);
    const yok = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', f, null);
    expect(yok.kaynak).toBe('plan');
    expect(yok.fallback).toBe(true);
  });

  test('kesişimler: başabaş ayında gelir ≥ gider, önceki ayda değil; geri ödeme kümülatif ≥ 0; ek sabit gider geciktirir; iyimser ≤ medyan ≤ kötümser', () => {
    const plan = { ...f, kaynak: 'plan' as const };
    const be = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', plan, null);
    expect(be.nokta).not.toBeNull();
    const t = Math.ceil(be.nokta!.t);
    expect(be.gelir[t]).toBeGreaterThanOrEqual(be.gider[t]);
    if (t) expect(be.gelir[t - 1]).toBeLessThan(be.gider[t - 1]);
    expect(be.nokta!.date >= r.months[Math.floor(be.nokta!.t)].iso).toBe(true);
    if (be.geriOdeme) {
      const g = Math.ceil(be.geriOdeme.t);
      expect(be.kumNet[g]).toBeGreaterThanOrEqual(0);
      if (g) expect(be.kumNet[g - 1]).toBeLessThan(0);
      expect(be.geriOdeme.t).toBeGreaterThanOrEqual(be.nokta!.t);
    }
    expect(be.enDusuk.deger).toBe(Math.min(...be.kumNet));
    const agir = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...plan, ekSabit: 500_000 }, null);
    if (agir.nokta) expect(agir.nokta.t).toBeGreaterThan(be.nokta!.t);
    // Ufuk içinde kesişim yoksa öngörü: kötümser + çok ağır sabit gider; eğilim ileriyse tahmini tarih ufuk sonrası, değilse “kapanmıyor”.
    const cokAgir = computeBreakeven(DEFAULT_PARAMS, m, r, 'kotumser', { ...plan, ekSabit: 5_000_000 }, null);
    expect(cokAgir.nokta).toBeNull();
    expect(cokAgir.ongoru.sonNet).toBeLessThan(0);
    if (cokAgir.ongoru.nokta) expect(cokAgir.ongoru.nokta.t).toBeGreaterThan(HORIZON - 1);
    const ay = (sid: 'kotumser' | 'medyan' | 'iyimser') => computeBreakeven(DEFAULT_PARAMS, m, r, sid, plan, null).nokta?.t ?? 99;
    expect(ay('iyimser')).toBeLessThanOrEqual(ay('medyan'));
    expect(ay('medyan')).toBeLessThanOrEqual(ay('kotumser'));
    // Filtre senaryoyu ezer: kötümser senaryoda tam kapasite ve %70 elde tutma = medyan sonucu.
    const ezilmis = computeBreakeven(DEFAULT_PARAMS, m, r, 'kotumser', { ...plan, factor: 1, retention: DEFAULT_PARAMS.planRetention / 100 }, null);
    expect(ezilmis.nokta?.t).toBeCloseTo(be.nokta!.t, 6);
  });

  test('başabaş noktası (adet): gelir ve gider doğruları noktada kesişir; ulaşma ayı ödeyen satıcıdan; duyarlılık 4 × 5 ve tekdüze', () => {
    const be = computeBreakeven(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan' }, null);
    const a = be.adet;
    // Satıcı başına aylık gelir kararlı dönem fiyatıyla (son 12 ayın ortalaması; kur artışıyla ilk aydan yüksek).
    const ort = (xs: number[]) => xs.slice(-12).reduce((x, y) => x + y, 0) / 12;
    expect(a.gelirBirim).toBeCloseTo(0.8 * ort(be.sim.fiyat.abonelik) + (0.2 * ort(be.sim.fiyat.yillik)) / 12, 1);
    expect(a.gelirBirim).toBeGreaterThan(0.8 * m.SUBSCRIPTION_TRY + (0.2 * m.ANNUAL_TRY) / 12);
    expect(a.degisken).toBeCloseTo((1 - DEFAULT_PARAMS.planRetention / 100) * DEFAULT_PARAMS.commission, 1);
    expect(a.sabit).toBeCloseTo(be.sabit.slice(HORIZON - 12).reduce((x, y) => x + y, 0) / 12, 0);
    expect(a.nokta).not.toBeNull();
    // Nokta bir ondalığa yuvarlanır: fark en çok 0,05 satıcının katkı payı.
    expect(Math.abs(a.nokta! * a.gelirBirim - (a.sabit + a.nokta! * a.degisken))).toBeLessThanOrEqual(0.05 * (a.gelirBirim - a.degisken) + 1);
    expect(a.n.length).toBe(25);
    expect(a.n[24]).toBeGreaterThanOrEqual(a.nokta!);
    expect(a.gelir[24]).toBeCloseTo(a.n[24] * a.gelirBirim, 0);
    expect(a.gider[0]).toBeCloseTo(a.sabit, 1);
    if (a.ulasir) {
      const t = Math.ceil(a.ulasir.t);
      expect(be.sim.odeyen[t]).toBeGreaterThanOrEqual(a.nokta!);
    }
    const grid = sensitivity(DEFAULT_PARAMS, m, r, 'medyan', { ...f, kaynak: 'plan' }, null);
    expect(grid.length).toBe(SENS_FACTORS.length);
    for (const row of grid) expect(row.length).toBe(SENS_RETENTIONS.length);
    const key = (d: string | null) => d ?? '9999';
    for (let i = 0; i < grid.length; i++) {
      for (let j = 0; j < grid[i].length; j++) {
        if (i) expect(key(grid[i][j]) <= key(grid[i - 1][j]), `kapasite ${i},${j}`).toBe(true);
        if (j) expect(key(grid[i][j]) <= key(grid[i][j - 1]), `elde tutma ${i},${j}`).toBe(true);
      }
    }
  });
});

/* ---------- İstihdam planı × senaryo (kullanıcı kararı 2026-10-27) ---------- */

test.describe('istihdam planı: görev, gider, gelir katkısı', () => {
  const m = buildModel(DEFAULT_PARAMS);
  const st = m.staffing;

  test('roller; doğrudan katkılar ufuk gelirine toplanır; dolaylı roller katkısız ama giderli; büyüme satırı kötümserde yok; iyimser ≥ medyan ≥ kötümser', () => {
    expect(st.byId.kotumser.rows.map((r) => r.role.id)).toEqual(['saha1', 'saha2', 'crm', 'org', 'dijital', 'reklam', 'asistan', 'segika', 'lider', 'rep']);
    expect(st.byId.medyan.rows.map((r) => r.role.id)).toEqual(['saha1', 'saha2', 'sahaBuyume', 'crm', 'org', 'dijital', 'reklam', 'asistan', 'segika', 'lider', 'rep']);
    expect(st.horizon).toBe(HORIZON);
    for (const sn of st.senaryolar) {
      const dogrudan = sn.rows.filter((x) => x.dogrudan);
      expect(dogrudan.map((x) => x.role.id)).toEqual(sn.scenario.id === 'kotumser' ? ['saha1', 'saha2', 'crm', 'org', 'dijital', 'reklam', 'rep'] : ['saha1', 'saha2', 'sahaBuyume', 'crm', 'org', 'dijital', 'reklam', 'rep']);
      // Model kaynaklarda doğrusal: katkıların toplamı 18 ay gelire eşittir (aylık kuruş yuvarlaması: binde birden az sapma).
      expect(Math.abs(sn.toplam.katki - sn.toplam.gelir) / sn.toplam.gelir).toBeLessThan(0.001);
      expect(sn.toplam.gelir).toBeCloseTo(m.revenue.byId[sn.scenario.id].kumulatif[HORIZON - 1], -1);
      for (const x of dogrudan) expect(x.katki, x.role.id).toBeGreaterThan(0);
      for (const x of sn.rows.filter((r) => !r.dogrudan)) {
        expect(x.katki).toBe(0);
        expect(x.gider).toBeGreaterThan(0);
        expect(x.net).toBe(-x.gider);
      }
      const saha1 = sn.rows.find((x) => x.role.id === 'saha1')!;
      // Kasım 2026 – Aralık 2027: 14 ay maaş; yeni aktif satış çarpanıyla (Kasım 25/30).
      expect(saha1.gider).toBeCloseTo(DEFAULT_PARAMS.sahaSalary * DEFAULT_PARAMS.costFactor * (HORIZON - 1), 0);
      expect(saha1.aktif).toBeCloseTo((4 * 0.83 + 6 + 8 * (HORIZON - 3)) * sn.scenario.factor, 1);
      const reklam = sn.rows.find((x) => x.role.id === 'reklam')!;
      const takvim = adSchedule(DEFAULT_PARAMS, m.revenue.months, m.revenue.inputsFor(sn.scenario));
      expect(reklam.gider).toBeCloseTo(takvim.butce.reduce((a, b) => a + b, 0), 0);
      expect(reklam.gider).toBeGreaterThan(DEFAULT_PARAMS.dijitalAdBudgetMonthly * (HORIZON - 2));
      const rep = sn.rows.find((x) => x.role.id === 'rep')!;
      expect(rep.gider).toBeCloseTo(rep.aktif * DEFAULT_PARAMS.commission, 0);
    }
    expect(st.byId.kotumser.toplam.katki).toBeLessThan(st.byId.medyan.toplam.katki);
    expect(st.byId.medyan.toplam.katki).toBeLessThan(st.byId.iyimser.toplam.katki);
    expect(st.byId.kotumser.toplam.gider).toBeLessThanOrEqual(st.byId.medyan.toplam.gider);
  });

  test('ek saha ve reklam bütçesi girdileri tabloyu değiştirir; Sheets tablosu başlık + medyanın 11 rolü + toplam', () => {
    const ek = makeStaffing(DEFAULT_PARAMS, m, m.revenue, { extraSaha: 1 });
    expect(ek.byId.medyan.rows.map((r) => r.role.id)).toContain('sahaEk');
    expect(ek.byId.medyan.toplam.gelir).toBeGreaterThan(st.byId.medyan.toplam.gelir);
    const reklamsiz = makeStaffing(DEFAULT_PARAMS, m, m.revenue, { dijitalBudget: 0 });
    expect(reklamsiz.byId.medyan.rows.find((x) => x.role.id === 'reklam')!.katki).toBe(0);
    expect(reklamsiz.byId.medyan.rows.find((x) => x.role.id === 'dijital')!.katki).toBeCloseTo(st.byId.medyan.rows.find((x) => x.role.id === 'dijital')!.katki, -3);
    const sheet = staffingSheet(st);
    expect(sheet.length).toBe(13);
    expect(sheet[0].length).toBe(8 + 3 * 4);
    expect(sheet[0][0]).toBe('Rol');
    expect(sheet[12][0]).toBe('Toplam');
    expect(sheet[1][0]).toBe('Saha satış uzmanı (1.)');
    // Kötümserde olmayan büyüme satırı o senaryonun sütunlarında boş.
    const buyume = sheet.find((row) => String(row[0]).startsWith('Büyüme'))!;
    expect(buyume[8]).toBe('');
    expect(Number(buyume[12])).toBeGreaterThan(0);
  });
});

/* ---------- Dijital pazarlama stratejisi (kullanıcı kararı 2026-10-27) ---------- */

test.describe('dijital pazarlama stratejisi: gider → gelir', () => {
  const m = buildModel(DEFAULT_PARAMS);
  const d = m.digitalStrategy;

  test('zincir, kademeler ve karar kuralı tutarlı; bütçe kademesi arttıkça kayıt ve gider orantılı, katkı artan', () => {
    expect(d.kanallar.length).toBe(6);
    expect(d.takvim.length).toBe(4);
    expect(d.kurallar.length).toBeGreaterThanOrEqual(4);
    expect(d.tierBudgets[0]).toBe(0);
    expect(d.tierBudgets).toContain(DEFAULT_PARAMS.dijitalAdBudgetMonthly);
    const z = d.zincir(m.revenue.byId.medyan.scenario);
    expect(z.kayit).toBeCloseTo(DEFAULT_PARAMS.dijitalAdBudgetMonthly / DEFAULT_PARAMS.dijitalCostPerLead, 5);
    expect(z.aktif).toBeCloseTo(z.kayit * (DEFAULT_PARAMS.dijitalLeadToActive / 100), 5);
    expect(z.cac).toBeCloseTo(DEFAULT_PARAMS.dijitalAdBudgetMonthly / z.aktif, 1);
    expect(z.ltv).toBeCloseTo(0.8 * (m.SUBSCRIPTION_TRY / 0.3) + 0.2 * m.ANNUAL_TRY, 0);
    for (const sn of d.byScenario) {
      const t = sn.tiers;
      expect(t[0].kayit).toBe(0);
      expect(t[0].katki).toBe(0);
      for (let i = 1; i < t.length; i++) {
        expect(t[i].kayit).toBeGreaterThan(t[i - 1].kayit);
        expect(t[i].katki).toBeGreaterThan(t[i - 1].katki);
        expect(t[i].gider).toBeGreaterThanOrEqual(t[i].butce * 12 - 1);
        // Kayıt ve gider bütçeyle orantılı (ölçek kuralı da orantılı): CAC kademeden bağımsız.
        expect(t[i].cac).toBeCloseTo(t[1].cac!, 0);
      }
    }
    expect(d.byId.kotumser.ltv).toBeLessThan(d.byId.medyan.ltv);
    expect(d.byId.kotumser.tiers[2].katki).toBeLessThan(d.byId.medyan.tiers[2].katki);
  });
});
