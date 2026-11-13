import { useEffect, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { Section } from '../components/ui';
import { ASAMALAR, BEKLEME_NOTU, HER_DURUMDA, KAPANIS_DURUMLARI, durumlar, sablonlar, ve, type Adim, type Asama, type Cikis, type Durum, type Sablon } from '../data/onboarding';
import '../styles/onboarding.css';

/**
 * Yeni kayıt adımları (kullanıcı kararları 2026-11-10): CRM masası sorumlusu için. Sıra: giriş cümlesi → aşama
 * haritası (dört aşama ve sürecin sonu) → her durumda geçerli kurallar → aşamalar → her aşamada olabilen durumlar.
 * Sayfa iskeleti (13 Kasım 2026): bu dört parça ortak `Section` kalıbındadır (h2, kısa açıklama). Aşama başlıkları
 * “Aşamalar adım adım” bölümünün içinde h3 olur. Numaralı aşama başlığı, çizgi ve Başlar / Biter kutuları değişmez.
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

/**
 * Tutar ile para birimi, gün sırası ile “gün” sözü aynı satırda kalır (“3.990 €”, “5. güne” bölünmez). Yalnız ekrandaki
 * metne uygulanır, panoya giden metne değil.
 */
const tutarBitisik = (s: string) => s.replace(/(\d) ([€₺])/g, '$1\u00a0$2').replace(/(\d\.) (gün)/g, '$1\u00a0$2');

function AdimMetni({ a, adOf }: { a: Adim; adOf: (id: string) => string }) {
  if (typeof a === 'string') return <>{tutarBitisik(a)}</>;
  return (
    <>
      {tutarBitisik(a.metin)}
      <a className="text-link ob-git" href={`#${durumId(a.git)}`} onClick={() => durumuAc(a.git)}>
        {tutarBitisik(adOf(a.git))}
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
      <p className="ob-etiket">Bu durumda “{s.ad}” hazır metnini kullanın.</p>
      {s.konu ? <p className="ob-sablon-konu">Konu: {s.konu}</p> : null}
      <p className="ob-sablon-metin">{tutarBitisik(s.metin)}</p>
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
          <span className="ob-durum-ad">{tutarBitisik(d.ad)}</span>
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
            <span className="ob-etiket">Kayıt kartında</span>
            {tutarBitisik(d.kart)}
          </p>
          {sablon ? <HazirMetin s={sablon} /> : null}
        </div>
      </details>
    </li>
  );
}

const SAYI_ADI: Record<number, string> = { 1: 'bir', 2: 'iki', 3: 'üç', 4: 'dört' };

/** Aşamanın bir sonunu tek cümle olarak yazar: “Satıcı vazgeçerse kayıt kapanır.” */
const cikisCumlesi = (c: Cikis) => `${c.kosul} ${c.sonuc}.`;

function AsamaHaritasi() {
  return (
    <nav className="ob-harita" aria-label="Aşama haritası">
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
              <span className="ob-harita-satir">{tutarBitisik(a.gun)}</span>
              <span className="ob-harita-satir">Bu aşama boyunca kayıt kartında durum “{a.kartDurumu}” kalır.</span>
              <span className="ob-harita-satir ob-harita-biter">{cikisCumlesi(a.cikislar[0])}</span>
              {a.cikislar.slice(1).map((c) => (
                <span key={c.kosul} className="ob-harita-satir">
                  {cikisCumlesi(c)}
                </span>
              ))}
            </a>
          </li>
        ))}
        <li className="ob-harita-oge" data-son="">
          <div className="ob-harita-bag">
            <span className="ob-harita-no" aria-hidden="true">
              ✓
            </span>
            <span className="ob-harita-ad">Süreç biter</span>
            <span className="ob-harita-satir">
              Süreç bitince kayıt kartındaki durum {ve(KAPANIS_DURUMLARI.map((d) => `“${d}”`), 'ya da')} olur.
            </span>
            <span className="ob-harita-satir">{BEKLEME_NOTU}</span>
          </div>
        </li>
      </ol>
      <p className="ob-harita-not">
        Fiyat sorusu gibi, hangi aşamada olursa olsun çıkabilecek durumlar sayfanın sonundadır:{' '}
        <a className="text-link" href="#her-an">
          Herhangi bir aşamada çıkabilecek durumlar
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
          <h3 className="ob-asama-ad" id={`${asamaId(a.no)}-baslik`}>
            Aşama {a.no}: {a.ad}
          </h3>
          <p className="ob-asama-gun">{tutarBitisik(a.gun)}</p>
        </div>
      </header>
      <div className="ob-asama-govde">
        <div className="ob-sinir" data-tur="baslar">
          <h4 className="ob-sinir-etiket">Başlar</h4>
          <p>{a.baslar} başlar.</p>
          <p>Bu aşama boyunca kayıt kartında durum “{a.kartDurumu}” kalır.</p>
        </div>
        <h4 className="ob-durumlar-baslik">Bu aşamada karşılaşacağınız durumlar</h4>
        <ul className="ob-durumlar">
          {durumListesi.map((d, i) => (
            <DurumKarti key={d.id} d={d} no={`${a.no}.${i + 1}`} adOf={adOf} sablon={sablonOf(d.sablon)} />
          ))}
        </ul>
        <div className="ob-sinir" data-tur="biter">
          <h4 className="ob-sinir-etiket">Biter</h4>
          <p>Bu aşama {SAYI_ADI[a.cikislar.length] ?? a.cikislar.length} şekilde bitebilir.</p>
          <ul className="ob-cikislar">
            {a.cikislar.map((c) => (
              <li key={c.kosul} className="ob-cikis">
                <p className="ob-cikis-kosul">{cikisCumlesi(c)}</p>
                <p>Kayıt kartında durumu “{c.kart}” yapın.</p>
                {c.git ? (
                  <p className="ob-cikis-sonra">
                    Sonra şu aşama başlar:
                    <a className="text-link ob-sonra-bag" href={`#${asamaId(c.git)}`}>
                      Aşama {c.git}: {adi(c.git)}
                    </a>
                  </p>
                ) : c.durum ? (
                  <p className="ob-cikis-sonra">
                    {c.sonra ?? 'Sonra şu duruma geçin:'}
                    <a className="text-link ob-git" href={`#${durumId(c.durum)}`} onClick={() => durumuAc(c.durum!)}>
                      {tutarBitisik(adOf(c.durum))}
                    </a>
                  </p>
                ) : c.sonra ? (
                  <p className="ob-cikis-sonra">{c.sonra}</p>
                ) : null}
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
      <PageHeader title="Yeni kayıt gelince ne yapılır?" purpose="Yeni kaydolan satıcıyla karşılaştığınız her durumda ne yapacağınızı adım adım gösterir." />
      <div className="ob-sayfa">
        <p className="ob-giris">
          Bu sayfa, istoc.com’a yeni kaydolan bir satıcıyı ilk günden ücretli pakete kadar nasıl takip edeceğinizi gösterir. Süreç dört aşamadan oluşur. Satıcının hangi aşamada olduğunu, CRM (müşteri ilişkileri yönetimi) programındaki kayıt kartında yazan durumdan anlarsınız. Bir aşama bitince kayıt kartındaki durumu siz değiştirirsiniz. Yeni durum, kaydın hangi aşamaya geçtiğini gösterir.
        </p>

        <Section id="asamalar" title="Aşamalar" desc="Her kart bir aşamayı ve aşamanın nasıl bittiğini gösterir.">
          <AsamaHaritasi />
        </Section>

        <Section id="kurallar" title="Her zaman geçerli kurallar" desc="Bu kurallar her aşamada geçerlidir.">
          <ul className="ob-kurallar-liste">
            {HER_DURUMDA.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        </Section>

        <Section id="asama-ayrintisi" title="Aşamalar adım adım" desc="Her aşama “Başlar” kutusuyla açılır ve “Biter” kutusuyla kapanır.">
          <div className="ob-asamalar">
            {ASAMALAR.map((a) => (
              <AsamaBolumu key={a.no} a={a} durumListesi={tum.filter((d) => d.yer === a.no)} adOf={adOf} sablonOf={sablonOf} />
            ))}
          </div>
        </Section>

        <Section id="her-an" title="Herhangi bir aşamada çıkabilecek durumlar" desc="Bu durumlar sürecin herhangi bir yerinde çıkabilir. Adımları bitirdikten sonra kayıt kapanmadıysa kaldığınız aşamadan devam edin.">
          <ul className="ob-durumlar ob-her-an-liste">
            {herAn.map((d) => (
              <DurumKarti key={d.id} d={d} adOf={adOf} sablon={sablonOf(d.sablon)} />
            ))}
          </ul>
        </Section>
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
