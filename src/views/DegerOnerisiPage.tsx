import { Alinti } from '../components/Alinti';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { BolumDizini, Section } from '../components/ui';
import { BASLANGIC_NOTU, ESKI_SOZLER, GUCLU_SOZLER, ILK_30_SANIYE, ILK_GUN_ADI, KATEGORILER, KISALTMALAR, ORTAK_NOKTA, type Oneri } from '../data/degerOnerisi';

/**
 * Değer önerisi (kullanıcı kararı 2026-11-03): saha ekibinin esnafa söyleyeceği sözler alt alta, alıntı olarak.
 * Sıra: en güçlü sözler → kapıda ilk 30 saniye → kategorilere göre öneriler → eski sözlerin güçlü hali → kısaltmalar.
 */

const iki = (n: number) => String(n).padStart(2, '0');

const ICINDEKILER = [
  { id: 'en-guclu', baslik: `En güçlü ${GUCLU_SOZLER.length} söz` },
  { id: 'ilk-30-saniye', baslik: 'Kapıda ilk 30 saniye' },
  { id: 'butun-oneriler', baslik: 'Bütün öneriler' },
  { id: 'eski-sozler', baslik: 'Eski sözlerin güçlü hâli' },
  { id: 'kisaltmalar', baslik: 'Kısaltmalar' },
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
          <dd>{o.dayanak === 'Öneri' ? 'Dış kaynak yok. Bu bir öneridir.' : o.dayanak}</dd>
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
      <PageHeader title="Değer önerisi" purpose="Saha ekibinin esnafa vereceği sözleri ve her söz için platformun yapacağı işi gösterir." />

      <p className="dg-uyari">
        Bu sözlerin çoğu henüz istoc.com’da çalışan bir hizmet değildir. Bunlar geliştirilmesi gereken önerilerdir. Esnafa söz vermeden önce hizmetin hazır olduğunu doğrulayın.
      </p>

      <BolumDizini bolumler={ICINDEKILER} />

      <Section id="en-guclu" title={`En güçlü ${GUCLU_SOZLER.length} söz`} desc="Bu sözlerin çoğu bugün tutulamaz. Saha ekibi bir sözü yalnız hizmet hazırsa kullanır." dizin>
        <ol className="dg-guclu-liste">
          {GUCLU_SOZLER.map((s, i) => (
            <li key={s.baslik} className="dg-guclu">
              <span className="dg-guclu-no" aria-hidden="true">
                {iki(i + 1)}
              </span>
              <div className="dg-guclu-govde">
                <h3 className="dg-guclu-baslik">{s.baslik}</h3>
                <Alinti>{s.soz}</Alinti>
                <dl className="dg-guclu-taraf">
                  <dt>Güçlü tarafı</dt>
                  <dd>{s.gucluTarafi}</dd>
                </dl>
              </div>
            </li>
          ))}
        </ol>
        <div className="dg-ortak">
          <p className="dg-ortak-ad">Bu sözlerin ortak noktası</p>
          <Alinti boyut="buyuk">{ORTAK_NOKTA}</Alinti>
        </div>
      </Section>

      <Section id="ilk-30-saniye" title="Kapıda ilk 30 saniye" desc="Bu sıra, esnafın en çok yaşadığı sıkıntılara ve ilk günden verilebilen hizmetlere göre kuruldu." dizin>
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
      </Section>

      <Section id="butun-oneriler" title="Bütün öneriler" desc={`${KATEGORILER.reduce((n, k) => n + k.oneriler.length, 0)} öneri ${KATEGORILER.length} başlıkta toplandı.`} dizin>
        <p className="dg-bolum-giris">“Kime söylenir?” satırındaki P1 ile P7 arasındaki kodlar, araştırma raporundaki esnaf tiplerini gösterir. Bu tiplerin tanımları sayfaya henüz eklenmedi.</p>
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
      </Section>

      <Section id="eski-sozler" title="Eski sözlerin güçlü hâli" desc="Bu bölüm, tutulamayacak iki sözün yerine tutulabilecek iki söz önerir." dizin>
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
      </Section>

      <Section id="kisaltmalar" title="Kısaltmalar" desc="Bu bölüm sayfada geçen kısaltmaların açık adını verir." dizin>
        <dl className="dg-kisaltmalar">
          {KISALTMALAR.map((k) => (
            <div key={k.kisa}>
              <dt>{k.kisa}</dt>
              <dd>{k.acik}</dd>
            </div>
          ))}
        </dl>
      </Section>
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
