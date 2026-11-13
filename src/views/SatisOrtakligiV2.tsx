/**
 * Satış ortaklığı v2 (kullanıcı kararları 2026-11-03): v1’in (SatisOrtakligiPage.tsx) yerine geçmeyen, ondan bağımsız
 * gelişen sürüm. v2 yalnız *V2 dosyalarını kullanır: data/satisOrtakligiV2, kosullarV2, affilateV2, affilateKurguV2,
 * components/sadeKitV2, AgDiyagramiV2, AffilateMotoruV2 ve styles/satisOrtakligiV2.css (v2- önekli sınıflar).
 *
 * Kullanıcı yolculuğu: persona seçilir (kim?) → solda herkes için aynı fiyatlandırma robotu ve standart koşullar
 * (ne satar, nasıl katkı verir?) → sağda kazanç, segment merdiveni (nasıl yükselir?), kampanyalar, ağ, dönemler ve hesap.
 * Personaya özel koşullar solun en altında durur; standart bölüm her personada aynı kalır.
 */
import { Suspense, lazy, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Drawer } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { AffilateMotoru } from '../components/AffilateMotoruV2';
import { OzetPaneli } from '../components/OzetPaneliV2';
import { PageHeader } from '../components/PageHeader';
import { Choice } from '../components/ui';
import { useMotionMs } from '../lib/motion';
import type { KosulBolum } from '../components/KosullarV2';
import { Adalet, Canli, Donemler, Girdi, Grup, Hesap, KararJson, Kimler, Kurallar, Sec, Sonuc, useSeciliSekmeGorunur, useYapisikSutunlar } from '../components/sadeKitV2';
import {
  ALAN_ADI,
  ISTOC_PAKET_ADI,
  KARIYER_ADI,
  PAKET_ADI,
  SEGMENT_ADI,
  SEVIYE_ADI,
  SOZLESME_ADI,
  VARSAYILAN_AYAR,
  ayGun,
  bagimsizKazanc,
  donemKazanci,
  ilkYilAy,
  kadroluKazanc,
  kampanyalar,
  musteriKazanc,
  rolMetinleri,
  satisOzeti,
  segikaAylik,
  type Ayar,
  type Egitim,
  type Faturalama,
  type IstocPaket,
  type KadroluAlan,
  type Marka,
  type RolId,
  type RolMetni,
  type SegikaPaket,
  type SegmentSonucu,
  type Seviye,
} from '../data/satisOrtakligiV2';
import { affilateHesabi, affilateModeli, kosulListesi, kosulOzeti, kosulSonucu, seciliKosul, type KosulSonuc } from '../data/kosullarV2';
import { POLITIKA_ADI } from '../data/affilateKurguV2';
import type { Politika } from '../data/affilateV2';
import { basamakDurumu, personaOzeti, segmentDurumu, type Tur } from '../data/ozetV2';
import '../styles/satisOrtakligiV2.css';

/** Model değişti (2026-11-03): eski v2 kaydı yeni alanlarla karışmasın diye anahtar yenilendi. */
const ANAHTAR = 'turksab-satis-ortakligi-v2-segment';
const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;
const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);

function useAyar() {
  const [ayar, setAyar] = useState<Ayar>(VARSAYILAN_AYAR);
  useEffect(() => {
    try {
      const kayit = localStorage.getItem(ANAHTAR);
      if (kayit) setAyar({ ...VARSAYILAN_AYAR, ...(JSON.parse(kayit) as Partial<Ayar>) });
    } catch {
      /* kayıt okunamazsa başlangıç değerleri */
    }
    // Çalışma rehberinin bağlantısı (`?surum=v2&urun=segika`) ürünü bir kez seçer ve bu sürümün kaydına yazar.
    // `proje` okunmaz: 1. sürüm onu adrese yazar ve iki sürümün ayarları ayrı kalmalıdır.
    const url = new URL(window.location.href);
    const urun = url.searchParams.get('urun');
    if (urun === 'istoc' || urun === 'segika') {
      guncelle({ marka: urun });
      url.searchParams.delete('urun');
      window.history.replaceState(null, '', url);
    }
  }, []);
  const guncelle = (p: Partial<Ayar>) =>
    setAyar((o) => {
      const yeni = { ...o, ...p };
      try {
        localStorage.setItem(ANAHTAR, JSON.stringify(yeni));
      } catch {
        /* depolama kapalı */
      }
      return yeni;
    });
  const sifirla = () => {
    try {
      localStorage.removeItem(ANAHTAR);
    } catch {
      /* yok */
    }
    setAyar(VARSAYILAN_AYAR);
  };
  return { ayar, guncelle, sifirla };
}

type G = (p: Partial<Ayar>) => void;

/* ---------- Sol panel: herkes için aynı standart bölüm ---------- */

/** Fiyatlandırma robotu: hangi paketten ayda kaç tane satılır? Sonuç, aylık satış cirosudur. */
function Robot({ a, g }: { a: Ayar; g: G }) {
  const s = satisOzeti(a);
  return (
    <Grup baslik="Satış: ayda kaç yeni müşteri?">
      {a.marka === 'istoc'
        ? (Object.keys(ISTOC_PAKET_ADI) as IstocPaket[]).map((id) => (
            <Girdi key={id} label={`${ISTOC_PAKET_ADI[id]} paket`} birim={id === 'kurumsal' ? 'teklifle fiyatlanır' : `${a.istocPaketEur[id]} € / ay`} value={a.istocSatis[id]} onChange={(v) => g({ istocSatis: { ...a.istocSatis, [id]: v } })} />
          ))
        : (Object.keys(PAKET_ADI) as SegikaPaket[]).map((id) => (
            <Girdi key={id} label={PAKET_ADI[id]} birim={`${tl(segikaAylik(a, id).toplam)} / ay`} value={a.segikaSatis[id]} onChange={(v) => g({ segikaSatis: { ...a.segikaSatis, [id]: v } })} />
          ))}
      <p className="v2-so2-robot">
        <span>Bu ayki satışların tutarı</span>
        <strong>
          <Canli deger={s.ciro}>{tl(s.ciro)}</Canli>
        </strong>
        <small>
          Bu tutar, bu ay gelen {sayi(s.adet)} yeni müşterinin ilk yıl bedelidir. {a.faturalama === 'yillik' ? 'Müşteri yıllık paketi peşin öder.' : 'Müşteri aylık abonelikle öder.'}
        </small>
      </p>
    </Grup>
  );
}

function StandartAyarlar({ a, g }: { a: Ayar; g: G }) {
  return (
    <>
      <Robot a={a} g={g} />
      <Grup baslik="Satıştaki katkı">
        <Sec<Seviye>
          label="Ortak satışta ne yapar?"
          value={a.katki}
          options={(['A', 'B', 'C'] as Seviye[]).map((s) => ({ id: s, name: SEVIYE_ADI[s], not: `Satışı kapatanın oranının ${yuzde(a.katkiCarpan[s])} kadarını alır` }))}
          onChange={(v) => g({ katki: v })}
        />
      </Grup>
      <Grup baslik="Segment koşulları">
        <Girdi label="Yenileme oranı (aboneliğini yenileyen müşteriler)" yuzdeMi value={a.yenileme} onChange={(v) => g({ yenileme: Math.min(1, v) })} />
        <Girdi label="Müşterilerin bizi tavsiye etme puanı (NPS)" birim="0 ile 100 arası" value={a.memnuniyet} onChange={(v) => g({ memnuniyet: Math.min(100, v) })} />
        <Sec<Egitim>
          label="Eğitim"
          value={a.egitim}
          options={[
            { id: 'temel', name: 'Temel eğitim' },
            { id: 'sertifika', name: 'Ürün sertifikası' },
          ]}
          onChange={(v) => g({ egitim: v })}
        />
        <Sec<'biz' | 'ortak'>
          label="Kurulumu ve desteği kim verir?"
          value={a.destek ? 'ortak' : 'biz'}
          options={[
            { id: 'biz', name: 'Biz veririz' },
            { id: 'ortak', name: 'Ortak verir' },
          ]}
          onChange={(v) => g({ destek: v === 'ortak' })}
        />
      </Grup>
      <Grup baslik="Ağ: en çok 2 kademe"><p className="v2-so2-kutu-not">Ortak, getirdiği ortakların satışından da pay alır. Bu paya ağ payı deriz. Ortağın getirdikleri 1. kademedir. Onların getirdikleri 2. kademedir.</p>
        <Girdi label="Her ortağın getirdiği ortak sayısı" value={a.agAltTemsilci} onChange={(v) => g({ agAltTemsilci: Math.min(6, v) })} />
        <Girdi label="Ağdaki her ortağın aylık satışı" birim="paket" value={a.agAltSatis} onChange={(v) => g({ agAltSatis: v })} />
      </Grup>
      <Grup baslik="Kampanyalar">
        <Girdi label="İlk 90 gün ek oran" yuzdeMi value={a.hizliBaslangic} onChange={(v) => g({ hizliBaslangic: Math.min(1, v) })} />
        {a.marka === 'istoc' ? <Girdi label="Enterprise paket ek oranı" yuzdeMi value={a.kurumsalEk} onChange={(v) => g({ kurumsalEk: Math.min(1, v) })} /> : null}
        <ArkadasiniGetir a={a} g={g} />
        <Girdi label="Yılda en çok tavsiye" value={a.tavsiyeSinir} onChange={(v) => g({ tavsiyeSinir: v })} />
      </Grup>
      <FiyatAyarlari a={a} g={g} />
    </>
  );
}

/**
 * Arkadaşını getir (kullanıcı kararı 2026-11-04): hakediş koşulu bir süre, ödül bir adettir. İkisi kenarlıklı tek kutuda
 * durur. Süre, yeni müşterinin ödemesinin tahsil edilmesi gereken aydır. Her ay 30 gün sayılır. Adet, bedava ay sayısıdır.
 */
function ArkadasiniGetir({ a, g }: { a: Ayar; g: G }) {
  return (
    <fieldset className="v2-so2-kutu">
      <legend className="v2-so2-kutu-baslik">Arkadaşını getir</legend>
      <p className="v2-so2-kutu-not">Yeni müşterinin ödemesi aşağıdaki süre içinde bize ulaşmalıdır. Ödeme bu sürede gelirse iki müşteri de ücretsiz kullanım kazanır. Bir ay 30 gün sayılır.</p>
      <Girdi label="Tahsilat süresi" birim={`ay, yani ${ayGun(a.tavsiyeSure)} gün`} min={1} value={a.tavsiyeSure} onChange={(v) => g({ tavsiyeSure: Math.min(12, Math.max(1, v)) })} />
      <Girdi label="Tavsiye eden müşteriye" birim="ay bedava" value={a.krediAy} onChange={(v) => g({ krediAy: v })} />
      <Girdi label="Tavsiyeyle gelen müşteriye" birim="ay bedava" value={a.yeniKrediAy} onChange={(v) => g({ yeniKrediAy: v })} />
    </fieldset>
  );
}

function FiyatAyarlari({ a, g }: { a: Ayar; g: G }) {
  if (a.marka === 'istoc')
    return (
      <Grup baslik="Fiyat">
        {(Object.keys(ISTOC_PAKET_ADI) as IstocPaket[]).map((id) => (
          <Girdi key={id} label={id === 'kurumsal' ? `${ISTOC_PAKET_ADI[id]}, örnek teklif` : `${ISTOC_PAKET_ADI[id]} paket`} birim="€ / ay" value={a.istocPaketEur[id]} onChange={(v) => g({ istocPaketEur: { ...a.istocPaketEur, [id]: v } })} />
        ))}
        <Girdi label="1 euro kaç ₺?" step={0.1} value={a.kur} onChange={(v) => g({ kur: v })} />
        <Girdi label="Yıllık pakette kaç ayın ücreti ödenir?" value={a.istocYilAy} onChange={(v) => g({ istocYilAy: v })} />
      </Grup>
    );
  const sayiTr = (n: number) => new Intl.NumberFormat('tr-TR').format(n);
  return (
    <>
      <Grup baslik="Fiyat">
        <div className="v2-so2-calisan">
          <Girdi label="Müşterinin çalışan sayısı" birim="kişi" min={1} step={25} value={a.calisan} onChange={(v) => g({ calisan: Math.max(1, v) })} />
          <div className="v2-so2-hazir" role="group" aria-label="Örnek firma büyüklüğü">
            {[25, 250, 1_000, 20_000].map((n) => (
              <button key={n} type="button" className="v2-so2-hazir-dugme" aria-pressed={a.calisan === n} onClick={() => g({ calisan: n })}>
                {sayiTr(n)}
              </button>
            ))}
          </div>
        </div>
        {(Object.keys(PAKET_ADI) as SegikaPaket[]).map((id) => (
          <Girdi key={id} label={`${PAKET_ADI[id]}: ${a.blok} çalışan`} birim="₺ / ay" step={50} value={a.segikaFiyat[id]} onChange={(v) => g({ segikaFiyat: { ...a.segikaFiyat, [id]: v } })} />
        ))}
        <Girdi label="Fiyat bloğu" birim="çalışan" min={1} value={a.blok} onChange={(v) => g({ blok: v })} />
      </Grup>
      <Grup baslik="Büyük firma indirimi">
        {a.kademeler.map((k, i) => {
          const son = i === a.kademeler.length - 1;
          const alt = i === 0 ? 1 : a.kademeler[i - 1].ust + 1;
          return (
            <div key={i} className="v2-so2-kademe">
              <p className="v2-so2-kademe-ad">{son ? `${sayiTr(alt)} çalışan ve üstü` : `${sayiTr(alt)}–${sayiTr(k.ust)} çalışan`}</p>
              {son ? null : <Girdi label="Kademe sonu" birim="kişi" step={100} value={k.ust} onChange={(v) => g({ kademeler: a.kademeler.map((x, j) => (j === i ? { ...x, ust: v } : x)) })} />}
              <Girdi label="İndirim" yuzdeMi value={k.indirim} onChange={(v) => g({ kademeler: a.kademeler.map((x, j) => (j === i ? { ...x, indirim: Math.min(1, v) } : x)) })} />
            </div>
          );
        })}
      </Grup>
    </>
  );
}

/** Program kuralları: oranlar ve eşikler (kullanıcı kararı 2026-11-03: sol panelde açık, akordeon içinde değil). */
function ProgramKurallari({ a, g }: { a: Ayar; g: G }) {
  const esik = a.segmentEsik[a.marka];
  const esikYaz = (i: number, p: Partial<{ musteri: number; ciro: number }>) => g({ segmentEsik: { ...a.segmentEsik, [a.marka]: esik.map((e, j) => (j === i ? { ...e, ...p } : e)) } });
  return (
    <section className="v2-so2-kurallar-bolum" aria-labelledby="v2-so2-kurallar-baslik">
      <h2 className="v2-so2-ozel-baslik" id="v2-so2-kurallar-baslik">
        Program kuralları: oranlar ve eşikler
      </h2>
      <div className="v2-so2-kurallar-icerik">
        <Grup baslik="Segment oranı (satışı kapatan için)">
          {SEGMENT_ADI.map((ad, i) => (
            <Girdi key={ad} label={ad} yuzdeMi value={a.segmentOran[i]} onChange={(v) => g({ segmentOran: a.segmentOran.map((x, j) => (j === i ? Math.min(1, v) : x)) as Ayar['segmentOran'] })} />
          ))}
        </Grup>
        <Grup baslik="Katkıya göre ödenen kısım">
          {(['A', 'B', 'C'] as Seviye[]).map((s) => (
            <Girdi key={s} label={({ A: 'Yalnız tanıştırırsa', B: 'Ürünü de gösterirse', C: 'Satışı kendisi kapatırsa' } as Record<Seviye, string>)[s]} yuzdeMi value={a.katkiCarpan[s]} onChange={(v) => g({ katkiCarpan: { ...a.katkiCarpan, [s]: Math.min(1, v) } })} />
          ))}
        </Grup>
        <Grup baslik="Segment eşikleri (yıllık)">
          {esik.map((e, i) => (
            <div key={i} className="v2-so2-kademe">
              <p className="v2-so2-kademe-ad">{SEGMENT_ADI[i + 1]}</p>
              <Girdi label="Yılda en az yeni müşteri" value={e.musteri} onChange={(v) => esikYaz(i, { musteri: v })} />
              <Girdi label="Yılda en az ciro" birim="₺" step={50_000} value={e.ciro} onChange={(v) => esikYaz(i, { ciro: v })} />
            </div>
          ))}
          <Girdi label="Altın için yenileme" yuzdeMi value={a.segmentYenileme[0]} onChange={(v) => g({ segmentYenileme: [Math.min(1, v), a.segmentYenileme[1]] })} />
          <Girdi label="Profesyonel için yenileme" yuzdeMi value={a.segmentYenileme[1]} onChange={(v) => g({ segmentYenileme: [a.segmentYenileme[0], Math.min(1, v)] })} />
          <Girdi label="Profesyonel için tavsiye puanı" birim="puan" value={a.proMemnuniyet} onChange={(v) => g({ proMemnuniyet: Math.min(100, v) })} />
          <Girdi label="Profesyonel yenileme payı" yuzdeMi value={a.proYenilemePay} onChange={(v) => g({ proYenilemePay: Math.min(1, v) })} />
        </Grup>
        <Grup baslik="Ağ payı (cironun oranı)">
          <Girdi label="1. kademe" yuzdeMi value={a.agPay[0]} onChange={(v) => g({ agPay: [Math.min(1, v), a.agPay[1]] })} />
          <Girdi label="2. kademe" yuzdeMi value={a.agPay[1]} onChange={(v) => g({ agPay: [a.agPay[0], Math.min(1, v)] })} />
        </Grup>
        <Grup baslik="Ortağın kazancının ödenmesi">
          <Girdi label="İlk ödeme" yuzdeMi value={a.ilkOdeme} onChange={(v) => g({ ilkOdeme: Math.min(1, v) })} />
          <Girdi label="İlk ödeme kaçıncı günde?" value={a.ilkGun} onChange={(v) => g({ ilkGun: v })} />
          <Girdi label="Kalan ödeme kaçıncı günde?" value={a.kalanGun} onChange={(v) => g({ kalanGun: v })} />
        </Grup>
      </div>
    </section>
  );
}

/* ---------- Sol panel: personaya özel koşullar (en altta) ---------- */

/** Yıllara yayılan oranlar (1., 2., 3. yıl). */
function YilOranlari({ oranlar, onChange }: { oranlar: [number, number, number]; onChange: (o: [number, number, number]) => void }) {
  return (
    <>
      {oranlar.map((o, i) => (
        <Girdi key={i} label={`${i + 1}. yıl komisyonu`} yuzdeMi value={o} onChange={(v) => onChange(oranlar.map((x, j) => (j === i ? Math.min(1, v) : x)) as [number, number, number])} />
      ))}
    </>
  );
}

/** Affilate kaynaklı programlarda ödeme takvimi seçenekleri. */
function AffilateAyarlari({ id, a, g }: { id: 'ayse' | 'satis' | 'cozum'; a: Ayar; g: G }) {
  return (
    <Grup baslik="Ödeme takvimi">
      <Sec<'paket' | 'aylik'>
        label="Müşteri nasıl öder?"
        value={a.affOdeme}
        options={[
          { id: 'paket', name: 'Yıllık paket' },
          { id: 'aylik', name: 'Aylık abonelik' },
        ]}
        onChange={(v) => g({ affOdeme: v })}
      />
      <Sec<'12' | '24' | '36'>
        label="Hesap süresi"
        value={String(a.affUfukAy) as '12' | '24' | '36'}
        options={[
          { id: '12', name: '1 yıl' },
          { id: '24', name: '2 yıl' },
          { id: '36', name: '3 yıl' },
        ]}
        onChange={(v) => g({ affUfukAy: Number(v) })}
      />
      <Sec<Politika>
        label="Ortağa ödeme ne zaman?"
        value={a.affPolitika[id]}
        options={(Object.keys(POLITIKA_ADI) as Politika[]).map((p) => ({ id: p, name: POLITIKA_ADI[p] }))}
        onChange={(v) => g({ affPolitika: { ...a.affPolitika, [id]: v } })}
      />
      {id !== 'ayse' ? <Girdi label="3. yıldan sonraki oran" yuzdeMi value={a.affSonraki[id]} onChange={(v) => g({ affSonraki: { ...a.affSonraki, [id]: Math.min(1, v) } })} /> : null}
    </Grup>
  );
}

/** Seçili özel programın değerleri. Nakitsiz programlarda değer yoktur. */
function ProgramAyarlari({ rol, kosul, a, g }: { rol: RolId; kosul: string; a: Ayar; g: G }) {
  const musteri = (label: string) => <Girdi label={label} value={a.cozumMusteri} onChange={(v) => g({ cozumMusteri: v })} />;
  if (rol === 'oncu' && kosul === 'yillara')
    return (
      <>
        <Grup baslik="Satış hedefleri ve oranlar">
          {['İlk 14 gün', '15. günden 45. güne kadar', '46. günden 90. güne kadar', '90. günden sonra'].map((ad, i) => (
            <Girdi key={ad} label={`${ad}: ayda kaç satış?`} value={a.oncuAsama[i]} onChange={(v) => g({ oncuAsama: a.oncuAsama.map((x, j) => (j === i ? v : x)) as Ayar['oncuAsama'] })} />
          ))}
          <YilOranlari oranlar={a.yillaraOncu} onChange={(o) => g({ yillaraOncu: o })} />
        </Grup>
        <AffilateAyarlari id="satis" a={a} g={g} />
      </>
    );
  if (rol === 'cozum' && kosul === 'yillara')
    return (
      <>
        <Grup baslik="Müşteri ve oranlar">
          {musteri('Yılda getirdiği müşteri')}
          <YilOranlari oranlar={a.yillaraCozum} onChange={(o) => g({ yillaraCozum: o })} />
        </Grup>
        <AffilateAyarlari id="cozum" a={a} g={g} />
      </>
    );
  if (rol === 'cozum' && (kosul === 'yonlendirme' || kosul === 'gelistirme')) {
    const yon = kosul === 'yonlendirme';
    return (
      <Grup baslik={yon ? 'Yönlendirme' : 'Satıcı geliştirme'}>
        {musteri(yon ? 'Yılda getirdiği müşteri' : 'Yılda geliştirdiği satıcı')}
        <Girdi label="Komisyon oranı" yuzdeMi value={yon ? a.yonlendirmeOran : a.gelistirmeOran} onChange={(v) => g(yon ? { yonlendirmeOran: Math.min(1, v) } : { gelistirmeOran: Math.min(1, v) })} />
        <Girdi label="Komisyonlu ay" birim="ay" value={yon ? a.yonlendirmeAy : a.gelistirmeAy} onChange={(v) => g(yon ? { yonlendirmeAy: v } : { gelistirmeAy: v })} />
      </Grup>
    );
  }
  if (rol === 'cozum' && kosul === 'smmm')
    return (
      <Grup baslik="Mali müşavir ofisi">
        <Girdi label="Aktif mükellef" birim="firma" value={a.smmmMukellef} onChange={(v) => g({ smmmMukellef: v })} />
      </Grup>
    );
  if (rol === 'tavsiye' && kosul === 'tek-sefer')
    return (
      <>
        <Grup baslik="Tavsiye komisyonu">
          <Girdi label="İlk faturadan" yuzdeMi value={a.tekSeferOran} onChange={(v) => g({ tekSeferOran: Math.min(1, v) })} />
        </Grup>
        <AffilateAyarlari id="ayse" a={a} g={g} />
      </>
    );
  return null;
}

function OzelKosullar({ rol, persona, a, g }: { rol: RolId; persona: RolMetni; a: Ayar; g: G }) {
  const liste = kosulListesi(a, rol);
  const kosul = seciliKosul(a, rol).id;
  const programSec =
    liste.length > 1 ? (
      <Sec<string> label="Özel program" value={kosul} options={liste.map((k) => ({ id: k.id, name: k.ad, not: k.id === 'ana' ? undefined : k.kaynak }))} onChange={(v) => g({ kosul: { ...a.kosul, [rol]: v } })} />
    ) : null;
  let icerik: ReactNode = null;
  if (rol === 'kadrolu')
    icerik = (
      <>
        <Grup baslik="Uzmanlık alanı ve ekip">
          <Sec<KadroluAlan> label="Hangi alanda satar?" value={a.kadroluAlan} options={(Object.keys(ALAN_ADI) as KadroluAlan[]).map((k) => ({ id: k, name: ALAN_ADI[k] }))} onChange={(v) => g({ kadroluAlan: v })} />
          <Girdi label="Yönettiği ekip" birim="kişi" value={a.kadroluEkip} onChange={(v) => g({ kadroluEkip: v })} />
          <Girdi label="Ekibin aylık satışı" birim="paket" value={a.liderEkipSatis} onChange={(v) => g({ liderEkipSatis: v })} />
          <Girdi label="Ekip satışı başına pay" birim="₺" step={100} value={a.liderPay} onChange={(v) => g({ liderPay: v })} />
        </Grup>
        <Grup baslik="Basamağa göre maaş ve prim">
          {KARIYER_ADI.map((ad, i) => (
            <div key={ad} className="v2-so2-kademe">
              <p className="v2-so2-kademe-ad">{ad}</p>
              <Girdi label="Maaş" birim="₺" step={1000} value={a.kadroluMaas[i]} onChange={(v) => g({ kadroluMaas: a.kadroluMaas.map((x, j) => (j === i ? v : x)) as Ayar['kadroluMaas'] })} />
              <Girdi label="Kota üstü prim" yuzdeMi value={a.kadroluPrimOran[i]} onChange={(v) => g({ kadroluPrimOran: a.kadroluPrimOran.map((x, j) => (j === i ? Math.min(1, v) : x)) as Ayar['kadroluPrimOran'] })} />
            </div>
          ))}
          <Girdi label="Kota, maaşın kaç katı?" step={0.5} value={a.kotaCarpan} onChange={(v) => g({ kotaCarpan: v })} />
          <Girdi label="Kotaya eklenen pay" yuzdeMi value={a.kotaEk} onChange={(v) => g({ kotaEk: v })} />
        </Grup>
      </>
    );
  else if (rol === 'cozum')
    icerik = (
      <>
        <Grup baslik="Program ve mali müşavir">
          {programSec}
          <Sec<'komisyon' | 'indirim'>
            label="Mali müşavire"
            value={a.musavirModel}
            options={[
              { id: 'indirim', name: 'Müşterisine indirim' },
              { id: 'komisyon', name: 'Komisyon' },
            ]}
            onChange={(v) => g({ musavirModel: v })}
          />
          {a.musavirModel === 'komisyon' ? (
            <Girdi label="Müşavir komisyonu" yuzdeMi value={a.musavirOran} onChange={(v) => g({ musavirOran: v })} />
          ) : (
            <Girdi label="Müşteriye indirim" yuzdeMi value={a.musavirIndirim} onChange={(v) => g({ musavirIndirim: v })} />
          )}
        </Grup>
        <div className="v2-so2-gecis" key={kosul}>
          <ProgramAyarlari rol={rol} kosul={kosul} a={a} g={g} />
        </div>
      </>
    );
  else if (programSec)
    icerik = (
      <>
        <Grup baslik="Program">{programSec}</Grup>
        <div className="v2-so2-gecis" key={kosul}>
          <ProgramAyarlari rol={rol} kosul={kosul} a={a} g={g} />
        </div>
      </>
    );
  return (
    <section className="v2-so2-ozel" aria-labelledby="v2-so2-ozel-baslik">
      <h2 className="v2-so2-ozel-baslik" id="v2-so2-ozel-baslik">
        Özel koşullar: {persona.ad}
      </h2>
      {icerik ?? <p className="v2-so2-ozel-yok">{persona.ad} yalnız standart koşullarla çalışır. Özel koşulu yoktur.</p>}
    </section>
  );
}

/* ---------- Sağ panel ---------- */

const SOZLESME_NOTU = {
  bagimsiz: 'Maaş almaz. Kazancını sözleşmeye göre fatura ya da makbuzla alır.',
  kadrolu: 'SGK’lı çalışanımızdır. Maaş ve prim alır.',
  musteri: 'Ortak değildir. Para değil, ücretsiz kullanım kazanır.',
};

/** Kırılım: büyük sonucu oluşturan kalemler; kapalı kalemlerde hangi koşulla açılacağı yazar. */
function Kirilim({ satirlar }: { satirlar: { ad: string; deger: string; not?: string; toplam?: boolean; kapali?: boolean }[] }) {
  return (
    <dl className="v2-kr">
      {satirlar.map((r) => (
        <div key={r.ad} className="v2-kr-satir" data-toplam={r.toplam ? '' : undefined} data-kapali={r.kapali ? '' : undefined}>
          <dt>
            {r.ad}
            {r.not ? <small>{r.not}</small> : null}
          </dt>
          <dd>
            <Canli deger={r.deger}>{r.deger}</Canli>
          </dd>
        </div>
      ))}
    </dl>
  );
}


/** Paneldeki kısa segment durumu: dört basamak şeridi, eksikler ve bütün koşulları açan düğme. */
function SegmentOzeti({ sg, tur, ac }: { sg: SegmentSonucu; tur: Tur; ac: (acan: HTMLElement) => void }) {
  const durum = segmentDurumu(sg, tur);
  return (
    <section className="v2-sg-ozet" aria-labelledby="v2-sg-ozet-baslik">
      <p className="v2-so2-alt-baslik" id="v2-sg-ozet-baslik">
        {tur === 'bagimsiz' ? 'Segment' : 'Kariyer basamağı'}
      </p>
      <ol className="v2-sg-adimlar">
        {sg.basamaklar.map((b, i) => {
          const d = basamakDurumu(sg, i);
          return (
            <li key={b.ad} data-durum={d} aria-current={d === 'simdi' ? 'step' : undefined}>
              {b.ad}
              <span className="visually-hidden">{d === 'simdi' ? ', şu anki basamak' : d === 'gecildi' ? ', geçildi' : ', henüz değil'}</span>
            </li>
          );
        })}
      </ol>
      <p className="v2-sg-durum">
        {tur === 'bagimsiz' ? 'Ortak' : 'Çalışan'} şu anda <strong>{sg.basamaklar[sg.seviye].ad}</strong> basamağındadır. <Canli deger={durum}>{durum}</Canli>
      </p>
      <button type="button" className="v2-so2-ikincil" aria-haspopup="dialog" onPointerEnter={onYukle} onFocus={onYukle} onClick={(e) => ac(e.currentTarget)}>
        Bütün koşulları gör
      </button>
    </section>
  );
}

function BagimsizSonuc({ a, persona }: { a: Ayar; persona: RolMetni }) {
  const b = bagimsizKazanc(a);
  const seg = SEGMENT_ADI[b.sg.seviye];
  const katki = SEVIYE_ADI[a.katki].toLocaleLowerCase('tr');
  return (
    <>
      <Sonuc
        etiket={`Aylık kazanç (${seg})`}
        deger={tl(b.aylik)}
        aciklama={
          b.aktif ? (
            <>
              {persona.ad} ayda {sayi(b.s.adet)} yeni müşteri getirir ve {tl(b.s.ciro)} ciro yapar. Ortak şu anda {seg} basamağındadır. Satışta “{katki}” katkısı verdiği için cironun {yuzde(b.oran)} kadarını alır.
              <span className="v2-so2-bize">Bu satıştan üç ödeme yaparız. Ortağa komisyon öderiz. Kampanya ekini öderiz. Ortağın üstündeki 2 kademeye ağ payı öderiz. Bize en az {tl(b.bize)} kalır.</span>
            </>
          ) : (
            'Bu ay satış yok. Satış olmadan komisyon da ağ payı da doğmaz.'
          )
        }
      />
      <Kirilim
        satirlar={[
          { ad: 'Satış komisyonu', deger: tl(b.komisyon), not: `${tl(b.s.ciro)} × ${yuzde(b.oran)}` },
          ...(a.marka === 'istoc' ? [{ ad: 'Enterprise paket kampanyası', deger: tl(b.kurumsal), not: b.kurumsal > 0 ? `Enterprise paket cirosu × ${yuzde(a.kurumsalEk)}` : 'Yalnız Enterprise paket satılınca ödenir', kapali: b.kurumsal === 0 }] : []),
          { ad: 'Ağ, 1. kademe', deger: tl(b.k1), not: b.k1Acik ? `${sayi(b.dal)} ortağın satışından` : 'Ortak Gümüş ortak ya da üstü olunca ödenir. Ortağın o ay en az 1 satış yapması gerekir.', kapali: !b.k1Acik },
          { ad: 'Ağ, 2. kademe', deger: tl(b.k2), not: b.k2Acik ? `${sayi(b.dal * b.dal)} ortağın satışından` : 'Ortak Altın ortak ya da üstü olunca ödenir. Ortağın o ay en az 1 satış yapması gerekir.', kapali: !b.k2Acik },
          { ad: 'Aylık toplam', deger: tl(b.aylik), toplam: true },
          { ad: 'İlk 90 gün hızlı başlangıç', deger: tl(b.hizli), not: b.hizli > 0 ? `Ortak başladıktan sonraki ilk 90 gün, her ay ${tl(b.s.ciro)} × ${yuzde(a.hizliBaslangic)}` : 'Yalnız ortak başladıktan sonraki ilk 90 gündeki satışlarda ödenir', kapali: b.hizli === 0 },
          { ad: '2. yıldan sonra yenileme payı', deger: tl(b.yenilemePay), not: b.yenilemePay > 0 ? `Yenilenen ciro × ${yuzde(a.proYenilemePay)}, her ay` : 'Ortak Profesyonel çözüm ortağı olunca ödenir', kapali: b.yenilemePay === 0 },
        ]}
      />
    </>
  );
}

function KadroluSonuc({ a }: { a: Ayar }) {
  const k = kadroluKazanc(a);
  const b = bagimsizKazanc(a);
  const dolu = Math.min(1, k.doluluk);
  const basamak = KARIYER_ADI[k.sg.seviye];
  return (
    <>
      <Sonuc
        etiket={`Bu ayki kazanç (${basamak})`}
        deger={tl(k.toplam)}
        aciklama={
          <>
            {basamak} olarak {tl(k.maas)} maaş alır. {k.prim > 0 ? `Kotayı aştığı için ${tl(k.prim)} prim de alır. Prim, kotayı aşan cironun ${yuzde(k.primOran)} kadarıdır.` : `Kotayı aşınca, kotayı aşan cironun ${yuzde(k.primOran)} kadarını prim olarak alır.`}
            {k.ekip > 0 ? ` Takım lideri olarak ekibin satışından ${tl(k.ekip)} pay alır.` : ''}
            <span className="v2-so2-bize">Bu ay ciromuz {tl(k.s.ciro)}. Uzmanlık alanı: {ALAN_ADI[a.kadroluAlan].toLocaleLowerCase('tr')}.</span>
          </>
        }
      />
      <div className="v2-so2-kota">
        <div className="v2-so2-kota-ust">
          <span>Ciro {tl(k.s.ciro)}</span>
          <span>Kota {tl(k.kota)}</span>
        </div>
        <svg className="v2-so2-kota-cubuk" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
          <rect className="v2-so2-kota-iz" x="0" y="0" width="100" height="10" />
          <rect className="v2-so2-kota-dolgu" data-asti={k.doluluk >= 1 ? '' : undefined} x="0" y="0" width={dolu * 100} height="10" />
        </svg>
        <p className="v2-so2-kota-not">Kota, maaşın {sayi(a.kotaCarpan)} katına %{sayi(a.kotaEk * 100)} eklenerek bulunur. {k.doluluk >= 1 ? 'Kota doldu.' : `Kotanın %${sayi(Math.round(k.doluluk * 100))} kadarı doldu.`}</p>
      </div>
      <Kirilim
        satirlar={[
          { ad: 'Maaş', deger: tl(k.maas), not: basamak },
          { ad: 'Kota üstü prim', deger: tl(k.prim), not: `(${tl(k.s.ciro)} − ${tl(k.kota)}) × ${yuzde(k.primOran)}`, kapali: k.prim === 0 },
          { ad: 'Ekip payı', deger: tl(k.ekip), not: k.ekip > 0 ? `${sayi(a.liderEkipSatis)} satış × ${tl(a.liderPay)}` : 'Takım lideri basamağında açılır', kapali: k.ekip === 0 },
          { ad: 'Aylık toplam', deger: tl(k.toplam), toplam: true },
        ]}
      />
      <Adalet baslik="Neden bağımsız ortaktan farklı?">
        Kadrolu çalışan maaş ve SGK güvencesi alır. Bu yüzden primi bağımsız ortağın komisyonundan düşüktür. Aynı satışı bağımsız ortak olarak yapan biri ayda {tl(b.satisKazanci)} satış komisyonu alır. Ama bu kişinin maaşı ve güvencesi yoktur.
      </Adalet>
    </>
  );
}

function MusteriSonuc({ a }: { a: Ayar }) {
  const m = musteriKazanc(a);
  return (
    <>
      <Sonuc
        etiket="Yıllık ücretsiz kullanımın değeri"
        deger={tl(m.yillikKredi)}
        aciklama={
          <>
            Müşteri yılda {sayi(m.yillikTavsiye)} yeni müşteri getirir. Bunların {sayi(m.sayilan)} tanesi ödül kazandırır. Her tavsiye {a.krediAy} ay, yani {tl(m.tavsiyeBasi)} değerinde ücretsiz kullanımdır.
            <span className="v2-so2-bize">
              Hakediş, yeni müşterinin ödemesi {m.sureGun} gün içinde tahsil edilirse oluşur. Hesap, ödemenin bu sürede alındığını varsayar. Yeni müşteri de {a.yeniKrediAy} ay bedava kullanır.
            </span>
          </>
        }
      />
      <Adalet baslik="Ortak olursa ne kazanır?">
        {m.fazla > 0
          ? `Sınırı aşan ${sayi(m.fazla)} tavsiye artık bir ortaklık hacmidir. Bağımsız ortak olursa aynı satışla ayda ${tl(m.ortakOlursa.satisKazanci)} satış komisyonu alır. Bu kişi ${SEGMENT_ADI[m.ortakOlursa.sg.seviye]} olarak başlar.`
          : `Müşteri ortaklık sözleşmesi imzalarsa aynı satışla ayda ${tl(m.ortakOlursa.satisKazanci)} satış komisyonu alır. Kampanyanın ücretsiz kullanım ödülü ise yalnız müşteriler içindir.`}
      </Adalet>
    </>
  );
}

function KampanyaListesi({ a, rol }: { a: Ayar; rol: RolId }) {
  const liste = kampanyalar(a, rol);
  return (
    <div className="v2-kp">
      <p className="v2-so2-alt-baslik">Katılabildiği kampanyalar</p>
      {liste.length ? (
        <ul className="v2-kp-liste">
          {liste.map((k) => (
            <li key={k.id}>
              <strong>{k.ad}</strong>
              <span>{k.ozet(a)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="v2-kp-yok">Kadrolu çalışan kampanyalara katılmaz. Kampanyalar bağımsız ortaklar ve müşteriler içindir.</p>
      )}
    </div>
  );
}

function hesapSatirlari(a: Ayar, sozlesme: RolMetni['sozlesme']) {
  const s = satisOzeti(a);
  const ay = ilkYilAy(a);
  const fiyat = s.paketler
    .filter((p) => p.adet > 0)
    .map((p) => ({
      ad: `${p.ad}: ilk yıl bedeli`,
      formul: a.marka === 'istoc' ? `${sayi(a.istocPaketEur[p.id as IstocPaket])} € × ${sayi(a.kur)} ₺ × ${ay} ay` : `${tl(p.aylik)} × ${ay} ay`,
      sonuc: tl(p.ilkYil),
    }));
  const ciro = { ad: 'Bu ayki satışların tutarı', formul: s.paketler.filter((p) => p.adet > 0).map((p) => `${sayi(p.adet)} × ${tl(p.ilkYil)}`).join(' + ') || 'Satış yok', sonuc: tl(s.ciro) };
  if (sozlesme === 'kadrolu') {
    const k = kadroluKazanc(a);
    return [
      ...fiyat,
      ciro,
      { ad: 'Kota', formul: `${tl(k.maas)} × ${sayi(a.kotaCarpan)} + %${sayi(a.kotaEk * 100)}`, sonuc: tl(k.kota) },
      { ad: 'Kota üstü prim', formul: `(${tl(s.ciro)} − ${tl(k.kota)}) × ${yuzde(k.primOran)}`, sonuc: tl(k.prim) },
      ...(k.ekip > 0 ? [{ ad: 'Ekip payı', formul: `${sayi(a.liderEkipSatis)} satış × ${tl(a.liderPay)}`, sonuc: tl(k.ekip) }] : []),
    ];
  }
  if (sozlesme === 'musteri') {
    const m = musteriKazanc(a);
    return [
      { ad: 'Hakediş için tahsilat süresi', formul: `${sayi(a.tavsiyeSure)} ay × 30 gün`, sonuc: `${m.sureGun} gün` },
      { ad: 'Bir tavsiyenin ödülü', formul: `${tl(m.kendiAylik)} × ${a.krediAy} ay`, sonuc: tl(m.tavsiyeBasi) },
      { ad: 'Ödül kazandıran tavsiye', formul: `En çok ${a.tavsiyeSinir}`, sonuc: sayi(m.sayilan) },
    ];
  }
  const b = bagimsizKazanc(a);
  return [
    ...fiyat,
    ciro,
    { ad: 'Komisyon oranı', formul: `${SEGMENT_ADI[b.sg.seviye]} ${yuzde(a.segmentOran[b.sg.seviye])} × katkı ${yuzde(a.katkiCarpan[a.katki])}`, sonuc: yuzde(b.oran) },
    { ad: 'Satış komisyonu', formul: `${tl(s.ciro)} × ${yuzde(b.oran)}`, sonuc: tl(b.komisyon) },
    { ad: 'Ağ, 1. kademe', formul: b.k1Acik ? `${sayi(b.dal)} ortak × ${sayi(a.agAltSatis)} satış × ${tl(b.birim.k1)}` : 'Gümüş ortak ya da üstü olunca ve o ay satış yapınca ödenir', sonuc: tl(b.k1) },
    { ad: 'Ağ, 2. kademe', formul: b.k2Acik ? `${sayi(b.dal * b.dal)} ortak × ${sayi(a.agAltSatis)} satış × ${tl(b.birim.k2)}` : 'Altın ortak ya da üstü olunca ve o ay satış yapınca ödenir', sonuc: tl(b.k2) },
    ...(b.komisyon <= 0
      ? []
      : a.faturalama === 'aylik'
        ? [{ ad: 'Ödeme: müşteri ödedikçe', formul: `${tl(b.komisyon)} ÷ 12 ay, her ay tahsilattan sonra`, sonuc: `${tl(b.komisyon / 12)} / ay` }]
        : [
            { ad: `${a.ilkGun}. gün ödenir`, formul: `${tl(b.komisyon)} × ${yuzde(a.ilkOdeme)}`, sonuc: tl(b.komisyon * a.ilkOdeme) },
            { ad: `${a.kalanGun}. gün ödenir`, formul: `kalan ${yuzde(1 - a.ilkOdeme)}`, sonuc: tl(b.komisyon * (1 - a.ilkOdeme)) },
          ]),
  ];
}

/** Özel programın sonucu: kaynak, büyük sonuç, dönemler, hesap ve kurallar. */
function ProgramPaneli({ ks, ad, ek }: { ks: KosulSonuc; ad: string; ek?: ReactNode }) {
  return (
    <>
      <p className="v2-so2-kaynak">Özel program: {ad}. Standart programın yerine geçer.</p>
      <Sonuc
        etiket={ks.etiket}
        deger={ks.deger}
        aciklama={
          <>
            {ks.aciklama}
            {ks.bize ? <span className="v2-so2-bize">{ks.bize}</span> : null}
          </>
        }
      />
      {ek}
      {ks.donemler.length ? <Donemler satirlar={ks.donemler} /> : null}
      {ks.hesap.length ? <Hesap baslik="Hesap" satirlar={ks.hesap} /> : null}
      <Kurallar maddeler={ks.kurallar} />
    </>
  );
}

/** Karar verisi: seçimler, robot, segment, personaların kazancı ve bütün ayarlar (tutarlar ₺, oranlar 0–1). */
function kararVerisi(a: Ayar, rol: RolId) {
  const r = (n: number) => Math.round(n);
  const s = satisOzeti(a);
  const b = bagimsizKazanc(a);
  const k = kadroluKazanc(a);
  const m = musteriKazanc(a);
  const roller = rolMetinleri(a.marka);
  const model = affilateModeli(a, rol);
  return {
    sayfa: 'Satış ortaklığı programı',
    surum: 3,
    program: 'v2',
    secim: { urun: a.marka, musteriOder: a.faturalama, persona: rol, katki: SEVIYE_ADI[a.katki], ozelProgram: seciliKosul(a, rol).id },
    satis: { aylikMusteri: s.adet, aylikCiro: r(s.ciro), paketler: s.paketler.map((p) => ({ paket: p.ad, aylikFiyat: r(p.aylik), ilkYilBedeli: r(p.ilkYil), aylikAdet: p.adet, ciro: r(p.ciro) })) },
    segment: { bagimsiz: SEGMENT_ADI[b.sg.seviye], eksikler: b.sg.eksikler, kadroluBasamak: KARIYER_ADI[k.sg.seviye], yillikMusteri: b.sg.yillikMusteri, yillikCiro: r(b.sg.yillikCiro) },
    personalar: Object.fromEntries(roller.map((p) => [p.id, { ad: p.ad, sozlesme: SOZLESME_ADI[p.sozlesme], ozet: personaOzeti(a, p), donemselKazanc: donemKazanci(a, p.sozlesme).map((d) => ({ kalem: d.ad, gunluk: r(d.yillik / 365), haftalik: r(d.yillik / 52), aylik: r(d.yillik / 12), yillik: r(d.yillik) })) }])),
    kazanc: {
      bagimsiz: { oran: b.oran, komisyon: r(b.komisyon), kurumsalKampanya: r(b.kurumsal), ag1: r(b.k1), ag2: r(b.k2), aylik: r(b.aylik), hizliBaslangicIlk3Ay: r(b.hizli), yenilemePayi: r(b.yenilemePay), bizeKalan: r(b.bize) },
      kadrolu: { basamak: KARIYER_ADI[k.sg.seviye], alan: ALAN_ADI[a.kadroluAlan], maas: k.maas, kota: r(k.kota), prim: r(k.prim), ekipPayi: r(k.ekip), toplam: r(k.toplam) },
      musteri: { hakedisTahsilatSuresiGun: m.sureGun, yillikTavsiye: m.yillikTavsiye, krediyeCevrilen: m.sayilan, yillikKredi: r(m.yillikKredi), ortakOlursaAylik: r(m.ortakOlursa.aylik) },
    },
    kampanyalar: kampanyalar(a, rol).map((x) => ({ ad: x.ad, ozet: x.ozet(a) })),
    ozelProgramlar: kosulOzeti(a),
    ...(model
      ? (() => {
          const h = affilateHesabi(a, model);
          return { odemeTakvimi: { musteriOder: a.affOdeme, sureAy: a.affUfukAy, ortagaOdeme: POLITIKA_ADI[a.affPolitika[model]], ortagaToplam: Math.round(h.ortaklar.reduce((n, o) => n + o.planlanan, 0) / 100) } };
        })()
      : {}),
    ayarlar: a,
  };
}

type CekmeceBolum = 'standart' | 'persona' | 'kurallar';

/**
 * Dar ekran ayar çekmecesi (320 px önce): alttan açılır, odak tuzağı ve Escape ile kapanma Mantine Drawer’dan gelir.
 * Üstte canlı sonuç yapışık durur; girdi değişince etkisi çekmece kapanmadan görünür. İçerik yalnız açıkken çizilir.
 */
function AyarCekmecesi({ acik, kapat, a, g, rol, persona, ozet, sifirla }: { acik: boolean; kapat: () => void; a: Ayar; g: G; rol: RolId; persona: RolMetni; ozet: { deger: string; birim: string }; sifirla: () => void }) {
  const [bolum, setBolum] = useState<CekmeceBolum>('standart');
  const sure = useMotionMs('--motion-duration-base');
  return (
    <Drawer
      opened={acik}
      onClose={kapat}
      title="Ayarlar"
      position="bottom"
      size="92%"
      transitionProps={{ duration: sure, timingFunction: 'var(--motion-ease-standard)' }}
      overlayProps={{ backgroundOpacity: 0.55 }}
      returnFocus={false}
      closeButtonProps={{ 'aria-label': 'Ayarları kapat', size: 'xl' }}
      classNames={{ content: 'v2-pencere', header: 'v2-pencere-ust', title: 'v2-pencere-baslik', body: 'v2-cekmece-govde', close: 'v2-pencere-kapat' }}
    >
      <div className="v2-cekmece-sonuc">
        <span>{persona.ad}</span>
        <strong>
          <Canli deger={ozet.deger}>{ozet.deger}</Canli> <small>{ozet.birim}</small>
        </strong>
      </div>
      <Choice<CekmeceBolum>
        label="Bölüm"
        value={bolum}
        options={[
          { id: 'standart', name: 'Standart' },
          { id: 'persona', name: 'Persona' },
          { id: 'kurallar', name: 'Kurallar' },
        ]}
        onChange={setBolum}
      />
      <div className="v2-so2-gecis v2-cekmece-bolum" key={bolum}>
        {bolum === 'standart' ? (
          <>
            <p className="v2-so2-standart-not">Bu ayarlar bütün personalarda aynıdır. Aynı satış, aynı sonucu verir.</p>
            <StandartAyarlar a={a} g={g} />
            <button type="button" className="v2-so2-sifirla" onClick={sifirla}>
              Başa dön
            </button>
          </>
        ) : bolum === 'persona' ? (
          <OzelKosullar rol={rol} persona={persona} a={a} g={g} />
        ) : (
          <ProgramKurallari a={a} g={g} />
        )}
      </div>
      <button type="button" className="v2-so2-ikincil v2-cekmece-kapat" onClick={kapat}>
        Sonucu gör
      </button>
    </Drawer>
  );
}

/** Uyarlanmış teslim: Koşullar penceresi ve ağ diyagramı ilk yüklemede indirilmez, ilk açılışta yüklenir. */
const kosullarModulu = () => import('../components/KosullarV2');
const KosullarPenceresi = lazy(kosullarModulu);
/** Fare düğmeye gelince ya da düğme odak alınca pencere modülü önceden yüklenir; tıklayınca bekleme olmaz. */
const onYukle = () => {
  void kosullarModulu();
};

/* ---------- Sayfa ---------- */

/**
 * Yapışık üst bölüm (kullanıcı kararı 2026-11-03): ürün satırı ve persona sekmeleri aşağı kayınca sayfa başlığının
 * altına yapışır. Başlık satırının ve ürün satırının yüksekliği CSS değişkeni olarak yazılır; yapışma kuralları
 * satisOrtakligiV2.css → “Yapışık üst bölüm” içindedir (yalnız geniş ve yeterince yüksek ekranlarda).
 */
function useYapisikUst() {
  const kok = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = kok.current;
    if (!el) return undefined;
    const kirinti = document.querySelector<HTMLElement>('.crumbs-row');
    const arac = el.querySelector<HTMLElement>('.v2-so2-arac');
    const olc = () => {
      el.style.setProperty('--v2-kirinti-h', `${kirinti?.offsetHeight ?? 0}px`);
      el.style.setProperty('--v2-arac-h', `${arac?.offsetHeight ?? 0}px`);
    };
    olc();
    const gozlem = new ResizeObserver(olc);
    if (kirinti) gozlem.observe(kirinti);
    if (arac) gozlem.observe(arac);
    return () => gozlem.disconnect();
  }, []);
  return kok;
}

export function SatisOrtakligiV2({ surum }: { surum: ReactNode }) {
  const duzen = useYapisikSutunlar();
  const iskelet = useYapisikSutunlar();
  const kok = useYapisikUst();
  // Uyarlanmış teslim (kullanıcı kararı 2026-11-03, 320 px önce): geniş ekranda ayarlar sayfada açık durur; dar ekranda
  // sayfada yalnız persona ve sonuç kalır, ayarlar alttaki sonuç çubuğundan açılan çekmecede ve yalnız açılınca çizilir.
  // v2 yalnız istemcide çizilir (sarmalayıcı sunucuda v1’i çizer); değer ilk çizimde gerçek ekran genişliğinden okunur.
  const genis = useMediaQuery('(min-width: 64em)', true, { getInitialValueInEffect: false });
  // 80em altında özet sütunu yoktur; canlı sonuç alttaki çubukta görünür.
  const ucSutun = useMediaQuery('(min-width: 80em)', true, { getInitialValueInEffect: false });
  const [cekmece, setCekmece] = useState(false);
  const ayarDugmesi = useRef<HTMLButtonElement>(null);
  const cekmeceyiKapat = () => {
    setCekmece(false);
    window.setTimeout(() => ayarDugmesi.current?.focus(), 0);
  };
  // Kabuk değişince (ör. tablet döndürülünce) odak ve açık çekmece korunur: son odaklanan alanın etiketi saklanır,
  // yeni kabukta aynı etiketli alan, yoksa açan düğme odak alır. Geniş ekrana geçince çekmece kapanır.
  const sonAlan = useRef<string | null>(null);
  useEffect(() => {
    const kaydet = (e: FocusEvent) => {
      const el = e.target instanceof HTMLElement ? e.target : null;
      sonAlan.current = el?.closest('.v2-so2-girdi')?.querySelector('label')?.textContent ?? null;
    };
    document.addEventListener('focusin', kaydet);
    return () => document.removeEventListener('focusin', kaydet);
  }, []);
  const oncekiGenis = useRef(genis);
  useLayoutEffect(() => {
    if (oncekiGenis.current === genis) return;
    oncekiGenis.current = genis;
    if (genis) setCekmece(false);
    if (document.activeElement && document.activeElement !== document.body) return;
    const alan = sonAlan.current
      ? Array.from(document.querySelectorAll<HTMLElement>('.v2-so2 .v2-so2-girdi')).find((x) => x.querySelector('label')?.textContent === sonAlan.current)?.querySelector('input')
      : null;
    (alan ?? document.querySelector<HTMLElement>(genis ? '.v2-so2-kosullar-dugme' : '.v2-so2-alt-cubuk-dugme'))?.focus();
  }, [genis]);
  const { ayar: a, guncelle: g, sifirla } = useAyar();
  const [rol, setRol] = useState<RolId>('oncu');
  const [kosulAcik, setKosulAcik] = useState(false);
  const [kosulYuklendi, setKosulYuklendi] = useState(false);
  // Pencere ilk açılışta yüklendiği için açan düğme burada saklanır; kapanınca odak ona döner.
  const acan = useRef<HTMLElement | null>(null);
  const [bolum, setBolum] = useState<KosulBolum>('segment');
  // Safari tıklamada düğmeye odak vermez; açan öğe olaydan alınır.
  const kosullariAc = (b?: KosulBolum, el?: HTMLElement) => {
    if (b) setBolum(b);
    acan.current = el ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    setKosulYuklendi(true);
    setKosulAcik(true);
  };
  const serit = useSeciliSekmeGorunur(rol);
  const roller = rolMetinleri(a.marka);
  const secili = roller.find((r) => r.id === rol)!;
  const s = satisOzeti(a);
  const ks = kosulSonucu(a, rol);
  const kosulTanim = seciliKosul(a, rol);
  const ozet = personaOzeti(a, secili);
  const model = affilateModeli(a, rol);
  return (
    <div className="v2-so2" ref={kok}>
      <PageHeader title="Satış ortaklığı programı" purpose="Bu sayfa beş satış rolünün aynı satıştan kazancını ve kariyer basamağını gösterir." />
      <p className="v2-so2-yerel-not" data-v2-yerel-not>Bu sürümde yaptığınız ayarlar yalnız bu tarayıcıda saklanır. Ortak kayda yalnız 1. sürümün ayarları kaydedilir.</p>
      <div className="v2-so2-iskelet" ref={iskelet}>
      <div className="v2-so2-ana">
      <div className="v2-so2-arac">
        {/* Sürüm seçici sayfa sürümünü değiştirir (sarmalayıcıdan gelir); ürün ve ödeme seçimlerinden ayrı kutudadır. */}
        <div className="v2-so2-surum-kap">{surum}</div>
        <Choice<Marka>
          label="Ürün"
          value={a.marka}
          options={[
            { id: 'istoc', name: 'iStoc' },
            { id: 'segika', name: 'Segika' },
          ]}
          onChange={(v) => g({ marka: v })}
        />
        <Choice<Faturalama>
          label="Müşteri öder"
          value={a.faturalama}
          options={[
            { id: 'yillik', name: 'Yıllık paket' },
            { id: 'aylik', name: 'Aylık abonelik' },
          ]}
          onChange={(v) => g({ faturalama: v })}
        />
        <button type="button" className="v2-so2-kosullar-dugme" aria-haspopup="dialog" aria-expanded={kosulAcik} onPointerEnter={onYukle} onFocus={onYukle} onClick={(e) => kosullariAc(undefined, e.currentTarget)}>
          Koşullar
        </button>
        <p className="v2-so2-fiyat">
          Bu ayki satışların tutarı <strong>{tl(s.ciro)}</strong>
          <span>
            {sayi(s.adet)} yeni müşteri, müşteri başı ilk yıl {tl(s.ortalamaIlkYil)}
          </span>
        </p>
      </div>

      {genis ? (
      <section className="v2-so2-standart" aria-labelledby="v2-so2-standart-baslik">
        <div className="v2-so2-standart-ust">
          <h2 className="v2-so2-standart-baslik" id="v2-so2-standart-baslik">
            Standart ayarlar
          </h2>
          <p className="v2-so2-standart-not">Bu ayarlar bütün personalarda aynıdır. Aynı satış, aynı sonucu verir.</p>
          <button type="button" className="v2-so2-sifirla" onClick={sifirla}>
            Başa dön
          </button>
        </div>
        <div className="v2-so2-standart-gruplar">
          <StandartAyarlar a={a} g={g} />
        </div>
      </section>
      ) : null}

      <div className="v2-so2-duzen" ref={duzen}>
        {genis ? (
        <aside className="v2-so2-ayarlar" aria-label="Personaya özel ayarlar ve program kuralları">
          <div className="v2-so2-ayarlar-ust">
            <p className="v2-so2-ayarlar-baslik">{secili.ad}</p>
          </div>
          <div className="v2-so2-gecis" key={rol}>
            <OzelKosullar rol={rol} persona={secili} a={a} g={g} />
          </div>
          <ProgramKurallari a={a} g={g} />
        </aside>
        ) : null}
        <div className="v2-so2-sag">
          <div className="v2-so2-roller" role="tablist" ref={serit} aria-label="Personalar">
            {roller.map((r, i) => {
              const o = personaOzeti(a, r);
              return (
                <button
                  key={r.id}
                  type="button"
                  role="tab"
                  id={`v2-so2-sekme-${r.id}`}
                  aria-selected={r.id === rol}
                  aria-controls="v2-so2-panel"
                  tabIndex={r.id === rol ? 0 : -1}
                  className="v2-so2-rol"
                  data-edge={r.id === rol ? 'top' : undefined}
                  onClick={() => setRol(r.id)}
                  onKeyDown={(e) => {
                    const j = e.key === 'ArrowRight' ? (i + 1) % roller.length : e.key === 'ArrowLeft' ? (i - 1 + roller.length) % roller.length : -1;
                    if (j < 0) return;
                    e.preventDefault();
                    setRol(roller[j].id);
                    document.getElementById(`v2-so2-sekme-${roller[j].id}`)?.focus();
                  }}
                >
                  <span className="v2-so2-rol-no">{i + 1}</span>
                  <span className="v2-so2-rol-ad">{r.ad}</span>
                  <span className="v2-so2-rol-kisa">{SOZLESME_ADI[r.sozlesme]}</span>
                  <span className="v2-so2-rol-tutar">
                    {o.deger} <small>{o.birim}</small>
                  </span>
                </button>
              );
            })}
          </div>
          <section className="v2-so2-panel" id="v2-so2-panel" role="tabpanel" aria-labelledby={`v2-so2-sekme-${rol}`}>
            <div className="v2-so2-gecis" key={`${a.marka}-${rol}-${kosulTanim.id}`}>
              <h2 className="v2-so2-baslik">{secili.ad}</h2>
              <p className="v2-so2-sozlesme">
                <strong>{SOZLESME_ADI[secili.sozlesme]}</strong> {SOZLESME_NOTU[secili.sozlesme]}
              </p>
              <p className="v2-so2-kim">{secili.kim}</p>
              <Kimler liste={secili.kimler} />
              {ks ? (
                <ProgramPaneli ks={ks} ad={kosulTanim.ad} ek={model ? <AffilateMotoru a={a} id={model} /> : null} />
              ) : (
                <>
                  {secili.sozlesme === 'kadrolu' ? <KadroluSonuc a={a} /> : secili.sozlesme === 'musteri' ? <MusteriSonuc a={a} /> : <BagimsizSonuc a={a} persona={secili} />}
                  {secili.sozlesme === 'musteri' ? null : (
                    <SegmentOzeti sg={kadroluVeyaBagimsiz(a, secili.sozlesme)} tur={secili.sozlesme === 'kadrolu' ? 'kadrolu' : 'bagimsiz'} ac={(el) => kosullariAc(secili.sozlesme === 'kadrolu' ? 'kariyer' : 'segment', el)} />
                  )}
                  <KampanyaListesi a={a} rol={rol} />
                  <Donemler satirlar={donemKazanci(a, secili.sozlesme)} />
                  <Hesap baslik="Hesap" satirlar={hesapSatirlari(a, secili.sozlesme)} />
                  <Kurallar maddeler={secili.kurallar} />
                </>
              )}
            </div>
          </section>
        </div>
      </div>
      </div>
      {/* Özet geniş ekranda kendi içinde kayar. Klavyeyle de odaklanır ve kayar (role="region", ad: Özet). */}
      <div className="v2-so2-ozet-kap" id="v2-so2-ozet" tabIndex={0} role="region" aria-label="Özet">
        <OzetPaneli a={a} rol={rol} onKosullar={(el) => kosullariAc(secili.sozlesme === 'kadrolu' ? 'kariyer' : 'segment', el)} />
      </div>
      </div>
      <KararJson veri={kararVerisi(a, rol)} dosyaAdi="satis-ortakligi-v2" />
      {ucSutun ? null : (
        <>
          <div className="v2-so2-alt-cubuk">
            <p className="v2-so2-alt-cubuk-sonuc">
              <span>{secili.ad}</span>
              <strong>
                <Canli deger={ozet.deger}>{ozet.deger}</Canli> <small>{ozet.birim}</small>
              </strong>
            </p>
            {genis ? (
              <button
                type="button"
                className="v2-so2-alt-cubuk-dugme"
                onClick={() => {
                  const hedef = document.getElementById('v2-so2-ozet');
                  hedef?.scrollIntoView({ block: 'start', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
                  hedef?.focus({ preventScroll: true });
                }}
              >
                Özet
              </button>
            ) : (
              <button type="button" ref={ayarDugmesi} className="v2-so2-alt-cubuk-dugme" aria-haspopup="dialog" aria-expanded={cekmece} onClick={() => setCekmece(true)}>
                Ayarlar
              </button>
            )}
          </div>
          {genis ? null : <AyarCekmecesi acik={cekmece} kapat={cekmeceyiKapat} a={a} g={g} rol={rol} persona={secili} ozet={ozet} sifirla={sifirla} />}
        </>
      )}
      {kosulYuklendi ? (
        <Suspense fallback={null}>
          <KosullarPenceresi a={a} acik={kosulAcik} bolum={bolum} setBolum={setBolum} kapat={() => {
              setKosulAcik(false);
              window.setTimeout(() => acan.current?.focus(), 0);
            }} />
        </Suspense>
      ) : null}
    </div>
  );
}

function kadroluVeyaBagimsiz(a: Ayar, sozlesme: RolMetni['sozlesme']) {
  return sozlesme === 'kadrolu' ? kadroluKazanc(a).sg : bagimsizKazanc(a).sg;
}
