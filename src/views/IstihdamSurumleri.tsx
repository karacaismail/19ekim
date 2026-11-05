import { AppFrame } from '../components/AppFrame';
import { Choice } from '../components/ui';
import { SURUM_SECENEKLERI, useSurum, type Surum } from '../lib/surum';
import { HiringContent } from './OtherPages';
import { IstihdamV2 } from './IstihdamV2';

/**
 * İstihdam takvimi sürümleri (kullanıcı kararı 2026-11-05): v1 bugünkü takvimdir ve korunur. v2, 2027 kadro planını
 * (üç seçenek, 11 küme) ekler ve v1'deki rolleri “Eski” etiketiyle gösterir. Seçili sürüm adreste (?surum=v2) ve
 * tarayıcıda saklanır (`lib/surum.ts`). Seçici sayfa başlığının altındadır.
 */
export function IstihdamPage({ pathname }: { pathname: string }) {
  const [surum, sec] = useSurum('turksab-istihdam-surum');
  const secici = (
    <div className="so-surum">
      <Choice<Surum> label="Sürüm" value={surum} options={SURUM_SECENEKLERI} onChange={sec} />
    </div>
  );
  return <AppFrame pathname={pathname}>{surum === 'v2' ? <IstihdamV2 surum={secici} /> : <HiringContent surum={secici} />}</AppFrame>;
}
