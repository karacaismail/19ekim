import { Accordion } from '@mantine/core';
import {
  IconAddressBook,
  IconAlertTriangle,
  IconBuildingStore,
  IconCalculator,
  IconCalendarDollar,
  IconCertificate,
  IconChartBar,
  IconChecklist,
  IconChevronDown,
  IconCircleCheck,
  IconCoin,
  IconFlag,
  IconInfoCircle,
  IconLayoutGrid,
  IconMessageDollar,
  IconPuzzle,
  IconRosetteDiscountCheck,
  IconShieldLock,
  IconShoppingBag,
  IconSpeakerphone,
  IconTag,
  IconTool,
  IconTruckDelivery,
  IconUmbrella,
  IconUser,
  IconUsersGroup,
  IconWorld,
} from '@tabler/icons-react';
import { AppFrame } from '../components/AppFrame';
import { useModel } from '../components/ModelContext';
import { PageHeader } from '../components/PageHeader';
import { paraBolunmez, Section } from '../components/ui';
import { useMotionMs } from '../lib/motion';
import {
  ARASTIRMA_NOTU,
  HAZIRLIK_ADI,
  HAZIRLIK_EYLEMI,
  HAZIRLIK_TANIMI,
  KARAR_ISI_ADI,
  KARAR_TARIHI,
  KISALTMALAR,
  MODELLER,
  ONCELIK_ADI,
  ONCELIK_NOTU,
  ONCELIK_ONERISI,
  eur,
  paketKararlari,
  paketler,
  type GelirModeli,
  type Hazirlik,
  type PaketKarari,
} from '../data/gelirModelleri';
import { href } from '../lib/paths';

/**
 * Gelir modelleri (kullanıcı kararı 3 Kasım 2026, yeniden düzen 13 Kasım 2026). Sayfa okurun sorularını sırayla cevaplar:
 *
 * 1. Kısa özet: istoc.com bugün nasıl gelir elde ediyor, bugün ne satılabilir, ne satılamaz?
 * 2. Bugünkü model: abonelik paketleri.
 * 3. Önce denenecek üç model.
 * 4. Bütün modeller hazırlık durumuna göre üç grupta. Her grup okura ne yapacağını söyler.
 * 5. Araştırma notu ve kısaltmalar.
 *
 * Kart kısa başlar: ad, hazırlık etiketi, nasıl çalıştığı ve örnek hesap. Kim öder, risk ve gerekenler açılan panelde
 * durur. Kart tıklanmaz, bu yüzden üzerine gelince zemini değişmez. Kartlar kenarlıksızdır, yüzey tonu ve boşlukla ayrılır.
 */

const DURUMLAR: Hazirlik[] = ['hazir', 'yakinda', 'hazir-degil'];

/** Özetin ikinci maddesi: bugün satılabilen ek hizmetler. Ad listesi cümle içinde uzatılmaz. */
function hazirOzeti(hazirlar: GelirModeli[]) {
  if (!hazirlar.length) return 'Bugün satılabilen ek hizmet yoktur.';
  if (hazirlar.length === 1) return `${hazirlar[0].ad} bugün satılabilir. ${ilkCumle(hazirlar[0].nasil)}`;
  return `${hazirlar.length} ek hizmet bugün satılabilir. Hizmetler “Hazır” grubundadır.`;
}
/** Açıklamanın ilk cümlesi: özet maddesinde hizmetin ne olduğunu tek cümleyle söyler. Geriye bakış kullanılmaz. */
const ilkCumle = (metin: string) => metin.match(/^.*?\.(?=\s|$)/)?.[0] ?? metin;

/** Her modelin simgesi. Simge yalnız süstür (aria-hidden). Yeni model eklenirse madeni para simgesi görünür. */
const SIMGE: Record<string, typeof IconCoin> = {
  'guvenli-odeme': IconShieldLock,
  'vadeli-satis': IconCalendarDollar,
  'sponsorlu-urun': IconSpeakerphone,
  'kategori-vitrini': IconLayoutGrid,
  'marka-sahibi': IconCertificate,
  'marka-vitrini': IconBuildingStore,
  'dogrulanmis-tedarikci': IconRosetteDiscountCheck,
  rfq: IconMessageDollar,
  eklentiler: IconPuzzle,
  'kurulum-egitim': IconTool,
  'crm-eki': IconAddressBook,
  lojistik: IconTruckDelivery,
  'veri-raporlari': IconChartBar,
  'eslestirme-etkinlikleri': IconUsersGroup,
  'beyaz-etiket': IconTag,
  'alici-paketi': IconShoppingBag,
  'alacak-sigortasi': IconUmbrella,
  ihracat: IconWorld,
};

/** Hazırlık ölçeği: üç çizgiden kaçı dolu? Hazır 3, Yakında 2, Hazır değil 1. Durum yazıyla da söylenir. */
const HAZIRLIK_DOLU: Record<Hazirlik, number> = { hazir: 3, yakinda: 2, 'hazir-degil': 1 };

/** Hazırlık etiketi: üç çizgili küçük ölçek ve durum adı. Ölçek süstür, anlamı yazı taşır. */
function HazirlikEtiketi({ h }: { h: Hazirlik }) {
  return (
    <span className="gm-hazirlik" data-durum={h}>
      <span className="gm-olcek" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span key={i} data-dolu={i < HAZIRLIK_DOLU[h] ? '' : undefined} />
        ))}
      </span>
      {HAZIRLIK_ADI[h]}
    </span>
  );
}

/** Tutar ve yüzde kalın yazılır. Okur örnek hesaptaki sayıları hemen görür. Metin değişmez. */
const SAYI = /(\d[\d.,]*\u00a0(?:€|₺|₺)|%\d[\d.,]*)/u;
function SayiVurgulu({ metin }: { metin: string }) {
  return (
    <>
      {paraBolunmez(metin)
        .split(SAYI)
        .map((p, i) =>
          i % 2 ? (
            <strong key={i} className="gm-sayi">
              {p}
            </strong>
          ) : (
            p
          ),
        )}
    </>
  );
}

/** İlk fiyat: önce dönem (“Ayda”), sonra büyük tutar (“50 €”). Okunan metin aynı kalır: “Ayda 50 €”. */
function IlkFiyat({ metin }: { metin: string }) {
  const parca = metin.match(/^(.*?)\s*(\d[\d.,]*\s?€)$/);
  return (
    <dl className="gm-fiyat">
      <dt>
        <IconTag className="gm-fiyat-simge" size={16} stroke={2} aria-hidden="true" />
        İlk fiyat
      </dt>
      <dd>
        {parca ? (
          <>
            {parca[1] ? <span className="gm-fiyat-donem">{parca[1]} </span> : null}
            <span className="gm-fiyat-tutar">{paraBolunmez(parca[2])}</span>
          </>
        ) : (
          metin
        )}
      </dd>
    </dl>
  );
}

/** Açılan paneldeki dört bilgi. Her bilginin kendi simgesi vardır. Risk ayrı tonda durur. */
const BILGILER: { tur: string; ad: string; Simge: typeof IconCoin; deger: (m: GelirModeli) => string }[] = [
  { tur: 'kim', ad: 'Kim öder?', Simge: IconUser, deger: (m) => m.kimOder },
  { tur: 'uygunluk', ad: 'istoc.com’a uyar mı?', Simge: IconCircleCheck, deger: (m) => m.uygunluk },
  { tur: 'risk', ad: 'Risk', Simge: IconAlertTriangle, deger: (m) => m.risk },
  { tur: 'gereken', ad: 'Başlamak için ne gerekir?', Simge: IconChecklist, deger: (m) => m.gereken },
];

function Ayrintilar({ m }: { m: GelirModeli }) {
  const sure = useMotionMs('--motion-duration-base');
  return (
    <Accordion
      transitionDuration={sure}
      keepMountedMode="display-none"
      chevronSize={32}
      chevron={<IconChevronDown size={16} stroke={2} aria-hidden="true" />}
      classNames={{ root: 'gm-ayrinti', item: 'gm-ayrinti-oge', control: 'gm-ac', chevron: 'gm-ok', label: 'gm-ac-etiket', content: 'gm-panel' }}
    >
      <Accordion.Item value="ayrinti">
        {/* Her kartta aynı düğme vardır. Ekran okuyucu adı modeli de söyler, görünen yazı adın başında kalır. */}
        <Accordion.Control aria-label={`Kimin ödediğini ve riskleri görün: ${m.ad}`}>Kimin ödediğini ve riskleri görün</Accordion.Control>
        <Accordion.Panel {...({ transitionTimingFunction: 'var(--motion-ease-standard)' } as object)}>
          <dl className="gm-bilgi">
            {BILGILER.map(({ tur, ad, Simge, deger }) => (
              <div key={tur} className="gm-bilgi-oge" data-tur={tur}>
                <dt>
                  <span className="gm-bilgi-simge" aria-hidden="true">
                    <Simge size={16} stroke={2} />
                  </span>
                  {ad}
                </dt>
                <dd>{deger(m)}</dd>
              </div>
            ))}
          </dl>
        </Accordion.Panel>
      </Accordion.Item>
    </Accordion>
  );
}

/**
 * Model kartı. Üstte simge, ad, hazırlık ölçeği ve öncelik durur. Altında nasıl çalıştığı, ilk fiyat ve örnek hesap
 * gelir. En altta “Kimin ödediğini ve riskleri görün” düğmesi vardır. Kartın üst çizgisi hazırlık rengindedir (düz
 * çizgi, kenar sistemi). Geniş kartta örnek hesap sağ sütundadır. Okuma sırası değişmez.
 */
function ModelKarti({ m }: { m: GelirModeli }) {
  const Simge = SIMGE[m.id] ?? IconCoin;
  return (
    <li className="gm-model" id={`model-${m.id}`} data-durum={m.hazirlik} data-edge="top">
      <div className="gm-model-ust">
        <span className="gm-simge" aria-hidden="true">
          <Simge size={26} stroke={1.75} />
        </span>
        <div className="gm-model-baslik">
          <h4 className="gm-model-ad">{m.ad}</h4>
          <p className="gm-model-etiketler">
            <HazirlikEtiketi h={m.hazirlik} />
            <span className="gm-oncelik" data-oncelik={m.oncelik}>
              <IconFlag size={16} stroke={2} aria-hidden="true" />
              {ONCELIK_ADI[m.oncelik]}
            </span>
          </p>
        </div>
      </div>
      <p className="gm-nasil">{m.nasil}</p>
      {m.fiyat ? <IlkFiyat metin={m.fiyat} /> : null}
      <div className="gm-ornek">
        <p className="gm-ornek-ad">
          <IconCalculator size={18} stroke={2} aria-hidden="true" />
          Örnek hesap
        </p>
        {/* Uyarı sayıdan önce okunur. */}
        <p className="gm-ornek-not">
          <IconInfoCircle size={16} stroke={2} aria-hidden="true" />
          Bu hesap bir varsayımdır, söz değildir.
        </p>
        <p className="gm-ornek-metin">
          <SayiVurgulu metin={m.ornek} />
        </p>
      </div>
      <Ayrintilar m={m} />
    </li>
  );
}

/** Paket kararı: ad, kimin uygulayacağı, açıklama ve gerekiyorsa sınırlar. Karar bugünkü paket kartlarından ayrı durur. */
function Karar({ k }: { k: PaketKarari }) {
  return (
    <li className="gm-karar" id={`karar-${k.id}`}>
      <div className="gm-karar-ust">
        <h4 className="gm-karar-ad">{k.ad}</h4>
        <span className="gm-karar-durum" data-is={k.is}>
          {KARAR_ISI_ADI[k.is]}
        </span>
      </div>
      {k.metin.map((t) => (
        <p key={t} className="gm-karar-metin">
          {t}
        </p>
      ))}
      {k.sinirlar ? (
        <dl className="gm-sinirlar" aria-label={`${k.ad}: sınırlar`}>
          {k.sinirlar.map((s) => (
            <div key={s.ad}>
              <dt>{s.ad}</dt>
              <dd>{s.deger}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {k.bag ? (
        <a className="gm-ozet-bag" href={k.bag.yol.startsWith('#') ? k.bag.yol : href(k.bag.yol)}>
          {k.bag.metin}
        </a>
      ) : null}
    </li>
  );
}

function Icerik() {
  const { params } = useModel();
  const grup = (h: Hazirlik) => MODELLER.filter((m) => m.hazirlik === h);
  const hazirlar = grup('hazir');
  const satilamaz = MODELLER.length - hazirlar.length;
  const adOf = (id: string) => MODELLER.find((m) => m.id === id)!;

  return (
    <>
      <PageHeader title="Gelir modelleri" purpose="istoc.com’un bugün nasıl gelir elde ettiğini ve esnafa bugün neyi sunabileceğinizi gösterir." />
      <div className="gm">
        <p className="gm-giris">
          istoc.com, İstoç çarşısı esnafı için bir toptan pazar yeridir. Burada işletmeler işletmelere satış yapar. Buna B2B (işletmeden işletmeye) satış denir.
        </p>

        <Section id="kisa-ozet" title="Kısa özet" desc="Bu bölüm bugün neyin satıldığını ve neyin satılamadığını gösterir.">
          <ol className="gm-ozet">
            <li className="gm-ozet-oge" data-durum="hazir">
              <h3 className="gm-ozet-baslik">Bugün yalnız abonelik satılıyor</h3>
              <p>Satıcı üç paketten birini seçer. Bu, istoc.com’un bugünkü tek geliridir.</p>
              <a className="gm-ozet-bag" href="#bugunku-model">
                Paketleri görün
              </a>
            </li>
            <li className="gm-ozet-oge" data-durum="hazir">
              <h3 className="gm-ozet-baslik">Bugün {hazirlar.length} ek hizmet satılabilir</h3>
              <p>{hazirOzeti(hazirlar)}</p>
              {hazirlar.length ? (
                <a className="gm-ozet-bag" href="#grup-hazir">
                  {hazirlar.length === 1 ? 'Hazır hizmeti görün' : 'Hazır hizmetleri görün'}
                </a>
              ) : null}
            </li>
            <li className="gm-ozet-oge" data-durum="hazir-degil">
              <h3 className="gm-ozet-baslik">{satilamaz} model bugün satılamaz</h3>
              <p>
                {grup('yakinda').length} model yakında gelebilir. {grup('hazir-degil').length} model hazır değildir. Bunlar için esnafa söz vermeyin.
              </p>
              <p className="gm-ozet-baglar">
                <a className="gm-ozet-bag" href="#grup-yakinda">
                  Yakında gelecek modelleri görün
                </a>
                <a className="gm-ozet-bag" href="#grup-hazir-degil">
                  Hazır olmayan modelleri görün
                </a>
              </p>
            </li>
          </ol>
        </Section>

        <Section id="bugunku-model" title="Bugünkü model: abonelik" desc={`Satıcı üç paketten birini seçer. Yıllık pakette ${params.annualMonths} ayın ücreti ödenir.`}>
          <ul className="gm-paketler">
            {paketler(params).map((p) => (
              <li key={p.id} className="gm-paket" data-paket={p.id}>
                <p className="gm-paket-ad">{p.ad}</p>
                <p className="gm-paket-tutar">
                  <span className="gm-paket-fiyat">{p.aylikEur === null ? 'Teklif' : eur(p.aylikEur)}</span>
                  {p.aylikEur === null ? null : <span className="gm-paket-birim">aylık</span>}
                </p>
                {p.yillikEur === null ? null : <p className="gm-paket-yillik">Yıllık {eur(p.yillikEur)}</p>}
                <p className="gm-paket-not">{p.not}</p>
              </li>
            ))}
          </ul>
          <div className="gm-kararlar">
            <h3 className="gm-kararlar-baslik">Paketler için alınan kararlar</h3>
            <p className="gm-kararlar-giris">
              Bu kararlar {KARAR_TARIHI} günü alındı. istoc.com’daki paketler henüz değişmedi.
            </p>
            <ul className="gm-karar-liste">
              {paketKararlari(params).map((k) => (
                <Karar key={k.id} k={k} />
              ))}
            </ul>
          </div>
        </Section>

        <Section id="oncelik-onerisi" title="Önce denenecek üç model" desc="Bu üç model en az hazırlığı ister. Sıra en kolay olandan başlar.">
          <ol className="gm-oncelik-liste">
            {ONCELIK_ONERISI.map((o, i) => {
              const m = adOf(o.id);
              return (
                <li key={o.id} className="gm-oncelik-oge">
                  <span className="gm-oncelik-no" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="gm-oncelik-govde">
                    <p className="gm-oncelik-ad">
                      <a href={`#model-${o.id}`}>{m.ad}</a>
                      <span className="gm-hazirlik" data-durum={m.hazirlik}>
                        {HAZIRLIK_ADI[m.hazirlik]}
                      </span>
                    </p>
                    <p className="gm-oncelik-neden">{o.neden}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="gm-not">{ONCELIK_NOTU}</p>
        </Section>

        <Section
          id="aday-modeller"
          title="Bütün gelir modelleri"
          desc={`${MODELLER.length} model hazırlık durumuna göre üç gruba ayrıldı. Her kart modelin nasıl çalıştığını ve bir örnek hesabı gösterir.`}
          tools={
            <div className="gm-araclar">
              <p className="gm-not">Örnek hesaplar yöntemi gösterir. Bunlar gelir sözü ya da hedef değildir.</p>
              <p className="gm-not">İlk fiyatlar {KARAR_TARIHI} günü onaylandı. Bu fiyatlar esnafla denenmedi.</p>
              <nav className="gm-gruplar" aria-label="Hazırlık grupları">
                <ul>
                  {DURUMLAR.map((h) => (
                    <li key={h}>
                      <a href={`#grup-${h}`} data-durum={h}>
                        {HAZIRLIK_ADI[h]} ({grup(h).length})
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
          }
        >
          {DURUMLAR.map((h) => (
            <section key={h} className="gm-grup" id={`grup-${h}`} data-durum={h} aria-labelledby={`grup-${h}-baslik`}>
              <div className="gm-grup-ust">
                <h3 className="gm-grup-baslik" id={`grup-${h}-baslik`}>
                  {HAZIRLIK_ADI[h]} ({grup(h).length})
                </h3>
                <p className="gm-grup-tanim">{HAZIRLIK_TANIMI[h]}</p>
                <p className="gm-grup-eylem">{HAZIRLIK_EYLEMI[h]}</p>
              </div>
              <ol className="gm-modeller">
                {grup(h).map((m) => (
                  <ModelKarti key={m.id} m={m} />
                ))}
              </ol>
            </section>
          ))}
        </Section>

        <Section id="arastirma-notu" title="Araştırma notu" desc="Bu bölüm başka pazar yerlerinin nasıl para kazandığını özetler.">
          <div className="gm-arastirma">
            {ARASTIRMA_NOTU.map((t) => (
              <p key={t}>{t}</p>
            ))}
          </div>
        </Section>

        <Section id="kisaltmalar" title="Kısaltmalar" desc="Bu bölüm sayfada geçen kısaltmaların açık adını verir.">
          <dl className="gm-kisaltmalar">
            {KISALTMALAR.map((k) => (
              <div key={k.kisa}>
                <dt>{k.kisa}</dt>
                <dd>{k.acik}</dd>
              </div>
            ))}
          </dl>
        </Section>
      </div>
    </>
  );
}

export function GelirModelleriPage({ pathname }: { pathname: string }) {
  return (
    <AppFrame pathname={pathname}>
      <Icerik />
    </AppFrame>
  );
}
