import { useEffect, useState } from 'react';
import { AppFrame } from '../components/AppFrame';
import { PageHeader } from '../components/PageHeader';
import { Choice } from '../components/ui';
import { Girdi, Grup, Kimler, Kurallar, Sec, Sonuc } from '../components/sadeKit';
import {
  ASAMA_ADI,
  ASAMA_SURE,
  PAKET_ADI,
  SEVIYE_ADI,
  VARSAYILAN_AYAR,
  aylikFiyat,
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
  return <Sec<Seviye> label="Ortağın yaptığı iş" value={value} options={(['A', 'B', 'C'] as Seviye[]).map((s) => ({ id: s, name: SEVIYE_ADI[s] }))} onChange={onChange} />;
}

/* ---------- Rol panelleri: sonuç + görsel + kurallar ---------- */

function Oncu({ a }: { a: Ayar }) {
  const birim = satisKazanci(a, a.oncuSeviye);
  const enIyi = a.oncuAsama[3] * birim;
  return (
    <>
      <Sonuc etiket="Usta aşamasında aylık kazanç" deger={tl(enIyi)} aciklama={`Ayda ${a.oncuAsama[3]} yıllık paket satarsa kazanır. Her satış ${tl(birim)} getirir.`} />
      <ol className="so2-asamalar">
        {ASAMA_ADI.map((ad, i) => (
          <li key={ad} className="so2-asama" data-aktif={a.oncuAsama[i] > 0 ? '' : undefined}>
            <span className="so2-asama-sure">{ASAMA_SURE[i]}</span>
            <span className="so2-asama-ad">{ad}</span>
            <span className="so2-asama-hedef">{a.oncuAsama[i] ? `Ayda ${a.oncuAsama[i]} satış` : 'Satış beklenmez'}</span>
            <span className="so2-asama-tutar">{tl(a.oncuAsama[i] * birim)}</span>
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
      <Sonuc etiket="Bu ayki toplam kazanç" deger={tl(k.toplam)} aciklama={`${tl(a.maas)} maaş alır. Kotayı aştığı için ${tl(k.prim)} prim eklenir.`} />
      <div className="so2-kota">
        <div className="so2-kota-ust">
          <span>Ciro {tl(k.ciro)}</span>
          <span>Kota {tl(k.kota)}</span>
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
        etiket="Yıllık kazanç"
        deger={tl(birim * a.cozumMusteri)}
        aciklama={`Yılda ${a.cozumMusteri} müşteri getirirse kazanır. Her müşteri ${tl(birim)} getirir${a.model === 'oran' ? `, bu paket bedelinin ${yuzde(a.cozumOran)}’idir` : ''}.`}
      />
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
      <Sonuc etiket="Tavsiye eden kazanır" deger={tl(ay * a.krediAy)} aciklama={`${a.krediAy} ay ücretsiz kullanım kazanır. Bu, aylık bedelin ${a.krediAy} katıdır.`} />
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
  return <Sonuc etiket="Aylık kazanç" deger={tl(birim * a.elciSatis)} aciklama={`Bağlantısından ayda ${a.elciSatis} yıllık paket satılırsa kazanır. Her satış ${tl(birim)} getirir.`} />;
}

/* ---------- Ayarlar: seçili rolün değerleri önce ---------- */

function RolAyarlari({ rol, a, g }: { rol: RolId; a: Ayar; g: (p: Partial<Ayar>) => void }) {
  if (rol === 'oncu')
    return (
      <Grup baslik="Hedefler">
        <SeviyeSec value={a.oncuSeviye} onChange={(s) => g({ oncuSeviye: s })} />
        {ASAMA_ADI.map((ad, i) => (
          <Girdi key={ad} label={`${ad}: aylık satış`} value={a.oncuAsama[i]} onChange={(v) => g({ oncuAsama: a.oncuAsama.map((x, j) => (j === i ? v : x)) as Ayar['oncuAsama'] })} />
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
        <Girdi label="Komisyon oranı" yuzdeMi value={a.cozumOran} onChange={(v) => g({ cozumOran: Math.min(1, v) })} />
        <Girdi label="Yılda getirdiği müşteri" value={a.cozumMusteri} onChange={(v) => g({ cozumMusteri: v })} />
        <Girdi label="Ücretsiz eğitim" birim="saat / yıl" value={a.egitimSaat} onChange={(v) => g({ egitimSaat: v })} />
        <Girdi label="Ek eğitim ücreti" birim="₺ / saat" step={100} value={a.egitimSaatUcret} onChange={(v) => g({ egitimSaatUcret: v })} />
        <Girdi label="Ek eğitim" birim="saat" value={a.ekEgitimSaat} onChange={(v) => g({ ekEgitimSaat: v })} />
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
      <Grup baslik={a.model === 'oran' ? 'Komisyon oranları' : 'Satış başı tutar'}>
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
            <Sec<SegikaPaket> label="Paket" value={a.segikaPaket} options={(Object.keys(PAKET_ADI) as SegikaPaket[]).map((p) => ({ id: p, name: PAKET_ADI[p] }))} onChange={(v) => g({ segikaPaket: v })} />
            <Girdi label={`${PAKET_ADI[a.segikaPaket]}: ${a.blok} çalışan, aylık`} birim="₺" step={50} value={a.segikaFiyat[a.segikaPaket]} onChange={(v) => g({ segikaFiyat: { ...a.segikaFiyat, [a.segikaPaket]: v } })} />
            <Girdi label="Fiyat bloğu" birim="çalışan" min={1} value={a.blok} onChange={(v) => g({ blok: v })} />
          </>
        )}
      </Grup>
      {a.marka === 'segika' ? (
        <Grup baslik="Büyük firma indirimi">
          {a.kademeler.map((k, i) => (
            <div key={i} className="so2-kademe">
              <Girdi
                label={i === a.kademeler.length - 1 ? 'Sonrası' : `${i === 0 ? 1 : a.kademeler[i - 1].ust + 1} çalışandan`}
                birim="kişiye kadar"
                value={k.ust}
                onChange={(v) => g({ kademeler: a.kademeler.map((x, j) => (j === i ? { ...x, ust: v } : x)) })}
              />
              <Girdi label="İndirim" yuzdeMi value={k.indirim} onChange={(v) => g({ kademeler: a.kademeler.map((x, j) => (j === i ? { ...x, indirim: Math.min(1, v) } : x)) })} />
            </div>
          ))}
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
      <PageHeader title="Satış ortaklığı programı" purpose="Beş ortak rolünün kim olduğunu ve ne kazandığını gösterir. Sağdaki değerleri değiştirince sonuçlar hemen güncellenir." />

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
        {a.marka === 'segika' ? (
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
        ) : null}
        <p className="so2-fiyat">
          Yıllık paket <strong>{tl(yillik)}</strong>
          <span>{a.marka === 'istoc' ? `${a.istocAyEur} € × ${a.istocYilAy} ay` : segikaOzet(a)}</span>
        </p>
      </div>

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

      <div className="so2-duzen">
        <section className="so2-panel" id="so2-panel" role="tabpanel" aria-labelledby={`so2-sekme-${rol}`}>
          <h2 className="so2-baslik">{secili.ad}</h2>
          <p className="so2-kim">{secili.kim}</p>
          <Kimler liste={secili.kimler} />
          {rol === 'oncu' ? <Oncu a={a} /> : rol === 'kadrolu' ? <Kadrolu a={a} /> : rol === 'cozum' ? <Cozum a={a} /> : rol === 'tavsiye' ? <Tavsiye a={a} /> : <Elci a={a} />}
          <Kurallar maddeler={[...secili.kurallar, `İlk ödeme ${yuzde(a.ilkOdeme)}, tahsilattan ${a.ilkGun} gün sonra. Kalanı ${a.kalanGun}. günde ödenir.`]} />
        </section>
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
      </div>
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
