import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { expect, test } from '@playwright/test';
import { roles } from '../src/data/roles';
import { CIRO_TARGET, hiringSchedule, NEW_ACTIVE, payments, SUBSCRIPTION_TRY, targetPlan, weeklyActive } from '../src/data/program';

const minutes = (range: string) => {
  const [a, b] = range.split('–').map((t) => t.trim().split(':').map(Number));
  return b[0] * 60 + b[1] - (a[0] * 60 + a[1]);
};

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

  test('hedef dağılımı: 600 kayıt, 100 aktif satıcı; haftalık değerler aylara uyar', () => {
    const sum = (a: number[]) => a.reduce((x, y) => x + y, 0);
    expect(sum(targetPlan.flatMap((t) => t.kayit))).toBe(600);
    expect(sum(targetPlan.flatMap((t) => t.aktif))).toBe(100);
    expect(sum(weeklyActive)).toBe(100);
    expect([sum(weeklyActive.slice(0, 4)), sum(weeklyActive.slice(4, 8)), sum(weeklyActive.slice(8))]).toEqual(NEW_ACTIVE);
  });

  test('ciro köprüsü: 136 satıcı-ay gerekir; %70 elde tutma hedefi aşar, %0 açık bırakır', () => {
    expect(Math.ceil(CIRO_TARGET / SUBSCRIPTION_TRY)).toBe(136);
    expect(payments(0.7).total * SUBSCRIPTION_TRY).toBeGreaterThan(CIRO_TARGET);
    expect(Math.ceil((CIRO_TARGET - payments(0).total * SUBSCRIPTION_TRY) / SUBSCRIPTION_TRY)).toBe(36);
  });

  test('istihdam takvimi kararınızdaki sırada', () => {
    expect(hiringSchedule.map((h) => h.no)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(hiringSchedule.map((h) => h.date)).toEqual(['Şimdi', '1 Kasım 2026', '1 Kasım 2026', '1 Kasım 2026', '1 Kasım 2026', '1 Aralık 2026']);
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
    for (const file of html(dist)) {
      const text = readFileSync(file, 'utf8');
      for (const [, url] of text.matchAll(/href="(\/19ekim\/[^"]*)"/g)) {
        const [path, hash] = url.replace('/19ekim/', '').split('#');
        const target = path === '' ? join(dist, 'index.html') : path.endsWith('/') ? join(dist, path, 'index.html') : join(dist, path);
        if (!existsSync(target)) {
          broken.push(`${file}: ${url}`);
          continue;
        }
        if (hash && target.endsWith('.html') && !readFileSync(target, 'utf8').includes(`id="${hash}"`)) broken.push(`${file}: ${url} (#id yok)`);
      }
      for (const [, hash] of text.matchAll(/href="#([^"]+)"/g)) {
        if (!text.includes(`id="${hash}"`)) broken.push(`${file}: #${hash}`);
      }
    }
    expect(broken).toEqual([]);
  });
});
