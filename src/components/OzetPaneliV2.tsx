/* v2 (2026-11-03): satış ortaklığı v2 sayfasının özet sütunu. Yalnız v2 modüllerini kullanır, v1'i etkilemez. */
import { Canli } from './sadeKitV2';
import {
  KARIYER_ADI,
  SEGMENT_ADI,
  SEVIYE_ADI,
  SOZLESME_ADI,
  bagimsizKazanc,
  kadroluKazanc,
  musteriKazanc,
  rolMetinleri,
  satisOzeti,
  type Ayar,
  type RolId,
  type RolMetni,
} from '../data/satisOrtakligiV2';
import { kosulSonucu, seciliKosul } from '../data/kosullarV2';
import { personaOzeti, segmentDurumu } from '../data/ozetV2';
import '../styles/ozetPaneliV2.css';

/**
 * Özet paneli (kullanıcı kararı 2026-11-03): seçimleri ve ana sonuçları tek bakışta gösteren, salt okunur sütun.
 * Sayılar ve cümleler SatisOrtakligiV2.tsx ile aynı hesaptan gelir (personaOzeti, BagimsizSonuc, KadroluSonuc,
 * MusteriSonuc, segmentDurumu). Yapışma ve yerleşim sayfanın işidir. Bu bileşen yalnız içeriği verir.
 */

const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);

interface Satir {
  ad: string;
  deger: string;
  kapali?: boolean;
  ayri?: boolean;
}

/** Seçili personanın büyük sonucu, yıllık karşılığı ve kırılımı. */
function sonucVerisi(a: Ayar, secili: RolMetni, rol: RolId) {
  const ozet = personaOzeti(a, secili);
  const ks = kosulSonucu(a, rol);
  if (ks)
    return {
      etiket: ks.etiket,
      ozet,
      ek: 'Bu özel program standart programın yerine geçer.',
      satirlar: ks.donemler.slice(0, 4).map((d): Satir => ({ ad: d.ad, deger: `${tl(d.yillik)} / yıl` })),
    };
  if (secili.sozlesme === 'kadrolu') {
    const k = kadroluKazanc(a);
    return {
      etiket: `Bu ayki kazanç (${KARIYER_ADI[k.sg.seviye]})`,
      ozet,
      ek: `Yılda ${tl(k.toplam * 12)} eder.`,
      satirlar: [
        { ad: 'Maaş', deger: tl(k.maas) },
        { ad: 'Kota üstü prim', deger: tl(k.prim), kapali: k.prim === 0 },
        { ad: 'Ekip payı', deger: tl(k.ekip), kapali: k.ekip === 0 },
      ] as Satir[],
    };
  }
  if (secili.sozlesme === 'musteri') {
    const m = musteriKazanc(a);
    return {
      etiket: 'Yıllık ücretsiz kullanımın değeri',
      ozet,
      ek: `Ayda ortalama ${tl(m.yillikKredi / 12)} değerinde ücretsiz kullanım eder.`,
      satirlar: [
        { ad: 'Hakediş için tahsilat süresi', deger: `${m.sureGun} gün` },
        { ad: 'Ödül kazandıran tavsiye', deger: `${sayi(m.sayilan)} / yıl`, kapali: m.sayilan === 0 },
        { ad: 'Ortak olursa satış komisyonu', deger: `${tl(m.ortakOlursa.satisKazanci)} / ay` },
      ] as Satir[],
    };
  }
  const b = bagimsizKazanc(a);
  return {
    etiket: `Aylık kazanç (${SEGMENT_ADI[b.sg.seviye]})`,
    ozet,
    ek: `Yılda ${tl(b.aylik * 12)} eder.`,
    satirlar: [
      { ad: 'Satış komisyonu', deger: tl(b.komisyon), kapali: b.komisyon === 0 },
      ...(b.kurumsal > 0 ? [{ ad: 'Enterprise paket kampanyası', deger: tl(b.kurumsal) }] : []),
      { ad: 'Ağ, 1. kademe', deger: tl(b.k1), kapali: !b.k1Acik },
      { ad: 'Ağ, 2. kademe', deger: tl(b.k2), kapali: !b.k2Acik },
      { ad: 'Bize kalan, en az', deger: tl(b.bize), ayri: true },
    ] as Satir[],
  };
}

export function OzetPaneli({ a, rol, onKosullar }: { a: Ayar; rol: RolId; onKosullar: (acan: HTMLElement) => void }) {
  const roller = rolMetinleri(a.marka);
  const secili = roller.find((r) => r.id === rol) ?? roller[0];
  const s = satisOzeti(a);
  const program = seciliKosul(a, rol);
  const ozelVar = kosulSonucu(a, rol) !== null;
  const sonuc = sonucVerisi(a, secili, rol);
  const tur = secili.sozlesme === 'musteri' ? null : secili.sozlesme;
  const sg = tur === 'kadrolu' ? kadroluKazanc(a).sg : tur === 'bagimsiz' ? bagimsizKazanc(a).sg : null;
  const segment = sg === null ? 'Segment yok' : tur === 'kadrolu' ? KARIYER_ADI[sg.seviye] : SEGMENT_ADI[sg.seviye];
  const sonrakiAdim = tur && sg && !ozelVar ? segmentDurumu(sg, tur) : null;
  const dagilim = s.paketler.map((p) => `${sayi(p.adet)} ${p.ad}`).join(', ');
  return (
    <aside className="v2-oz" aria-label="Özet">
      <h2 className="v2-oz-baslik">Özet</h2>

      <section className="v2-oz-bolum" aria-labelledby="v2-oz-secimler">
        <h3 className="v2-oz-alt" id="v2-oz-secimler">
          Seçimler
        </h3>
        <dl className="v2-oz-liste">
          <div className="v2-oz-satir">
            <dt>Ürün</dt>
            <dd>{a.marka === 'istoc' ? 'iStoc' : 'Segika'}</dd>
          </div>
          <div className="v2-oz-satir">
            <dt>Müşteri öder</dt>
            <dd>{a.faturalama === 'yillik' ? 'Yıllık paket' : 'Aylık abonelik'}</dd>
          </div>
          <div className="v2-oz-satir">
            <dt>Persona</dt>
            <dd>
              {secili.ad}
              <span className="v2-oz-ek">{SOZLESME_ADI[secili.sozlesme]}</span>
            </dd>
          </div>
          <div className="v2-oz-satir">
            <dt>Satıştaki katkı</dt>
            <dd>{SEVIYE_ADI[a.katki]}</dd>
          </div>
          <div className="v2-oz-satir">
            <dt>{tur === 'kadrolu' ? 'Kariyer basamağı' : 'Segment'}</dt>
            <dd>
              <Canli deger={segment}>{segment}</Canli>
            </dd>
          </div>
          {program.id !== 'ana' ? (
            <div className="v2-oz-satir">
              <dt>Özel program</dt>
              <dd>{program.ad}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <section className="v2-oz-bolum" aria-labelledby="v2-oz-satis">
        <h3 className="v2-oz-alt" id="v2-oz-satis">
          Satış
        </h3>
        <dl className="v2-oz-liste">
          <div className="v2-oz-satir">
            <dt>Aylık yeni müşteri</dt>
            <dd className="v2-oz-sayi">
              <Canli deger={s.adet}>{sayi(s.adet)}</Canli>
            </dd>
          </div>
          <div className="v2-oz-satir">
            <dt>Bu ayki satışların tutarı</dt>
            <dd className="v2-oz-sayi">
              <Canli deger={s.ciro}>{tl(s.ciro)}</Canli>
            </dd>
          </div>
        </dl>
        <p className="v2-oz-not">
          <Canli deger={dagilim}>{dagilim}</Canli>
        </p>
      </section>

      <section className="v2-oz-bolum v2-oz-sonuc" aria-labelledby="v2-oz-sonuc">
        <h3 className="v2-oz-alt" id="v2-oz-sonuc">
          Sonuç: {secili.ad}
        </h3>
        <p className="v2-oz-etiket">{sonuc.etiket}</p>
        <p className="v2-oz-deger">
          <Canli deger={sonuc.ozet.deger}>{sonuc.ozet.deger}</Canli>
          {sonuc.ozet.birim ? <span className="v2-oz-birim">{sonuc.ozet.birim}</span> : null}
        </p>
        <p className="v2-oz-not">
          <Canli deger={sonuc.ek}>{sonuc.ek}</Canli>
        </p>
        {sonuc.satirlar.length ? (
          <dl className="v2-oz-liste v2-oz-kirilim">
            {sonuc.satirlar.map((r) => (
              <div key={r.ad} className="v2-oz-satir" data-kapali={r.kapali ? '' : undefined} data-ayri={r.ayri ? '' : undefined}>
                <dt>{r.ad}</dt>
                <dd className="v2-oz-sayi">
                  <Canli deger={r.deger}>{r.deger}</Canli>
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </section>

      {sonrakiAdim ? (
        <section className="v2-oz-bolum" aria-labelledby="v2-oz-adim">
          <h3 className="v2-oz-alt" id="v2-oz-adim">
            Sonraki adım
          </h3>
          <p className="v2-oz-adim">
            <Canli deger={sonrakiAdim}>{sonrakiAdim}</Canli>
          </p>
          <button type="button" className="v2-oz-dugme" aria-haspopup="dialog" onClick={(e) => onKosullar(e.currentTarget)}>
            Bütün koşulları gör
          </button>
        </section>
      ) : null}

      <section className="v2-oz-bolum" aria-labelledby="v2-oz-personalar">
        <h3 className="v2-oz-alt" id="v2-oz-personalar">
          Bütün personalar
        </h3>
        <ul className="v2-oz-personalar">
          {roller.map((r) => {
            const o = personaOzeti(a, r);
            const bu = r.id === secili.id;
            return (
              <li key={r.id} className="v2-oz-persona" aria-current={bu ? 'true' : undefined}>
                <span className="v2-oz-persona-ad">{r.ad}</span>
                <span className="v2-oz-persona-tutar">
                  <Canli deger={o.deger}>{o.deger}</Canli>
                  {o.birim ? <span className="v2-oz-birim">{o.birim}</span> : null}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </aside>
  );
}
