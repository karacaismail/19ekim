import { useEffect, useRef, useState } from 'react';
import { Tabs } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { PERSONALAR, type Marka, type ProjePolitika, type RolId } from '../data/politikalar/types';
import { rehberHesabi } from '../data/politikalar/hesap';
import { href } from '../lib/paths';
import { PolitikaBelgesi } from './PolitikaPage';

const PROJELER = [{ id: 'istoc', ad: 'iStoc' }, { id: 'segika', ad: 'Segika' }] as const;
const KISA_ADLAR: Record<RolId, string> = {
  oncu: 'Öncü ortak', kadrolu: 'Kadrolu uzman', cozum: 'Çözüm ortağı', tavsiye: 'Mevcut müşteri', elci: 'Marka elçisi',
};
type Secim = { proje: Marka; rol: RolId };
type Anahtar = `${Marka}/${RolId}`;
const anahtar = ({ proje, rol }: Secim): Anahtar => `${proje}/${rol}`;
const yukleyiciler: Record<Anahtar, () => Promise<{ politika: ProjePolitika }>> = {
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
function adrestenOku(eskiRol?: RolId): Secim {
  const sorgu = new URLSearchParams(window.location.search);
  const proje = sorgu.get('proje') === 'segika' ? 'segika' : 'istoc';
  const rol = PERSONALAR.find((p) => p.id === sorgu.get('rol'))?.id ?? eskiRol ?? 'oncu';
  return { proje, rol };
}
function adresYaz(secim: Secim, degistir = false) {
  const url = `${href('/politikalar/')}?proje=${secim.proje}&rol=${secim.rol}${degistir ? window.location.hash : ''}`;
  if (degistir) window.history.replaceState(null, '', url);
  else window.history.pushState(null, '', url);
}

/** Giriş kapısı açılmadan bu bileşen kurulmaz ve belge yüklenmez. */
function RehberSekmeleri({ eskiRol }: { eskiRol?: RolId }) {
  const [secim, setSecim] = useState<Secim>(() => adrestenOku(eskiRol));
  const [belge, setBelge] = useState<ProjePolitika | null>(null);
  const [hata, setHata] = useState<Anahtar | null>(null);
  const onbellek = useRef(new Map<Anahtar, ProjePolitika>());
  const secili = anahtar(secim);
  const etkinBelge = belge && `${belge.proje}/${belge.id}` === secili ? belge : null;

  useEffect(() => {
    adresYaz(adrestenOku(eskiRol), true);
    const geri = () => {
      const yeni = adrestenOku();
      adresYaz(yeni, true);
      setSecim(yeni);
    };
    window.addEventListener('popstate', geri);
    return () => window.removeEventListener('popstate', geri);
  }, [eskiRol]);

  useEffect(() => {
    let gecerli = true;
    const kayit = onbellek.current.get(secili);
    if (kayit) { setBelge(kayit); return; }
    setHata(null);
    yukleyiciler[secili]().then(({ politika }) => {
      onbellek.current.set(secili, politika);
      if (gecerli) setBelge(politika);
    }).catch(() => {
      if (gecerli) setHata(secili);
    });
    return () => { gecerli = false; };
  }, [secili]);

  // Belge sonradan geldiğinde paylaşılmış bölüm adresini de açın.
  useEffect(() => {
    if (!etkinBelge || !window.location.hash) return;
    try { document.getElementById(decodeURIComponent(window.location.hash.slice(1)))?.scrollIntoView(); }
    catch { /* Geçersiz bölüm kodu belgeyi açmayı engellemez. */ }
  }, [etkinBelge]);

  function sec(yeni: Secim) {
    if (anahtar(yeni) === secili) return;
    adresYaz(yeni);
    setSecim(yeni);
  }
  const siniflar = { list: 'pol-sekme-listesi', tab: 'pol-sekme', panel: 'pol-sekme-paneli' };
  return <>
    <PageHeader title="Çalışma rehberleri" purpose="Önce projeyi, sonra çalışma rolünü seçin." />
    <div className="pol-merkez">
      <Tabs value={secim.proje} onChange={(proje) => { if (proje) sec({ ...secim, proje: proje as Marka }); }}
        keepMounted={false} unstyled classNames={siniflar}>
        <Tabs.List aria-label="Proje">
          {PROJELER.map((p) => <Tabs.Tab key={p.id} value={p.id}>{p.ad}</Tabs.Tab>)}
        </Tabs.List>
        {PROJELER.map((proje) => <Tabs.Panel key={proje.id} value={proje.id}>
          <Tabs value={secim.rol} onChange={(rol) => { if (rol) sec({ ...secim, rol: rol as RolId }); }}
            keepMounted={false} unstyled classNames={siniflar}>
            <Tabs.List aria-label="Çalışma rolü">
              {PERSONALAR.map((p) => <Tabs.Tab key={p.id} value={p.id}>{KISA_ADLAR[p.id]}</Tabs.Tab>)}
            </Tabs.List>
            {PERSONALAR.map((p) => <Tabs.Panel key={p.id} value={p.id}>
              {etkinBelge ? <PolitikaBelgesi key={secili} politika={etkinBelge} hesap={rehberHesabi(secim.rol, secim.proje)} />
                : hata === secili ? <div className="pol-yukleme" role="alert">
                  <p>Rehber yüklenemedi. İnternet bağlantınızı kontrol edin.</p>
                  <button className="pol-sekme" type="button" onClick={() => window.location.reload()}>Sayfayı yeniden yükle</button>
                </div> : <p className="pol-yukleme" role="status">{proje.ad} rehberi yükleniyor.</p>}
            </Tabs.Panel>)}
          </Tabs>
        </Tabs.Panel>)}
      </Tabs>
    </div>
  </>;
}

export function PolitikaSekmeleriPage({ eskiRol }: { eskiRol?: RolId }) {
  return <AppFrame pathname={href('/politikalar/')}><RehberSekmeleri eskiRol={eskiRol} /></AppFrame>;
}
