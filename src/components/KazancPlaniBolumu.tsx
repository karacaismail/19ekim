import { createContext, type CSSProperties, type ReactNode, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { Checkbox, NumberInput, Tabs } from '@mantine/core';
import { Choice } from './ui';
import { Section } from './ui';
import { Grup } from './sadeKit';
import {
  KATKI_TURLERI, BOLUSME_ADI, BOLUSME_SORUSU, KATKI_ADI, KAZANC_VARSAYILAN, MAAS_ARALIGI, SURE_SECENEKLERI, kadroluKota, kaliciJson, katkiOrani,
  paylasim, planOku, yillaraKazanc, type Bolusme, type Esik, type KatkiTuru, type KazancPlani, type SureAy,
} from '../data/kazancPlani';
import type { Marka, RolId } from '../data/satisOrtakligi';
import { num } from '../lib/format';
import '../styles/politikalar.css';

const tl = (n: number) => `${num(n)} ₺`;
const yuzde = (n: number) => `%${num(Math.round(n * 1000) / 10)}`;

/* Plan her proje için ayrı anahtarda, yalnız bu tarayıcıda saklanır. Aynı sayfadaki bütün okuyucular aynı değeri görür. */
const anahtar = (proje: Marka) => `turksab-kazanc-plani-v1-${proje}`;
const dinleyiciler = new Set<() => void>();
const bellek = new Map<Marka, KazancPlani>();
function oku(proje: Marka): KazancPlani {
  let plan = bellek.get(proje);
  if (!plan) {
    try { plan = planOku(JSON.parse(localStorage.getItem(anahtar(proje)) ?? 'null')); } catch { plan = structuredClone(KAZANC_VARSAYILAN); }
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

export function useKazancPlani(proje: Marka) {
  const plan = useSyncExternalStore(abone, () => oku(proje), () => KAZANC_VARSAYILAN);
  return { plan, guncelle: (degis: (p: KazancPlani) => void) => { const yeni = structuredClone(plan); degis(yeni); yaz(proje, yeni); } };
}

type Guncelle = ReturnType<typeof useKazancPlani>['guncelle'];
const PlanBaglami = createContext<{ plan: KazancPlani; guncelle: Guncelle } | null>(null);

/** Değer kalıcı kural olarak işaretliyse kilitlidir. Kilitli değer değiştirilemez (kullanıcı kararı 17 Kasım 2026 Salı). */
function useKilitli(kural?: string) {
  const b = useContext(PlanBaglami);
  return Boolean(kural && b?.plan.kalici.includes(kural));
}

/** “Kalıcı kural” kutusu. İşaretli değer, yöneticinin kalıcı kural adayıdır. */
function Kalici({ kural, ad }: { kural: string; ad: string }) {
  const b = useContext(PlanBaglami);
  if (!b) return null;
  const isaretli = b.plan.kalici.includes(kural);
  return <><Checkbox label="Kalıcı kural" aria-label={`${ad} kalıcı kural`} checked={isaretli}
    onChange={(e) => {
      const acik = e.currentTarget.checked;
      b.guncelle((x) => { x.kalici = acik ? [...x.kalici.filter((k) => k !== kural), kural] : x.kalici.filter((k) => k !== kural); });
    }}
    classNames={{ root: 'applet-onay pol-kz-kalici', body: 'applet-onay-govde', input: 'applet-onay-kutu', label: 'applet-onay-ad', icon: 'applet-onay-ikon' }} />
    {isaretli && <p className="pol-kz-not">Bu değer kilitli. Değiştirmek için “Kalıcı kural” işaretini kaldırın.</p>}</>;
}

/** Boş bırakılabilen sayı kutusu. Yüzde alanında değer oran olarak saklanır. */
function Kutu({ label, value, onChange, yuzdeMi = false, bosOlur = false, birim, kural }: {
  label: string; value: Esik; onChange: (v: Esik) => void; yuzdeMi?: boolean; bosOlur?: boolean; birim?: string; kural?: string;
}) {
  const kilitli = useKilitli(kural);
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
    prefix={yuzdeMi ? '%' : undefined} max={yuzdeMi ? 100 : undefined} size="md" disabled={kilitli} />;
  return kural ? <div className="pol-kz-alan">{kutu}<Kalici kural={kural} ad={label} /></div> : kutu;
}

function Katki({ tur, plan, guncelle }: { tur: KatkiTuru; plan: KazancPlani; guncelle: Guncelle }) {
  const ad = KATKI_ADI[tur];
  const p = plan[tur];
  return <div className="pol-kz-katki" data-katki={tur}>
    <p>{tur === 'tanistir'
      ? 'Müşteriyi bize yönlendirirsiniz. Satışı biz kapatırız. Müşteri satın alırsa pay kazanırsınız. Müşteri satın almazsa pay yoktur.'
      : tur === 'kapatir' ? 'Müşteriyi yalnız tanıştırmazsınız. Satışı da siz kapatırsınız. Müşteri satın alınca pay kazanırsınız.'
      : 'Onboarding, yeni müşterinin kurulumu ve ilk eğitimidir. Bu işi siz yaparsınız.'}</p>
    {tur === 'onboard' && <p className="pol-kz-not">Onboarding oranları henüz belirlenmedi. Değerleri yönetici girer.</p>}
    <p className="pol-kz-burada" data-katki-burada={tur}>Şu an “{KATKI_SEKMESI[tur]}” sekmesi için değer giriyorsunuz. Bu sekmede 4 grup var.</p>
    <Grup baslik={`1. grup: ${ad} için satış yılındaki oran (1. yıl)`}>
      <Kutu label={`${ad} taban oranı`} value={p.taban} yuzdeMi kural={`${tur}.taban`} onChange={(v) => guncelle((x) => { x[tur].taban = v ?? 0; })} />
    </Grup>
    <Grup baslik={`2. grup: ${ad} için aylık ciro kotaları`}>
      {p.kotaEsik.map((e, i) => <Kutu key={i} label={`${ad} K${i + 1} ciro eşiği`} birim="(₺)" value={e} bosOlur kural={`${tur}.kotaEsik.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaEsik[i] = v; })} />)}
    </Grup>
    {p.kotaEsik.some((e) => e === null) && <p className="pol-kz-not">Bazı kota eşikleri henüz belirlenmedi. Eşik boşsa o kotanın artışı uygulanmaz.</p>}
    <Grup baslik={`3. grup: ${ad} için kota geçilince eklenen puan`}>
      {p.kotaArtis.map((a, i) => <Kutu key={i} label={`${ad} K${i + 1} artışı`} value={a} yuzdeMi kural={`${tur}.kotaArtis.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaArtis[i] = v ?? 0; })} />)}
    </Grup>
    <Grup baslik={`4. grup: ${ad} için 2. yıldan sonraki oranlar`}>
      {p.gecmis.map((g, i) => <Kutu key={i} label={`${ad} ${i + 2}. yıl komisyonu`} value={g} yuzdeMi kural={`${tur}.gecmis.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].gecmis[i] = v ?? 0; })} />)}
    </Grup>
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
    <p>Satış yılı 1. yıldır. Müşteri sonraki yıllarda da aynı aylık ciroyu yaparsa şu tutarları alırsınız:</p>
    <ul className="pol-kz-yillar" data-kazanc={`${tur}-yillar`}>
      {yillaraKazanc(plan, tur, plan.ornekCiro).map((s) => <li key={s.yil}>{s.yil}. yılda {yuzde(s.oran)} ile her ay {tl(s.tutar)}</li>)}
    </ul>
  </section>;
}

const KATKI_SEKMESI: Record<KatkiTuru, string> = { tanistir: 'Yalnız tanıştırırsanız', kapatir: 'Satışı kapatırsanız', onboard: 'Onboarding yaparsanız' };
const SEKME_SINIFI = { list: 'pol-sekme-listesi', tab: 'pol-sekme', panel: 'pol-sekme-paneli' };

/** Karar kartı: üstte soru, ortada seçim, altta “Kalıcı kural”. Her karar ayrı yüzeyde durur. */
function KararKarti({ no, baslik, aciklama, children }: { no: number; baslik: string; aciklama?: string; children: ReactNode }) {
  return <section className="pol-kz-karar" aria-labelledby={`pol-kz-karar-${no}`}>
    <p className="pol-kz-karar-no">{no}. karar</p>
    <h4 id={`pol-kz-karar-${no}`}>{baslik}</h4>
    {aciklama && <p className="pol-kz-not">{aciklama}</p>}
    {children}
  </section>;
}

/** Seçmeli düğme grubu. APG radyo grubu gibi çalışır: ok tuşları, Home ve End seçimi taşır. */
function SureSecimi({ value, onChange }: { value: SureAy; onChange: (v: SureAy) => void }) {
  const kilitli = useKilitli('paylasim.sureAy');
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
    <p id="pol-kz-sure-ad" className="pol-kz-gizli">Tanıştırmanın geçerlilik süresi</p>
    <div ref={grup} role="radiogroup" aria-labelledby="pol-kz-sure-ad" className="pol-sekme-listesi pol-kz-sure-liste">
      {SURE_SECENEKLERI.map((ay, i) => <button key={ay} type="button" role="radio" aria-checked={ay === value} data-ay={ay} disabled={kilitli}
        tabIndex={ay === value ? 0 : -1} className="pol-sekme" onClick={() => sec(i)} onKeyDown={(e) => tus(e, i)}>{ay} ay</button>)}
    </div>
    <Kalici kural="paylasim.sureAy" ad="Tanıştırmanın geçerlilik süresi" />
  </div>;
}

/** Yönetici kararları. Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi (kullanıcı kararı 17 Kasım 2026). */
function Kararlar({ plan, guncelle }: { plan: KazancPlani; guncelle: Guncelle }) {
  const SORU_ACIKLAMASI: Record<keyof typeof BOLUSME_SORUSU, string> = {
    ilkSatis: 'Müşteri ilk kez satın aldığında pay nasıl bölünür?',
    kota: 'Satış bir kotayı geçerse artan pay nasıl bölünür?',
    yillar: 'Müşteri sonraki yıllarda da öderse pay nasıl bölünür?',
  };
  const soru = (anahtar: keyof typeof BOLUSME_SORUSU, no: number) => <KararKarti no={no} baslik={BOLUSME_SORUSU[anahtar]} aciklama={SORU_ACIKLAMASI[anahtar]}>
    {/* Kalıcı kural işaretliyse seçim kilitlenir. Kapalı fieldset içindeki düğmeler de kapanır. */}
    <fieldset className="pol-kz-kilit" disabled={plan.kalici.includes(`paylasim.${anahtar}`)}>
      <Choice<Bolusme> label={BOLUSME_SORUSU[anahtar]} value={plan.paylasim[anahtar]}
        options={(['dus', 'tam'] as const).map((id) => ({ id, name: BOLUSME_ADI[id] }))}
        onChange={(v) => guncelle((x) => { x.paylasim[anahtar] = v; })} />
    </fieldset>
    <Kalici kural={`paylasim.${anahtar}`} ad={BOLUSME_SORUSU[anahtar]} />
  </KararKarti>;
  return <div className="pol-kz-adim-govde">
    <aside className="pol-kz-ornek" aria-label="Örnek">
      <p className="pol-kz-ornek-ad">Örnek</p>
      <p>Ahmet müşteriyi tanıştırır. İki hafta sonra Mehmet satışı kapatır. İkisi de pay ister.</p>
      <p>CRM, müşteri kayıtlarının tutulduğu programdır. Tanıştırma CRM'e kaydedilir.</p>
    </aside>
    <KararKarti no={1} baslik="Tanıştırmanın geçerlilik süresi" aciklama={`Tanıştırma ${plan.paylasim.sureAy} ay geçerlidir. Bu süre geçerse Ahmet pay almaz.`}>
      <SureSecimi value={plan.paylasim.sureAy} onChange={(v) => guncelle((x) => { x.paylasim.sureAy = v; })} />
    </KararKarti>
    <p className="pol-kz-ara">Sonraki üç kararda ilk seçenek şirketi zarardan korur.</p>
    {soru('ilkSatis', 2)}
    {soru('kota', 3)}
    {soru('yillar', 4)}
  </div>;
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
    <p>Sonraki yıllarda oranlar şöyle olur:</p>
    <ul className="pol-kz-yillar" data-paylasim="yillar">
      {p.yillar.map((y) => <li key={y.yil}>{y.yil}. yılda Ahmet {yuzde(y.tanistiran)}, Mehmet {yuzde(y.kapatan)} alır.</li>)}
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

/**
 * Kalıcı kural çubuğu (kullanıcı kararı 17 Kasım 2026 Salı).
 * Bir değer işaretlenince çubuk her adımda görünür. JSON hemen alınabilir.
 */
function KaliciCubugu({ plan, proje }: { plan: KazancPlani; proje: Marka }) {
  const { kopyala, indir, durum } = useKaliciJson(plan, proje);
  if (!plan.kalici.length) return null;
  return <section className="pol-kz-cubuk" aria-label="Kalıcı kurallar">
    <p><strong>{plan.kalici.length} değer kalıcı kural olarak işaretli.</strong> JSON'u şimdi alabilirsiniz.</p>
    <div className="pol-kz-dugmeler">
      <button type="button" className="pol-sekme pol-kz-ileri" onClick={kopyala}>JSON'u kopyalayın</button>
      <button type="button" className="pol-sekme" onClick={indir}>JSON dosyasını indirin</button>
    </div>
    <p role="status">{durum}</p>
  </section>;
}

function KaliciKurallar({ plan, proje }: { plan: KazancPlani; proje: Marka }) {
  const { json, kopyala, indir, durum } = useKaliciJson(plan, proje);
  return <div className="pol-kz-adim-govde">
    <p>Yönetici bir değeri kalıcı yapmak isterse yanındaki “Kalıcı kural” kutusunu işaretler.</p>
    <p>{plan.kalici.length ? `${plan.kalici.length} değer kalıcı kural olarak işaretli.` : 'Henüz hiçbir değer kalıcı kural olarak işaretlenmedi.'}</p>
    <p>JSON bütün güncel değerleri içerir. İşaretli olmayan değerler de JSON'dadır. Her değerin yanında kalıcı olup olmadığı yazar.</p>
    {<>
      <p>JSON yalnız bu tarayıcıda oluşur. Hiçbir sunucuya gönderilmez.</p>
      <textarea className="param-input pol-kz-json" aria-label="Kalıcı kurallar JSON" readOnly value={json()} rows={10} />
      <div className="pol-kz-dugmeler">
        <button type="button" className="pol-sekme" onClick={kopyala}>JSON'u kopyalayın</button>
        <button type="button" className="pol-sekme" onClick={indir}>JSON dosyasını indirin</button>
      </div>
      <p role="status">{durum}</p>
    </>}
  </div>;
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

interface AdimTanimi { baslik: string; aciklama: string; icerik: ReactNode }

/**
 * Adım adım sihirbaz (kullanıcı kararı 17 Kasım 2026 Salı).
 * Okur her an hangi adımda olduğunu görür. Ekranda yalnız o adımın alanları durur.
 */
function Sihirbaz({ adimlar }: { adimlar: AdimTanimi[] }) {
  const [etkin, setEtkin] = useState(0);
  const baslik = useRef<HTMLHeadingElement>(null);
  const odakla = useRef(false);
  useLayoutEffect(() => {
    if (!odakla.current) return;
    odakla.current = false;
    baslik.current?.focus();
  }, [etkin]);
  const git = (i: number) => { odakla.current = true; setEtkin(i); };
  const a = adimlar[etkin];
  const toplam = adimlar.length;
  return <div className="pol-kz-sihirbaz">
    <nav className="pol-kz-ilerleme" aria-label="Kazanç planı adımları">
      <p className="pol-kz-konum" data-kz-konum>{toplam} adımın {etkin + 1}. adımındasınız.</p>
      <ol className="pol-kz-adim-listesi" style={{ '--adim-sayisi': String(toplam) } as CSSProperties}>
        {adimlar.map((x, i) => <li key={x.baslik}>
          <button type="button" className="pol-kz-adim-dugme" aria-current={i === etkin ? 'step' : undefined}
            aria-label={`${i + 1}. adım: ${x.baslik}. ${i < etkin ? 'Geçtiniz' : i === etkin ? 'Şu an buradasınız' : 'Sırada'}`}
            data-durum={i < etkin ? 'bitti' : i === etkin ? 'simdi' : 'sonra'} onClick={() => git(i)}>
            <span className="pol-kz-adim-no" aria-hidden="true">{i < etkin ? '✓' : i + 1}</span>
            <span className="pol-kz-adim-ad" aria-hidden="true">{x.baslik}</span>
          </button>
        </li>)}
      </ol>
    </nav>
    <section className="pol-kz-adim-icerik" aria-labelledby="pol-kz-adim-baslik">
      <div className="pol-adim-basligi">
        <p className="pol-yol-ust">{etkin + 1}. adım</p>
        <h3 id="pol-kz-adim-baslik" ref={baslik} tabIndex={-1}>{a.baslik}</h3>
      </div>
      <p className="pol-kz-not">{a.aciklama}</p>
      {a.icerik}
    </section>
    <div className="pol-kz-gezinti">
      {etkin > 0 && <button type="button" className="pol-sekme" onClick={() => git(etkin - 1)}>Önceki adım: {adimlar[etkin - 1].baslik}</button>}
      {etkin < toplam - 1 && <button type="button" className="pol-sekme pol-kz-ileri" onClick={() => git(etkin + 1)}>Sonraki adım: {adimlar[etkin + 1].baslik}</button>}
    </div>
  </div>;
}

export function KazancPlaniBolumu({ proje, rol }: { proje: Marka; rol: RolId }) {
  const { plan, guncelle } = useKazancPlani(proje);
  const kalici = { baslik: 'Kalıcı kuralları alın', aciklama: 'Bu adım yalnız yönetici içindir.', icerik: <KaliciKurallar plan={plan} proje={proje} /> };
  // Kullanıcı kararı 17 Kasım 2026 Salı: önce seçenekler ve kararlar, sonra sonuç. Okur adımları sırayla izler.
  return <PlanBaglami.Provider value={{ plan, guncelle }}><Section id="kazanc-plani" title="Kazanç planı" className="pol-kz-plan">
    <KaliciCubugu plan={plan} proje={proje} />
    {rol === 'kadrolu' ? <Sihirbaz key="kadrolu" adimlar={[
      { baslik: 'Maaşı ve kotayı girin', aciklama: 'Değerleri değiştirebilirsiniz. Değerler yalnız bu tarayıcıda saklanır.', icerik: <KadroluGirdi plan={plan} guncelle={guncelle} /> },
      { baslik: 'Sonucu görün', aciklama: 'Sonuç, 1. adımdaki değerlere göre hesaplanır.', icerik: <KadroluSonuc plan={plan} /> },
      kalici,
    ]} /> : <>
      <p>Herkes iş ortağıdır. Kazancınızı rolünüz değil, satıştaki katkınız belirler. Kadrolu uzman bu planın dışındadır.</p>
      <Sihirbaz key="ortak" adimlar={[
        { baslik: 'Kararları seçin', aciklama: 'Yönetici bu kararları verir. Her seçenek şirketin ödediği toplamı değiştirir.', icerik: <Kararlar plan={plan} guncelle={guncelle} /> },
        { baslik: 'Oranları girin', aciklama: 'Önce aşağıdaki üç sekmeden birini seçin. Sonra o sekmedeki 4 grubu sırayla doldurun. Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3 aylık ciro kotalarıdır.', icerik:
          /* Kullanıcı kararı 17 Kasım 2026: iki katkı türü sekmedir. Bir sekme açıkken diğerinin içeriği görünmez. */
          <Tabs defaultValue="tanistir" keepMounted={false} unstyled classNames={SEKME_SINIFI}>
            <Tabs.List aria-label="Satıştaki katkınız">
              {KATKI_TURLERI.map((t) => <Tabs.Tab key={t} value={t}>{KATKI_SEKMESI[t]}</Tabs.Tab>)}
            </Tabs.List>
            {KATKI_TURLERI.map((t) => <Tabs.Panel key={t} value={t}>
              <Katki tur={t} plan={plan} guncelle={guncelle} />
            </Tabs.Panel>)}
          </Tabs> },
        { baslik: 'Sonucu görün', aciklama: 'Bir örnek aylık ciro girin. Sonuçlar 1. ve 2. adımdaki değerlere göre hesaplanır.', icerik: <>
          <Grup baslik="Örnek satış">
            <Kutu label="Örnek aylık ciro" birim="(₺)" value={plan.ornekCiro} onChange={(v) => guncelle((x) => { x.ornekCiro = v ?? 0; })} />
          </Grup>
          <div className="pol-kz-kartlar">
            <KatkiSonucu tur="tanistir" plan={plan} />
            <KatkiSonucu tur="kapatir" plan={plan} />
            <KatkiSonucu tur="onboard" plan={plan} />
          </div>
          <PaySonucu plan={plan} />
        </> },
        kalici,
      ]} />
    </>}
    <button type="button" className="pol-sekme" onClick={() => yaz(proje, structuredClone(KAZANC_VARSAYILAN))}>Planın ilk değerlerine dönün</button>
  </Section></PlanBaglami.Provider>;
}
