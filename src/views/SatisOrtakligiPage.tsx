import { useEffect, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Choice } from '../components/ui';
import { Donemler, Girdi, Grup, Hesap, KararJson, Kimler, Kurallar, Sec, Sonuc, useYapisikSutunlar } from '../components/sadeKit';
import {
  ASAMA_ADI,
  ASAMA_SURE,
  PAKET_ADI,
  SEVIYE_ADI,
  VARSAYILAN_AYAR,
  aylikFiyat,
  donemKazanci,
  kadrolu,
  musavir,
  rolMetinleri,
  cozumKazanci,
  satisKazanci,
  segikaAylik,
  yillikFiyat,
  type Ayar,
  type Marka,
  type Model,
  type RolId,
  type SegikaPaket,
  type Seviye,
} from '../data/satisOrtakligi';

const ANAHTAR = 'turksab-satis-ortakligi-v1';
const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))} ₺`;
const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;

function useAyar() {
  const [ayar, setAyar] = useState<Ayar>(VARSAYILAN_AYAR);
  useEffect(() => {
    try {
      const kayit = localStorage.getItem(ANAHTAR);
      if (kayit) setAyar({ ...VARSAYILAN_AYAR, ...(JSON.parse(kayit) as Partial<Ayar>) });
    } catch {
      /* kayıt okunamazsa başlangıç değerleri */
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

function SeviyeSec({ value, onChange }: { value: Seviye; onChange: (s: Seviye) => void }) {
  return <Sec<Seviye> label="Ortak satışta ne yapar?" value={value} options={(['A', 'B', 'C'] as Seviye[]).map((s) => ({ id: s, name: SEVIYE_ADI[s] }))} onChange={onChange} />;
}

/* ---------- Rol panelleri: sonuç + görsel + kurallar ---------- */

function Oncu({ a }: { a: Ayar }) {
  const birim = satisKazanci(a, a.oncuSeviye);
  const enIyi = a.oncuAsama[3] * birim;
  return (
    <>
      <Sonuc
        etiket="Ortağın aylık kazancı · 90. günden sonra"
        deger={tl(enIyi)}
        aciklama={
          <>
            {a.marka === 'istoc' ? 'Deniz' : 'Ece'} ayda {a.oncuAsama[3]} yıllık paket satarsa bu tutarı kazanır. Her satıştan {tl(birim)} alır.
            <span className="so2-bize">Aynı satışlardan bize {tl(a.oncuAsama[3] * (yillikFiyat(a) - birim))} kalır.</span>
          </>
        }
      />
      <ol className="so2-asamalar">
        {ASAMA_ADI.map((ad, i) => (
          <li key={ad} className="so2-asama" data-aktif={a.oncuAsama[i] > 0 ? '' : undefined}>
            <span className="so2-asama-sure">{ASAMA_SURE[i]}</span>
            <span className="so2-asama-ad">{ad}</span>
            <span className="so2-asama-hedef">{a.oncuAsama[i] ? `Ayda ${a.oncuAsama[i]} satış` : 'Satış beklenmez'}</span>
            <span className="so2-asama-tutar">
              <small>Ortağa</small> {tl(a.oncuAsama[i] * birim)}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
}

function Kadrolu({ a }: { a: Ayar }) {
  const k = kadrolu(a);
  const dolu = Math.min(1, k.doluluk);
  return (
    <>
      <Sonuc
        etiket="Satış uzmanının bu ayki kazancı"
        deger={tl(k.toplam)}
        aciklama={
          <>
            {k.prim > 0 ? `${tl(a.maas)} maaş alır. Kotayı aştığı için cironun ${yuzde(a.kadroluPrim[a.marka])}’u kadar, ${tl(k.prim)} prim eklenir.` : `${tl(a.maas)} maaş alır. Kotayı aşınca cironun ${yuzde(a.kadroluPrim[a.marka])}’unu prim olarak alır.`}
            <span className="so2-bize">{k.prim > 0 ? `Bu ay ciromuz ${tl(k.ciro)}. Prim düşülünce bize ${tl(k.ciro - k.prim)} kalır.` : `Bu ay ciromuz ${tl(k.ciro)}.`}</span>
          </>
        }
      />
      <div className="so2-kota">
        <div className="so2-kota-ust">
          <span>
            Ciro {tl(k.ciro)}
            <small>
              {a.kadroluSatis} paket × {tl(yillikFiyat(a))}
            </small>
          </span>
          <span>
            Kota {tl(k.kota)}
            <small>
              {tl(a.maas)} maaş × {a.kotaCarpan} + %{Math.round(a.kotaEk * 100)}
            </small>
          </span>
        </div>
        <svg className="so2-kota-cubuk" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
          <rect className="so2-kota-iz" x="0" y="0" width="100" height="10" />
          <rect className="so2-kota-dolgu" data-asti={k.doluluk >= 1 ? '' : undefined} x="0" y="0" width={dolu * 100} height="10" />
        </svg>
        <p className="so2-kota-not">{k.doluluk >= 1 ? `Kotaya ${k.kotaIcinSatis} satışla ulaşır. Sonraki her satış prim getirir.` : `Kotaya ulaşmak için ${k.kotaIcinSatis} satış gerekir.`}</p>
      </div>
    </>
  );
}

function Cozum({ a }: { a: Ayar }) {
  const birim = cozumKazanci(a);
  const m = musavir(a);
  return (
    <>
      <Sonuc
        etiket="Çözüm ortağının yıllık kazancı"
        deger={tl(birim * a.cozumMusteri)}
        aciklama={
          <>
            Çözüm ortağı yılda {a.cozumMusteri} müşteri getirirse bu tutarı kazanır. Her müşteriden {tl(birim)} alır{a.model === 'oran' && a.marka === 'segika' ? `, bu paket bedelinin ${yuzde(a.cozumOran)}’idir` : ''}.
            <span className="so2-bize">Aynı müşterilerden bize {tl(a.cozumMusteri * (yillikFiyat(a) - birim))} kalır.</span>
          </>
        }
      />
      {a.marka === 'segika' ? (
      <div className="so2-ikili">
        <div>
          <p className="so2-alt-baslik">Ücretsiz eğitim</p>
          <p className="so2-ikili-deger">Yılda {a.egitimSaat} saat</p>
          <p>Programın kullanımını ortağa ve destek personeline biz öğretiriz.</p>
        </div>
        <div>
          <p className="so2-alt-baslik">Ek eğitim</p>
          <p className="so2-ikili-deger">{tl(a.egitimSaatUcret)} / saat</p>
          <p>{a.ekEgitimSaat > 0 ? `${a.ekEgitimSaat} saat ek eğitim için ortaktan ${tl(a.ekEgitimSaat * a.egitimSaatUcret)} alırız.` : 'Personeli değişirse ya da fazlasını isterse saat başı ücret alırız.'}</p>
        </div>
      </div>
      ) : null}
      <div className="so2-musavir">
        <p className="so2-alt-baslik">Mali müşavir</p>
        <p>
          {m.tur === 'komisyon'
            ? `Müşavir her müşteriden ${tl(m.musteriBasina)} komisyon alır.`
            : `Müşavirin müşterisi ${yuzde(a.musavirIndirim)} indirimli alır. Müşavire komisyon ödemeyiz, ona panel veririz.`}
        </p>
      </div>
    </>
  );
}

function Tavsiye({ a }: { a: Ayar }) {
  const ay = aylikFiyat(a);
  return (
    <>
      <Sonuc
        etiket="Tavsiye eden müşterinin kazancı"
        deger={tl(ay * a.krediAy)}
        aciklama={
          <>
            Tavsiye eden müşteri {a.krediAy} ay ücretsiz kullanım kazanır. Para ödemeyiz.
            <span className="so2-bize">Yeni müşterinin yıllık paketinden bize {tl(yillikFiyat(a) - ay * (a.krediAy + a.yeniKrediAy))} kalır.</span>
          </>
        }
      />
      <div className="so2-ikili">
        <div>
          <p className="so2-alt-baslik">Yeni müşteri</p>
          <p className="so2-ikili-deger">{tl(ay * a.yeniKrediAy)}</p>
          <p>{a.yeniKrediAy} ay ücretsiz kullanım kazanır.</p>
        </div>
        <div>
          <p className="so2-alt-baslik">Yıllık sınır</p>
          <p className="so2-ikili-deger">{a.tavsiyeSinir} tavsiye</p>
          <p>Daha fazlası çözüm ortağı olur.</p>
        </div>
      </div>
    </>
  );
}

function Elci({ a }: { a: Ayar }) {
  const birim = satisKazanci(a, a.elciSeviye);
  return (
    <Sonuc
      etiket="Elçinin aylık kazancı"
      deger={tl(birim * a.elciSatis)}
      aciklama={
        <>
          Elçinin bağlantısından ayda {a.elciSatis} yıllık paket satılırsa bu tutarı kazanır. Her satıştan {tl(birim)} alır.
          <span className="so2-bize">Aynı satışlardan bize {tl(a.elciSatis * (yillikFiyat(a) - birim))} kalır.</span>
        </>
      }
    />
  );
}

/* ---------- Hesap dökümü: soldaki her değerin sonuca etkisi ---------- */

const sayi = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 2 }).format(n);

function fiyatSatirlari(a: Ayar) {
  if (a.marka === 'istoc') {
    const ay = a.istocAyEur * a.kur;
    return [
      { ad: 'Aylık fiyat', formul: `${sayi(a.istocAyEur)} € × ${sayi(a.kur)} ₺`, sonuc: tl(ay) },
      { ad: 'Yıllık paket', formul: `${tl(ay)} × ${a.istocYilAy} ay`, sonuc: tl(ay * a.istocYilAy) },
    ];
  }
  const sg = segikaAylik(a);
  const kisiBasi = a.segikaFiyat[a.segikaPaket] / Math.max(1, a.blok);
  return [
    { ad: 'Kişi başı fiyat', formul: `${tl(a.segikaFiyat[a.segikaPaket])} ÷ ${a.blok} çalışan`, sonuc: `${sayi(Math.round(kisiBasi * 100) / 100)} ₺` },
    ...sg.dilimler.map((d) => ({
      ad: `${sayi(d.alt)}–${sayi(d.ust)} çalışan`,
      formul: `${sayi(d.kisi)} kişi × ${sayi(Math.round(kisiBasi * 100) / 100)} ₺${d.indirim > 0 ? ` − %${sayi(Math.round(d.indirim * 1000) / 10)}` : ''}`,
      sonuc: tl(d.tutar),
    })),
    { ad: 'Aylık toplam', formul: `${sayi(sg.kisi)} çalışan`, sonuc: tl(sg.toplam) },
    { ad: 'Yıllık paket', formul: `${tl(sg.toplam)} × 12 ay`, sonuc: tl(sg.toplam * 12) },
  ];
}

function payKalemi(a: Ayar, rol: RolId) {
  const yillik = yillikFiyat(a);
  if (rol === 'kadrolu') {
    const k = kadrolu(a);
    return a.model === 'oran'
      ? { ad: 'Prim', formul: `(${tl(k.ciro)} − ${tl(k.kota)}) × %${sayi(a.kadroluPrim[a.marka] * 100)}`, tutar: k.prim }
      : { ad: 'Prim', formul: `${Math.max(0, a.kadroluSatis - k.kotaIcinSatis)} satış × ${tl(a.sabit)}`, tutar: k.prim };
  }
  if (rol === 'tavsiye') return { ad: 'Kredi', formul: `${tl(aylikFiyat(a))} × ${a.krediAy} ay`, tutar: aylikFiyat(a) * a.krediAy };
  const oran = rol === 'cozum' ? (a.marka === 'segika' ? a.cozumOran : a.oran[a.cozumSeviye]) : a.oran[rol === 'oncu' ? a.oncuSeviye : a.elciSeviye];
  const tutar = rol === 'cozum' ? cozumKazanci(a) : satisKazanci(a, rol === 'oncu' ? a.oncuSeviye : a.elciSeviye);
  return a.model === 'oran'
    ? { ad: 'Bir satıştan ortağa', formul: `${tl(yillik)} × %${sayi(Math.round(oran * 1000) / 10)}`, tutar }
    : { ad: 'Bir satıştan ortağa', formul: 'Satış başı tutar', tutar };
}

function RolHesabi({ a, rol }: { a: Ayar; rol: RolId }) {
  const pay = payKalemi(a, rol);
  const satirlar = [...fiyatSatirlari(a), { ad: pay.ad, formul: pay.formul, sonuc: tl(pay.tutar) }];
  if (rol !== 'tavsiye' && pay.tutar > 0)
    satirlar.push(
      { ad: `${a.ilkGun}. gün ödenir`, formul: `${tl(pay.tutar)} × %${sayi(Math.round(a.ilkOdeme * 1000) / 10)}`, sonuc: tl(pay.tutar * a.ilkOdeme) },
      { ad: `${a.kalanGun}. gün ödenir`, formul: `kalan %${sayi(Math.round((1 - a.ilkOdeme) * 1000) / 10)}`, sonuc: tl(pay.tutar * (1 - a.ilkOdeme)) },
    );
  return <Hesap baslik="Hesap" satirlar={satirlar} />;
}

/** Karar verisi: seçimler, girilen değerler ve beş rolün hesaplanan sonuçları (tutarlar ₺, oranlar 0–1). */
function kararVerisi(a: Ayar, rol: RolId) {
  const r = (n: number) => Math.round(n);
  const k = kadrolu(a);
  const sg = a.marka === 'segika' ? segikaAylik(a) : null;
  return {
    sayfa: 'Satış ortaklığı programı',
    surum: 1,
    secim: { urun: a.marka, odemeModeli: a.model, seciliRol: rol },
    fiyat: {
      aylik: r(aylikFiyat(a)),
      yillikPaket: r(yillikFiyat(a)),
      ...(a.marka === 'istoc'
        ? { aylikEuro: a.istocAyEur, kur: a.kur, yillikPaketAy: a.istocYilAy }
        : { paket: PAKET_ADI[a.segikaPaket], calisan: sg!.kisi, blok: a.blok, dilimler: sg!.dilimler.map((d) => ({ alt: d.alt, ust: d.ust, kisi: d.kisi, indirim: d.indirim, tutar: r(d.tutar) })) }),
    },
    roller: {
      oncu: { seviye: SEVIYE_ADI[a.oncuSeviye], satisBasina: r(satisKazanci(a, a.oncuSeviye)), aylikSatisHedefleri: a.oncuAsama, aylikKazanc: a.oncuAsama.map((n) => r(n * satisKazanci(a, a.oncuSeviye))) },
      kadrolu: { maas: a.maas, kota: r(k.kota), primOrani: a.kadroluPrim[a.marka], aylikSatis: a.kadroluSatis, ciro: r(k.ciro), prim: r(k.prim), toplam: r(k.toplam) },
      cozum: {
        ...(a.marka === 'segika' ? { oran: a.cozumOran, ucretsizEgitimSaat: a.egitimSaat, ekEgitimSaatUcreti: a.egitimSaatUcret, ekEgitimSaat: a.ekEgitimSaat, ekEgitimBedeli: r(a.ekEgitimSaat * a.egitimSaatUcret) } : { seviye: SEVIYE_ADI[a.cozumSeviye] }),
        musteriBasina: r(cozumKazanci(a)),
        yillikMusteri: a.cozumMusteri,
        yillikKazanc: r(cozumKazanci(a) * a.cozumMusteri),
        maliMusavir: { model: a.musavirModel, oran: a.musavirModel === 'komisyon' ? a.musavirOran : a.musavirIndirim, musteriBasina: r(musavir(a).musteriBasina) },
      },
      tavsiye: { tavsiyeEdeneAy: a.krediAy, yeniMusteriyeAy: a.yeniKrediAy, yillikSinir: a.tavsiyeSinir, kredi: r(aylikFiyat(a) * a.krediAy) },
      elci: { seviye: SEVIYE_ADI[a.elciSeviye], satisBasina: r(satisKazanci(a, a.elciSeviye)), aylikSatis: a.elciSatis, aylikKazanc: r(satisKazanci(a, a.elciSeviye) * a.elciSatis) },
    },
    odeme: { komisyonOranlari: a.oran, satisBasiTutar: a.sabit, ilkOdeme: a.ilkOdeme, ilkOdemeGunu: a.ilkGun, kalanOdemeGunu: a.kalanGun },
    donemselKazanc: Object.fromEntries((['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci'] as RolId[]).map((id) => [id, donemKazanci(a, id).map((d) => ({ kalem: d.ad, gunluk: r(d.yillik / 365), haftalik: r(d.yillik / 52), aylik: r(d.yillik / 12), yillik: r(d.yillik) }))])),
    ayarlar: a,
  };
}

/* ---------- Ayarlar: seçili rolün değerleri önce ---------- */

function RolAyarlari({ rol, a, g }: { rol: RolId; a: Ayar; g: (p: Partial<Ayar>) => void }) {
  if (rol === 'oncu')
    return (
      <Grup baslik="Satış hedefleri">
        <SeviyeSec value={a.oncuSeviye} onChange={(s) => g({ oncuSeviye: s })} />
        {ASAMA_ADI.map((ad, i) => (
          <Girdi key={ad} label={`${ASAMA_SURE[i]}: ayda kaç satış?`} value={a.oncuAsama[i]} onChange={(v) => g({ oncuAsama: a.oncuAsama.map((x, j) => (j === i ? v : x)) as Ayar['oncuAsama'] })} />
        ))}
      </Grup>
    );
  if (rol === 'kadrolu')
    return (
      <Grup baslik="Maaş ve kota">
        <Girdi label="Aylık maaş" birim="₺" step={1000} value={a.maas} onChange={(v) => g({ maas: v })} />
        <Girdi label="Kota: maaşın katı" birim="×" step={0.5} value={a.kotaCarpan} onChange={(v) => g({ kotaCarpan: v })} />
        <Girdi label="Kotaya ek" yuzdeMi value={a.kotaEk} onChange={(v) => g({ kotaEk: v })} />
        <Girdi label="Kota üstü prim" yuzdeMi value={a.kadroluPrim[a.marka]} onChange={(v) => g({ kadroluPrim: { ...a.kadroluPrim, [a.marka]: v } })} />
        <Girdi label="Bu ay satılan paket" value={a.kadroluSatis} onChange={(v) => g({ kadroluSatis: v })} />
      </Grup>
    );
  if (rol === 'cozum')
    return (
      <Grup baslik="Ortak ve müşavir">
        {a.marka === 'segika' ? (
          <Girdi label="Komisyon oranı" yuzdeMi value={a.cozumOran} onChange={(v) => g({ cozumOran: Math.min(1, v) })} />
        ) : (
          <SeviyeSec value={a.cozumSeviye} onChange={(s) => g({ cozumSeviye: s })} />
        )}
        <Girdi label="Yılda getirdiği müşteri" value={a.cozumMusteri} onChange={(v) => g({ cozumMusteri: v })} />
        {a.marka === 'segika' ? (
          <>
            <Girdi label="Ücretsiz eğitim" birim="saat / yıl" value={a.egitimSaat} onChange={(v) => g({ egitimSaat: v })} />
            <Girdi label="Ek eğitim ücreti" birim="₺ / saat" step={100} value={a.egitimSaatUcret} onChange={(v) => g({ egitimSaatUcret: v })} />
            <Girdi label="Ek eğitim" birim="saat" value={a.ekEgitimSaat} onChange={(v) => g({ ekEgitimSaat: v })} />
          </>
        ) : null}
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
    );
  if (rol === 'tavsiye')
    return (
      <Grup baslik="Hizmet kredisi">
        <Girdi label="Tavsiye edene" birim="ay" value={a.krediAy} onChange={(v) => g({ krediAy: v })} />
        <Girdi label="Yeni müşteriye" birim="ay" value={a.yeniKrediAy} onChange={(v) => g({ yeniKrediAy: v })} />
        <Girdi label="Yılda en çok" birim="tavsiye" value={a.tavsiyeSinir} onChange={(v) => g({ tavsiyeSinir: v })} />
      </Grup>
    );
  return (
    <Grup baslik="Elçi">
      <SeviyeSec value={a.elciSeviye} onChange={(s) => g({ elciSeviye: s })} />
      <Girdi label="Ayda satış" value={a.elciSatis} onChange={(v) => g({ elciSatis: v })} />
    </Grup>
  );
}

function OrtakAyarlar({ a, g }: { a: Ayar; g: (p: Partial<Ayar>) => void }) {
  return (
    <>
      <Grup baslik={a.model === 'oran' ? 'Ortağın işine göre komisyon' : 'Satış başı tutar'}>
        {a.model === 'oran' ? (
          (['A', 'B', 'C'] as Seviye[]).map((s) => <Girdi key={s} label={SEVIYE_ADI[s]} yuzdeMi value={a.oran[s]} onChange={(v) => g({ oran: { ...a.oran, [s]: v } })} />)
        ) : (
          <Girdi label="Her yıllık paket" birim="₺" step={100} value={a.sabit} onChange={(v) => g({ sabit: v })} />
        )}
      </Grup>
      <Grup baslik="Fiyat">
        {a.marka === 'istoc' ? (
          <>
            <Girdi label="Aylık fiyat" birim="€" value={a.istocAyEur} onChange={(v) => g({ istocAyEur: v })} />
            <Girdi label="Euro kuru" birim="₺" step={0.1} value={a.kur} onChange={(v) => g({ kur: v })} />
            <Girdi label="Yıllık paket" birim="ay bedeli" value={a.istocYilAy} onChange={(v) => g({ istocYilAy: v })} />
          </>
        ) : (
          <>
            <div className="so2-calisan">
              <Girdi label="Müşterinin çalışan sayısı" birim="kişi" min={1} step={25} value={a.calisan} onChange={(v) => g({ calisan: Math.max(1, v) })} />
              <div className="so2-hazir" role="group" aria-label="Örnek firma büyüklüğü">
                {[25, 250, 1_000, 20_000].map((n) => (
                  <button key={n} type="button" className="so2-hazir-dugme" aria-pressed={a.calisan === n} onClick={() => g({ calisan: n })}>
                    {new Intl.NumberFormat('tr-TR').format(n)}
                  </button>
                ))}
              </div>
            </div>
            <Sec<SegikaPaket> label="Paket" value={a.segikaPaket} options={(Object.keys(PAKET_ADI) as SegikaPaket[]).map((p) => ({ id: p, name: PAKET_ADI[p] }))} onChange={(v) => g({ segikaPaket: v })} />
            <Girdi label={`${PAKET_ADI[a.segikaPaket]}: ${a.blok} çalışan, aylık`} birim="₺" step={50} value={a.segikaFiyat[a.segikaPaket]} onChange={(v) => g({ segikaFiyat: { ...a.segikaFiyat, [a.segikaPaket]: v } })} />
            <Girdi label="Fiyat bloğu" birim="çalışan" min={1} value={a.blok} onChange={(v) => g({ blok: v })} />
          </>
        )}
      </Grup>
      {a.marka === 'segika' ? (
        <Grup baslik="Büyük firma indirimi">
          {a.kademeler.map((k, i) => {
            const son = i === a.kademeler.length - 1;
            const alt = i === 0 ? 1 : a.kademeler[i - 1].ust + 1;
            const sayi = (n: number) => new Intl.NumberFormat('tr-TR').format(n);
            return (
              <div key={i} className="so2-kademe">
                <p className="so2-kademe-ad">{son ? `${sayi(alt)} çalışan ve üstü` : `${sayi(alt)}–${sayi(k.ust)} çalışan`}</p>
                {son ? null : <Girdi label="Kademe sonu" birim="kişi" step={100} value={k.ust} onChange={(v) => g({ kademeler: a.kademeler.map((x, j) => (j === i ? { ...x, ust: v } : x)) })} />}
                <Girdi label="İndirim" yuzdeMi value={k.indirim} onChange={(v) => g({ kademeler: a.kademeler.map((x, j) => (j === i ? { ...x, indirim: Math.min(1, v) } : x)) })} />
              </div>
            );
          })}
        </Grup>
      ) : null}
      <Grup baslik="Hakediş ödemesi">
        <Girdi label="İlk ödeme" yuzdeMi value={a.ilkOdeme} onChange={(v) => g({ ilkOdeme: Math.min(1, v) })} />
        <Girdi label="İlk ödeme günü" birim="gün" value={a.ilkGun} onChange={(v) => g({ ilkGun: v })} />
        <Girdi label="Kalan ödeme günü" birim="gün" value={a.kalanGun} onChange={(v) => g({ kalanGun: v })} />
      </Grup>
    </>
  );
}

/** Segika fiyat özeti: paket, çalışan ve ortalama indirim. */
function segikaOzet(a: Ayar) {
  const s = segikaAylik(a);
  const indirim = s.listeFiyati > 0 ? 1 - s.toplam / s.listeFiyati : 0;
  return `${PAKET_ADI[a.segikaPaket]}, ${new Intl.NumberFormat('tr-TR').format(s.kisi)} çalışan, aylık ${tl(s.toplam)}${indirim > 0.0005 ? `, indirim ${yuzde(indirim)}` : ''}`;
}

/* ---------- Sayfa ---------- */

function Icerik() {
  const duzen = useYapisikSutunlar();
  const { ayar: a, guncelle: g, sifirla } = useAyar();
  const [rol, setRol] = useState<RolId>('oncu');
  const roller = rolMetinleri(a.marka);
  const secili = roller.find((r) => r.id === rol)!;
  const yillik = yillikFiyat(a);
  const ozet: Record<RolId, string> = {
    oncu: tl(a.oncuAsama[3] * satisKazanci(a, a.oncuSeviye)),
    kadrolu: tl(kadrolu(a).toplam),
    cozum: tl(cozumKazanci(a) * a.cozumMusteri),
    tavsiye: tl(aylikFiyat(a) * a.krediAy),
    elci: tl(satisKazanci(a, a.elciSeviye) * a.elciSatis),
  };
  const ozetBirim: Record<RolId, string> = { oncu: '/ ay', kadrolu: '/ ay', cozum: '/ yıl', tavsiye: 'kredi', elci: '/ ay' };
  return (
    <div className="so2">
      <PageHeader title="Satış ortaklığı programı" purpose="Beş ortak rolünün kim olduğunu ve ne kazandığını gösterir. Soldaki değerleri değiştirince sonuçlar hemen güncellenir." />

      <div className="so2-arac">
        <Choice<Marka>
          label="Ürün"
          value={a.marka}
          options={[
            { id: 'istoc', name: 'iStoc' },
            { id: 'segika', name: 'Segika' },
          ]}
          onChange={(v) => g({ marka: v })}
        />
        <Choice<Model>
          label="Ödeme"
          value={a.model}
          options={[
            { id: 'oran', name: 'İşe göre oran' },
            { id: 'sabit', name: 'Satış başı tutar' },
          ]}
          onChange={(v) => g({ model: v })}
        />

        <p className="so2-fiyat">
          Yıllık paket <strong>{tl(yillik)}</strong>
          <span>{a.marka === 'istoc' ? `${a.istocAyEur} € × ${a.istocYilAy} ay` : segikaOzet(a)}</span>
        </p>
      </div>

      <div className="so2-duzen" ref={duzen}>
        <aside className="so2-ayarlar" aria-label="Ayarlar">
          <div className="so2-ayarlar-ust">
            <p className="so2-ayarlar-baslik">Ayarlar</p>
            <button type="button" className="so2-sifirla" onClick={sifirla}>
              Başa dön
            </button>
          </div>
          <RolAyarlari rol={rol} a={a} g={g} />
          <OrtakAyarlar a={a} g={g} />
        </aside>
        <div className="so2-sag">
          <div className="so2-roller" role="tablist" aria-label="Roller">
        {roller.map((r, i) => (
          <button
            key={r.id}
            type="button"
            role="tab"
            id={`so2-sekme-${r.id}`}
            aria-selected={r.id === rol}
            aria-controls="so2-panel"
            tabIndex={r.id === rol ? 0 : -1}
            className="so2-rol"
            data-edge={r.id === rol ? 'top' : undefined}
            onClick={() => setRol(r.id)}
            onKeyDown={(e) => {
              const j = e.key === 'ArrowRight' ? (i + 1) % roller.length : e.key === 'ArrowLeft' ? (i - 1 + roller.length) % roller.length : -1;
              if (j < 0) return;
              e.preventDefault();
              setRol(roller[j].id);
              document.getElementById(`so2-sekme-${roller[j].id}`)?.focus();
            }}
          >
            <span className="so2-rol-no">{i + 1}</span>
            <span className="so2-rol-ad">{r.ad}</span>
            <span className="so2-rol-kisa">{r.kisa}</span>
            <span className="so2-rol-tutar">
              {ozet[r.id]} <small>{ozetBirim[r.id]}</small>
            </span>
          </button>
        ))}
      </div>
          <section className="so2-panel" id="so2-panel" role="tabpanel" aria-labelledby={`so2-sekme-${rol}`}>
          <div className="so2-gecis" key={`${a.marka}-${rol}`}>
          <h2 className="so2-baslik">{secili.ad}</h2>
          <p className="so2-kim">{secili.kim}</p>
          <Kimler liste={secili.kimler} />
          {rol === 'oncu' ? <Oncu a={a} /> : rol === 'kadrolu' ? <Kadrolu a={a} /> : rol === 'cozum' ? <Cozum a={a} /> : rol === 'tavsiye' ? <Tavsiye a={a} /> : <Elci a={a} />}
          <Donemler satirlar={donemKazanci(a, rol)} />
          <RolHesabi a={a} rol={rol} />
          <Kurallar maddeler={secili.kurallar} />
          </div>
        </section>
        </div>
      </div>
      <KararJson veri={kararVerisi(a, rol)} dosyaAdi="satis-ortakligi" />
    </div>
  );
}

export function SatisOrtakligiPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname} wide>
      <Icerik />
    </AppFrame>
  );
}
