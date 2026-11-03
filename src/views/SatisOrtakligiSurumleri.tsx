import { useEffect, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { Choice } from '../components/ui';
import { SatisOrtakligiV1 } from './SatisOrtakligiPage';
import { SatisOrtakligiV2 } from './SatisOrtakligiV2';

/**
 * Satış ortaklığı sürümleri (kullanıcı kararı 2026-11-03): v1 korunur, v2 onun kopyasıdır ve ayrı gelişir.
 * v2 dosyaları: views/SatisOrtakligiV2.tsx, data/satisOrtakligiV2.ts, data/kosullarV2.ts, components/*V2.tsx.
 * Seçili sürüm adreste (?surum=v2) ve tarayıcıda saklanır. Her sürümün ayarları ayrı anahtarda durur.
 */

type Surum = 'v1' | 'v2';
const ANAHTAR = 'turksab-satis-ortakligi-surum';
const gecerli = (v: string | null): v is Surum => v === 'v1' || v === 'v2';

function useSurum() {
  const [surum, setSurum] = useState<Surum>('v1');
  useEffect(() => {
    try {
      const adres = new URLSearchParams(window.location.search).get('surum');
      const kayit = localStorage.getItem(ANAHTAR);
      if (gecerli(adres)) setSurum(adres);
      else if (gecerli(kayit)) setSurum(kayit);
    } catch {
      /* okunamazsa v1 */
    }
  }, []);
  const sec = (v: Surum) => {
    setSurum(v);
    try {
      localStorage.setItem(ANAHTAR, v);
      const url = new URL(window.location.href);
      url.searchParams.set('surum', v);
      window.history.replaceState(null, '', url);
    } catch {
      /* depolama kapalı: seçim bu oturumda kalır */
    }
  };
  return [surum, sec] as const;
}

export function SatisOrtakligiPage({ pathname }: { pathname: string }) {
  const [surum, sec] = useSurum();
  const secici = (
    <Choice<Surum>
      label="Sürüm"
      value={surum}
      options={[
        { id: 'v1', name: 'v1' },
        { id: 'v2', name: 'v2' },
      ]}
      onChange={sec}
    />
  );
  return <AppFrame pathname={pathname} wide>{surum === 'v2' ? <SatisOrtakligiV2 surum={secici} /> : <SatisOrtakligiV1 surum={secici} />}</AppFrame>;
}
