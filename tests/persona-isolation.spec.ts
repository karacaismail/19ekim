import { readdirSync, readFileSync } from 'node:fs';
import { expect, test } from './fixtures/persona';

// Bu adres gerçek bir dağıtıma ait değildir. Fixture isteği ağdan önce karşılar.
const endpoint = 'https://script.google.com/macros/s/persona-isolation-test/exec';
test('tarayıcı testleri gerçek Google kaydı yerine ayrı test kaydını değiştirir', async ({ page, personaServer }) => {
  await page.goto('politikalar/');
  const reply = await page.evaluate(async (endpoint) => {
    const response = await fetch(endpoint, { method: 'POST', body: JSON.stringify({ service: 'persona', action: 'patch', project: 'istoc', key: '', operationId: 'fixture-check-1', changes: [{ field: 'kur', before: 56, value: 62 }] }) });
    return response.json();
  }, endpoint);
  expect(reply.ok).toBe(true);
  expect(personaServer.snapshot('istoc').fields.kur).toBe(62);
  expect(personaServer.snapshot('segika').fields.kur).toBe(56);
  expect(personaServer.writes).toHaveLength(1);
});

test('önceki testin değişikliği yeni teste taşınmaz', async ({ personaServer }) => {
  expect(personaServer.snapshot('istoc').fields.kur).toBe(56);
  expect(personaServer.writes).toHaveLength(0);
});

test('sayfa açan her test dosyası ayrı test kaydını kullanır', async ({ browserName }) => {
  test.skip(browserName !== 'chromium', 'Kaynak denetimi bir kez çalışır.');
  const dosyalar = readdirSync('tests').filter((ad) => ad.endsWith('.spec.ts'));
  const korumasiz = dosyalar.filter((ad) => {
    const metin = readFileSync(`tests/${ad}`, 'utf8');
    return /\bpage\b/.test(metin) && /\.goto\(/.test(metin) && !metin.includes("from './fixtures/persona'");
  });
  expect(korumasiz).toEqual([]);
});
