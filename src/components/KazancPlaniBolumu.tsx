import { createContext, type CSSProperties, type ReactNode, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { Checkbox, Modal, NumberInput, Tabs } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useMotionMs } from '../lib/motion';
import { Choice } from './ui';
import { Section } from './ui';
import { Grup } from './sadeKit';
import {
  KOTA_KURALI, kotaTamam, projeVarsayilani, donemAdi, kuralListesi, ornekHesap, KATKI_TURLERI, BOLUSME_ADI, BOLUSME_SORUSU, KATKI_ADI, MAAS_ARALIGI, SURE_SECENEKLERI, kadroluKota, kaliciJson, katkiOrani,
  paylasim, planOku, yillaraKazanc, type Bolusme, type Esik, type KatkiTuru, type KazancPlani, type SureAy,
} from '../data/kazancPlani';
import type { Marka, RolId } from '../data/satisOrtakligi';
import { num } from '../lib/format';
import '../styles/politikalar.css';

const tl = (n: number) => `${num(n)} ₺`;
const yuzde = (n: number) => `%${num(Math.round(n * 1000) / 10)}`;

/* Plan her proje için ayrı anahtarda, yalnız bu tarayıcıda saklanır. Aynı sayfadaki bütün okuyucular aynı değeri görür. */
// v2: kalıcı kurallar penceresi (17 Kasım 2026 Salı). Eski kayıt yeni başlangıç değerlerini ezmesin.
const anahtar = (proje: Marka) => `turksab-kazanc-plani-v2-${proje}`;
const dinleyiciler = new Set<() => void>();
const bellek = new Map<Marka, KazancPlani>();
function oku(proje: Marka): KazancPlani {
  let plan = bellek.get(proje);
  if (!plan) {
    try { plan = planOku(JSON.parse(localStorage.getItem(anahtar(proje)) ?? 'null'), proje); } catch { plan = projeVarsayilani(proje); }
    bellek.set(proje, plan);
  }
  return plan;
}
function yaz(proje: Marka, plan: KazancPlani) {
  bellek.set(proje, plan);
  try { localStorage.setItem(anahtar(proje), JSON.stringify(plan)); } catch { /* Değer bu sekmede kalır. */ }
  dinleyiciler.forEach((d) => d());
}
const abone = (d: () => void) => { dinleyiciler.add(d); return () => { dinleyiciler.delete(d); }; };

/** Sunucu çiziminde her proje kendi başlangıç planını kullanır. Nesne sabittir. */
const SUNUCU_PLANI: Record<Marka, KazancPlani> = { istoc: projeVarsayilani('istoc'), segika: projeVarsayilani('segika') };

export function useKazancPlani(proje: Marka) {
  const plan = useSyncExternalStore(abone, () => oku(proje), () => SUNUCU_PLANI[proje]);
  return { plan, guncelle: (degis: (p: KazancPlani) => void) => { const yeni = structuredClone(plan); degis(yeni); yaz(proje, yeni); } };
}

type Guncelle = ReturnType<typeof useKazancPlani>['guncelle'];
const PlanBaglami = createContext<{ plan: KazancPlani; guncelle: Guncelle; proje: Marka } | null>(null);
/** Alan kalıcı kurallar penceresinin içindeyse doğrudur. Pencere dışında kalıcı alanlar görünmez. */
const PencereBaglami = createContext(false);

/**
 * Kullanıcı kararı 17 Kasım 2026 Salı: kalıcı kural ana ekranda görünmez.
 * Yönetici kalıcı kuralı yalnız “KALICI KURALLAR” penceresinden değiştirir.
 */
function useGizli(kural?: string) {
  const b = useContext(PlanBaglami);
  const pencerede = useContext(PencereBaglami);
  return Boolean(kural && !pencerede && b?.plan.kalici.includes(kural));
}

/** Ana ekranda “Kalıcı kural” kutusu. Pencerede “Kalıcı kuraldan çıkarın” düğmesi. */
function Kalici({ kural, ad }: { kural: string; ad: string }) {
  const b = useContext(PlanBaglami);
  const pencerede = useContext(PencereBaglami);
  if (!b) return null;
  const cikar = () => b.guncelle((x) => { x.kalici = x.kalici.filter((k) => k !== kural); });
  if (pencerede) return <button type="button" className="pol-sekme pol-kz-cikar" aria-label={`${ad}: kalıcı kuraldan çıkarın`} onClick={cikar}>Kalıcı kuraldan çıkarın</button>;
  return <Checkbox label="Kalıcı kural" aria-label={`${ad} kalıcı kural`} checked={false}
    onChange={(e) => { if (e.currentTarget.checked) b.guncelle((x) => { x.kalici = [...x.kalici.filter((k) => k !== kural), kural]; }); }}
    classNames={{ root: 'applet-onay pol-kz-kalici', body: 'applet-onay-govde', input: 'applet-onay-kutu', label: 'applet-onay-ad', icon: 'applet-onay-ikon' }} />;
}

/** Boş bırakılabilen sayı kutusu. Yüzde alanında değer oran olarak saklanır. */
function Kutu({ label, value, onChange, yuzdeMi = false, bosOlur = false, birim, kural }: {
  label: string; value: Esik; onChange: (v: Esik) => void; yuzdeMi?: boolean; bosOlur?: boolean; birim?: string; kural?: string;
}) {
  if (useGizli(kural)) return null;
  const goster = value === null ? '' : yuzdeMi ? Math.round(value * 1000) / 10 : value;
  const kutu = <NumberInput className="so2-girdi" classNames={{ label: 'so2-girdi-ad', input: 'param-input so2-girdi-kutu' }}
    label={birim ? <>{label} <span className="so2-girdi-birim">{birim}</span></> : label}
    aria-label={label}
    value={goster}
    onChange={(v) => {
      if (v === '' && bosOlur) { onChange(null); return; }
      if (typeof v === 'number' && Number.isFinite(v) && v >= 0) onChange(yuzdeMi ? v / 100 : v);
    }}
    hideControls allowNegative={false} thousandSeparator="." decimalSeparator="," allowedDecimalSeparators={[',']} decimalScale={2}
    prefix={yuzdeMi ? '%' : undefined} max={yuzdeMi ? 100 : undefined} size="md" />;
  return kural ? <div className="pol-kz-alan">{kutu}<Kalici kural={kural} ad={label} /></div> : kutu;
}

/** Bütün alanları kalıcı olan grup ana ekranda çizilmez. */
function GrupVarsa({ baslik, kurallar, children }: { baslik: string; kurallar: string[]; children: ReactNode }) {
  const b = useContext(PlanBaglami);
  const pencerede = useContext(PencereBaglami);
  if (!pencerede && b && kurallar.every((k) => b.plan.kalici.includes(k))) return null;
  return <Grup baslik={baslik}>{children}</Grup>;
}

function Katki({ tur, plan, guncelle }: { tur: KatkiTuru; plan: KazancPlani; guncelle: Guncelle }) {
  const ad = KATKI_ADI[tur];
  const p = plan[tur];
  const ids = (alan: string, n: number) => Array.from({ length: n }, (_, i) => `${tur}.${alan}.${i}`);
  const hepsiKalici = [`${tur}.taban`, ...ids('kotaEsik', 3), ...ids('kotaArtis', 3), ...ids('gecmis', 4)].every((k) => plan.kalici.includes(k));
  return <div className="pol-kz-katki" data-katki={tur}>
    <p>{tur === 'tanistir'
      ? 'Müşteriyi bize yönlendirirsiniz. Satışı biz kapatırız. Müşteri satın alırsa pay kazanırsınız. Müşteri satın almazsa pay yoktur.'
      : 'Müşteriyi yalnız tanıştırmazsınız. Satışı da siz kapatırsınız. Onboarding de sizin işinizdir. Onboarding, yeni müşterinin kurulumu ve ilk eğitimidir. Müşteri satın alınca pay kazanırsınız.'}</p>
    <p className="pol-kz-burada" data-katki-burada={tur}>Şu an “{KATKI_SEKMESI[tur]}” sekmesi için değer giriyorsunuz.</p>
    {hepsiKalici && <p className="pol-kz-not">Bu sekmedeki bütün değerler kalıcı kuraldır. Değerleri “KALICI KURALLAR” düğmesinden yönetin.</p>}
    <GrupVarsa kurallar={[`${tur}.taban`]} baslik={`${ad} için cari ay oranı (1. ay ile 12. ay arası)`}>
      <Kutu label={`${ad} taban oranı`} value={p.taban} yuzdeMi kural={`${tur}.taban`} onChange={(v) => guncelle((x) => { x[tur].taban = v ?? 0; })} />
    </GrupVarsa>
    <GrupVarsa kurallar={ids('kotaEsik', 3)} baslik={`${ad} için aylık ciro kotaları`}>
      {p.kotaEsik.map((e, i) => <Kutu key={i} label={`${ad} K${i + 1} ciro eşiği`} birim="(₺)" value={e} bosOlur kural={`${tur}.kotaEsik.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaEsik[i] = v; })} />)}
    </GrupVarsa>
    {p.kotaEsik.some((e) => e === null) && <p className="pol-kz-not">Bazı kota eşikleri henüz belirlenmedi. Eşik boşsa o kotanın artışı uygulanmaz.</p>}
    <GrupVarsa kurallar={ids('kotaArtis', 3)} baslik={`${ad} için kota geçilince eklenen puan`}>
      {p.kotaArtis.map((a, i) => <Kutu key={i} label={`${ad} K${i + 1} artışı`} value={a} yuzdeMi kural={`${tur}.kotaArtis.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaArtis[i] = v ?? 0; })} />)}
    </GrupVarsa>
    <GrupVarsa kurallar={ids('gecmis', 4)} baslik={`${ad} için 13. aydan sonraki oranlar`}>
      {p.gecmis.map((g, i) => <Kutu key={i} label={`${ad} ${donemAdi(i)} komisyonu`} value={g} yuzdeMi kural={`${tur}.gecmis.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].gecmis[i] = v ?? 0; })} />)}
    </GrupVarsa>
  </div>;
}

/** Bir katkı türünün örnek satıştaki sonucu. */
function KatkiSonucu({ tur, plan }: { tur: KatkiTuru; plan: KazancPlani }) {
  const { oran, kota } = katkiOrani(plan, tur, plan.ornekCiro);
  return <section className="pol-kz-kart" aria-labelledby={`pol-kz-sonuc-${tur}`}>
    <h4 id={`pol-kz-sonuc-${tur}`}>{KATKI_SEKMESI[tur]}</h4>
    <p className="pol-kz-not">Bu ayki kazancınız</p>
    <p className="pol-kz-rakam" data-kazanc={`${tur}-tutar`}>{tl(Math.round(plan.ornekCiro * oran))}</p>
    <dl className="pol-kz-sonuc pol-kz-sonuc-satir">
      <div><dt>Hesap</dt><dd data-kazanc={`${tur}-bu-yil`}>{tl(plan.ornekCiro)} × {yuzde(oran)} = {tl(Math.round(plan.ornekCiro * oran))}</dd></div>
      <div><dt>Geçerli oran</dt><dd data-kazanc={`${tur}-oran`}>{yuzde(oran)}</dd></div>
      <div><dt>Ulaşılan kota</dt><dd>{kota ? `K${kota}` : 'Kota yok'}</dd></div>
    </dl>
    <p>Cari ay, satıştan sonraki ilk 12 aydır. Müşteri sonraki aylarda da aynı aylık ciroyu yaparsa şu tutarları alırsınız:</p>
    {!kotaTamam(plan, tur, plan.ornekCiro) && <p className="pol-kz-uyari" data-kota-kurali={tur}>Aylık ciro K1 kotasının altında. Kota tamamlanmadığı için 13. aydan sonra pay yoktur.</p>}
    <ul className="pol-kz-yillar" data-kazanc={`${tur}-yillar`}>
      {yillaraKazanc(plan, tur, plan.ornekCiro).map((s) => <li key={s.yil}>{s.donem}: {yuzde(s.oran)} ile her ay {tl(s.tutar)}</li>)}
    </ul>
  </section>;
}

const KATKI_SEKMESI: Record<KatkiTuru, string> = { tanistir: 'Yalnız tanıştırırsanız', kapatir: 'Satışı kapatırsanız' };
const SEKME_SINIFI = { list: 'pol-sekme-listesi', tab: 'pol-sekme', panel: 'pol-sekme-paneli' };

/** Karar kartı: üstte soru, ortada seçim, altta “Kalıcı kural”. Her karar ayrı yüzeyde durur. */
function KararKarti({ no, baslik, aciklama, children }: { no: string; baslik: string; aciklama?: string; children: ReactNode }) {
  const pencerede = useContext(PencereBaglami);
  const kimlik = `pol-kz-karar-${no}${pencerede ? '-pencere' : ''}`;
  return <section className="pol-kz-karar" aria-labelledby={kimlik}>
    <h4 id={kimlik}>{baslik}</h4>
    {aciklama && <p className="pol-kz-not">{aciklama}</p>}
    {children}
  </section>;
}

/** Seçmeli düğme grubu. APG radyo grubu gibi çalışır: ok tuşları, Home ve End seçimi taşır. */
function SureSecimi({ value, onChange }: { value: SureAy; onChange: (v: SureAy) => void }) {
  const pencerede = useContext(PencereBaglami);
  const adKimligi = pencerede ? 'pol-kz-sure-ad-pencere' : 'pol-kz-sure-ad';
  const grup = useRef<HTMLDivElement>(null);
  const odakla = useRef(false);
  // Seçilen düğme, çizimden hemen sonra odağı alır. Sonraki tuş doğru düğmeden başlar.
  useLayoutEffect(() => {
    if (!odakla.current) return;
    odakla.current = false;
    grup.current?.querySelector<HTMLElement>(`[data-ay="${value}"]`)?.focus();
  }, [value]);
  const sec = (i: number) => {
    const n = SURE_SECENEKLERI.length;
    const yeni = SURE_SECENEKLERI[(i + n) % n];
    if (yeni === value) return;
    odakla.current = true;
    onChange(yeni);
  };
  const tus = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const hedef = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1, Home: 0, End: SURE_SECENEKLERI.length - 1 }[e.key];
    if (hedef === undefined) return;
    e.preventDefault();
    sec(hedef);
  };
  return <div className="pol-kz-sure">
    <p id={adKimligi} className="pol-kz-gizli">Tanıştırmanın geçerlilik süresi</p>
    <div ref={grup} role="radiogroup" aria-labelledby={adKimligi} className="pol-sekme-listesi pol-kz-sure-liste">
      {SURE_SECENEKLERI.map((ay, i) => <button key={ay} type="button" role="radio" aria-checked={ay === value} data-ay={ay}
        tabIndex={ay === value ? 0 : -1} className="pol-sekme" onClick={() => sec(i)} onKeyDown={(e) => tus(e, i)}>{ay} ay</button>)}
    </div>
  </div>;
}

const SORU_ACIKLAMASI: Record<keyof typeof BOLUSME_SORUSU, string> = {
  ilkSatis: 'Müşteri ilk kez satın aldığında pay nasıl bölünür? İlk seçenek şirketi zarardan korur.',
  kota: 'Satış bir kotayı geçerse artan pay nasıl bölünür? İlk seçenek şirketi zarardan korur.',
  yillar: 'Müşteri sonraki yıllarda da öderse pay nasıl bölünür? İlk seçenek şirketi zarardan korur.',
};

/** Pay sorusu kartı. Ana ekranda kalıcıysa çizilmez. */
function PaySorusu({ anahtar }: { anahtar: keyof typeof BOLUSME_SORUSU }) {
  const b = useContext(PlanBaglami)!;
  const id = `paylasim.${anahtar}`;
  if (useGizli(id)) return null;
  return <KararKarti no={anahtar} baslik={BOLUSME_SORUSU[anahtar]} aciklama={SORU_ACIKLAMASI[anahtar]}>
    <Choice<Bolusme> label={BOLUSME_SORUSU[anahtar]} value={b.plan.paylasim[anahtar]}
      options={(['dus', 'tam'] as const).map((x) => ({ id: x, name: BOLUSME_ADI[x] }))}
      onChange={(v) => b.guncelle((x) => { x.paylasim[anahtar] = v; })} />
    <Kalici kural={id} ad={BOLUSME_SORUSU[anahtar]} />
  </KararKarti>;
}

function SureKarti() {
  const b = useContext(PlanBaglami)!;
  if (useGizli('paylasim.sureAy')) return null;
  return <KararKarti no="sure" baslik="Tanıştırmanın geçerlilik süresi" aciklama={`Tanıştırma ${b.plan.paylasim.sureAy} ay geçerlidir. Bu süre geçerse Ahmet pay almaz.`}>
    <SureSecimi value={b.plan.paylasim.sureAy} onChange={(v) => b.guncelle((x) => { x.paylasim.sureAy = v; })} />
    <Kalici kural="paylasim.sureAy" ad="Tanıştırmanın geçerlilik süresi" />
  </KararKarti>;
}

/** Yönetici kararları. Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi (kullanıcı kararı 17 Kasım 2026). */
function Kararlar({ plan }: { plan: KazancPlani }) {
  const hepsiKalici = ['paylasim.sureAy', 'paylasim.ilkSatis', 'paylasim.kota', 'paylasim.yillar'].every((k) => plan.kalici.includes(k));
  return <div className="pol-kz-adim-govde">
    <aside className="pol-kz-ornek" aria-label="Örnek">
      <p className="pol-kz-ornek-ad">Örnek</p>
      <p>Ahmet müşteriyi tanıştırır. İki hafta sonra Mehmet satışı kapatır. İkisi de pay ister.</p>
      <p>CRM, müşteri kayıtlarının tutulduğu programdır. Tanıştırma CRM'e kaydedilir.</p>
    </aside>
    {hepsiKalici && <p className="pol-kz-not">Bütün kararlar kalıcı kuraldır. Kararları “KALICI KURALLAR” düğmesinden yönetin.</p>}
    <SureKarti />
    <PaySorusu anahtar="ilkSatis" />
    <PaySorusu anahtar="kota" />
    <PaySorusu anahtar="yillar" />
  </div>;
}

/** Kâğıttaki örnek hesap tablosu. Her katkı türü kendi sekmesindedir. Açık gelen sekme satışı kapatmadır. */
function OrnekHesap({ plan }: { plan: KazancPlani }) {
  return <section className="pol-kz-kart pol-kz-ornek-hesap" aria-labelledby="pol-kz-ornek-hesap">
    <h4 id="pol-kz-ornek-hesap">Kâğıttaki örnek hesap</h4>
    <p>Müşterinin aylık cirosu {tl(plan.ornekCiro)} olsun. Müşteri her ay aynı ciroyu yapsın.</p>
    <Tabs defaultValue="kapatir" keepMounted={false} unstyled classNames={SEKME_SINIFI}>
      <Tabs.List aria-label="Örnek hesabın katkı türü">
        {KATKI_TURLERI.map((t) => <Tabs.Tab key={t} value={t}>{KATKI_SEKMESI[t]}</Tabs.Tab>)}
      </Tabs.List>
      {KATKI_TURLERI.map((t) => {
        const h = ornekHesap(plan, t);
        return <Tabs.Panel key={t} value={t}>
          {h.satirlar.length === 0 ? <p className="pol-kz-not">Bu katkının oranları henüz girilmedi.</p> : <>
            <div className="table-frame"><div className="table-scroll" role="region" aria-label={`${KATKI_SEKMESI[t]}: örnek hesap`} tabIndex={0}>
              <table className="data-table pol-kz-tablo" data-ornek-hesap={t}>
                <thead><tr><th scope="col">Dönem</th><th scope="col">Oran</th><th scope="col">Ciro</th><th scope="col">Kazanç</th></tr></thead>
                <tbody>{h.satirlar.map((r) => <tr key={r.ad}>
                  <th scope="row">{r.ad}</th><td>{yuzde(r.oran)}</td><td>{tl(r.ciro)}</td><td>{tl(r.tutar)}</td>
                </tr>)}</tbody>
                <tfoot><tr><th scope="row" colSpan={3}>Toplam</th><td data-ornek-toplam={t}>{tl(h.toplam)}</td></tr></tfoot>
              </table>
            </div></div>
            {h.k1Bos && <p className="pol-kz-not">K1 eşiği boş. Örnek, kâğıttaki gibi K1 kotasının geçildiğini kabul eder.</p>}
            {!h.k1Gecti && <p className="pol-kz-uyari">Aylık ciro K1 eşiğinin altında. Bu yüzden cari ay kota payı yoktur. Kota tamamlanmadığı için 13. aydan sonra pay da yoktur.</p>}
            <p className="pol-kz-not">Cari ay ve 1. ay ile 12. ay arası satırları bir aylık ciroyla hesaplanır. Sonraki dönemler 12 aylık ciroyla hesaplanır.</p>
          </>}
        </Tabs.Panel>;
      })}
    </Tabs>
  </section>;
}

function PaySonucu({ plan }: { plan: KazancPlani }) {
  const ciro = plan.ornekCiro;
  const p = paylasim(plan, ciro);
  return <section className="pol-kz-kart" aria-labelledby="pol-kz-pay-sonuc">
    <h4 id="pol-kz-pay-sonuc">Ahmet tanıştırır, Mehmet satışı kapatırsa</h4>
    <p>Tanıştırma {plan.paylasim.sureAy} ay geçerlidir. Aylık ciro {tl(ciro)} olursa ilk satışta pay şöyle bölünür:</p>
    <p className="pol-kz-rakam">{tl(p.toplam)}<span className="pol-kz-rakam-ek"> şirketin ödediği toplam</span></p>
    <div className="pol-kz-bolus" aria-hidden="true" style={{ '--pay-a': String(p.toplam ? p.tanistiran / p.toplam : 0) } as CSSProperties}>
      <span className="pol-kz-bolus-a" /><span className="pol-kz-bolus-m" />
    </div>
    <dl className="pol-kz-sonuc pol-kz-sonuc-satir">
      <div><dt><span className="pol-kz-isaret pol-kz-isaret-a" aria-hidden="true" />Ahmet'in payı</dt><dd data-paylasim="tanistiran">{tl(ciro)} × {yuzde(p.tanistiranOran)} = {tl(p.tanistiran)}</dd></div>
      <div><dt><span className="pol-kz-isaret pol-kz-isaret-m" aria-hidden="true" />Mehmet'in payı</dt><dd data-paylasim="kapatan">{tl(ciro)} × {yuzde(p.kapatanOran)} = {tl(p.kapatan)}</dd></div>
      <div><dt>Şirketin ödediği toplam</dt><dd data-paylasim="toplam">{tl(p.toplam)}</dd></div>
    </dl>
    <p>Sonraki aylarda oranlar şöyle olur:</p>
    <ul className="pol-kz-yillar" data-paylasim="yillar">
      {p.yillar.map((y) => <li key={y.yil}>{y.donem}: Ahmet {yuzde(y.tanistiran)}, Mehmet {yuzde(y.kapatan)} alır.</li>)}
    </ul>
  </section>;
}

/** İşaretli değerlerden JSON üretir. JSON yalnız bu tarayıcıda oluşur. Hiçbir sunucuya gönderilmez. */
function useKaliciJson(plan: KazancPlani, proje: Marka) {
  const [durum, setDurum] = useState('');
  const json = () => JSON.stringify(kaliciJson(plan, proje, new Date()), null, 2);
  const kopyala = async () => {
    try { await navigator.clipboard.writeText(json()); setDurum('JSON kopyalandı.'); } catch { setDurum('JSON kopyalanamadı. JSON dosyasını indirin.'); }
  };
  const indir = () => {
    const url = URL.createObjectURL(new Blob([json()], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalici-kurallar-${proje}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDurum('JSON dosyası indirildi.');
  };
  return { json, kopyala, indir, durum };
}

function JsonBolumu({ plan, proje }: { plan: KazancPlani; proje: Marka }) {
  const { json, kopyala, indir, durum } = useKaliciJson(plan, proje);
  return <div className="pol-kz-adim-govde">
    <p>JSON bütün güncel değerleri içerir. Her değerin yanında kalıcı kural olup olmadığı yazar.</p>
    <p>JSON yalnız bu tarayıcıda oluşur. Hiçbir sunucuya gönderilmez.</p>
    <textarea className="param-input pol-kz-json" aria-label="Kazanç planı JSON" readOnly value={json()} rows={10} />
    <div className="pol-kz-dugmeler">
      <button type="button" className="pol-sekme" onClick={kopyala}>JSON'u kopyalayın</button>
      <button type="button" className="pol-sekme" onClick={indir}>JSON dosyasını indirin</button>
    </div>
    <p role="status">{durum}</p>
  </div>;
}

/** Kalıcı kuralın düzenleme alanı. Kimliğe göre doğru kutuyu ya da seçimi çizer. */
function KuralAlani({ id }: { id: string }) {
  const { plan, guncelle } = useContext(PlanBaglami)!;
  const [bolum, alan, sira] = id.split('.');
  if (bolum === 'paylasim') return alan === 'sureAy' ? <SureKartiPencere /> : <PaySorusu anahtar={alan as keyof typeof BOLUSME_SORUSU} />;
  if (bolum === 'tanistir' || bolum === 'kapatir') {
    const tur = bolum as KatkiTuru;
    const ad = KATKI_ADI[tur];
    const i = Number(sira);
    if (alan === 'taban') return <Kutu label={`${ad} taban oranı`} value={plan[tur].taban} yuzdeMi kural={id} onChange={(v) => guncelle((x) => { x[tur].taban = v ?? 0; })} />;
    if (alan === 'kotaEsik') return <Kutu label={`${ad} K${i + 1} ciro eşiği`} birim="(₺)" bosOlur value={plan[tur].kotaEsik[i]} kural={id} onChange={(v) => guncelle((x) => { x[tur].kotaEsik[i] = v; })} />;
    if (alan === 'kotaArtis') return <Kutu label={`${ad} K${i + 1} artışı`} yuzdeMi value={plan[tur].kotaArtis[i]} kural={id} onChange={(v) => guncelle((x) => { x[tur].kotaArtis[i] = v ?? 0; })} />;
    return <Kutu label={`${ad} ${donemAdi(i)} komisyonu`} yuzdeMi value={plan[tur].gecmis[i]} kural={id} onChange={(v) => guncelle((x) => { x[tur].gecmis[i] = v ?? 0; })} />;
  }
  const k = plan.kadrolu;
  if (alan === 'maas') return <Kutu label="Aylık maaş" birim="(₺)" value={k.maas} kural={id} onChange={(v) => guncelle((x) => { x.kadrolu.maas = v ?? 0; })} />;
  if (alan === 'kotaOrani') return <Kutu label="Kota oranı" yuzdeMi value={k.kotaOrani} kural={id} onChange={(v) => guncelle((x) => { x.kadrolu.kotaOrani = v ?? 0; })} />;
  return <Kutu label="Kota üstü prim oranı" yuzdeMi bosOlur value={k.primOrani} kural={id} onChange={(v) => guncelle((x) => { x.kadrolu.primOrani = v; })} />;
}
const SureKartiPencere = () => <SureKarti />;

const KURAL_BOLUMLERI: { onek: string; ad: string }[] = [
  { onek: 'paylasim.', ad: 'Kararlar' },
  { onek: 'tanistir.', ad: 'Tanıştırma' },
  { onek: 'kapatir.', ad: 'Satışı kapatma' },
  { onek: 'kadrolu.', ad: 'Kadrolu uzman' },
];

/**
 * “KALICI KURALLAR” düğmesi ve penceresi (kullanıcı kararı 17 Kasım 2026 Salı).
 * Düğme yalnız kalıcı kural varsa görünür. Pencerede yönetici kalıcı değeri değiştirir ya da kalıcı kuraldan çıkarır.
 */
function KaliciKurallarPenceresi({ plan, proje }: { plan: KazancPlani; proje: Marka }) {
  const [acik, setAcik] = useState(false);
  const acan = useRef<HTMLButtonElement>(null);
  const dar = useMediaQuery('(max-width: 47.99em), (max-height: 31.99em)', false, { getInitialValueInEffect: false });
  const sure = useMotionMs('--motion-duration-base');
  const { kopyala, indir, durum } = useKaliciJson(plan, proje);
  const sayi = plan.kalici.length;
  if (!sayi && !acik) return null;
  const sirali = kuralListesi(plan).map((k) => k.id).filter((id) => plan.kalici.includes(id));
  const kapat = () => { setAcik(false); window.setTimeout(() => acan.current?.focus(), 0); };
  return <>
    <div className="pol-kz-ust">
      <p>{sayi} değer kalıcı kuraldır. Bu değerler aşağıda görünmez.</p>
      <button ref={acan} type="button" className="pol-kz-kalici-dugme" aria-haspopup="dialog" aria-label={`KALICI KURALLAR, ${sayi} kural`} onClick={() => setAcik(true)}>
        KALICI KURALLAR <span className="pol-kz-rozet" aria-hidden="true">{sayi}</span>
      </button>
    </div>
    <Modal opened={acik} onClose={kapat} title="Kalıcı kurallar" size="48rem" fullScreen={dar} radius={0} returnFocus={false}
      transitionProps={{ duration: sure, timingFunction: 'var(--motion-ease-standard)' }} overlayProps={{ backgroundOpacity: 0.55 }}
      closeButtonProps={{ 'aria-label': 'Pencereyi kapat', size: 'xl' }}
      classNames={{ content: 'oy-pencere', header: 'oy-pencere-ust', title: 'oy-pencere-baslik', body: 'oy-pencere-govde', close: 'oy-pencere-kapat' }}>
      <PencereBaglami.Provider value>
        <p>Yönetici bu değerleri sabitledi. Değeri burada değiştirebilirsiniz. “Kalıcı kuraldan çıkarın” düğmesi değeri ana ekrana geri getirir.</p>
        {sayi === 0 && <p className="pol-kz-not">Kalıcı kural kalmadı. Pencereyi kapatabilirsiniz.</p>}
        {KURAL_BOLUMLERI.map((b) => {
          const ids = sirali.filter((id) => id.startsWith(b.onek));
          if (!ids.length) return null;
          return <section key={b.onek} className="pol-kz-pencere-bolum" aria-label={b.ad}>
            <h3>{b.ad}</h3>
            <div className="pol-kz-pencere-alanlar" data-tek-sutun={b.onek === 'paylasim.' ? '' : undefined}>{ids.map((id) => <KuralAlani key={id} id={id} />)}</div>
          </section>;
        })}
        <div className="pol-kz-dugmeler">
          <button type="button" className="pol-sekme" onClick={kopyala}>JSON'u kopyalayın</button>
          <button type="button" className="pol-sekme" onClick={indir}>JSON dosyasını indirin</button>
        </div>
        <p role="status">{durum}</p>
      </PencereBaglami.Provider>
    </Modal>
  </>;
}

function KadroluGirdi({ plan, guncelle }: { plan: KazancPlani; guncelle: Guncelle }) {
  const k = plan.kadrolu;
  return <div className="pol-kz-adim-govde">
    <p>Kadrolu uzman SGK'lı çalışandır. Kadrolu uzman bu iş ortaklığı planının dışındadır.</p>
    <p>Maaşı ayda {tl(MAAS_ARALIGI[0])} ile {tl(MAAS_ARALIGI[1])} arasındadır. Kadrolu uzman maaşa ek olarak prim alır.</p>
    <Grup baslik="Maaş ve kota">
      <Kutu label="Aylık maaş" birim="(₺)" value={k.maas} kural="kadrolu.maas" onChange={(v) => guncelle((x) => { x.kadrolu.maas = v ?? 0; })} />
      <Kutu label="Kota oranı" value={k.kotaOrani} yuzdeMi kural="kadrolu.kotaOrani" onChange={(v) => guncelle((x) => { x.kadrolu.kotaOrani = v ?? 0; })} />
      <Kutu label="Kota üstü prim oranı" value={k.primOrani} yuzdeMi bosOlur kural="kadrolu.primOrani" onChange={(v) => guncelle((x) => { x.kadrolu.primOrani = v; })} />
    </Grup>
  </div>;
}

function KadroluSonuc({ plan }: { plan: KazancPlani }) {
  const k = plan.kadrolu;
  return <section className="pol-kz-kart" aria-label="Kadrolu uzmanın kotası">
    <dl className="pol-kz-sonuc">
      <div><dt>Aylık kota</dt><dd className="pol-kz-buyuk" data-kazanc="kadrolu-kota">{tl(kadroluKota(plan))} ciro</dd></div>
      <div><dt>Prim oranı</dt><dd>{k.primOrani === null ? 'Henüz belirlenmedi' : yuzde(k.primOrani)}</dd></div>
    </dl>
    <p>Kota, aylık maaşın {yuzde(k.kotaOrani)} kadarı cirodur. Kotayı geçen ciro için prim hesaplanır.</p>
  </section>;
}

const SEVIYE_ADI = ['Kota yok', 'K1', 'K2', 'K3'] as const;

/**
 * Kazanç simülasyonu (kullanıcı kararı 17 Kasım 2026 Salı).
 * Okur aylık ciroyu girer. Tablo her seviyenin koşulunu gösterir. Okurun cirosuna denk gelen satır vurgulanır.
 * Üstteki seviye yolu ve sonraki kotaya kalan tutar, okura nerede olduğunu ve neyi hedefleyeceğini söyler.
 */
function KazancSimulasyonu({ plan }: { plan: KazancPlani }) {
  const [tur, setTur] = useState<KatkiTuru>('kapatir');
  const ciro = plan.ornekCiro;
  const p = plan[tur];
  const { oran, kota } = katkiOrani(plan, tur, ciro);
  const devam = kotaTamam(plan, tur, ciro);
  const esik = (i: number) => p.kotaEsik[i];
  // Seviye satırları: her satırın koşulu, cari ay oranı ve eşikteki örnek kazancı.
  const satirlar = SEVIYE_ADI.map((ad, i) => {
    const alt = i === 0 ? 0 : esik(i - 1);
    const ust = i < 3 ? esik(i) : null;
    const seviyeOrani = Math.round((p.taban + p.kotaArtis.slice(0, i).reduce((t, x) => t + x, 0)) * 10_000) / 10_000;
    const kosul = i === 0
      ? (esik(0) === null ? 'K1 eşiği belirlenmedi' : `Aylık ciro ${tl(esik(0)!)} altında`)
      : alt === null ? 'Eşik belirlenmedi'
      : ust === null ? `Aylık ciro ${tl(alt)} ve üstü` : `Aylık ciro ${tl(alt)} ile ${tl(ust)} arası`;
    const ulasilir = i === 0 || p.kotaEsik.slice(0, i).every((e) => e !== null);
    return { ad, i, kosul, seviyeOrani, ulasilir, esikteKazanc: alt ? Math.round(alt * seviyeOrani) : null };
  });
  const sonraki = kota < 3 ? esik(kota) : null;
  const kalan = sonraki === null ? null : Math.max(0, sonraki - ciro);
  const ilerleme = sonraki ? Math.min(1, ciro / sonraki) : 1;
  const buAy = Math.round(ciro * oran);
  const ilkYil = buAy * 12;
  const sonrakiYillar = devam ? p.gecmis.reduce((t, g) => t + Math.round(ciro * 12 * g), 0) : 0;
  return <section className="pol-kz-sim" aria-labelledby="pol-kz-sim-baslik">
    <h4 id="pol-kz-sim-baslik">Cironuza göre kazancınız</h4>
    <p>Aylık ciroyu yukarıdaki kutuya girin. Tablo hemen değişir. Turuncu satır sizin durumunuzdur.</p>
    <Choice<KatkiTuru> label="Satıştaki katkınız" value={tur} options={KATKI_TURLERI.map((t) => ({ id: t, name: KATKI_SEKMESI[t] }))} onChange={setTur} />
    <ol className="pol-kz-seviye-yolu" aria-label="Kota seviyeleri">
      {SEVIYE_ADI.map((ad, i) => <li key={ad} data-durum={i < kota ? 'gecti' : i === kota ? 'simdi' : 'sonra'} aria-current={i === kota ? 'step' : undefined}>
        <span className="pol-kz-seviye-nokta" aria-hidden="true">{i < kota ? '✓' : i}</span>
        <span>{ad}</span>
      </li>)}
    </ol>
    <div className="pol-kz-kpi">
      <div className="pol-kz-kpi-kutu" data-kpi="seviye"><p>Seviyeniz</p><p className="pol-kz-kpi-deger">{SEVIYE_ADI[kota]}</p><p>Cari ay oranınız {yuzde(oran)}</p></div>
      <div className="pol-kz-kpi-kutu" data-kpi="bu-ay"><p>Bu ay kazancınız</p><p className="pol-kz-kpi-deger" data-sim="bu-ay">{tl(buAy)}</p><p>{tl(ciro)} × {yuzde(oran)}</p></div>
      <div className="pol-kz-kpi-kutu" data-kpi="toplam"><p>4 yılda toplam</p><p className="pol-kz-kpi-deger" data-sim="toplam">{tl(ilkYil + sonrakiYillar)}</p><p>Müşteri her ay aynı ciroyu yaparsa</p></div>
    </div>
    {sonraki !== null && kalan !== null && <div className="pol-kz-hedef" data-sim="hedef">
      <p><strong>{SEVIYE_ADI[kota + 1]} kotasına {tl(kalan)} kaldı.</strong> {SEVIYE_ADI[kota + 1]} kotasına ulaşınca oranınız {yuzde(satirlar[kota + 1].seviyeOrani)} olur.</p>
      <div className="pol-kz-hedef-iz" aria-hidden="true"><span style={{ '--ilerleme': String(ilerleme) } as CSSProperties} /></div>
    </div>}
    {kota === 3 && <p className="pol-kz-hedef" data-sim="hedef"><strong>En üst seviyedesiniz.</strong> Bütün kota puanları oranınıza eklendi.</p>}
    {sonraki === null && kota < 3 && <p className="pol-kz-not">Sonraki kota eşiği belirlenmedi. Bu yüzden hedef gösterilmez.</p>}
    <p className={devam ? 'pol-kz-kural' : 'pol-kz-uyari'} data-sim="devam">{devam
      ? '13. aydan sonra da pay alırsınız. K1 kotası tamamlandı.'
      : 'K1 kotası tamamlanmadı. 13. aydan sonra pay almazsınız.'}</p>
    <div className="table-frame"><div className="table-scroll" role="region" aria-label="Seviyelere göre kazanç tablosu" tabIndex={0}>
      <table className="data-table pol-kz-tablo pol-kz-sim-tablo" data-sim-tablo={tur}>
        <thead><tr><th scope="col">Seviye</th><th scope="col">Koşul</th><th scope="col">Cari ay oranı</th><th scope="col">Eşikteki aylık kazanç</th><th scope="col">13. aydan sonra</th></tr></thead>
        <tbody>{satirlar.map((r) => {
          const etkin = r.i === kota;
          return <tr key={r.ad} data-etkin={etkin ? '' : undefined} aria-current={etkin ? 'true' : undefined}>
            <th scope="row">{r.ad}{etkin && <span className="pol-kz-burasi">Buradasınız</span>}</th>
            <td>{r.kosul}</td>
            <td>{r.ulasilir ? yuzde(r.seviyeOrani) : 'Yok'}</td>
            <td>{etkin ? <>{tl(buAy)}<span className="pol-kz-hucre-not">sizin cironuzla</span></> : r.esikteKazanc !== null ? tl(r.esikteKazanc) : 'Yok'}</td>
            <td>{r.i === 0 && esik(0) !== null ? 'Pay yok' : p.gecmis.filter((g) => g > 0).map(yuzde).join(', ') || 'Pay yok'}</td>
          </tr>;
        })}</tbody>
      </table>
    </div></div>
    <p className="pol-kz-not">“Eşikteki aylık kazanç”, ciro tam eşik tutarında olursa alınan aylık paydır. 13. aydan sonraki oranlar 13. ay ile 24. ay arasından başlayarak sırayla yazılır.</p>
  </section>;
}

/** Planın bir bölümü. Bölümler alt alta durur (kullanıcı kararı 17 Kasım 2026 Salı: adım çubuğu kalktı). */
function Bolum({ no, baslik, aciklama, children }: { no: number; baslik: string; aciklama: string; children: ReactNode }) {
  return <section className="pol-kz-adim-icerik" aria-labelledby={`pol-kz-bolum-${no}`}>
    <div className="pol-adim-basligi">
      <p className="pol-yol-ust">{no}. bölüm</p>
      <h3 id={`pol-kz-bolum-${no}`}>{baslik}</h3>
    </div>
    <p className="pol-kz-not">{aciklama}</p>
    {children}
  </section>;
}

export function KazancPlaniBolumu({ proje, rol }: { proje: Marka; rol: RolId }) {
  const { plan, guncelle } = useKazancPlani(proje);
  // Kullanıcı kararı 17 Kasım 2026 Salı: önce kararlar, sonra oranlar, sonra sonuç. Kalıcı kurallar pencerededir.
  return <PlanBaglami.Provider value={{ plan, guncelle, proje }}><Section id="kazanc-plani" title="Kazanç planı" className="pol-kz-plan">
    <KaliciKurallarPenceresi plan={plan} proje={proje} />
    <div className="pol-kz-bolumler">
      {rol === 'kadrolu' ? <>
        <Bolum no={1} baslik="Maaş ve kota" aciklama="Değerleri değiştirebilirsiniz. Değerler yalnız bu tarayıcıda saklanır."><KadroluGirdi plan={plan} guncelle={guncelle} /></Bolum>
        <Bolum no={2} baslik="Sonuç" aciklama="Sonuç, 1. bölümdeki değerlere göre hesaplanır."><KadroluSonuc plan={plan} /></Bolum>
        <Bolum no={3} baslik="JSON" aciklama="Bu bölüm yalnız yönetici içindir."><JsonBolumu plan={plan} proje={proje} /></Bolum>
      </> : <>
        <p>Herkes iş ortağıdır. Kazancınızı rolünüz değil, satıştaki katkınız belirler. Kadrolu uzman bu planın dışındadır.</p>
        <Bolum no={1} baslik="Kararlar" aciklama="Yönetici bu kararları verir. Her seçenek şirketin ödediği toplamı değiştirir."><Kararlar plan={plan} /></Bolum>
        <Bolum no={2} baslik="Oranlar" aciklama={'Önce aşağıdaki iki sekmeden birini seçin. Sonra o sekmedeki değerleri doldurun. Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3 aylık ciro kotalarıdır. ' + KOTA_KURALI}>
          {/* Kullanıcı kararı 17 Kasım 2026: iki katkı türü sekmedir. Bir sekme açıkken diğerinin içeriği görünmez. */}
          <Tabs defaultValue="tanistir" keepMounted={false} unstyled classNames={SEKME_SINIFI}>
            <Tabs.List aria-label="Satıştaki katkınız">
              {KATKI_TURLERI.map((t) => <Tabs.Tab key={t} value={t}>{KATKI_SEKMESI[t]}</Tabs.Tab>)}
            </Tabs.List>
            {KATKI_TURLERI.map((t) => <Tabs.Panel key={t} value={t}><Katki tur={t} plan={plan} guncelle={guncelle} /></Tabs.Panel>)}
          </Tabs>
        </Bolum>
        <Bolum no={3} baslik="Sonuç" aciklama="Bir örnek aylık ciro girin. Sonuçlar 1. ve 2. bölümdeki değerlere göre hesaplanır.">
          <p className="pol-kz-kural" data-kota-kurali="">{KOTA_KURALI}</p>
          <Grup baslik="Örnek satış">
            <Kutu label="Örnek aylık ciro" birim="(₺)" value={plan.ornekCiro} onChange={(v) => guncelle((x) => { x.ornekCiro = v ?? 0; })} />
          </Grup>
          <KazancSimulasyonu plan={plan} />
          <div className="pol-kz-kartlar">
            <KatkiSonucu tur="tanistir" plan={plan} />
            <KatkiSonucu tur="kapatir" plan={plan} />
          </div>
          <OrnekHesap plan={plan} />
          <PaySonucu plan={plan} />
        </Bolum>
        <Bolum no={4} baslik="JSON" aciklama="Bu bölüm yalnız yönetici içindir."><JsonBolumu plan={plan} proje={proje} /></Bolum>
      </>}
    </div>
    <button type="button" className="pol-sekme" onClick={() => yaz(proje, projeVarsayilani(proje))}>Planın ilk değerlerine dönün</button>
  </Section></PlanBaglami.Provider>;
}
