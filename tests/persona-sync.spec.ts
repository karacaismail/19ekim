import { expect, test } from '@playwright/test';
import { PersonaSync, type Reply, type Request, type Snapshot, type Transport } from '../src/lib/personaSync';
import { alanTanimlari, alanlardanAyar } from '../src/data/personaFields';

test.skip(({ browserName }) => browserName !== 'chromium', 'Tarayıcıdan bağımsız bağlantı motoru bir kez çalışır.');
const snapshot = (patch: Record<string, number | string> = {}): Snapshot => ({ revision: 'r1', updatedAt: '2026-11-11T12:00:00Z',
  fields: { ...Object.fromEntries(alanTanimlari('istoc').map((d) => [d.field, d.value])), ...patch } });
const success = (s: Snapshot, operationId?: string): Reply => ({ ok: true, ...s, access: 'development-public', operationId });
function deferred<T>() { let resolve!: (value: T) => void; const promise = new Promise<T>((r) => { resolve = r; }); return { promise, resolve }; }

test('boş anahtarla geliştirme erişimi okunur ve uzak değişiklik alınır', async () => {
  let remote = snapshot();
  const store = new PersonaSync('istoc', async () => success(remote));
  try {
    store.connect('');
    await expect.poll(() => store.getSnapshot().state).toBe('synced');
    remote = snapshot({ kur: 80 });
    store.retry();
    await expect.poll(() => store.getSnapshot().fields.kur).toBe(80);
    expect(store.getSnapshot().access).toBe('development-public');
  } finally { store.stop(); }
});

test('yazma sürerken yeni değer kaybolmaz ve yalnız değişen yaprak gönderilir', async () => {
  const first = deferred<Reply>();
  const calls: Request[] = [];
  let remote = snapshot();
  const transport: Transport = async (req) => {
    calls.push(req);
    if (req.action === 'read') return success(remote);
    if (calls.filter((r) => r.action === 'patch').length === 1) return first.promise;
    for (const c of req.changes!) remote.fields[c.field] = c.value;
    return success(remote, req.operationId);
  };
  const store = new PersonaSync('istoc', transport);
  try {
    store.connect(''); await expect.poll(() => store.getSnapshot().loaded).toBe(true);
    store.update({ 'oran.B': 0.2 });
    store.update({ 'oran.B': 0.3, kur: 60 });
    expect(store.getSnapshot().fields['oran.B']).toBe(0.3);
    const firstWrite = calls.find((r) => r.action === 'patch')!;
    remote = snapshot({ 'oran.B': 0.2 }); first.resolve(success(remote, firstWrite.operationId));
    await expect.poll(() => store.getSnapshot().state).toBe('synced');
    const writes = calls.filter((r) => r.action === 'patch');
    expect(writes).toHaveLength(2);
    expect(writes[0].changes).toEqual([{ field: 'oran.B', before: 0.12, value: 0.2 }]);
    expect(writes[1].changes).toEqual([{ field: 'oran.B', before: 0.2, value: 0.3 }, { field: 'kur', before: 56, value: 60 }]);
    expect(store.getSnapshot().fields['oran.B']).toBe(0.3);
  } finally { store.stop(); }
});

test('okuma başarısı başarısız yazmayı gizlemez ve yeniden deneme aynı kimliği kullanır', async () => {
  const calls: Request[] = [];
  let fail = true;
  const remote = snapshot();
  const store = new PersonaSync('istoc', async (req) => {
    calls.push(req);
    if (req.action === 'patch' && fail) throw new Error('offline');
    if (req.action === 'patch') for (const c of req.changes!) remote.fields[c.field] = c.value;
    return success(remote, req.operationId);
  });
  try {
    store.connect(''); await expect.poll(() => store.getSnapshot().loaded).toBe(true);
    store.update({ kur: 70 }); await expect.poll(() => store.getSnapshot().state).toBe('error');
    store.setVisible(false); store.setVisible(true);
    await expect.poll(() => calls.filter((r) => r.action === 'read').length).toBe(2);
    expect(store.getSnapshot().state).toBe('error');
    expect(store.getSnapshot().pending).toBe(1);
    fail = false; store.retry();
    await expect.poll(() => store.getSnapshot().state).toBe('synced');
    const writes = calls.filter((r) => r.action === 'patch');
    expect(writes[1].operationId).toBe(writes[0].operationId);
  } finally { store.stop(); }
});

test('çakışma kullanıcı değerini korur ve diğer alanları kaybetmez', async () => {
  let remote = snapshot();
  let conflict = true;
  const calls: Request[] = [];
  const store = new PersonaSync('istoc', async (req) => {
    calls.push(req);
    if (req.action === 'patch' && conflict) {
      remote = snapshot({ kur: 75, maas: 60000 });
      return { ok: false, code: 'conflict', message: 'Çakışma', conflicts: ['kur'], snapshot: remote };
    }
    if (req.action === 'patch') for (const c of req.changes!) remote.fields[c.field] = c.value;
    return success(remote, req.operationId);
  });
  try {
    store.connect(''); await expect.poll(() => store.getSnapshot().loaded).toBe(true);
    store.update({ kur: 70 }); await expect.poll(() => store.getSnapshot().state).toBe('conflict');
    expect(store.getSnapshot().fields.kur).toBe(70);
    expect(store.getSnapshot().remote.kur).toBe(75);
    expect(store.getSnapshot().fields.maas).toBe(60000);
    conflict = false; store.resolve('kur', true);
    await expect.poll(() => store.getSnapshot().state).toBe('synced');
    expect(calls.at(-1)?.changes).toEqual([{ field: 'kur', before: 75, value: 70 }]);
  } finally { store.stop(); }
});

test('bağlantı kapandıktan sonra gelen yanıt durumu değiştirmez', async () => {
  const late = deferred<Reply>();
  const store = new PersonaSync('istoc', async () => late.promise);
  store.connect(''); store.stop();
  late.resolve(success(snapshot({ kur: 100 })));
  await late.promise;
  expect(store.getSnapshot().fields.kur).toBe(56);
});

test('geçersiz ortak değerler hesap motoruna giremez', () => {
  expect(() => alanlardanAyar('istoc', { kur: Number.NaN })).toThrow();
  expect(() => alanlardanAyar('istoc', { 'kosul.oncu': 'yillara' })).toThrow();
  expect(alanlardanAyar('segika', { 'kosul.oncu': 'yillara' }).kosul.oncu).toBe('yillara');
  expect(alanlardanAyar('segika', { 'kademeler.3.ust': 0 }).kademeler[3].ust).toBe(0);
});

test('ilk yazma beklerken başka alandaki uzak değişiklik sessizce ezilmez', async () => {
  const first = deferred<Reply>();
  let remote = snapshot();
  const writes: Request[] = [];
  const store = new PersonaSync('istoc', async (req) => {
    if (req.action === 'read') return success(remote);
    writes.push(req);
    if (writes.length === 1) return first.promise;
    const conflicts = req.changes!.filter((c) => remote.fields[c.field] !== c.before && remote.fields[c.field] !== c.value).map((c) => c.field);
    if (conflicts.length) return { ok: false, code: 'conflict', conflicts, snapshot: remote, message: 'Çakışma' };
    for (const c of req.changes!) remote.fields[c.field] = c.value;
    return success(remote, req.operationId);
  });
  try {
    store.connect(''); await expect.poll(() => store.getSnapshot().loaded).toBe(true);
    store.update({ 'oran.B': 0.2 }); store.update({ kur: 60 });
    remote = snapshot({ 'oran.B': 0.2, kur: 75 });
    first.resolve(success(remote, writes[0].operationId));
    await expect.poll(() => store.getSnapshot().state).toBe('conflict');
    expect(remote.fields.kur).toBe(75);
    expect(store.getSnapshot().fields.kur).toBe(60);
    expect(writes[1].changes).toEqual([{ field: 'kur', before: 56, value: 60 }]);
  } finally { store.stop(); }
});

test('başka sekmenin okuması başarısız yazıyı yenilemede silemez', async () => {
  const { personaCacheRead, personaCacheWrite } = await import('../src/lib/personaCache');
  const memory = () => {
    const items = new Map<string, string>();
    return { getItem: (key: string) => items.get(key) ?? null, setItem: (key: string, value: string) => { items.set(key, value); } };
  };
  const shared = memory(), tabA = memory(), tabB = memory();
  const writes: string[] = [];
  let fail = true;
  let remote = snapshot();
  const transport: Transport = async (request) => {
    if (request.action === 'read') return success(remote);
    writes.push(request.operationId!);
    if (fail) throw new Error('Yanıt yok');
    for (const c of request.changes!) remote.fields[c.field] = c.value;
    return success(remote, request.operationId);
  };
  const a = new PersonaSync('istoc', transport, (cache) => personaCacheWrite('istoc', cache, shared, tabA));
  const b = new PersonaSync('istoc', transport, (cache) => personaCacheWrite('istoc', cache, shared, tabB));
  let resumed: PersonaSync | undefined;
  try {
    a.connect(''); await expect.poll(() => a.getSnapshot().loaded).toBe(true);
    a.update({ kur: 60 }); await expect.poll(() => a.getSnapshot().state).toBe('error');
    b.connect(''); await expect.poll(() => b.getSnapshot().state).toBe('synced');
    a.stop();
    resumed = new PersonaSync('istoc', transport);
    resumed.restore(personaCacheRead('istoc', shared, tabA));
    expect(resumed.getSnapshot().fields.kur).toBe(60);
    expect(resumed.getSnapshot().pending).toBe(1);
    fail = false; resumed.connect('');
    await expect.poll(() => resumed!.getSnapshot().state).toBe('synced');
    expect(writes).toHaveLength(2);
    expect(writes[1]).toBe(writes[0]);
    expect(remote.fields.kur).toBe(60);
  } finally { a.stop(); b.stop(); resumed?.stop(); }
});

test('tablodaki geçersiz alan bağlantı hatası gibi gösterilmez', async () => {
  const store = new PersonaSync('istoc', async () => ({ ok: false, code: 'invalid', invalidFields: ['kur'], message: 'Geçersiz hücre' }));
  try {
    store.connect('');
    await expect.poll(() => store.getSnapshot().error).toContain('Avronun ₺ karşılığı');
    expect(store.getSnapshot().fields.kur).toBe(56);
    expect(store.getSnapshot().loaded).toBe(false);
  } finally { store.stop(); }
});

test('geçersiz başarılı yanıt son geçerli hesabı değiştirmez', async () => {
  const store = new PersonaSync('istoc', async () => success(snapshot({ kur: Number.NaN })));
  try {
    store.connect('');
    await expect.poll(() => store.getSnapshot().error).toContain('Avronun ₺ karşılığı ortak kayıtta geçerli değil');
    expect(store.getSnapshot().fields.kur).toBe(56);
  } finally { store.stop(); }
});
