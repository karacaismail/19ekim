import { useEffect, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { ASAMALAR, BEKLEME_NOTU, HER_DURUMDA, KAPANIS_DURUMLARI, durumlar, sablonlar, type Adim, type Asama, type Durum, type Sablon } from '../data/onboarding';
import '../styles/onboarding.css';

/**
 * Yeni kayıt iş akışları (kullanıcı kararları 2026-11-10): CRM masası sorumlusu için. Sıra: giriş cümlesi → aşama
 * haritası (dört aşama ve sürecin sonu) → her durumda geçerli kurallar → aşamalar → her aşamada olabilen durumlar.
 * Her aşama “Başlar” kutusuyla açılır, durumları listeler ve “Biter” kutusuyla kapanır. Bitiş kutusu kayıt kartına
 * yazılacak durumu ve sonraki aşamayı gösterir. Durumlar `details` ile kapalı gelir. Başka bir duruma geçiş bağlantısı
 * hedef durumu açar ve odağı onun başlığına taşır. Mobil önce yazıldı.
 */

const asamaId = (no: number) => `asama-${no}`;
const durumId = (id: string) => `durum-${id}`;

/** Bağlantıyla gidilen durumu açar ve başlığına odaklanır. Kaydırmayı tarayıcının bağlantı davranışı yapar. */
function durumuAc(id: string) {
  const el = document.getElementById(durumId(id));
  if (el instanceof HTMLDetailsElement) {
    el.open = true;
    window.requestAnimationFrame(() => el.querySelector('summary')?.focus());
  }
}

/** Adres `#durum-…` ise o durumu açar: sayfa doğrudan bağlantıyla açılınca kaydırır, adres değişince odaklar. */
function useAdrestekiDurum() {
  useEffect(() => {
    const ac = (ilk: boolean) => {
      const h = decodeURIComponent(window.location.hash.slice(1));
      if (!h.startsWith('durum-')) return;
      const el = document.getElementById(h);
      if (!(el instanceof HTMLDetailsElement)) return;
      el.open = true;
      if (ilk) el.scrollIntoView({ block: 'start' });
      else window.requestAnimationFrame(() => el.querySelector('summary')?.focus());
    };
    ac(true);
    const dinle = () => ac(false);
    window.addEventListener('hashchange', dinle);
    return () => window.removeEventListener('hashchange', dinle);
  }, []);
}

function AdimMetni({ a, adOf }: { a: Adim; adOf: (id: string) => string }) {
  if (typeof a === 'string') return <>{a}</>;
  return (
    <>
      {a.metin}
      <a className="text-link ob-git" href={`#${durumId(a.git)}`} onClick={() => durumuAc(a.git)}>
        {adOf(a.git)}
      </a>
    </>
  );
}

type KopyaDurumu = 'bekliyor' | 'oldu' | 'olmadi';

function HazirMetin({ s }: { s: Sablon }) {
  const [durum, setDurum] = useState<KopyaDurumu>('bekliyor');
  const kopyala = async () => {
    const metin = s.konu ? `Konu: ${s.konu}\n\n${s.metin}` : s.metin;
    try {
      await navigator.clipboard.writeText(metin);
      setDurum('oldu');
      window.setTimeout(() => setDurum((d) => (d === 'oldu' ? 'bekliyor' : d)), 2500);
    } catch {
      setDurum('olmadi');
    }
  };
  return (
    <div className="ob-sablon">
      <p className="ob-etiket">Hazır metin: {s.ad}</p>
      {s.konu ? <p className="ob-sablon-konu">Konu: {s.konu}</p> : null}
      <p className="ob-sablon-metin">{s.metin}</p>
      <div className="ob-sablon-arac">
        <button type="button" className="ob-kopyala" onClick={kopyala}>
          Metni kopyala
        </button>
        <p className="ob-kopya-durum" role="status" aria-live="polite">
          {durum === 'oldu' ? 'Metin panoya kopyalandı.' : durum === 'olmadi' ? 'Kopyalanamadı. Metni seçip elle kopyalayın.' : ''}
        </p>
      </div>
    </div>
  );
}

function DurumKarti({ d, no, adOf, sablon }: { d: Durum; no?: string; adOf: (id: string) => string; sablon?: Sablon }) {
  return (
    <li className="ob-durum-oge">
      <details className="ob-durum" id={durumId(d.id)}>
        <summary className="ob-durum-ozet" data-no={no ? '' : undefined}>
          {no ? <span className="ob-durum-no">{no}</span> : null}
          <span className="ob-durum-ad">{d.ad}</span>
        </summary>
        <div className="ob-durum-govde">
          <ol className="ob-adimlar">
            {d.adimlar.map((a) => (
              <li key={typeof a === 'string' ? a : a.metin + a.git} className="ob-adim">
                <AdimMetni a={a} adOf={adOf} />
              </li>
            ))}
          </ol>
          <p className="ob-kart">
            <span className="ob-etiket">Kayıt kartına yazın</span>
            {d.kart}
          </p>
          {sablon ? <HazirMetin s={sablon} /> : null}
        </div>
      </details>
    </li>
  );
}

function AsamaHaritasi() {
  return (
    <nav className="ob-harita" aria-labelledby="ob-harita-baslik">
      <h2 className="ob-bolum-baslik" id="ob-harita-baslik">
        Aşamalar
      </h2>
      <ol className="ob-harita-liste">
        {ASAMALAR.map((a) => (
          <li key={a.no} className="ob-harita-oge">
            <a className="ob-harita-bag" href={`#${asamaId(a.no)}`}>
              <span className="ob-harita-no" aria-hidden="true">
                {a.no}
              </span>
              <span className="ob-harita-ad">
                Aşama {a.no}: {a.ad}
              </span>
              <span className="ob-harita-satir">{a.gun}</span>
              <span className="ob-harita-satir">Kayıt kartı: {a.kartDurumu}</span>
              <span className="ob-harita-satir">Biter: {a.cikislar[0].kosul}</span>
              {a.cikislar.length > 1 ? (
                <span className="ob-harita-satir">
                  Başka sonuç: {a.cikislar
                    .slice(1)
                    .map((c) => c.kart)
                    .join(' ya da ')}
                </span>
              ) : null}
            </a>
          </li>
        ))}
        <li className="ob-harita-oge" data-son="">
          <div className="ob-harita-bag">
            <span className="ob-harita-no" aria-hidden="true">
              ✓
            </span>
            <span className="ob-harita-ad">Süreç biter</span>
            <span className="ob-harita-satir">Kayıt kartı: {KAPANIS_DURUMLARI.join(', ')}</span>
            <span className="ob-harita-satir">{BEKLEME_NOTU}</span>
          </div>
        </li>
      </ol>
      <p className="ob-harita-not">
        Aşamalar dışında her an olabilecek durumlar sayfanın sonundadır:{' '}
        <a className="text-link" href="#her-an">
          Her aşamada olabilecek durumlar
        </a>
      </p>
    </nav>
  );
}

function AsamaBolumu({ a, durumListesi, adOf, sablonOf }: { a: Asama; durumListesi: Durum[]; adOf: (id: string) => string; sablonOf: (id?: string) => Sablon | undefined }) {
  const adi = (no: number) => ASAMALAR.find((x) => x.no === no)!.ad;
  return (
    <section className="ob-asama" id={asamaId(a.no)} aria-labelledby={`${asamaId(a.no)}-baslik`}>
      <header className="ob-asama-bas">
        <span className="ob-asama-no" aria-hidden="true">
          {a.no}
        </span>
        <div className="ob-asama-baslik">
          <h2 className="ob-asama-ad" id={`${asamaId(a.no)}-baslik`}>
            Aşama {a.no}: {a.ad}
          </h2>
          <p className="ob-asama-gun">{a.gun}</p>
        </div>
      </header>
      <div className="ob-asama-govde">
        <div className="ob-sinir" data-tur="baslar">
          <h3 className="ob-sinir-etiket">Başlar</h3>
          <p>{a.baslar}</p>
          <p>Kayıt kartı: {a.kartDurumu}</p>
        </div>
        <h3 className="ob-durumlar-baslik">Bu aşamadaki durumlar</h3>
        <ul className="ob-durumlar">
          {durumListesi.map((d, i) => (
            <DurumKarti key={d.id} d={d} no={`${a.no}.${i + 1}`} adOf={adOf} sablon={sablonOf(d.sablon)} />
          ))}
        </ul>
        <div className="ob-sinir" data-tur="biter">
          <h3 className="ob-sinir-etiket">Biter</h3>
          <p>Bu aşama aşağıdakilerden biri olunca biter.</p>
          <ul className="ob-cikislar">
            {a.cikislar.map((c) => (
              <li key={c.kosul} className="ob-cikis">
                <p className="ob-cikis-kosul">{c.kosul}</p>
                <p>Kayıt kartı: {c.kart}</p>
                <p className="ob-cikis-sonra">
                  {c.git ? (
                    <a className="text-link ob-sonra-bag" href={`#${asamaId(c.git)}`}>
                      Sonra: Aşama {c.git}, {adi(c.git)}
                    </a>
                  ) : c.durum ? (
                    <>
                      Sonra: {c.sonra}
                      <a className="text-link ob-git" href={`#${durumId(c.durum)}`} onClick={() => durumuAc(c.durum!)}>
                        {adOf(c.durum)}
                      </a>
                    </>
                  ) : (
                    <>Sonra: {c.sonra}</>
                  )}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Icerik() {
  const { params } = useModel();
  const tum = durumlar(params);
  const metinler = sablonlar(params);
  const adOf = (id: string) => tum.find((d) => d.id === id)?.ad ?? id;
  const sablonOf = (id?: string) => (id ? metinler[id] : undefined);
  const herAn = tum.filter((d) => d.yer === 'her-an');
  useAdrestekiDurum();

  return (
    <>
      <PageHeader title="Yeni kayıt iş akışları" purpose="CRM masası için: yeni kayıtla karşılaştığınız her durumda ne yapacağınızı adım adım gösterir." />
      <div className="ob-sayfa">
        <p className="ob-giris">
          Kaydın hangi aşamada olduğunu kayıt kartındaki durumdan anlarsınız. Her aşama yazılı bir koşulla biter. Koşul gerçekleşince kart durumunu değiştirin. Sonraki aşama o anda başlar.
        </p>

        <AsamaHaritasi />

        <section className="ob-kurallar" aria-labelledby="ob-kurallar-baslik">
          <h2 className="ob-bolum-baslik" id="ob-kurallar-baslik">
            Her durumda
          </h2>
          <ul className="ob-kurallar-liste">
            {HER_DURUMDA.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </section>

        {ASAMALAR.map((a) => (
          <AsamaBolumu key={a.no} a={a} durumListesi={tum.filter((d) => d.yer === a.no)} adOf={adOf} sablonOf={sablonOf} />
        ))}

        <section className="ob-her-an" id="her-an" aria-labelledby="her-an-baslik">
          <h2 className="ob-bolum-baslik" id="her-an-baslik">
            Her aşamada olabilecek durumlar
          </h2>
          <p className="ob-her-an-not">Bu durumlar herhangi bir aşamada olabilir. Akış kaydı kapatmıyorsa, bitince kaldığınız aşamaya dönün.</p>
          <ul className="ob-durumlar">
            {herAn.map((d) => (
              <DurumKarti key={d.id} d={d} adOf={adOf} sablon={sablonOf(d.sablon)} />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}

export function OnboardingPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
