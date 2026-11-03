import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '../components/PageHeader';
import { Choice } from '../components/ui';
import { Girdi, Grup, Kurallar, Sec, Sonuc } from '../components/sadeKit';
import { ORTAK_ADLARI, baslangicOrtaklar, karsilastir, type OrtakId, type OrtakKurali, type Politika, type Sonuc as MotorSonuc } from '../data/affilate';
import { POLITIKA_ADI, baslangicKurgu, senaryoKur } from '../data/affilateKurgu';

/**
 * Affilate sade görünüm (kullanıcı kararı 2026-11-03): aynı satış için üç ortak modelinin ortağa ne kazandırdığı.
 * Sıra: ödeme ve süre → model sekmeleri (her birinde toplam) → seçili model (kim, sonuç, yıllara dağılım, kurallar)
 * ve sağda o modelin ayarları. Hesap mevcut motordan (`karsilastir`); ayrıntılı simülasyon #model adresinde.
 */

const ANAHTAR = 'segika-affilate-sade-v1';
const IDLER: OrtakId[] = ['ayse', 'satis', 'cozum'];

interface Sade {
  odeme: 'paket' | 'aylik';
  ufukAy: number;
  adet: number;
  aylikTl: number;
  kat: number;
  ortaklar: Record<OrtakId, { oranlar: number[]; sonraki: number; politika: Politika }>;
}

const baslangic = (): Sade => {
  const o = baslangicOrtaklar();
  const al = (k: OrtakKurali) => ({ oranlar: k.donemler.map((d) => d.oranBp / 10_000), sonraki: k.sonrakiOranBp / 10_000, politika: k.politika });
  return { odeme: 'paket', ufukAy: 36, adet: 1, aylikTl: 2_600, kat: 12, ortaklar: { ayse: al(o.ayse), satis: al(o.satis), cozum: al(o.cozum) } };
};

const METIN: Record<OrtakId, { ad: string; kisa: string; kim: string }> = {
  ayse: { ad: 'Tek seferlik tavsiye', kisa: 'İlk faturadan bir kez', kim: 'Ayşe müşteriyi bize tanıştırır. Müşterinin ilk faturasından bir kez komisyon alır.' },
  satis: { ad: ORTAK_ADLARI.satis, kisa: 'Müşteri ödedikçe, azalan oran', kim: 'Satış ortağı müşteriyi getirir ve satışı yapar. Müşteri ödedikçe her yıl azalan oranla kazanır.' },
  cozum: { ad: ORTAK_ADLARI.cozum, kisa: 'Destek de verir, oranı yüksek', kim: 'Çözüm ortağı müşteriye destek de verir. Bu yüzden oranı yüksektir. Destek vermediği ay kazanmaz.' },
};

const tl = (kurus: number) => `${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(Math.round(kurus / 100))} ₺`;
const yuzde = (v: number) => `%${new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(v * 100)}`;

function useSade() {
  const [s, setS] = useState<Sade>(baslangic);
  useEffect(() => {
    try {
      const k = localStorage.getItem(ANAHTAR);
      if (k) setS({ ...baslangic(), ...(JSON.parse(k) as Partial<Sade>) });
    } catch {
      /* başlangıç değerleri */
    }
  }, []);
  const g = (p: Partial<Sade>) =>
    setS((o) => {
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
    setS(baslangic());
  };
  return { s, g, sifirla };
}

/** Sade girdileri motor kurgusuna çevirir ve üç modeli aynı satış için hesaplar. */
function hesapla(s: Sade): Record<OrtakId, MotorSonuc> {
  const k = baslangicKurgu();
  k.ufukAy = s.ufukAy;
  k.fiyat = { ...k.fiyat, kaynak: 'kat', aylik: Math.round(s.aylikTl * 100), kat: s.kat, hizmetAy: 12, paraBirimi: 'TRY' };
  for (const id of IDLER) {
    const o = k.ortaklar[id];
    const a = s.ortaklar[id];
    o.donemler = o.donemler.map((d, i) => ({ ...d, oranBp: Math.round((a.oranlar[i] ?? 0) * 10_000) }));
    o.sonrakiOranBp = Math.round(a.sonraki * 10_000);
    o.politika = a.politika;
  }
  k.musteriler = [{ ...k.musteriler[0], adet: Math.max(1, Math.round(s.adet)), odeme: s.odeme }];
  return karsilastir(senaryoKur(k), k.musteriler[0].id);
}

const toplam = (r: MotorSonuc) => r.ortaklar.reduce((n, o) => n + o.planlanan, 0);
const segikayaKalan = (r: MotorSonuc) => r.segika.reduce((n, x) => n + x.komisyonSonrasi, 0);

/** Hakedişin hizmet yıllarına dağılımı (müşterinin 1., 2., 3. hizmet yılı; ödeme ayı kaysa da yılı değişmez). */
function yillar(r: MotorSonuc, ufukAy: number) {
  const n = Math.max(1, Math.ceil(ufukAy / 12));
  const dizi = Array.from({ length: n }, () => 0);
  for (const h of r.hareketler) {
    if (h.tur !== 'hakedis' && h.tur !== 'duzeltme') continue;
    const i = Math.floor((h.hizmetAyi ?? 0) / 12);
    if (i >= 0 && i < n) dizi[i] += h.tutar;
  }
  return dizi;
}

function ModelAyarlari({ id, s, g }: { id: OrtakId; s: Sade; g: (p: Partial<Sade>) => void }) {
  const a = s.ortaklar[id];
  const yaz = (p: Partial<Sade['ortaklar'][OrtakId]>) => g({ ortaklar: { ...s.ortaklar, [id]: { ...a, ...p } } });
  return (
    <Grup baslik="Oranlar">
      {id === 'ayse' ? (
        <Girdi label="İlk faturadan" yuzdeMi value={a.oranlar[0] ?? 0} onChange={(v) => yaz({ oranlar: a.oranlar.map((x, i) => (i === 0 ? v : x)) })} />
      ) : (
        <>
          {a.oranlar.map((o, i) => (
            <Girdi key={i} label={`${i + 1}. yıl`} yuzdeMi value={o} onChange={(v) => yaz({ oranlar: a.oranlar.map((x, j) => (j === i ? v : x)) })} />
          ))}
          <Girdi label="Sonraki yıllar" yuzdeMi value={a.sonraki} onChange={(v) => yaz({ sonraki: v })} />
        </>
      )}
      <Sec<Politika> label="Ortağa ödeme" value={a.politika} options={(Object.keys(POLITIKA_ADI) as Politika[]).map((p) => ({ id: p, name: POLITIKA_ADI[p] }))} onChange={(v) => yaz({ politika: v })} />
    </Grup>
  );
}

export function AffilateBasit() {
  const { s, g, sifirla } = useSade();
  const [secili, setSecili] = useState<OrtakId>('satis');
  const sonuc = useMemo(() => hesapla(s), [s]);
  const r = sonuc[secili];
  const dagilim = yillar(r, s.ufukAy);
  const enBuyuk = Math.max(1, ...dagilim);
  const yillik = s.aylikTl * s.kat;
  return (
    <div className="so2">
      <PageHeader title="Affilate" purpose="Aynı satış için üç ortaklık modelinin ortağa ne kazandırdığını gösterir. Soldaki değerleri değiştirince sonuç hemen güncellenir." />

      <div className="so2-arac">
        <Choice<'paket' | 'aylik'>
          label="Müşteri öder"
          value={s.odeme}
          options={[
            { id: 'paket', name: 'Yıllık paket' },
            { id: 'aylik', name: 'Aylık' },
          ]}
          onChange={(v) => g({ odeme: v })}
        />
        <Choice<'12' | '24' | '36'>
          label="Süre"
          value={String(s.ufukAy) as '12' | '24' | '36'}
          options={[
            { id: '12', name: '1 yıl' },
            { id: '24', name: '2 yıl' },
            { id: '36', name: '3 yıl' },
          ]}
          onChange={(v) => g({ ufukAy: Number(v) })}
        />
        <p className="so2-fiyat">
          Yıllık paket <strong>{tl(yillik * 100)}</strong>
          <span>
            Aylık {tl(s.aylikTl * 100)} × {s.kat} ay · {s.adet} müşteri
          </span>
        </p>
      </div>

      <div className="so2-duzen">
        <aside className="so2-ayarlar" aria-label="Ayarlar">
          <div className="so2-ayarlar-ust">
            <p className="so2-ayarlar-baslik">Ayarlar</p>
            <button type="button" className="so2-sifirla" onClick={sifirla}>
              Başa dön
            </button>
          </div>
          <ModelAyarlari id={secili} s={s} g={g} />
          <Grup baslik="Satış">
            <Girdi label="Müşteri sayısı" min={1} value={s.adet} onChange={(v) => g({ adet: Math.max(1, v) })} />
            <Girdi label="Aylık fiyat" birim="₺" step={50} value={s.aylikTl} onChange={(v) => g({ aylikTl: v })} />
            <Girdi label="Yıllık paket" birim="ay bedeli" min={1} value={s.kat} onChange={(v) => g({ kat: Math.max(1, v) })} />
          </Grup>
        </aside>
        <div className="so2-sag">
          <div className="so2-roller so2-roller-3" role="tablist" aria-label="Ortaklık modelleri">
        {IDLER.map((id, i) => (
          <button
            key={id}
            type="button"
            role="tab"
            id={`af-sekme-${id}`}
            aria-selected={id === secili}
            aria-controls="af-panel"
            tabIndex={id === secili ? 0 : -1}
            className="so2-rol"
            data-edge={id === secili ? 'top' : undefined}
            onClick={() => setSecili(id)}
            onKeyDown={(e) => {
              const j = e.key === 'ArrowRight' ? (i + 1) % 3 : e.key === 'ArrowLeft' ? (i + 2) % 3 : -1;
              if (j < 0) return;
              e.preventDefault();
              setSecili(IDLER[j]);
              document.getElementById(`af-sekme-${IDLER[j]}`)?.focus();
            }}
          >
            <span className="so2-rol-no">{i + 1}</span>
            <span className="so2-rol-ad">{METIN[id].ad}</span>
            <span className="so2-rol-kisa">{METIN[id].kisa}</span>
            <span className="so2-rol-tutar">
              {tl(toplam(sonuc[id]))} <small>/ {s.ufukAy / 12} yıl</small>
            </span>
          </button>
        ))}
      </div>
          <section className="so2-panel" id="af-panel" role="tabpanel" aria-labelledby={`af-sekme-${secili}`}>
          <div className="so2-gecis" key={secili}>
          <h2 className="so2-baslik">{METIN[secili].ad}</h2>
          <p className="so2-kim">{METIN[secili].kim}</p>
          <Sonuc
            etiket={`${s.ufukAy / 12} yılda ortağın kazancı`}
            deger={tl(toplam(r))}
            aciklama={`${s.adet} müşteri ${s.odeme === 'paket' ? 'yıllık paket' : 'aylık abonelik'} alırsa ortak bu tutarı kazanır. Segika’ya ${tl(segikayaKalan(r))} kalır.`}
          />
          <ol className="so2-asamalar" data-n={dagilim.length}>
            {dagilim.map((t, i) => (
              <li key={i} className="so2-asama" data-aktif={t > 0 ? '' : undefined}>
                <span className="so2-asama-sure">{i + 1}. yıl</span>
                <span className="so2-asama-ad">{secili === 'ayse' ? (i === 0 ? `Oran ${yuzde(s.ortaklar.ayse.oranlar[0] ?? 0)}` : 'Komisyon yok') : `Oran ${yuzde(s.ortaklar[secili].oranlar[i] ?? s.ortaklar[secili].sonraki)}`}</span>
                <svg className="so2-kota-cubuk" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true">
                  <rect className="so2-kota-iz" x="0" y="0" width="100" height="10" />
                  <rect className="so2-kota-dolgu" data-asti="" x="0" y="0" width={(t / enBuyuk) * 100} height="10" />
                </svg>
                <span className="so2-asama-tutar">{tl(t)}</span>
              </li>
            ))}
          </ol>
          <Kurallar maddeler={[`Ödeme: ${POLITIKA_ADI[s.ortaklar[secili].politika]}.`, 'Müşteri ödemezse komisyon oluşmaz.', 'İade olursa komisyon geri alınır.']} />
          <p className="so2-ayrinti">
            <a className="text-link" href="#model">
              Ayrıntılı hesabı aç
            </a>
          </p>
          </div>
        </section>
        </div>
      </div>
    </div>
  );
}
