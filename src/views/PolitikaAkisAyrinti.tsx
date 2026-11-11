import { useEffect, useState } from 'react';
import type { Ayar, Marka, RolId } from '../data/satisOrtakligi';
import type { ProjePolitika } from '../data/politikalar/types';
import { rehberHesabi } from '../data/politikalar/hesap';
import { PolitikaBelgesi } from './PolitikaPage';

const loaders = {
  'istoc/oncu': () => import('../data/politikalar/istoc/oncu'),
  'istoc/kadrolu': () => import('../data/politikalar/istoc/kadrolu'),
  'istoc/cozum': () => import('../data/politikalar/istoc/cozum'),
  'istoc/tavsiye': () => import('../data/politikalar/istoc/tavsiye'),
  'istoc/elci': () => import('../data/politikalar/istoc/elci'),
  'segika/oncu': () => import('../data/politikalar/segika/oncu'),
  'segika/kadrolu': () => import('../data/politikalar/segika/kadrolu'),
  'segika/cozum': () => import('../data/politikalar/segika/cozum'),
  'segika/tavsiye': () => import('../data/politikalar/segika/tavsiye'),
  'segika/elci': () => import('../data/politikalar/segika/elci'),
};
export default function PolitikaAkisAyrinti({ proje, rol, ayar, bolum }: { proje: Marka; rol: RolId; ayar: Ayar; bolum: string }) {
  const [policy, setPolicy] = useState<ProjePolitika | null>(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let valid = true;
    loaders[`${proje}/${rol}`]().then(({ politika }) => { if (valid) setPolicy(politika); }).catch(() => { if (valid) setError(true); });
    return () => { valid = false; };
  }, [proje, rol]);
  useEffect(() => {
    if (bolum !== 'full' || !policy || !window.location.hash) return;
    try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); } catch { /* Geçersiz bölüm kodu yok sayılır. */ }
  }, [policy, bolum]);
  if (error) return <p role="alert">Ayrıntılar yüklenemedi. Bölümü kapatıp yeniden açın.</p>;
  if (!policy || policy.proje !== proje || policy.id !== rol) return <p role="status">Ayrıntılar yükleniyor.</p>;
  const hesap = rehberHesabi(rol, proje, ayar);
  if (bolum === 'full') return <PolitikaBelgesi politika={policy} hesap={hesap} />;
  if (bolum === 'kitle') return <>{policy.kitleler.map((k) => <section key={k.ad}><h4>{k.ad}</h4><p>{k.ihtiyac}</p><p>{k.ulasim}</p><blockquote>{k.mesaj}</blockquote><p>{k.uygunluk}</p><p>{k.sonrasi}</p></section>)}</>;
  if (bolum === 'anlasma') return <>{policy.anlasma.map((a) => <section key={a.baslik}><h4>{a.baslik}</h4>{a.metin.map((p) => <p key={p}>{p}</p>)}</section>)}</>;
  if (bolum === 'sinir') return <>{policy.sinir.map((p) => <p key={p}>{p}</p>)}</>;
  if (bolum === 'plan') return <>{hesap.plan.map((p) => <p key={p}>{p}</p>)}</>;
  return <>{hesap.ornekler.map((o) => <section key={o.urun}><dl className="pol-formuller">{o.satirlar.map((s) => <div key={s.ad}><dt>{s.ad}</dt><dd>{s.deger}</dd></div>)}</dl>{o.aciklama.map((p) => <p key={p}>{p}</p>)}</section>)}{hesap.odeme.map((p) => <p key={p}>{p}</p>)}</>;
}
