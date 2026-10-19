import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { contentPlan, digitalPlan, integrations, pipeline, productionRamp } from '../src/data/digital';
import { growthKpis, levels, recruitmentFunnel } from '../src/data/growth';
import {
  calendarEvents,
  checkpoints,
  CIRO_TARGET,
  COMMISSION_PER_SALE,
  decisions,
  EMPLOYER_COST_FACTOR,
  hiringOrder,
  OVERTIME_CAP,
  overtimeUsed,
  SAHA_COMMISSION_THRESHOLD,
  SAHA_SALARY,
  workPeriods,
  managerPlan,
  NEW_ACTIVE,
  openDecisions,
  payments,
  SUBSCRIPTION_TRY,
  targetPlan,
} from '../src/data/program';
import { getRole, roles } from '../src/data/roles';
import { ORG, type OrgNode } from '../src/data/tree';

const minutes = (range: string) => {
  const [a, b] = range.split('–').map((t) => t.trim().split(':').map(Number));
  return b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
};
const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
const ISO = /^\d{4}-\d{2}-\d{2}$/;
const flat = (node: OrgNode): OrgNode[] => [node, ...(node.children ?? []).flatMap(flat)];

test.describe('veri tutarlılığı', () => {
  test('her rolün hafta içi 11 saat, Cumartesi 5 (organizatör 7) saat net', () => {
    for (const role of roles) {
      const net = (rows: typeof role.daily) => rows.filter((r) => r.tone !== 'break').reduce((s, r) => s + minutes(r.time), 0);
      expect(net(role.daily), role.slug).toBe(11 * 60);
      expect(net(role.saturday), role.slug).toBe((role.slug === 'organizator' ? 7 : 5) * 60);
      // bloklar kesintisiz ve sıralı
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
    for (const row of [...managerPlan, ...roles.flatMap((r) => r.plan)]) {
      expect(row.from, row.action).toMatch(ISO);
      expect(row.to, row.action).toMatch(ISO);
      expect(row.from <= row.to, row.action).toBe(true);
      expect(row.target.length, row.action).toBeGreaterThan(0);
    }
  });

  test('hedef dağılımı: 600 kayıt, 100 aktif satıcı; aylık 12 / 35 / 53', () => {
    expect(sum(targetPlan.flatMap((t) => t.kayit))).toBe(600);
    expect(sum(targetPlan.flatMap((t) => t.aktif))).toBe(100);
    expect(NEW_ACTIVE).toEqual([12, 35, 53]);
    // saha ekibinin (3 kişi; 3. kişi kapasite açığını kapatır: 45 kayıt, 8 aktif) KPI’ları hedef dağılımıyla aynı
    const saha = targetPlan.find((t) => t.role === 'saha-uzmani');
    expect(sum(saha?.kayit ?? [])).toBe(375 + 45);
    expect(sum(saha?.aktif ?? [])).toBe(55 + 8);
    expect(getRole('saha-uzmani').kpis.slice(0, 2).map((k) => k.value)).toEqual([String(sum(saha!.kayit)), String(sum(saha!.aktif))]);
    expect(getRole('saha-uzmani').ramp.values).toEqual(saha?.kayit);
  });

  test('ciro köprüsü: 136 satıcı-ay gerekir; %70 elde tutma hedefi aşar, %0 açık bırakır', () => {
    expect(Math.ceil(CIRO_TARGET / SUBSCRIPTION_TRY)).toBe(136);
    expect(payments(0.7).total * SUBSCRIPTION_TRY).toBeGreaterThan(CIRO_TARGET);
    expect(payments(0.66).total * SUBSCRIPTION_TRY).toBeGreaterThan(CIRO_TARGET);
    expect(payments(0.65).total * SUBSCRIPTION_TRY).toBeLessThan(CIRO_TARGET);
    expect(Math.ceil((CIRO_TARGET - payments(0).total * SUBSCRIPTION_TRY) / SUBSCRIPTION_TRY)).toBe(36);
  });

  test('kontrol noktaları model ile aynı: kümülatif aktif ve %70 senaryosu cirosu', () => {
    const monthly = payments(0.7).monthly;
    let aktif = 0;
    let paid = 0;
    checkpoints.forEach((c, i) => {
      aktif += NEW_ACTIVE[i];
      paid += monthly[i];
      expect(c.aktif, c.day).toBe(aktif);
      expect(Math.abs(c.ciro - paid * SUBSCRIPTION_TRY), c.day).toBeLessThanOrEqual(1);
    });
  });

  test('istihdam sırası kararınızdaki gibi; asistan yoksa dijital 1 Ocak', () => {
    expect(hiringOrder.map((h) => h.no)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(hiringOrder.map((h) => h.role)).toEqual(['yonetici', 'asistan', 'pazarlamaci', 'saha-uzmani', 'dijital-pazarlama', 'organizator', 'saha-uzmani']);
    expect(hiringOrder.map((h) => h.date)).toEqual([
      'Şimdi',
      '1 Kasım 2026',
      '1 Kasım 2026',
      '1 Kasım 2026',
      '1 Kasım 2026 (asistan yoksa 1 Ocak 2027)',
      '1 Aralık 2026',
      '1 Aralık 2026',
    ]);
    expect(hiringOrder.find((h) => h.role === 'saha-uzmani')?.count).toBe('2');
    for (const e of calendarEvents) expect(e.date >= '2026-10-01' && e.date <= '2027-01-31', e.title).toBe(true);
    for (const d of openDecisions) expect(d.deadline, d.topic).toMatch(ISO);
  });

  test('karar bekleyenlerde karar veren yalnız İsmail Karaca veya yatırımcı; kesinleşenler bekleyenlerde yok', () => {
    for (const d of openDecisions) expect(['yonetici', 'yatirimci'], d.topic).toContain(d.owner);
    const open = openDecisions.map((d) => d.topic);
    for (const d of decisions) expect(open, d.topic).not.toContain(d.topic);
    for (const topic of ['Ücret, prim ve kota', 'CRM aracı ve aşamaları', 'Kazanç planı (MLM)', 'Ekip lideri primi', '4. aydan itibaren mesai modeli']) {
      expect(decisions.some((d) => d.topic === topic), topic).toBe(true);
    }
  });

  test('ücret ve prim: maliyet = maaş × 2; saha prim eşiği kendi maliyeti; satış başına 2.500 ₺', () => {
    expect(EMPLOYER_COST_FACTOR).toBe(2);
    expect(SAHA_SALARY).toBe(60_000);
    expect(SAHA_COMMISSION_THRESHOLD).toBe(120_000);
    expect(COMMISSION_PER_SALE).toBe(2_500);
  });

  test('mesai modeli yasal tavanda: günde ≤ 11 sa, Dönem 2 haftada 45 sa, yıllık fazla çalışma ≤ 270 sa', () => {
    const [p1, p2] = workPeriods;
    expect(p1.weekly - p1.overtimePerWeek).toBe(45);
    expect(p2.weekly).toBe(45);
    expect(p2.overtimePerWeek).toBe(0);
    for (const used of Object.values(overtimeUsed)) expect(used).toBeLessThanOrEqual(OVERTIME_CAP);
    for (const role of roles) {
      for (const row of role.daily) expect(minutes(row.time)).toBeLessThanOrEqual(11 * 60);
      expect(role.hours.fromFeb, role.slug).toContain('45 sa');
    }
    // Dönem 1 düzeni sürseydi tavan 18. haftada dolardı: bu yüzden 1 Şubat’ta Dönem 2.
    expect(Math.ceil(OVERTIME_CAP / p1.overtimePerWeek)).toBe(18);
    expect(p1.weeks).toBeLessThan(18);
  });

  test('organizatör: eğitimden 60 kayıt ve 12 aktif satıcı; haftalık kayıt Aralık 5, Ocak 10', () => {
    const org = targetPlan.find((t) => t.role === 'organizator')!;
    expect([sum(org.kayit), sum(org.aktif)]).toEqual([60, 12]);
    expect(getRole('organizator').tasks.some((t) => t.measure.includes('~60 kayıt, ~12 aktif'))).toBe(true);
    // 4 haftalık aylarla: Aralık 20 ≈ 5 / hafta, Ocak 40 ≈ 10 / hafta
    expect(getRole('organizator').kpis.find((k) => k.metric === 'Eğitimden kayıt')?.value).toBe(`${org.kayit[1] / 4} → ${org.kayit[2] / 4}`);
  });

  test('temsilci ve saha sayıları her yerde aynı', () => {
    // Meta hunisi: haftada en fazla ~50 başvuru, ~0,5 aktif kalan (ayda ~2)
    expect(recruitmentFunnel[0].value).toBeLessThanOrEqual(50);
    expect(recruitmentFunnel.at(-1)?.value).toBe(0.5);
    // 30 Ocak: ~5 aktif temsilci (seviye 3), ağdan ~9 aktif satıcı
    expect(levels.at(-1)?.count).toBe(5);
    expect(getRole('ekip-lideri').kpis.find((k) => k.metric === 'Aktif temsilci')?.value).toBe('~5');
    expect(growthKpis.find((k) => k.metric === 'Aktif temsilci')?.target).toContain('~5');
    const reps = flat(ORG).find((n) => n.name === 'Bağımsız temsilciler');
    expect(reps?.sub).toContain('~5');
    // Saha: kişi başı günde 1–2 randevu + 10 çat kapı; masa başı günde 3 randevu açar (2 kişiye)
    expect(getRole('saha-uzmani').tasks[0].measure).toBe('Günde 1–2 randevu + 10 çat kapı');
    expect(getRole('pazarlamaci').tasks[1].measure).toContain('Günde 3 randevu');
  });
});

test.describe('dijital pazarlama: ölçüm → otomasyon → üretim → içerik planı', () => {
  test('ölçüm entegrasyonları tarihli; KPI sayısıyla aynı; üretim başlamadan GTM ve çerez onayı hazır', () => {
    const role = getRole('dijital-pazarlama');
    expect(role.kpis.find((k) => k.metric === 'Ölçüm altyapısı')?.value).toBe(`${integrations.length} / ${integrations.length}`);
    for (const i of integrations) {
      expect(i.date, i.name).toMatch(ISO);
      expect(i.done.length, i.name).toBeGreaterThan(0);
    }
    const firstPublish = digitalPlan.filter((p) => p.stream === 'uretim').map((p) => p.from).sort()[0];
    for (const name of ['Google Tag Manager', 'Çerez onayı (KVKK) + Consent Mode']) {
      expect(integrations.find((i) => i.name === name)!.date <= firstPublish, name).toBe(true);
    }
    for (const name of ['Google Analytics 4', 'Yandex Metrica']) expect(integrations.some((i) => i.name === name), name).toBe(true);
  });

  test('otomasyon hattında insan senaryo seçer ve yayını onaylar; diğer adımlar otomatik', () => {
    expect(pipeline.map((p) => p.mode)).toEqual(['otomatik', 'secim', 'otomatik', 'onay', 'otomatik', 'otomatik']);
    expect(productionRamp.auto.values.at(-1)).toBe(80);
    expect(getRole('dijital-pazarlama').kpis.find((k) => k.metric === 'Otomatik paylaşım')?.value).toBe('%80');
  });

  test('içerik planı Ocak hedefini karşılar: haftada 18 video = günde 3 × 6 gün', () => {
    const weekly = sum(contentPlan.map((p) => p.perWeek));
    expect(weekly).toBe(productionRamp.video.values.at(-1)! * 6);
    expect(getRole('dijital-pazarlama').kpis.find((k) => k.metric === 'Kısa video')?.value).toBe(String(productionRamp.video.values.at(-1)));
    for (const p of contentPlan) {
      expect(p.measure.length, p.pillar).toBeGreaterThan(0);
      expect(p.example.length, p.pillar).toBeGreaterThan(0);
    }
    for (const row of digitalPlan) {
      expect(row.from <= row.to, row.action).toBe(true);
      expect(row.from >= '2026-11-02' && row.to <= '2027-01-30', row.action).toBe(true);
    }
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
      // Grafik düğümlerindeki bağlantılar (organizasyon şeması) da çözülmeli.
      for (const [, url] of text.matchAll(/&quot;href&quot;:&quot;(\/19ekim\/[^&]*)&quot;/g)) check(file, url);
      for (const [, hash] of text.matchAll(/href="#([^"]+)"/g)) {
        if (!text.includes(`id="${hash}"`)) broken.push(`${file}: #${hash}`);
      }
    }
    expect(broken).toEqual([]);
  });
});
