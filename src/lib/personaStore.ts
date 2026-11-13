import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { alanlardanAyar, alanlaraAyir } from '../data/personaFields';
import { VARSAYILAN_AYAR, type Ayar, type Marka } from '../data/satisOrtakligi';
import { personaCacheRead, personaCacheWrite } from './personaCache';
import { PersonaSync, type Reply, type Transport } from './personaSync';

/** Yayımlanan servis adresidir. Erişim anahtarı hiçbir zaman pakete girmez. */
export const PERSONA_ENDPOINT = 'https://script.google.com/macros/s/AKfycbwCx1G0smFRWBDcj_489Y8UJn2RF2jwuptjH0ZHm0FmvZE0W0jh8vt3swO9Q7XwsgIY/exec';
const KEY = 'turksab-persona-erisim-v1';
const EVENT = 'turksab-persona-erisim';
const transport: Transport = async (body, signal) => {
  if (!PERSONA_ENDPOINT) throw new Error('Ortak kayıt bağlantısı kurulmadı.');
  const response = await fetch(PERSONA_ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(body), signal, redirect: 'follow', credentials: 'omit', cache: 'no-store' });
  if (!response.ok) throw new Error('Ortak kayıt alınamadı.');
  const reply: unknown = await response.json();
  if (!reply || typeof reply !== 'object' || !('ok' in reply) || typeof reply.ok !== 'boolean') throw new Error('Ortak kayıt yanıtı geçerli değil.');
  return reply as Reply;
};
const stores = new Map<Marka, PersonaSync>();
function getStore(project: Marka) {
  let store = stores.get(project);
  if (!store) {
    store = new PersonaSync(project, transport, (cache) => {
      try { personaCacheWrite(project, cache, localStorage, sessionStorage); } catch { /* Sekme açıkken kuyruk bellekte korunur. */ }
    });
    stores.set(project, store);
  }
  return store;
}
function keyRead() { try { return sessionStorage.getItem(KEY) ?? ''; } catch { return ''; } }
let memoryKey = '';
export function personaBaglan(key: string) {
  memoryKey = key.trim();
  try { if (memoryKey) sessionStorage.setItem(KEY, memoryKey); else sessionStorage.removeItem(KEY); } catch { /* Yalnız bu sayfada tutulur. */ }
  window.dispatchEvent(new Event(EVENT));
}

export function usePersonaAyar(project: Marka) {
  const store = useMemo(() => getStore(project), [project]);
  // Reddedilen değerin uyarısı alana bağlıdır. Başka alandaki geçerli değişiklik bu uyarıyı silmez. Aksi hâlde kutuda
  // hesaba girmeyen değer uyarısız kalır (sessiz düzeltme, docs/gorsel_algi.md V20).
  const [hatalar, setHatalar] = useState<Record<string, string>>({});
  const [hazirProje, setHazirProje] = useState<Marka | null>(null);
  const view = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  useEffect(() => {
    try { const raw = personaCacheRead(project, localStorage, sessionStorage); if (raw) store.restore(raw); } catch { /* Bozuk önbellek ortak kaydı değiştirmez. */ }
    setHazirProje(project);
    setHatalar({});
    const connect = () => { if (PERSONA_ENDPOINT) store.connect(memoryKey || keyRead()); };
    const visible = () => store.setVisible(document.visibilityState !== 'hidden');
    const online = () => store.retry();
    const beforeLeave = (event: BeforeUnloadEvent) => { if (store.getSnapshot().pending) event.preventDefault(); };
    connect(); visible();
    window.addEventListener(EVENT, connect);
    window.addEventListener('online', online);
    window.addEventListener('beforeunload', beforeLeave);
    document.addEventListener('visibilitychange', visible);
    return () => { store.stop(); window.removeEventListener(EVENT, connect); window.removeEventListener('online', online);
      window.removeEventListener('beforeunload', beforeLeave); document.removeEventListener('visibilitychange', visible); };
  }, [store, project]);
  const ayar = useMemo(() => alanlardanAyar(project, view.fields), [project, view.fields]);
  const guncelle = (patch: Partial<Ayar>) => {
    const alan = Object.keys(patch).sort().join(',');
    try {
      store.update(alanlaraAyir(patch));
      setHatalar((h) => { if (!(alan in h)) return h; const kalan = { ...h }; delete kalan[alan]; return kalan; });
    } catch (error) {
      const mesaj = error instanceof Error ? error.message : 'Alan değeri geçerli değil.';
      setHatalar((h) => ({ ...h, [alan]: mesaj }));
    }
  };
  const sifirla = () => {
    store.update(alanlaraAyir({ ...VARSAYILAN_AYAR, kosul: { oncu: 'ana', kadrolu: 'ana', cozum: 'ana', tavsiye: 'ana', elci: 'ana' } }));
    setHatalar({});
  };
  const inputError = Object.values(hatalar).join(' ');
  return { ayar, guncelle, sifirla, inputError, sync: view, store, hazir: hazirProje === project };
}
