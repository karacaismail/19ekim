import { useState } from 'react';
import '../styles/personaSync.css';
import { Collapse, TextInput } from '@mantine/core';
import { useMotionMs } from '../lib/motion';
import { alanTanimlari } from '../data/personaFields';
import { personaBaglan, PERSONA_ENDPOINT } from '../lib/personaStore';
import type { PersonaSync, SyncView } from '../lib/personaSync';

export function PersonaSyncStatus({ sync, store, inputError = '' }: { sync: SyncView; store: PersonaSync; inputError?: string }) {
  const motion = useMotionMs('--motion-duration-base');
  const [key, setKey] = useState('');
  const [open, setOpen] = useState(false);
  const labels = alanTanimlari(store.project);
  const label = sync.state === 'synced' ? 'Ortak kayıt güncel.' : sync.state === 'loading' ? 'Ortak kayıt alınıyor.'
    : sync.state === 'pending' ? 'Değişiklikler ortak kayda gönderiliyor.' : sync.state === 'local' ? 'Bu değerler henüz ortak kayda bağlı değil.' : sync.error;
  return <section className="persona-sync" aria-label="Ortak kayıt" data-sync-state={sync.state}>
    <p role="status">{label}</p>
    {inputError && <p role="alert">{inputError} Geçerli bir değer girin.</p>}
    {sync.access === 'development-public' && <p className="persona-sync-zaman">Geliştirme erişimi açık. Bağlantıyı bilenler ortak değerleri değiştirebilir.</p>}
    {sync.pending > 0 && <p>{sync.pending} alan için kayıt onayı bekleniyor.</p>}
    {sync.state === 'synced' && sync.readAt && <p className="persona-sync-zaman">Son kontrol zamanı şudur: {new Date(sync.readAt).toLocaleString('tr-TR', { dateStyle: 'full', timeStyle: 'short' })}.</p>}
    {sync.state === 'error' && <button className="persona-action" onClick={() => store.retry()}>Yeniden dene</button>}
    {sync.conflicts.map((field) => <div className="persona-cakisma" key={field}>
      <h3>{labels.find((d) => d.field === field)?.label ?? 'Değişen alan'}</h3>
      <p>Sizdeki değer: {String(sync.fields[field])}</p><p>Ortak kayıttaki değer: {String(sync.remote[field])}</p>
      <button className="persona-action" onClick={() => store.resolve(field, false)}>Ortak değeri kullan</button>
      <button className="persona-action" onClick={() => store.resolve(field, true)}>Benim değerimi gönder</button>
    </div>)}
    {(sync.state === 'local' || sync.state === 'error') && <>
      <button className="persona-action" aria-expanded={open} aria-controls="persona-baglanti" onClick={() => setOpen(!open)}>Ortak kayda bağlan</button>
      <Collapse expanded={open} transitionDuration={motion} transitionTimingFunction="var(--motion-ease-standard)"><form id="persona-baglanti" onSubmit={(event) => { event.preventDefault(); personaBaglan(key); setKey(''); }}>
        <p>Ortak kayıt anahtar isterse anahtarı proje sorumlusundan alın. Anahtarı aşağıdaki alana yazın.</p>
        <TextInput type="password" label="Ortak kayıt erişim anahtarı" value={key} onChange={(e) => setKey(e.currentTarget.value)} autoComplete="off" />
        <button type="submit" className="persona-action" disabled={!key.trim() || !PERSONA_ENDPOINT}>Bağlan</button>
        {!PERSONA_ENDPOINT && <p>Ortak kayıt bağlantısı henüz kurulmadı.</p>}
      </form></Collapse>
    </>}
  </section>;
}
