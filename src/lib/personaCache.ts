import type { Marka } from '../data/satisOrtakligi';
import type { PersonaCache } from './personaSync';

type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
const SHARED = 'turksab-persona-ortak-v1-';
const TAB = 'turksab-persona-bekleyen-v1-';

/** Ortak anlık görüntü paylaşılır. Bekleyen yazılar her sekmenin kendi alanındadır. */
export function personaCacheWrite(project: Marka, cache: PersonaCache, shared: StorageLike, tab: StorageLike) {
  try { tab.setItem(TAB + project, JSON.stringify(cache)); } catch { /* Açık sayfanın kuyruğu bellekte kalır. */ }
  try { shared.setItem(SHARED + project, JSON.stringify({ snapshot: cache.snapshot })); } catch { /* Ağ kaydı bağımsızdır. */ }
}

export function personaCacheRead(project: Marka, shared: StorageLike, tab: StorageLike): unknown {
  const own = tab.getItem(TAB + project);
  if (own) return JSON.parse(own);
  const raw = shared.getItem(SHARED + project);
  if (!raw) return null;
  const cached: unknown = JSON.parse(raw);
  // Başka sekmenin bekleyen yazısı hiçbir zaman devralınmaz.
  return cached && typeof cached === 'object' && 'snapshot' in cached ? { snapshot: cached.snapshot } : null;
}
