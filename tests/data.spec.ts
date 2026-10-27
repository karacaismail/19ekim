import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { EXAMPLE, QUIZ, quadrantOf, relativeShare } from '../src/data/bcg';
import { contentPlan, pipeline, productionRamp } from '../src/data/digital';
import { DEFAULT_NOTES } from '../src/data/notes';
import { buildCashflow } from '../src/data/cashflow';
import { buildModel } from '../src/data/model';
import { DEFAULT_PARAMS, PARAM_GROUPS, type Params } from '../src/data/params';
import type { OrgNode } from '../src/data/tree';
import { addDays, shiftText } from '../src/lib/dates';
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

  test('ücret: maliyet = maaş × 2; saha kotası kendi maliyeti; asgari ücret çarpanları', () => {
    expect(m.quota).toBe(120_000);
    expect(m.salaries.masa).toBeCloseTo(28_075.5 * 1.25);
    expect(m.salaries.asistan).toBeCloseTo(28_075.5 * 1.5);
    expect(m.salaries.dijital).toBeCloseTo(28_075.5 * 1.25);
    expect(m.salaries.organizator).toBeCloseTo(28_075.5 * 2);
    expect(m.salaries.segika).toBeCloseTo(m.salaries.masa);
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

  test('asgari ücret değişince bağlı maaşlar ve maliyetler değişir', () => {
    const x = withParams({ minWage: 30_000 });
    expect(x.salaries.organizator).toBe(60_000);
    expect(x.role('organizator').pay).toContain('60.000 ₺');
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

  test('15 ay; ilk 90 günün satıcı-ayları hedefler sayfasıyla aynı; sonrası parametre', () => {
    const plan = m.cashflow;
    expect(plan.aylar.length).toBe(15);
    expect(plan.aylar[0].iso).toBe('2026-10-01');
    expect(plan.aylar[14].iso).toBe('2027-12-01');
    const pay = m.payments(m.planRetention);
    // Program Kasım’da başlar: Ekim 0; Kasım, Aralık, Ocak hedefler sayfasının aylık ödeyen satıcı sayısı.
    expect(plan.yeniAktif[0]).toBe(0);
    for (let i = 0; i < 3; i++) expect(plan.yeniAktif[i + 1] + plan.yenileme[i + 1]).toBeCloseTo(pay.monthly[i], 1);
    expect(plan.yeniAktif[4]).toBe(DEFAULT_PARAMS.newActiveMonthly);
    expect(plan.ilkOdeme[1]).toBeCloseTo(m.NEW_ACTIVE[0] * m.SUBSCRIPTION_TRY, 1);
    expect(plan.meta[0]).toBeCloseTo((DEFAULT_PARAMS.metaWeekly * 52) / 12, 1);
    expect(plan.yatirim.every((v) => v === 0)).toBe(true);
  });

  test('Sheets çıkışları kategori bazında ay toplamlarını tutar; dönem sonu nakit zinciri doğru', () => {
    const cf = buildCashflow(m.cashflow, opex);
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
});

/* ---------- Gelir planı (kullanıcı kararı 2026-10-27) ---------- */

test.describe('gelir planı', () => {
  const m = buildModel(DEFAULT_PARAMS);
  const r = m.revenue;
  const real = r.byId.gercekci;
  const pess = r.byId.kotumser;
  const opt = r.byId.iyimser;
  const ms = (x: typeof real, id: string) => x.milestones.find((k) => k.id === id)!;

  test('18 ay; kapasite rampası ve ikinci saha; gelir formülü; kümülatifler artan', () => {
    expect(r.months.length).toBe(18);
    expect(r.months[0].iso).toBe('2026-11-01');
    const saha1 = r.sources.find((x) => x.id === 'saha1')!;
    expect(saha1.values.slice(0, 3)).toEqual([4, 6, 8]);
    const saha2 = r.sources.find((x) => x.id === 'saha2')!;
    expect(saha2.values.slice(0, 4)).toEqual([0, 0, 4, 6]);
    const org = r.sources.find((x) => x.id === 'org')!;
    expect(org.values.slice(0, 3)).toEqual([0, 3, 4.5]);
    for (const x of r.series) {
      for (let t = 0; t < 18; t++) {
        expect(x.gelir[t], `${x.scenario.id} ay ${t}`).toBeCloseTo(x.yillik[t] * m.ANNUAL_TRY + x.aylikOdeyen[t] * m.SUBSCRIPTION_TRY, 0);
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

  test('hedef zinciri sıralı; kötümser tarihler gerçekçiden geç; 100 aktif 90 günden sonra', () => {
    const order = real.milestones.map((k) => k.days ?? Infinity);
    expect(order.slice().sort((a, b) => a - b)).toEqual(order);
    expect(ms(real, 'aktif100').days!).toBeGreaterThan(90);
    expect(ms(real, 'gelir3m').date).not.toBeNull();
    for (const k of real.milestones) {
      const p = ms(pess, k.id);
      if (k.days !== null && p.days !== null) expect(p.days, k.id).toBeGreaterThanOrEqual(k.days);
    }
    expect(r.need90).toBe(Math.ceil(DEFAULT_PARAMS.activeTarget / 3));
    expect(r.funnel.map((f) => f.value)).toEqual([...r.funnel.map((f) => f.value)].sort((a, b) => b - a));
    expect(r.pricing[0].tl).toBeCloseTo(m.SUBSCRIPTION_TRY, 2);
    expect(r.pricing[1].tl).toBeCloseTo(m.ANNUAL_TRY, 2);
  });

  test('parametre: ikinci saha erken gelince 100 aktif erken; yıllık payı kümülatifi öne çeker', () => {
    const early = buildModel({ ...DEFAULT_PARAMS, secondSahaDate: '2026-12-01' }).revenue;
    expect(ms(early.byId.gercekci, 'aktif100').days!).toBeLessThan(ms(real, 'aktif100').days!);
    const yillik = buildModel({ ...DEFAULT_PARAMS, annualShare: 60 }).revenue;
    expect(yillik.byId.gercekci.kumulatif[2]).toBeGreaterThan(real.kumulatif[2]);
    const sifir = buildModel({ ...DEFAULT_PARAMS, annualShare: 0 }).revenue.byId.gercekci;
    expect(sifir.yillik.every((v) => v === 0)).toBe(true);
    expect(sifir.aylikOdeyen[0]).toBeCloseTo(sifir.yeniAktif[0], 2);
  });
});
