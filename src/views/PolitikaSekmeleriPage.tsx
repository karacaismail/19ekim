import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Tabs } from '@mantine/core';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { PERSONALAR, type Marka, type RolId } from '../data/politikalar/types';
import type { AkisOlustur } from '../data/politikaAkislari/types';
import { href } from '../lib/paths';
import { PolitikaAkisi } from './PolitikaAkisi';

const PROJELER = [{ id: 'istoc', ad: 'iStoc' }, { id: 'segika', ad: 'Segika' }] as const;
const KISA_ADLAR: Record<RolId, string> = {
  oncu: 'Öncü ortak', kadrolu: 'Kadrolu uzman', cozum: 'Çözüm ortağı', tavsiye: 'Mevcut müşteri', elci: 'Marka elçisi',
};
type Secim = { proje: Marka; rol: RolId };
type Anahtar = `${Marka}/${RolId}`;
const anahtar = ({ proje, rol }: Secim): Anahtar => `${proje}/${rol}`;
const yukleyiciler: Record<Anahtar, () => Promise<{ akisOlustur: AkisOlustur }>> = {
  'istoc/oncu': () => import('../data/politikaAkislari/istoc/oncu'),
  'istoc/kadrolu': () => import('../data/politikaAkislari/istoc/kadrolu'),
  'istoc/cozum': () => import('../data/politikaAkislari/istoc/cozum'),
  'istoc/tavsiye': () => import('../data/politikaAkislari/istoc/tavsiye'),
  'istoc/elci': () => import('../data/politikaAkislari/istoc/elci'),
  'segika/oncu': () => import('../data/politikaAkislari/segika/oncu'),
  'segika/kadrolu': () => import('../data/politikaAkislari/segika/kadrolu'),
  'segika/cozum': () => import('../data/politikaAkislari/segika/cozum'),
  'segika/tavsiye': () => import('../data/politikaAkislari/segika/tavsiye'),
  'segika/elci': () => import('../data/politikaAkislari/segika/elci'),
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
  const [belge, setBelge] = useState<{ key: Anahtar; olustur: AkisOlustur } | null>(null);
  const [hata, setHata] = useState<Anahtar | null>(null);
  const onbellek = useRef(new Map<Anahtar, AkisOlustur>());
  const merkez = useRef<HTMLDivElement>(null);
  const secili = anahtar(secim);
  const etkinBelge = belge?.key === secili ? belge.olustur : null;

  // Doğrudan adres ve boyut değişimi seçili rolü gizlemesin. Odak yerinde kalır.
  useLayoutEffect(() => {
    const list = merkez.current?.querySelector<HTMLElement>('[aria-label="Çalışma rolü"]');
    const active = list?.querySelector<HTMLElement>('[aria-selected="true"]');
    if (!list || !active) return;
    const goster = () => {
      const area = list.getBoundingClientRect();
      const tab = active.getBoundingClientRect();
      // Kesirli piksel genişliği sekmenin bir kısmını kesmesin diye kaydırma yukarı yuvarlanır.
      if (tab.left < area.left) list.scrollLeft -= Math.ceil(area.left - tab.left);
      else if (tab.right > area.right) list.scrollLeft += Math.ceil(tab.right - area.right);
    };
    goster();
    const observer = new ResizeObserver(goster);
    observer.observe(list);
    observer.observe(active);
    return () => observer.disconnect();
  }, [secili]);

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
    if (kayit) { setBelge({ key: secili, olustur: kayit }); return; }
    setHata(null);
    yukleyiciler[secili]().then(({ akisOlustur }) => {
      onbellek.current.set(secili, akisOlustur);
      if (gecerli) setBelge({ key: secili, olustur: akisOlustur });
    }).catch(() => {
      if (gecerli) setHata(secili);
    });
    return () => { gecerli = false; };
  }, [secili]);


  function sec(yeni: Secim) {
    if (anahtar(yeni) === secili) return;
    adresYaz(yeni);
    setSecim(yeni);
  }
  const siniflar = { list: 'pol-sekme-listesi', tab: 'pol-sekme', panel: 'pol-sekme-paneli' };
  return <>
    <PageHeader title="Çalışma rehberleri" purpose="Projenizi ve rolünüzü seçin. Her adımda durumunuza uyan yanıtı verin." />
    <div className="pol-merkez" ref={merkez}>
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
              {etkinBelge ? <PolitikaAkisi key={secili} proje={secim.proje} rol={secim.rol} olustur={etkinBelge} />
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
