import { useState, type ReactNode } from 'react';
import { usePersonaAyar } from '../lib/personaStore';
import { PersonaSyncStatus } from '../components/PersonaSyncStatus';
import { AffilateMotoru } from '../components/AffilateMotoru';
import { AgDiyagrami } from '../components/AgDiyagrami';
import { PageHeader } from '../components/PageHeader';
import { Choice } from '../components/ui';
import { Canli, Donemler, Girdi, Grup, Hesap, KararJson, Kimler, Kurallar, Sec, Sonuc, useSeciliSekmeGorunur, useYapisikSutunlar } from '../components/sadeKit';
import {
  ASAMA_ADI,
  ASAMA_SURE,
  PAKET_ADI,
  SEVIYE_ADI,
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
import { affilateHesabi, affilateModeli, kosulListesi, kosulOzeti, kosulSonucu, seciliKosul, type KosulSonuc } from '../data/kosullar';
import { POLITIKA_ADI } from '../data/affilateKurgu';
import type { Politika } from '../data/affilate';

const tl = (v: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(v))}\u00a0₺`;
const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;


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
        etiket={'Ortağın aylık kazancı (90. günden sonra)'}
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
            {`${tl(a.maas)} maaş alır. ` + (a.model === 'oran' ? (k.prim > 0 ? `Kotayı aştığı için ${tl(k.prim)} prim de alır. Prim, kotayı aşan cironun ${yuzde(a.kadroluPrim[a.marka])} kadarıdır.` : `Kotayı aşınca, kotayı aşan cironun ${yuzde(a.kadroluPrim[a.marka])} kadarını prim olarak alır.`) : k.prim > 0 ? `Kotayı aştığı için ${tl(k.prim)} prim de alır. Kotadan sonraki her satış ${tl(a.sabit)} prim getirir.` : `Kotayı aşınca, sonraki her satıştan ${tl(a.sabit)} prim alır.`)}
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
            Çözüm ortağı yılda {a.cozumMusteri} müşteri getirirse bu tutarı kazanır. Her müşteriden {tl(birim)} alır.{a.model === 'oran' && a.marka === 'segika' ? ` Bu tutar, paket bedeline ${yuzde(a.cozumOran)} oranı uygulanarak bulunur.` : ''}
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
          <p>{a.ekEgitimSaat > 0 ? `${a.ekEgitimSaat} saat ek eğitim için ortaktan ${tl(a.ekEgitimSaat * a.egitimSaatUcret)} alırız.` : 'Ortağın personeli değişirse ya da ortak daha fazla eğitim isterse saat başı ücret alırız.'}</p>
        </div>
      </div>
      ) : null}
      <div className="so2-musavir">
        <p className="so2-alt-baslik">Mali müşavir</p>
        <p>
          {m.tur === 'komisyon'
            ? `Müşavir her müşteriden ${tl(m.musteriBasina)} komisyon alır.`
            : `Müşavirin müşterisi paketi ${yuzde(a.musavirIndirim)} indirimle alır. Müşavire komisyon ödemeyiz. Bunun yerine ona panel veririz.`}
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
          <p>Yılda {a.tavsiyeSinir} tavsiyeden fazlasını getiren müşteri çözüm ortağı olur.</p>
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
  if (rol === 'tavsiye') return { ad: 'Ücretsiz kullanımın değeri', formul: `${tl(aylikFiyat(a))} × ${a.krediAy} ay`, tutar: aylikFiyat(a) * a.krediAy };
  const oran = rol === 'cozum' ? (a.marka === 'segika' ? a.cozumOran : a.oran[a.cozumSeviye]) : a.oran[rol === 'oncu' ? a.oncuSeviye : a.elciSeviye];
  const tutar = rol === 'cozum' ? cozumKazanci(a) : satisKazanci(a, rol === 'oncu' ? a.oncuSeviye : a.elciSeviye);
  return a.model === 'oran'
    ? { ad: 'Bir satıştan ortağa', formul: `${tl(yillik)} × %${sayi(Math.round(oran * 1000) / 10)}`, tutar }
    : { ad: 'Bir satıştan ortağa', formul: 'Her satışa sabit tutar', tutar };
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
    surum: 2,
    program: 'v1',
    secim: { urun: a.marka, odemeModeli: a.model, seciliRol: rol, seciliKosul: seciliKosul(a, rol).id },
    kosulSetleri: kosulOzeti(a),
    ...(affilateModeli(a, rol)
      ? (() => {
          const m = affilateHesabi(a, affilateModeli(a, rol)!);
          return {
            odemeTakvimi: {
              musteriOder: a.affOdeme,
              sureAy: a.affUfukAy,
              ortagaOdeme: POLITIKA_ADI[a.affPolitika[affilateModeli(a, rol)!]],
              ortagaToplam: Math.round(m.ortaklar.reduce((n, o) => n + o.planlanan, 0) / 100),
              segikayaKalan: Math.round(m.segika.reduce((n, s) => n + s.komisyonSonrasi, 0) / 100),
              aylar: m.aylar.filter((x) => x.tahsilat || x.hakedis || x.odeme).map((x) => ({ ay: x.ay, musteriOder: Math.round(x.tahsilat / 100), hakedis: Math.round((x.hakedis + x.duzeltme) / 100), odenen: Math.round(x.odeme / 100) })),
            },
          };
        })()
      : {}),
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

function AnaAyarlari({ rol, a, g }: { rol: RolId; a: Ayar; g: (p: Partial<Ayar>) => void }) {
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
        <Girdi label="Kota, maaşın kaç katı?" step={0.5} value={a.kotaCarpan} onChange={(v) => g({ kotaCarpan: v })} />
        <Girdi label="Kotaya eklenen pay" yuzdeMi value={a.kotaEk} onChange={(v) => g({ kotaEk: v })} />
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
      <Grup baslik="Ücretsiz kullanım hakkı">
        <Girdi label="Tavsiye eden kaç ay ücretsiz kullanır?" value={a.krediAy} onChange={(v) => g({ krediAy: v })} />
        <Girdi label="Yeni müşteri kaç ay ücretsiz kullanır?" value={a.yeniKrediAy} onChange={(v) => g({ yeniKrediAy: v })} />
        <Girdi label="Yılda en çok" birim="tavsiye" value={a.tavsiyeSinir} onChange={(v) => g({ tavsiyeSinir: v })} />
      </Grup>
    );
  return (
    <Grup baslik="Elçi">
      <SeviyeSec value={a.elciSeviye} onChange={(s) => g({ elciSeviye: s })} />
      <Girdi label="Aylık satış" value={a.elciSatis} onChange={(v) => g({ elciSatis: v })} />
    </Grup>
  );
}

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

/** Affilate kaynaklı setlerde ödeme takvimi seçenekleri: müşterinin ödeme biçimi, süre, ortağa ödeme zamanı. */
function AffilateAyarlari({ id, a, g }: { id: 'ayse' | 'satis' | 'cozum'; a: Ayar; g: (p: Partial<Ayar>) => void }) {
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

/** Diğer sayfalardan gelen koşul setlerinin değiştirilebilir değerleri. Nakitsiz setlerde değer yoktur. */
function KosulAyarlari({ rol, kosul, a, g }: { rol: RolId; kosul: string; a: Ayar; g: (p: Partial<Ayar>) => void }) {
  const asama = (i: number) => (
    <Girdi key={i} label={`${ASAMA_SURE[i]}: ayda kaç satış?`} value={a.oncuAsama[i]} onChange={(v) => g({ oncuAsama: a.oncuAsama.map((x, j) => (j === i ? v : x)) as Ayar['oncuAsama'] })} />
  );
  const musteri = (label: string) => <Girdi label={label} value={a.cozumMusteri} onChange={(v) => g({ cozumMusteri: v })} />;
  if (rol === 'oncu' && kosul === 'ag')
    return (
      <Grup baslik="Temsilci ağı">
        <Girdi label="Satış başı komisyon" birim="₺" step={100} value={a.agKomisyon} onChange={(v) => g({ agKomisyon: v })} />
        <Girdi label="Kişi başı aylık satış" value={a.agAltSatis} onChange={(v) => g({ agAltSatis: v })} />
        <Girdi label="Kişi başı getirilen temsilci" birim="kişi" value={a.agAltTemsilci} onChange={(v) => g({ agAltTemsilci: Math.min(6, v) })} />
        <Girdi label="Kaç kademe yukarı pay gider?" birim="kademe" min={1} value={a.agDerinlik} onChange={(v) => g({ agDerinlik: Math.min(3, Math.max(1, v)) })} />
        {a.agKademePay.slice(0, Math.min(3, Math.max(1, a.agDerinlik))).map((p, i) => (
          <Girdi key={i} label={`${i + 1}. kademe payı`} birim="₺ / satış" step={50} value={p} onChange={(v) => g({ agKademePay: a.agKademePay.map((x, j) => (j === i ? v : x)) as Ayar['agKademePay'] })} />
        ))}
        <Girdi label="Bir satışta ödeme tavanı" birim="₺" step={50} value={a.agTavan} onChange={(v) => g({ agTavan: v })} />
      </Grup>
    );
  if (rol === 'oncu' && kosul === 'yillara')
    return (
      <>
      <Grup baslik="Satış hedefleri ve oranlar">
        {[0, 1, 2, 3].map(asama)}
        <YilOranlari oranlar={a.yillaraOncu} onChange={(o) => g({ yillaraOncu: o })} />
      </Grup>
      <AffilateAyarlari id="satis" a={a} g={g} />
      </>
    );
  if (rol === 'kadrolu')
    return (
      <Grup baslik={kosul === 'lider' ? 'Ekip lideri' : 'Saha personeli'}>
        <Girdi label="Aylık maaş" birim="₺" step={1000} value={a.maas} onChange={(v) => g({ maas: v })} />
        <Girdi label="Kota, maaşın kaç katı?" step={0.5} value={a.sahaKotaCarpan} onChange={(v) => g({ sahaKotaCarpan: v })} />
        <Girdi label="Kota sonrası prim" birim="₺ / satış" step={100} value={a.sahaPrim} onChange={(v) => g({ sahaPrim: v })} />
        <Girdi label="Bu ay satılan paket" value={a.kadroluSatis} onChange={(v) => g({ kadroluSatis: v })} />
        {kosul === 'lider' ? (
          <>
            <Girdi label="Liderlik maaş farkı" birim="₺" step={1000} value={a.liderEk} onChange={(v) => g({ liderEk: v })} />
            <Girdi label="Ekip satışı başına pay" birim="₺" step={50} value={a.liderPay} onChange={(v) => g({ liderPay: v })} />
            <Girdi label="Ekibin bu ayki satışı" value={a.liderEkipSatis} onChange={(v) => g({ liderEkipSatis: v })} />
          </>
        ) : null}
      </Grup>
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
  if (rol === 'cozum' && kosul === 'yonlendirme')
    return (
      <Grup baslik="Yönlendirme">
        {musteri('Yılda getirdiği müşteri')}
        <Girdi label="Komisyon oranı" yuzdeMi value={a.yonlendirmeOran} onChange={(v) => g({ yonlendirmeOran: Math.min(1, v) })} />
        <Girdi label="Komisyonlu ödenmiş ay" birim="ay" value={a.yonlendirmeAy} onChange={(v) => g({ yonlendirmeAy: v })} />
      </Grup>
    );
  if (rol === 'cozum' && kosul === 'gelistirme')
    return (
      <Grup baslik="Satıcı geliştirme">
        {musteri('Yılda geliştirdiği satıcı')}
        <Girdi label="Komisyon oranı" yuzdeMi value={a.gelistirmeOran} onChange={(v) => g({ gelistirmeOran: Math.min(1, v) })} />
        <Girdi label="Komisyonlu ay" birim="ay" value={a.gelistirmeAy} onChange={(v) => g({ gelistirmeAy: v })} />
      </Grup>
    );
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
        <Girdi label="Yılda en çok" birim="tavsiye" value={a.tavsiyeSinir} onChange={(v) => g({ tavsiyeSinir: v })} />
      </Grup>
      <AffilateAyarlari id="ayse" a={a} g={g} />
      </>
    );
  return null;
}

/**
 * Rol ayarları (kullanıcı kararı 2026-11-03: dört Pazarlama sayfası tek sayfada). Önce koşul seti seçilir: ana program ya
 * da Temsilci ağı, İş ortaklığı, Affilate sayfalarından gelen set. Seçim kutusu yerinde kalır; altındaki değerler değişir.
 */
function RolAyarlari({ rol, a, g }: { rol: RolId; a: Ayar; g: (p: Partial<Ayar>) => void }) {
  const liste = kosulListesi(a, rol);
  const kosul = seciliKosul(a, rol).id;
  return (
    <>
      {liste.length > 1 ? (
        <Grup baslik="Koşul seti">
          <Sec<string>
            label="Hangi koşullarla çalışır?"
            value={kosul}
            options={liste.map((k) => ({ id: k.id, name: k.ad, not: k.kaynak }))}
            onChange={(v) => g({ kosul: { ...a.kosul, [rol]: v } })}
          />
        </Grup>
      ) : null}
      <div className="so2-gecis" key={kosul}>
        {kosul === 'ana' ? <AnaAyarlari rol={rol} a={a} g={g} /> : <KosulAyarlari rol={rol} kosul={kosul} a={a} g={g} />}
      </div>
    </>
  );
}

function OrtakAyarlar({ a, g, ana }: { a: Ayar; g: (p: Partial<Ayar>) => void; ana: boolean }) {
  return (
    <>
      {ana ? (
      <Grup baslik={a.model === 'oran' ? 'Ortağın işine göre komisyon oranı' : 'Her satışa sabit tutar'}>
        {a.model === 'oran' ? (
          (['A', 'B', 'C'] as Seviye[]).map((s) => <Girdi key={s} label={({ A: 'Yalnız tanıştırırsa', B: 'Ürünü de gösterirse', C: 'Satışı kendisi kapatırsa' } as Record<Seviye, string>)[s]} yuzdeMi value={a.oran[s]} onChange={(v) => g({ oran: { ...a.oran, [s]: v } })} />)
        ) : (
          <Girdi label="Yıllık paket başına" birim="₺" step={100} value={a.sabit} onChange={(v) => g({ sabit: v })} />
        )}
      </Grup>
      ) : null}
      <Grup baslik="Fiyat">
        {a.marka === 'istoc' ? (
          <>
            <Girdi label="Aylık fiyat" birim="€" value={a.istocAyEur} onChange={(v) => g({ istocAyEur: v })} />
            <Girdi label="1 euro kaç ₺?" step={0.1} value={a.kur} onChange={(v) => g({ kur: v })} />
            <Girdi label="Yıllık pakette kaç ayın ücreti ödenir?" value={a.istocYilAy} onChange={(v) => g({ istocYilAy: v })} />
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
      {ana ? (
        <Grup baslik="Ortağın kazancının ödenmesi">
          <Girdi label="İlk ödeme" yuzdeMi value={a.ilkOdeme} onChange={(v) => g({ ilkOdeme: Math.min(1, v) })} />
          <Girdi label="İlk ödeme kaçıncı günde?" value={a.ilkGun} onChange={(v) => g({ ilkGun: v })} />
          <Girdi label="Kalan ödeme kaçıncı günde?" value={a.kalanGun} onChange={(v) => g({ kalanGun: v })} />
        </Grup>
      ) : null}
    </>
  );
}

/** Segika fiyat özeti: paket, çalışan ve ortalama indirim. */
function segikaOzet(a: Ayar) {
  const s = segikaAylik(a);
  const indirim = s.listeFiyati > 0 ? 1 - s.toplam / s.listeFiyati : 0;
  return `${PAKET_ADI[a.segikaPaket]}, ${new Intl.NumberFormat('tr-TR').format(s.kisi)} çalışan, aylık ${tl(s.toplam)}${indirim > 0.0005 ? `, indirim ${yuzde(indirim)}` : ''}`;
}

/** Diğer sayfalardan gelen koşul setinin sonucu: kaynak, büyük sonuç, dönemler, hesap ve kurallar. */
function KosulPaneli({ a, ks, kaynak, ek }: { a: Ayar; ks: KosulSonuc; kaynak: string; ek?: ReactNode }) {
  return (
    <>
      <p className="so2-kaynak">Koşulların kaynağı: {kaynak} sayfası</p>
      <Sonuc
        etiket={ks.etiket}
        deger={ks.deger}
        aciklama={
          <>
            {ks.aciklama}
            {ks.bize ? <span className="so2-bize">{ks.bize}</span> : null}
          </>
        }
      />
      {ek}
      {ks.donemler.length ? <Donemler satirlar={ks.donemler} /> : null}
      {ks.hesap.length ? <Hesap baslik="Hesap" satirlar={[...fiyatSatirlari(a), ...ks.hesap]} /> : null}
      <Kurallar maddeler={ks.kurallar} />
    </>
  );
}

/* ---------- Sayfa ---------- */

/** Sürüm seçicisi dışarıdan gelir (src/views/SatisOrtakligiSurumleri.tsx). */
export function SatisOrtakligiV1({ surum }: { surum: ReactNode }) {
  const duzen = useYapisikSutunlar();
  const [proje, setProje] = useState<Marka>(() => typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('proje') === 'segika' ? 'segika' : 'istoc');
  const { ayar: a, guncelle, sifirla, sync, store, inputError } = usePersonaAyar(proje);
  const g = (patch: Partial<Ayar>) => { if (patch.marka) { setProje(patch.marka); const url = new URL(window.location.href); url.searchParams.set('proje', patch.marka); history.replaceState(null, '', url); } else guncelle(patch); };
  const [rol, setRol] = useState<RolId>(() => {
    const value = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('rol') : null;
    return (['oncu', 'kadrolu', 'cozum', 'tavsiye', 'elci'] as RolId[]).find((r) => r === value) ?? 'oncu';
  });
  const serit = useSeciliSekmeGorunur(rol);
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
  const ozetBirim: Record<RolId, string> = { oncu: '/ ay', kadrolu: '/ ay', cozum: '/ yıl', tavsiye: 'ücretsiz kullanım', elci: '/ ay' };
  // Ana program dışındaki koşul setinde sekme özeti o setin sonucudur.
  for (const id of Object.keys(ozet) as RolId[]) {
    const k = kosulSonucu(a, id);
    if (k) {
      ozet[id] = k.ozet;
      ozetBirim[id] = k.ozetBirim;
    }
  }
  const ks = kosulSonucu(a, rol);
  const kosulTanim = seciliKosul(a, rol);
  return (
    <div className="so2">
      <PageHeader title="Satış ortaklığı programı" purpose="Bu sayfa beş ortak rolünü ve her rolün kazancını gösterir." />

      {surum}
      <PersonaSyncStatus sync={sync} store={store} inputError={inputError} />
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
            { id: 'oran', name: 'Satış tutarının yüzdesi' },
            { id: 'sabit', name: 'Her satışa sabit tutar' },
          ]}
          onChange={(v) => g({ model: v })}
        />

        <p className="so2-fiyat">
          Yıllık paket <strong>{tl(yillik)}</strong>
          <span>{a.marka === 'istoc' ? `${a.istocAyEur} € × ${a.istocYilAy} ay × ${sayi(a.kur)} ₺` : segikaOzet(a)}</span>
        </p>
      </div>

      <div className="so2-duzen" ref={duzen}>
        <aside className="so2-ayarlar" aria-label="Ayarlar">
          <div className="so2-ayarlar-ust">
            <p className="so2-ayarlar-baslik">Ayarlar</p>
            <button type="button" className="so2-sifirla" onClick={() => { if (window.confirm('Bu projenin ortak ayarları varsayılana dönecek. Devam edilsin mi?')) sifirla(); }}>
              Başa dön
            </button>
            <p className="so2-ayarlar-ozet">
              {secili.ad}{' '}
              <strong>
                <Canli deger={ozet[rol]}>{ozet[rol]}</Canli>
              </strong>{' '}
              {ozetBirim[rol]}
            </p>
          </div>
          <RolAyarlari rol={rol} a={a} g={g} />
          <OrtakAyarlar a={a} g={g} ana={!ks} />
        </aside>
        <div className="so2-sag">
          <div className="so2-roller" role="tablist" ref={serit} aria-label="Roller">
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
          <div className="so2-gecis" key={`${a.marka}-${rol}-${kosulTanim.id}`}>
          <h2 className="so2-baslik">{secili.ad}</h2>
          <p className="so2-kim">{secili.kim}</p>
          <Kimler liste={secili.kimler} />
          {ks ? (
            <KosulPaneli a={a} ks={ks} kaynak={kosulTanim.kaynak} ek={rol === 'oncu' && kosulTanim.id === 'ag' ? <AgDiyagrami a={a} /> : affilateModeli(a, rol) ? <AffilateMotoru a={a} id={affilateModeli(a, rol)!} /> : null} />
          ) : (
            <>
              {rol === 'oncu' ? <Oncu a={a} /> : rol === 'kadrolu' ? <Kadrolu a={a} /> : rol === 'cozum' ? <Cozum a={a} /> : rol === 'tavsiye' ? <Tavsiye a={a} /> : <Elci a={a} />}
              <Donemler satirlar={donemKazanci(a, rol)} />
              <RolHesabi a={a} rol={rol} />
              <Kurallar maddeler={secili.kurallar} />
            </>
          )}
          </div>
        </section>
        </div>
      </div>
      <KararJson veri={kararVerisi(a, rol)} dosyaAdi="satis-ortakligi" />
    </div>
  );
}
