import { useState } from 'react';
import { flushSync } from 'react-dom';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { Choice, Section } from '../components/ui';
import {
  ARASTIRMA_NOTU,
  HAZIRLIK_ADI,
  HAZIRLIK_TANIMI,
  KISALTMALAR,
  MODELLER,
  ONCELIK_NOTU,
  ONCELIK_ONERISI,
  eur,
  paketler,
  type GelirModeli,
  type Hazirlik,
} from '../data/gelirModelleri';

/**
 * Gelir modelleri (kullanıcı kararı 2026-11-03): bugünkü abonelik paketleri → araştırma notu → aday gelir modelleri
 * (hazırlık süzgeciyle) → öncelik önerisi → kısaltmalar. Kartlar kenarlıksız, yüzey tonu ve boşlukla ayrılır.
 */

type Suzgec = 'hepsi' | Hazirlik;
const DURUMLAR: Hazirlik[] = ['hazir', 'yakinda', 'hazir-degil'];

function ModelKarti({ m }: { m: GelirModeli }) {
  return (
    <li className="gm-model" id={`model-${m.id}`}>
      <div className="gm-model-ust">
        <h3 className="gm-model-ad">{m.ad}</h3>
        <span className="gm-hazirlik" data-durum={m.hazirlik}>
          {HAZIRLIK_ADI[m.hazirlik]}
        </span>
        <span className="gm-oncelik">Öncelik {m.oncelik}</span>
      </div>
      <p className="gm-nasil">{m.nasil}</p>
      <div className="gm-ornek">
        <p className="gm-ornek-ad">Örnek hesap (varsayımdır, söz değildir)</p>
        <p className="gm-ornek-metin">{m.ornek}</p>
      </div>
      <dl className="gm-bilgi">
        <div>
          <dt>Kim öder?</dt>
          <dd>{m.kimOder}</dd>
        </div>
        <div>
          <dt>istoc.com’a uygunluk</dt>
          <dd>{m.uygunluk}</dd>
        </div>
        <div>
          <dt>Risk</dt>
          <dd>{m.risk}</dd>
        </div>
        <div>
          <dt>Başlamak için ne gerekir?</dt>
          <dd>{m.gereken}</dd>
        </div>
      </dl>
    </li>
  );
}

function Icerik() {
  const { params } = useModel();
  const [suzgec, setSuzgec] = useState<Suzgec>('hepsi');
  const gorunen = suzgec === 'hepsi' ? MODELLER : MODELLER.filter((m) => m.hazirlik === suzgec);
  const sayi = (h: Hazirlik) => MODELLER.filter((m) => m.hazirlik === h).length;
  const secenekler = [
    { id: 'hepsi' as Suzgec, name: `Hepsi (${MODELLER.length})` },
    ...DURUMLAR.map((h) => ({ id: h as Suzgec, name: `${HAZIRLIK_ADI[h]} (${sayi(h)})` })),
  ];
  const adOf = (id: string) => MODELLER.find((m) => m.id === id)!.ad;

  return (
    <>
      <PageHeader title="Gelir modelleri" purpose="istoc.com’un bugünkü abonelik gelirini ve buna eklenebilecek gelir modellerini hazırlık durumlarıyla birlikte gösterir." />
      <div className="gm">
        <p className="gm-uyari">
          istoc.com, İstoç çarşısı esnafı için bir B2B (işletmeden işletmeye) toptan pazar yeridir. Bugün tek gelir modeli aboneliktir. Aşağıdaki örnek hesaplar yöntemi göstermek için kurulmuş varsayımlardır, gelir sözü ya da hedef değildir. İhracat hizmetleri hazır değildir ve esnafa sunulmamalıdır.
        </p>

        <Section id="bugunku-model" title="Bugünkü model: abonelik" desc={`Satıcı üç paketten birini seçer. Yıllık pakette ${params.annualMonths} ayın ücreti ödenir.`}>
          <ul className="gm-paketler">
            {paketler(params).map((p) => (
              <li key={p.id} className="gm-paket" data-paket={p.id}>
                <p className="gm-paket-ad">{p.ad}</p>
                <p className="gm-paket-tutar">
                  <span className="gm-paket-fiyat">{p.aylikEur === null ? 'Teklif' : eur(p.aylikEur)}</span>
                  {p.aylikEur === null ? null : <span className="gm-paket-birim">aylık</span>}
                </p>
                {p.yillikEur === null ? null : <p className="gm-paket-yillik">Yıllık {eur(p.yillikEur)}</p>}
                <p className="gm-paket-not">{p.not}</p>
              </li>
            ))}
          </ul>
        </Section>

        <Section id="arastirma-notu" title="Araştırma notu">
          <div className="gm-arastirma">
            {ARASTIRMA_NOTU.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        </Section>

        <Section
          id="aday-modeller"
          title="Aday gelir modelleri"
          desc={`${MODELLER.length} model, bir B2B toptan pazar yerine abonelikten sonra eklenebilecek gelir yollarını gösterir. Çoğu bugün hazır değildir.`}
          tools={
            <div className="gm-araclar">
              <Choice label="Hazırlık durumu" value={suzgec} options={secenekler} onChange={setSuzgec} />
              <dl className="gm-tanim">
                {DURUMLAR.map((h) => (
                  <div key={h}>
                    <dt>{HAZIRLIK_ADI[h]}</dt>
                    <dd>{HAZIRLIK_TANIMI[h]}</dd>
                  </div>
                ))}
              </dl>
              <p className="gm-sayac" role="status" aria-live="polite">
                {gorunen.length} model gösteriliyor.
              </p>
            </div>
          }
        >
          <ol className="gm-modeller">
            {gorunen.map((m) => (
              <ModelKarti key={m.id} m={m} />
            ))}
          </ol>
        </Section>

        <Section id="oncelik-onerisi" title="Öncelik önerisi" desc="İlk denenecek üç model, en az hazırlık isteyenden başlayarak sıralandı.">
          <ol className="gm-oncelik-liste">
            {ONCELIK_ONERISI.map((o, i) => (
              <li key={o.id} className="gm-oncelik-oge">
                <span className="gm-oncelik-no" aria-hidden="true">
                  {i + 1}
                </span>
                <div>
                  <p className="gm-oncelik-ad">
                    <a
                      href={`#model-${o.id}`}
                      onClick={() => {
                        // Süzgeç kartı gizliyorsa önce hepsini göster ki bağlantının hedefi sayfada olsun.
                        if (suzgec !== 'hepsi') flushSync(() => setSuzgec('hepsi'));
                      }}
                    >
                      {adOf(o.id)}
                    </a>
                  </p>
                  <p className="gm-oncelik-neden">{o.neden}</p>
                </div>
              </li>
            ))}
          </ol>
          <p className="gm-not">{ONCELIK_NOTU}</p>
        </Section>

        <Section id="kisaltmalar" title="Kısaltmalar">
          <dl className="gm-kisaltmalar">
            {KISALTMALAR.map((k) => (
              <div key={k.kisa}>
                <dt>{k.kisa}</dt>
                <dd>{k.acik}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  );
}

export function GelirModelleriPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
