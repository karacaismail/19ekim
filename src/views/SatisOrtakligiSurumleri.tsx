import { PolitikaBaglantilari } from '../components/PolitikaBaglantilari';
import '../styles/politikalar.css';
import { AppFrame } from '../components/AppFrame';
import { Choice } from '../components/ui';
import { SURUM_SECENEKLERI, useSurum, type Surum } from '../lib/surum';
import { SatisOrtakligiV1 } from './SatisOrtakligiPage';
import { SatisOrtakligiV2 } from './SatisOrtakligiV2';

/**
 * Satış ortaklığı sürümleri (kullanıcı kararı 2026-11-03): v1 korunur, v2 onun kopyasıdır ve ayrı gelişir.
 * v2 yalnız *V2 dosyalarını ve styles/satisOrtakligiV2.css'i kullanır. tests/surum.spec.ts iki sürümün birbirini
 * import etmediğini denetler.
 * Seçici, ürün ve ödeme satırının üstünde ayrı bir satırdır. Seçili sürüm adreste (?surum=v2) ve tarayıcıda saklanır
 * (`lib/surum.ts`). Her sürümün ayarları ayrı anahtarda durur.
 */

export function SatisOrtakligiPage({ pathname }: { pathname: string }) {
  const [surum, sec] = useSurum('turksab-satis-ortakligi-surum');
  const secici = (
    <div className="so-surum">
      <Choice<Surum> label="Sürüm" value={surum} options={SURUM_SECENEKLERI} onChange={sec} />
    </div>
  );
  return (
    <AppFrame pathname={pathname} wide>
      {surum === 'v2' ? <SatisOrtakligiV2 surum={secici} /> : <SatisOrtakligiV1 surum={secici} />}
      <PolitikaBaglantilari />
    </AppFrame>
  );
}
