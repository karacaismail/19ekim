import { Alinti } from '../components/Alinti';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { BASLANGIC_NOTU, ESKI_SOZLER, GUCLU_SOZLER, ILK_30_SANIYE, ILK_GUN_ADI, KATEGORILER, KISALTMALAR, ORTAK_NOKTA, type Oneri } from '../data/degerOnerisi';

/**
 * Değer önerisi (kullanıcı kararı 2026-11-03): saha ekibinin esnafa söyleyeceği sözler alt alta, alıntı olarak.
 * Sıra: en güçlü sözler → kapıda ilk 30 saniye → kategorilere göre 35 öneri → eski sözlerin güçlü hali → kısaltmalar.
 */

const iki = (n: number) => String(n).padStart(2, '0');

const ICINDEKILER = [
  { id: 'en-guclu', ad: `En güçlü ${GUCLU_SOZLER.length} söz` },
  { id: 'ilk-30-saniye', ad: 'Kapıda ilk 30 saniye' },
  ...KATEGORILER.map((k) => ({ id: k.id, ad: k.ad })),
  { id: 'eski-sozler', ad: 'Eski sözlerin güçlü hâli' },
  { id: 'kisaltmalar', ad: 'Kısaltmalar' },
];

function OneriKarti({ o }: { o: Oneri }) {
  return (
    <li className="dg-oneri" id={`oneri-${o.no}`}>
      <div className="dg-oneri-ust">
        <span className="dg-oneri-no">Öneri {o.no}</span>
        <span className="dg-rozet" data-durum={o.ilkGun}>
          {ILK_GUN_ADI[o.ilkGun]}
        </span>
      </div>
      <p className="dg-sikinti">{o.sikinti}</p>
      <Alinti>{o.soz}</Alinti>
      <dl className="dg-bilgi">
        <div className="dg-bilgi-genis">
          <dt>Platform ne yapmalı?</dt>
          <dd>{o.platform}</dd>
        </div>
        <div>
          <dt>Maliyet ve risk</dt>
          <dd>{o.risk}</dd>
        </div>
        <div>
          <dt>Dayanak</dt>
          <dd>{o.dayanak}</dd>
        </div>
        <div className="dg-bilgi-genis">
          <dt>Kime söylenir?</dt>
          <dd>
            <ul className="dg-persona">
              {o.persona.map((p) => (
                <li key={p}>{p === 'Hepsi' ? 'Bütün esnaf' : p}</li>
              ))}
            </ul>
          </dd>
        </div>
      </dl>
    </li>
  );
}

function Icerik() {
  return (
    <div className="dg">
      <PageHeader title="Değer önerisi" purpose="Saha ekibinin esnafa söyleyeceği sözleri ve her sözü tutmak için platformun yapması gereken işi gösterir." />

      <p className="dg-uyari">
        Bu sözlerin çoğu henüz istoc.com’da çalışan bir hizmet değildir. Bunlar geliştirilmesi gereken önerilerdir. Esnafa söz vermeden önce hizmetin hazır olduğunu doğrulayın.
      </p>

      <nav className="dg-icindekiler" aria-label="Sayfa bölümleri">
        <ol>
          {ICINDEKILER.map((b) => (
            <li key={b.id}>
              <a href={`#${b.id}`}>{b.ad}</a>
            </li>
          ))}
        </ol>
      </nav>

      <section className="dg-bolum" id="en-guclu" aria-labelledby="en-guclu-baslik">
        <header className="dg-bolum-ust">
          <h2 id="en-guclu-baslik" className="dg-bolum-baslik">
            En güçlü {GUCLU_SOZLER.length} söz
          </h2>
          <p className="dg-bolum-giris">Saha ekibi ilk görüşmede bu sözlerle başlar.</p>
        </header>
        <ol className="dg-guclu-liste">
          {GUCLU_SOZLER.map((s, i) => (
            <li key={s.baslik} className="dg-guclu">
              <span className="dg-guclu-no" aria-hidden="true">
                {iki(i + 1)}
              </span>
              <div className="dg-guclu-govde">
                <h3 className="dg-guclu-baslik">{s.baslik}</h3>
                <Alinti>{s.soz}</Alinti>
                <p className="dg-guclu-taraf">
                  <strong>Güçlü tarafı:</strong> {s.gucluTarafi}
                </p>
              </div>
            </li>
          ))}
        </ol>
        <div className="dg-ortak">
          <p className="dg-ortak-ad">Bu sözlerin ortak noktası</p>
          <Alinti boyut="buyuk">{ORTAK_NOKTA}</Alinti>
        </div>
      </section>

      <section className="dg-bolum" id="ilk-30-saniye" aria-labelledby="ilk-30-saniye-baslik">
        <header className="dg-bolum-ust">
          <h2 id="ilk-30-saniye-baslik" className="dg-bolum-baslik">
            Kapıda ilk 30 saniye
          </h2>
          <p className="dg-bolum-giris">Bu sıra, esnafın en çok yaşadığı sıkıntılara ve ilk günden verilebilen hizmetlere göre kuruldu.</p>
        </header>
        <ol className="dg-adimlar">
          {ILK_30_SANIYE.map((a, i) => (
            <li key={a.ad} className="dg-adim">
              <span className="dg-adim-no" aria-hidden="true">
                {i + 1}
              </span>
              <div className="dg-adim-govde">
                <p className="dg-adim-ad">
                  {a.ad}
                  <span className="dg-adim-bag">
                    {a.oneriler.map((n, j) => (
                      <span key={n}>
                        {j ? ', ' : ''}
                        <a href={`#oneri-${n}`}>Öneri {n}</a>
                      </span>
                    ))}
                  </span>
                </p>
                <Alinti>{a.soz}</Alinti>
              </div>
            </li>
          ))}
        </ol>
        <p className="dg-not">
          <strong>Hangisiyle başlanır?</strong> {BASLANGIC_NOTU}
        </p>
      </section>

      <div className="dg-katalog-ust">
        <h2 className="dg-katalog-baslik">Bütün öneriler</h2>
        <p className="dg-bolum-giris">
          35 öneri yedi başlıkta toplandı. “Kime söylenir?” satırındaki P1 ile P7 arasındaki kodlar, araştırma raporundaki esnaf tiplerini gösterir. Bu tiplerin tanımları sayfaya henüz eklenmedi.
        </p>
      </div>

      {KATEGORILER.map((k) => (
        <section key={k.id} className="dg-bolum dg-kategori" id={k.id} aria-labelledby={`${k.id}-baslik`}>
          <header className="dg-bolum-ust">
            <span className="dg-harf" aria-hidden="true">
              {k.harf}
            </span>
            <h3 id={`${k.id}-baslik`} className="dg-bolum-baslik">
              {k.ad}
            </h3>
            <p className="dg-bolum-sayi">{k.oneriler.length} öneri</p>
            {k.giris ? <p className="dg-bolum-giris">{k.giris}</p> : null}
          </header>
          <ol className="dg-oneriler">
            {k.oneriler.map((o) => (
              <OneriKarti key={o.no} o={o} />
            ))}
          </ol>
        </section>
      ))}

      <section className="dg-bolum" id="eski-sozler" aria-labelledby="eski-sozler-baslik">
        <header className="dg-bolum-ust">
          <h2 id="eski-sozler-baslik" className="dg-bolum-baslik">
            Eski sözlerin güçlü hâli
          </h2>
          <p className="dg-bolum-giris">Bu bölüm, tutulamayacak iki sözün yerine tutulabilecek iki söz önerir.</p>
        </header>
        <ol className="dg-eskiler">
          {ESKI_SOZLER.map((e) => (
            <li key={e.eski} className="dg-eski">
              <p className="dg-eski-ad">Eski söz</p>
              <p className="dg-eski-metin">
                <s>{e.eski}</s>
              </p>
              <p className="dg-eski-ad">Yerine söylenecek söz</p>
              <Alinti kaynak={e.not}>{e.yeni}</Alinti>
              <p className="dg-guclu-taraf">
                <strong>Neden daha iyi?</strong> {e.neden}
              </p>
            </li>
          ))}
        </ol>
      </section>

      <section className="dg-bolum" id="kisaltmalar" aria-labelledby="kisaltmalar-baslik">
        <header className="dg-bolum-ust">
          <h2 id="kisaltmalar-baslik" className="dg-bolum-baslik">
            Kısaltmalar
          </h2>
        </header>
        <dl className="dg-kisaltmalar">
          {KISALTMALAR.map((k) => (
            <div key={k.kisa}>
              <dt>{k.kisa}</dt>
              <dd>{k.acik}</dd>
            </div>
          ))}
        </dl>
      </section>
    </div>
  );
}

export function DegerOnerisiPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
