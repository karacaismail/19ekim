import { createContext, useId, type CSSProperties, type ReactNode, useContext, useLayoutEffect, useRef, useState, useSyncExternalStore, type KeyboardEvent } from 'react';
import { Checkbox, Modal, NumberInput, TextInput } from '@mantine/core';
import { useMotionMs } from '../lib/motion';
import { IconPencil, IconAdjustmentsHorizontal, IconCalendarStats, IconChartLine, IconFlame, IconLock, IconLockOpen, IconRocket, IconStar, IconStarFilled, IconTarget, IconTrophy } from '@tabler/icons-react';
import { useGiris } from '../lib/giris';
import { GirisEkrani } from './Giris';
import { Choice } from './ui';
import { Section } from './ui';
import { Grup } from './sadeKit';
import {
  KUMULATIF_KURALI, KOTA_KURALI, kotaTamam, projeVarsayilani, kuralListesi, ornekHesap, BOLUSME_ADI, BOLUSME_SORUSU, KATKI_ADI, MAAS_ARALIGI, SURE_SECENEKLERI, kadroluKota, kaliciJson, katkiOrani, paketPrimi,
  paylasim, planOku, yenilemeKazanci, ODEME_KURALLARI, ODEME_SURESI, YENILEME_ADI, YENILEME_DONEMI, type Bolusme, type Esik, type KatkiTuru, type KazancPlani, type SureAy,
} from '../data/kazancPlani';
import { yillikFiyat, type Marka, type RolId } from '../data/satisOrtakligi';
import { usePersonaAyar } from '../lib/personaStore';
import { num } from '../lib/format';
import '../styles/politikalar.css';

const tl = (n: number) => `${num(n)} ₺`;
const yuzde = (n: number) => `%${num(Math.round(n * 1000) / 10)}`;

/* Plan her proje için ayrı anahtarda, yalnız bu tarayıcıda saklanır. Aynı sayfadaki bütün okuyucular aynı değeri görür. */
// v6: ödeme süreleri ve 90 günlük koruma (20 Kasım 2026 Cuma). Eski kayıt yeni başlangıç değerlerini ezmesin.
const anahtar = (proje: Marka) => `turksab-kazanc-plani-v6-${proje}`;
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
 * Bu oturumda ana ekranda kalıcı yapılan değerler. Bu değerlerin yeri boş kalmaz, aynı boyda bir not durur.
 * Kullanıcı kararı 17 Kasım 2026 Salı: bir şey değişince ekran zıplamaz. Sayfa yenilenince değer yine gizlenir.
 */
const buOturumda = new Set<string>();

/**
 * Yer ayıran yığın (kullanıcı kararı 17 Kasım 2026 Salı: değişimde ekran zıplamaz).
 * Bütün hâller aynı hücrede üst üste durur. Yalnız etkin hâl görünür. Yükseklik en büyük hâlin yüksekliğidir.
 */
function Yigin({ etkin, children }: { etkin: number; children: ReactNode[] }) {
  return <div className="pol-kz-yigin">
    {children.map((c, i) => <div key={i} className="pol-kz-yigin-oge" data-etkin={i === etkin ? '' : undefined}
      aria-hidden={i === etkin ? undefined : true} inert={i !== etkin}>{c}</div>)}
  </div>;
}

/**
 * Kullanıcı kararı 17 Kasım 2026 Salı: kalıcı kural ana ekranda görünmez.
 * Yönetici kalıcı kuralı yalnız “KALICI KURALLAR” penceresinden değiştirir.
 */
function useGizli(kural?: string) {
  const b = useContext(PlanBaglami);
  const pencerede = useContext(PencereBaglami);
  return Boolean(kural && !pencerede && b?.plan.kalici.includes(kural));
}

/** Gizli değer bu oturumda kalıcı yapıldıysa yeri not olarak kalır. */
const yerTutulur = (kural?: string) => Boolean(kural && buOturumda.has(kural));
const YER_NOTU = 'Kalıcı kural oldu. Yönetici bu değeri “Parametreler” düğmesinden yönetir.';

/** Ana ekranda “Kalıcı kural” kutusu. Pencerede “Kalıcı kuraldan çıkarın” düğmesi. */
function Kalici({ kural, ad, kisa = false }: { kural: string; ad: string; kisa?: boolean }) {
  const b = useContext(PlanBaglami);
  const pencerede = useContext(PencereBaglami);
  if (!b) return null;
  const cikar = () => { buOturumda.delete(kural); b.guncelle((x) => { x.kalici = x.kalici.filter((k) => k !== kural); }); };
  if (pencerede) return <button type="button" className="pol-sekme pol-kz-cikar" aria-label={`${ad}: kalıcı kuraldan çıkarın`} onClick={cikar}>Kalıcı kuraldan çıkarın</button>;
  return <Checkbox label={kisa ? 'Kalıcı' : 'Kalıcı kural'} aria-label={`${ad} kalıcı kural`} checked={false}
    onChange={(e) => {
      if (!e.currentTarget.checked) return;
      buOturumda.add(kural);
      b.guncelle((x) => { x.kalici = [...x.kalici.filter((k) => k !== kural), kural]; });
    }}
    classNames={{ root: 'applet-onay pol-kz-kalici', body: 'applet-onay-govde', input: 'applet-onay-kutu', label: 'applet-onay-ad', icon: 'applet-onay-ikon' }} />;
}

/** Boş bırakılabilen sayı kutusu. Yüzde alanında değer oran olarak saklanır. */
function Kutu({ label, kisa, value, onChange, yuzdeMi = false, bosOlur = false, birim, kural }: {
  label: string; value: Esik; onChange: (v: Esik) => void; yuzdeMi?: boolean; bosOlur?: boolean; birim?: string; kural?: string;
  /** Grup içindeki kısa görünür ad. Tam ad ekran okuyucuya ve JSON'a gider. */
  kisa?: string;
}) {
  const pencerede = useContext(PencereBaglami);
  const kimlik = useId();
  if (useGizli(kural)) {
    if (!yerTutulur(kural)) return null;
    // Alan kalıcı yapıldı. Aynı boyda bir not yerinde kalır, aşağıdaki içerik kaymaz.
    // Not, gerçek alanla aynı çerçevede durur. Böylece yüksekliği alanla birebir aynıdır.
    if (kisa) return <div className="pol-kz-tek-kap"><div className="pol-kz-tek pol-kz-yer" data-yer-tutucu={kural}>
      <span className="pol-kz-tek-sol"><IconLock aria-hidden="true" size={18} stroke={1.75} /> Kalıcı</span>
      <span className="pol-kz-tek-deger" aria-label={`${label}: kalıcı kural oldu`}>Parametrelerde</span>
      <span className="pol-kz-tek-ad">{kisa}</span>
    </div></div>;
    return <div className="pol-kz-alan pol-kz-yer" data-yer-tutucu={kural}>
      <div className="pol-kz-sikisik-ust"><span className="so2-girdi-ad">{label}</span></div>
      <TextInput className="so2-girdi" classNames={{ input: 'param-input so2-girdi-kutu pol-kz-yer-girdi' }} aria-label={`${label}: kalıcı kural oldu`}
        value="Kalıcı kural oldu" readOnly size="md" />
    </div>;
  }
  const goster = value === null ? '' : yuzdeMi ? Math.round(value * 1000) / 10 : value;
  const degis = (v: string | number) => {
    if (v === '' && bosOlur) { onChange(null); return; }
    if (typeof v === 'number' && Number.isFinite(v) && v >= 0) onChange(yuzdeMi ? v / 100 : v);
  };
  const kutu = <NumberInput className="so2-girdi" classNames={{ label: 'so2-girdi-ad', input: 'param-input so2-girdi-kutu' }}
    label={birim ? <>{label} <span className="so2-girdi-birim">{birim}</span></> : label}
    aria-label={label}
    value={goster}
    onChange={degis}
    hideControls allowNegative={false} thousandSeparator="." decimalSeparator="," allowedDecimalSeparators={[',']} decimalScale={2}
    prefix={yuzdeMi ? '%' : undefined} max={yuzdeMi ? 100 : undefined} size="md" />;
  // Kullanıcı kararı 17 Kasım 2026 Salı: alan az yer kaplar. Kısa ad ve “Kalıcı” kutusu aynı satırdadır.
  // Kullanıcı kararı 17 Kasım 2026 Salı: “Kalıcı” kutusu, değer ve ad tek çerçevede, tek satırda durur.
  if (kural && kisa && !pencerede) return <div className="pol-kz-tek-kap"><div className="pol-kz-tek">
    <span className="pol-kz-tek-sol"><Kalici kural={kural} ad={label} kisa /></span>
    <NumberInput id={kimlik} className="pol-kz-tek-kutu" classNames={{ input: 'pol-kz-tek-girdi', section: 'pol-kz-tek-kalem' }} aria-label={label}
      value={goster} onChange={degis}
      hideControls allowNegative={false} thousandSeparator="." decimalSeparator="," allowedDecimalSeparators={[',']} decimalScale={2}
      prefix={yuzdeMi ? '%' : undefined} suffix={birim ? ' ₺' : undefined} max={yuzdeMi ? 100 : undefined} size="md"
      rightSection={<IconPencil aria-hidden="true" size={16} stroke={1.75} />} rightSectionPointerEvents="none" />
    <label className="pol-kz-tek-ad" htmlFor={kimlik}>{kisa}</label>
  </div></div>;
  return kural ? <div className="pol-kz-alan">{kutu}<Kalici kural={kural} ad={label} /></div> : kutu;
}

/** Bütün alanları kalıcı olan grup ana ekranda çizilmez. */
function GrupVarsa({ baslik, aciklama, kurallar, children }: { baslik: string; aciklama?: ReactNode; kurallar: string[]; children: ReactNode }) {
  const b = useContext(PlanBaglami);
  const pencerede = useContext(PencereBaglami);
  const kimlik = useId();
  if (!pencerede && b && kurallar.every((k) => b.plan.kalici.includes(k) && !buOturumda.has(k))) return null;
  // fieldset yerine grup rolü: WebKit, ekran daralınca legend genişliğini güncellemiyor ve sayfa taşıyor.
  return <div role="group" aria-labelledby={kimlik} className="so2-grup">
    <p id={kimlik} className="so2-grup-baslik">{baslik}</p>
    {aciklama ? <div className="pol-kz-grup-aciklama">{aciklama}</div> : null}
    <div className="so2-grup-alanlar">{children}</div>
  </div>;
}

function Katki({ tur, plan, guncelle }: { tur: KatkiTuru; plan: KazancPlani; guncelle: Guncelle }) {
  const ad = KATKI_ADI[tur];
  const p = plan[tur];
  const ids = (alan: string, n: number) => Array.from({ length: n }, (_, i) => `${tur}.${alan}.${i}`);
  // Kullanıcı kararı 20 Kasım 2026 Cuma: yenileme oranı yalnız satışı kapatan içindir. Tanıştıran ilk 3 aydan sonra pay almaz.
  const yenileme = tur === 'kapatir' ? ['kapatir.gecmis.0'] : [];
  const hepsiKalici = [`${tur}.taban`, ...ids('kotaEsik', 3), ...ids('kotaArtis', 3), ...yenileme].every((k) => plan.kalici.includes(k) && !buOturumda.has(k));
  return <div className="pol-kz-katki" data-katki={tur}>
    <p>{tur === 'tanistir'
      ? 'Müşteriyi bize yönlendirirsiniz. Satışı biz kapatırız. Müşteri satın alırsa pay kazanırsınız. Müşteri satın almazsa pay yoktur. Pay en çok 3 ay sürer.'
      : 'Müşteriyi yalnız tanıştırmazsınız. Satışı da siz kapatırsınız. Onboarding de sizin işinizdir. Onboarding, yeni müşterinin kurulumu ve ilk eğitimidir. Müşteri satın alırsa pay kazanırsınız.'}</p>
    <p className="pol-kz-nasil">Değeri değiştirmek için beyaz kutuya tıklayın. Sonra yeni sayıyı yazın. Sonuç hemen değişir. “Kalıcı” kutusunu yalnız yönetici işaretler. İşaretlenen değer sabitlenir.</p>
    {hepsiKalici && <p className="pol-kz-not">Bu sekmedeki bütün değerler kalıcı kuraldır. Yönetici bu değerleri “Parametreler” düğmesinden yönetir.</p>}
    {(() => {
      const taban = <Kutu label={`${ad} taban oranı`} kisa="Başlangıç oranı" value={p.taban} yuzdeMi kural={`${tur}.taban`} onChange={(v) => guncelle((x) => { x[tur].taban = v ?? 0; })} />;
      const esikler = p.kotaEsik.map((e, i) => <Kutu key={`e${i}`} label={`${ad} K${i + 1} ciro eşiği`} kisa={`K${i + 1} için aylık ciro`} birim="(₺)" value={e} bosOlur kural={`${tur}.kotaEsik.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaEsik[i] = v; })} />);
      const artislar = p.kotaArtis.map((a, i) => <Kutu key={`a${i}`} label={`${ad} K${i + 1} artışı`} kisa={`K${i + 1} ek puanı`} value={a} yuzdeMi kural={`${tur}.kotaArtis.${i}`}
        onChange={(v) => guncelle((x) => { x[tur].kotaArtis[i] = v ?? 0; })} />);
      const sonrakiler = tur === 'kapatir' && <Kutu label={YENILEME_ADI} kisa="Yenileme oranı" value={p.gecmis[0]} yuzdeMi kural="kapatir.gecmis.0"
        onChange={(v) => guncelle((x) => { x.kapatir.gecmis[0] = v ?? 0; })} />;
      const tum = [`${tur}.taban`, ...ids('kotaEsik', 3), ...ids('kotaArtis', 3), ...yenileme];
      const gorunen = tum.filter((k) => !plan.kalici.includes(k) || buOturumda.has(k)).length;
      const gorunur = (kurallar: string[]) => kurallar.some((k) => !plan.kalici.includes(k) || buOturumda.has(k));
      const bosEsik = p.kotaEsik.some((e) => e === null) && <p className="pol-kz-not">Bazı kota eşikleri henüz belirlenmedi. Eşik boşsa o kotanın artışı uygulanmaz.</p>;
      // Kullanıcı kararı 17 Kasım 2026 Salı: az alan kaldıysa alanlar tek satırda, tek grupta durur.
      if (gorunen > 0 && gorunen <= 4) return <>
        <GrupVarsa kurallar={tum} baslik={`${ad} için değerler`} aciklama={<ul className="pol-kz-sozluk">
          {gorunur([`${tur}.taban`]) && <li>“Başlangıç oranı” kutusu: Hiçbir kotaya ulaşmazsanız bu oranı alırsınız.</li>}
          {gorunur(ids('kotaEsik', 3)) && <li>“Aylık ciro” kutusu: Bu ciroya ulaşırsanız üst seviyeye geçersiniz.</li>}
          {gorunur(ids('kotaArtis', 3)) && <li>“Ek puan” kutusu: Bir üst seviyeye geçince oranınıza bu puan eklenir.</li>}
          {gorunur(yenileme) && <li>“Yenileme oranı” kutusu: Yıllık yenilemede bu oranı alırsınız.</li>}
        </ul>}>{taban}{esikler}{artislar}{sonrakiler}</GrupVarsa>
        {bosEsik}
      </>;
      return <>
        <GrupVarsa kurallar={[`${tur}.taban`]} baslik="Başlangıç oranı" aciklama="Hiçbir kotaya ulaşmazsanız bu oranı alırsınız.">{taban}</GrupVarsa>
        <GrupVarsa kurallar={ids('kotaEsik', 3)} baslik="Seviye atlamak için gereken aylık ciro" aciklama="Aylık cironuz bu tutara ulaşırsa bir üst seviyeye geçersiniz. K1, K2 ve K3 seviyelerin adıdır.">{esikler}</GrupVarsa>
        {bosEsik}
        <GrupVarsa kurallar={ids('kotaArtis', 3)} baslik="Seviye atlayınca eklenen puan" aciklama="Bir üst seviyeye geçince oranınıza bu puan eklenir.">{artislar}</GrupVarsa>
        {tur === 'kapatir' && <GrupVarsa kurallar={yenileme} baslik="Yıllık yenileme oranı" aciklama={`Yıllık yenilemede bu oranı alırsınız. Oran ${YENILEME_DONEMI} geçerlidir. 25. aydan sonra pay yoktur.`}>{sonrakiler}</GrupVarsa>}
      </>;
    })()}
  </div>;
}

/** Bir katkı türünün örnek satıştaki sonucu. Kart koyu zeminlidir (kullanıcı kararı 17 Kasım 2026 Salı). */
function KatkiSonucu({ tur, plan }: { tur: KatkiTuru; plan: KazancPlani }) {
  const { oran, kota } = katkiOrani(plan, tur, plan.ornekCiro);
  return <section className="pol-kz-kart pol-kz-kart-koyu" aria-labelledby={`pol-kz-sonuc-${tur}`}>
    <h4 id={`pol-kz-sonuc-${tur}`}>{KATKI_SEKMESI[tur]}</h4>
    <p className="pol-kz-not">Bu ayki kazancınız</p>
    <p className="pol-kz-rakam" data-kazanc={`${tur}-tutar`}>{tl(Math.round(plan.ornekCiro * oran))}</p>
    <dl className="pol-kz-sonuc pol-kz-sonuc-satir">
      <div><dt>Hesap</dt><dd data-kazanc={`${tur}-bu-yil`}>{tl(plan.ornekCiro)} × {yuzde(oran)} = {tl(Math.round(plan.ornekCiro * oran))}</dd></div>
      <div><dt>Geçerli oran</dt><dd data-kazanc={`${tur}-oran`}>{yuzde(oran)}</dd></div>
      <div><dt>Ulaşılan kota</dt><dd>{kota ? `K${kota}` : 'Kota yok'}</dd></div>
    </dl>
    {tur === 'tanistir' ? <>
      <p>Pay en çok {ODEME_SURESI.tanistir} ay sürer. Her ay aynı ciroyu yaparsanız şu tutarı alırsınız:</p>
      <ul className="pol-kz-yillar" data-kazanc={`${tur}-yillar`}>
        <li>{ODEME_SURESI.tanistir} ayda toplam {tl(Math.round(plan.ornekCiro * oran) * ODEME_SURESI.tanistir)}</li>
      </ul>
    </> : <>
      <p>Aylık pakette pay en çok {ODEME_SURESI.aylik} ay sürer. Her ay aynı ciroyu yaparsanız şu tutarları alırsınız:</p>
      <Yigin etkin={kotaTamam(plan, tur, plan.ornekCiro) ? 1 : 0}>{[
        <p key="uyari" className="pol-kz-uyari" data-kota-kurali={tur}>Aylık ciro K1 kotasının altında. Bu yüzden yıllık yenilemede pay yoktur.</p>,
        <span key="bos" />,
      ]}</Yigin>
      <ul className="pol-kz-yillar" data-kazanc={`${tur}-yillar`}>
        <li>{ODEME_SURESI.aylik} ayda toplam {tl(Math.round(plan.ornekCiro * oran) * ODEME_SURESI.aylik)}</li>
        <li>Yıllık yenilemede, {YENILEME_DONEMI}: {yuzde(yenilemeKazanci(plan, plan.ornekCiro).oran)} ile {tl(yenilemeKazanci(plan, plan.ornekCiro).tutar)}</li>
      </ul>
    </>}
  </section>;
}


const KATKI_SEKMESI: Record<KatkiTuru, string> = { tanistir: 'Yalnız tanıştırırsanız', kapatir: 'Satışı kapatırsanız' };

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
};

/** Pay sorusu kartı. Ana ekranda kalıcıysa çizilmez. */
function PaySorusu({ anahtar }: { anahtar: keyof typeof BOLUSME_SORUSU }) {
  const b = useContext(PlanBaglami)!;
  const id = `paylasim.${anahtar}`;
  const gizli = useGizli(id);
  if (gizli && !yerTutulur(id)) return null;
  const icerik = <>
    <Choice<Bolusme> label={BOLUSME_SORUSU[anahtar]} value={b.plan.paylasim[anahtar]}
      options={(['dus', 'tam'] as const).map((x) => ({ id: x, name: BOLUSME_ADI[x] }))}
      onChange={(v) => b.guncelle((x) => { x.paylasim[anahtar] = v; })} />
    <Kalici kural={id} ad={BOLUSME_SORUSU[anahtar]} />
  </>;
  return <KararKarti no={anahtar} baslik={BOLUSME_SORUSU[anahtar]} aciklama={SORU_ACIKLAMASI[anahtar]}>
    {gizli ? <Yigin etkin={1}>{[icerik, <p key="not" className="pol-kz-yer-kutu" data-yer-tutucu={id}>{YER_NOTU}</p>]}</Yigin> : icerik}
  </KararKarti>;
}

function SureKarti() {
  const b = useContext(PlanBaglami)!;
  const gizli = useGizli('paylasim.sureAy');
  if (gizli && !yerTutulur('paylasim.sureAy')) return null;
  const icerik = <>
    <SureSecimi value={b.plan.paylasim.sureAy} onChange={(v) => b.guncelle((x) => { x.paylasim.sureAy = v; })} />
    <Kalici kural="paylasim.sureAy" ad="Tanıştırmanın geçerlilik süresi" />
  </>;
  return <KararKarti no="sure" baslik="Tanıştırmanın geçerlilik süresi" aciklama={`Tanıştırma ${b.plan.paylasim.sureAy} ay geçerlidir. Satış bu sürede kapanmazsa Ahmet pay almaz.`}>
    {gizli ? <Yigin etkin={1}>{[icerik, <p key="not" className="pol-kz-yer-kutu" data-yer-tutucu="paylasim.sureAy">{YER_NOTU}</p>]}</Yigin> : icerik}
  </KararKarti>;
}

/** Yönetici kararları. Tanıştıran ile satışı kapatan farklı kişiyse pay bölüşmesi (kullanıcı kararı 17 Kasım 2026). */
function Kararlar({ plan }: { plan: KazancPlani }) {
  const hepsiKalici = ['paylasim.sureAy', 'paylasim.ilkSatis', 'paylasim.kota'].every((k) => plan.kalici.includes(k) && !buOturumda.has(k));
  return <div className="pol-kz-adim-govde">
    <aside className="pol-kz-ornek" aria-label="Örnek">
      <p className="pol-kz-ornek-ad">Örnek</p>
      <p>Ahmet müşteriyi tanıştırır. İki hafta sonra Mehmet satışı kapatır. İkisi de pay ister.</p>
      <p>Ahmet yalnız ilk 3 ayda pay alır. Sonra yalnız Mehmet pay alır.</p>
      <p>CRM, müşteri kayıtlarının tutulduğu programdır. Tanıştırma CRM'e kaydedilir.</p>
    </aside>
    {hepsiKalici && <p className="pol-kz-not">Bütün kararlar kalıcı kuraldır. Yönetici kararları “Parametreler” düğmesinden yönetir.</p>}
    <SureKarti />
    <PaySorusu anahtar="ilkSatis" />
    <PaySorusu anahtar="kota" />
  </div>;
}

/** Örnek hesap tablosu. Her katkı türü kendi sekmesindedir. Açık gelen sekme satışı kapatmadır. */
function OrnekHesap({ plan }: { plan: KazancPlani }) {
  const [tur, setTur] = useState<KatkiTuru>('kapatir');
  return <section className="pol-kz-kart pol-kz-ornek-hesap" aria-labelledby="pol-kz-ornek-hesap">
    <h4 id="pol-kz-ornek-hesap">Örnek hesap</h4>
    <p>Aylık cironuz {tl(plan.ornekCiro)} olsun. Ciro her ay aynı kalsın.</p>
    <KatkiAnahtari value={tur} onChange={setTur} />
    {/* İki tablo üst üste durur. Anahtar ya da ciro değişince kartın boyu değişmez. */}
    <Yigin etkin={tur === 'tanistir' ? 0 : 1}>{(['tanistir', 'kapatir'] as const).map((t) => {
      const h = ornekHesap(plan, t);
      return <div key={t}>
          {h.satirlar.length === 0 ? <p className="pol-kz-not">Bu katkının oranları henüz girilmedi.</p> : <>
            <p className="pol-kz-tablo-ad" id={`pol-kz-ornek-tablo-${t}`}>{KATKI_SEKMESI[t]}: örnek hesap</p>
            <div className="table-frame"><div className="table-scroll" role="region" aria-labelledby={`pol-kz-ornek-tablo-${t}`} tabIndex={0}>
              <table role="table" className="data-table pol-kz-tablo" data-ornek-hesap={t}>
                <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Dönem</th><th role="columnheader" scope="col">Oran</th><th role="columnheader" scope="col">Ciro</th><th role="columnheader" scope="col">Kazanç</th></tr></thead>
                <tbody role="rowgroup">{h.satirlar.map((r) => <tr role="row" key={r.ad}>
                  <th role="rowheader" scope="row">{r.ad}</th><td role="cell" data-ad="Oran">{yuzde(r.oran)}</td><td role="cell" data-ad="Ciro">{tl(r.ciro)}</td><td role="cell" data-ad="Kazanç">{tl(r.tutar)}</td>
                </tr>)}</tbody>
                <tfoot role="rowgroup"><tr role="row"><th role="rowheader" scope="row" colSpan={3}>{t === 'tanistir' ? `${h.ay} ayda toplam` : `Aylık pakette ${h.ay} ayda toplam`}</th><td role="cell" data-ad="Toplam kazanç" data-ornek-toplam={t}>{tl(h.toplam)}</td></tr></tfoot>
              </table>
            </div></div>
            <Yigin etkin={h.k1Bos ? 0 : !h.k1Gecti && t === 'kapatir' ? 1 : 2}>{[
              <p key="bos" className="pol-kz-not">K1 eşiği boş. Örnek, K1 kotasının geçildiğini kabul eder.</p>,
              <p key="uyari" className="pol-kz-uyari">Aylık ciro K1 eşiğinin altında. Bu yüzden yıllık yenilemede pay yoktur.</p>,
              <span key="yok" />,
            ]}</Yigin>
            <p className="pol-kz-not">{t === 'tanistir' ? 'Tanıştıran yalnız ilk 3 aydaki ödemelerden pay alır.' : 'Yıllık pakette bedelin tamamı satış ayının cirosudur. Pay satış ayında bir kerede ödenir. Yenileme satırı, yenileme bedelinin bu ciroya eşit olduğunu varsayar.'}</p>
          </>}
      </div>;
    })}</Yigin>
  </section>;
}

function PaySonucu({ plan }: { plan: KazancPlani }) {
  const ciro = plan.ornekCiro;
  const p = paylasim(plan, ciro);
  return <section className="pol-kz-kart" aria-labelledby="pol-kz-pay-sonuc">
    <h4 id="pol-kz-pay-sonuc">Ahmet tanıştırır, Mehmet satışı kapatırsa</h4>
    <p>Tanıştırma {plan.paylasim.sureAy} ay geçerlidir. Aylık ciro {tl(ciro)} olursa ilk 3 ayda pay şöyle bölünür:</p>
    <p className="pol-kz-rakam">{tl(p.toplam)}<span className="pol-kz-rakam-ek"> şirketin ödediği toplam</span></p>
    <div className="pol-kz-bolus" aria-hidden="true" style={{ '--pay-a': String(p.toplam ? p.tanistiran / p.toplam : 0) } as CSSProperties}>
      <span className="pol-kz-bolus-a" /><span className="pol-kz-bolus-m" />
    </div>
    <dl className="pol-kz-sonuc pol-kz-sonuc-satir">
      <div><dt><span className="pol-kz-isaret pol-kz-isaret-a" aria-hidden="true" />Ahmet'in payı</dt><dd data-paylasim="tanistiran">{tl(ciro)} × {yuzde(p.tanistiranOran)} = {tl(p.tanistiran)}</dd></div>
      <div><dt><span className="pol-kz-isaret pol-kz-isaret-m" aria-hidden="true" />Mehmet'in payı</dt><dd data-paylasim="kapatan">{tl(ciro)} × {yuzde(p.kapatanOran)} = {tl(p.kapatan)}</dd></div>
      <div><dt>Şirketin ödediği toplam</dt><dd data-paylasim="toplam">{tl(p.toplam)}</dd></div>
    </dl>
    <p>Sonraki aylarda pay şöyle olur:</p>
    <ul className="pol-kz-yillar" data-paylasim="sonraki">
      <li>Aylık pakette 4. aydan {ODEME_SURESI.aylik}. aya kadar Ahmet pay almaz. Mehmet {yuzde(p.sonrakiOran)} alır.</li>
      <li>Yıllık yenilemede Ahmet pay almaz. Mehmet {YENILEME_DONEMI} {yuzde(p.yenilemeOran)} alır.</li>
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
    return <Kutu label={YENILEME_ADI} yuzdeMi value={plan.kapatir.gecmis[0]} kural={id} onChange={(v) => guncelle((x) => { x.kapatir.gecmis[0] = v ?? 0; })} />;
  }
  const k = plan.kadrolu;
  if (alan === 'maas') return <Kutu label="Aylık net maaş" birim="(₺)" value={k.maas} kural={id} onChange={(v) => guncelle((x) => { x.kadrolu.maas = v ?? 0; })} />;
  if (alan === 'kotaOrani') return <Kutu label="Maaş kotası oranı" yuzdeMi value={k.kotaOrani} kural={id} onChange={(v) => guncelle((x) => { x.kadrolu.kotaOrani = v ?? 0; })} />;
  // iStoc paket kademeleri de kalıcı kural olabilir. Pencere doğru kutuyu çizer.
  if (alan === 'paketEsik') return <Kutu label={`K${Number(sira) + 1} paket eşiği`} birim="(adet)" value={k.paketEsik[Number(sira)]} kural={id} onChange={(v) => guncelle((x) => { x.kadrolu.paketEsik[Number(sira)] = Math.round(v ?? 0); })} />;
  if (alan === 'paketOran') return <Kutu label={`K${Number(sira) + 1} prim oranı`} yuzdeMi value={k.paketOran[Number(sira)]} kural={id} onChange={(v) => guncelle((x) => { x.kadrolu.paketOran[Number(sira)] = v ?? 0; })} />;
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
  const sure = useMotionMs('--motion-duration-base');
  const { kopyala, indir, durum } = useKaliciJson(plan, proje);
  const girisli = useGiris();
  const { json } = useKaliciJson(plan, proje);
  const sayi = plan.kalici.length;
  const sirali = kuralListesi(plan).map((k) => k.id).filter((id) => plan.kalici.includes(id));
  const kapat = () => { setAcik(false); window.setTimeout(() => acan.current?.focus(), 0); };
  return <>
    {/* Kullanıcı kararı 17 Kasım 2026 Salı: yalnız ikonlu “Parametreler” düğmesi. Sağ kenara yapışık, dikeyde ortada. */}
    <button ref={acan} type="button" className="pol-kz-parametreler" aria-haspopup="dialog" aria-label="Parametreler" title="Parametreler" onClick={() => setAcik(true)}>
      <IconAdjustmentsHorizontal aria-hidden="true" size={26} stroke={1.75} />
    </button>
    <Modal opened={acik} onClose={kapat} title="Parametreler" size="80vw" centered radius={0} returnFocus={false}
      transitionProps={{ duration: sure, timingFunction: 'var(--motion-ease-standard)' }} overlayProps={{ backgroundOpacity: 0.55 }}
      closeButtonProps={{ 'aria-label': 'Pencereyi kapat', size: 'xl' }}
      classNames={{ inner: 'pol-kz-pencere-kabuk', content: 'oy-pencere pol-kz-pencere', header: 'oy-pencere-ust pol-kz-pencere-ust', title: 'oy-pencere-baslik', body: 'oy-pencere-govde', close: 'oy-pencere-kapat' }}>
      <PencereBaglami.Provider value>
        {!girisli ? <GirisEkrani pencerede aciklama="Parametreler yalnız ekip içindir. Görmek için kullanıcı adı ve parolayla giriş yapın." /> : <>
        <h3 className="pol-kz-pencere-ara">Kalıcı kurallar</h3>
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
        <section className="pol-kz-pencere-bolum" aria-labelledby="pol-kz-json-baslik">
          <h3 id="pol-kz-json-baslik">JSON</h3>
          <p>JSON bütün güncel değerleri içerir. Her değerin yanında kalıcı kural olup olmadığı yazar. JSON yalnız bu tarayıcıda oluşur. Hiçbir sunucuya gönderilmez.</p>
          <textarea className="param-input pol-kz-json" aria-label="Kazanç planı JSON" readOnly value={json()} rows={10} />
          <div className="pol-kz-dugmeler">
            <button type="button" className="pol-sekme" onClick={kopyala}>JSON'u kopyalayın</button>
            <button type="button" className="pol-sekme" onClick={indir}>JSON dosyasını indirin</button>
          </div>
          <p role="status">{durum}</p>
        </section>
        </>}
      </PencereBaglami.Provider>
    </Modal>
  </>;
}

function KadroluGirdi({ plan, guncelle, proje }: { plan: KazancPlani; guncelle: Guncelle; proje: Marka }) {
  const k = plan.kadrolu;
  const paketli = proje === 'istoc';
  return <div className="pol-kz-adim-govde">
    <p>Kadrolu uzman SGK'lı çalışandır. Kadrolu uzman bu iş ortaklığı planının dışındadır.</p>
    <p>Net maaşı ayda {tl(MAAS_ARALIGI[0])} ile {tl(MAAS_ARALIGI[1])} arasındadır. Kadrolu uzman maaşa ek olarak prim alır.</p>
    <Grup baslik="Maaş ve kota">
      <Kutu label="Aylık net maaş" birim="(₺)" value={k.maas} kural="kadrolu.maas" onChange={(v) => guncelle((x) => { x.kadrolu.maas = v ?? 0; })} />
      <Kutu label="Maaş kotası oranı" value={k.kotaOrani} yuzdeMi kural="kadrolu.kotaOrani" onChange={(v) => guncelle((x) => { x.kadrolu.kotaOrani = v ?? 0; })} />
      {!paketli && <Kutu label="Kota üstü prim oranı" value={k.primOrani} yuzdeMi bosOlur kural="kadrolu.primOrani" onChange={(v) => guncelle((x) => { x.kadrolu.primOrani = v; })} />}
    </Grup>
    {/* Kullanıcı kararı 20 Kasım 2026 Cuma: iStoc kadrolu uzmanın kotaları aylık paket sayısıdır. */}
    {paketli && <>
      <p>Kotalar, ayda sattığınız yıllık paket sayısıdır. Ulaştığınız kademenin oranı bütün satışa uygulanır.</p>
      <Grup baslik="Paket kademeleri">
        {k.paketEsik.map((e, i) => <Kutu key={`e${i}`} label={`K${i + 1} paket eşiği`} birim="(adet)" value={e} kural={`kadrolu.paketEsik.${i}`}
          onChange={(v) => guncelle((x) => { x.kadrolu.paketEsik[i] = Math.round(v ?? 0); })} />)}
        {k.paketOran.map((o, i) => <Kutu key={`o${i}`} label={`K${i + 1} prim oranı`} value={o} yuzdeMi kural={`kadrolu.paketOran.${i}`}
          onChange={(v) => guncelle((x) => { x.kadrolu.paketOran[i] = v ?? 0; })} />)}
        <Kutu label="Örnek aylık paket sayısı" birim="(adet)" value={k.ornekPaket} onChange={(v) => guncelle((x) => { x.kadrolu.ornekPaket = Math.round(v ?? 0); })} />
      </Grup>
    </>}
  </div>;
}

function KadroluSonuc({ plan, proje }: { plan: KazancPlani; proje: Marka }) {
  const k = plan.kadrolu;
  const { ayar } = usePersonaAyar(proje);
  if (proje !== 'istoc') return <section className="pol-kz-kart" aria-label="Kadrolu uzmanın kotası">
    <dl className="pol-kz-sonuc">
      <div><dt>Aylık maaş kotası</dt><dd className="pol-kz-buyuk" data-kazanc="kadrolu-kota">{tl(kadroluKota(plan))} ciro</dd></div>
      <div><dt>Prim oranı</dt><dd>{k.primOrani === null ? 'Henüz belirlenmedi' : yuzde(k.primOrani)}</dd></div>
    </dl>
    <p>Maaş kotası, net maaşın {yuzde(k.kotaOrani)} kadarı cirodur. Kotayı geçen ciro için prim hesaplanır.</p>
  </section>;
  const paketBedeli = Math.round(yillikFiyat({ ...ayar, marka: 'istoc' }));
  const p = paketPrimi({ esik: k.paketEsik, oran: k.paketOran }, k.ornekPaket, paketBedeli);
  return <section className="pol-kz-kart" aria-label="Kadrolu uzmanın kotası">
    <dl className="pol-kz-sonuc">
      <div><dt>Aylık maaş kotası</dt><dd data-kazanc="kadrolu-kota">{tl(kadroluKota(plan))}</dd></div>
      <div><dt>Bir yıllık paketin bedeli</dt><dd>{tl(paketBedeli)}</dd></div>
      <div><dt>Ulaşılan kademe</dt><dd data-kazanc="kadrolu-paket-seviye">{p.seviye ? `K${p.seviye} (${yuzde(p.oran)})` : 'Prim yok'}</dd></div>
      <div><dt>Örnek prim</dt><dd className="pol-kz-buyuk">{tl(p.prim)}</dd></div>
      <div><dt>Hesap</dt><dd data-kazanc="kadrolu-paket-prim">{p.seviye
        ? `${num(k.ornekPaket)} paket × ${tl(paketBedeli)} × ${yuzde(p.oran)} = ${tl(p.prim)}`
        : `${num(k.ornekPaket)} paket ile prim ${tl(0)}`}</dd></div>
    </dl>
    <p>Maaş kotası, net maaşın {yuzde(k.kotaOrani)} kadarıdır.</p>
    <p>{num(k.paketEsik[0] - 1)} paket ve altında prim yoktur. Paket sayısı her ay yeniden sayılır.</p>
  </section>;
}

const SEVIYE_ADI = ['Kota yok', 'K1', 'K2', 'K3'] as const;

/**
 * Büyük katkı anahtarı (kullanıcı kararı 17 Kasım 2026 Salı). İki seçenek iki yanda yazılıdır.
 * Anahtar açıkken “Satışı kapatırsanız”, kapalıyken “Yalnız tanıştırırsanız” seçilidir. Yazılara tıklamak da seçer.
 */
function KatkiAnahtari({ value, onChange }: { value: KatkiTuru; onChange: (v: KatkiTuru) => void }) {
  const kapatir = value === 'kapatir';
  return <div className="pol-kz-anahtar-kap"><div className="pol-kz-anahtar" data-deger={value}>
    <span className="pol-kz-anahtar-ad" data-secili={!kapatir ? '' : undefined} aria-hidden="true" onClick={() => onChange('tanistir')}>{KATKI_SEKMESI.tanistir}</span>
    <button type="button" role="switch" aria-checked={kapatir} aria-label={`Satıştaki katkınız: ${KATKI_SEKMESI[value]}. Satışı kapatmak için açın.`}
      className="pol-kz-anahtar-iz" onClick={() => onChange(kapatir ? 'tanistir' : 'kapatir')}>
      <span className="pol-kz-anahtar-top" aria-hidden="true" />
    </button>
    <span className="pol-kz-anahtar-ad" data-secili={kapatir ? '' : undefined} aria-hidden="true" onClick={() => onChange('kapatir')}>{KATKI_SEKMESI.kapatir}</span>
  </div></div>;
}

/** Seviyedeki yıldızlar. K1 bir, K2 iki, K3 üç yıldızdır. */
function Yildizlar({ sayi, toplam = 3 }: { sayi: number; toplam?: number }) {
  return <span className="pol-kz-yildizlar" aria-hidden="true">
    {Array.from({ length: toplam }, (_, i) => i < sayi ? <IconStarFilled key={i} size={18} /> : <IconStar key={i} size={18} stroke={1.75} />)}
  </span>;
}

/** Sonraki hedef kartı. Yer ayıran kopya, en uzun sayılarla çizilir ve görünmez. */
function HedefKarti({ etkin, seviye, kalan, hedefKazanc, fark, ilerleme }: { etkin: boolean; seviye: string; kalan: number; hedefKazanc: number; fark: number; ilerleme: number }) {
  const yuzdeDegeri = Math.round(ilerleme * 100);
  return <div className="pol-kz-gorev" data-sim={etkin ? 'hedef' : undefined}>
    <IconTarget aria-hidden="true" size={28} stroke={1.75} />
    <div>
      <p className="pol-kz-gorev-ad">Sonraki hedef: {seviye}</p>
      <p><strong>{seviye} kotasına {tl(kalan)} kaldı.</strong></p>
      <p>{seviye} eşiğinde aylık kazancınız {tl(hedefKazanc)} olur. Bu tutar şimdikinden {tl(fark)} fazladır.</p>
      <div className="pol-kz-gorev-iz" role="progressbar" aria-label={`${seviye} hedefine ilerleme`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={yuzdeDegeri}>
        <span style={{ '--ilerleme': String(ilerleme) } as CSSProperties} />
      </div>
      <p className="pol-kz-gorev-yuzde">Hedefin %{yuzdeDegeri} kadarı tamam.</p>
    </div>
  </div>;
}

/**
 * Kazanç oyunu (kullanıcı kararı 17 Kasım 2026 Salı). Satıcı adayını motive etmek için kurulmuştur.
 * Okur katkısını ve aylık cirosunu seçer. Panel seviyeyi, kazancı, sonraki hedefi ve açılan rozetleri gösterir.
 * Alttaki tablo her seviyenin koşulunu söyler. Okurun cirosuna denk gelen satır vurgulanır.
 */
function KazancOyunu({ plan, guncelle }: { plan: KazancPlani; guncelle: Guncelle }) {
  const [tur, setTur] = useState<KatkiTuru>('kapatir');
  const ciro = plan.ornekCiro;
  const p = plan[tur];
  const doluEsikler = p.kotaEsik.map((e, i) => ({ e, i })).filter((x): x is { e: number; i: number } => x.e !== null);
  // Kaydırıcı en az 1.000.000 ₺'ye kadar gider. Kullanıcının örneği bu ciroyla verildi.
  const enCok = Math.max(1_000_000, Math.ceil(((doluEsikler.at(-1)?.e ?? 100_000) * 1.5) / 10_000) * 10_000, ciro);
  const setCiro = (v: number) => guncelle((x) => { x.ornekCiro = Math.max(0, Math.round(v)); });
  const { kota } = katkiOrani(plan, tur, ciro);
  return <section className="pol-kz-oyun" aria-labelledby="pol-kz-oyun-baslik">
    <div className="pol-kz-oyun-ust">
      <p className="pol-kz-oyun-etiket">Kazanç simülatörü</p>
      <h4 id="pol-kz-oyun-baslik">Cironuzu seçin. Seviyenizi ve kazancınızı görün.</h4>
    </div>

    <KatkiAnahtari value={tur} onChange={setTur} />

    <div className="pol-kz-ciro">
      <p className="pol-kz-ciro-ad">Aylık ciro</p>
      <p className="pol-kz-ciro-deger" aria-hidden="true">{tl(ciro)}</p>
      <input type="range" className="pol-kz-kaydirici" min={0} max={enCok} step={5000} value={Math.min(ciro, enCok)}
        aria-label="Aylık ciroyu kaydırarak seçin" aria-valuetext={tl(ciro)} onChange={(e) => setCiro(Number(e.currentTarget.value))} />
      {/* Kullanıcı kararı 17 Kasım 2026 Salı: seviye kutuları kaydırıcının altında kümelenir.
          Bir kutuya basınca ciro o seviyenin eşiğine gelir. Kota yok seviyesinin eşiği 0 ₺'dir. */}
      <div className="pol-kz-merdiven" role="group" aria-label="Kota seviyeleri. Seviyeye basınca ciro o eşiğe gelir.">
        {SEVIYE_ADI.map((ad, i) => {
          const esik = i === 0 ? 0 : p.kotaEsik[i - 1];
          const ulasilir = i === 0 || p.kotaEsik.slice(0, i).every((e) => e !== null);
          const oran = Math.round((p.taban + p.kotaArtis.slice(0, i).reduce((t, x) => t + x, 0)) * 10_000) / 10_000;
          const durum = i < kota ? 'gecti' : i === kota ? 'simdi' : 'sonra';
          return <button key={ad} type="button" className="pol-kz-merdiven-dugme" data-durum={durum} aria-pressed={i === kota}
            disabled={esik === null || !ulasilir} onClick={() => esik !== null && setCiro(esik)}
            aria-label={`${ad}: ${esik === null ? 'eşik belirlenmedi' : `aylık ciro ${tl(esik)} ve üstü`}, oran ${ulasilir ? yuzde(oran) : 'yok'}`}>
            <span className="pol-kz-merdiven-ikon" aria-hidden="true">{i <= kota ? (i === 0 ? <IconRocket size={22} stroke={1.75} /> : <IconStarFilled size={22} />) : <IconLock size={22} stroke={1.75} />}</span>
            <span className="pol-kz-merdiven-ad" aria-hidden="true">{ad}</span>
            <span className="pol-kz-merdiven-oran" aria-hidden="true">{ulasilir ? yuzde(oran) : 'Yok'}</span>
            <span className="pol-kz-merdiven-esik" aria-hidden="true">{esik === null ? 'Eşik yok' : tl(esik)}</span>
          </button>;
        })}
      </div>
      <Kutu label="Örnek aylık ciro" birim="(₺)" value={plan.ornekCiro} onChange={(v) => setCiro(v ?? 0)} />
    </div>

    {/* İki katkının paneli üst üste durur. Anahtar değişince alttaki içerik kaymaz. */}
    <Yigin etkin={tur === 'tanistir' ? 0 : 1}>{[<OyunGovdesi key="tanistir" plan={plan} tur="tanistir" />, <OyunGovdesi key="kapatir" plan={plan} tur="kapatir" />]}</Yigin>
  </section>;
}

function OyunGovdesi({ plan, tur }: { plan: KazancPlani; tur: KatkiTuru }) {
  const ciro = plan.ornekCiro;
  const p = plan[tur];
  const { oran, kota } = katkiOrani(plan, tur, ciro);
  const devam = kotaTamam(plan, tur, ciro);
  const esik = (i: number) => p.kotaEsik[i];
  const seviyeOrani = (i: number) => Math.round((p.taban + p.kotaArtis.slice(0, i).reduce((t, x) => t + x, 0)) * 10_000) / 10_000;
  const satirlar = SEVIYE_ADI.map((ad, i) => {
    const alt = i === 0 ? 0 : esik(i - 1);
    const ust = i < 3 ? esik(i) : null;
    const kosul = i === 0
      ? (esik(0) === null ? 'K1 eşiği belirlenmedi' : `Aylık ciro ${tl(esik(0)!)} altında`)
      : alt === null ? 'Eşik belirlenmedi'
      : ust === null ? `Aylık ciro ${tl(alt)} ve üstü` : `Aylık ciro ${tl(alt)} ile ${tl(ust)} arası`;
    const ulasilir = i === 0 || p.kotaEsik.slice(0, i).every((e) => e !== null);
    return { ad, i, kosul, oran: seviyeOrani(i), ulasilir, esikteKazanc: alt ? Math.round(alt * seviyeOrani(i)) : null };
  });
  const sonraki = kota < 3 ? esik(kota) : null;
  const kalan = sonraki === null ? null : Math.max(0, sonraki - ciro);
  const ilerleme = sonraki ? Math.min(1, ciro / sonraki) : 1;
  const buAy = Math.round(ciro * oran);
  // Kullanıcı kararı 20 Kasım 2026 Cuma: satışı kapatan en çok 12 ay, tanıştıran en çok 3 ay pay alır.
  const sure = tur === 'tanistir' ? ODEME_SURESI.tanistir : ODEME_SURESI.aylik;
  const yenileme = yenilemeKazanci(plan, ciro);
  const hedefKazanc = sonraki !== null ? Math.round(sonraki * seviyeOrani(kota + 1)) : null;
  const rozetler = [
    ...[0, 1, 2].map((i) => ({
      id: `k${i + 1}`, ad: `${SEVIYE_ADI[i + 1]} kotası`, acik: kota > i,
      acikMetin: esik(i) === null ? 'Eşik belirlenmedi.' : `Açıldı. Oranınıza ${yuzde(p.kotaArtis[i])} eklendi.`,
      kapaliMetin: esik(i) === null ? 'Kilitli. Eşik belirlenmedi.' : `Kilitli. Aylık ciro ${tl(esik(i)!)} olunca açılır.`,
    })),
    ...(tur === 'kapatir' ? [{ id: 'uzun', ad: 'Yenileme payı', acik: devam, acikMetin: `Açıldı. Yıllık paket yenilenirse ${YENILEME_DONEMI} pay alırsınız.`, kapaliMetin: 'Kilitli. K1 kotası tamamlanınca açılır.' }] : []),
  ];
  return <div className="pol-kz-oyun-govde" data-sim-tur={tur}>
    <div className="pol-kz-skor" data-seviye={kota}>
      <div>
        <p className="pol-kz-skor-ad">Bu ay kazancınız</p>
        <p className="pol-kz-skor-deger" data-sim="bu-ay">{tl(buAy)}</p>
        <p className="pol-kz-skor-not">{tl(ciro)} × {yuzde(oran)}</p>
      </div>
      <div className="pol-kz-rutbe" data-kpi="seviye">
        <IconTrophy aria-hidden="true" size={32} stroke={1.75} />
        <p className="pol-kz-rutbe-ad">Seviyeniz: {SEVIYE_ADI[kota]}</p>
        <Yildizlar sayi={kota} />
      </div>
    </div>


    {/* Hedef kartı bütün hâlleri kadar yer ayırır. Ciro ya da seviye değişince alttaki içerik kaymaz. */}
    <Yigin etkin={sonraki !== null && kalan !== null && hedefKazanc !== null ? 0 : kota === 3 ? 2 : 3}>{[
      <HedefKarti key="hedef" etkin={sonraki !== null} seviye={SEVIYE_ADI[Math.min(kota + 1, 3)]} kalan={kalan ?? 0} hedefKazanc={hedefKazanc ?? 0} fark={Math.max(0, (hedefKazanc ?? 0) - buAy)} ilerleme={ilerleme} />,
      <HedefKarti key="yer" etkin={false} seviye="K3" kalan={9_999_999} hedefKazanc={9_999_999} fark={9_999_999} ilerleme={1} />,
      <div key="ust" className="pol-kz-gorev" data-sim={kota === 3 ? 'hedef' : undefined} data-tamam="">
        <IconTrophy aria-hidden="true" size={28} stroke={1.75} />
        <div><p className="pol-kz-gorev-ad">En üst seviyedesiniz.</p><p>Bütün kota puanları oranınıza eklendi.</p></div>
      </div>,
      <p key="yok" className="pol-kz-not">Sonraki kota eşiği belirlenmedi. Bu yüzden hedef gösterilmez.</p>,
    ]}</Yigin>

    <div className="pol-kz-kpi">
      <div className="pol-kz-kpi-kutu" data-kpi="yil"><IconCalendarStats aria-hidden="true" size={24} stroke={1.75} /><p>{sure} ayda</p><p className="pol-kz-kpi-deger" data-sim="sure">{tl(buAy * sure)}</p></div>
      {tur === 'kapatir'
        ? <div className="pol-kz-kpi-kutu" data-kpi="yenileme"><IconChartLine aria-hidden="true" size={24} stroke={1.75} /><p>Yıllık yenilemede</p><p className="pol-kz-kpi-deger" data-sim="yenileme">{devam ? yuzde(yenileme.oran) : 'Pay yok'}</p></div>
        : <div className="pol-kz-kpi-kutu" data-kpi="yenileme"><IconChartLine aria-hidden="true" size={24} stroke={1.75} /><p>Pay süresi</p><p className="pol-kz-kpi-deger">En çok {sure} ay</p></div>}
      <div className="pol-kz-kpi-kutu" data-kpi="oran"><IconFlame aria-hidden="true" size={24} stroke={1.75} /><p>Oranınız</p><p className="pol-kz-kpi-deger">{yuzde(oran)}</p></div>
    </div>
    <p className="pol-kz-not">{KUMULATIF_KURALI} Toplam, her ay aynı ciroyu yaptığınızı varsayar.{tur === 'kapatir' ? ` ${KOTA_KURALI}` : ''}</p>

    <section className="pol-kz-rozetler" aria-labelledby={`pol-kz-rozet-baslik-${tur}`}>
      <h5 id={`pol-kz-rozet-baslik-${tur}`}>Rozetleriniz</h5>
      <ul>{rozetler.map((r) => <li key={r.id} data-acik={r.acik ? '' : undefined} data-sim={r.id === 'uzun' ? 'devam' : undefined}>
        <span className="pol-kz-rozet-ikon" aria-hidden="true">{r.acik ? <IconLockOpen size={24} stroke={1.75} /> : <IconLock size={24} stroke={1.75} />}</span>
        <span><span className="pol-kz-rozet-ad">{r.ad}</span>
          <Yigin etkin={r.acik ? 0 : 1}>{[<span key="a" className="pol-kz-rozet-metin">{r.acikMetin}</span>, <span key="k" className="pol-kz-rozet-metin">{r.kapaliMetin}</span>]}</Yigin></span>
      </li>)}</ul>
    </section>

    <p className="pol-kz-tablo-ad" id={`pol-kz-seviye-tablo-${tur}`}>Seviyelere göre kazanç tablosu</p>
    <div className="table-frame"><div className="table-scroll" role="region" aria-labelledby={`pol-kz-seviye-tablo-${tur}`} tabIndex={0}>
      <table role="table" className="data-table pol-kz-tablo pol-kz-sim-tablo" data-sim-tablo={tur}>
        <thead role="rowgroup"><tr role="row"><th role="columnheader" scope="col">Seviye</th><th role="columnheader" scope="col">Koşul</th><th role="columnheader" scope="col">Oran</th><th role="columnheader" scope="col">Eşikteki aylık kazanç</th><th role="columnheader" scope="col">{tur === 'kapatir' ? 'Yıllık yenilemede' : 'Pay süresi'}</th></tr></thead>
        <tbody role="rowgroup">{satirlar.map((r) => {
          const etkin = r.i === kota;
          return <tr role="row" key={r.ad} data-etkin={etkin ? '' : undefined} aria-current={etkin ? 'true' : undefined}>
            <th role="rowheader" scope="row">{r.ad}<span className="pol-kz-burasi" data-gizli={etkin ? undefined : ''} aria-hidden={etkin ? undefined : true}>Buradasınız</span></th>
            <td role="cell" data-ad="Koşul">{r.kosul}</td>
            <td role="cell" data-ad="Oran">{r.ulasilir ? yuzde(r.oran) : 'Yok'}</td>
            <td role="cell" data-ad="Eşikteki aylık kazanç">{etkin ? tl(buAy) : r.esikteKazanc !== null ? tl(r.esikteKazanc) : 'Yok'}<span className="pol-kz-hucre-not" data-gizli={etkin ? undefined : ''} aria-hidden={etkin ? undefined : true}>sizin cironuzla</span></td>
            {tur === 'kapatir'
              ? <td role="cell" data-ad="Yıllık yenilemede">{(r.i === 0 && esik(0) !== null) || !p.gecmis[0] ? 'Pay yok' : yuzde(p.gecmis[0])}</td>
              : <td role="cell" data-ad="Pay süresi">{`En çok ${sure} ay`}</td>}
          </tr>;
        })}</tbody>
      </table>
    </div></div>
    <p className="pol-kz-not">“Eşikteki aylık kazanç”, ciro tam eşik tutarında olursa alınan aylık paydır.</p>
  </div>;
}

/** Oran girişi. Katkı türü büyük anahtarla seçilir (kullanıcı kararı 17 Kasım 2026 Salı). Yalnız seçili türün alanları görünür. */
function OranGirisi({ plan, guncelle }: { plan: KazancPlani; guncelle: Guncelle }) {
  const [tur, setTur] = useState<KatkiTuru>('tanistir');
  return <div className="pol-kz-adim-govde">
    <KatkiAnahtari value={tur} onChange={setTur} />
    {/* İki katkının alanları üst üste durur. Anahtar değişince bölümün boyu değişmez. */}
    <Yigin etkin={tur === 'tanistir' ? 0 : 1}>{[
      <Katki key="tanistir" tur="tanistir" plan={plan} guncelle={guncelle} />,
      <Katki key="kapatir" tur="kapatir" plan={plan} guncelle={guncelle} />,
    ]}</Yigin>
  </div>;
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
  // Kullanıcı kararı 20 Kasım 2026 Cuma: mevcut müşteri nakit pay almaz, ücretsiz kullanım kazanır. Bu sekmede plan görünmez.
  if (rol === 'tavsiye') return null;
  // Kullanıcı kararı 17 Kasım 2026 Salı: önce kararlar, sonra oranlar, sonra sonuç. Kalıcı kurallar pencerededir.
  return <PlanBaglami.Provider value={{ plan, guncelle, proje }}><Section id="kazanc-plani" title="Kazanç planı" className="pol-kz-plan">
    <KaliciKurallarPenceresi plan={plan} proje={proje} />
    <div className="pol-kz-bolumler">
      {rol === 'kadrolu' ? <>
        <Bolum no={1} baslik="Maaş ve kota" aciklama="Değerleri değiştirebilirsiniz. Değerler yalnız bu tarayıcıda saklanır."><KadroluGirdi plan={plan} guncelle={guncelle} proje={proje} /></Bolum>
        <Bolum no={2} baslik="Sonuç" aciklama="Sonuç, 1. bölümdeki değerlere göre hesaplanır."><KadroluSonuc plan={plan} proje={proje} /></Bolum>
      </> : <>
        <p>Herkes iş ortağıdır. Kazancınızı rolünüz değil, satıştaki katkınız belirler. Kadrolu uzman bu planın dışındadır.</p>
        <section className="pol-kz-kart" aria-labelledby="pol-kz-odeme-kurallari">
          <h3 id="pol-kz-odeme-kurallari">Ödeme kuralları</h3>
          <ul className="pol-kz-yillar">{ODEME_KURALLARI.map((k) => <li key={k}>{k}</li>)}</ul>
        </section>
        <Bolum no={1} baslik="Kararlar" aciklama="Yönetici bu kararları verir. Seçenekler şirketin ödediği toplamı değiştirebilir."><Kararlar plan={plan} /></Bolum>
        <Bolum no={2} baslik="Oranlar" aciklama={'Önce anahtarla katkı türünü seçin. Sonra o katkının değerlerini doldurun. Oranlar ciro üzerinden yüzdedir. K1, K2 ve K3 aylık ciro kotalarıdır. ' + KUMULATIF_KURALI + ' ' + KOTA_KURALI}>
          <OranGirisi plan={plan} guncelle={guncelle} />
        </Bolum>
        <Bolum no={3} baslik="Sonuç" aciklama="Cironuzu seçin. Sonuçlar 1. ve 2. bölümdeki değerlere göre hemen değişir.">
          <KazancOyunu plan={plan} guncelle={guncelle} />
          <div className="pol-kz-kartlar">
            <KatkiSonucu tur="tanistir" plan={plan} />
            <KatkiSonucu tur="kapatir" plan={plan} />
          </div>
          <OrnekHesap plan={plan} />
          <PaySonucu plan={plan} />
        </Bolum>
      </>}
    </div>
    <button type="button" className="pol-sekme" onClick={() => yaz(proje, projeVarsayilani(proje))}>Planın ilk değerlerine dönün</button>
  </Section></PlanBaglami.Provider>;
}
