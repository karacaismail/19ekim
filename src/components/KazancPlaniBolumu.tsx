import { createContext, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { Checkbox, NumberInput, Tabs } from '@mantine/core';
import { Choice } from './ui';
import { Section } from './ui';
import { Grup } from './sadeKit';
import {
  BOLUSME_ADI, BOLUSME_SORUSU, KATKI_ADI, KAZANC_VARSAYILAN, MAAS_ARALIGI, SURE_SECENEKLERI, kadroluKota, kaliciJson, katkiOrani,
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

/** “Kalıcı kural” kutusu. İşaretli değer, yöneticinin kalıcı kural adayıdır. */
function Kalici({ kural, ad }: { kural: string; ad: string }) {
  const b = useContext(PlanBaglami);
  if (!b) return null;
  const isaretli = b.plan.kalici.includes(kural);
  return <Checkbox label="Kalıcı kural" aria-label={`${ad} kalıcı kural`} checked={isaretli}
    onChange={(e) => {
      const acik = e.currentTarget.checked;
      b.guncelle((x) => { x.kalici = acik ? [...x.kalici.filter((k) => k !== kural), kural] : x.kalici.filter((k) => k !== kural); });
    }}
    classNames={{ root: 'applet-onay pol-kz-kalici', body: 'applet-onay-govde', input: 'applet-onay-kutu', label: 'applet-onay-ad', icon: 'applet-onay-ikon' }} />;
}

/** Boş bırakılabilen sayı kutusu. Yüzde alanında değer oran olarak saklanır. */
function Kutu({ label, value, onChange, yuzdeMi = false, bosOlur = false, birim, kural }: {
  label: string; value: Esik; onChange: (v: Esik) => void; yuzdeMi?: boolean; bosOlur?: boolean; birim?: string; kural?: string;
}) {
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

function Katki({ tur, plan, guncelle }: { tur: KatkiTuru; plan: KazancPlani; guncelle: Guncelle }) {
  const ad = KATKI_ADI[tur];
  const { oran, kota } = katkiOrani(plan, tur, plan.ornekCiro);
  const p = plan[tur];
  return <div className="pol-kz-katki" data-katki={tur}>
    <p>{tur === 'tanistir'
      ? 'Müşteriyi şirketle tanıştırırsınız. Satışı şirket yapar.'
      : 'Satışı siz kapatırsınız. Ürünü de siz gösterirsiniz. Kurulumu da siz yaparsınız.'}</p>
    <Grup baslik="Kota eşikleri">
      {p.kotaEsik.map((e, i) => <Kutu key={i} label={`${ad} K${i + 1} ciro eşiği`} birim="(₺)" value={e} bosOlur kural={`${tur}.kotaEsik.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaEsik[i] = v; })} />)}
    </Grup>
    {p.kotaEsik.some((e) => e === null) && <p className="pol-kz-not">Bazı kota eşikleri henüz belirlenmedi. Eşik boşsa o kotanın artışı uygulanmaz.</p>}
    <Grup baslik="Bu yılki oran">
      <Kutu label={`${ad} taban oranı`} value={p.taban} yuzdeMi kural={`${tur}.taban`} onChange={(v) => guncelle((x) => { x[tur].taban = v ?? 0; })} />
      {p.kotaArtis.map((a, i) => <Kutu key={i} label={`${ad} K${i + 1} artışı`} value={a} yuzdeMi kural={`${tur}.kotaArtis.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaArtis[i] = v ?? 0; })} />)}
    </Grup>
    <dl className="pol-kz-sonuc">
      <div><dt>Ulaşılan kota</dt><dd>{kota ? `K${kota}` : 'Kota yok'}</dd></div>
      <div><dt>Geçerli oran</dt><dd data-kazanc={`${tur}-oran`}>{yuzde(oran)}</dd></div>
      <div><dt>Bu yılki kazanç</dt><dd data-kazanc={`${tur}-bu-yil`}>{tl(plan.ornekCiro)} × {yuzde(oran)} = {tl(Math.round(plan.ornekCiro * oran))}</dd></div>
    </dl>
    <Grup baslik="Sonraki yıllardaki oran">
      {p.gecmis.map((g, i) => <Kutu key={i} label={`${ad} ${i + 1}. yıl komisyonu`} value={g} yuzdeMi kural={`${tur}.gecmis.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].gecmis[i] = v ?? 0; })} />)}
    </Grup>
    <p>Müşteri sonraki yıllarda da aynı ciroyu yaparsa şu tutarları alırsınız:</p>
    <ul className="pol-kz-yillar" data-kazanc={`${tur}-yillar`}>
      {yillaraKazanc(plan, tur, plan.ornekCiro).map((s) => <li key={s.yil}>{s.yil}. yıl sonra {yuzde(s.oran)} ile {tl(s.tutar)}</li>)}
    </ul>
  </div>;
}

const KATKI_SEKMESI: Record<KatkiTuru, string> = { tanistir: 'Yalnız tanıştırırsanız', kapatir: 'Satışı kapatırsanız' };
const SEKME_SINIFI = { list: 'pol-sekme-listesi', tab: 'pol-sekme', panel: 'pol-sekme-paneli' };

/** Seçmeli düğme grubu. APG radyo grubu gibi çalışır: ok tuşları, Home ve End seçimi taşır. */
function SureSecimi({ value, onChange }: { value: SureAy; onChange: (v: SureAy) => void }) {
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
    <p id="pol-kz-sure-ad" className="pol-kz-sure-ad">Tanıştırmanın geçerlilik süresi</p>
    <div ref={grup} role="radiogroup" aria-labelledby="pol-kz-sure-ad" className="pol-sekme-listesi pol-kz-sure-liste">
      {SURE_SECENEKLERI.map((ay, i) => <button key={ay} type="button" role="radio" aria-checked={ay === value} data-ay={ay}
        tabIndex={ay === value ? 0 : -1} className="pol-sekme" onClick={() => sec(i)} onKeyDown={(e) => tus(e, i)}>{ay} ay</button>)}
    </div>
    <Kalici kural="paylasim.sureAy" ad="Tanıştırmanın geçerlilik süresi" />
  </div>;
}

/** Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi. Yönetici her soruyu ayrı seçer (kullanıcı kararı 17 Kasım 2026). */
function Paylasim({ plan, guncelle }: { plan: KazancPlani; guncelle: Guncelle }) {
  const ciro = plan.ornekCiro;
  const p = paylasim(plan, ciro);
  const soru = (anahtar: keyof typeof BOLUSME_SORUSU) => <div className="pol-kz-alan">
    <Choice<Bolusme> label={BOLUSME_SORUSU[anahtar]} value={plan.paylasim[anahtar]}
      options={(['dus', 'tam'] as const).map((id) => ({ id, name: BOLUSME_ADI[id] }))}
      onChange={(v) => guncelle((x) => { x.paylasim[anahtar] = v; })} />
    <Kalici kural={`paylasim.${anahtar}`} ad={BOLUSME_SORUSU[anahtar]} />
  </div>;
  return <section className="pol-kz-paylasim" aria-labelledby="pol-kz-paylasim">
    <h3 id="pol-kz-paylasim">Tanıştıran ve satışı kapatan farklı kişiyse</h3>
    <p>Bir kişi müşteriyi tanıştırabilir. Başka bir kişi satışı kapatabilir.</p>
    <p>Örneğin Ahmet müşteriyi tanıştırır. İki hafta sonra Mehmet satışı kapatır.</p>
    <p>CRM, müşteri kayıtlarının tutulduğu programdır. Tanıştırma CRM'e kaydedilir.</p>
    <SureSecimi value={plan.paylasim.sureAy} onChange={(v) => guncelle((x) => { x.paylasim.sureAy = v; })} />
    <p>Tanıştırma {plan.paylasim.sureAy} ay geçerlidir.</p>
    <p>Payın nasıl bölüneceğini yönetici seçer. İlk seçenek şirketi zarardan korur.</p>
    {soru('ilkSatis')}
    {soru('kota')}
    <p>Satış {tl(ciro)} olursa ilk satışta pay şöyle bölünür:</p>
    <dl className="pol-kz-sonuc">
      <div><dt>Ahmet'in payı</dt><dd data-paylasim="tanistiran">{tl(ciro)} × {yuzde(p.tanistiranOran)} = {tl(p.tanistiran)}</dd></div>
      <div><dt>Mehmet'in payı</dt><dd data-paylasim="kapatan">{tl(ciro)} × {yuzde(p.kapatanOran)} = {tl(p.kapatan)}</dd></div>
      <div><dt>Şirketin ödediği toplam</dt><dd data-paylasim="toplam">{tl(p.toplam)}</dd></div>
    </dl>
    {soru('yillar')}
    <p>Sonraki yıllarda oranlar şöyle olur:</p>
    <ul className="pol-kz-yillar" data-paylasim="yillar">
      {p.yillar.map((y) => <li key={y.yil}>{y.yil}. yılda Ahmet {yuzde(y.tanistiran)}, Mehmet {yuzde(y.kapatan)} alır.</li>)}
    </ul>
  </section>;
}

/** İşaretli değerlerden JSON üretir. JSON yalnız bu tarayıcıda oluşur. Hiçbir sunucuya gönderilmez. */
function KaliciKurallar({ plan, proje }: { plan: KazancPlani; proje: Marka }) {
  const [acik, setAcik] = useState(false);
  const [durum, setDurum] = useState('');
  const json = acik ? JSON.stringify(kaliciJson(plan, proje, new Date()), null, 2) : '';
  const kopyala = async () => {
    try { await navigator.clipboard.writeText(json); setDurum('JSON kopyalandı.'); } catch { setDurum('JSON kopyalanamadı. Metni kutudan seçip kopyalayın.'); }
  };
  const indir = () => {
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `kalici-kurallar-${proje}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setDurum('JSON dosyası indirildi.');
  };
  return <section className="pol-kz-paylasim" aria-labelledby="pol-kz-kalici">
    <h3 id="pol-kz-kalici">Kalıcı kurallar</h3>
    <p>Yönetici bir değeri kalıcı yapmak isterse yanındaki “Kalıcı kural” kutusunu işaretler.</p>
    <p>{plan.kalici.length ? `${plan.kalici.length} değer işaretli.` : 'Henüz hiçbir değer işaretlenmedi.'}</p>
    <button type="button" className="pol-sekme" onClick={() => setAcik(true)}>Kalıcı kuralları JSON olarak al</button>
    {acik && <>
      <p>JSON yalnız bu tarayıcıda oluşur. Hiçbir sunucuya gönderilmez.</p>
      <textarea className="param-input pol-kz-json" aria-label="Kalıcı kurallar JSON" readOnly value={json} rows={10} />
      <div className="pol-kz-dugmeler">
        <button type="button" className="pol-sekme" onClick={kopyala}>JSON'u kopyalayın</button>
        <button type="button" className="pol-sekme" onClick={indir}>JSON dosyasını indirin</button>
      </div>
      <p role="status">{durum}</p>
    </>}
  </section>;
}

function Kadrolu({ plan, guncelle }: { plan: KazancPlani; guncelle: Guncelle }) {
  const k = plan.kadrolu;
  return <>
    <p>Kadrolu uzman SGK'lı çalışandır. Kadrolu uzman bu iş ortaklığı planının dışındadır.</p>
    <p>Maaşı ayda {tl(MAAS_ARALIGI[0])} ile {tl(MAAS_ARALIGI[1])} arasındadır. Kadrolu uzman maaşa ek olarak prim alır.</p>
    <Grup baslik="Maaş ve kota">
      <Kutu label="Aylık maaş" birim="(₺)" value={k.maas} kural="kadrolu.maas" onChange={(v) => guncelle((x) => { x.kadrolu.maas = v ?? 0; })} />
      <Kutu label="Kota oranı" value={k.kotaOrani} yuzdeMi kural="kadrolu.kotaOrani" onChange={(v) => guncelle((x) => { x.kadrolu.kotaOrani = v ?? 0; })} />
      <Kutu label="Kota üstü prim oranı" value={k.primOrani} yuzdeMi bosOlur kural="kadrolu.primOrani" onChange={(v) => guncelle((x) => { x.kadrolu.primOrani = v; })} />
    </Grup>
    <dl className="pol-kz-sonuc">
      <div><dt>Aylık kota</dt><dd data-kazanc="kadrolu-kota">{tl(kadroluKota(plan))} ciro</dd></div>
      <div><dt>Prim oranı</dt><dd>{k.primOrani === null ? 'Henüz belirlenmedi' : yuzde(k.primOrani)}</dd></div>
    </dl>
    <p>Kota, aylık maaşın {yuzde(k.kotaOrani)} kadarı cirodur. Kotayı geçen ciro için prim hesaplanır.</p>
  </>;
}

export function KazancPlaniBolumu({ proje, rol }: { proje: Marka; rol: RolId }) {
  const { plan, guncelle } = useKazancPlani(proje);
  return <PlanBaglami.Provider value={{ plan, guncelle }}><Section id="kazanc-plani" title="Kazanç planı" className="pol-kz-plan">
    {rol === 'kadrolu' ? <Kadrolu plan={plan} guncelle={guncelle} /> : <>
      <p>Herkes iş ortağıdır. Kazancınızı rolünüz değil, satıştaki katkınız belirler.</p>
      <p>Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3, yıllık ciro kotalarıdır. Her katkı türünün kotası ayrıdır.</p>
      <p>Ciro bir kotayı geçerse o kotanın artışı oranınıza eklenir.</p>
      <Grup baslik="Örnek ciro">
        <Kutu label="Örnek yıllık ciro" birim="(₺)" value={plan.ornekCiro} onChange={(v) => guncelle((x) => { x.ornekCiro = v ?? 0; })} />
      </Grup>
      {/* Kullanıcı kararı 17 Kasım 2026: iki katkı türü sekmedir. Bir sekme açıkken diğerinin içeriği görünmez. */}
      <Tabs defaultValue="tanistir" keepMounted={false} unstyled classNames={SEKME_SINIFI}>
        <Tabs.List aria-label="Satıştaki katkınız">
          {(['tanistir', 'kapatir'] as const).map((t) => <Tabs.Tab key={t} value={t}>{KATKI_SEKMESI[t]}</Tabs.Tab>)}
        </Tabs.List>
        {(['tanistir', 'kapatir'] as const).map((t) => <Tabs.Panel key={t} value={t}>
          <Katki tur={t} plan={plan} guncelle={guncelle} />
        </Tabs.Panel>)}
      </Tabs>
      <Paylasim plan={plan} guncelle={guncelle} />
      <p>Kadrolu uzman bu planın dışındadır. Kadrolu uzman maaş ve prim alır.</p>
    </>}
    <p className="pol-kz-not">Değerleri değiştirebilirsiniz. Değerler yalnız bu tarayıcıda saklanır.</p>
    <KaliciKurallar plan={plan} proje={proje} />
    <button type="button" className="pol-sekme" onClick={() => yaz(proje, structuredClone(KAZANC_VARSAYILAN))}>Planın ilk değerlerine dönün</button>
  </Section></PlanBaglami.Provider>;
}
